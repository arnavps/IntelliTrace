"""
IntelliTrace Graph Round-Tripping Cycle Tracer.

Analyzes time-evolving transaction paths to identify circular money movement
where capital exits an origin profile, passes through multiple intermediaries,
and returns to the source to create artificial business trails.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple, Set

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("IntelliTrace.RoundTripping")


class RoundTrippingTracer:
    """
    State-of-the-art temporal cycle tracing engine designed to extract and analyze
    circular transaction loops under strict chronological, hop count, time window,
    and asset preservation constraints.
    """

    def __init__(self, max_search_depth: int = 6):
        """
        Initializes the tracer with a configurable maximum search depth to protect
        against stack overflow and control execution latency.
        """
        self.max_search_depth = max_search_depth
        self.sliding_window_ms = 72 * 60 * 60 * 1000  # 72 hours in milliseconds

    def find_round_tripping_cycles(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Scans a list of flat transaction payloads and extracts valid round-tripping loops.
        
        Constraints enforced:
        - Timestamp sequence must move chronologically forward.
        - Loop must contain at least 3 distinct intermediary nodes.
        - Complete loop duration must fall within a 72-hour sliding window.
        - Final return amount must preserve at least 85% of the initial entry amount.
        """
        # 1. Parse timestamps and sort chronologically for forward progression checks
        parsed_txs = []
        for tx in transactions:
            try:
                ts_str = tx["txn_timestamp"]
                # Force replace Z for offset datetime parsing compatibility
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                ts_ms = int(dt.timestamp() * 1000)
            except Exception as e:
                logger.warning(f"Skipping malformed transaction timestamp in cycle trace: {e}")
                continue

            parsed_txs.append({
                "txn_id": tx["txn_id"],
                "src": tx["debit_account_id"],
                "dst": tx["credit_account_id"],
                "amount": float(tx["amount_inr"]),
                "ts_ms": ts_ms,
                "timestamp_str": ts_str
            })

        # Chronological sort
        parsed_txs.sort(key=lambda x: x["ts_ms"])

        # 2. Build high-speed adjacency index: src_account -> outgoing transaction list
        adj: Dict[str, List[Dict[str, Any]]] = {}
        for tx in parsed_txs:
            adj.setdefault(tx["src"], []).append(tx)

        detected_cycles: List[Dict[str, Any]] = []
        seen_cycle_signatures: Set[Tuple[str, ...]] = set()

        # Recursive Depth-First Search with aggressive backtracking pruning
        def dfs(current_node: str, origin_node: str, current_path: List[Dict[str, Any]], visited_nodes: Set[str]):
            # If we returned to the origin and meet the intermediary length constraint
            if current_node == origin_node and len(current_path) >= 4:
                # Intermediaries are all nodes in path except origin
                intermediary_nodes = [tx["src"] for tx in current_path[1:]]
                
                # Check asset preservation ratio: exit amount / entry amount >= 0.85
                entry_amount = current_path[0]["amount"]
                exit_amount = current_path[-1]["amount"]
                preservation_ratio = exit_amount / entry_amount if entry_amount > 0 else 0.0

                if preservation_ratio >= 0.85:
                    total_time_ms = current_path[-1]["ts_ms"] - current_path[0]["ts_ms"]
                    if total_time_ms <= self.sliding_window_ms:
                        # De-duplicate: create a canonical node-sorted signature of the cycle
                        cycle_sig = tuple(sorted(list(set([tx["src"] for tx in current_path]))))
                        if cycle_sig not in seen_cycle_signatures:
                            seen_cycle_signatures.add(cycle_sig)
                            
                            detected_cycles.append({
                                "origin_account_id": origin_node,
                                "cycle_length_hops": len(current_path),
                                "distinct_intermediaries_count": len(intermediary_nodes),
                                "intermediary_accounts": intermediary_nodes,
                                "entry_amount_inr": round(entry_amount, 2),
                                "exit_amount_inr": round(exit_amount, 2),
                                "asset_preservation_ratio": round(preservation_ratio, 4),
                                "cycle_duration_ms": total_time_ms,
                                "cycle_duration_hours": round(total_time_ms / (3600 * 1000), 2),
                                "path_transactions": [
                                    {
                                        "txn_id": tx["txn_id"],
                                        "debit_account_id": tx["src"],
                                        "credit_account_id": tx["dst"],
                                        "amount_inr": tx["amount"],
                                        "txn_timestamp": tx["timestamp_str"]
                                    } for tx in current_path
                                ]
                            })
                return

            # Prune search branches exceeding max search depth
            if len(current_path) >= self.max_search_depth:
                return

            # Check neighbors
            if current_node not in adj:
                return

            last_tx = current_path[-1]
            start_tx = current_path[0]

            for tx in adj[current_node]:
                # 1. Temporal Progression: transaction must occur strictly after previous hop
                if tx["ts_ms"] <= last_tx["ts_ms"]:
                    continue

                # 2. Sliding Window: transaction must fit within 72 hours of cycle start
                if tx["ts_ms"] - start_tx["ts_ms"] > self.sliding_window_ms:
                    continue

                next_dst = tx["dst"]
                if next_dst == origin_node:
                    # Complete cycle
                    dfs(next_dst, origin_node, current_path + [tx], visited_nodes)
                elif next_dst not in visited_nodes:
                    # Recurse
                    visited_nodes.add(next_dst)
                    dfs(next_dst, origin_node, current_path + [tx], visited_nodes)
                    visited_nodes.remove(next_dst)

        # Run DFS starting from every node in the transaction graph
        for origin in adj.keys():
            for start_transaction in adj[origin]:
                # Initialize visited set containing the first destination
                dfs(
                    start_transaction["dst"],
                    origin,
                    [start_transaction],
                    {start_transaction["dst"]}
                )

        logger.info(f"Temporal DFS scan detected {len(detected_cycles)} unique round-tripping cycles.")
        return detected_cycles
