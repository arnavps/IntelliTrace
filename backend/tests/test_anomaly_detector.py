import pytest
import time
import numpy as np
from intellitrace.anomaly_detector import UnsupervisedAnomalyDetector

def test_anomaly_detector_training():
    """Verify combined Isolation Forest and DBSCAN unsupervised training."""
    detector = UnsupervisedAnomalyDetector(contamination=0.01) # Higher contamination for test scale
    
    np.random.seed(42)
    # Generate 1000 normal transactions
    X_normal = np.random.normal(loc=0.0, scale=1.0, size=(1000, 10))
    # Generate 15 anomalous transactions forming a tight spatial cluster
    X_anomalous = np.random.normal(loc=10.0, scale=0.05, size=(15, 10))
    
    X = np.vstack([X_normal, X_anomalous])
    
    metrics = detector.train_baseline(X)
    
    assert metrics["num_baseline_samples"] == 1015
    assert metrics["num_outliers_detected"] > 0
    # The anomalies should form at least one valid DBSCAN cluster
    assert metrics["num_fraud_clusters"] >= 1
    assert detector.is_trained is True

def test_anomaly_detector_latency():
    """Verify prediction latency is strictly under the 2ms threshold per transaction."""
    detector = UnsupervisedAnomalyDetector(contamination=0.005)
    
    np.random.seed(42)
    X = np.random.normal(loc=0.0, scale=1.0, size=(2000, 10))
    # Inject extremely tight spatial anomaly cluster (size 5, within 0.005 contamination of 2000)
    X_anomalous = np.random.normal(loc=100.0, scale=0.01, size=(5, 10))
    X = np.vstack([X, X_anomalous])
    
    detector.train_baseline(X)
    
    # Create test vector placed perfectly within the fraudulent spatial cluster
    test_vector = np.random.normal(loc=100.0, scale=0.01, size=(1, 10))
    
    # JIT / Cache Warmup
    _ = detector.predict_anomaly_index(test_vector)
    
    # Benchmarking
    start_time = time.perf_counter()
    result = detector.predict_anomaly_index(test_vector)
    end_time = time.perf_counter()
    
    latency_ms = (end_time - start_time) * 1000.0
    
    assert result["is_anomaly"] is True
    assert result["belongs_to_fraud_cluster"] is True
    assert result["anomaly_score"] > 50.0  # Normalized score expects high values for anomalies
    assert latency_ms < 2.0, f"Execution latency {latency_ms:.3f}ms exceeds the stringent 2ms SLA constraint."

def test_trigger_periodic_retraining():
    """Verify that automated sliding window retraining executes properly."""
    detector = UnsupervisedAnomalyDetector(contamination=0.005)
    
    np.random.seed(42)
    X = np.random.normal(loc=0.0, scale=1.0, size=(1000, 5))
    metrics = detector.trigger_periodic_retraining(X)
    
    assert metrics["num_baseline_samples"] == 1000
    assert detector.is_trained is True
