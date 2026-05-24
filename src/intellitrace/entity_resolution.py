"""
IntelliTrace Probabilistic Entity Resolution and Identity Fusion Engine.

Employs blocking for high-efficiency candidate generation and a compounded
probabilistic match matrix to resolve disparate identities across banking silos,
injecting fusion edges into both in-memory NetworkX graphs and live Neo4j databases.
"""

import json
import logging
from typing import Dict, List, Tuple, Any, Optional
import networkx as nx

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("IntelliTrace.EntityResolution")


class EntityResolutionEngine:
    """
    Two-stage identity-linking engine executing candidate generation via multi-attribute
    blocking, followed by a compounded probabilistic fusion scoring network.
    """

    def __init__(self, neo4j_driver: Optional[Any] = None):
        """
        Initializes the engine with an in-memory NetworkX Graph and an optional Neo4j Driver.
        """
        self.networkx_graph = nx.Graph()
        self.neo4j_driver = neo4j_driver
        
        # Base weight multipliers for multi-attribute linking
        self.weights = {
            "pan_match": 0.95,
            "account_suffix_match": 0.95,
            "aadhaar_match": 0.90,
            "vpa_mobile_match": 0.86,  # Midpoint of 0.85 to 0.88
            "device_fingerprint_match": 0.80,
            "email_match": 0.75,
            "behavioral_similarity": 0.70,
            "beneficiary_overlap": 0.85,
            "ip_subnet_overlap": 0.55
        }

    def generate_candidate_pairs(self, customers: List[Dict[str, Any]], blocking_key: str = "declared_occupation") -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """
        Generates candidate customer pairs using blocking to reduce comparisons from O(N^2) to O(N).
        Groups customers by a coarse attribute (the blocking key) and only pairs within the same group.
        """
        blocks: Dict[Any, List[Dict[str, Any]]] = {}
        for c in customers:
            key_val = c.get(blocking_key)
            if key_val is not None:
                blocks.setdefault(key_val, []).append(c)

        candidates: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
        for block_val, block_customers in blocks.items():
            n = len(block_customers)
            if n < 2:
                continue
            for i in range(n):
                for j in range(i + 1, n):
                    candidates.append((block_customers[i], block_customers[j]))

        logger.info(f"Blocking on '{blocking_key}' generated {len(candidates)} candidate pairs from {len(customers)} customers.")
        return candidates

    def compare_attributes(self, c1: Dict[str, Any], c2: Dict[str, Any]) -> Dict[str, bool]:
        """
        Compares attributes between two customer records to build the boolean matching matrix.
        """
        signals = {}

        # 1. PAN Number Match (exact check)
        pan1 = c1.get("pan")
        pan2 = c2.get("pan")
        signals["pan_match"] = (
            pan1 is not None and pan2 is not None and 
            str(pan1).strip().upper() == str(pan2).strip().upper()
        )

        # 2. Account Number Suffix Match (checks if any accounts share last 4 digits)
        c1_accts = c1.get("accounts", [])
        c2_accts = c2.get("accounts", [])
        suffix_match = False
        for a1 in c1_accts:
            for a2 in c2_accts:
                if len(a1) >= 4 and len(a2) >= 4 and a1[-4:] == a2[-4:]:
                    suffix_match = True
                    break
            if suffix_match:
                break
        signals["account_suffix_match"] = suffix_match

        # 3. Masked Aadhaar Verification (exact check)
        aadhaar1 = c1.get("aadhaar")
        aadhaar2 = c2.get("aadhaar")
        signals["aadhaar_match"] = (
            aadhaar1 is not None and aadhaar2 is not None and 
            str(aadhaar1) == str(aadhaar2)
        )

        # 4. VPA (UPI handle) or Mobile Number Alignment
        vpa1 = c1.get("vpa")
        vpa2 = c2.get("vpa")
        vpa_match = (
            vpa1 is not None and vpa2 is not None and 
            str(vpa1).strip().lower() == str(vpa2).strip().lower()
        )
        mobile1 = c1.get("mobile")
        mobile2 = c2.get("mobile")
        mobile_match = (
            mobile1 is not None and mobile2 is not None and 
            str(mobile1) == str(mobile2)
        )
        signals["vpa_mobile_match"] = vpa_match or mobile_match

        # 5. Device Fingerprint Overlap
        c1_devs = set(c1.get("devices", []))
        c2_devs = set(c2.get("devices", []))
        signals["device_fingerprint_match"] = len(c1_devs.intersection(c2_devs)) > 0

        # 6. Email Address Match
        email1 = c1.get("email")
        email2 = c2.get("email")
        signals["email_match"] = (
            email1 is not None and email2 is not None and 
            str(email1).strip().lower() == str(email2).strip().lower()
        )

        # 7. IFSC + Transaction Behavioral Similarity
        hash1 = c1.get("behavioral_profile_hash")
        hash2 = c2.get("behavioral_profile_hash")
        signals["behavioral_similarity"] = (
            hash1 is not None and hash2 is not None and 
            str(hash1) == str(hash2)
        )

        # 8. Beneficiary Overlap Density
        c1_ben = set(c1.get("beneficiaries", []))
        c2_ben = set(c2.get("beneficiaries", []))
        signals["beneficiary_overlap"] = len(c1_ben.intersection(c2_ben)) > 0

        # 9. IP Address Subnet Overlap (compares first 3 octets of IP addresses)
        c1_ips = c1.get("ips", [])
        c2_ips = c2.get("ips", [])
        ip_overlap = False
        for ip1 in c1_ips:
            for ip2 in c2_ips:
                parts1 = str(ip1).split(".")
                parts2 = str(ip2).split(".")
                if len(parts1) >= 3 and len(parts2) >= 3 and parts1[:3] == parts2[:3]:
                    ip_overlap = True
                    break
            if ip_overlap:
                break
        signals["ip_subnet_overlap"] = ip_overlap

        return signals

    def evaluate_and_fuse_entities(self, candidate_pair: Dict[str, Any]) -> float:
        """
        Computes the joint probabilistic match score based on attribute overlaps.
        Formula uses compounded independent probabilities: P(Match) = 1 - PRODUCT(1 - w_i * match_i)
        """
        c1 = candidate_pair.get("customer_1")
        c2 = candidate_pair.get("customer_2")

        if not c1 or not c2:
            raise ValueError("Candidate pair must contain both 'customer_1' and 'customer_2' dictionaries.")

        # If matching signals are pre-computed in the dictionary, use them; otherwise, compare dynamically
        signals = {}
        for signal_name in self.weights.keys():
            if signal_name in candidate_pair:
                signals[signal_name] = bool(candidate_pair[signal_name])
        
        if not signals:
            signals = self.compare_attributes(c1, c2)

        # Compounding independent match probabilities
        non_match_probability = 1.0
        for signal_name, weight in self.weights.items():
            if signals.get(signal_name, False):
                non_match_probability *= (1.0 - weight)

        match_score = 1.0 - non_match_probability
        return round(match_score, 4)

    def update_neo4j_graph(self, c1_id: str, c2_id: str, score: float, status: str, link_type: str) -> None:
        """
        Executes a Cypher transaction to record the resolved :LINKED_TO relationship in Neo4j.
        """
        if not self.neo4j_driver:
            return

        cypher = """
        MATCH (c1:Customer {customer_id: $c1_id})
        MATCH (c2:Customer {customer_id: $c2_id})
        MERGE (c1)-[r:LINKED_TO]->(c2)
        SET r.link_confidence = $score,
            r.link_type = $link_type,
            r.status = $status,
            r.updated_at = datetime()
        """
        try:
            with self.neo4j_driver.session() as session:
                session.run(cypher, c1_id=c1_id, c2_id=c2_id, score=score, link_type=link_type, status=status)
        except Exception as e:
            logger.error(f"Failed to update Neo4j graph for {c1_id} <-> {c2_id}: {e}")

    def run_resolution_pipeline(self, customers: List[Dict[str, Any]], blocking_key: str = "declared_occupation") -> Dict[str, Any]:
        """
        Orchestrates the entire entity resolution pipeline:
        1. Ingests all customers as nodes in NetworkX Graph.
        2. Performs blocking candidate generation.
        3. Scores candidates using compounded independent probabilities.
        4. Fuses confident matches (Score > 0.85) and routes probable matches (0.65 <= Score <= 0.85) to review.
        """
        # Ensure all customers exist in local memory graph
        for c in customers:
            c_id = c["customer_id"]
            self.networkx_graph.add_node(c_id, **c)

        candidates = self.generate_candidate_pairs(customers, blocking_key)
        
        fused_links = []
        probable_links = []

        for c1, c2 in candidates:
            c1_id = c1["customer_id"]
            c2_id = c2["customer_id"]
            
            pair = {"customer_1": c1, "customer_2": c2}
            score = self.evaluate_and_fuse_entities(pair)

            if score > 0.85:
                # Direct fusion in memory
                self.networkx_graph.add_edge(
                    c1_id, c2_id,
                    link_confidence=score,
                    link_type="CONFIRMED_IDENTITY_LINK",
                    status="FUSED"
                )
                fused_links.append({
                    "customer_1_id": c1_id,
                    "customer_2_id": c2_id,
                    "score": score,
                    "link_type": "CONFIRMED_IDENTITY_LINK"
                })
                # Direct fusion in database
                self.update_neo4j_graph(c1_id, c2_id, score, "FUSED", "CONFIRMED_IDENTITY_LINK")
                logger.info(f"IDENTITY FUSED: {c1_id} <-> {c2_id} with score {score}")

            elif 0.65 <= score <= 0.85:
                # Add relationship but flag as review state in memory
                self.networkx_graph.add_edge(
                    c1_id, c2_id,
                    link_confidence=score,
                    link_type="PROBABLE_IDENTITY_LINK",
                    status="REVIEW_STATE"
                )
                probable_links.append({
                    "customer_1_id": c1_id,
                    "customer_2_id": c2_id,
                    "score": score,
                    "link_type": "PROBABLE_IDENTITY_LINK"
                })
                # Record in database for human auditing
                self.update_neo4j_graph(c1_id, c2_id, score, "REVIEW_STATE", "PROBABLE_IDENTITY_LINK")
                logger.info(f"PROBABLE LINK (investigation routed): {c1_id} <-> {c2_id} with score {score}")

        return {
            "total_candidates_evaluated": len(candidates),
            "fused_identities_count": len(fused_links),
            "fused_links": fused_links,
            "probable_links_count": len(probable_links),
            "probable_links": probable_links
        }
