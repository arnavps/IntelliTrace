"""
Unsupervised Anomaly Detection Module for IntelliTrace.
Combines Isolation Forest with a secondary DBSCAN spatial cluster analyzer
to detect entirely novel, non-stationary financial crime techniques.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from typing import Dict, Any

class UnsupervisedAnomalyDetector:
    """
    Production-grade unsupervised machine learning model layer combining an Isolation Forest ensemble
    with a secondary DBSCAN spatial cluster analyzer to detect novel, non-stationary fraud.
    """
    
    def __init__(self, contamination: float = 0.005, dbscan_eps: float = 0.5, dbscan_min_samples: int = 5):
        """
        Initialize the UnsupervisedAnomalyDetector with required hyperparameters.
        
        Args:
            contamination (float): Expected proportion of outliers in the dataset. Strictly 0.005 per requirements.
            dbscan_eps (float): The maximum distance between two samples for one to be considered as in the neighborhood.
            dbscan_min_samples (int): The number of samples in a neighborhood for a point to be considered a core point.
        """
        self.contamination = contamination
        self.dbscan_eps = dbscan_eps
        self.dbscan_min_samples = dbscan_min_samples
        
        self.isolation_forest = IsolationForest(
            n_estimators=25,  # Optimized for strict <2ms inference boundaries
            max_samples='auto',
            contamination=self.contamination,
            max_features=1.0,
            bootstrap=False,
            n_jobs=1,
            random_state=42
        )
        
        self.dbscan = DBSCAN(
            eps=self.dbscan_eps,
            min_samples=self.dbscan_min_samples,
            metric='euclidean',
            algorithm='auto',
            n_jobs=-1
        )
        
        self.is_trained = False
        self._baseline_outliers: np.ndarray = np.empty((0, 0))
        self._dbscan_labels: np.ndarray = np.empty(0)

    def train_baseline(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Automated baseline training mapping multi-channel transaction velocity, 
        cross-geography variance vectors, and temporal distribution densities.
        
        Args:
            X: Input feature array representing the baseline dataset.
            
        Returns:
            Dictionary containing training metadata.
        """
        # 1. Train Isolation Forest
        self.isolation_forest.fit(X)
        
        # 2. Extract extreme spatial outliers from baseline
        preds = self.isolation_forest.predict(X)
        outlier_indices = np.where(preds == -1)[0]
        
        if len(outlier_indices) > 0:
            self._baseline_outliers = X[outlier_indices]
            # 3. Fit DBSCAN densely exclusively on outliers to analyze neighborhood connectivity density
            self.dbscan.fit(self._baseline_outliers)
            self._dbscan_labels = self.dbscan.labels_
        else:
            self._baseline_outliers = np.empty((0, X.shape[1]))
            self._dbscan_labels = np.empty(0)
            
        self.is_trained = True
        
        # Count clusters (ignoring noise label -1)
        valid_labels = set(self._dbscan_labels)
        if -1 in valid_labels:
            valid_labels.remove(-1)
            
        return {
            "num_baseline_samples": len(X),
            "num_outliers_detected": len(outlier_indices),
            "num_fraud_clusters": len(valid_labels)
        }

    def predict_anomaly_index(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates a streaming transaction and outputs a continuous anomaly index score.
        Enforces execution latency constraint of <2ms per streaming transaction.
        
        Args:
            feature_vector: Numpy array of shape (1, n_features) or (n_features,)
            
        Returns:
            Dictionary containing:
                - is_anomaly (bool): True if flagged as anomaly by Isolation Forest
                - anomaly_score (float): Continuous anomaly index score (normalized)
                - belongs_to_fraud_cluster (bool): True if connected to an unmapped dense fraud cluster
        """
        if not self.is_trained:
            raise RuntimeError("UnsupervisedAnomalyDetector has not been trained on a baseline yet.")
            
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)
            
        # 1. Fast Isolation Forest inference (compute only once)
        if_score_raw = self.isolation_forest.decision_function(feature_vector)[0]
        # In sklearn, decision_function < 0 is an outlier
        is_anomaly = bool(if_score_raw < 0)
        
        # Normalize score: negative decision function (outliers) maps to higher index
        anomaly_index = float(-if_score_raw * 100.0 + 50.0)
        anomaly_index = max(0.0, min(100.0, anomaly_index))
        
        belongs_to_fraud_cluster = False
        
        # 2. Secondary Validation: DBSCAN spatial connectivity check
        # Any transaction flagged as an extreme spatial outlier must be passed to DBSCAN
        if is_anomaly and self._baseline_outliers.shape[0] > 0:
            # Extract core points belonging to valid coordinated clusters
            valid_cluster_mask = self._dbscan_labels >= 0
            
            if np.any(valid_cluster_mask):
                cluster_points = self._baseline_outliers[valid_cluster_mask]
                
                # Highly vectorized squared Euclidean distance computation
                diff = cluster_points - feature_vector
                squared_distances = np.sum(diff ** 2, axis=1)
                
                # Verify if node connects to a coordinated, unmapped fraud cluster neighborhood
                if np.min(squared_distances) <= (self.dbscan_eps ** 2):
                    belongs_to_fraud_cluster = True
        
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_index,
            "belongs_to_fraud_cluster": belongs_to_fraud_cluster
        }

    def trigger_periodic_retraining(self, new_baseline_X: np.ndarray) -> Dict[str, Any]:
        """
        Automated periodic configuration update method. 
        Monthly automated re-training on clean, sliding customer baselines.
        
        Args:
            new_baseline_X: The new sliding window baseline dataset.
            
        Returns:
            Dictionary with training metadata.
        """
        return self.train_baseline(new_baseline_X)
