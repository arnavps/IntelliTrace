"""
UPI concrete parser.

This module normalizes flat JSON UPI payloads into intermediate dictionaries
suitable for the IUTS schema.
"""

from typing import Any, Dict
from datetime import datetime, timezone

from intellitrace.exceptions import IUTSNormalizationError
from intellitrace.parsers.base import BaseChannelParser


class UPIParser(BaseChannelParser):
    """
    Concrete parser for UPI transaction logs.
    
    Expected keys:
        - vpa_sender: Sender VPA (e.g., 'john@okaxis')
        - vpa_receiver: Receiver VPA (e.g., 'merchant@okhdfcbank')
        - amount: Numeric amount string, float, or Decimal
        - device_id: Unique identifier for the user's mobile device
        - timestamp / txn_time (optional): Datetime representation
        - ip (optional): Source IP
        - geo_lat / geo_lon (optional): Geographic coordinates
        - risk_score (optional): Preliminary risk score
    """

    def parse(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Validate that essential keys are present
        required = ["vpa_sender", "vpa_receiver", "amount"]
        for key in required:
            if key not in raw_payload:
                raise IUTSNormalizationError(f"Missing required UPI field: '{key}'")

        vpa_sender = raw_payload["vpa_sender"]
        vpa_receiver = raw_payload["vpa_receiver"]
        
        if not isinstance(vpa_sender, str) or not isinstance(vpa_receiver, str):
            raise IUTSNormalizationError("Sender and Receiver VPAs must be string types.")

        # Resolve bank IFSC codes from VPAs or direct keys
        debit_ifsc = raw_payload.get("sender_bank_ifsc") or self._resolve_vpa_ifsc(vpa_sender)
        credit_ifsc = raw_payload.get("receiver_bank_ifsc") or self._resolve_vpa_ifsc(vpa_receiver)

        # Parse timestamp. If missing, default to current aware UTC time.
        raw_ts = raw_payload.get("txn_time") or raw_payload.get("timestamp") or raw_payload.get("txn_timestamp")
        if raw_ts:
            txn_timestamp = raw_ts
        else:
            txn_timestamp = datetime.now(timezone.utc)

        # Extract optional coordinates and other risk fields
        geo_lat = raw_payload.get("geo_lat")
        geo_lon = raw_payload.get("geo_lon")
        
        # If coordinates are nested under a 'geo' key
        if isinstance(raw_payload.get("geo"), dict):
            geo_lat = geo_lat or raw_payload["geo"].get("lat")
            geo_lon = geo_lon or raw_payload["geo"].get("lon")

        # Map to standard canonical key dictionary
        normalized = {
            "txn_id": raw_payload.get("txn_id"),
            "txn_timestamp": txn_timestamp,
            "channel": "UPI",
            "amount_inr": raw_payload["amount"],
            "debit_account_id": vpa_sender,
            "credit_account_id": vpa_receiver,
            "debit_bank_ifsc": debit_ifsc,
            "credit_bank_ifsc": credit_ifsc,
            "device_fingerprint": raw_payload.get("device_id") or raw_payload.get("device_fingerprint"),
            "ip_address": raw_payload.get("ip") or raw_payload.get("ip_address"),
            "geo_lat": float(geo_lat) if geo_lat is not None else None,
            "geo_lon": float(geo_lon) if geo_lon is not None else None,
            "risk_prelim_score": float(raw_payload.get("risk_score") or raw_payload.get("risk_prelim_score") or 0.0),
            "metadata_json": raw_payload,  # preserve exact raw payload
        }
        
        return normalized

    @staticmethod
    def _resolve_vpa_ifsc(vpa: str) -> str:
        """Resolve dynamic banking IFSC codes from UPI Virtual Payment Address (VPA) suffixes."""
        if "@" not in vpa:
            return "UTIB0000001"  # Default fallback IFSC (Axis Bank)
        
        suffix = vpa.split("@")[1].strip().lower()
        
        if "hdfc" in suffix:
            return "HDFC0000001"
        elif "icici" in suffix:
            return "ICIC0000001"
        elif "axis" in suffix or "utib" in suffix:
            return "UTIB0000001"
        elif "sbi" in suffix:
            return "SBIN0000001"
        elif "ybl" in suffix or "yes" in suffix:
            return "YESB0000001"
        elif "paytm" in suffix:
            return "PYTM0000001"
        elif "barodampay" in suffix or "bob" in suffix:
            return "BARB0000001"
        
        return "UTIB0000001"  # Standard high-throughput settlement hub fallback
