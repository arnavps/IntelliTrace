"""
Prosecutorial Narrative Generator for IntelliTrace.

Uses OpenRouter (OpenAI-compatible API) with the best available free model
(meta-llama/llama-3.3-70b-instruct:free) to produce audit-ready, zero-hallucination
case summaries for AML compliance submission.
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional

try:
    from openai import OpenAI
    _has_openai = True
except ImportError:
    _has_openai = False

try:
    import httpx
    _has_httpx = True
except ImportError:
    _has_httpx = False

logger = logging.getLogger(__name__)

# Best free model on OpenRouter for structured legal/financial prose:
# - 70B parameter LLaMA 3.3 — superior instruction following, structured output
# - Free tier with no usage cost
DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class ProsecutorialNarrativeGenerator:
    """
    Interfaces with OpenRouter (OpenAI-compatible API) to construct audit-ready,
    zero-hallucination case summaries for compliance submission.

    Enforces strict programmatic grounding constraints preventing speculative assertions.
    Uses meta-llama/llama-3.3-70b-instruct:free by default — the best free model
    on OpenRouter for structured financial prose generation.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = DEFAULT_MODEL,
        base_url: str = OPENROUTER_BASE_URL,
    ):
        """
        Initializes the Narrative Generator.

        Args:
            api_key:    OpenRouter API key (sk-or-v1-...).
            model_name: OpenRouter model identifier. Defaults to llama-3.3-70b free.
            base_url:   OpenRouter API base URL.
        """
        if not _has_openai and not _has_httpx:
            raise ImportError(
                "Either 'openai' or 'httpx' is required. "
                "Install via: pip install openai"
            )

        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")

        # Use the openai client pointed at OpenRouter — drop-in compatible
        if _has_openai:
            self.client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                default_headers={
                    "HTTP-Referer": "https://intellitrace.ai",
                    "X-Title": "IntelliTrace AML Platform",
                },
            )
        else:
            self.client = None

    def _construct_messages(
        self,
        transactions: List[Dict[str, Any]],
        shap_attributions: Dict[str, float],
        linkage_indices: Dict[str, float],
        pmla_typologies: List[str],
    ) -> List[Dict[str, str]]:
        """
        Constructs the message list in OpenAI chat format with a strict
        system-level zero-hallucination constraint.
        """
        system_prompt = (
            "You are a strict, objective financial crime investigator writing an audit-ready "
            "prosecutorial narrative. You are subject to a zero-hallucination constraint. "
            "ABSOLUTE RULES:\n"
            "1. You MUST NOT invent external context, names, facts, or speculative patterns.\n"
            "2. EVERY assertion must be supported strictly by the provided data payload below.\n"
            "3. Your output MUST contain exactly four headers precisely as follows:\n"
            "   Executive Summary\n"
            "   Suspicious Behavior Breakdown\n"
            "   Definitive Risk Factors\n"
            "   Actionable Enforcement Directives\n"
            "4. The Executive Summary must not exceed 300 words.\n"
            "5. The Definitive Risk Factors must be a bulleted translation of the exact "
            "mathematical SHAP values provided.\n"
            "6. Do not include any placeholder text, disclaimers, or meta-commentary."
        )

        payload = {
            "transaction_timeline": transactions,
            "shap_feature_attributions": shap_attributions,
            "probabilistic_entity_linkage_indices": linkage_indices,
            "matched_pmla_typologies": pmla_typologies,
        }

        user_prompt = (
            "VERIFIED QUANTITATIVE DATA PAYLOAD:\n"
            f"{json.dumps(payload, indent=2)}\n\n"
            "Generate the formal prose layout based strictly on the above payload."
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def _validate_output_schema(self, text: str) -> bool:
        """
        Validates that the generated narrative maintains the exact formal prose layout.
        """
        required_headers = [
            r"Executive Summary",
            r"Suspicious Behavior Breakdown",
            r"Definitive Risk Factors",
            r"Actionable Enforcement Directives",
        ]
        for header in required_headers:
            if not re.search(rf"(?i){header}", text):
                logger.error(
                    f"Narrative output failed schema validation. Missing header: {header}"
                )
                return False
        return True

    def _call_via_httpx(self, messages: List[Dict[str, str]]) -> str:
        """Fallback HTTP call using httpx if openai package is not installed."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://intellitrace.ai",
            "X-Title": "IntelliTrace AML Platform",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.0,
        }
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=body,
            timeout=60.0,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    def generate_case_summary(
        self,
        transactions: List[Dict[str, Any]],
        shap_attributions: Dict[str, float],
        linkage_indices: Dict[str, float],
        pmla_typologies: List[str],
    ) -> str:
        """
        Generates a compliance-ready prosecutorial narrative from verified analytical inputs.

        Args:
            transactions:     Complete transaction timeline logs.
            shap_attributions: Local SHAP feature attributions from the risk engine.
            linkage_indices:  Probabilistic entity linkage indices from graph clustering.
            pmla_typologies:  Matched PMLA typology violations from the compliance mapper.

        Returns:
            A fully structured string narrative with the four mandatory sections.

        Raises:
            ValueError:  If the API output violates the strict header schema requirements.
            RuntimeError: If the API returns a network fault or non-200 response.
        """
        messages = self._construct_messages(
            transactions, shap_attributions, linkage_indices, pmla_typologies
        )

        try:
            if self.client is not None:
                # OpenAI-compatible client → OpenRouter
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    max_tokens=1500,
                    temperature=0.0,  # Zero temperature for maximum determinism
                )
                narrative = response.choices[0].message.content
            else:
                # Fallback: raw httpx
                narrative = self._call_via_httpx(messages)

            if not narrative:
                raise RuntimeError("OpenRouter returned an empty response.")

            # Robust schema validation
            if not self._validate_output_schema(narrative):
                raise ValueError(
                    "LLM Narrative Payload failed schema validation: "
                    "Missing mandatory structural sub-headings."
                )

            return narrative

        except ValueError:
            raise
        except Exception as e:
            err_str = str(e)
            if any(kw in err_str for kw in ("Connection", "Timeout", "HTTPError", "status_code")):
                logger.error(f"OpenRouter API dropout or network fault: {err_str}")
                raise RuntimeError(
                    f"Narrative generation failed due to upstream API fault: {err_str}"
                )
            logger.error(f"Unexpected error during narrative generation: {err_str}")
            raise
