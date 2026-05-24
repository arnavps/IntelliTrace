# Apache Kafka 3.x Cluster Provisioning & Performance Tuning Plan

This document details the production-grade deployment specifications, topic structures, and client tuning properties for the **IntelliTrace Data Bus Layer**. 

Engineered to support a peak festival-season throughput scaling up to **150,000 Transactions Per Second (TPS)**, while guaranteeing absolute data durability, immutable audit compliance, and zone-isolated zero data-loss replication.

---

## 🗺️ High-Throughput Cluster Architecture Topology

To sustain 150,000 TPS with a replication factor of 3 across Availability Zones, we deploy a **6-Node Apache Kafka 3.x KRaft Cluster** distributed evenly across 3 Availability Zones (AZs) in a single cloud region (2 brokers per AZ).

```
          [ Availability Zone 1 ]   [ Availability Zone 2 ]   [ Availability Zone 3 ]
          +---------------------+   +---------------------+   +---------------------+
          |  Broker 1 (Leader)  |   |  Broker 3 (Follower)|   |  Broker 5 (Follower)|
          |  Broker 2 (Follower)|   |  Broker 4 (Leader)  |   |  Broker 6 (Leader)  |
          +---------------------+   +---------------------+   +---------------------+
                         \                     |                     /
                          \                    |                    /
                         [ Distributed Kafka Connect / Ingestion Nodes ]
```

### Zone-Isolated Durability Parameters:
- **Broker Placement:** `broker.rack` configured to match the zone identifier (e.g. `us-east-1a`, `us-east-1b`, `us-east-1c`) to enable rack-aware replica placement.
- **Minimum Replica Sync (ISR):** `min.insync.replicas=2` paired with replication factor 3. This ensures that even if an entire Availability Zone suffers a catastrophic blackout, the remaining two zones maintain a fully functional cluster with zero data loss.

---

## 📑 Core Topic Configurations & Creation Blueprints

All topic creations utilize the native `kafka-topics.sh` command line tool against our cluster bootstrap servers `kafka-bootstrap.internal:9092`.

### 1. `intellitrace.txns.raw`
- **Purpose:** Ingests raw transaction logs from banking channels at peak speeds. Optimized for write performance.
- **Partitioning:** **96 partitions** (distributes the 150k TPS load evenly to ~1,560 TPS per partition, allowing parallel processing by consumer groups).
- **Cleanup Policy:** `delete` (discard aged records after retention limits are reached).
- **Retention:** 7 days (`604800000` ms).
- **Segment Size:** 1 GB (`1073741824` bytes) to prevent directory file-descriptor exhaustion.
- **Compression:** `producer` (lz4 compressed binary packets are stored directly on the broker disk, saving CPU).

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka-bootstrap.internal:9092 \
  --topic intellitrace.txns.raw \
  --partitions 96 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000 \
  --config segment.bytes=1073741824 \
  --config compression.type=producer
```

---

### 2. `intellitrace.txns.enriched`
- **Purpose:** Tracks validated, tokenized, and schema-enforced transactions, injected with global risk tags.
- **Partitioning:** **96 partitions** (enables 1-to-1 downstream consumer routing from the raw topic).
- **Schema Enforcement:** Backed by **Confluent Schema Registry** (`http://schema-registry.internal:8081`) utilizing Apache Avro.
- **Cleanup Policy:** `delete`.
- **Retention:** 30 days (`2592000000` ms) for historical analytics profiling.
- **Segment Size:** 1 GB (`1073741824` bytes).

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka-bootstrap.internal:9092 \
  --topic intellitrace.txns.enriched \
  --partitions 96 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=delete \
  --config retention.ms=2592000000 \
  --config segment.bytes=1073741824 \
  --config compression.type=producer
```

---

### 3. `intellitrace.alerts.raw` & `intellitrace.alerts.scored`
- **Purpose:** Houses raw anomaly indicators and scored risk incidents for downstream case routing.
- **Partitioning:** **32 partitions** (lower throughput, but maintains solid routing elasticity).
- **Cleanup Policy:** `delete`.
- **Retention:** 90 days (`7776000000` ms) to align with standard alert investigation windows.
- **Segment Size:** 512 MB (`536870912` bytes).

```bash
# Create raw alerts topic
kafka-topics.sh --create \
  --bootstrap-server kafka-bootstrap.internal:9092 \
  --topic intellitrace.alerts.raw \
  --partitions 32 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=delete \
  --config retention.ms=7776000000 \
  --config segment.bytes=536870912 \
  --config compression.type=producer

# Create scored alerts topic
kafka-topics.sh --create \
  --bootstrap-server kafka-bootstrap.internal:9092 \
  --topic intellitrace.alerts.scored \
  --partitions 32 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=delete \
  --config retention.ms=7776000000 \
  --config segment.bytes=536870912 \
  --config compression.type=producer
```

---

### 4. `intellitrace.audit.events`
- **Purpose:** Strict, immutable compliance ledger tracking all administrator operations and critical ledger balance updates.
- **Partitioning:** **24 partitions** (highly structured, persistent flow).
- **Cleanup Policy:** `compact,delete` (retains the absolute latest state of each unique key infinitely, while deleting older records after 365 days).
- **Retention:** 1 Year (`31536000000` ms).
- **Compaction Settings:**
  - `segment.bytes`: 256 MB (`268435456` bytes) to allow segments to close faster, triggering log cleanups sooner.
  - `min.cleanable.dirty.ratio`: `0.2` (forces compaction tasks to execute as soon as 20% of the segment becomes duplicate records).
  - `min.compaction.lag.ms`: `86400000` (holds raw transaction records in standard chronological form for at least 24 hours before compacting them, enabling temporal debugging).

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka-bootstrap.internal:9092 \
  --topic intellitrace.audit.events \
  --partitions 24 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=compact,delete \
  --config retention.ms=31536000000 \
  --config segment.bytes=268435456 \
  --config min.cleanable.dirty.ratio=0.2 \
  --config min.compaction.lag.ms=86400000 \
  --config compression.type=producer
```

---

## ⚡ High-Throughput & Zero Data-Loss Tuning parameters

To ensure that 150,000 TPS surges do not result in network latency bottlenecks, broker overflows, or message drops, we enforce highly tuned client configurations.

### 1. Producer Tuning Properties (Zero Data Loss)

```properties
# ------------------------------------------------------------------
# Zero Data Loss & Absolute Consistency Enforcements
# ------------------------------------------------------------------
acks=all                                  # Force leader to wait for replica sync write acknowledgements
enable.idempotence=true                   # Enable broker-side duplicate detection for retried requests
max.in.flight.requests.per.connection=5   # Optimize concurrency while maintaining strict ordering guarantees
retries=2147483647                        # Retries indefinitely on transient network drops (resilience)
retry.backoff.ms=100                      # Wait 100ms before retrying requests to avoid thundering herd

# ------------------------------------------------------------------
# Scaling & Ingestion Throughput Buffering
# ------------------------------------------------------------------
compression.type=lz4                      # High-speed compression with extremely low CPU overhead
batch.size=131072                         # Buffer records up to 128 KB before writing to TCP socket (high TPS)
linger.ms=10                              # Artificial delay (10ms) to allow batches to accumulate under load
max.request.size=5242880                  # Max request size of 5 MB to support rich, nested Avro transaction lists
buffer.memory=67108864                    # Total memory size (64 MB) for record buffering (prevents blocking)
```

---

### 2. Consumer Tuning Properties (High Throughput & ordering)

```properties
# ------------------------------------------------------------------
# Rebalance Mitigation & Group Coordinator Optimization
# ------------------------------------------------------------------
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
# Graceful incremental assignment transfer prevents stop-the-world cluster pauses

session.timeout.ms=45000                  # Max heartbeat loss time before declaring consumer dead
max.poll.interval.ms=300000               # Max time allowed between consumer polls (5 minutes for heavy validations)
heartbeat.interval.ms=3000                # Sends heartbeat every 3 seconds to keep group allocation active

# ------------------------------------------------------------------
# Throughput Maximization & Batch Fetching
# ------------------------------------------------------------------
fetch.min.bytes=1048576                   # Fetch at least 1 MB of records at a time to optimize network I/O
fetch.max.wait.ms=500                     # Wait up to 500ms if 1 MB minimum is not met
max.partition.fetch.bytes=5242880         # Limit maximum returns per partition to 5 MB (prevents OOM errors)
max.poll.records=2000                     # Fetch up to 2,000 records in a single poll loop

# ------------------------------------------------------------------
# Commit & Audit semantic Guarantees
# ------------------------------------------------------------------
enable.auto.commit=false                  # Disable automatic commits to control transactional safety manually
auto.offset.reset=earliest                # Fallback to partition beginning if no valid offsets exist
```

---

## 🔒 Strict Message Ordering Guarantee Per Account ID Key

Under core banking constraints, operations affecting the same account (e.g. `debit` must happen before `credit` verification checks) must be processed in **exact chronological order**.

In Apache Kafka, ordering is guaranteed **only within a single partition**. To ensure that all transaction events for a specific account end up in the exact same partition, we configure our ingestion producers to use the `account_id` (specifically, `debit_account_id` or `credit_account_id` mapped via a consistent routing identifier) as the **Kafka Record Key**.

```
                           [ Producer Ingestion Stream ]
                           +--------------------------+
                           | Key: ACC_HASH_12A  -> P1 |
                           | Key: ACC_HASH_84B  -> P2 |
                           | Key: ACC_HASH_12A  -> P1 |
                           +--------------------------+
                                     /      \
                                    /        \
                                   /          \
                [ Partition 1 ]                  [ Partition 2 ]
                +-------------+                  +-------------+
                | ACC_HASH_12A| (First)          | ACC_HASH_84B|
                | ACC_HASH_12A| (Second)         +-------------+
                +-------------+
                (Strict Order Preserved)
```

By hashing this key, Kafka's default murmur2 partitioner guarantees that all events with the key `ACC_HASH_12A` are routed to the same partition, assuring **100% thread-safe chronological ordering** for all consumers!
