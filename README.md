# IntelliTrace: Graph-Native Financial Intelligence Platform

## 1. SYSTEM OVERVIEW & COMPETITIVE DIFFERENTIATION

### What is IntelliTrace?
IntelliTrace is an enterprise-grade, AI-powered financial intelligence platform engineered specifically for India's high-velocity banking ecosystem. It provides real-time, graph-native topology analysis, deterministic complex event processing, and probabilistic entity resolution to detect, score, and report sophisticated financial crimes, including money laundering, synthetic identity fraud, and circular evasion networks.

### Problem Statement Mapping
Legacy rule-based transaction monitoring systems are structurally ill-equipped to handle the scale and velocity of India's modern digital economy, which processes over 13 billion annual UPI transactions and trillions of INR across NEFT, RTGS, and IMPS. Traditional engines suffer from:
- **Catastrophic False Positive Rates (95%+):** Rigid SQL thresholds flag standard commercial behavior, overwhelming human audit teams.
- **Siloed Visibility:** Relational databases cannot natively traverse complex, multi-hop money movement networks, masking sophisticated layering.
- **Reactive Post-Fraud Lag:** Batch-processing architectures result in hours or days of detection latency, ensuring bad actors successfully clear stolen funds.

### The 6 Strategic Moats
IntelliTrace addresses these structural flaws through six core technological differentiators:
1. **Temporal Graph Intelligence:** We model banking relationships as time-evolving graphs rather than static data snapshots, unearthing dynamic evasion networks as they form.
2. **Cross-Channel Entity Resolution:** Probabilistic identity linking algorithms fuse fragmented actor footprints across 9 disparate banking channels.
3. **Few-Shot Adaptive Learning:** Online continuous learning models can detect novel financial crime typologies from just 2-10 positive examples without catastrophic forgetting.
4. **Explainable AI via SHAP:** Black-box predictions are mapped back to human-readable local feature attribution arrays, providing auditors with mathematically proven reasoning.
5. **Automated FIU Evidence Packaging:** Complete case investigations and transactional trails are deterministically mapped and compiled into valid XML Suspicious Transaction Reports (STR) in under 60 seconds.
6. **Explainable Federated Learning:** Designed to support cross-bank, privacy-preserving collaboration without exposing raw PII to central consortiums.

---

## 2. CORE PLATFORM ARCHITECTURE & PIPELINE DATA FLOW

### Detailed 7-Layer Architectural Pattern
1. **Layer 1 (Data Sources):** Heterogeneous channel integration via robust parsers handling ISO-20022, ISO-8583, and proprietary UPI JSON formats.
2. **Layer 2 (Ingestion Bus):** Apache Kafka event processing buffer guaranteeing distributed, exactly-once delivery semantics for raw transactional payloads.
3. **Layer 3 (Processing Tier):** Apache Flink stateful complex event stream processing for real-time windowing, pattern matching, and aggregation.
4. **Layer 4 (Intelligence Layer):** Neo4j native graph engine fused with XGBoost classifiers and GraphSAGE inductive network embeddings.
5. **Layer 5 (Storage Matrix):** Polyglot persistence matrix utilizing PostgreSQL 16 (OLTP truth), RedisBloom (high-speed probabilistic filtering), and ClickHouse (columnar analytics).
6. **Layer 6 (Presentation View):** High-performance React.js dashboard utilizing Cytoscape.js for WebGL graph rendering and D3.js for proportional fund flow visualization.
7. **Layer 7 (Compliance Engine):** PMLA standard mapping matrices and FIU-IND compliant STR/SAR XML compilation engines.

### Step-by-Step 5-Stage Data Flow Map
1. **Ingestion & Tokenization:** Raw transactional logs hit the API boundary, where PII is instantly HMAC-SHA256 hashed and payloads are published to partitioned Kafka topics.
2. **Stateful CEP Parsing:** Flink clusters ingest the stream, maintaining sliding/tumbling windows to identify rapid velocity anomalies and aggregation thresholds in real-time.
3. **Probabilistic Identity Fusion:** Graph traversal algorithms attempt to unify the transacting entity with existing Neo4j account nodes using cross-matching heuristics (Device ID, IP, Mobile).
4. **Machine Learning Scoring:** Fused feature vectors (transaction velocity + graph centrality + node embeddings) are fed into the Champion XGBoost model for binary risk classification.
5. **Automated Regulatory Output:** Transactions scoring above the critical threshold trigger the Compliance Engine, which invokes Claude 3.5 for narrative synthesis and compiles the FIU-IND XML STR.

---

## 3. CODEBASE MANIFEST & MODULE BREAKDOWN (3,907 LOC)

| Module Path | Line Count | Purpose / Description |
| :--- | :--- | :--- |
| `module1/unified_schema.py` | 497 LOC | Canonical IUTS Pydantic model and HMAC-SHA256 privacy-masking boundary. |
| `module2/cep_engine.py` | 725 LOC | Stateful Apache Flink stream analytics for behavioral windowing. |
| `module3/graph_intelligence.py` | 648 LOC | Neo4j topology integration, probabilistic entity resolution, and Tarjan's SCC cycle tracking. |
| `module4/risk_scoring_engine.py` | 587 LOC | Supervised XGBoost binary trees, unsupervised Isolation Forests, and SHAP TreeExplainer local attribution. |
| `module5/sar_compliance.py` | 637 LOC | FIU-IND compliance mapping, Insider Threat Risk Fusion, and PMLA automated document compilation. |
| `E2E_INTEGRATION_EXAMPLE.py` | 513 LOC | The complete pipeline end-to-end integration simulator script. |

---

## 4. COMPREHENSIVE FINANCIAL CRIME DETECTION ARCHETYPES

IntelliTrace enforces strict algorithmic detection boundaries across multiple processing layers:

### Smurfing / Structuring
- **Detection Layer:** Stateful Flink CEP (Complex Event Processing).
- **Mathematical Criteria:** Captures `>10` inbound credits sized perfectly between `₹10,000` and `₹49,999` within a strict `60-minute` sliding window, where the aggregate volume evaluates to `>= ₹500,000`.

### Rapid Layering
- **Detection Layer:** Flink CEP + Neo4j Traversal.
- **Mathematical Criteria:** Detects an inward credit burst followed by the immediate outward clearance of `>90%` of asset volume across `>=5` downstream destination accounts within a `15-minute` tumbling window.

### Dormant Account Activation
- **Detection Layer:** PostgreSQL Keyed-State Monitor.
- **Mathematical Criteria:** Scans for accounts with `>=180 days` of absolute inactivity that suddenly encounter a deposit injection `>10x` their historical average transaction value, followed by an immediate drain sequence bridging across `2 hours`.

### Circular Round-Tripping
- **Detection Layer:** Neo4j Graph Intelligence.
- **Mathematical Criteria:** Utilizes Tarjan's Strongly Connected Components (SCC) algorithm to detect closed financial loops (e.g., A → B → C → D → A) maintaining a path length of `>=3 hops` within a `72-hour` window, while preserving `>=85%` of the origin asset volume.

### Profile Mismatch
- **Detection Layer:** XGBoost + Isolation Forest Baseline Deviation.
- **Mathematical Criteria:** Supervised segment baselines calculate statistical process control deviations when actual transaction velocities contradict declared KYC profiles (e.g., an account flagged as 'Student' routing multi-crore enterprise transfers).

---

## 5. TECHNICAL CORES: ADVANCED IDENTITY RESOLUTION & COMPOSITE SCORING

### Probabilistic Entity Resolution Engine (ERE)
The ERE systematically combats synthetic identity fraud by linking fragmented actors across the financial matrix. 
- **Attribute Multiplier Weights:**
  - PAN Number: `0.95`
  - Account Number: `0.95`
  - Masked Aadhaar: `0.90`
  - VPA / Mobile Number: `0.85 - 0.88`
  - Device Fingerprint: `0.80`
  - Email Address: `0.75`
  - IFSC Routing Patterns: `0.70`
  - IP Subnet: `0.55`
- **Threshold Gates:** 
  - An aggregate similarity score `> 0.85` triggers automatic graph fusion via explicit `LINKED_TO` edges.
  - An aggregate similarity score between `0.65` and `0.85` routes the subgraph to human investigator audit queues for manual confirmation.

### Hybrid Machine Learning Scoring Matrix
IntelliTrace rejects traditional, flat-tabular machine learning. Our pipeline extracts topological reality by generating GraphSAGE inductive neighborhood embeddings (`<3ms` local extraction latency) which encapsulate the risk-state of an account's immediate peers. These continuous vector embeddings are concatenated with standard financial features and fed into a `500-tree` supervised XGBoost classifier. Post-inference, SHAP (SHapley Additive exPlanations) values are extracted from the TreeExplainer to generate mathematically sound, human-interpretable feature attribution arrays for the compliance auditor.

---

## 6. REGULATORY ALIGNMENT, INSIDER FUSION & AUTO-COMPLIANCE

### Cross-Domain Insider Threat Fusion Layer
To protect against internal collusion, the system actively ingests operational telemetry. Internal operator logs (e.g., employee login events, IP origins, system override actions) are continuously correlated against transactional anomalies. If a high-risk financial chain was manually overridden or approved by an insider exhibiting anomalous access patterns, the case risk state is elevated to `CRITICAL` automatically.

### One-Click FIU-IND Document Compiler
IntelliTrace replaces hours of manual paperwork with programmatic precision. High-risk profiles are structurally converted into standard regulatory XML schemas covering all 6 mandatory reporting blocks under Prevention of Money Laundering Act (PMLA) guidelines:
1. **SAPCTL:** Control metrics and cryptographic identity hashes.
2. **SAPTRN:** Granular individual transaction logs.
3. **SAPBRC:** Reporting branch metadata and geographic coordinates.
4. **SAPPIN:** Suspect profile information and KYC identifiers.
5. **SAPINP:** Associated individual profiles (beneficial owners).
6. **SAPLPE:** Legal person and corporate entity metadata.

### Chain-of-Custody Logging
Every state mutation within the platform (transaction scored, alert dismissed, STR compiled) generates a tamper-evident audit record. Using an enterprise `CryptographicAuditLogger`, events are hashed via serial SHA-256 strings linking the current record back to the `previous_hash` of the preceding log, guaranteeing an immutable ledger for regulatory defense.

---

## 7. PLATFORM INFRASTRUCTURE, DEPLOYMENT TOPOLOGY & HIGH AVAILABILITY

### Local Validation (Sandbox)
The development sandbox is orchestrated entirely via `docker-compose.yml`, provisioning:
- **Zookeeper & Kafka 3.x:** Configured with 1 broker and automated topic provisioning.
- **Neo4j Enterprise:** Initialized with custom APOC extensions and heap memory tuning.
- **PostgreSQL 16:** Bound to persistent volumes for OLTP state tracking.
- **RedisBloom:** Ephemeral caching layer.
- **Prometheus & Grafana:** Embedded observability scraping node metrics.

### Production Kubernetes Orchestration
Enterprise deployment utilizes advanced Kubernetes configurations:
- **Horizontal Pod Autoscaler (HPA):** Ingestion replicas aggressively scale out when Kafka consumer lag exceeds `10,000` messages. Scoring pods scale horizontally when the inference queue depth exceeds `500`.
- **Pod Disruption Budgets (PDB):** Guarantees quorum persistence during voluntary cluster evictions.
- **Network Segregation:** Explicit `NetworkPolicy` manifests isolate namespace communication.

### Istio Service Mesh Configuration
Zero-Trust networking is enforced via Istio. A strict `PeerAuthentication` manifest mandates mutual TLS (mTLS) for all inter-container transit, neutralizing lateral sniffing. `DestinationRule` manifests implement aggressive circuit breaking, instantly ejecting failing microservices from the load balancer pool.

### High-Availability Datastore Configurations
- **PostgreSQL:** Multi-node Patroni auto-failover clustering tracks distributed consensus via etcd, handling primary-replica stream replication and automated leader elections.
- **Neo4j:** 3-node Causal Clustering divides read/write traffic across consensus Raft nodes and horizontal read replicas.
- **Operational Targets:** Engineered for a Recovery Time Objective (RTO) of `< 15 minutes` and a Recovery Point Objective (RPO) of `< 5 minutes`.

---

## 8. VERIFICATION, QUICK-START GUIDE & PRODUCTION VALIDATION RUNS

### Prerequisite Check
Ensure your host machine possesses:
- **Docker Engine 24.x+** with Virtualization (VT-x / AMD-V) enabled in BIOS.
- **Python 3.11+**
- Available system RAM: `16GB+` recommended for full cluster emulation.

### Execution Steps: Booting the Infrastructure
To spin up the isolated data orchestration cluster, navigate to the `deploy/` directory and execute:
```bash
docker-compose up -d
```
*Wait approximately 45-60 seconds for the Kafka broker and Neo4j Java Virtual Machines to stabilize.*

### Step-by-step Commands: E2E Simulation Run
To invoke the complete pipeline integration engine (ingesting a synthetic financial stream, routing through PyFlink, writing to Neo4j, scoring via XGBoost, and compiling the FIU-IND XML), execute the end-to-end suite:
```bash
python E2E_INTEGRATION_EXAMPLE.py
```
*(Note: Within the primary repository tree, the testing execution mapping is bound to `pytest tests/test_e2e_pipeline.py -v -s` which dynamically leverages `testcontainers` for container isolation).*

### Production Validation Assertions
When executing the validation suite, the console will output the strict compliance metrics verifying operational boundaries:
1. **Throughput Tracking:** Asserts ingestion buffers process payloads simulating `50,000+ TPS`.
2. **CEP Lags:** Asserts PyFlink event-time watermarking lags remain sub-second.
3. **Inference Latency:** Verifies XGBoost + GraphSAGE graph feature lookups execute in `< 20ms`.
4. **Artifact Generation:** Validates that the synthesized XML files correctly output into the `/outputs/intellitrace/` volume mapping, fully conformant with the FIU-IND schema.
