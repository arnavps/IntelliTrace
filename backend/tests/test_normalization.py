"""
Comprehensive unit tests and high-throughput latency profiling suite for the
IntelliTrace Universal Transaction Schema (IUTS) Normalization Adapter.
"""

from decimal import Decimal
import os
import sys
import time
from datetime import datetime, timezone
import unittest

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace import (
    IUTSAdapterFactory,
    IUTSModel,
    IUTSValidationError,
    IUTSNormalizationError,
    ChannelEnum,
)


class TestIUTSNormalization(unittest.TestCase):
    """Functional validation and boundary condition testing for IUTS adapters."""

    def test_upi_normalization_success(self):
        """Test successful parsing and dynamic IFSC resolution for UPI payloads."""
        raw_payload = {
            "txn_id": "8a069df2-f8b8-4c17-8e6d-74d1a58f79f2",
            "vpa_sender": "john.doe@okaxis",
            "vpa_receiver": "merchant@okhdfcbank",
            "amount": "2500.50",
            "device_id": "dev_998877",
            "txn_time": "2026-05-24T12:00:00Z",
            "ip": "192.168.1.1",
            "geo": {"lat": 12.9716, "lon": 77.5946},
            "risk_score": 0.15,
        }

        model = IUTSAdapterFactory.normalize("UPI", raw_payload)
        
        self.assertEqual(model.channel, ChannelEnum.UPI)
        self.assertEqual(model.debit_account_id, "john.doe@okaxis")
        self.assertEqual(model.credit_account_id, "merchant@okhdfcbank")
        
        # Verify dynamic IFSC resolution
        self.assertEqual(model.debit_bank_ifsc, "UTIB0000001")  # okaxis -> Axis Bank
        self.assertEqual(model.credit_bank_ifsc, "HDFC0000001")  # okhdfcbank -> HDFC Bank
        
        # Verify decimal precision
        self.assertEqual(model.amount_inr, Decimal("2500.50"))
        
        # Verify timezone-aware UTC datetime transformation
        self.assertEqual(model.txn_timestamp.tzinfo, timezone.utc)
        self.assertEqual(model.txn_timestamp.hour, 12)
        
        # Verify optional metadata extraction
        self.assertEqual(model.device_fingerprint, "dev_998877")
        self.assertEqual(model.ip_address, "192.168.1.1")
        self.assertEqual(model.geo_lat, 12.9716)
        self.assertEqual(model.geo_lon, 77.5946)
        self.assertEqual(model.risk_prelim_score, 0.15)
        self.assertEqual(model.metadata_json, raw_payload)

    def test_iso20022_neft_rtgs_success(self):
        """Test parsing of simulated ISO 20022 nested dictionary payloads for NEFT/RTGS."""
        raw_payload = {
            "Document": {
                "FIToFICstmrCdtTrf": {
                    "GrpHdr": {
                        "CreDtTm": "2026-05-24T14:45:00+05:30"
                    },
                    "CdtTrfTxInf": {
                        "Amt": {
                            "IntrBkSttlmAmt": {
                                "#text": 750000,
                                "@Ccy": "INR"
                            }
                        },
                        "DbtrAcct": {
                            "Id": {
                                "Othr": {
                                    "Id": "ACC-DEBIT-999"
                                }
                            }
                        },
                        "CdtrAcct": {
                            "Id": {
                                "Othr": {
                                    "Id": "ACC-CREDIT-888"
                                }
                            }
                        },
                        "DbtrAgt": {
                            "FinInstnId": {
                                "ClrSysMmbId": {
                                    "MmbId": "ICIC0000123"
                                }
                            }
                        },
                        "CdtrAgt": {
                            "FinInstnId": {
                                "ClrSysMmbId": {
                                    "MmbId": "SBIN0000234"
                                }
                            }
                        },
                        "SplInf": {
                            "Envlp": {
                                "DeviceFingerprint": "desktop_mac_849",
                                "IPAddress": "203.0.113.50",
                                "GeoLat": "19.0760",
                                "GeoLon": "72.8777",
                                "RiskPrelimScore": 0.05
                            }
                        }
                    }
                }
            }
        }

        model = IUTSAdapterFactory.normalize("NEFT", raw_payload)
        
        self.assertEqual(model.channel, ChannelEnum.NEFT)
        self.assertEqual(model.debit_account_id, "ACC-DEBIT-999")
        self.assertEqual(model.credit_account_id, "ACC-CREDIT-888")
        self.assertEqual(model.debit_bank_ifsc, "ICIC0000123")
        self.assertEqual(model.credit_bank_ifsc, "SBIN0000234")
        self.assertEqual(model.amount_inr, Decimal("750000.00"))
        
        # Verify UTC conversion (14:45:00+05:30 -> 09:15:00Z)
        self.assertEqual(model.txn_timestamp.hour, 9)
        self.assertEqual(model.txn_timestamp.minute, 15)
        
        self.assertEqual(model.device_fingerprint, "desktop_mac_849")
        self.assertEqual(model.ip_address, "203.0.113.50")
        self.assertEqual(model.geo_lat, 19.0760)
        self.assertEqual(model.geo_lon, 72.8777)
        self.assertEqual(model.risk_prelim_score, 0.05)

    def test_iso20022_invalid_currency(self):
        """Verify that domestic channels like RTGS raise normalization error for non-INR currency."""
        raw_payload = {
            "Document": {
                "FIToFICstmrCdtTrf": {
                    "CdtTrfTxInf": {
                        "Amt": {
                            "IntrBkSttlmAmt": {
                                "#text": "1000.00",
                                "@Ccy": "USD"
                            }
                        },
                        "DbtrAcct": {"Id": {"Othr": {"Id": "D1"}}},
                        "CdtrAcct": {"Id": {"Othr": {"Id": "C1"}}},
                        "DbtrAgt": {"FinInstnId": {"ClrSysMmbId": {"MmbId": "HDFC0000001"}}},
                        "CdtrAgt": {"FinInstnId": {"ClrSysMmbId": {"MmbId": "ICIC0000001"}}}
                    }
                }
            }
        }
        
        with self.assertRaises(IUTSNormalizationError):
            IUTSAdapterFactory.normalize("RTGS", raw_payload)

    def test_iso8583_cards_domestic_success(self):
        """Test Cards domestic ISO 8583 normalization with minor units representation and BIN dynamic IFSC resolving."""
        raw_payload = {
            "MTI": "0200",
            "DE-2": "4111110022334455",  # Starts with 411111 -> HDFC BIN
            "DE-4": "50550",             # Minor units (505.50 INR)
            "DE-49": "356",              # INR Currency Code
            "DE-102": "CARD-HDFC-9020",
            "DE-103": "MERCH-AMAZON-88",
            "DE-7": "0524103000",        # MMDDhhmmss (May 24, 10:30:00 UTC)
            "DE-125": "172.16.254.1",
        }

        model = IUTSAdapterFactory.normalize("Cards", raw_payload)
        
        self.assertEqual(model.channel, ChannelEnum.Cards)
        self.assertEqual(model.amount_inr, Decimal("505.50"))
        self.assertEqual(model.debit_account_id, "CARD-HDFC-9020")
        self.assertEqual(model.credit_account_id, "MERCH-AMAZON-88")
        
        # Verify BIN-to-IFSC resolver
        self.assertEqual(model.debit_bank_ifsc, "HDFC0000001")
        self.assertEqual(model.credit_bank_ifsc, "UTIB0000001")  # Default acquirer
        
        # Verify Transmission Date parsing
        self.assertEqual(model.txn_timestamp.month, 5)
        self.assertEqual(model.txn_timestamp.day, 24)
        self.assertEqual(model.txn_timestamp.hour, 10)
        self.assertEqual(model.txn_timestamp.minute, 30)

    def test_iso8583_cards_international_conversion(self):
        """Test Cards multi-currency conversion to INR for non-INR ISO 8583 transactions."""
        raw_payload = {
            "MTI": "0200",
            "DE-2": "5222221122334455",  # Starts with 522222 -> ICICI MasterCard BIN
            "DE-4": "120.50",            # Standard decimal representation in float string
            "DE-49": "840",              # USD Currency Code (Default conversion rate 83.50)
            "DE-102": "CARD-USD-8292",
            "DE-103": "MERCH-STRIPE-01",
        }

        model = IUTSAdapterFactory.normalize("Cards", raw_payload)
        
        self.assertEqual(model.channel, ChannelEnum.Cards)
        self.assertEqual(model.debit_bank_ifsc, "ICIC0000001")  # ICICI Bank
        
        # 120.50 USD * 83.50 rate = 10061.75 INR
        self.assertEqual(model.amount_inr, Decimal("10061.75"))

        # Test overriding exchange rate dynamically via metadata
        payload_with_custom_rate = raw_payload.copy()
        payload_with_custom_rate["exchange_rates"] = {"840": "84.00"}
        
        model_custom = IUTSAdapterFactory.normalize("Cards", payload_with_custom_rate)
        # 120.50 * 84.00 = 10122.00 INR
        self.assertEqual(model_custom.amount_inr, Decimal("10122.00"))

    def test_structural_validation_failures(self):
        """Verify structural parsing boundaries trigger IUTSValidationError."""
        # 1. Negative amount
        payload = {
            "vpa_sender": "john@okaxis",
            "vpa_receiver": "merchant@okhdfcbank",
            "amount": "-500.00",
        }
        with self.assertRaises(IUTSValidationError) as ctx:
            IUTSAdapterFactory.normalize("UPI", payload)
        self.assertIn("amount_inr", str(ctx.exception))

        # 2. Out-of-bounds Latitude
        payload = {
            "vpa_sender": "john@okaxis",
            "vpa_receiver": "merchant@okhdfcbank",
            "amount": "100.00",
            "geo_lat": 95.0,  # Max is 90
        }
        with self.assertRaises(IUTSValidationError) as ctx:
            IUTSAdapterFactory.normalize("UPI", payload)
        self.assertIn("geo_lat", str(ctx.exception))

        # 3. Invalid Bank Identifier format
        payload = {
            "vpa_sender": "john@okaxis",
            "vpa_receiver": "merchant@okhdfcbank",
            "amount": "100.00",
            "sender_bank_ifsc": "HDFC0INVALID",  # invalid format length/chars
        }
        with self.assertRaises(IUTSValidationError) as ctx:
            IUTSAdapterFactory.normalize("UPI", payload)
        self.assertIn("debit_bank_ifsc", str(ctx.exception))

        # 4. Naive timestamp
        payload = {
            "vpa_sender": "john@okaxis",
            "vpa_receiver": "merchant@okhdfcbank",
            "amount": "100.00",
            "txn_time": "2026-05-24T12:00:00",  # Missing tz suffix
        }
        with self.assertRaises(IUTSValidationError) as ctx:
            IUTSAdapterFactory.normalize("UPI", payload)
        self.assertIn("txn_timestamp", str(ctx.exception))

    def test_unregistered_channel_rejection(self):
        """Verify that unknown channels raise IUTSNormalizationError."""
        with self.assertRaises(IUTSNormalizationError):
            IUTSAdapterFactory.normalize("CRYPTO", {"amount": 100})


def run_latency_benchmark():
    """Execute high-throughput performance loop to profile microsecond normalization speeds."""
    print("\n" + "=" * 70)
    print("   INTELLITRACE IUTS NORMALIZATION LATENCY PROFILING BENCHMARK   ")
    print("=" * 70)

    # 1. Prepare representative payloads for each concrete parser
    upi_payload = {
        "vpa_sender": "retail-shopper@okaxis",
        "vpa_receiver": "coffee-shop@okhdfcbank",
        "amount": "149.50",
        "device_id": "FINGERPRINT_A8B9C0",
        "ip": "49.206.12.98",
        "geo_lat": 12.9716,
        "geo_lon": 77.5946,
        "risk_score": 0.02,
    }

    iso_20022_payload = {
        "Document": {
            "FIToFICstmrCdtTrf": {
                "GrpHdr": {"CreDtTm": "2026-05-24T20:32:00Z"},
                "CdtTrfTxInf": {
                    "Amt": {"IntrBkSttlmAmt": {"#text": "1250000.00", "@Ccy": "INR"}},
                    "DbtrAcct": {"Id": {"Othr": {"Id": "DBTR-ACCT-9872"}}},
                    "CdtrAcct": {"Id": {"Othr": {"Id": "CDTR-ACCT-1234"}}},
                    "DbtrAgt": {"FinInstnId": {"ClrSysMmbId": {"MmbId": "SBIN0000001"}}},
                    "CdtrAgt": {"FinInstnId": {"ClrSysMmbId": {"MmbId": "HDFC0000001"}}},
                    "SplInf": {
                        "Envlp": {
                            "DeviceFingerprint": "server_node_44",
                            "IPAddress": "10.0.4.19",
                            "GeoLat": 28.7041,
                            "GeoLon": 77.1025,
                            "RiskPrelimScore": 0.01,
                        }
                    },
                },
            }
        }
    }

    iso_8583_payload = {
        "MTI": "0200",
        "DE-2": "4111119988776655",  # HDFC BIN
        "DE-4": "9950",             # 99.50 USD
        "DE-49": "840",              # USD
        "DE-102": "CARD-HOLDER-X",
        "DE-103": "MERCHANT-Y",
        "DE-7": "0524203200",
    }

    iterations = 10000
    channels_to_test = [
        ("UPI", upi_payload),
        ("NEFT", iso_20022_payload),
        ("Cards", iso_8583_payload),
    ]

    print(f"Executing high-throughput loop ({iterations} iterations per channel)...")

    results = []
    
    # Warmup loop to trigger Python JIT/caches
    for channel, payload in channels_to_test:
        for _ in range(500):
            IUTSAdapterFactory.normalize(channel, payload)

    for channel, payload in channels_to_test:
        start_time = time.perf_counter()
        
        # Core performance iteration loop
        for _ in range(iterations):
            IUTSAdapterFactory.normalize(channel, payload)
            
        end_time = time.perf_counter()
        
        total_time_ms = (end_time - start_time) * 1000.0
        avg_latency_ms = total_time_ms / iterations
        tps = iterations / (end_time - start_time)
        
        results.append({
            "channel": channel,
            "total_ms": total_time_ms,
            "avg_ms": avg_latency_ms,
            "tps": tps
        })

    # Output highly formatted profiling results
    print("-" * 70)
    print(f"{'Channel':<15} | {'Total Time (ms)':<15} | {'Avg Latency (ms)':<17} | {'Throughput (TPS)':<15}")
    print("-" * 70)
    for res in results:
        print(
            f"{res['channel']:<15} | "
            f"{res['total_ms']:<15.2f} | "
            f"{res['avg_ms']:<17.5f} | "
            f"{res['tps']:<15.1f}"
        )
    print("-" * 70)
    
    avg_total_latency = sum(res["avg_ms"] for res in results) / len(results)
    print(f"Overall Average Latency: {avg_total_latency:.5f} ms per transaction")
    print(f"Target Budget: <10.00000 ms per transaction")
    
    if avg_total_latency < 10.0:
        print("\033[92mSUCCESS: Normalization pipeline is highly optimized and matches performance budget!\033[0m")
    else:
        print("\033[91mFAILURE: Performance budget exceeded.\033[0m")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    # If run directly, run both standard unit tests and latency benchmark
    unittest_runner = unittest.TextTestRunner(verbosity=2)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestIUTSNormalization)
    test_result = unittest_runner.run(suite)
    
    if test_result.wasSuccessful():
        run_latency_benchmark()
    else:
        sys.exit(1)
