"""
IUTS Canonical Pydantic Schema.

This module defines the canonical IntelliTrace Universal Transaction Schema (IUTS)
model and associated Enums and validators using Pydantic v2.
"""

from decimal import Decimal
from enum import Enum
import re
from typing import Any, Dict, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
    model_validator,
)


class ChannelEnum(str, Enum):
    """Supported 9 distinct banking channels."""
    UPI = "UPI"
    SWIFT = "SWIFT"
    NEFT = "NEFT"
    RTGS = "RTGS"
    IMPS = "IMPS"
    Cards = "Cards"
    Wallets = "Wallets"
    ACH = "ACH"
    ATM = "ATM"


class IUTSModel(BaseModel):
    """
    Canonical IntelliTrace Universal Transaction Schema (IUTS) Model.
    
    Represents the normalized production-grade transaction format.
    """
    txn_id: UUID = Field(default_factory=uuid4, description="System-generated UUIDv4 if missing.")
    txn_timestamp: datetime = Field(..., description="Aware datetime forced to ISO8601 UTC format.")
    channel: ChannelEnum = Field(..., description="Enum matching one of the 9 banking channels.")
    amount_inr: Decimal = Field(..., description="Decimal with exactly 2 decimal places (Decimal(18,2)).")
    debit_account_id: str = Field(..., min_length=1, description="Identification of the source account.")
    credit_account_id: str = Field(..., min_length=1, description="Identification of the destination account.")
    debit_bank_ifsc: str = Field(..., description="IFSC or BIC SWIFT bank identifier code for source bank.")
    credit_bank_ifsc: str = Field(..., description="IFSC or BIC SWIFT bank identifier code for destination bank.")
    device_fingerprint: Optional[str] = Field(None, description="Optional unique identifier of the user's device.")
    ip_address: Optional[str] = Field(None, description="Optional IP address from where the transaction originated.")
    geo_lat: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Optional latitude (-90 to 90).")
    geo_lon: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Optional longitude (-180 to 180).")
    risk_prelim_score: float = Field(0.0, description="Preliminary risk score (defaults to 0.0).")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, description="Raw channel-specific metadata.")

    # Pydantic v2 ConfigDict  (replaces deprecated class Config)
    model_config = ConfigDict(
        populate_by_name=True,
    )

    @field_validator("txn_timestamp", mode="before")
    @classmethod
    def validate_timestamp(cls, v: Any) -> datetime:
        """Ensure the timestamp is timezone-aware and converted to UTC."""
        if isinstance(v, str):
            # Parse standard ISO format and handle 'Z' suffix
            try:
                v = datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError as e:
                raise ValueError(f"Invalid ISO8601 timestamp string: {e}")
        elif isinstance(v, (int, float)):
            # Handle Unix timestamp
            v = datetime.fromtimestamp(v, tz=timezone.utc)
            
        if isinstance(v, datetime):
            if v.tzinfo is None:
                raise ValueError("txn_timestamp must be timezone-aware.")
            return v.astimezone(timezone.utc)
        raise ValueError("txn_timestamp must be an ISO8601 string, float timestamp, or datetime object.")

    @field_serializer("txn_timestamp")
    def serialize_timestamp(self, dt: datetime) -> str:
        """Force the timestamp output to UTC ISO8601 with Z suffix."""
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    @field_validator("amount_inr", mode="before")
    @classmethod
    def validate_amount(cls, v: Any) -> Decimal:
        """Convert to Decimal and quantize to exactly two decimal places."""
        if isinstance(v, float):
            # Avoid float precision issues by converting via string
            v = str(v)
        try:
            d = Decimal(str(v))
        except Exception:
            raise ValueError(f"Invalid numeric value for amount_inr: {v}")
        
        # Check for negative amounts
        if d <= 0:
            raise ValueError("amount_inr must be a positive decimal.")
        
        return d.quantize(Decimal("0.01"))

    @field_serializer("amount_inr")
    def serialize_amount(self, d: Decimal) -> float:
        """Serialize Decimal as float to exactly 2 decimal places in JSON if needed, or keep as Decimal."""
        return float(d)

    @field_validator("debit_bank_ifsc", "credit_bank_ifsc")
    @classmethod
    def validate_ifsc_or_bic(cls, v: Any) -> str:
        """Validate bank code. Supports standard Indian IFSC (11 chars) or SWIFT BIC (8 or 11 chars)."""
        if not isinstance(v, str):
            raise ValueError("Bank identifier must be a string.")
        
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("Bank identifier cannot be empty.")
        
        # Validate IFSC regex: 4 chars, 0, 6 chars (alphanumeric)
        ifsc_pattern = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
        # Validate SWIFT BIC regex: 8 or 11 chars (alphanumeric)
        bic_pattern = re.compile(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$")
        
        # If it doesn't match either, raise validation error
        if not (ifsc_pattern.match(cleaned) or bic_pattern.match(cleaned) or re.match(r"^[A-Z0-9]{8,11}$", cleaned)):
            raise ValueError(
                f"Invalid bank identifier format: '{cleaned}'. "
                "Must be a standard 11-char Indian IFSC or 8/11-char SWIFT BIC."
            )
        
        return cleaned
