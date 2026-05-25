"""
Comprehensive security boundary test suite validating Verhoeff Aadhaar compliance,
PII formatting rules, cryptographic namespacing, and recursive metadata masking.
"""

from decimal import Decimal
import os
import sys
import unittest

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace import (
    IUTSAdapterFactory,
    IUTSModel,
    IUTSValidationError,
    PIISecurityException,
    PIISecurityBoundary,
    validate_verhoeff,
    validate_aadhaar,
    validate_pan,
    validate_passport,
    validate_mobile,
)
from intellitrace.security import VERHOEFF_D, VERHOEFF_P, VERHOEFF_INV


def calculate_verhoeff_check_digit(num_str: str) -> int:
    """Helper to calculate the mathematical Verhoeff check-digit for test generation."""
    c = 0
    for i, digit in enumerate(reversed(num_str)):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][int(digit)]]
    return VERHOEFF_INV[c]


def generate_valid_aadhaar(base_digits: str = "36621548125") -> str:
    """Helper to generate a mathematically valid 12-digit Aadhaar for testing."""
    check_digit = calculate_verhoeff_check_digit(base_digits)
    return f"{base_digits}{check_digit}"


class TestPIISecurityBoundary(unittest.TestCase):
    """Cryptographic verification and PII data privacy boundary test suite."""

    def setUp(self):
        self.secret_key = b"super_secret_master_pepper_key_123"
        self.boundary = PIISecurityBoundary(self.secret_key)

    def test_verhoeff_algorithm_functional(self):
        """Verify the mathematical correctness of our Verhoeff check-digit implementation."""
        # Generate a valid Aadhaar string
        valid_aadhaar = generate_valid_aadhaar("36621548125")  # Dynamic generation
        self.assertTrue(validate_verhoeff(valid_aadhaar))
        self.assertTrue(validate_aadhaar(valid_aadhaar))
        
        # Space-separated and hyphen-separated formatting checks
        self.assertTrue(validate_aadhaar(f"{valid_aadhaar[:4]} {valid_aadhaar[4:8]} {valid_aadhaar[8:]}"))
        self.assertTrue(validate_aadhaar(f"{valid_aadhaar[:4]}-{valid_aadhaar[4:8]}-{valid_aadhaar[8:]}"))

        # Altering a single digit must trigger a Verhoeff validation failure
        corrupted_digit = str((int(valid_aadhaar[-1]) + 1) % 10)
        invalid_aadhaar = valid_aadhaar[:-1] + corrupted_digit
        self.assertFalse(validate_verhoeff(invalid_aadhaar))
        self.assertFalse(validate_aadhaar(invalid_aadhaar))

        # First digit cannot be 0 or 1
        bad_lead_aadhaar = "0" + valid_aadhaar[1:]
        self.assertFalse(validate_aadhaar(bad_lead_aadhaar))

    def test_pii_validators(self):
        """Test Indian national PII formatting and boundaries (PAN, Passport, Mobile)."""
        # 1. PAN validation
        self.assertTrue(validate_pan("ABCDE1234F"))
        self.assertTrue(validate_pan("abcde1234f"))  # Case insensitive check
        self.assertFalse(validate_pan("ABCD1234F"))   # Short characters
        self.assertFalse(validate_pan("ABCDEF1234F")) # Too many characters
        self.assertFalse(validate_pan("ABCDE12345"))  # Trailing number instead of char

        # 2. Passport validation
        self.assertTrue(validate_passport("A1234567"))
        self.assertTrue(validate_passport("z9876543"))
        self.assertFalse(validate_passport("12345678"))  # Missing leading char
        self.assertFalse(validate_passport("AB123456"))  # Too many letters

        # 3. Mobile phone validation
        self.assertTrue(validate_mobile("+91 98765 43210"))
        self.assertTrue(validate_mobile("919876543210"))
        self.assertTrue(validate_mobile("09876543210"))
        self.assertTrue(validate_mobile("9876543210"))
        self.assertTrue(validate_mobile("6123456789"))
        self.assertFalse(validate_mobile("5876543210"))  # Starts with invalid range (5)
        self.assertFalse(validate_mobile("98765 4321"))  # Short digits

    def test_cryptographic_boundary_and_namespacing(self):
        """Verify deterministic hashing, keyspace isolation, and domain separation."""
        val = "MY_SENSITIVE_DATA"
        
        # Determinism: Same payload and key yields the same token
        token_a = self.boundary.tokenize(val, "PAN")
        token_b = self.boundary.tokenize(val, "PAN")
        self.assertEqual(token_a, token_b)

        # Pepper Isolation: Different master keys yield different tokens
        other_boundary = PIISecurityBoundary(b"completely_different_master_pepper_key")
        token_other = other_boundary.tokenize(val, "PAN")
        self.assertNotEqual(token_a, token_other)

        # Domain separation (Namespacing): Same value in different domains yields different hashes
        token_account = self.boundary.tokenize(val, "ACCOUNT")
        token_pan = self.boundary.tokenize(val, "PAN")
        self.assertNotEqual(token_account, token_pan)
        
        # Verify custom prefix strings
        self.assertTrue(token_account.startswith("ACCOUNT_HASH_"))
        self.assertTrue(token_pan.startswith("PAN_HASH_"))

    def test_pii_security_boundary_init_checks(self):
        """Verify boundary creation rejects missing or weak master pepper keys."""
        with self.assertRaises(PIISecurityException):
            PIISecurityBoundary(None)  # Type error
        with self.assertRaises(PIISecurityException):
            PIISecurityBoundary(b"short")  # Under 16 bytes key rejection

    def test_mask_iuts_payload_integration(self):
        """Test full model masking including PII scanning, validation, and metadata obscuring."""
        valid_aadhaar = generate_valid_aadhaar("36621548125")
        
        raw_payload = {
            "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "vpa_sender": "sender@okaxis",
            "vpa_receiver": "receiver@okhdfcbank",
            "amount": "15000.00",
            "device_id": "IMEI-99887766",
            "ip": "10.0.0.1",
            "geo_lat": 12.97,
            "geo_lon": 77.59,
            "risk_score": 0.05,
            # Metadata with multiple explicit and generic PII configurations
            "metadata_json": {
                "user_aadhaar": valid_aadhaar,
                "user_pan": "ABCDE1234F",
                "nested": {
                    "contact_phone": "+91 98765 43210",
                    "generic_unlabeled_pan": "XYZWP5678Q",  # Value-based match
                }
            }
        }

        # 1. Normalize raw transaction log to IUTSModel
        iuts_model = IUTSAdapterFactory.normalize("UPI", raw_payload)

        # 2. Intercept and mask IUTSModel at the boundary
        masked_model = self.boundary.mask_iuts_payload(iuts_model)

        # 3. Assertions
        # Model fields verification
        self.assertTrue(masked_model.debit_account_id.startswith("ACCOUNT_HASH_"))
        self.assertTrue(masked_model.credit_account_id.startswith("ACCOUNT_HASH_"))
        self.assertTrue(masked_model.device_fingerprint.startswith("DEVICE_HASH_"))
        
        # Verify the bank IFSC remains intact (unhashed)
        self.assertEqual(masked_model.debit_bank_ifsc, "UTIB0000001")

        # Metadata recursive scan verification
        meta = masked_model.metadata_json["metadata_json"]
        self.assertTrue(meta["user_aadhaar"].startswith("AADHAAR_HASH_"))
        self.assertTrue(meta["user_pan"].startswith("PAN_HASH_"))
        self.assertTrue(meta["nested"]["contact_phone"].startswith("MOBILE_HASH_"))
        self.assertTrue(meta["nested"]["generic_unlabeled_pan"].startswith("PAN_HASH_"))

        # Verify deterministic equality downstream checks
        pan_token_direct = self.boundary.tokenize("ABCDE1234F", "PAN")
        self.assertEqual(meta["user_pan"], pan_token_direct)

    def test_pii_validation_malformed_failures(self):
        """Verify that passing corrupted explicit PII metadata keys blocks the transaction."""
        raw_payload = {
            "vpa_sender": "s@okaxis",
            "vpa_receiver": "r@okhdfcbank",
            "amount": "10.00",
            "metadata_json": {
                "user_pan": "INVALID-PAN-123",  # Malformed PAN under explicit key
            }
        }

        iuts_model = IUTSAdapterFactory.normalize("UPI", raw_payload)
        
        # Must raise PIISecurityException to block the ingest flow
        with self.assertRaises(PIISecurityException) as ctx:
            self.boundary.mask_iuts_payload(iuts_model)
        self.assertIn("Malformed PAN number", str(ctx.exception))

        # Check bad Aadhaar
        raw_payload_bad_aadhaar = {
            "vpa_sender": "s@okaxis",
            "vpa_receiver": "r@okhdfcbank",
            "amount": "10.00",
            "metadata_json": {
                "user_aadhaar": "366215481250",  # Fails Verhoeff checksum
            }
        }
        iuts_model_bad_aadhaar = IUTSAdapterFactory.normalize("UPI", raw_payload_bad_aadhaar)
        with self.assertRaises(PIISecurityException) as ctx:
            self.boundary.mask_iuts_payload(iuts_model_bad_aadhaar)
        self.assertIn("Malformed Aadhaar number", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
