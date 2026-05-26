# ⚡ IntelliTrace Environment Setup - Quick Reference

## 📋 Files Created

| File | Purpose |
|------|---------|
| `backend/.env` | Main backend config (150+ vars) |
| `backend/.env.example` | Safe template for version control |
| `frontend/.env` | Frontend config (60+ vars) |
| `frontend/.env.example` | Safe template for version control |
| `ENV_CONFIGURATION_GUIDE.md` | Detailed setup instructions |
| `ENVIRONMENT_VARIABLES_SUMMARY.md` | Comprehensive variable reference |
| `QUICK_SETUP.md` | This file 🎯 |

---

## 🚀 30-Second Setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your Neon database URL and secrets
python main.py
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with API base URL
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

---

## 🔑 Essential Variables to Configure

### Neon Database (CRITICAL)
```env
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/intellitrace_db?sslmode=require
```
👉 Get from [neon.tech](https://neon.tech)

### Security Keys (CRITICAL)
```env
SECRET_KEY=<generate-random-secure-key>
```
Generate with Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Neo4j (CRITICAL)
```env
NEO4J_PASSWORD=change-this-secure-password
```

### Grafana (CRITICAL)
```env
GRAFANA_ADMIN_PASSWORD=change-this-secure-password
```

---

## 📊 What Each Service Does

| Service | Purpose | Port |
|---------|---------|------|
| **FastAPI Backend** | Transaction processing API | 8000 |
| **PostgreSQL/Neon** | Primary OLTP database | 5432 |
| **Neo4j** | Graph DB for relationships | 7687 |
| **Kafka** | Streaming transactions | 9092 |
| **Redis** | Caching & Bloom filters | 6379 |
| **Prometheus** | Metrics collection | 9090 |
| **Grafana** | Visualization dashboards | 3000 |
| **Frontend (React)** | Web UI | 5173 |

---

## 🔗 Access URLs (Local Development)

```
API Docs:           http://localhost:8000/docs
Neo4j Browser:      http://localhost:7474
Grafana:            http://localhost:3000 (admin/GrafanaSecurePassword2026)
Prometheus:         http://localhost:9090
Frontend:           http://localhost:5173
```

---

## ✅ Before You Deploy to Production

- [ ] Change `SECRET_KEY` to random secure value
- [ ] Change `POSTGRES_PASSWORD` to strong password
- [ ] Change `NEO4J_PASSWORD` to strong password
- [ ] Change `GRAFANA_ADMIN_PASSWORD` to strong password
- [ ] Change `TOKENIZATION_PEPPER_KEY`
- [ ] Add `ANTHROPIC_API_KEY` if using narratives
- [ ] Set `FASTAPI_ENVIRONMENT=production`
- [ ] Set `DEBUG_MODE=false`
- [ ] Update `CORS_ORIGINS` to specific domains
- [ ] Configure production database (Neon)
- [ ] Enable `TESTING_ENABLED=false`
- [ ] Set `DEPLOYMENT_REGION` & `REPLICA_COUNT`

---

## 🛠️ Common Commands

### Docker
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f <service>

# Check status
docker-compose ps
```

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start server
python main.py
```

### Frontend
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

### Database
```bash
# PostgreSQL
psql postgresql://user:password@localhost:5432/intellitracedb

# Neo4j
docker exec intellitrace-neo4j cypher-shell -u neo4j -p password

# Redis
redis-cli
```

---

## 🔍 Variable Categories (Quick Find)

### Databases
`POSTGRES_*`, `NEON_*`, `DEBEZIUM_*`, `NEO4J_*`, `REDIS_*`

### Streaming
`KAFKA_*`, `ZOOKEEPER_*`, `SCHEMA_REGISTRY_*`, `FLINK_*`

### Monitoring
`PROMETHEUS_*`, `GRAFANA_*`

### Security
`SECRET_KEY`, `JWT_*`, `ENCRYPTION_*`, `PII_*`

### ML & Detection
`MODEL_*`, `ANOMALY_*`, `INSIDER_THREAT_*`, `ROUND_TRIPPING_*`, `SHADOW_ROUTING_*`

### Frontend
`VITE_*` (all start with VITE_)

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version (3.9+)
python --version

# Check dependencies
pip install -r requirements.txt

# Set PYTHONPATH
export PYTHONPATH=./backend/src
```

### Can't connect to databases
```bash
# Test PostgreSQL
psql $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# Test Neo4j
curl http://localhost:7474/

# Test Redis
redis-cli ping
```

### Frontend not connecting to backend
- Check `VITE_API_BASE_URL` is correct
- Check backend is running: `curl http://localhost:8000/health`
- Check CORS settings in backend `.env`

### Kafka issues
```bash
# List topics
docker exec intellitrace-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Check consumer lag
docker exec intellitrace-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --group intellitrace-consumer-group --describe
```

---

## 📚 Documentation Files

- **Detailed Guide**: [ENV_CONFIGURATION_GUIDE.md](ENV_CONFIGURATION_GUIDE.md)
- **Variable Reference**: [ENVIRONMENT_VARIABLES_SUMMARY.md](ENVIRONMENT_VARIABLES_SUMMARY.md)
- **Examples**: `backend/.env.example` & `frontend/.env.example`

---

## 🎯 Next Steps

1. ✅ **Copy examples**: `cp .env.example .env`
2. ✅ **Create Neon account**: [neon.tech](https://neon.tech)
3. ✅ **Update database URL**: `NEON_DATABASE_URL=...`
4. ✅ **Generate secrets**: Use `secrets.token_urlsafe(32)`
5. ✅ **Start services**: `docker-compose up -d`
6. ✅ **Start backend**: `python main.py`
7. ✅ **Start frontend**: `npm run dev`
8. ✅ **Visit UI**: http://localhost:5173

---

## 💡 Pro Tips

- Always use `.env.example` for version control
- Never commit `.env` files with secrets
- Use different secrets for dev/staging/prod
- Rotate secrets regularly
- Monitor logs: `docker-compose logs -f`
- Use Neon for production PostgreSQL
- Enable 2FA on Anthropic API
- Test database connections before deploying
- Keep backups of model files in `/var/models`

---

## 📞 Support Resources

- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Neo4j Docs**: https://neo4j.com/docs/
- **Kafka Docs**: https://kafka.apache.org/docs/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Docker**: https://docs.docker.com/

---

**Happy coding! 🚀**

*Last Updated: May 26, 2026*
