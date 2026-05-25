"""
ISO 8583 Parser.

This module normalizes simulated ISO 8583 binary-to-dictionary Card payloads,
including handling foreign currency conversion to INR and dynamic bank IFSC resolving via BIN.
"""

from decimal import Decimal
import re
from typing import Any, Dict
from datetime import datetime, timezone

from intellitrace.exceptions import IUTSNormalizationError
from intellitrace.parsers.base import BaseChannelParser


class ISO8583Parser(BaseChannelParser):
    """
    Concrete parser for Cards transaction logs using simulated ISO 8583 dict structure.
    
    Expected schema structure:
        MTI: str (e.g., '0200')
        DE-2: str (Primary Account Number / PAN)
        DE-4: str/int/float (Transaction amount, e.g. minor units '12500' for 125.00 or decimal 125.00)
        DE-49: str (ISO 4217 numeric currency code, e.g. '840' for USD, '356' for INR)
        DE-102: str (Account Identification 1 - Debit Account)
        DE-103: str (Account Identification 2 - Credit Account / Merchant ID)
        DE-12 / DE-13 / DE-7 (optional): Dates/Times
        ip_address / device_fingerprint (optional)
        geo_lat / geo_lon (optional)
    """

    # ISO 4217 Currency Code to default conversion rate to INR
    DEFAULT_EXCHANGE_RATES = {
        "356": Decimal("1.00"),    # INR
        "840": Decimal("83.50"),   # USD
        "978": Decimal("90.25"),   # EUR
        "826": Decimal("106.10"),  # GBP
        "392": Decimal("0.53"),    # JPY
    }

    # BIN (Bank Identification Number - first 6 digits of PAN) to IFSC mapping
    BIN_IFSC_MAPPING = {
        "411111": "HDFC0000001",  # HDFC Bank
        "422222": "SBIN0000001",  # SBI
        "522222": "ICIC0000001",  # ICICI
        "607152": "UTIB0000001",  # Axis Bank
        "455555": "YESB0000001",  # Yes Bank
    }

    def parse(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Validate critical ISO 8583 fields
        required_fields = ["DE-2", "DE-4", "DE-49", "DE-102", "DE-103"]
        for field in required_fields:
            if field not in raw_payload:
                raise IUTSNormalizationError(f"Missing required ISO 8583 Data Element: '{field}'")

        pan = str(raw_payload["DE-2"])
        raw_amount = raw_payload["DE-4"]
        currency_code = str(raw_payload["DE-49"])
        debit_acct = str(raw_payload["DE-102"])
        credit_acct = str(raw_payload["DE-103"])

        # 1. Resolve Bank IFSC codes
        # Debit Bank is the card Issuer, derived from the PAN BIN (first 6 digits)
        bin_code = pan[:6]
        debit_ifsc = raw_payload.get("debit_bank_ifsc") or self.BIN_IFSC_MAPPING.get(bin_code, "UTIB0000001")
        
        # Credit Bank is the Acquirer (often Axis Bank for our card payment hub, or explicitly provided)
        credit_ifsc = raw_payload.get("credit_bank_ifsc") or "UTIB0000001"

        # 2. Amount conversion & minor units logic
        # ISO 8583 standard formats amount as fixed-length string representing minor units (cents/paise)
        # If raw_amount is all digits and represented as string or int, we treat it as minor units (divided by 100).
        # Otherwise, if it is a float or decimal string (e.g. contains dot), we parse directly.
        try:
            if isinstance(raw_amount, (int, str)) and re.match(r"^\d+$", str(raw_amount)):
                amount_decimal = Decimal(str(raw_amount)) / Decimal("100.00")
            else:
                amount_decimal = Decimal(str(raw_amount))
        except Exception as e:
            raise IUTSNormalizationError(f"Failed to parse amount '{raw_amount}': {e}")

        # Handle Foreign Currency Translation
        # Obtain conversion rates from metadata or default table
        exchange_rates = raw_payload.get("exchange_rates") or {}
        rate = exchange_rates.get(currency_code)
        
        if rate is not None:
            conversion_rate = Decimal(str(rate))
        else:
            conversion_rate = self.DEFAULT_EXCHANGE_RATES.get(currency_code)

        if conversion_rate is None:
            raise IUTSNormalizationError(
                f"Unsupported ISO 8583 currency code: '{currency_code}' and no exchange rate was provided in payload."
            )

        amount_inr = (amount_decimal * conversion_rate).quantize(Decimal("0.01"))

        # 3. Parse timestamp
        # In ISO 8583, Date/Time can be in DE-7 (Transmission Date/Time MMDDhhmmss) or custom.
        # We look for standard custom date strings first, fallback to DE-7 parsing, or current UTC.
        txn_timestamp = raw_payload.get("txn_timestamp") or raw_payload.get("timestamp") or raw_payload.get("txn_time")
        if not txn_timestamp:
            de_7 = raw_payload.get("DE-7")
            if de_7 and len(str(de_7)) == 10:
                # Format: MMDDhhmmss (Assume current year UTC)
                try:
                    current_year = datetime.now(timezone.utc).year
                    ts_str = f"{current_year}{de_7}"
                    # MMDDhhmmss -> '%m%d%H%M%S'
                    txn_timestamp = datetime.strptime(ts_str, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
                except Exception:
                    txn_timestamp = datetime.now(timezone.utc)
            else:
                txn_timestamp = datetime.now(timezone.utc)

        # 4. Extract optional variables
        device_fingerprint = raw_payload.get("DE-126") or raw_payload.get("device_fingerprint")
        ip_address = raw_payload.get("DE-125") or raw_payload.get("ip_address") or raw_payload.get("ip")
        
        geo_lat = raw_payload.get("geo_lat")
        geo_lon = raw_payload.get("geo_lon")

        # Map to canonical schema representation
        normalized = {
            "txn_id": raw_payload.get("txn_id"),
            "txn_timestamp": txn_timestamp,
            "channel": "Cards",
            "amount_inr": amount_inr,
            "debit_account_id": debit_acct,
            "credit_account_id": credit_acct,
            "debit_bank_ifsc": debit_ifsc,
            "credit_bank_ifsc": credit_ifsc,
            "device_fingerprint": str(device_fingerprint) if device_fingerprint is not None else None,
            "ip_address": str(ip_address) if ip_address is not None else None,
            "geo_lat": float(geo_lat) if geo_lat is not None else None,
            "geo_lon": float(geo_lon) if geo_lon is not None else None,
            "risk_prelim_score": float(raw_payload.get("risk_prelim_score") or 0.0),
            "metadata_json": raw_payload,
        }

        return normalized
