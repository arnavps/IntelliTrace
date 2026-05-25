import pytest
import time
import numpy as np
import xgboost as xgb
from intellitrace.explainability import SHAPExplainabilityEngine

def test_shap_explainability_latency():
    """Verify SHAP calculations complete in <10ms for XGBoost inference vectors."""
    np.random.seed(42)
    X = np.random.randn(100, 163)
    y = np.random.binomial(1, 0.5, 100)
    
    # Mock production-scale model
    model = xgb.XGBClassifier(n_estimators=50, max_depth=7, n_jobs=-1, random_state=42)
    model.fit(X, y)
    
    engine = SHAPExplainabilityEngine(model)
    
    feature_names = [f"feature_{i}" for i in range(163)]
    test_vector = np.random.randn(1, 163)
    
    # Warmup TreeExplainer (instantiates C++ pointers)
    _ = engine.compute_feature_attributions(test_vector, feature_names)
    
    # Benchmark
    start_time = time.perf_counter()
    attributions = engine.compute_feature_attributions(test_vector, feature_names)
    end_time = time.perf_counter()
    
    latency_ms = (end_time - start_time) * 1000.0
    
    assert latency_ms < 10.0, f"SHAP calculation latency {latency_ms:.2f}ms exceeds stringent 10ms SLA."
    assert len(attributions) == 163

def test_generate_local_explanation_narrative():
    """Verify the parser translates raw SHAP values into exact compliance narratives."""
    np.random.seed(42)
    X = np.random.randn(10, 5)
    y = np.random.binomial(1, 0.5, 10)
    model = xgb.XGBClassifier(n_estimators=5, max_depth=2, random_state=42)
    model.fit(X, y)
    
    engine = SHAPExplainabilityEngine(model)
    
    # Mock SHAP attribution dictionary per the exact requirements prompt
    feature_importance_vector = {
        "account_dormancy_violation": 3.1, # +31 points
        "rapid_dispersal_behavior": 2.8,   # +28 points
        "mule_cluster_proximity": 2.2,     # +22 points
        "trusted_device_match": -1.5,      # -15 points
        "low_value_transaction": -0.5      # -5 points
    }
    
    explanation = engine.generate_local_explanation("TXN-10029", feature_importance_vector)
    
    assert explanation["transaction_id"] == "TXN-10029"
    
    narrative = explanation["compliance_narrative"]
    assert "account dormancy violation" in narrative
    assert "added +31 risk points" in narrative
    assert "rapid dispersal behavior" in narrative
    assert "added +28 risk points" in narrative
    assert "mule cluster proximity" in narrative
    assert "added +22 risk points" in narrative
    assert "trusted device match" in narrative
    assert "subtracted +15 risk points" in narrative
    
    assert len(explanation["top_contributors"]) == 5
