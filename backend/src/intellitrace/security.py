"""
PII Cryptographic Tokenization & Validation Boundary.

Provides absolute protection for sensitive customer identity fields (Aadhaar, PAN,
Passport, Mobile, Device IDs) and financial accounts to ensure strict compliance
with India's Digital Personal Data Protection (DPDP) Act 2023.
"""

import hashlib
import hmac
import re
from typing import Any, Dict
from intellitrace.exceptions import PIISecurityException
from intellitrace.schema import IUTSModel


# Verhoeff Multiplication Table (D-matrix)
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

# Verhoeff Permutation Table (P-matrix)
VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

# Verhoeff Inverse Table
VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff(num_str: str) -> bool:
    """
    Validate a numeric string utilizing the Verhoeff check-digit algorithm.
    
    Returns True if the check-sum calculation succeeds, False otherwise.
    """
    if not num_str.isdigit():
        return False
    
    c = 0
    # Reverse string digits and process
    for i, digit in enumerate(reversed(num_str)):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][int(digit)]]
    return c == 0


def validate_aadhaar(aadhaar: str) -> bool:
    """
    Validate 12-digit Indian Aadhaar number format and its Verhoeff check-digit.
    Supports numbers separated by spaces or hyphens.
    """
    if not isinstance(aadhaar, str):
        return False
    # Clean whitespace and hyphens
    cleaned = re.sub(r"[\s\-]", "", aadhaar)
    if not re.match(r"^\d{12}$", cleaned):
        return False
    # First digit of Aadhaar cannot be 0 or 1
    if cleaned[0] in ("0", "1"):
        return False
    return validate_verhoeff(cleaned)


def validate_pan(pan: str) -> bool:
    """
    Validate Indian Permanent Account Number (PAN) format.
    PAN structure: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
    """
    if not isinstance(pan, str):
        return False
    cleaned = pan.strip().upper()
    return bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", cleaned))


def validate_passport(passport: str) -> bool:
    """
    Validate Indian Passport format.
    Standard: 1 uppercase letter followed by 7 digits.
    """
    if not isinstance(passport, str):
        return False
    cleaned = passport.strip().upper()
    return bool(re.match(r"^[A-Z]{1}[0-9]{7}$", cleaned))


def validate_mobile(mobile: str) -> bool:
    """
    Validate Indian mobile phone format.
    Accepts optionally prefixed numbers starting with +91, 91, or 0, followed by 10 digits starting with 6-9.
    """
    if not isinstance(mobile, str):
        return False
    cleaned = re.sub(r"[\s\-\(\)]", "", mobile)
    
    # Strip prefixes to get standard 10-digit number
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
        
    return bool(re.match(r"^[6789]\d{9}$", cleaned))


class PIISecurityBoundary:
    """
    Zero-trust cryptographic PII Tokenizer wrapper.
    
    Utilizes HMAC-SHA256 with strong domain namespacing (cryptographic salt prepending)
    to perform one-way deterministic tokenization of customer identity fields.
    """

    def __init__(self, secret_key: bytes):
        """
        Initialize the security boundary with a secure master pepper key.
        
        Args:
            secret_key (bytes): Hardware-or-environment-isolated secure pepper key.
        """
        if not secret_key or not isinstance(secret_key, bytes):
            raise PIISecurityException("Security Boundary requires a non-empty bytes master secret key.")
        if len(secret_key) < 16:
            raise PIISecurityException("Insecure Master Pepper Key: key length must be at least 16 bytes.")
        
        self.secret_key = secret_key

    def tokenize(self, value: str, namespace: str) -> str:
        """
        Perform one-way deterministic HMAC-SHA256 tokenization using domain namespacing.
        
        Args:
            value (str): The raw string value to hide.
            namespace (str): The domain separation key (e.g. 'PAN', 'ACCOUNT', 'MOBILE').
            
        Returns:
            str: Deterministic prefixed crypt-token representing the obscured PII.
        """
        if not isinstance(value, str):
            raise PIISecurityException("PII tokenization input must be a string.")
            
        cleaned_val = value.strip()
        cleaned_ns = namespace.strip().upper()
        
        # Domain separation prepends the namespace to block cross-field token collisions
        namespaced_input = f"{cleaned_ns}:{cleaned_val}".encode("utf-8")
        
        # Generate HMAC-SHA256 hexadecimal signature
        signature = hmac.new(self.secret_key, namespaced_input, hashlib.sha256).hexdigest()
        
        # Format and return prefix tokens
        return f"{cleaned_ns}_HASH_{signature}"

    def mask_iuts_payload(self, payload: IUTSModel) -> IUTSModel:
        """
        Safely intercept and mask sensitive customer data inside a canonical IUTSModel.
        
        Account numbers are obscured under the 'ACCOUNT' namespace (yielding 'ACCOUNT_HASH_...').
        Identity columns and metadata parameters are recursively scanned and tokenized.
        
        Args:
            payload (IUTSModel): The canonical validated model.
            
        Returns:
            IUTSModel: A fresh IUTSModel with all PII cryptographically obscured.
            
        Raises:
            PIISecurityException: If formatting checks fail for explicit PII parameters.
        """
        if not isinstance(payload, IUTSModel):
            raise PIISecurityException("Invalid input payload: must be an instance of IUTSModel.")
        
        # Convert Pydantic model into plain dict mapping
        payload_dict = payload.model_dump()

        # 1. Cryptographically tokenize source and destination financial account IDs
        payload_dict["debit_account_id"] = self.tokenize(payload.debit_account_id, "ACCOUNT")
        payload_dict["credit_account_id"] = self.tokenize(payload.credit_account_id, "ACCOUNT")

        # 2. Cryptographically tokenize device fingerprint if present
        if payload.device_fingerprint:
            payload_dict["device_fingerprint"] = self.tokenize(payload.device_fingerprint, "DEVICE")

        # 3. Recursively scan and mask the metadata_json blob
        payload_dict["metadata_json"] = {
            k: self._mask_value_pii(k, v) for k, v in payload.metadata_json.items()
        }

        # 4. Reconstruct and validate a new canonical model instance
        # Remove txn_id from dict if it was empty/None
        if payload_dict.get("txn_id") is None:
            payload_dict.pop("txn_id", None)
            
        return IUTSModel(**payload_dict)

    def _mask_value_pii(self, key: str, val: Any) -> Any:
        """Recursively scan keys and values to obscure personal details in metadata."""
        if isinstance(val, dict):
            return {k: self._mask_value_pii(k, v) for k, v in val.items()}
        elif isinstance(val, list):
            return [self._mask_value_pii(key, item) for item in val]
        elif isinstance(val, str):
            cleaned_key = key.lower().strip()
            
            # Helper to extract digits for number checks (e.g. Aadhaar, Mobile)
            digit_str = re.sub(r"[\s\-]", "", val)

            # ----------------------------------------------------
            # Scenario A: Explicit PII Keys (Enforce strict format validation)
            # ----------------------------------------------------
            if any(term in cleaned_key for term in ["aadhaar", "uidai", "uid_no"]):
                if validate_aadhaar(val):
                    return self.tokenize(digit_str, "AADHAAR")
                raise PIISecurityException(f"DPDP Act Violation: Malformed Aadhaar number under key '{key}': '{val}'")

            if "pan" in cleaned_key or "tax_id" in cleaned_key:
                if validate_pan(val):
                    return self.tokenize(val.strip().upper(), "PAN")
                raise PIISecurityException(f"DPDP Act Violation: Malformed PAN number under key '{key}': '{val}'")

            if "passport" in cleaned_key:
                if validate_passport(val):
                    return self.tokenize(val.strip().upper(), "PASSPORT")
                raise PIISecurityException(f"DPDP Act Violation: Malformed Passport number under key '{key}': '{val}'")

            if "mobile" in cleaned_key or "phone" in cleaned_key or "contact" in cleaned_key:
                if validate_mobile(val):
                    return self.tokenize(digit_str, "MOBILE")
                raise PIISecurityException(f"DPDP Act Violation: Malformed phone number under key '{key}': '{val}'")

            if "device" in cleaned_key or "imei" in cleaned_key or "mac_address" in cleaned_key:
                return self.tokenize(val, "DEVICE")

            # ----------------------------------------------------
            # Scenario B: Generic Keys (Zero-Trust regex validation on value content)
            # ----------------------------------------------------
            # Check for Aadhaar format
            if re.match(r"^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$", val.strip()) and validate_aadhaar(val):
                return self.tokenize(digit_str, "AADHAAR")

            # Check for PAN format
            if re.match(r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$", val.strip().upper()):
                return self.tokenize(val.strip().upper(), "PAN")

            # Check for Passport format
            if re.match(r"^[A-Za-z]{1}[0-9]{7}$", val.strip().upper()):
                return self.tokenize(val.strip().upper(), "PASSPORT")

            # Check for Mobile format (strict Indian format validation)
            if re.match(r"^(\+91[\-\s]?)?[6789]\d{9}$", val.strip()) and validate_mobile(val):
                return self.tokenize(digit_str, "MOBILE")

        return val
