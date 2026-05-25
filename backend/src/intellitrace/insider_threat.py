import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class InsiderThreatFusionLayer:
    """
    Identity Access Management (IAM) Analytics & Internal Fraud Detection.
    Cross-correlates external fund flow anomalies with internal CBS employee access logs 
    to detect rogue insiders facilitating multi-hop transaction structures.
    """
    
    def __init__(self, volatility_limit: float = 3.5):
        """
        Initializes the Insider Threat Fusion Layer.
        
        Args:
            volatility_limit: The operational variance limit. If an employee's volatility 
                              index crosses this, the alert is automatically escalated to CRITICAL.
        """
        self.volatility_limit = volatility_limit
        
    def calculate_employee_volatility(self, employee_actions: List[Dict[str, Any]]) -> float:
        """
        Calculates a customized employee volatility index based on their specific
        actions (initiations, authorizations, manual reviews, overrides) across a suspicious chain.
        """
        weight_map = {
            "LOGIN": 0.1,
            "DATA_ACCESS": 0.5,
            "INITIATE": 1.0,
            "REVIEW": 1.5,
            "AUTHORIZE": 2.0,
            "SYSTEM_OVERRIDE": 3.0,
        }
        
        index = 0.0
        for action in employee_actions:
            action_type = action.get("action_type", "UNKNOWN")
            base_weight = weight_map.get(action_type, 0.5)
            
            # Additional penalty if system override flag is actively set
            if action.get("system_override_flag") is True:
                base_weight += 2.0
                
            index += base_weight
            
        return index

    def evaluate_chain(
        self,
        fund_flow_chain: List[Dict[str, Any]],
        cbs_telemetry_logs: List[Dict[str, Any]],
        composite_ml_score: float,
        current_severity: str
    ) -> Dict[str, Any]:
        """
        Cross-correlates fund flow chain with active core banking system (CBS) logs to identify 
        internal operational telemetry flags against specific nodes and transaction edges.
        
        Args:
            fund_flow_chain: List of transaction objects representing a rapid layering/round-tripping cluster.
            cbs_telemetry_logs: List of dictionaries representing CBS employee operational telemetry logs.
            composite_ml_score: Original machine learning risk score.
            current_severity: Original severity state.
            
        Returns:
            Dictionary containing elevated alert parameters and cross-domain evidence objects.
        """
        # 1. Map all targeted transactions in the suspicious multi-hop chain
        chain_txn_ids = {txn["transaction_id"] for txn in fund_flow_chain}
        
        # 2. Extract employee telemetry specifically overlapping with these transaction edges
        chain_logs = [log for log in cbs_telemetry_logs if log.get("transaction_id") in chain_txn_ids]
        
        # 3. Group actions by internal employee profile (user ID / operator token)
        employee_activity: Dict[str, List[Dict[str, Any]]] = {}
        for log in chain_logs:
            emp_id = log.get("employee_id")
            if emp_id:
                if emp_id not in employee_activity:
                    employee_activity[emp_id] = []
                employee_activity[emp_id].append(log)
                
        # 4. Compute customized employee volatility indices
        highest_volatility = 0.0
        most_volatile_employee = None
        volatile_employee_actions = []
        
        for emp_id, actions in employee_activity.items():
            vol_index = self.calculate_employee_volatility(actions)
            if vol_index > highest_volatility:
                highest_volatility = vol_index
                most_volatile_employee = emp_id
                volatile_employee_actions = actions
                
        # 5. Build base output payload
        alert_payload = {
            "original_ml_score": composite_ml_score,
            "final_ml_score": composite_ml_score,
            "original_severity": current_severity,
            "final_severity": current_severity,
            "insider_threat_detected": False,
            "employee_volatility_index": round(highest_volatility, 2),
            "cross_domain_evidence": None
        }
        
        # 6. Risk Elevation Logic: Override composite machine learning risk score if limit is breached
        if highest_volatility >= self.volatility_limit and most_volatile_employee is not None:
            alert_payload["insider_threat_detected"] = True
            alert_payload["final_severity"] = "CRITICAL"
            alert_payload["final_ml_score"] = 100.0  # Max out risk score for explicit override
            
            # Construct comprehensive cross-domain evidence object linking external and internal parameters
            terminal_sessions = list(set(a.get("terminal_session_id") for a in volatile_employee_actions if "terminal_session_id" in a))
            auth_timestamps = [a.get("timestamp") for a in volatile_employee_actions if "timestamp" in a]
            
            evidence = {
                "compromised_employee_id": most_volatile_employee,
                "fund_flow_chain_length": len(fund_flow_chain),
                "transactions_compromised": len(set(a["transaction_id"] for a in volatile_employee_actions)),
                "terminal_session_ids": terminal_sessions,
                "authorization_timestamps": auth_timestamps,
                "system_override_flags_used": any(a.get("system_override_flag") for a in volatile_employee_actions),
                "override_approvals_count": sum(1 for a in volatile_employee_actions if a.get("action_type") in ("SYSTEM_OVERRIDE", "AUTHORIZE")),
                "raw_audit_trail": volatile_employee_actions
            }
            alert_payload["cross_domain_evidence"] = evidence
            
            logger.critical(
                f"INSIDER THREAT OVERRIDE: Employee {most_volatile_employee} crossed operational variance "
                f"limit ({highest_volatility:.2f} >= {self.volatility_limit}). Alert escalated to fixed CRITICAL severity."
            )
            
        return alert_payload
