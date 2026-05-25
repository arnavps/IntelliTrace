import pytest
import time
from intellitrace.str_compiler import FIUINDReportCompiler

def test_compiler_success_schema_validation():
    """Verify that all 6 required nodes are generated successfully."""
    compiler = FIUINDReportCompiler("IN-FIU-001", "Test Bank Ltd")
    
    xml_output = compiler.compile_report(
        batch_number="BATCH-999",
        transactions=[{"transaction_id": "TXN-1", "amount": 5000}],
        branches=[{"branch_code": "BR-MUM-01"}],
        individuals=[{"profile_id": "P-01", "full_name": "John Doe"}],
        network_params=[{"profile_id": "P-01", "ip_address": "192.168.1.1"}],
        legal_entities=[{"entity_id": "L-01", "registration": "CORP-99"}]
    )
    
    assert "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" in xml_output
    assert "<FIUIND_STR_REPORT>" in xml_output
    assert "<SAPCTL>" in xml_output
    assert "<SAPTRN>" in xml_output
    assert "<SAPBRC>" in xml_output
    assert "<SAPPIN>" in xml_output
    assert "<SAPINP>" in xml_output
    assert "<SAPLPE>" in xml_output
    assert "Test Bank Ltd" in xml_output

def test_compiler_performance_bound():
    """Verify that 10,000 transactions complete execution efficiently (under 60s, practically <1s)."""
    compiler = FIUINDReportCompiler("IN-FIU-001", "Test Bank Ltd")
    
    # Generate 10,000 transaction histories
    massive_txn_payload = [{"transaction_id": f"TXN-{i}", "amount": 100} for i in range(10000)]
    
    start_time = time.time()
    xml_output = compiler.compile_report(
        batch_number="BATCH-10K",
        transactions=massive_txn_payload,
        branches=[{"branch_code": "BR-MUM-01"}],
        individuals=[{"profile_id": "P-01", "full_name": "John Doe"}],
        network_params=[{"profile_id": "P-01", "ip_address": "192.168.1.1"}],
        legal_entities=[{"entity_id": "L-01", "registration": "CORP-99"}]
    )
    execution_time = time.time() - start_time
    
    assert execution_time < 60.0  # Should be well under the strict optimization target
    assert "TXN-9999" in xml_output
    assert xml_output.count("<SAPTRN>") == 10000

def test_compiler_schema_failure():
    """Verify that omitting a mandatory block triggers a ValueError."""
    compiler = FIUINDReportCompiler("IN-FIU-001", "Test Bank Ltd")
    
    # We monkeypatch the builder to simulate a missing tag scenario
    def bad_build(parent, items):
        pass # Intentionally does not add the SAPPIN tag
        
    compiler._build_sappin = bad_build
    
    with pytest.raises(ValueError, match="failed internal structural schema validation"):
        compiler.compile_report(
            batch_number="BATCH-ERR",
            transactions=[{"transaction_id": "TXN-1"}],
            branches=[{"branch_code": "BR-01"}],
            individuals=[{"profile_id": "P-01"}],
            network_params=[{"profile_id": "P-01"}],
            legal_entities=[{"entity_id": "L-01"}]
        )
