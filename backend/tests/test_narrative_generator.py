import pytest
import sys
from unittest.mock import MagicMock, patch

# Mock Anthropic so tests run even without the package
sys.modules['anthropic'] = MagicMock()
import anthropic 

from intellitrace.narrative_generator import ProsecutorialNarrativeGenerator

@pytest.fixture
def sample_inputs():
    return {
        "transactions": [{"txn_id": "T001", "amount": 95000, "timestamp": "2026-05-25"}],
        "shap_attributions": {"velocity_1h": 0.45, "amount_zscore": 0.32},
        "linkage_indices": {"entity_A_to_entity_B": 0.94},
        "pmla_typologies": ["Typology 01: High-volume structuring"]
    }

def test_narrative_generator_success(sample_inputs):
    """Verify that a properly formatted narrative passes schema validation."""
    with patch("intellitrace.narrative_generator.anthropic") as mock_anthropic:
        MockClient = mock_anthropic.Anthropic
        # Configure the mock response
        mock_instance = MockClient.return_value
        mock_message = MagicMock()
        mock_content = MagicMock()
        mock_content.text = (
            "### Executive Summary\n"
            "This is a summary.\n\n"
            "### Suspicious Behavior Breakdown\n"
            "These are the behaviors.\n\n"
            "### Definitive Risk Factors\n"
            "- velocity_1h: 0.45\n\n"
            "### Actionable Enforcement Directives\n"
            "Freeze the accounts immediately.\n"
        )
        mock_message.content = [mock_content]
        mock_instance.messages.create.return_value = mock_message
        
        generator = ProsecutorialNarrativeGenerator(api_key="fake-key")
        
        result = generator.generate_case_summary(**sample_inputs)
        
        assert "Executive Summary" in result
        assert "Definitive Risk Factors" in result

def test_narrative_generator_schema_failure(sample_inputs):
    """Verify that a missing sub-heading triggers a ValueError validation exception."""
    with patch("intellitrace.narrative_generator.anthropic") as mock_anthropic:
        MockClient = mock_anthropic.Anthropic
        mock_instance = MockClient.return_value
        mock_message = MagicMock()
        mock_content = MagicMock()
        
        # Missing 'Actionable Enforcement Directives'
        mock_content.text = (
            "### Executive Summary\n"
            "This is a summary.\n\n"
            "### Suspicious Behavior Breakdown\n"
            "These are the behaviors.\n\n"
            "### Definitive Risk Factors\n"
            "- velocity_1h: 0.45\n\n"
        )
        mock_message.content = [mock_content]
        mock_instance.messages.create.return_value = mock_message
        
        generator = ProsecutorialNarrativeGenerator(api_key="fake-key")
        
        with pytest.raises(ValueError, match="failed schema validation"):
            generator.generate_case_summary(**sample_inputs)

def test_narrative_generator_api_dropout(sample_inputs):
    """Verify that an API network fault correctly raises a RuntimeError."""
    with patch("intellitrace.narrative_generator.anthropic") as mock_anthropic:
        MockClient = mock_anthropic.Anthropic
        mock_instance = MockClient.return_value
        # Use a generic Exception since anthropic.APIError is mocked out here
        mock_instance.messages.create.side_effect = Exception("Connection Reset")
        
        generator = ProsecutorialNarrativeGenerator(api_key="fake-key")
        
        with pytest.raises(RuntimeError, match="Narrative generation failed due to upstream API fault"):
            generator.generate_case_summary(**sample_inputs)
