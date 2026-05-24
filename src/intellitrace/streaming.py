"""
Apache Flink 1.18 Stateful Streaming application.

Establishes the baseline core streaming topography for IntelliTrace transaction streams
configured with RocksDB State Backends, exactly-once incremental checkpointing,
bounded watermark generators, and robust Dead Letter Queue (DLQ) side-outputs.
"""

from datetime import datetime, timezone
import json
import logging
import sys
from typing import Generator, Any, Dict

from pyflink.common import (
    CheckpointingMode,
    ExternalizedCheckpointCleanup,
    Types,
    WatermarkStrategy,
    Duration,
)
from pyflink.common.time import Time
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.watermark import TimestampAssigner
from pyflink.datastream import StreamExecutionEnvironment, OutputTag
from pyflink.datastream.connectors.kafka import (
    KafkaSource,
    KafkaSink,
    KafkaRecordSerializationSchema,
    DeliveryGuarantee,
)
from pyflink.datastream.state_backend import EmbeddedRocksDBStateBackend
from pyflink.datastream.functions import KeyedProcessFunction
from pyflink.datastream.state import StateTtlConfig, ValueStateDescriptor


# Setup system logging framework via Slf4j/Log4j console bindings
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("IntelliTrace.Streaming")


class TransactionTimestampAssigner(TimestampAssigner):
    """
    Event-time extractor for normalized transaction payloads.
    
    Parses 'txn_timestamp' ISO8601 strings and maps them to epoch milliseconds.
    """
    
    def extract_timestamp(self, element: str, record_timestamp: int) -> int:
        try:
            data = json.loads(element)
            ts_str = data.get("txn_timestamp")
            if ts_str:
                # Force replace Z suffix for fromisoformat compatibility
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                return int(dt.timestamp() * 1000)
        except Exception as e:
            logger.warning(f"Failed to assign event-time timestamp: {e} for payload: {element}")
        
        # Fallback to ingestion record timestamp if parsing fails
        return record_timestamp


class IngestionProcessFunction(KeyedProcessFunction):
    """
    Keyed stateful process boundary monitoring ingestion pipelines.
    
    Filters structurally corrupted payloads, invalid formats, and late arrivals
    (falling outside the 5s bounded out-of-orderness watermark lag window)
    routing them to a Dead Letter Queue (DLQ) side-output, while letting healthy
    in-order records pass through the main pipeline.
    """
    
    def __init__(self, dlq_tag: OutputTag):
        self.dlq_tag = dlq_tag

    def process_element(self, value: str, ctx: KeyedProcessFunction.Context) -> Generator[str, None, None]:
        # 1. Attempt standard JSON parsing
        try:
            data = json.loads(value)
        except Exception as e:
            # Corrupted / Malformed JSON -> Route to DLQ
            ctx.output(
                self.dlq_tag,
                json.dumps({
                    "raw_payload": value,
                    "reason": f"JSON Parsing Failure: {e}",
                    "error_type": "MALFORMED_JSON",
                    "failed_at": datetime.now(timezone.utc).isoformat()
                })
            )
            return

        # 2. Schema integrity check (mandatory transactional fields validation)
        required_fields = ["txn_timestamp", "debit_account_id", "credit_account_id", "amount_inr", "channel"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            # Structurally Corrupted -> Route to DLQ
            ctx.output(
                self.dlq_tag,
                json.dumps({
                    "raw_payload": value,
                    "reason": f"Structural Validation Failure. Missing mandatory fields: {missing}",
                    "error_type": "STRUCTURAL_CORRUPTION",
                    "failed_at": datetime.now(timezone.utc).isoformat()
                })
            )
            return

        # 3. Check for late data based on Flink's current event-time watermark
        try:
            ts_str = data["txn_timestamp"]
            dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            event_time_ms = int(dt.timestamp() * 1000)
        except Exception as e:
            # Malformed datetime format -> Route to DLQ
            ctx.output(
                self.dlq_tag,
                json.dumps({
                    "raw_payload": value,
                    "reason": f"Malformed Timestamp format: {e}",
                    "error_type": "MALFORMED_TIMESTAMP",
                    "failed_at": datetime.now(timezone.utc).isoformat()
                })
            )
            return

        # Get Flink's current watermark
        current_watermark = ctx.timer_service().current_watermark()
        
        # Long.MIN_VALUE in Flink is -9223372036854775808. Checking if watermark has started advancing.
        if current_watermark > -9223372036854775808 and event_time_ms < current_watermark:
            # Excessively late data outside the 5s out-of-orderness watermark boundary -> Route to DLQ
            ctx.output(
                self.dlq_tag,
                json.dumps({
                    "raw_payload": value,
                    "reason": (
                        f"Excessively late data. Event timestamp '{ts_str}' (epoch: {event_time_ms}ms) "
                        f"arrived after the current Flink watermark has advanced to {current_watermark}ms."
                    ),
                    "error_type": "LATE_DATA",
                    "failed_at": datetime.now(timezone.utc).isoformat()
                })
            )
            return

        # 4. Transaction is healthy and timely -> emit to main stream
        yield value


class SmurfingPatternSelectFunction:
    """
    Selects, parses, and aggregates matching fraud smurfing interaction segments.
    Computes statistical variance and outputs structured alert payloads.
    """
    
    def select_pattern(self, credit_account_id: str, sequence: list, current_risk_score: int) -> dict:
        import uuid
        
        amounts = [float(txn["amount_inr"]) for txn in sequence]
        n = len(amounts)
        
        # Calculate mean and variance
        mean = sum(amounts) / n if n > 0 else 0.0
        variance = sum((x - mean) ** 2 for x in amounts) / n if n > 0 else 0.0
        aggregated_sum = sum(amounts)
        
        # Formulate structured alert JSON payload
        alert_payload = {
            "alert_id": str(uuid.uuid4()),
            "alert_type": "SMURFING_PATTERN_DETECTED",
            "credit_account_id": credit_account_id,
            "matching_sequence_length": n,
            "aggregated_sum_inr": round(aggregated_sum, 2),
            "variance_inr": round(variance, 4),
            "risk_score_modifier": 90,
            "updated_risk_score": current_risk_score + 90,
            "matching_transactions": [
                {
                    "txn_id": txn["txn_id"],
                    "txn_timestamp": txn["txn_timestamp"],
                    "amount_inr": float(txn["amount_inr"])
                } for txn in sequence
            ],
            "triggered_at": datetime.now(timezone.utc).isoformat()
        }
        
        return alert_payload


class SmurfingPatternDetector(KeyedProcessFunction):
    """
    Complex Event Processing (CEP) module tracking structural asset fragmentation.
    Matches accounts receiving >10 consecutive credits (10,000 to 49,999 INR)
    within a 60-minute sliding window totaling >= 500,000 INR.
    """
    
    def __init__(self, alert_tag: OutputTag):
        self.alert_tag = alert_tag
        self.sequence_state = None
        self.risk_state = None
        self.selector = SmurfingPatternSelectFunction()

    def open(self, runtime_context):
        # Configure State TTL cleanup (60 minutes window expiration)
        sequence_ttl = StateTtlConfig.new_builder(Time.minutes(60)) \
            .set_update_type(StateTtlConfig.UpdateType.OnCreateAndWrite) \
            .set_state_visibility(StateTtlConfig.StateVisibility.NeverReturnExpired) \
            .cleanup_in_rocksdb_compact_filter() \
            .build()
            
        # Configure Risk Score TTL (30 days persistence)
        risk_ttl = StateTtlConfig.new_builder(Time.days(30)) \
            .set_update_type(StateTtlConfig.UpdateType.OnCreateAndWrite) \
            .set_state_visibility(StateTtlConfig.StateVisibility.NeverReturnExpired) \
            .cleanup_in_rocksdb_compact_filter() \
            .build()
            
        # Initialize running sequence state
        sequence_desc = ValueStateDescriptor("smurfing_sequence", Types.STRING())
        sequence_desc.enable_time_to_live(sequence_ttl)
        self.sequence_state = runtime_context.get_state(sequence_desc)
        
        # Initialize risk ledger profile state
        risk_desc = ValueStateDescriptor("risk_score", Types.INT())
        risk_desc.enable_time_to_live(risk_ttl)
        self.risk_state = runtime_context.get_state(risk_desc)

    def process_element(self, value: str, ctx: KeyedProcessFunction.Context) -> Generator[str, None, None]:
        try:
            data = json.loads(value)
        except Exception:
            # Drop malformed logs silently (already handled by IngestionProcessFunction)
            return

        credit_account = data.get("credit_account_id")
        if not credit_account:
            return

        amount = float(data.get("amount_inr", 0.0))
        txn_timestamp = data.get("txn_timestamp")
        txn_id = data.get("txn_id")

        # Parse timestamp to epoch ms
        try:
            dt = datetime.fromisoformat(txn_timestamp.replace("Z", "+00:00"))
            event_time_ms = int(dt.timestamp() * 1000)
        except Exception:
            return

        # Load active sequence state
        state_str = self.sequence_state.value()
        sequence = json.loads(state_str) if state_str else []

        # Check threshold constraints for placement (circumvention range: [10000, 49999])
        in_range = (10000.0 <= amount <= 49999.0)

        if not in_range:
            # Consecutive streak broken -> Reset the sequence state
            self.sequence_state.clear()
            return

        # In-range: slide the 60-minute window (evict entries older than event_time - 1 hour)
        cutoff_time = event_time_ms - 3600000  # 60 minutes in ms
        sequence = [t for t in sequence if t["timestamp_ms"] >= cutoff_time]

        # Append new transaction
        sequence.append({
            "txn_id": txn_id,
            "txn_timestamp": txn_timestamp,
            "timestamp_ms": event_time_ms,
            "amount_inr": amount
        })

        # Save back updated sequence
        self.sequence_state.update(json.dumps(sequence))

        # Check smurfing pattern criteria:
        # 1. Greater than 10 consecutive credits (sequence length > 10, i.e., >= 11 entries)
        # 2. Aggregated summation >= 500,000 INR
        total_sum = sum(float(t["amount_inr"]) for t in sequence)
        
        if len(sequence) > 10 and total_sum >= 500000.0:
            # Pattern Matched!
            # Load and update risk score ledger
            current_risk = self.risk_state.value()
            if current_risk is None:
                current_risk = 0
            
            # Increment by +90 points
            new_risk = current_risk + 90
            self.risk_state.update(new_risk)
            
            # Select pattern via PatternSelectFunction
            alert = self.selector.select_pattern(credit_account, sequence, current_risk)
            
            # Emit alert payload to downstream side-output
            ctx.output(self.alert_tag, json.dumps(alert))
            
            # Emit to primary stream
            yield json.dumps(alert)


def create_flink_pipeline(
    bootstrap_servers: str = "kafka-bootstrap.internal:9092",
    source_topic: str = "intellitrace.txns.raw",
    enriched_sink_topic: str = "intellitrace.txns.enriched",
    dlq_sink_topic: str = "intellitrace.txns.dlq",
    alert_sink_topic: str = "intellitrace.alerts.raw",
    checkpoint_dir: str = "file:///tmp/flink/checkpoints"
) -> StreamExecutionEnvironment:
    """
    Factory constructing the stateful PyFlink 1.18 execution pipeline.
    """
    
    # Instantiate Flink JVM execution environment
    env = StreamExecutionEnvironment.get_execution_environment()
    
    # ------------------------------------------------------------------
    # 1. State Backend Setup (Embedded RocksDB State Backend)
    # ------------------------------------------------------------------
    # Enable incremental checkpointing (highly optimized for fast check-pointing under high TPS)
    state_backend = EmbeddedRocksDBStateBackend(True)
    env.set_state_backend(state_backend)
    
    # Configure Flink task resources allocation parallelism (tuned for CBS cluster workloads)
    env.set_parallelism(4)
    
    # ------------------------------------------------------------------
    # 2. Checkpointing & Fault Tolerance Configurations
    # ------------------------------------------------------------------
    chk_config = env.get_checkpoint_config()
    
    # Specify exactly 60-second checkpoint intervals
    chk_config.set_checkpoint_interval(60000)
    
    # Enforce EXACTLY_ONCE processing guarantees
    chk_config.set_checkpointing_mode(CheckpointingMode.EXACTLY_ONCE)
    
    # Implement 10-second minimum pause between checkpoints
    chk_config.set_min_pause_between_checkpoints(10000)
    
    # Enforce 5-minute execution timeout bound
    chk_config.set_checkpoint_timeout(300000)
    
    # Keep externalized checkpoints when the job is cancelled or fails
    chk_config.enable_externalized_checkpoints(
        ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
    )
    
    # ------------------------------------------------------------------
    # 3. Kafka Source & Consumer Initialization
    # ------------------------------------------------------------------
    kafka_source = KafkaSource.builder() \
        .set_bootstrap_servers(bootstrap_servers) \
        .set_topics(source_topic) \
        .set_group_id("flink-intellitrace-ledger-group") \
        .set_value_only_deserializer(SimpleStringSchema()) \
        .build()

    # ------------------------------------------------------------------
    # 4. Watermark Strategy (5s Bounded Out-Of-Orderness lag)
    # ------------------------------------------------------------------
    watermark_strategy = WatermarkStrategy.for_bounded_out_of_orderness_backness(
        Duration.of_seconds(5)
    ).with_timestamp_assigner(TransactionTimestampAssigner())

    # Build primary stream mapping and apply event time watermarking
    raw_stream = env.from_source(
        kafka_source, 
        watermark_strategy, 
        "Kafka-Transactions-Source"
    )

    # ------------------------------------------------------------------
    # 5. Stateful KeyBy Partition Routing & DLQ Side-Output Slicing
    # ------------------------------------------------------------------
    # Instantiate the DLQ side-output tag
    dlq_tag = OutputTag("intellitrace-dlq", Types.STRING())

    # Key strictly by debit_account_id to guarantee chronological ordering
    # MURMUR3 hash partitioner distributes account flows across Flink operators
    keyed_stream = raw_stream.key_by(
        lambda element: json.loads(element).get("debit_account_id", ""),
        key_type=Types.STRING()
    )

    # Apply process function to split standard, late, and corrupted transactions
    main_processed_stream = keyed_stream.process(
        IngestionProcessFunction(dlq_tag),
        output_type=Types.STRING()
    )

    # Extract DLQ side-output stream
    dlq_stream = main_processed_stream.get_side_output(dlq_tag)

    # ------------------------------------------------------------------
    # 5.5. Complex Event Processing (CEP) for Fraud Smurfing Patterns
    # ------------------------------------------------------------------
    # Instantiate the alerts side-output tag
    alert_tag = OutputTag("intellitrace-alerts", Types.STRING())

    # Partition strictly by credit_account_id to aggregate receiver events
    fraud_keyed_stream = main_processed_stream.key_by(
        lambda element: json.loads(element).get("credit_account_id", ""),
        key_type=Types.STRING()
    )

    # Apply the SmurfingPatternDetector stateful operator
    alert_stream = fraud_keyed_stream.process(
        SmurfingPatternDetector(alert_tag),
        output_type=Types.STRING()
    )

    # Extract alert side-output stream
    alert_side_stream = alert_stream.get_side_output(alert_tag)

    # ------------------------------------------------------------------
    # 6. Primary, Secondary and Fraud Alert Kafka Event Sinks (RF 3)
    # ------------------------------------------------------------------
    # Primary Enriched Topic Sink
    enriched_sink = KafkaSink.builder() \
        .set_bootstrap_servers(bootstrap_servers) \
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(enriched_sink_topic)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        ) \
        .set_delivery_guarantee(DeliveryGuarantee.AT_LEAST_ONCE) \
        .build()

    # Secondary DLQ Topic Sink
    dlq_sink = KafkaSink.builder() \
        .set_bootstrap_servers(bootstrap_servers) \
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(dlq_sink_topic)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        ) \
        .set_delivery_guarantee(DeliveryGuarantee.AT_LEAST_ONCE) \
        .build()

    # Downstream raw alert Kafka topic Sink
    alert_sink = KafkaSink.builder() \
        .set_bootstrap_servers(bootstrap_servers) \
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(alert_sink_topic)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        ) \
        .set_delivery_guarantee(DeliveryGuarantee.AT_LEAST_ONCE) \
        .build()

    # Bind Sinks to Flink Streams
    main_processed_stream.sink_to(enriched_sink).name("Kafka-Enriched-Sink")
    dlq_stream.sink_to(dlq_sink).name("Kafka-DLQ-Sink")
    alert_side_stream.sink_to(alert_sink).name("Kafka-Alerts-Sink")

    return env


if __name__ == "__main__":
    logger.info("Initializing baseline Flink streaming pipeline configuration...")
    env = create_flink_pipeline()
    try:
        env.execute("IntelliTrace-Stateful-Ingestion-Processor")
    except Exception as e:
        logger.error(f"Flink application pipeline failed execution: {e}")
        sys.exit(1)
