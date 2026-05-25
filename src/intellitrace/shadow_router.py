import json
import logging
import asyncio
import threading
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

import numpy as np
from sklearn.metrics import precision_recall_curve, auc

logger = logging.getLogger(__name__)

class ModelInterface:
    """
    Abstract interface guaranteeing structurally identical method signatures 
    between Champion and Challenger models.
    """
    def predict_risk(self, transaction: Dict[str, Any]) -> float:
        raise NotImplementedError
    
    def explain_shap(self, transaction: Dict[str, Any]) -> Dict[str, float]:
        raise NotImplementedError


class ShadowModeTrafficRouter:
    """
    Traffic Mirroring Service Class.
    Splits live production payloads seamlessly between an active Champion model 
    and a fully decoupled, read-only Challenger model pipeline.
    """
    def __init__(
        self, 
        champion_model: ModelInterface, 
        challenger_model: ModelInterface, 
        performance_db_path: str = "/var/log/intellitrace/shadow_metrics.jsonl"
    ):
        self.champion = champion_model
        self.challenger = challenger_model
        self.performance_db_path = performance_db_path

    async def _async_challenger_execution(self, transaction: Dict[str, Any], champion_score: float) -> None:
        """
        Completely isolated, decoupled execution pipeline for the Challenger model.
        Strictly operates in a read-only shadow state.
        """
        try:
            # 1. Challenger internal computation
            challenger_score = self.challenger.predict_risk(transaction)
            challenger_shap = self.challenger.explain_shap(transaction)
            
            # 2. Log Decoupled Results
            # Strictly blocked from mutating core banking parameters or firing case alerts
            record = {
                "transaction_id": transaction.get("id", "unknown_txn_id"),
                "timestamp": datetime.utcnow().isoformat(),
                "champion_score": champion_score,
                "challenger_score": challenger_score,
                "challenger_shap": challenger_shap,
                # Ground truth fraud labels might be populated asynchronously by investigators later
                "ground_truth_label": transaction.get("ground_truth_fraud_label", None)
            }
            
            # Append asynchronously to performance tracking datastore
            with open(self.performance_db_path, "a") as f:
                f.write(json.dumps(record) + "\n")
                
        except Exception as e:
            # CRITICAL ERROR BOUNDARY: Any internal failure within the challenger pipeline 
            # must be instantly contained. It is explicitly prevented from escalating or 
            # crashing the active champion ingestion thread.
            logger.error(
                f"[SHADOW MODE DROPOUT] Challenger evaluation failed critically: {str(e)}. "
                f"Isolating failure. Champion traffic remains strictly unimpacted."
            )

    def route_shadow_traffic(self, incoming_transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Intercepts transaction vectors from the live ingestion bus.
        Executes primary champion synchronously to ensure sub-millisecond response guarantees,
        while parallelizing the challenger asynchronously.
        """
        # ------------------------------------------------------------
        # 1. SYNCHRONOUS CHAMPION EXECUTION (Critical Path)
        # ------------------------------------------------------------
        try:
            champion_score = self.champion.predict_risk(incoming_transaction)
            champion_shap = self.champion.explain_shap(incoming_transaction)
        except Exception as champ_e:
            logger.error(f"[FATAL] Champion model pipeline failed to evaluate transaction: {str(champ_e)}")
            raise champ_e # Champion failures are critical and must escalate
        
        champion_result = {
            "model_version": "champion_v1",
            "risk_score": champion_score,
            "shap_attributions": champion_shap,
            "action": "FIRE_ALERT" if champion_score > 85.0 else "PASS"
        }
        
        # ------------------------------------------------------------
        # 2. ASYNCHRONOUS CHALLENGER DISPATCH (Shadow Path)
        # ------------------------------------------------------------
        try:
            loop = asyncio.get_running_loop()
            # Fire and forget shadow traffic via native event loop
            loop.create_task(self._async_challenger_execution(incoming_transaction, champion_score))
        except RuntimeError:
            # Failsafe boundary if no active event loop exists in the calling context
            # Delegates the async routine to an isolated background daemon thread
            threading.Thread(
                target=lambda: asyncio.run(
                    self._async_challenger_execution(incoming_transaction, champion_score)
                ), 
                daemon=True
            ).start()

        # ------------------------------------------------------------
        # 3. RETURN PRODUCTION STATE
        # ------------------------------------------------------------
        return champion_result

    def evaluate_precision_recall_curves(self, days_baseline: int = 30) -> Dict[str, Any]:
        """
        Automated background analytics pipeline. 
        Calculates and maps Precision-Recall curve AUCs between the Champion and Challenger models 
        over a specified rolling baseline window.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_baseline)
        y_true = []
        champ_scores = []
        chall_scores = []
        
        try:
            with open(self.performance_db_path, "r") as f:
                for line in f:
                    record = json.loads(line.strip())
                    record_time = datetime.fromisoformat(record["timestamp"])
                    
                    # Filter dataset to window and require explicit ground truth verification
                    if record_time >= cutoff_date and record.get("ground_truth_label") is not None:
                        y_true.append(record["ground_truth_label"])
                        champ_scores.append(record["champion_score"])
                        chall_scores.append(record["challenger_score"])
                        
            if len(y_true) < 20:
                logger.warning(
                    f"Insufficient ground truth labels detected for PR AUC evaluation. "
                    f"Found {len(y_true)}, require minimum 20 verified samples."
                )
                return {"status": "INSUFFICIENT_DATA"}
                
            # Compute Precision-Recall curve metrics for Active Champion
            champ_precision, champ_recall, _ = precision_recall_curve(y_true, champ_scores)
            champ_pr_auc = auc(champ_recall, champ_precision)
            
            # Compute Precision-Recall curve metrics for Shadow Challenger
            chall_precision, chall_recall, _ = precision_recall_curve(y_true, chall_scores)
            chall_pr_auc = auc(chall_recall, chall_precision)
            
            return {
                "status": "SUCCESS",
                "baseline_window_days": days_baseline,
                "total_evaluated_ground_truths": len(y_true),
                "metrics": {
                    "champion_pr_auc": float(champ_pr_auc),
                    "challenger_pr_auc": float(chall_pr_auc),
                    "challenger_performance_delta": float(chall_pr_auc - champ_pr_auc)
                },
                "recommendation": "DEPLOY_CHALLENGER" if chall_pr_auc > champ_pr_auc else "RETAIN_CHAMPION"
            }
            
        except FileNotFoundError:
            logger.error("Performance database log not found. Shadow pipeline may be empty.")
            return {"status": "DATABASE_UNAVAILABLE"}
        except Exception as e:
            logger.error(f"Critical error computing Precision-Recall curves: {str(e)}")
            return {"status": "EVALUATION_FAILURE"}
