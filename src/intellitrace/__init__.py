"""
IntelliTrace Universal Transaction Schema (IUTS) Normalization Module.

A production-grade, highly optimized adapters framework to parse and normalize
incoming logs from 9 distinct banking channels into a unified schema using Pydantic v2.
"""

from intellitrace.exceptions import (
    IUTSException,
    IUTSValidationError,
    IUTSNormalizationError,
    PIISecurityException,
)
from intellitrace.schema import IUTSModel, ChannelEnum
from intellitrace.factory import IUTSAdapterFactory
from intellitrace.security import (
    PIISecurityBoundary,
    validate_verhoeff,
    validate_aadhaar,
    validate_pan,
    validate_passport,
    validate_mobile,
)

__all__ = [
    "IUTSException",
    "IUTSValidationError",
    "IUTSNormalizationError",
    "PIISecurityException",
    "IUTSModel",
    "ChannelEnum",
    "IUTSAdapterFactory",
    "PIISecurityBoundary",
    "validate_verhoeff",
    "validate_aadhaar",
    "validate_pan",
    "validate_passport",
    "validate_mobile",
]
