"""
IntelliTrace — AI Features & Anomaly Detection: 10-Case Test Suite
===================================================================
Covers:
  TC-01  Anomaly Detector — normal transaction NOT flagged
  TC-02  Anomaly Detector — injected outlier IS flagged
  TC-03  Anomaly Detector — fraud cluster spatial membership
  TC-04  Anomaly Detector — untrained model raises RuntimeError
  TC-05  Risk Engine      — XGBoost score in [0, 100] range
  TC-06  Risk Engine      — imbalanced training produces AUC > 0.5
  TC-07  SHAP / XAI       — top-3 contributors identified correctly
  TC-08  SHAP / XAI       — narrative contains key risk phrases
  TC-09  Insider Threat   — benign multi-employee chain not escalated
  TC-10  Insider Threat   — single rogue employee escalates to CRITICAL
"""

import pytest
import numpy as np
import xgboost as xgb

from intellitrace.anomaly_detector import UnsupervisedAnomalyDetector
from intellitrace.risk_engine import XGBoostRiskEngine
from intellitrace.explainability import SHAPExplainabilityEngine
from intellitrace.insider_threat import InsiderThreatFusionLayer


# ─────────────────────────────────────────────────────────────────────────────
# Shared fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def trained_detector():
    """
    A pre-trained UnsupervisedAnomalyDetector with:
      - 2 000 normal samples centred at origin
      - 20 injected outliers tightly clustered at loc=50 (clearly separable)
    """
    np.random.seed(0)
    X_normal   = np.random.normal(loc=0.0,  scale=1.0,  size=(2000, 10))
    X_outliers = np.random.normal(loc=50.0, scale=0.05, size=(20,   10))
    X = np.vstack([X_normal, X_outliers])

    detector = UnsupervisedAnomalyDetector(
        contamination=0.01,   # expect ~1 % outliers
        dbscan_eps=2.0,       # wide enough to cluster the tight outlier cloud
        dbscan_min_samples=3,
    )
    detector.train_baseline(X)
    return detector


@pytest.fixture(scope="module")
def trained_risk_engine():
    """Light XGBoostRiskEngine trained on a small synthetic dataset."""
    np.random.seed(7)
    n = 500
    X = np.random.randn(n, 163)
    y = np.zeros(n, dtype=int)
    y[:20] = 1          # 4 % positive class
    X[y == 1] += 3.0    # make fraud clearly separable
    engine = XGBoostRiskEngine(n_estimators=20, max_depth=3)
    engine.train(X, y)
    return engine


@pytest.fixture(scope="module")
def shap_engine():
    """SHAP engine wrapping a small XGBoost model."""
    np.random.seed(99)
    X = np.random.randn(80, 10)
    y = np.random.randint(0, 2, 80)
    model = xgb.XGBClassifier(n_estimators=20, max_depth=3, random_state=99)
    model.fit(X, y)
    return SHAPExplainabilityEngine(model)


# ─────────────────────────────────────────────────────────────────────────────
# TC-01  Normal transaction is NOT flagged as anomaly
# ─────────────────────────────────────────────────────────────────────────────
def test_tc01_normal_transaction_not_flagged(trained_detector):
    """A vector drawn from the training distribution should NOT be an anomaly."""
    np.random.seed(1)
    normal_vector = np.random.normal(loc=0.0, scale=0.5, size=(1, 10))
    result = trained_detector.predict_anomaly_index(normal_vector)

    assert isinstance(result, dict), "Result must be a dict"
    assert "is_anomaly" in result
    assert "anomaly_score" in result
    # For a clearly normal point the Isolation Forest should NOT flag it
    assert result["is_anomaly"] is False, (
        f"Normal vector incorrectly flagged as anomaly "
        f"(score={result['anomaly_score']:.2f})"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TC-02  Injected outlier IS flagged as anomaly
# ─────────────────────────────────────────────────────────────────────────────
def test_tc02_outlier_is_flagged(trained_detector):
    """A vector placed at the outlier cluster centre must be detected."""
    np.random.seed(2)
    outlier_vector = np.random.normal(loc=50.0, scale=0.02, size=(1, 10))
    result = trained_detector.predict_anomaly_index(outlier_vector)

    assert result["is_anomaly"] is True, (
        f"Clear outlier NOT detected (score={result['anomaly_score']:.2f})"
    )
    assert result["anomaly_score"] > 50.0, (
        f"Anomaly score too low for extreme outlier: {result['anomaly_score']:.2f}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TC-03  Outlier belongs to a known DBSCAN fraud cluster
# ─────────────────────────────────────────────────────────────────────────────
def test_tc03_outlier_belongs_to_fraud_cluster(trained_detector):
    """
    A vector within the dbscan_eps radius of trained outlier cluster points
    must have belongs_to_fraud_cluster == True.
    """
    np.random.seed(3)
    # Place the probe right inside the dense outlier cloud
    probe = np.random.normal(loc=50.0, scale=0.01, size=(1, 10))
    result = trained_detector.predict_anomaly_index(probe)

    assert result["is_anomaly"] is True, "Probe must first be an anomaly"
    assert result["belongs_to_fraud_cluster"] is True, (
        "Probe inside the fraud cluster radius was NOT assigned cluster membership"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TC-04  Untrained detector raises RuntimeError on predict call
# ─────────────────────────────────────────────────────────────────────────────
def test_tc04_untrained_detector_raises():
    """Calling predict on an untrained model must raise RuntimeError."""
    fresh_detector = UnsupervisedAnomalyDetector()
    probe = np.zeros((1, 10))
    with pytest.raises(RuntimeError, match="has not been trained"):
        fresh_detector.predict_anomaly_index(probe)


# ─────────────────────────────────────────────────────────────────────────────
# TC-05  Risk engine returns a score in [0, 100]
# ─────────────────────────────────────────────────────────────────────────────
def test_tc05_risk_score_bounded(trained_risk_engine):
    """predict_transaction_risk must always return a float in [0, 100]."""
    np.random.seed(5)
    for _ in range(5):
        fv = np.random.randn(1, 163)
        score = trained_risk_engine.predict_transaction_risk(fv)
        assert 0.0 <= score <= 100.0, (
            f"Risk score {score:.2f} is outside the [0, 100] range"
        )


# ─────────────────────────────────────────────────────────────────────────────
# TC-06  Risk engine training on imbalanced data produces AUC > 0.5
# ─────────────────────────────────────────────────────────────────────────────
def test_tc06_risk_engine_auc_above_baseline(trained_risk_engine):
    """
    The engine must achieve mean_auc > 0.5 on the training fold results,
    proving the model learned a non-trivial decision boundary on skewed data.
    """
    # Re-train with explicit small dataset to capture metrics
    np.random.seed(6)
    n = 400
    X = np.random.randn(n, 163)
    y = np.zeros(n, dtype=int)
    y[:16] = 1
    X[y == 1] += 2.5

    engine = XGBoostRiskEngine(n_estimators=15, max_depth=3)
    metrics = engine.train(X, y)

    assert "mean_auc" in metrics, "Metrics dict must contain 'mean_auc'"
    assert metrics["mean_auc"] > 0.5, (
        f"AUC {metrics['mean_auc']:.4f} is not above the 0.5 random baseline"
    )
    assert "mean_f1" in metrics, "Metrics dict must contain 'mean_f1'"


# ─────────────────────────────────────────────────────────────────────────────
# TC-07  SHAP — top contributors identified in correct ranked order
# ─────────────────────────────────────────────────────────────────────────────
def test_tc07_shap_top_contributors_ranked(shap_engine):
    """
    generate_local_explanation must rank features by absolute SHAP value
    and return the top-N contributors in descending order of magnitude.
    """
    importances = {
        "velocity_anomaly":     4.2,
        "graph_centrality":     3.1,
        "smurfing_flag":        2.8,
        "trusted_device_match": -1.4,
        "low_txn_amount":       0.3,
    }
    result = shap_engine.generate_local_explanation("TXN-TC07", importances)

    contributors = result["top_contributors"]
    assert len(contributors) == len(importances), (
        "Number of contributors must equal number of input features"
    )

    # Verify descending absolute-value ordering
    abs_vals = [abs(c["shap_value"]) for c in contributors]
    assert abs_vals == sorted(abs_vals, reverse=True), (
        f"Contributors are not sorted by |SHAP| descending: {abs_vals}"
    )

    # Top contributor must be velocity_anomaly (highest |shap|)
    assert contributors[0]["feature"] == "velocity_anomaly", (
        f"Expected 'velocity_anomaly' as top contributor, got '{contributors[0]['feature']}'"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TC-08  SHAP — compliance narrative contains mandatory risk phrases
# ─────────────────────────────────────────────────────────────────────────────
def test_tc08_shap_narrative_contains_risk_phrases(shap_engine):
    """
    The compliance narrative must embed the exact feature names and their
    risk-point contributions so investigators can cite it in SAR filings.
    """
    importances = {
        "account_dormancy_violation": 3.1,
        "rapid_dispersal_behavior":   2.8,
        "mule_cluster_proximity":     2.2,
        "trusted_device_match":      -1.5,
    }
    result = shap_engine.generate_local_explanation("TXN-TC08", importances)
    narrative = result["compliance_narrative"]

    # Each feature name must appear
    for feature in importances:
        readable = feature.replace("_", " ")
        assert readable in narrative, (
            f"Feature '{readable}' missing from compliance narrative"
        )

    # Positive contributors must show point additions
    assert "added +" in narrative, "Narrative must reference positive risk additions"

    # Transaction ID must be traceable
    assert result["transaction_id"] == "TXN-TC08"


# ─────────────────────────────────────────────────────────────────────────────
# TC-09  Insider Threat — benign multi-employee chain NOT escalated
# ─────────────────────────────────────────────────────────────────────────────
def test_tc09_benign_chain_not_escalated():
    """
    Different employees performing standard low-weight actions across
    separate transactions must NOT trigger insider threat escalation.
    """
    fusion = InsiderThreatFusionLayer(volatility_limit=3.5)

    chain = [
        {"transaction_id": "TXN-B01", "amount": 5000},
        {"transaction_id": "TXN-B02", "amount": 4800},
        {"transaction_id": "TXN-B03", "amount": 3200},
    ]
    telemetry = [
        {"employee_id": "EMP-ALPHA", "transaction_id": "TXN-B01",
         "action_type": "REVIEW",  "system_override_flag": False},
        {"employee_id": "EMP-BETA",  "transaction_id": "TXN-B02",
         "action_type": "INITIATE", "system_override_flag": False},
        {"employee_id": "EMP-GAMMA", "transaction_id": "TXN-B03",
         "action_type": "REVIEW",   "system_override_flag": False},
    ]

    result = fusion.evaluate_chain(
        fund_flow_chain=chain,
        cbs_telemetry_logs=telemetry,
        composite_ml_score=72.0,
        current_severity="HIGH",
    )

    assert result["insider_threat_detected"] is False, (
        "Benign multi-employee chain incorrectly triggered insider threat"
    )
    assert result["final_severity"] == "HIGH", (
        f"Severity incorrectly changed from HIGH to {result['final_severity']}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TC-10  Insider Threat — single rogue employee escalates to CRITICAL
# ─────────────────────────────────────────────────────────────────────────────
def test_tc10_rogue_employee_escalates_to_critical():
    """
    One employee initiating, overriding, and authorising all hops must
    trigger detection and push severity to CRITICAL with score = 100.
    """
    fusion = InsiderThreatFusionLayer(volatility_limit=3.5)

    chain = [
        {"transaction_id": "TXN-R01", "amount": 490000},
        {"transaction_id": "TXN-R02", "amount": 480000},
        {"transaction_id": "TXN-R03", "amount": 470000},
        {"transaction_id": "TXN-R04", "amount": 460000},
    ]
    telemetry = [
        {
            "employee_id": "EMP-ROGUE-X",
            "transaction_id": "TXN-R01",
            "action_type": "INITIATE",
            "terminal_session_id": "SESS-DARK-42",
            "timestamp": "2026-05-31T18:00:00Z",
            "system_override_flag": False,
        },
        {
            "employee_id": "EMP-ROGUE-X",
            "transaction_id": "TXN-R02",
            "action_type": "SYSTEM_OVERRIDE",
            "terminal_session_id": "SESS-DARK-42",
            "timestamp": "2026-05-31T18:02:00Z",
            "system_override_flag": True,
        },
        {
            "employee_id": "EMP-ROGUE-X",
            "transaction_id": "TXN-R03",
            "action_type": "AUTHORIZE",
            "terminal_session_id": "SESS-DARK-42",
            "timestamp": "2026-05-31T18:04:00Z",
            "system_override_flag": False,
        },
        {
            "employee_id": "EMP-ROGUE-X",
            "transaction_id": "TXN-R04",
            "action_type": "SYSTEM_OVERRIDE",
            "terminal_session_id": "SESS-DARK-42",
            "timestamp": "2026-05-31T18:06:00Z",
            "system_override_flag": True,
        },
    ]

    result = fusion.evaluate_chain(
        fund_flow_chain=chain,
        cbs_telemetry_logs=telemetry,
        composite_ml_score=60.0,
        current_severity="MEDIUM",
    )

    # ── Core assertions ────────────────────────────────────────────────────
    assert result["insider_threat_detected"] is True, (
        "Rogue employee pattern NOT detected by InsiderThreatFusionLayer"
    )
    assert result["final_severity"] == "CRITICAL", (
        f"Severity not escalated to CRITICAL — got '{result['final_severity']}'"
    )
    assert result["final_ml_score"] == 100.0, (
        f"ML score not forced to 100.0 on insider detection — got {result['final_ml_score']}"
    )

    # ── Evidence chain assertions ──────────────────────────────────────────
    ev = result["cross_domain_evidence"]
    assert ev is not None, "cross_domain_evidence must be present"
    assert ev["compromised_employee_id"] == "EMP-ROGUE-X"
    assert ev["fund_flow_chain_length"] == 4
    assert ev["system_override_flags_used"] is True
    assert "SESS-DARK-42" in ev["terminal_session_ids"], (
        "Rogue terminal session ID missing from evidence"
    )
    assert ev["override_approvals_count"] >= 2, (
        "Must record at least 2 system-override events"
    )
