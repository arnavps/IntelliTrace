"""
Unit and integration tests for the Probabilistic Entity Resolution Engine.
Validates blocking mechanisms, probabilistic fusion math, local NetworkX graphs,
routing review thresholds, and mock Neo4j driver interactions.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock
import networkx as nx

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace.entity_resolution import EntityResolutionEngine


class TestEntityResolutionEngine(unittest.TestCase):
    """
    Comprehensive test suite for graph-based identity resolution.
    """

    def setUp(self):
        # Initialize engine with a mock Neo4j driver to test database calls
        self.mock_driver = MagicMock()
        self.engine = EntityResolutionEngine(neo4j_driver=self.mock_driver)

        # Build dummy customer data for testing
        self.customers = [
            {
                "customer_id": "C_ARNAV",
                "customer_name": "Arnav Shirwadkar",
                "declared_occupation": "AI Scientist",
                "kyc_tier": "TIER_1",
                "pan": "ABCDE1234F",
                "accounts": ["ACCT_1111", "ACCT_2222"],
                "aadhaar": "1234-5678-9012",
                "vpa": "arnav@upi",
                "mobile": "+919999999999",
                "devices": ["DEV_MOCK_IPHONE"],
                "email": "arnav@mit.edu",
                "behavioral_profile_hash": "BEH_HASH_ALPHA",
                "beneficiaries": ["BENE_1", "BENE_2"],
                "ips": ["192.168.1.50"]
            },
            {
                "customer_id": "C_ARNAV_ALT",
                "customer_name": "A Shirwadkar",
                "declared_occupation": "AI Scientist",
                "kyc_tier": "TIER_1",
                "pan": "ABCDE1234F",  # PAN match! (0.95)
                "accounts": ["ACCT_3333"],
                "aadhaar": "1234-5678-9012",  # Aadhaar match! (0.90)
                "vpa": "arnav.alt@upi",
                "mobile": "+918888888888",
                "devices": ["DEV_MOCK_ANDROID"],
                "email": "arnav_alt@gmail.com",
                "behavioral_profile_hash": "BEH_HASH_BETA",
                "beneficiaries": ["BENE_3"],
                "ips": ["10.0.0.1"]
            },
            {
                "customer_id": "C_BOB",
                "customer_name": "Bob Jenkins",
                "declared_occupation": "Chef",
                "kyc_tier": "TIER_2",
                "pan": "XYZ123456A",
                "accounts": ["ACCT_9999"],
                "aadhaar": None,
                "vpa": "bob@upi",
                "mobile": "+917777777777",
                "devices": ["DEV_MOCK_IPAD"],
                "email": "bob@gmail.com",
                "behavioral_profile_hash": "BEH_HASH_GAMMA",
                "beneficiaries": ["BENE_5"],
                "ips": ["192.168.10.5"]
            },
            {
                "customer_id": "C_ARNAV_SOFT",
                "customer_name": "Arnav",
                "declared_occupation": "AI Scientist",
                "kyc_tier": "TIER_1",
                "pan": "MISM_PAN_1",
                "accounts": ["ACCT_4444_1111"],  # Suffix ACCT_1111 overlap! (0.95)
                "aadhaar": None,
                "vpa": "arnav@upi",  # VPA alignment! (0.86)
                "mobile": "+916666666666",
                "devices": ["DEV_MOCK_IPHONE"],  # Device Fingerprint Match! (0.80)
                "email": "arnav@mit.edu",  # Email match! (0.75)
                "behavioral_profile_hash": "BEH_HASH_ALPHA",  # Behavioral match! (0.70)
                "beneficiaries": ["BENE_1"],  # Beneficiary overlap! (0.85)
                "ips": ["192.168.1.100"]  # IP subnet overlap! (0.55)
            }
        ]

    def test_candidate_blocking_generation(self):
        """Verify that customer blocking reduces O(N^2) checks to occupation candidate pairs."""
        candidates = self.engine.generate_candidate_pairs(self.customers, blocking_key="declared_occupation")
        
        # Only customers with occupation "AI Scientist" should be matched
        # Excludes C_BOB (Chef)
        self.assertEqual(len(candidates), 3)  # Combinations of 3 AI Scientists (C(3,2) = 3)
        for c1, c2 in candidates:
            self.assertEqual(c1["declared_occupation"], "AI Scientist")
            self.assertEqual(c2["declared_occupation"], "AI Scientist")
            self.assertNotEqual(c1["customer_id"], "C_BOB")
            self.assertNotEqual(c2["customer_id"], "C_BOB")

    def test_dynamic_attribute_matching_matrix(self):
        """Verify attribute matching comparator reports accurate boolean signal overrides."""
        c1 = self.customers[0]
        c2 = self.customers[3]  # C_ARNAV_SOFT
        
        signals = self.engine.compare_attributes(c1, c2)
        
        # Assert overlaps
        self.assertFalse(signals["pan_match"])
        self.assertTrue(signals["account_suffix_match"])  # 1111 vs 4444_1111
        self.assertFalse(signals["aadhaar_match"])
        self.assertTrue(signals["vpa_mobile_match"])  # arnav@upi match
        self.assertTrue(signals["device_fingerprint_match"])  # DEV_MOCK_IPHONE match
        self.assertTrue(signals["email_match"])  # arnav@mit.edu match
        self.assertTrue(signals["behavioral_similarity"])  # BEH_HASH_ALPHA match
        self.assertTrue(signals["beneficiary_overlap"])  # BENE_1 match
        self.assertTrue(signals["ip_subnet_overlap"])  # 192.168.1.X subnet match

    def test_probabilistic_fusion_compounding_math(self):
        """Verify compounded independent probabilistic calculations are mathematically sound."""
        # Scenario 1: Only PAN matches (0.95 weight)
        pair_pan = {
            "customer_1": self.customers[0],
            "customer_2": self.customers[1],
            "pan_match": True
        }
        score_pan = self.engine.evaluate_and_fuse_entities(pair_pan)
        self.assertEqual(score_pan, 0.95)

        # Scenario 2: Device Fingerprint Overlap (0.80) and Email Overlap (0.75)
        # Compounded: 1.0 - (1.0 - 0.80) * (1.0 - 0.75) = 1.0 - 0.20 * 0.25 = 1.0 - 0.05 = 0.95
        pair_combo = {
            "customer_1": self.customers[0],
            "customer_2": self.customers[3],
            "device_fingerprint_match": True,
            "email_match": True
        }
        score_combo = self.engine.evaluate_and_fuse_entities(pair_combo)
        self.assertEqual(score_combo, 0.95)

        # Scenario 3: IP Address Subnet Overlap (0.55) and Behavioral Overlap (0.70)
        # Compounded: 1.0 - (1.0 - 0.55) * (1.0 - 0.70) = 1.0 - 0.45 * 0.30 = 1.0 - 0.135 = 0.865
        pair_soft = {
            "customer_1": self.customers[0],
            "customer_2": self.customers[3],
            "ip_subnet_overlap": True,
            "behavioral_similarity": True
        }
        score_soft = self.engine.evaluate_and_fuse_entities(pair_soft)
        self.assertEqual(score_soft, 0.865)

    def test_pipeline_confirmed_fusion_and_review_state(self):
        """Verify high-confidence fusion routing (>0.85) vs review state routing (0.65-0.85)."""
        # Run pipeline with custom list of customers
        results = self.engine.run_resolution_pipeline(self.customers, blocking_key="declared_occupation")
        
        # 1. C_ARNAV <-> C_ARNAV_ALT: Shares PAN (0.95) and Aadhaar (0.90)
        # Compounded score: 1.0 - (1.0 - 0.95) * (1.0 - 0.90) = 1.0 - 0.05 * 0.10 = 0.995 > 0.85
        # Should be FUSED!
        fused = [f for f in results["fused_links"] if f["customer_1_id"] == "C_ARNAV" and f["customer_2_id"] == "C_ARNAV_ALT"]
        self.assertEqual(len(fused), 1)
        self.assertEqual(fused[0]["score"], 0.995)
        
        # Assert in-memory NetworkX Graph properties
        self.assertTrue(self.engine.networkx_graph.has_edge("C_ARNAV", "C_ARNAV_ALT"))
        edge_data = self.engine.networkx_graph["C_ARNAV"]["C_ARNAV_ALT"]
        self.assertEqual(edge_data["link_confidence"], 0.995)
        self.assertEqual(edge_data["status"], "FUSED")
        self.assertEqual(edge_data["link_type"], "CONFIRMED_IDENTITY_LINK")

        # Verify that Neo4j driver was called to merge in database
        self.mock_driver.session.assert_called()

    def test_review_state_routing(self):
        """Verify that middle-tier confidence links are correctly routed to investigative review states."""
        # Create a specific pair designed to match only one medium-weight attribute: Beneficiary Overlap (0.85)
        # Compounded score = 0.85. Fits: 0.65 <= Score <= 0.85
        pair_review = [
            self.customers[0],
            {
                "customer_id": "C_REVIEW_CANDIDATE",
                "customer_name": "Arnav Reviewer",
                "declared_occupation": "AI Scientist",
                "kyc_tier": "TIER_1",
                "pan": "DIFF_PAN",
                "aadhaar": "DIFF_AADHAAR",
                "vpa": "diff@upi",
                "mobile": "diff_mobile",
                "email": "diff_email",
                "beneficiaries": ["BENE_1"],  # Overlap! (0.85)
                "ips": ["10.0.0.5"]
            }
        ]
        
        results = self.engine.run_resolution_pipeline(pair_review, blocking_key="declared_occupation")
        
        # Should create a probable link in memory and database
        self.assertEqual(results["fused_identities_count"], 0)
        self.assertEqual(results["probable_links_count"], 1)
        
        prob = results["probable_links"][0]
        self.assertEqual(prob["customer_1_id"], "C_ARNAV")
        self.assertEqual(prob["customer_2_id"], "C_REVIEW_CANDIDATE")
        self.assertEqual(prob["score"], 0.85)
        self.assertEqual(prob["link_type"], "PROBABLE_IDENTITY_LINK")

        # Verify in-memory Graph status
        edge_data = self.engine.networkx_graph["C_ARNAV"]["C_REVIEW_CANDIDATE"]
        self.assertEqual(edge_data["link_confidence"], 0.85)
        self.assertEqual(edge_data["status"], "REVIEW_STATE")


if __name__ == "__main__":
    unittest.main()
