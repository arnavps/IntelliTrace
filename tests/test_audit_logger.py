import pytest
from intellitrace.audit_logger import CryptographicAuditLogger, EventType

def test_audit_logger_success():
    """Verify standard operation builds a valid chain-of-custody ledger."""
    logger = CryptographicAuditLogger()
    
    logger.log_event(
        event_type=EventType.TRANSACTION_SCORED,
        actor_id="microservice_xgb_01",
        affected_entity_ids=["TXN-101", "ACCT-A"],
        action_summary={"score": 95.0, "reason": "High velocity structuring"},
        model_version="xgb-v2.1-hash:8f3c"
    )
    
    logger.log_event(
        event_type=EventType.REPORT_FILED,
        actor_id="investigator_john_doe",
        affected_entity_ids=["ACCT-A"],
        action_summary={"destination": "FIU-IND FINnet"},
    )
    
    assert len(logger.ledger) == 2
    
    # Check genesis linkage
    assert logger.ledger[0]["previous_hash"] == "0" * 64
    # Check chain linkage
    assert logger.ledger[1]["previous_hash"] == logger.ledger[0]["current_hash"]
    
    # Run full verification
    assert logger.validate_ledger_integrity() is True

def test_audit_logger_tamper_content():
    """Verify that tampering with an entry's internal content breaks the signature."""
    logger = CryptographicAuditLogger()
    logger.log_event(
        event_type=EventType.CASE_REVIEWED,
        actor_id="investigator_jane_doe",
        affected_entity_ids=["TXN-999"],
        action_summary={"decision": "Approved"}
    )
    
    assert logger.validate_ledger_integrity() is True
    
    # Maliciously modify the ledger in place
    logger.ledger[0]["action_summary"]["decision"] = "Rejected"
    
    # The signature no longer matches the manipulated content
    assert logger.validate_ledger_integrity() is False

def test_audit_logger_tamper_chain_linkage():
    """Verify that splicing or removing logs breaks the contiguous previous_hash linkage."""
    logger = CryptographicAuditLogger()
    logger.log_event(
        event_type=EventType.TRANSACTION_SCORED,
        actor_id="sys_1",
        affected_entity_ids=["E-1"],
        action_summary={}
    )
    logger.log_event(
        event_type=EventType.ALERT_TRIGGERED,
        actor_id="sys_2",
        affected_entity_ids=["E-1"],
        action_summary={}
    )
    logger.log_event(
        event_type=EventType.SYSTEM_OVERRIDE,
        actor_id="rogue_agent",
        affected_entity_ids=["E-1"],
        action_summary={}
    )
    
    assert logger.validate_ledger_integrity() is True
    
    # Malicious actor attempts to delete their override action from the middle of the chain
    # Wait, they are at the end, let's delete the middle one (index 1)
    del logger.ledger[1]
    
    # The previous_hash of the final entry points to the deleted entry's current_hash
    assert logger.validate_ledger_integrity() is False
