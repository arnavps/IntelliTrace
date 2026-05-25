"""
XGBoost Risk Evaluation Engine for IntelliTrace.
"""

import numpy as np
import xgboost as xgb
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, f1_score
from typing import Tuple, Dict, Any

class XGBoostRiskEngine:
    """
    Production-grade supervised machine learning pipeline using XGBoost 
    for per-transaction risk evaluation.
    """
    
    def __init__(self, 
                 n_estimators: int = 500, 
                 max_depth: int = 7, 
                 learning_rate: float = 0.05,
                 subsample: float = 0.8,
                 colsample_bytree: float = 0.8):
        """
        Initialize the XGBoost risk evaluation engine with optimal hyperparameters.
        """
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.subsample = subsample
        self.colsample_bytree = colsample_bytree
        self.model = None

    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        Train the XGBoost binary classifier using a 5-fold stratified cross-validation
        strategy and SMOTE oversampling exclusively on training folds.
        
        Args:
            X: Input feature matrix (n_samples, 163) [35 engineered + 128 GNN embeddings]
            y: Binary target labels (n_samples,) [0: legit, 1: fraud]
            
        Returns:
            Dictionary containing evaluation metrics across folds.
        """
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        
        fold_metrics = {"auc": [], "f1": []}
        
        # Tune scale_pos_weight directly against the empirical inverse ratio 
        # of negative-to-positive classes.
        n_neg = np.sum(y == 0)
        n_pos = np.sum(y == 1)
        scale_pos_weight = float(n_neg) / float(max(1, n_pos))
        
        best_f1 = -1.0
        best_model = None
        
        for train_idx, val_idx in skf.split(X, y):
            X_train, y_train = X[train_idx], y[train_idx]
            X_val, y_val = X[val_idx], y[val_idx]
            
            # Apply SMOTE oversampling exclusively on the training folds
            smote = SMOTE(random_state=42)
            X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
            
            model = xgb.XGBClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                learning_rate=self.learning_rate,
                subsample=self.subsample,
                colsample_bytree=self.colsample_bytree,
                scale_pos_weight=scale_pos_weight,
                objective="binary:logistic",
                eval_metric="auc",
                tree_method="hist", # Optimized for faster training
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(
                X_train_res, y_train_res,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            
            # Evaluate against the validation holdout set
            y_pred_proba = model.predict_proba(X_val)[:, 1]
            y_pred = model.predict(X_val)
            
            auc = roc_auc_score(y_val, y_pred_proba)
            f1 = f1_score(y_val, y_pred)
            
            fold_metrics["auc"].append(auc)
            fold_metrics["f1"].append(f1)
            
            if f1 > best_f1:
                best_f1 = f1
                best_model = model
                
        self.model = best_model
        
        return {
            "mean_auc": float(np.mean(fold_metrics["auc"])),
            "mean_f1": float(np.mean(fold_metrics["f1"])),
            "std_auc": float(np.std(fold_metrics["auc"])),
            "std_f1": float(np.std(fold_metrics["f1"]))
        }
        
    def predict_transaction_risk(self, feature_vector: np.ndarray) -> float:
        """
        Highly optimized real-time scoring function mapping incoming features 
        to a unified risk probability score spanning an integer range of 0 to 100.
        
        Target execution latency: < 5ms.
        
        Args:
            feature_vector: Numpy array of shape (163,) or (1, 163)
            
        Returns:
            Risk score as a float representing probability (0.0 to 100.0).
        """
        if self.model is None:
            raise RuntimeError("XGBoost model has not been trained yet.")
            
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)
            
        # Using booster directly bypasses scikit-learn wrapper overhead for ultra-low latency
        dmatrix = xgb.DMatrix(feature_vector)
        prob = self.model.get_booster().predict(dmatrix)[0]
        
        # Map to 0-100 range
        risk_score = float(prob * 100.0)
        return risk_score
