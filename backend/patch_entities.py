import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
if not db_url:
    print("Database URL not found.")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Creating entities table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            risk_score INTEGER NOT NULL DEFAULT 0,
            kyc_status VARCHAR(50) NOT NULL DEFAULT 'Verified',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Insert some seed data if empty
    cur.execute("SELECT COUNT(*) FROM entities;")
    if cur.fetchone()[0] == 0:
        print("Inserting seed entities...")
        cur.execute("""
            INSERT INTO entities (id, name, type, risk_score, kyc_status, last_active) VALUES 
            ('ACC-4821', 'Arjun Sharma', 'Individual', 92, 'Verified', NOW() - INTERVAL '2 hours'),
            ('ACC-3374', 'Priya Mehta', 'Individual', 87, 'Verified', NOW() - INTERVAL '3 hours'),
            ('ACC-7012', 'Nexus Capital Ltd', 'Corporate', 78, 'Pending Review', NOW() - INTERVAL '1 day'),
            ('ACC-5593', 'Shiva Exports', 'Corporate', 71, 'Verified', NOW() - INTERVAL '2 days'),
            ('ACC-2210', 'Delta Finserv', 'Corporate', 95, 'High Risk', NOW() - INTERVAL '5 hours'),
            ('ACC-8891', 'Pinnacle Holdings', 'Corporate', 43, 'Verified', NOW() - INTERVAL '1 week'),
            ('ACC-1204', 'Suresh Kumar', 'Individual', 91, 'Verified', NOW() - INTERVAL '8 hours'),
            ('SHELL-A', 'Ghost Traders Ltd', 'Corporate', 89, 'Suspended', NOW() - INTERVAL '1 month'),
            ('BANK-OFX', 'Offshore Bank X', 'Corporate', 82, 'Verified', NOW() - INTERVAL '12 hours'),
            ('ACC-9932', 'Kavita Gupta', 'Individual', 76, 'Verified', NOW() - INTERVAL '14 hours'),
            ('GHOST-T', 'Ghost Entity 2', 'Corporate', 74, 'Suspended', NOW() - INTERVAL '2 weeks'),
            ('BANK-DXB', 'Dubai Bank', 'Corporate', 72, 'Verified', NOW() - INTERVAL '3 days'),
            ('ACC-7711', 'Deepak Joshi', 'Individual', 68, 'Verified', NOW() - INTERVAL '4 days'),
            ('ACC-4450', 'Anita Singh', 'Individual', 63, 'Pending Review', NOW() - INTERVAL '5 days'),
            ('ACC-3301', 'Rekha Verma', 'Individual', 54, 'Verified', NOW() - INTERVAL '6 days')
            ON CONFLICT DO NOTHING;
        """)
        
    conn.commit()
    cur.close()
    conn.close()
    print("Entities schema and data initialized successfully.")
except Exception as e:
    print(f"Error: {e}")
