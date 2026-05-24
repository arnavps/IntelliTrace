"""
Unit tests validating the temporal Graph Round-Tripping Tracer.
Covers chronological sequences, intermediary counts, sliding windows, and leakage ratios.
"""

import os
import sys
import unittest

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace.round_tripping import RoundTrippingTracer


class TestRoundTrippingTracer(unittest.TestCase):
    """
    Test suite verifying time-evolving circular transaction path analyses.
    """

    def setUp(self):
        self.tracer = RoundTrippingTracer(max_search_depth=6)

    def test_valid_round_tripping_cycle(self):
        """Verify successful detection of a valid round-tripping cycle under all constraints."""
        transactions = [
            {
                "txn_id": "T1",
                "debit_account_id": "ACCT_A",
                "credit_account_id": "ACCT_B",
                "amount_inr": 10000.0,
                "txn_timestamp": "2026-05-24T10:00:00Z"
            },
            {
                "txn_id": "T2",
                "debit_account_id": "ACCT_B",
                "credit_account_id": "ACCT_C",
                "amount_inr": 9500.0,
                "txn_timestamp": "2026-05-24T12:00:00Z"
            },
            {
                "txn_id": "T3",
                "debit_account_id": "ACCT_C",
                "credit_account_id": "ACCT_D",
                "amount_inr": 9000.0,
                "txn_timestamp": "2026-05-24T14:00:00Z"
            },
            {
                "txn_id": "T4",
                "debit_account_id": "ACCT_D",
                "credit_account_id": "ACCT_A",
                "amount_inr": 8800.0,  # 88% preservation ratio (>= 85%)
                "txn_timestamp": "2026-05-24T16:00:00Z"
            }
        ]

        cycles = self.tracer.find_round_tripping_cycles(transactions)
        self.assertEqual(len(cycles), 1)

        c = cycles[0]
        self.assertEqual(c["origin_account_id"], "ACCT_A")
        self.assertEqual(c["distinct_intermediaries_count"], 3)
        self.assertEqual(c["intermediary_accounts"], ["ACCT_B", "ACCT_C", "ACCT_D"])
        self.assertEqual(c["entry_amount_inr"], 10000.0)
        self.assertEqual(c["exit_amount_inr"], 8800.0)
        self.assertEqual(c["asset_preservation_ratio"], 0.88)
        # Duration: 6 hours (21600000 ms)
        self.assertEqual(c["cycle_duration_ms"], 6 * 3600 * 1000)
        self.assertEqual(c["cycle_duration_hours"], 6.0)

    def test_chronological_ordering_violation(self):
        """Verify that transactions occurring out-of-order are pruned, returning no cycles."""
        transactions = [
            {
                "txn_id": "T1",
                "debit_account_id": "ACCT_A",
                "credit_account_id": "ACCT_B",
                "amount_inr": 10000.0,
                "txn_timestamp": "2026-05-24T10:00:00Z"
            },
            {
                "txn_id": "T2",
                "debit_account_id": "ACCT_B",
                "credit_account_id": "ACCT_C",
                "amount_inr": 9500.0,
                "txn_timestamp": "2026-05-24T09:00:00Z"  # Chronological violation! Occurs before T1
            },
            {
                "txn_id": "T3",
                "debit_account_id": "ACCT_C",
                "credit_account_id": "ACCT_D",
                "amount_inr": 9000.0,
                "txn_timestamp": "2026-05-24T14:00:00Z"
            },
            {
                "txn_id": "T4",
                "debit_account_id": "ACCT_D",
                "credit_account_id": "ACCT_A",
                "amount_inr": 8800.0,
                "txn_timestamp": "2026-05-24T16:00:00Z"
            }
        ]

        cycles = self.tracer.find_round_tripping_cycles(transactions)
        self.assertEqual(len(cycles), 0)

    def test_sliding_window_duration_violation(self):
        """Verify that cycles executing over more than 72 hours are pruned."""
        transactions = [
            {
                "txn_id": "T1",
                "debit_account_id": "ACCT_A",
                "credit_account_id": "ACCT_B",
                "amount_inr": 10000.0,
                "txn_timestamp": "2026-05-24T10:00:00Z"
            },
            {
                "txn_id": "T2",
                "debit_account_id": "ACCT_B",
                "credit_account_id": "ACCT_C",
                "amount_inr": 9500.0,
                "txn_timestamp": "2026-05-25T12:00:00Z"
            },
            {
                "txn_id": "T3",
                "debit_account_id": "ACCT_C",
                "credit_account_id": "ACCT_D",
                "amount_inr": 9000.0,
                "txn_timestamp": "2026-05-26T14:00:00Z"
            },
            {
                "txn_id": "T4",
                "debit_account_id": "ACCT_D",
                "credit_account_id": "ACCT_A",
                "amount_inr": 8800.0,
                "txn_timestamp": "2026-05-28T16:00:00Z"  # Takes 102 hours! (> 72 hours window limit)
            }
        ]

        cycles = self.tracer.find_round_tripping_cycles(transactions)
        self.assertEqual(len(cycles), 0)

    def test_asset_preservation_leakage_violation(self):
        """Verify that loops with exit amounts below 85% of entry amount are pruned."""
        transactions = [
            {
                "txn_id": "T1",
                "debit_account_id": "ACCT_A",
                "credit_account_id": "ACCT_B",
                "amount_inr": 10000.0,
                "txn_timestamp": "2026-05-24T10:00:00Z"
            },
            {
                "txn_id": "T2",
                "debit_account_id": "ACCT_B",
                "credit_account_id": "ACCT_C",
                "amount_inr": 9500.0,
                "txn_timestamp": "2026-05-24T12:00:00Z"
            },
            {
                "txn_id": "T3",
                "debit_account_id": "ACCT_C",
                "credit_account_id": "ACCT_D",
                "amount_inr": 9000.0,
                "txn_timestamp": "2026-05-24T14:00:00Z"
            },
            {
                "txn_id": "T4",
                "debit_account_id": "ACCT_D",
                "credit_account_id": "ACCT_A",
                "amount_inr": 8000.0,  # 80% preservation ratio (< 85% threshold)
                "txn_timestamp": "2026-05-24T16:00:00Z"
            }
        ]

        cycles = self.tracer.find_round_tripping_cycles(transactions)
        self.assertEqual(len(cycles), 0)

    def test_intermediary_hop_count_violation(self):
        """Verify that loops with fewer than 3 distinct intermediary nodes are pruned."""
        transactions = [
            {
                "txn_id": "T1",
                "debit_account_id": "ACCT_A",
                "credit_account_id": "ACCT_B",
                "amount_inr": 10000.0,
                "txn_timestamp": "2026-05-24T10:00:00Z"
            },
            {
                "txn_id": "T2",
                "debit_account_id": "ACCT_B",
                "credit_account_id": "ACCT_C",
                "amount_inr": 9500.0,
                "txn_timestamp": "2026-05-24T12:00:00Z"
            },
            {
                "txn_id": "T3",
                "debit_account_id": "ACCT_C",
                "credit_account_id": "ACCT_A",
                "amount_inr": 9000.0,  # Only 2 intermediaries (B and C) -> fails hop count constraint
                "txn_timestamp": "2026-05-24T14:00:00Z"
            }
        ]

        cycles = self.tracer.find_round_tripping_cycles(transactions)
        self.assertEqual(len(cycles), 0)


if __name__ == "__main__":
    unittest.main()
