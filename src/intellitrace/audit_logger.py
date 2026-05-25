import hashlib
import json
import uuid
import datetime
import logging
from enum import Enum
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    """Explicit enum for recognized system operational events."""
    TRANSACTION_SCORED = "TRANSACTION_SCORED"
    ALERT_TRIGGERED = "ALERT_TRIGGERED"
    CASE_REVIEWED = "CASE_REVIEWED"
    REPORT_FILED = "REPORT_FILED"
    NARRATIVE_GENERATED = "NARRATIVE_GENERATED"
    SYSTEM_OVERRIDE = "SYSTEM_OVERRIDE"


class CryptographicAuditLogger:
    """
    Enterprise-grade auditing class that builds a cryptographically signed, immutable 
    chain-of-custody ledger for all investigator and pipeline system actions.
    """
    def __init__(self):
        """Initializes an empty ledger starting from a genesis hash."""
        self.ledger: List[Dict[str, Any]] = []
        # Genesis block uses a default hash of 64 zeros
        self._last_hash = "0" * 64
        
    def _compute_hash(self, payload: Dict[str, Any]) -> str:
        """
        Computes SHA-256 hash of a JSON-serialized dictionary.
        Stable serialization is ensured by sorting keys.
        """
        payload_bytes = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        return hashlib.sha256(payload_bytes).hexdigest()

    def log_event(self, 
                  event_type: EventType,
                  actor_id: str,
                  affected_entity_ids: List[str],
                  action_summary: Dict[str, Any],
                  model_version: Optional[str] = None) -> Dict[str, Any]:
        """
        Writes a highly structural JSON log schema recording and links it via a 
        continuous SHA-256 hash chain model.
        
        Args:
            event_type: Explicit operational action.
            actor_id: Unique identifier tracking the specific system microservice or individual token.
            affected_entity_ids: Array listing every tokenized account or customer node impacted.
            action_summary: Detailed nested JSON object capturing configurations or actions.
            model_version: Optional string tracking active ML model IDs/feature hashes.
            
        Returns:
            The signed log payload dictionary.
        """
        event_id = str(uuid.uuid4())
        # UTC aware datetime with millisecond resolution
        event_timestamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        
        log_payload = {
            "event_id": event_id,
            "event_timestamp": event_timestamp,
            "event_type": event_type.value,
            "actor_id": actor_id,
            "affected_entity_ids": affected_entity_ids,
            "action_summary": action_summary,
            "model_version": model_version,
            "previous_hash": self._last_hash
        }
        
        # Current hash uniquely binds all internal properties of the current log + previous hash signature
        current_hash = self._compute_hash(log_payload)
        log_payload["current_hash"] = current_hash
        
        self.ledger.append(log_payload)
        self._last_hash = current_hash
        
        return log_payload

    def validate_ledger_integrity(self) -> bool:
        """
        Iterates chronologically through the entire log collection, recalculating hash matches
        to instantly detect unauthorized manual modifications or database tampering attempts.
        
        Returns:
            True if the ledger is cryptographically sound, False if any tampering is detected.
        """
        expected_prev_hash = "0" * 64
        for idx, entry in enumerate(self.ledger):
            # 1. Verify continuous chain linkage
            if entry.get("previous_hash") != expected_prev_hash:
                logger.critical(f"TAMPER DETECTED: Hash chain linkage broken at ledger index {idx}. "
                                f"Expected previous hash {expected_prev_hash}, found {entry.get('previous_hash')}")
                return False
                
            # 2. Extract and recalculate internal binding hash
            payload_to_hash = entry.copy()
            recorded_hash = payload_to_hash.pop("current_hash", None)
            
            if not recorded_hash:
                logger.critical(f"TAMPER DETECTED: Missing 'current_hash' at ledger index {idx}.")
                return False
                
            calculated_hash = self._compute_hash(payload_to_hash)
            
            # 3. Detect internal property modifications
            if calculated_hash != recorded_hash:
                logger.critical(f"TAMPER DETECTED: Payload signature mismatch at ledger index {idx}. "
                                f"Recorded: {recorded_hash}, Calculated: {calculated_hash}")
                return False
                
            # Valid block, advance pointer
            expected_prev_hash = recorded_hash
            
        return True
