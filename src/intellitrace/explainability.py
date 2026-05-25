"""
Explainable AI (XAI) Module for IntelliTrace.
Uses SHAP (SHapley Additive exPlanations) to render XGBoost predictions fully interpretable,
satisfying RBI FREE-AI framework and India's DPDP Act mandates.
"""

import numpy as np
import shap
import xgboost as xgb
from typing import Dict, Any, List

class SHAPExplainabilityEngine:
    """
    Principal AI ethics and regulatory compliance explainer.
    Generates exact, game-theoretic feature attribution matrices for risk alerts 
    using SHAP TreeExplainer directly on production XGBoost models.
    """
    
    def __init__(self, model: xgb.XGBClassifier):
        """
        Initialize the explainer mapped explicitly to a trained production XGBoost model.
        
        Args:
            model: A trained xgboost.XGBClassifier model instance.
        """
        self.model = model
        
        # Extract the underlying booster for TreeExplainer for maximum efficiency.
        # TreeExplainer calculates exact marginal contributions instantly using C++ extensions.
        booster = model.get_booster() if hasattr(model, 'get_booster') else model
        
        self.explainer = shap.TreeExplainer(booster)
        
        # Expected value is the base score before any feature contributions
        expected_val = self.explainer.expected_value
        if isinstance(expected_val, (list, np.ndarray)):
            self.base_score = float(expected_val[0])
        else:
            self.base_score = float(expected_val)

    def compute_feature_attributions(self, feature_vector: np.ndarray, feature_names: List[str]) -> Dict[str, float]:
        """
        Calculates exact feature-level marginal contributions instantly.
        Execution latency is targeted at <10ms for standard XGBoost inference vectors.
        
        Args:
            feature_vector: Numpy array of shape (1, n_features)
            feature_names: List of feature names corresponding to the columns
            
        Returns:
            Dictionary mapping feature names to their exact SHAP log-odds values.
        """
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)
            
        # Compute exact SHAP values
        shap_values = self.explainer.shap_values(feature_vector)
        
        # Binary classification in XGBoost generally returns a single array of shap values
        # representing the positive class, but occasionally returns a list of two arrays.
        if isinstance(shap_values, list):
            vals = shap_values[1][0]
        else:
            vals = shap_values[0]
            
        return {name: float(val) for name, val in zip(feature_names, vals)}

    def generate_local_explanation(self, transaction_id: str, feature_importance_vector: Dict[str, float]) -> Dict[str, Any]:
        """
        Extracts counterfactual delta points and synthesizes a human-readable natural language narrative.
        Satisfies strict regulatory reporting mandates.
        
        Args:
            transaction_id: Unique identifier for the transaction alert.
            feature_importance_vector: Dictionary mapping feature names to their exact SHAP contribution values.
            
        Returns:
            Dictionary containing the transaction ID, top contributing factors, 
            and a synthesized immutable compliance narrative.
        """
        # Sort features by absolute contribution magnitude to find dominant predictors
        sorted_features = sorted(feature_importance_vector.items(), key=lambda x: abs(x[1]), reverse=True)
        
        # Extract the top 5 dominant features for the human-readable narrative
        top_contributors = sorted_features[:5]
        
        narrative_parts = []
        narrative_parts.append(f"Transaction {transaction_id} was flagged primarily due to the following behavioral markers:")
        
        total_delta = 0.0
        
        for feat_name, shap_val in top_contributors:
            # We scale the log-odds SHAP value into a pseudo "point" delta for compliance readability
            point_delta = int(round(shap_val * 10.0))
            if point_delta == 0:
                continue
                
            total_delta += shap_val
            
            direction = "added" if point_delta > 0 else "subtracted"
            pts = abs(point_delta)
            
            # Synthesize natural language statement
            clean_name = feat_name.replace("_", " ")
            narrative_parts.append(f"The marker '{clean_name}' {direction} +{pts} risk points.")
            
        if len(narrative_parts) == 1:
            narrative_parts.append("No significant feature deviations detected.")
            
        narrative_statement = " ".join(narrative_parts)
        
        return {
            "transaction_id": transaction_id,
            "base_score_log_odds": self.base_score,
            "top_contributors": [{"feature": k, "shap_value": v, "point_delta": int(round(v * 10.0))} for k, v in top_contributors],
            "compliance_narrative": narrative_statement
        }
        
    def explain_transaction(self, transaction_id: str, feature_vector: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """
        End-to-end wrapper bridging high-speed TreeExplainer calculation and compliance narrative synthesis.
        """
        attributions = self.compute_feature_attributions(feature_vector, feature_names)
        return self.generate_local_explanation(transaction_id, attributions)
