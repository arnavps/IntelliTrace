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
    RedisConnectionException,
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
from intellitrace.guard import IngestionDeduplicationGuard
from intellitrace.entity_resolution import EntityResolutionEngine
from intellitrace.round_tripping import RoundTrippingTracer
from intellitrace.gnn import (
    InductiveGraphSAGE,
    compute_semi_supervised_loss,
    InductiveEmbeddingService,
)
from intellitrace.risk_engine import XGBoostRiskEngine
from intellitrace.anomaly_detector import UnsupervisedAnomalyDetector
from intellitrace.explainability import SHAPExplainabilityEngine
from intellitrace.drift_guard import ConceptDriftGuard
from intellitrace.pmla_mapper import PMLATypologyMapper
from intellitrace.insider_threat import InsiderThreatFusionLayer
try:
    from intellitrace.streaming import (
        TransactionTimestampAssigner,
        IngestionProcessFunction,
        create_flink_pipeline,
        SmurfingPatternDetector,
        SmurfingPatternSelectFunction,
        LayeringEventDuplicator,
        RapidLayeringAnalyzer,
        DormantActivationMonitor,
    )
    _has_streaming = True
except ImportError:
    TransactionTimestampAssigner = None
    IngestionProcessFunction = None
    create_flink_pipeline = None
    SmurfingPatternDetector = None
    SmurfingPatternSelectFunction = None
    LayeringEventDuplicator = None
    RapidLayeringAnalyzer = None
    DormantActivationMonitor = None
    _has_streaming = False

__all__ = [
    "IUTSException",
    "IUTSValidationError",
    "IUTSNormalizationError",
    "PIISecurityException",
    "RedisConnectionException",
    "IUTSModel",
    "ChannelEnum",
    "IUTSAdapterFactory",
    "PIISecurityBoundary",
    "validate_verhoeff",
    "validate_aadhaar",
    "validate_pan",
    "validate_passport",
    "validate_mobile",
    "IngestionDeduplicationGuard",
    "EntityResolutionEngine",
    "RoundTrippingTracer",
    "InductiveGraphSAGE",
    "compute_semi_supervised_loss",
    "InductiveEmbeddingService",
    "TransactionTimestampAssigner",
    "IngestionProcessFunction",
    "create_flink_pipeline",
    "SmurfingPatternDetector",
    "SmurfingPatternSelectFunction",
    "LayeringEventDuplicator",
    "RapidLayeringAnalyzer",
    "UnsupervisedAnomalyDetector",
    "SHAPExplainabilityEngine",
    "ConceptDriftGuard",
    "PMLATypologyMapper",
    "InsiderThreatFusionLayer",
]
