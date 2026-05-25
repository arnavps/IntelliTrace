import numpy as np
from scipy.stats import ks_2samp
import threading
import logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class ConceptDriftGuard:
    """
    Automated statistical tracking and drift detection system for IntelliTrace.
    Continuously monitors streaming transaction feature distributions for statistical concept drift
    to detect model decay in non-stationary financial crime environments.
    """

    def __init__(self, reference_data: np.ndarray, feature_names: List[str]):
        """
        Initializes the drift guard with fixed baseline training distributions.
        
        Args:
            reference_data: A 2D numpy array of shape (n_samples, n_features)
            feature_names: A list of feature names corresponding to the columns in reference_data
        """
        if reference_data.shape[1] != len(feature_names):
            raise ValueError("Number of columns in reference_data must match length of feature_names")
            
        self.reference_data = reference_data
        self.feature_names = feature_names
        
        # Alert thresholds
        self.psi_threshold = 0.2
        self.ks_pvalue_threshold = 0.05
        
        # State tracking for background orchestrator
        self.is_evaluating_challenger = False
        
        # Track historical evaluation results
        self.last_evaluation_metrics: Dict[str, float] = {}

    def _calculate_psi(self, expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
        """
        Calculates Population Stability Index (PSI) between two distributions.
        PSI > 0.2 indicates significant population change.
        """
        # Determine bins from expected distribution min/max
        breakpoints = np.histogram_bin_edges(np.concatenate([expected, actual]), bins=bins)
        
        # Calculate frequencies
        expected_freq, _ = np.histogram(expected, bins=breakpoints)
        actual_freq, _ = np.histogram(actual, bins=breakpoints)
        
        # Convert to probabilities
        expected_pct = expected_freq / len(expected)
        actual_pct = actual_freq / len(actual)
        
        # Apply strict clipping to avoid divide-by-zero or log(0)
        expected_pct = np.clip(expected_pct, 1e-4, 1.0)
        actual_pct = np.clip(actual_pct, 1e-4, 1.0)
        
        # Calculate PSI
        psi_values = (actual_pct - expected_pct) * np.log(actual_pct / expected_pct)
        return float(np.sum(psi_values))

    def evaluate_drift(
        self, 
        sliding_window_data: np.ndarray, 
        shadow_dataset: Optional[Tuple[np.ndarray, np.ndarray]] = None,
        champion_model: Any = None, 
        challenger_model: Any = None
    ) -> Dict[str, Any]:
        """
        Evaluates incoming transaction feature windows in real time against the fixed baseline distributions.
        Computes PSI for all features and KS tests for key behavioral indicators.
        
        If thresholds are crossed (PSI > 0.2 or KS p-value < 0.05), triggers a background
        Champion-Challenger orchestration.
        
        Args:
            sliding_window_data: Real-time streaming data matrix to evaluate.
            shadow_dataset: Tuple of (X_shadow, y_shadow) for evaluation.
            champion_model: The currently deployed model exposing a predict(X) method.
            challenger_model: A newly updated model iteration exposing a predict(X) method.
            
        Returns:
            Dictionary containing evaluation metadata and triggered alarms.
        """
        results = {
            "drift_detected": False,
            "psi_breaches": [],
            "ks_breaches": []
        }
        
        # 1. Population Stability Index (PSI) calculations across all features
        for i, feature_name in enumerate(self.feature_names):
            psi_val = self._calculate_psi(self.reference_data[:, i], sliding_window_data[:, i])
            
            if psi_val > self.psi_threshold:
                results["psi_breaches"].append({
                    "feature": feature_name,
                    "psi": psi_val
                })
                
        # 2. Two-sample Kolmogorov-Smirnov (KS) tests for key behavioral indicators
        # Scanning for specific financial crime signals in feature names
        key_indicators = ["velocity", "amount", "count", "shift", "deviation"]
        for i, feature_name in enumerate(self.feature_names):
            if any(ind in feature_name.lower() for ind in key_indicators):
                ks_stat, p_value = ks_2samp(self.reference_data[:, i], sliding_window_data[:, i])
                
                if p_value < self.ks_pvalue_threshold:
                    results["ks_breaches"].append({
                        "feature": feature_name,
                        "ks_stat": float(ks_stat),
                        "p_value": float(p_value)
                    })
                    
        # Check strict notification boundaries
        if len(results["psi_breaches"]) > 0 or len(results["ks_breaches"]) > 0:
            results["drift_detected"] = True
            
            # Automate Champion-Challenger orchestration if decay is flagged
            if all([shadow_dataset is not None, champion_model is not None, challenger_model is not None]):
                if not self.is_evaluating_challenger:
                    self._orchestrate_champion_challenger(shadow_dataset, champion_model, challenger_model)
                    
        return results

    def _orchestrate_champion_challenger(self, shadow_dataset: Tuple[np.ndarray, np.ndarray], champion_model: Any, challenger_model: Any):
        """
        Spins up a background processing worker that scores a shadowed validation dataset 
        against a newly updated model iteration, logging accuracy improvements.
        """
        def evaluation_worker():
            self.is_evaluating_challenger = True
            try:
                logger.info("Initializing Champion-Challenger Evaluation Sequence...")
                X_shadow, y_shadow = shadow_dataset
                
                # In production, models could be scikit-learn, XGBoost, or custom wrappers
                champ_preds = champion_model.predict(X_shadow)
                chall_preds = challenger_model.predict(X_shadow)
                
                from sklearn.metrics import accuracy_score, precision_score
                
                champ_acc = accuracy_score(y_shadow, champ_preds)
                chall_acc = accuracy_score(y_shadow, chall_preds)
                
                champ_prec = precision_score(y_shadow, champ_preds, zero_division=0)
                chall_prec = precision_score(y_shadow, chall_preds, zero_division=0)
                
                self.last_evaluation_metrics = {
                    "champion_accuracy": float(champ_acc),
                    "challenger_accuracy": float(chall_acc),
                    "champion_precision": float(champ_prec),
                    "challenger_precision": float(chall_prec)
                }
                
                logger.info(f"Evaluation Complete - Champion ACC: {champ_acc:.4f} | Challenger ACC: {chall_acc:.4f}")
                
                if chall_acc > champ_acc:
                    logger.warning("ALERT: Challenger model exceeds Champion accuracy on shadow dataset. Ready for crossover review.")
                else:
                    logger.info("Champion retains superiority. No crossover required.")
                    
            except Exception as e:
                logger.error(f"Champion-Challenger evaluation failed: {str(e)}")
            finally:
                self.is_evaluating_challenger = False

        worker_thread = threading.Thread(target=evaluation_worker, daemon=True)
        worker_thread.start()
