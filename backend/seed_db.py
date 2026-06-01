"""
IntelliTrace Database Seeder
Populates Neon PostgreSQL with realistic financial crime demo data.
"""
import os, random, sys, hashlib
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext

load_dotenv()

DB_URL = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
if not DB_URL:
    print("ERROR: No database URL found."); sys.exit(1)

conn = psycopg2.connect(DB_URL)
conn.autocommit = False
cur = conn.cursor(cursor_factory=RealDictCursor)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("Connected to Neon DB. Seeding...")

# ── 1. SCHEMA ────────────────────────────────────────────────────────────────
cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'starter',
        role VARCHAR(50) NOT NULL DEFAULT 'Analyst',
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        mfa_enabled BOOLEAN DEFAULT false,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        sender_name VARCHAR(255) NOT NULL,
        sender_account VARCHAR(100) NOT NULL,
        receiver_name VARCHAR(255) NOT NULL,
        receiver_account VARCHAR(100) NOT NULL,
        amount BIGINT NOT NULL,
        channel VARCHAR(50) NOT NULL,
        risk_score DECIMAL(4,2) NOT NULL DEFAULT 0,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
        status VARCHAR(50) NOT NULL DEFAULT 'Cleared',
        transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        account_id VARCHAR(100) NOT NULL,
        amount BIGINT NOT NULL,
        risk_score INTEGER NOT NULL DEFAULT 0,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        description TEXT,
        flag_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        type VARCHAR(100) NOT NULL,
        assignee VARCHAR(255) NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        description TEXT,
        related_alert_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_notes (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_evidence (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size VARCHAR(50),
        added_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        date_range VARCHAR(200),
        status VARCHAR(50) NOT NULL DEFAULT 'Processing',
        format VARCHAR(20) NOT NULL DEFAULT 'PDF',
        file_size VARCHAR(50),
        generated_by_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_thresholds (
        id SERIAL PRIMARY KEY,
        fraud_threshold INTEGER NOT NULL DEFAULT 75,
        escalation_score INTEGER NOT NULL DEFAULT 90,
        str_threshold INTEGER NOT NULL DEFAULT 85,
        dormant_days INTEGER NOT NULL DEFAULT 180,
        layering_window INTEGER NOT NULL DEFAULT 15,
        smurfing_count INTEGER NOT NULL DEFAULT 10,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(500) NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS entities (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'Individual',
        risk_score INTEGER NOT NULL DEFAULT 0,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
        kyc_status VARCHAR(50) NOT NULL DEFAULT 'Verified',
        pan VARCHAR(20),
        account_count INTEGER DEFAULT 1,
        total_volume BIGINT DEFAULT 0,
        flags TEXT,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
""")
conn.commit()
print("[OK] Schema created/verified.")

# ── 2. DEFAULT THRESHOLDS ────────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) as c FROM system_thresholds")
if cur.fetchone()["c"] == 0:
    cur.execute("""
        INSERT INTO system_thresholds
        (fraud_threshold, escalation_score, str_threshold, dormant_days, layering_window, smurfing_count)
        VALUES (75, 90, 85, 180, 15, 10)
    """)
    conn.commit()

# ── 3. USERS ─────────────────────────────────────────────────────────────────
USERS = [
    ("Admin User",    "admin@intellitrace.ai",   "Admin@2026!",  "enterprise", "Admin"),
    ("Priya Sharma",  "priya@intellitrace.ai",   "Analyst@123",  "pro",        "Senior Analyst"),
    ("Rahul Verma",   "rahul@intellitrace.ai",   "Analyst@123",  "pro",        "Analyst"),
    ("Ankita Singh",  "ankita@intellitrace.ai",  "Analyst@123",  "starter",    "Analyst"),
    ("Karan Mehta",   "karan@intellitrace.ai",   "Analyst@123",  "pro",        "Compliance Officer"),
]
for name, email, pwd, plan, role in USERS:
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if not cur.fetchone():
        safe_pwd = pwd.encode('utf-8')[:72].decode('utf-8', 'ignore')
        hashed = pwd_context.hash(safe_pwd)
        cur.execute(
            "INSERT INTO users (name, email, password, plan, role, status, mfa_enabled, last_login) VALUES (%s,%s,%s,%s,%s,'Active',true,NOW()-INTERVAL '5 minutes')",
            (name, email, hashed, plan, role)
        )
conn.commit()
print("[OK] Users seeded.")

# ── 4. TRANSACTIONS ──────────────────────────────────────────────────────────
CHANNELS = ["UPI", "NEFT", "RTGS", "IMPS", "SWIFT", "NACH"]
SENDERS = [
    ("Rajesh Kumar",   "HDFC0001234567"),
    ("Sunita Devi",    "SBI00987654321"),
    ("Mohammed Arif",  "ICIC0004567890"),
    ("Preethi Nair",   "AXIS0007654321"),
    ("Vikram Bose",    "KOTAK001234567"),
    ("Ananya Joshi",   "PNB00012345678"),
    ("Suresh Pillai",  "BOB00087654321"),
    ("Deepak Rawat",   "CANARA0123456"),
    ("Fatima Sheikh",  "IDBI00765432100"),
    ("Amit Tiwari",    "YES000123456789"),
]
RECEIVERS = [
    ("Global Trade Co",    "CITI009876543210"),
    ("Sunrise Exports",    "HSBC001234567890"),
    ("FinTech Solutions",  "DBS00987654321"),
    ("Lotus Imports",      "SCB00123456789"),
    ("Metro Commerce",     "UBI00876543210"),
    ("Royal Enterprises",  "IOB00543210987"),
    ("Delta Capital",      "SYNDICATE012345"),
    ("Alpha Logistics",    "FEDERAL0987654"),
    ("Horizon Trading",    "LAKSHMI1234567"),
    ("Pacific Ventures",   "DHAN00876543210"),
]
RISK_LEVELS = ["low","low","low","medium","medium","high","critical"]

cur.execute("SELECT COUNT(*) as c FROM transactions")
if cur.fetchone()["c"] < 100:
    print("Seeding transactions...")
    now = datetime.now(timezone.utc)
    for i in range(250):
        txn_id   = f"TXN-{now.year}-{random.randint(100000,999999)}"
        sender   = random.choice(SENDERS)
        receiver = random.choice(RECEIVERS)
        amount   = random.randint(10000, 95000000)
        channel  = random.choice(CHANNELS)
        risk_lvl = random.choice(RISK_LEVELS)
        risk_score = {"low":random.uniform(0,30),"medium":random.uniform(30,60),"high":random.uniform(60,80),"critical":random.uniform(80,99)}[risk_lvl]
        status   = random.choice(["Cleared","Cleared","Cleared","Flagged","Under Review"])
        days_ago = random.randint(0, 30)
        txn_time = now - timedelta(days=days_ago, hours=random.randint(0,23), minutes=random.randint(0,59))
        cur.execute(
            "INSERT INTO transactions (id,sender_name,sender_account,receiver_name,receiver_account,amount,channel,risk_score,risk_level,status,transaction_time,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (txn_id, sender[0], sender[1], receiver[0], receiver[1], amount, channel, round(risk_score,2), risk_lvl, status, txn_time, txn_time)
        )
    conn.commit()
print("[OK] Transactions seeded.")

# ── 5. ALERTS ────────────────────────────────────────────────────────────────
ALERT_TYPES = [
    "Smurfing Pattern Detected",
    "Rapid Layering Sequence",
    "Dormant Account Activation",
    "Circular Fund Transfer",
    "High-Value SWIFT Anomaly",
    "Multiple Account Structuring",
    "Insider Threat Indicator",
    "Shell Company Routing",
    "Unusual UPI Velocity",
    "Cross-Border Evasion Network",
]
ALERT_DESCS = [
    "Multiple sub-threshold transactions detected below INR 2L reporting threshold across 7 accounts.",
    "Rapid layering sequence identified: funds moved through 5 intermediate accounts within 90 minutes.",
    "Account dormant for 243 days suddenly received INR 4.2 Cr followed by immediate dispersal to 9 counterparties.",
    "Circular transfer pattern detected: Entity A → B → C → A. Net economic gain: zero. Suspected wash trading.",
    "SWIFT transfer flagged for geographic anomaly — destination jurisdiction on FATF grey list.",
    "Structured deposits across 8 accounts, each INR 1.8–1.9L, aggregating to INR 15.2 Cr over 3 days.",
    "Privileged user accessed sensitive client records outside business hours 14 times in 72 hours.",
    "Funds routed through 3 shell entities registered in tax-haven jurisdictions before final remittance.",
    "UPI velocity anomaly: 340 transactions in 6 hours from single VPA. Suspected mule orchestration.",
    "Cross-border evasion network spanning 6 jurisdictions detected. GNN confidence score: 0.94.",
]
FLAG_REASONS = [
    "PMLA Typology 01: High-volume structuring below reporting threshold",
    "PMLA Typology 04: Rapid asset layering using digital payment rails",
    "PMLA Typology 09: Dormant account reactivation for mule operations",
    "PMLA Typology 07: Circular fund movement with zero net economic value",
    "FATF Recommendation 16: Cross-border wire transfer anomaly",
    "RBI Master Direction: Suspicious Transaction Report trigger (Rule 3)",
    "FIU-IND Alert: Insider threat pattern matched against behavioural baseline",
    "PMLA Typology 12: Shell company routing in FATF grey-list jurisdictions",
    "PMLA Typology 03: High-frequency micro-transactions (smurfing variant)",
    "GNN Multi-hop analysis: 6-node evasion network confirmed",
]

cur.execute("SELECT COUNT(*) as c FROM alerts")
if cur.fetchone()["c"] < 20:
    print("Seeding alerts...")
    now = datetime.now(timezone.utc)
    alert_ids = []
    for i in range(40):
        alert_id = f"ALT-{random.randint(10000,99999)}"
        alert_ids.append(alert_id)
        atype    = ALERT_TYPES[i % len(ALERT_TYPES)]
        acct     = random.choice(SENDERS)
        amount   = random.randint(500000, 50000000)
        risk_lvl = random.choice(["critical","critical","high","high","medium","low"])
        score    = {"critical":random.randint(85,99),"high":random.randint(65,84),"medium":random.randint(40,64),"low":random.randint(10,39)}[risk_lvl]
        status   = random.choice(["Open","Open","Open","Under Review","Resolved"])
        desc     = ALERT_DESCS[i % len(ALERT_DESCS)]
        flag     = FLAG_REASONS[i % len(FLAG_REASONS)]
        days_ago = random.randint(0, 14)
        created  = now - timedelta(days=days_ago, hours=random.randint(0,23))
        cur.execute(
            "INSERT INTO alerts (id,type,account_id,amount,risk_score,risk_level,status,description,flag_reason,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (alert_id, atype, acct[1], amount, score, risk_lvl, status, desc, flag, created, created)
        )
    conn.commit()
else:
    cur.execute("SELECT id FROM alerts LIMIT 40")
    alert_ids = [r["id"] for r in cur.fetchall()]
print("[OK] Alerts seeded.")

# ── 6. CASES ─────────────────────────────────────────────────────────────────
CASE_TITLES = [
    "Operation Horizon: Multi-Layered UPI Fraud Network",
    "Project Sandstorm: Cross-Border SWIFT Evasion Ring",
    "Case Indigo: Shell Company Fund Routing — 6 Entities",
    "Operation Cascade: Structured Deposit Smurfing Cluster",
    "Project Phoenix: Dormant Account Mule Network",
    "Case Amber: Insider Threat — Privileged Data Access",
    "Operation Vortex: Circular Wash Trading Investigation",
    "Project Sentinel: High-Value RTGS Anomaly Cluster",
]
CASE_TYPES = ["Money Laundering","Fraud","Insider Threat","Structuring","Terrorist Financing","KYC Violation"]
ASSIGNEES  = ["Priya Sharma","Rahul Verma","Karan Mehta","Ankita Singh"]
PRIORITIES = ["Critical","Critical","High","High","Medium","Low"]
STATUSES   = ["Open","Open","In Progress","In Progress","Under Review","Closed"]

cur.execute("SELECT COUNT(*) as c FROM cases")
if cur.fetchone()["c"] < 5:
    print("Seeding cases...")
    now = datetime.now(timezone.utc)
    case_ids = []
    for i, title in enumerate(CASE_TITLES):
        case_id  = f"CSE-{1001+i}"
        case_ids.append(case_id)
        ctype    = CASE_TYPES[i % len(CASE_TYPES)]
        assignee = random.choice(ASSIGNEES)
        priority = PRIORITIES[i % len(PRIORITIES)]
        status   = STATUSES[i % len(STATUSES)]
        rel_alert= alert_ids[i] if i < len(alert_ids) else None
        created  = now - timedelta(days=random.randint(1, 30))
        updated  = created + timedelta(hours=random.randint(1,48))
        desc     = f"Investigation initiated following automated detection. GNN graph analysis flagged {random.randint(3,12)} connected entities. STR filing pending compliance review."
        cur.execute(
            "INSERT INTO cases (id,title,type,assignee,priority,status,description,related_alert_id,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (case_id, title, ctype, assignee, priority, status, desc, rel_alert, created, updated)
        )
    conn.commit()

    # Case Notes
    for case_id in case_ids[:4]:
        for note_text in [
            "Initial triage complete. Transaction graph exported to Graph Explorer for network analysis.",
            "Entity resolution identified 3 probable synthetic identities linked to the cluster.",
            "STR draft prepared. Awaiting senior compliance officer sign-off before FIU-IND submission.",
        ]:
            cur.execute(
                "INSERT INTO case_notes (case_id, author, text) VALUES (%s, %s, %s)",
                (case_id, random.choice(ASSIGNEES), note_text)
            )
    # Case Evidence
    for case_id in case_ids[:4]:
        for fname, ftype, fsize in [
            ("transaction_graph_export.json", "JSON", "2.4 MB"),
            ("entity_resolution_report.pdf",  "PDF",  "1.1 MB"),
            ("str_draft_v2.pdf",              "PDF",  "845 KB"),
        ]:
            cur.execute(
                "INSERT INTO case_evidence (case_id, file_name, file_type, file_size, added_by) VALUES (%s,%s,%s,%s,%s)",
                (case_id, fname, ftype, fsize, random.choice(ASSIGNEES))
            )
    conn.commit()
print("[OK] Cases seeded.")

# ── 7. REPORTS ───────────────────────────────────────────────────────────────
REPORT_TYPES = ["STR","CTR","SAR","KYC Audit","AML Summary","Risk Assessment"]
FORMATS = ["PDF","CSV","Excel"]
now = datetime.now(timezone.utc)
cur.execute("SELECT COUNT(*) as c FROM reports")
if cur.fetchone()["c"] < 5:
    print("Seeding reports...")
    for i in range(12):
        rtype   = REPORT_TYPES[i % len(REPORT_TYPES)]
        rid     = f"RPT-{now.year}-{1000+i}"
        status  = random.choice(["Ready","Ready","Ready","Processing","Failed"])
        fmt     = random.choice(FORMATS)
        size    = f"{random.randint(200,5000)} KB"
        dr      = f"{(now - timedelta(days=30)).strftime('%d %b')} – {now.strftime('%d %b %Y')}"
        created = now - timedelta(days=random.randint(0,20))
        cur.execute(
            "INSERT INTO reports (id,type,date_range,status,format,file_size,generated_by_name,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (rid, rtype, dr, status, fmt, size, random.choice(ASSIGNEES), created)
        )
    conn.commit()
print("[OK] Reports seeded.")

# ── 8. ENTITIES ───────────────────────────────────────────────────────────────
ENTITY_NAMES = [
    ("Rajesh Kumar",        "Individual"), ("Sunita Devi",   "Individual"),
    ("Mohammed Arif",       "Individual"), ("Preethi Nair",  "Individual"),
    ("Global Trade Co",     "Corporate"),  ("Sunrise Exports","Corporate"),
    ("FinTech Solutions",   "Corporate"),  ("Lotus Imports",  "Corporate"),
    ("Delta Capital",       "Corporate"),  ("Alpha Logistics", "Corporate"),
]
KYC_STATUSES = ["Verified","Verified","Pending","Flagged","Rejected"]
cur.execute("SELECT COUNT(*) as c FROM entities")
if cur.fetchone()["c"] < 5:
    print("Seeding entities...")
    now = datetime.now(timezone.utc)
    for i, (name, etype) in enumerate(ENTITY_NAMES):
        eid      = f"ENT-{1001+i}"
        risk_lvl = random.choice(["low","low","medium","high","critical"])
        score    = {"low":random.randint(5,30),"medium":random.randint(31,60),"high":random.randint(61,80),"critical":random.randint(81,99)}[risk_lvl]
        kyc      = random.choice(KYC_STATUSES)
        pan      = f"{'ABCDE'[i%5]}{random.randint(1000,9999)}F"
        volume   = random.randint(500000, 500000000)
        accts    = random.randint(1, 8)
        flags    = random.choice(["None","Structuring","Layering","Shell Company","Mule Account","None","None"])
        last_act = now - timedelta(hours=random.randint(1,240))
        created  = now - timedelta(days=random.randint(30,365))
        cur.execute(
            "INSERT INTO entities (id,name,type,risk_score,risk_level,kyc_status,pan,account_count,total_volume,flags,last_active,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (eid, name, etype, score, risk_lvl, kyc, pan, accts, volume, flags, last_act, created)
        )
    conn.commit()
print("[OK] Entities seeded.")

# ── 9. AUDIT LOGS ────────────────────────────────────────────────────────────
AUDIT_ACTIONS = [
    ("User Login",           "Admin User",  "Successful authentication from 192.168.1.45"),
    ("Alert Status Updated", "Priya Sharma","ALT-10234 → Under Review"),
    ("Case Created",         "Rahul Verma", "CSE-1001 opened for Operation Horizon"),
    ("STR Report Generated", "Karan Mehta", "RPT-2026-1000 filed for Q2"),
    ("Threshold Updated",    "Admin User",  "Fraud threshold changed: 70 → 75"),
    ("User Created",         "Admin User",  "New analyst account: ankita@intellitrace.ai"),
    ("Case Closed",          "Priya Sharma","CSE-1008 closed after FIU-IND submission"),
    ("Alert Escalated",      "Rahul Verma", "ALT-10289 escalated to Senior Analyst"),
]
cur.execute("SELECT COUNT(*) as c FROM audit_logs")
if cur.fetchone()["c"] < 5:
    print("Seeding audit logs...")
    now = datetime.now(timezone.utc)
    for i, (action, by, detail) in enumerate(AUDIT_ACTIONS):
        created = now - timedelta(hours=i*3+random.randint(0,2))
        cur.execute(
            "INSERT INTO audit_logs (action, performed_by, details, created_at) VALUES (%s,%s,%s,%s)",
            (action, by, detail, created)
        )
    conn.commit()
print("[OK] Audit logs seeded.")

cur.close()
conn.close()
print("\n[SUCCESS] Database fully seeded!")
print("  - Users:        5")
print("  - Transactions: 250")
print("  - Alerts:       40")
print("  - Cases:        8 (with notes & evidence)")
print("  - Reports:      12")
print("  - Entities:     10")
print("  - Audit logs:   8")
