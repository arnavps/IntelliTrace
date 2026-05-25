import pytest
import datetime
from intellitrace.insider_threat import InsiderThreatFusionLayer

def test_no_insider_threat():
    """Verify that normal operations do not trigger the insider threat escalation."""
    fusion_layer = InsiderThreatFusionLayer(volatility_limit=3.5)
    
    chain = [
        {"transaction_id": "TXN-001", "amount": 1000},
        {"transaction_id": "TXN-002", "amount": 1000}
    ]
    
    # Benign telemetry (different employees, low-weight actions)
    telemetry = [
        {"employee_id": "EMP-A", "transaction_id": "TXN-001", "action_type": "INITIATE", "system_override_flag": False},
        {"employee_id": "EMP-B", "transaction_id": "TXN-002", "action_type": "REVIEW", "system_override_flag": False},
    ]
    
    result = fusion_layer.evaluate_chain(
        fund_flow_chain=chain,
        cbs_telemetry_logs=telemetry,
        composite_ml_score=85.0,
        current_severity="HIGH"
    )
    
    assert not result["insider_threat_detected"]
    assert result["final_severity"] == "HIGH"
    assert result["employee_volatility_index"] == 1.5  # EMP-B has highest volatility (1.5)

def test_insider_threat_escalation():
    """Verify that a rogue employee handling multiple hops securely overrides severity to CRITICAL."""
    fusion_layer = InsiderThreatFusionLayer(volatility_limit=3.5)
    
    chain = [
        {"transaction_id": "TXN-010", "amount": 50000},
        {"transaction_id": "TXN-011", "amount": 49000},
        {"transaction_id": "TXN-012", "amount": 48000}
    ]
    
    # Same employee initiates, reviews, and systematically overrides multiple steps
    telemetry = [
        {"employee_id": "EMP-ROGUE", "transaction_id": "TXN-010", "action_type": "INITIATE", "terminal_session_id": "TERM-99", "timestamp": "2026-05-25T10:00:00Z"},
        {"employee_id": "EMP-ROGUE", "transaction_id": "TXN-011", "action_type": "SYSTEM_OVERRIDE", "terminal_session_id": "TERM-99", "timestamp": "2026-05-25T10:05:00Z", "system_override_flag": True},
        {"employee_id": "EMP-ROGUE", "transaction_id": "TXN-012", "action_type": "AUTHORIZE", "terminal_session_id": "TERM-99", "timestamp": "2026-05-25T10:10:00Z"}
    ]
    
    result = fusion_layer.evaluate_chain(
        fund_flow_chain=chain,
        cbs_telemetry_logs=telemetry,
        composite_ml_score=65.0,
        current_severity="MEDIUM"
    )
    
    assert result["insider_threat_detected"] is True
    assert result["final_severity"] == "CRITICAL"
    assert result["final_ml_score"] == 100.0
    
    evidence = result["cross_domain_evidence"]
    assert evidence is not None
    assert evidence["compromised_employee_id"] == "EMP-ROGUE"
    assert evidence["fund_flow_chain_length"] == 3
    assert evidence["transactions_compromised"] == 3
    assert "TERM-99" in evidence["terminal_session_ids"]
    assert len(evidence["authorization_timestamps"]) == 3
    assert evidence["system_override_flags_used"] is True
    assert evidence["override_approvals_count"] == 2
