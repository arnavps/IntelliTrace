import pytest
from unittest.mock import MagicMock, patch

from intellitrace.narrative_generator import ProsecutorialNarrativeGenerator


@pytest.fixture
def sample_inputs():
    return {
        "transactions": [{"txn_id": "T001", "amount": 95000, "timestamp": "2026-05-25"}],
        "shap_attributions": {"velocity_1h": 0.45, "amount_zscore": 0.32},
        "linkage_indices": {"entity_A_to_entity_B": 0.94},
        "pmla_typologies": ["Typology 01: High-volume structuring"],
    }


def _make_mock_openai_response(text: str) -> MagicMock:
    """Build a minimal mock that mirrors openai.ChatCompletion response structure."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = text
    mock_response.choices = [mock_choice]
    return mock_response


VALID_NARRATIVE = (
    "### Executive Summary\n"
    "This case involves structured transfers designed to evade detection thresholds.\n\n"
    "### Suspicious Behavior Breakdown\n"
    "Multiple sub-threshold transfers were observed within a 24-hour window.\n\n"
    "### Definitive Risk Factors\n"
    "- velocity_1h SHAP attribution: 0.45\n"
    "- amount_zscore SHAP attribution: 0.32\n\n"
    "### Actionable Enforcement Directives\n"
    "Freeze accounts and file STR with FIU-IND immediately.\n"
)


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

        generator = ProsecutorialNarrativeGenerator(api_key="sk-or-v1-fake-key")
        result = generator.generate_case_summary(**sample_inputs)

        assert "Executive Summary" in result
        assert "Definitive Risk Factors" in result
        assert "Actionable Enforcement Directives" in result
        mock_client.chat.completions.create.assert_called_once()


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

        generator = ProsecutorialNarrativeGenerator(api_key="sk-or-v1-fake-key")

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
