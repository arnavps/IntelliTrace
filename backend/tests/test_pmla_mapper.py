import pytest
import datetime
from intellitrace.pmla_mapper import PMLATypologyMapper

def test_pmla_mapper_single_signal_suppression():
    """Verify that a single signal strictly results in a LOW severity with no PMLA metadata escalation."""
    mapper = PMLATypologyMapper(time_window_hours=24)
    
    current_time = datetime.datetime(2026, 5, 25, 12, 0, 0, tzinfo=datetime.timezone.utc)
    
    alert = mapper.register_signal(
        entity_id="ACC-888",
        source="FLINK_CEP_STRUCTURING",
        score=92.5,
        description="High volume structuring detected.",
        current_time=current_time
    )
    
    assert alert["severity"] == "LOW"
    assert alert["pmla_compliance_metadata"] is None
    assert alert["signals_in_window"] == 1

def test_pmla_mapper_multi_signal_corroboration():
    """Verify that independent corroborating signals trigger escalation and specific PMLA metadata."""
    mapper = PMLATypologyMapper(time_window_hours=24)
    
    time_1 = datetime.datetime(2026, 5, 25, 10, 0, 0, tzinfo=datetime.timezone.utc)
    
    # First signal
    _ = mapper.register_signal(
        entity_id="ACC-999",
        source="FLINK_CEP_STRUCTURING",
        score=92.5,
        description="High volume structuring detected.",
        current_time=time_1
    )
    
    # Second distinct signal (within 2 hours)
    time_2 = datetime.datetime(2026, 5, 25, 12, 0, 0, tzinfo=datetime.timezone.utc)
    alert = mapper.register_signal(
        entity_id="ACC-999",
        source="ISOLATION_FOREST_ANOMALY",
        score=99.1,
        description="Extreme spatial behavioral outlier.",
        current_time=time_2
    )
    
    assert alert["severity"] == "HIGH"
    assert alert["signals_in_window"] == 2
    assert len(alert["distinct_sources"]) == 2
    
    metadata = alert["pmla_compliance_metadata"]
    assert metadata is not None
    assert metadata["primary_typology_code"] == "TYP-05"
    assert metadata["primary_typology_desc"] == "Cross-border smurfing via cryptocurrency gateways"
    assert metadata["secondary_typology_code"] == "TYP-01"
    
    # Deadline should be exactly 7 days (168 hours) from time_2
    assert metadata["hours_remaining_until_deadline"] == 168.0
    expected_deadline = time_2 + datetime.timedelta(days=7)
    assert metadata["fiu_ind_deadline"] == expected_deadline.isoformat()

def test_pmla_mapper_sliding_window_expiration():
    """Verify that signals outside the 24-hour sliding window do not trigger corroboration."""
    mapper = PMLATypologyMapper(time_window_hours=24)
    
    time_1 = datetime.datetime(2026, 5, 20, 10, 0, 0, tzinfo=datetime.timezone.utc) # 5 days ago
    
    _ = mapper.register_signal(
        entity_id="ACC-777",
        source="FLINK_CEP_STRUCTURING",
        score=90.0,
        description="Structuring detected.",
        current_time=time_1
    )
    
    time_2 = datetime.datetime(2026, 5, 25, 12, 0, 0, tzinfo=datetime.timezone.utc)
    alert = mapper.register_signal(
        entity_id="ACC-777",
        source="GRAPHSAGE_NETWORK_RISK",
        score=95.0,
        description="High structural risk.",
        current_time=time_2
    )
    
    # Since the first signal expired, severity remains LOW
    assert alert["severity"] == "LOW"
    assert alert["signals_in_window"] == 1
    assert alert["pmla_compliance_metadata"] is None
