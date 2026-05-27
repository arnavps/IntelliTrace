import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("c:/Users/HARNISH N DANGI/OneDrive/Desktop/IntelliTrace/backend/.env")

db_url = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
if not db_url:
    print("Database URL not found.")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Check if last_login exists
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' and column_name='last_login';
    """)
    if not cur.fetchone():
        print("Adding last_login to users...")
        cur.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;")
        
    # Check if mfa_enabled exists
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' and column_name='mfa_enabled';
    """)
    if not cur.fetchone():
        print("Adding mfa_enabled to users...")
        cur.execute("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;")
        
    # Check if role exists
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' and column_name='role';
    """)
    if not cur.fetchone():
        print("Adding role to users...")
        cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Analyst';")
        
    # Check if status exists
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' and column_name='status';
    """)
    if not cur.fetchone():
        print("Adding status to users...")
        cur.execute("ALTER TABLE users ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active';")
        
    conn.commit()
    cur.close()
    conn.close()
    print("Database updated successfully! You can now login.")
except Exception as e:
    print(f"Error: {e}")
