"""
ISO 20022 Parser.

This module normalizes simulated ISO 20022 XML-to-dictionary payloads
used in NEFT and RTGS banking channels into the canonical IUTS model format.
"""

from typing import Any, Dict, Optional
from datetime import datetime, timezone

from intellitrace.exceptions import IUTSNormalizationError
from intellitrace.parsers.base import BaseChannelParser


class ISO20022Parser(BaseChannelParser):
    """
    Concrete parser for NEFT and RTGS transaction logs using simulated ISO 20022 dict structure.
    
    Expected schema structure:
        Document:
            FIToFICstmrCdtTrf:
                GrpHdr:
                    CreDtTm: str (e.g., '2026-05-24T15:30:00Z')
                CdtTrfTxInf:
                    Amt:
                        IntrBkSttlmAmt:
                            #text: str/float (e.g., '500000.00')
                            @Ccy: str (e.g., 'INR')
                    DbtrAcct:
                        Id:
                            Othr:
                                Id: str (Debit Account ID)
                    CdtrAcct:
                        Id:
                            Othr:
                                Id: str (Credit Account ID)
                    DbtrAgt:
                        FinInstnId:
                            ClrSysMmbId:
                                MmbId: str (Debit Bank IFSC / BIC)
                    CdtrAgt:
                        FinInstnId:
                            ClrSysMmbId:
                                MmbId: str (Credit Bank IFSC / BIC)
                    SplInf:
                        Envlp:
                            DeviceFingerprint: str (optional)
                            IPAddress: str (optional)
                            GeoLat: float/str (optional)
                            GeoLon: float/str (optional)
                            RiskPrelimScore: float/str (optional)
    """

    def __init__(self, channel: str):
        """
        Initialize the parser with a specific channel ('NEFT' or 'RTGS').
        """
        if channel not in ["NEFT", "RTGS"]:
            raise ValueError("ISO20022Parser only supports NEFT or RTGS channels.")
        self.channel = channel

    def parse(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Helper function to extract keys from nested paths
        def get_nested(path: str, default: Any = None) -> Any:
            keys = path.split(".")
            current = raw_payload
            for key in keys:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                else:
                    return default
            return current

        # Determine XML document root wrapper (Document.FIToFICstmrCdtTrf)
        root_path = "Document.FIToFICstmrCdtTrf"
        
        # Verify the root envelope exists or fallback to direct keys for simplified structures
        has_root = get_nested(root_path) is not None
        prefix = root_path + "." if has_root else ""

        # Extract transaction amount and currency
        amount_val = get_nested(f"{prefix}CdtTrfTxInf.Amt.IntrBkSttlmAmt.#text") or get_nested(f"{prefix}CdtTrfTxInf.Amt.InstdAmt.#text")
        currency = get_nested(f"{prefix}CdtTrfTxInf.Amt.IntrBkSttlmAmt.@Ccy") or get_nested(f"{prefix}CdtTrfTxInf.Amt.InstdAmt.@Ccy") or "INR"

        # Fallbacks for flatter dicts (often generated in simplified mappings)
        amount_val = amount_val if amount_val is not None else raw_payload.get("amount") or raw_payload.get("amount_inr")
        
        if amount_val is None:
            raise IUTSNormalizationError("Failed to extract transaction amount from ISO 20022 payload.")

        # Ensure currency is INR since NEFT/RTGS are domestic Indian settlement schemes
        if currency != "INR":
            raise IUTSNormalizationError(f"Unsupported settlement currency: '{currency}' for channel {self.channel}")

        # Extract account identifications
        debit_account = (
            get_nested(f"{prefix}CdtTrfTxInf.DbtrAcct.Id.Othr.Id") or 
            raw_payload.get("debit_account_id") or 
            raw_payload.get("sender_account")
        )
        credit_account = (
            get_nested(f"{prefix}CdtTrfTxInf.CdtrAcct.Id.Othr.Id") or 
            raw_payload.get("credit_account_id") or 
            raw_payload.get("receiver_account")
        )

        if not debit_account or not credit_account:
            raise IUTSNormalizationError("Debit/Credit Account IDs must be specified in the ISO 20022 message.")

        # Extract Bank Identifiers (IFSC Codes)
        debit_bank = (
            get_nested(f"{prefix}CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId") or 
            get_nested(f"{prefix}CdtTrfTxInf.DbtrAgt.FinInstnId.BICFI") or 
            raw_payload.get("debit_bank_ifsc") or 
            raw_payload.get("sender_ifsc")
        )
        credit_bank = (
            get_nested(f"{prefix}CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId") or 
            get_nested(f"{prefix}CdtTrfTxInf.CdtrAgt.FinInstnId.BICFI") or 
            raw_payload.get("credit_bank_ifsc") or 
            raw_payload.get("receiver_ifsc")
        )

        if not debit_bank or not credit_bank:
            raise IUTSNormalizationError("Debit/Credit Bank IFSC/BIC must be specified in the ISO 20022 message.")

        # Extract Timestamp
        timestamp_val = (
            get_nested(f"{prefix}GrpHdr.CreDtTm") or 
            raw_payload.get("txn_timestamp") or 
            raw_payload.get("timestamp") or 
            raw_payload.get("txn_time") or
            datetime.now(timezone.utc)
        )

        # Extract optional fields from Supplementary Info / Envelopes or flat fallbacks
        env_prefix = f"{prefix}CdtTrfTxInf.SplInf.Envlp."
        device_fingerprint = get_nested(f"{env_prefix}DeviceFingerprint") or raw_payload.get("device_fingerprint")
        ip_address = get_nested(f"{env_prefix}IPAddress") or raw_payload.get("ip_address") or raw_payload.get("ip")
        
        geo_lat = get_nested(f"{env_prefix}GeoLat") or raw_payload.get("geo_lat")
        geo_lon = get_nested(f"{env_prefix}GeoLon") or raw_payload.get("geo_lon")
        
        risk_score = get_nested(f"{env_prefix}RiskPrelimScore") or raw_payload.get("risk_prelim_score") or 0.0

        # Construct intermediate canonical representation
        normalized = {
            "txn_id": raw_payload.get("txn_id"),
            "txn_timestamp": timestamp_val,
            "channel": self.channel,
            "amount_inr": amount_val,
            "debit_account_id": str(debit_account),
            "credit_account_id": str(credit_account),
            "debit_bank_ifsc": str(debit_bank),
            "credit_bank_ifsc": str(credit_bank),
            "device_fingerprint": str(device_fingerprint) if device_fingerprint is not None else None,
            "ip_address": str(ip_address) if ip_address is not None else None,
            "geo_lat": float(geo_lat) if geo_lat is not None else None,
            "geo_lon": float(geo_lon) if geo_lon is not None else None,
            "risk_prelim_score": float(risk_score) if risk_score is not None else 0.0,
            "metadata_json": raw_payload,
        }

        return normalized
