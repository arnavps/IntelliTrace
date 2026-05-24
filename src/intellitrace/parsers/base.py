"""
Base abstract parser class for banking channels.

All channel-specific concrete parsers must subclass BaseChannelParser
to transform their raw, bespoke formats into a standardized dictionary
that conforms to the canonical IntelliTrace Universal Transaction Schema (IUTS).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseChannelParser(ABC):
    """
    Abstract base class for all banking channel parsers.
    
    Provides the standard interface to normalise payloads in a high-throughput pipeline.
    """
    
    @abstractmethod
    def parse(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and normalise a raw payload into a standardized dictionary map.
        
        Args:
            raw_payload (Dict[str, Any]): The raw transaction log dictionary from the source channel.
            
        Returns:
            Dict[str, Any]: Standardized dictionary mapping raw fields to intermediate IUTS keys.
            
        Raises:
            IUTSNormalizationError: If conversion logic or business rules fail during normalization.
            IUTSValidationError: If structural or schema validations fail during parse-time.
        """
        pass
