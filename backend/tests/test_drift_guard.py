import pytest
import numpy as np
import time
from sklearn.linear_model import LogisticRegression
from intellitrace.drift_guard import ConceptDriftGuard

def test_no_concept_drift():
    """Verify the module returns negative when sliding window matches reference baseline."""
    np.random.seed(42)
    reference = np.random.normal(0, 1, (1000, 5))
    window = np.random.normal(0, 1, (200, 5))
    feature_names = ["feature_1", "transaction_velocity", "amount_deviation", "feature_4", "feature_5"]
    
    guard = ConceptDriftGuard(reference, feature_names)
    results = guard.evaluate_drift(window)
    
    assert not results["drift_detected"]
    assert len(results["psi_breaches"]) == 0
    assert len(results["ks_breaches"]) == 0

def test_psi_and_ks_drift_detection():
    """Verify that shifting distributions successfully trigger PSI and KS breaches."""
    np.random.seed(42)
    reference = np.random.normal(0, 1, (1000, 35)) # 35 tabular features
    
    # Introduce severe shift to simulate non-stationary financial crime decay
    window = np.random.normal(3, 2, (200, 35)) 
    
    feature_names = [f"feat_{i}" for i in range(35)]
    feature_names[5] = "rapid_velocity" # Key behavioral indicator
    
    guard = ConceptDriftGuard(reference, feature_names)
    results = guard.evaluate_drift(window)
    
    assert results["drift_detected"] is True
    assert len(results["psi_breaches"]) > 0
    assert len(results["ks_breaches"]) > 0
    
    # Ensure KS test targeted the specific key behavioral indicator
    ks_breached_features = [b["feature"] for b in results["ks_breaches"]]
    assert "rapid_velocity" in ks_breached_features

def test_champion_challenger_orchestration():
    """Verify that a drift breach automatically orchestrates a background model evaluation worker."""
    np.random.seed(42)
    reference = np.random.normal(0, 1, (500, 2))
    
    # Intentionally drifted incoming stream
    window = np.random.normal(5, 1, (100, 2))
    feature_names = ["txn_velocity", "transfer_amount"]
    
    guard = ConceptDriftGuard(reference, feature_names)
    
    # Create shadow dataset
    X_shadow = np.random.normal(0, 1, (100, 2))
    y_shadow = np.random.randint(0, 2, 100)
    
    # Create mock models (Champion vs Challenger)
    # Champion is poorly fit, Challenger is perfectly fit
    champion = LogisticRegression().fit(X_shadow, np.random.randint(0, 2, 100))
    challenger = LogisticRegression().fit(X_shadow, y_shadow)
    
    results = guard.evaluate_drift(
        sliding_window_data=window,
        shadow_dataset=(X_shadow, y_shadow),
        champion_model=champion,
        challenger_model=challenger
    )
    
    assert results["drift_detected"] is True
    
    # Wait briefly for the background thread to finish evaluating
    time.sleep(0.5)
    
    assert not guard.is_evaluating_challenger
    
    metrics = guard.last_evaluation_metrics
    assert "champion_accuracy" in metrics
    assert "challenger_accuracy" in metrics
    
    # Challenger should logically outperform the random champion
    assert metrics["challenger_accuracy"] >= metrics["champion_accuracy"]
