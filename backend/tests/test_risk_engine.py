import pytest
import numpy as np
import time
from intellitrace.risk_engine import XGBoostRiskEngine

def test_risk_engine_training():
    """Verify training pipeline handles imbalanced data and SMOTE correctly."""
    # Use smaller model for fast test execution
    engine = XGBoostRiskEngine(n_estimators=10, max_depth=3)
    
    np.random.seed(42)
    n_samples = 1000
    n_features = 163
    
    # Imbalanced dataset (approx 1% fraud)
    y = np.random.binomial(1, 0.01, n_samples)
    # Force some positives for StratifiedKFold to work properly
    y[:10] = 1 
    y[-10:] = 0
    
    X = np.random.randn(n_samples, n_features)
    # Make fraud instances distinguishable
    X[y == 1] += 2.0
    
    metrics = engine.train(X, y)
    
    assert "mean_auc" in metrics
    assert "mean_f1" in metrics
    assert metrics["mean_auc"] > 0.5
    assert engine.model is not None

def test_risk_engine_latency():
    """Verify scoring function meets the strict <5ms latency target."""
    engine = XGBoostRiskEngine(n_estimators=10, max_depth=3)
    
    np.random.seed(42)
    y = np.zeros(200)
    y[:10] = 1
    X = np.random.randn(200, 163)
    engine.train(X, y)
    
    feature_vector = np.random.randn(1, 163)
    
    # Warmup invocation (caches, JIT, etc.)
    _ = engine.predict_transaction_risk(feature_vector)
    
    # Benchmark
    start_time = time.perf_counter()
    score = engine.predict_transaction_risk(feature_vector)
    end_time = time.perf_counter()
    
    latency_ms = (end_time - start_time) * 1000.0
    
    assert 0.0 <= score <= 100.0
    assert latency_ms < 5.0, f"Prediction latency {latency_ms:.2f}ms exceeds the 5ms budget."
