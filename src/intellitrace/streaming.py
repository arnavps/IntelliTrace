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
from pyflink.datastream.functions import KeyedProcessFunction, FlatMapFunction
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


class LayeringEventDuplicator(FlatMapFunction):
    """
    Graph-streaming vector duplicator. Emits each ledger transaction twice:
    once as an INCOMING credit to the credit account, and once as an OUTGOING
    debit from the debit account, enabling unified single-account view.
    """
    def flat_map(self, value: str) -> Generator[str, None, None]:
        try:
            data = json.loads(value)
        except Exception:
            return
            
        credit_account = data.get("credit_account_id")
        debit_account = data.get("debit_account_id")
        amount = float(data.get("amount_inr", 0.0))
        txn_timestamp = data.get("txn_timestamp")
        txn_id = data.get("txn_id")
        channel = data.get("channel")
        lineage = data.get("lineage", {"origin_txn_id": txn_id, "hop_count": 0})
        
        # 1. Emit as INCOMING Credit
        if credit_account:
            yield json.dumps({
                "account_id": credit_account,
                "direction": "INCOMING",
                "counterparty_id": debit_account,
                "amount_inr": amount,
                "txn_timestamp": txn_timestamp,
                "txn_id": txn_id,
                "channel": channel,
                "lineage": lineage
            })
            
        # 2. Emit as OUTGOING Debit
        if debit_account:
            yield json.dumps({
                "account_id": debit_account,
                "direction": "OUTGOING",
                "counterparty_id": credit_account,
                "amount_inr": amount,
                "txn_timestamp": txn_timestamp,
                "txn_id": txn_id,
                "channel": channel,
                "lineage": lineage
            })


class RapidLayeringAnalyzer(KeyedProcessFunction):
    """
    Stateful Flink tumble-window module tracing rapid multi-hop asset layering.
    Matches accounts receiving >= 500,000 INR and transferring out >90% of it
    to >= 5 distinct counterparty accounts within a 15-minute tumbling window.
    """
    
    def __init__(self, alert_tag: OutputTag):
        self.alert_tag = alert_tag
        self.active_window_state = None
        self.credits_state = None
        self.debits_state = None

    def open(self, runtime_context):
        # Configure State TTL cleanup (2 hours persistence to cover the tumbling duration safely)
        window_ttl = StateTtlConfig.new_builder(Time.hours(2)) \
            .set_update_type(StateTtlConfig.UpdateType.OnCreateAndWrite) \
            .set_state_visibility(StateTtlConfig.StateVisibility.NeverReturnExpired) \
            .cleanup_in_rocksdb_compact_filter() \
            .build()
            
        # Value state for active window start (epoch ms)
        window_desc = ValueStateDescriptor("layering_active_window", Types.LONG())
        window_desc.enable_time_to_live(window_ttl)
        self.active_window_state = runtime_context.get_state(window_desc)
        
        # Value state for incoming credits list (JSON serialized)
        credits_desc = ValueStateDescriptor("layering_credits", Types.STRING())
        credits_desc.enable_time_to_live(window_ttl)
        self.credits_state = runtime_context.get_state(credits_desc)
        
        # Value state for outgoing debits list (JSON serialized)
        debits_desc = ValueStateDescriptor("layering_debits", Types.STRING())
        debits_desc.enable_time_to_live(window_ttl)
        self.debits_state = runtime_context.get_state(debits_desc)

    def process_element(self, value: str, ctx: KeyedProcessFunction.Context) -> Generator[str, None, None]:
        try:
            event = json.loads(value)
        except Exception:
            return

        account_id = event.get("account_id")
        direction = event.get("direction")
        amount = float(event.get("amount_inr", 0.0))
        txn_timestamp = event.get("txn_timestamp")
        txn_id = event.get("txn_id")
        
        try:
            dt = datetime.fromisoformat(txn_timestamp.replace("Z", "+00:00"))
            event_time_ms = int(dt.timestamp() * 1000)
        except Exception:
            return

        # 15 minutes in ms = 900000
        window_start = (event_time_ms // 900000) * 900000
        window_end = window_start + 900000

        # Load active window start
        active_start = self.active_window_state.value()

        if active_start is None:
            # First event for this window start -> Initialize states
            self.active_window_state.update(window_start)
            self.credits_state.update(json.dumps([]))
            self.debits_state.update(json.dumps([]))
            # Register tumbling window end timer
            ctx.timer_service().register_event_time_timer(window_end)
            active_start = window_start

        # Load appropriate state lists
        if direction == "INCOMING":
            state_str = self.credits_state.value()
            credits = json.loads(state_str) if state_str else []
            credits.append(event)
            self.credits_state.update(json.dumps(credits))
        elif direction == "OUTGOING":
            state_str = self.debits_state.value()
            debits = json.loads(state_str) if state_str else []
            debits.append(event)
            self.debits_state.update(json.dumps(debits))

    def on_timer(self, timestamp: int, ctx: KeyedProcessFunction.OnTimerContext) -> Generator[str, None, None]:
        # Timer fires at window_end. Evaluate tumbling window results!
        window_end = timestamp
        window_start = window_end - 900000

        active_start = self.active_window_state.value()
        if active_start is None or active_start != window_start:
            # No data or already cleaned up
            return

        credits_str = self.credits_state.value()
        debits_str = self.debits_state.value()
        
        credits = json.loads(credits_str) if credits_str else []
        debits = json.loads(debits_str) if debits_str else []

        if not credits or not debits:
            # No credits or no debits -> Clear state and return
            self.active_window_state.clear()
            self.credits_state.clear()
            self.debits_state.clear()
            return

        # Calculate metrics
        total_incoming = sum(float(c["amount_inr"]) for c in credits)
        total_outgoing = sum(float(d["amount_inr"]) for d in debits)
        distinct_recipients = set(d["counterparty_id"] for d in debits)
        distinct_recipients_count = len(distinct_recipients)

        # Layering Chaining criteria check:
        # 1. Incoming credit >= 500,000 INR
        # 2. Outgoing debit > 90% of incoming
        # 3. Fan-out to 5 or more distinct counterparty accounts
        is_layering = (
            total_incoming >= 500000.0 and
            total_outgoing >= 0.90 * total_incoming and
            distinct_recipients_count >= 5
        )

        if is_layering:
            import uuid
            
            # Trace lineage hop counts
            incoming_hops = []
            for c in credits:
                lineage = c.get("lineage", {})
                hop = lineage.get("hop_count", 0)
                incoming_hops.append(hop)
            
            # Outgoing hop is max incoming hop + 1
            max_incoming_hop = max(incoming_hops) if incoming_hops else 0
            outgoing_hop = max_incoming_hop + 1
            
            # Timestamp differences (millisecond resolution)
            first_credit_time = min(
                int(datetime.fromisoformat(c["txn_timestamp"].replace("Z", "+00:00")).timestamp() * 1000)
                for c in credits
            )
            last_debit_time = max(
                int(datetime.fromisoformat(d["txn_timestamp"].replace("Z", "+00:00")).timestamp() * 1000)
                for d in debits
            )
            elapsed_time_ms = last_debit_time - first_credit_time

            # Stamp debits with lineage tags
            stamped_debits = []
            for idx, d in enumerate(debits):
                stamped_debits.append({
                    "txn_id": d["txn_id"],
                    "counterparty_id": d["counterparty_id"],
                    "amount_inr": d["amount_inr"],
                    "txn_timestamp": d["txn_timestamp"],
                    "channel": d["channel"],
                    "sequence_in_chain": idx + 1,
                    "hop_count_from_origin": outgoing_hop
                })

            # Structured alert payload
            alert_payload = {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "RAPID_LAYERING_CHAIN_DETECTED",
                "severity": "CRITICAL",
                "monitored_account_id": ctx.get_current_key(),
                "tumbling_window_start": datetime.fromtimestamp(window_start / 1000, timezone.utc).isoformat(),
                "tumbling_window_end": datetime.fromtimestamp(window_end / 1000, timezone.utc).isoformat(),
                "total_incoming_credits_inr": round(total_incoming, 2),
                "total_outgoing_debits_inr": round(total_outgoing, 2),
                "transfer_out_ratio": round(total_outgoing / total_incoming, 4),
                "distinct_counterparties_fanout": distinct_recipients_count,
                "elapsed_time_ms": elapsed_time_ms,
                "incoming_credits": [
                    {
                        "txn_id": c["txn_id"],
                        "counterparty_id": c["counterparty_id"],
                        "amount_inr": c["amount_inr"],
                        "txn_timestamp": c["txn_timestamp"],
                        "channel": c["channel"]
                    } for c in credits
                ],
                "outgoing_layering_hops": stamped_debits,
                "triggered_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Emit alert to downstream tag
            ctx.output(self.alert_tag, json.dumps(alert_payload))
            
            # Emit alert to primary stream
            yield json.dumps(alert_payload)

        # Tumbling window completed -> Clear state
        self.active_window_state.clear()
        self.credits_state.clear()
        self.debits_state.clear()


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
    # 5.6. Tumbling Window Stateful Processing for Suspicious Rapid Layering
    # ------------------------------------------------------------------
    # Duplicate standard transactions into incoming credit and outgoing debit events
    duplicated_stream = main_processed_stream.flat_map(
        LayeringEventDuplicator(),
        output_type=Types.STRING()
    )
    
    # Key strictly by single account_id to track both credits and debits together
    layering_keyed_stream = duplicated_stream.key_by(
        lambda element: json.loads(element).get("account_id", ""),
        key_type=Types.STRING()
    )
    
    # Apply RapidLayeringAnalyzer stateful tumbling-window logic
    layering_alert_tag = OutputTag("intellitrace-layering-alerts", Types.STRING())
    layering_stream = layering_keyed_stream.process(
        RapidLayeringAnalyzer(layering_alert_tag),
        output_type=Types.STRING()
    )
    
    # Extract layering alerts side-output
    layering_alert_side_stream = layering_stream.get_side_output(layering_alert_tag)

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

    # Union all alert streams together to sink to a single alerts Kafka topic
    unified_alerts_stream = alert_side_stream.union(layering_alert_side_stream)

    # Bind Sinks to Flink Streams
    main_processed_stream.sink_to(enriched_sink).name("Kafka-Enriched-Sink")
    dlq_stream.sink_to(dlq_sink).name("Kafka-DLQ-Sink")
    unified_alerts_stream.sink_to(alert_sink).name("Kafka-Alerts-Sink")

    return env


if __name__ == "__main__":
    logger.info("Initializing baseline Flink streaming pipeline configuration...")
    env = create_flink_pipeline()
    try:
        env.execute("IntelliTrace-Stateful-Ingestion-Processor")
    except Exception as e:
        logger.error(f"Flink application pipeline failed execution: {e}")
        sys.exit(1)
