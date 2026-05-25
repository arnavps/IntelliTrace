"""
IntelliTrace Universal Transaction Schema Exception Hierarchy.

This module defines custom exceptions used throughout the normalization
and parsing pipeline of the IUTS system.
"""

class IUTSException(Exception):
    """Base exception class for all IntelliTrace Universal Transaction Schema errors."""
    pass


class IUTSValidationError(IUTSException):
    """
    Exception raised when a transaction payload fails structural or validation checks.
    
    This includes type mismatches, out-of-boundary values, invalid formats, or missing
    required fields in the final normalized schema.
    """
    def __init__(self, message: str, errors: list = None):
        super().__init__(message)
        self.errors = errors or []


class IUTSNormalizationError(IUTSException):
    """
    Exception raised when normalization rules or translation logic fails.
    
    Examples include trying to parse a channel with an unregistered parser,
    failing to convert an external currency code due to missing rates, or mapping anomalies.
    """
    pass


class PIISecurityException(IUTSException):
    """
    Exception raised when a PII credential validation, formatting, or cryptographic
    tokenization operation fails at the ingestion boundary.
    """
    pass


class RedisConnectionException(IUTSException):
    """
    Exception raised when Redis cluster connections or commands fail
    repeatedly after exhausting all retries.
    """
    pass
