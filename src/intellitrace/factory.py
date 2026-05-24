"""
IUTS Adapter Factory.

This module implements the central orchestrator class `IUTSAdapterFactory` to normalize
incoming raw payloads from the 9 distinct banking channels into clean IUTSModel instances.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Type
from pydantic import ValidationError

from intellitrace.exceptions import IUTSNormalizationError, IUTSValidationError
from intellitrace.schema import IUTSModel, ChannelEnum
from intellitrace.parsers.base import BaseChannelParser
from intellitrace.parsers.upi import UPIParser
from intellitrace.parsers.iso20022 import ISO20022Parser
from intellitrace.parsers.iso8583 import ISO8583Parser


class GenericParser(BaseChannelParser):
    """
    Fallback parser for banking channels that already transmit near-canonical flat structures.
    Used for SWIFT, IMPS, Wallets, ACH, and ATM to guarantee full 9-channel integration coverage.
    """
    
    def __init__(self, channel: str):
        self.channel = channel

    def parse(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Perform copies to avoid modifying original payload
        normalized = raw_payload.copy()
        
        normalized["channel"] = self.channel

        # Standard field mapping fallbacks
        if "txn_timestamp" not in normalized:
            raw_ts = raw_payload.get("timestamp") or raw_payload.get("txn_time") or raw_payload.get("txn_timestamp")
            normalized["txn_timestamp"] = raw_ts if raw_ts is not None else datetime.now(timezone.utc)
            
        if "amount_inr" not in normalized:
            normalized["amount_inr"] = raw_payload.get("amount") or raw_payload.get("amount_inr")
            
        if "debit_account_id" not in normalized:
            normalized["debit_account_id"] = raw_payload.get("debit_account") or raw_payload.get("sender_account") or raw_payload.get("debit_account_id")

        if "credit_account_id" not in normalized:
            normalized["credit_account_id"] = raw_payload.get("credit_account") or raw_payload.get("receiver_account") or raw_payload.get("credit_account_id")

        if "debit_bank_ifsc" not in normalized:
            normalized["debit_bank_ifsc"] = raw_payload.get("debit_bank") or raw_payload.get("debit_ifsc") or raw_payload.get("debit_bank_ifsc")

        if "credit_bank_ifsc" not in normalized:
            normalized["credit_bank_ifsc"] = raw_payload.get("credit_bank") or raw_payload.get("credit_ifsc") or raw_payload.get("credit_bank_ifsc")

        if "metadata_json" not in normalized:
            normalized["metadata_json"] = raw_payload

        return normalized


class IUTSAdapterFactory:
    """
    Factory orchestrating normalization adapters for multi-channel transaction logs.
    
    Supports registering concrete parser adapters and mapping them to specific channel keys.
    """
    
    # Internal registry mapping banking channel strings to parser instances
    _registry: Dict[str, BaseChannelParser] = {
        "UPI": UPIParser(),
        "NEFT": ISO20022Parser("NEFT"),
        "RTGS": ISO20022Parser("RTGS"),
        "Cards": ISO8583Parser(),
        "SWIFT": GenericParser("SWIFT"),
        "IMPS": GenericParser("IMPS"),
        "Wallets": GenericParser("Wallets"),
        "ACH": GenericParser("ACH"),
        "ATM": GenericParser("ATM"),
    }

    @classmethod
    def register_parser(cls, channel: str, parser: BaseChannelParser) -> None:
        """
        Dynamically register or override a parser for a specific banking channel.
        
        Args:
            channel (str): The channel name (e.g. 'SWIFT', 'UPI').
            parser (BaseChannelParser): An instance of a parser subclassing BaseChannelParser.
        """
        if not isinstance(parser, BaseChannelParser):
            raise TypeError("The registered parser must subclass BaseChannelParser.")
        
        cls._registry[channel.strip()] = parser

    @classmethod
    def normalize(cls, channel: str, raw_payload: Dict[str, Any]) -> IUTSModel:
        """
        Normalize an incoming raw payload from a specific channel into a canonical IUTSModel.
        
        Args:
            channel (str): The banking channel (one of the 9 defined enums).
            raw_payload (Dict[str, Any]): The raw dictionary transaction data.
            
        Returns:
            IUTSModel: The parsed and schema-validated canonical Pydantic model.
            
        Raises:
            IUTSNormalizationError: If channel-specific parsing or currency conversions fail.
            IUTSValidationError: If structural or schema validation constraints fail.
        """
        if not isinstance(channel, str):
            raise IUTSNormalizationError("Channel parameter must be a string.")
        
        if not isinstance(raw_payload, dict):
            raise IUTSNormalizationError("Raw payload parameter must be a dictionary.")

        cleaned_channel = channel.strip()
        
        # Verify the channel is supported
        if cleaned_channel not in cls._registry:
            raise IUTSNormalizationError(
                f"Unsupported or unregistered transaction channel: '{cleaned_channel}'. "
                f"Supported channels: {list(cls._registry.keys())}"
            )

        parser = cls._registry[cleaned_channel]
        
        # 1. Parse and extract fields into standard mapping
        try:
            parsed_dict = parser.parse(raw_payload)
        except IUTSNormalizationError:
            # Let normalization exceptions bubble directly
            raise
        except Exception as e:
            raise IUTSNormalizationError(f"Parser failed internally for channel '{cleaned_channel}': {e}") from e

        # 2. Instantiate and validate Pydantic canonical model
        try:
            # Inject channel value in case parser didn't set it
            parsed_dict["channel"] = cleaned_channel
            # Remove None txn_id to trigger default_factory (uuid4)
            if parsed_dict.get("txn_id") is None:
                parsed_dict.pop("txn_id", None)
            return IUTSModel(**parsed_dict)
        except ValidationError as e:
            # Format and aggregate Pydantic validation errors into custom IUTSValidationError
            err_details = []
            for err in e.errors():
                loc_path = ".".join(str(loc) for loc in err["loc"])
                err_details.append(f"[{loc_path}]: {err['msg']} (input: {err.get('input')})")
            
            combined_message = (
                f"IUTS canonical schema validation failed for channel '{cleaned_channel}': "
                f"{'; '.join(err_details)}"
            )
            raise IUTSValidationError(combined_message, errors=e.errors()) from e
