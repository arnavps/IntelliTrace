# IntelliTrace Environment Variables Guide

## Overview
This document provides detailed instructions for configuring all environment variables required to run the IntelliTrace financial intelligence platform.

---

## 🗄️ Database Configuration

### Neon PostgreSQL (Production Recommended)
Neon is a serverless PostgreSQL platform perfect for production deployments.

**Setup Steps:**
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string from Neon console
4. Update `.env` variables:

```env
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/database?sslmode=require
NEON_USER=your_neon_user
NEON_PASSWORD=your_neon_password
NEON_HOST=ep-xxx.region.neon.tech
NEON_PORT=5432
NEON_DBNAME=intellitrace_db
```

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

### Local PostgreSQL (Development)
Used in docker-compose.yml for local development:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=intellitrace_admin
POSTGRES_PASSWORD=IntelliTraceSecureDB2026
POSTGRES_DB=intellitracedb
```

### Debezium CDC Configuration
For change data capture from PostgreSQL:

```env
DEBEZIUM_DB_USER=debezium_cdc_user
DEBEZIUM_DB_PASSWORD=VaultDecryptedSecurePassword123!
DEBEZIUM_REPLICATION_SLOT=debezium_cbs_replica_slot
DEBEZIUM_PUBLICATION=dbz_cbs_publication
```

---

## 🌐 Neo4j Graph Database

Configure Neo4j for storing transaction network relationships:

```env
NEO4J_HOST=localhost                    # For Docker: 'neo4j'
NEO4J_PORT=7687                         # Bolt protocol port
NEO4J_HTTP_PORT=7474                    # HTTP console port
NEO4J_USER=neo4j                        # Default user
NEO4J_PASSWORD=IntelliTraceGraph2026    # Change in production!
NEO4J_SCHEME=bolt                       # Protocol: bolt, neo4j, bolt+s, neo4j+s
NEO4J_ACCEPT_LICENSE_AGREEMENT=yes      # Required for Enterprise
```

**Docker Command to Verify:**
```bash
docker exec intellitrace-neo4j cypher-shell "RETURN neo4j.version()"
```

---

## 💾 Redis Cache

Redis with RedisBLoom for probabilistic data structures:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                         # Leave empty if no auth
REDIS_DB=0                              # Database index
REDIS_BLOOM_ENABLED=true                # Enable Bloom filters
```

---

## 📊 Kafka Streaming Platform

Critical for real-time transaction processing:

```env
# Local development (Docker)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_BROKERS=kafka:29092

# Topics
KAFKA_TOPIC_TRANSACTIONS=intellitrace-transactions
KAFKA_TOPIC_ALERTS=intellitrace-alerts
KAFKA_TOPIC_AUDIT=intellitrace-audit

# Consumer configuration
KAFKA_CONSUMER_GROUP=intellitrace-consumer-group
KAFKA_AUTO_OFFSET_RESET=earliest        # Process from beginning

# Schema Registry
KAFKA_SCHEMA_REGISTRY_URL=http://localhost:8081
```

**Verify Kafka:**
```bash
docker exec intellitrace-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## 📈 Prometheus & Grafana

### Prometheus (Metrics Collection)
```env
PROMETHEUS_HOST=localhost
PROMETHEUS_PORT=9090
PROMETHEUS_SCRAPE_INTERVAL=15s
PROMETHEUS_EVALUATION_INTERVAL=15s
```

### Grafana (Visualization)
```env
GRAFANA_HOST=localhost
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=GrafanaSecurePassword2026  # Change this!
GRAFANA_DEFAULT_THEME=dark
```

**Access Grafana:** http://localhost:3000

---

## 🚀 FastAPI Application

```env
FASTAPI_HOST=0.0.0.0                   # Bind to all interfaces
FASTAPI_PORT=8000                      # API port
FASTAPI_RELOAD=true                    # Auto-reload on changes (dev only)
FASTAPI_WORKERS=4                      # Worker processes (production)
FASTAPI_ENVIRONMENT=development        # Or: production, staging
```

**Start Backend:**
```bash
cd backend
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🤖 Apache Flink Streaming

Configuration for the streaming analytics pipeline:

```env
FLINK_JOBMANAGER_HOST=localhost
FLINK_JOBMANAGER_PORT=8081
FLINK_TASKMANAGER_SLOTS=4               # Parallelism
FLINK_STATE_BACKEND=rocksdb             # For large state
FLINK_CHECKPOINT_MODE=EXACTLY_ONCE      # Exactly-once semantics
FLINK_CHECKPOINT_INTERVAL=60000         # 60 seconds
FLINK_PARALLELISM=2                     # Parallel streams
```

---

## 🔐 Security Configuration

### Cryptographic Keys
```env
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ENCRYPTION_ALGORITHM=AES-256-GCM
```

**Generate Secure Key (Python):**
```python
import secrets
secret = secrets.token_urlsafe(32)
print(secret)
```

### PII Protection (DPDP Act 2023)
```env
PII_TOKENIZATION_ENABLED=true           # Encrypt sensitive data
TOKENIZATION_PEPPER_KEY=additional-secure-pepper-key
MAX_AADHAAR_ATTEMPTS=3                  # Prevent brute-force
PAN_MASKING_FORMAT=****{last_4}         # Mask PAN numbers
```

---

## 🎓 Machine Learning Models

Paths to trained ML models:

```env
MODEL_ANOMALY_DETECTOR_PATH=/var/models/anomaly_detector.pkl
MODEL_INSIDER_THREAT_PATH=/var/models/insider_threat_model.xgb
MODEL_PMLA_MAPPER_PATH=/var/models/pmla_mapper.pkl
MODEL_GNN_PATH=/var/models/gnn_model.pt
XGBOOST_MODEL_PATH=/var/log/intellitrace/xgboost_champion.model
```

**Create Model Directory:**
```bash
mkdir -p /var/models /var/log/intellitrace
chmod 755 /var/models /var/log/intellitrace
```

---

## 📊 Continuous Learning Pipeline

```env
TRAINING_DB_PATH=/var/log/intellitrace/human_feedback.jsonl
RETRAINING_BATCH_SIZE=1000              # Records per retraining run
RETRAINING_ENABLED=true
MODEL_VALIDATION_AUC_THRESHOLD=0.85     # Performance threshold
MODEL_FALSE_POSITIVE_TARGET=0.05        # 5% max false positives
```

---

## 🌍 Transaction Parsing

```env
SUPPORTED_CHANNELS=UPI,SWIFT,NEFT,RTGS,IMPS,Cards,Wallets,ACH,ATM
ISO20022_ENABLED=true                   # SWIFT, SEPA, CBPR+
ISO8583_ENABLED=true                    # Payment cards
UPI_ENABLED=true                        # India domestic transfers
```

---

## 📋 Logging & Audit

```env
AUDIT_LOG_LEVEL=INFO
AUDIT_LOG_FILE=/var/log/intellitrace/audit.log
APPLICATION_LOG_LEVEL=INFO
APPLICATION_LOG_FILE=/var/log/intellitrace/app.log
LOG_FORMAT=json                         # Or: text
LOG_RETENTION_DAYS=90
```

**Create Log Directory:**
```bash
mkdir -p /var/log/intellitrace
chmod 755 /var/log/intellitrace
```

---

## 🔍 Anomaly Detection

```env
ANOMALY_DETECTION_THRESHOLD=0.7         # Sensitivity (0-1)
ANOMALY_MIN_SAMPLES=100                 # Min observations
ANOMALY_CONTAMINATION=0.1               # Expected anomaly rate
DRIFT_DETECTION_ENABLED=true
DRIFT_DETECTION_WINDOW=30                # Days to monitor
```

---

## 🕵️ Threat Detection

### Insider Threats
```env
INSIDER_THREAT_ENABLED=true
INSIDER_THREAT_SENSITIVITY=0.8          # Behavioral threshold
INSIDER_THREAT_MIN_TRANSACTIONS=50      # Min activity
```

### Round Tripping (Money Laundering)
```env
ROUND_TRIPPING_ENABLED=true
ROUND_TRIPPING_VELOCITY_THRESHOLD=0.85
ROUND_TRIPPING_TIME_WINDOW=3600         # 1 hour
```

### Shadow Routing
```env
SHADOW_ROUTING_ENABLED=true
SHADOW_ROUTING_THRESHOLD=0.75
SHADOW_ROUTING_MIN_HOPS=3
```

---

## 📡 Narrative Generation (Optional)

For AI-powered transaction explanations via Anthropic:

```env
NARRATIVE_GENERATION_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx  # Get from https://console.anthropic.com
NARRATIVE_MAX_LENGTH=500                # Words
NARRATIVE_LANGUAGE=en
```

**Get API Key:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `.env`

---

## 🛡️ Guard Policies

```env
GUARD_ENFORCEMENT_LEVEL=strict          # Or: moderate, relaxed
GUARD_FALLBACK_BEHAVIOR=reject          # Or: allow
GUARD_LOG_VIOLATIONS=true
```

---

## 🌐 CORS & API

```env
CORS_ORIGINS=*                          # Or: ["http://localhost:3000", "https://app.example.com"]
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=*
CORS_MAX_AGE=3600

API_VERSION=v1
API_PREFIX=/api/v1
```

---

## 📱 Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000                  # milliseconds

VITE_THEME_MODE=dark                    # Or: light
VITE_DEFAULT_LANGUAGE=en
VITE_DEFAULT_CURRENCY=USD

# Feature flags
VITE_FEATURE_ANOMALY_DASHBOARD=true
VITE_FEATURE_NETWORK_GRAPH=true
VITE_FEATURE_RISK_SCORING=true
VITE_FEATURE_NARRATIVE_VIEW=true
```

---

## 🧪 Testing Configuration

```env
TESTING_ENABLED=false
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/intellitrace_test
TESTCONTAINERS_RYUK_DISABLED=false
```

**Run Tests:**
```bash
cd backend
TESTING_ENABLED=true pytest -v
```

---

## 🔧 Development Environment

```env
DEBUG_MODE=false                        # Enable for debugging
VERBOSE_LOGGING=false
STACKTRACE_ON_ERROR=true
ENVIRONMENT=development                 # Or: production, staging
```

---

## 📊 Performance Tuning

```env
BATCH_PROCESSING_SIZE=1000              # Records per batch
CACHE_TTL_SECONDS=3600                  # 1 hour cache
CONNECTION_POOL_SIZE=20                 # DB connections
MAX_RETRIES=3
REQUEST_TIMEOUT=30                      # seconds
```

---

## 🚀 Deployment Environment

```env
DEPLOYMENT_REGION=us-east-1             # AWS region
DEPLOYMENT_ZONE=zone-1
REPLICA_COUNT=1                         # Kubernetes replicas
```

---

## 🔔 Alerting & Notifications

```env
ALERT_SEVERITY_THRESHOLD=MEDIUM         # Or: LOW, HIGH, CRITICAL
ALERT_RETENTION_DAYS=30
NOTIFICATION_CHANNELS=email,webhook
EMAIL_FROM=noreply@intellitrace.ai
WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

---

## ✅ Quick Setup Checklist

- [ ] Create Neon account and database
- [ ] Update database credentials in `.env`
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure Neo4j password
- [ ] Set up log directories (`/var/log/intellitrace`, `/var/models`)
- [ ] Configure Grafana admin password
- [ ] Add Anthropic API key (if using narratives)
- [ ] Set up Kafka topics
- [ ] Configure CORS origins for production
- [ ] Test database connections
- [ ] Verify all services are running: `docker-compose up -d`
- [ ] Start backend: `python main.py`
- [ ] Start frontend: `npm run dev`

---

## 🐳 Docker Compose Quick Start

```bash
# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## 🔗 Service URLs (Local Development)

| Service | URL |
|---------|-----|
| FastAPI Docs | http://localhost:8000/docs |
| Neo4j Browser | http://localhost:7474 |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Schema Registry | http://localhost:8081 |
| Frontend | http://localhost:5173 |

---

## 🆘 Troubleshooting

### Neon Connection Issues
```bash
# Test connection
psql postgresql://user:password@ep-xxx.region.neon.tech/database

# Check credentials
echo $NEON_DATABASE_URL
```

### Neo4j Connection Issues
```bash
# Check Neo4j logs
docker logs intellitrace-neo4j

# Verify credentials
docker exec intellitrace-neo4j cypher-shell -u neo4j -p IntelliTraceGraph2026 "RETURN 1"
```

### Kafka Topic Issues
```bash
# List topics
docker exec intellitrace-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Describe topic
docker exec intellitrace-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic intellitrace-transactions
```

---

## 📚 References

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Apache Flink](https://flink.apache.org/docs/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Grafana](https://grafana.com/docs/)
- [Anthropic API](https://docs.anthropic.com/)

---

**Last Updated:** May 2026  
**Version:** 1.0
