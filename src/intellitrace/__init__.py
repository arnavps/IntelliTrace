"""
IntelliTrace Universal Transaction Schema (IUTS) Normalization Module.

A production-grade, highly optimized adapters framework to parse and normalize
incoming logs from 9 distinct banking channels into a unified schema using Pydantic v2.
"""

from intellitrace.exceptions import (
    IUTSException,
    IUTSValidationError,
    IUTSNormalizationError,
)
from intellitrace.schema import IUTSModel, ChannelEnum
from intellitrace.factory import IUTSAdapterFactory

__all__ = [
    "IUTSException",
    "IUTSValidationError",
    "IUTSNormalizationError",
    "IUTSModel",
    "ChannelEnum",
    "IUTSAdapterFactory",
]
