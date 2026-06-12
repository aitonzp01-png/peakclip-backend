import os, sys
import httpx
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

project_ref = SUPABASE_URL.split("https://")[1].split(".")[0]
sql = open("schema.sql").read()
headers = {"Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json"}

# Try different known Supabase SQL API endpoints
endpoints = [
    f"https://{project_ref}.supabase.co/sql/v1/query",
    f"https://{project_ref}.supabase.co/rest/v1/rpc/",
    f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
]

for url in endpoints:
    print(f"Trying {url} ...")
    try:
        res = httpx.post(url, json={"query": sql}, headers=headers, timeout=30)
        print(f"  Status: {res.status_code}")
        if res.status_code == 200:
            print("  OK!")
            break
        else:
            print(f"  Response: {res.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")
else:
    print("\nCould not execute SQL automatically.")
    print("Please open https://supabase.com/dashboard/project/tjuiourlpbwivjzyewav/sql/new")
    print("Copy the contents of backend/schema.sql and paste it there, then click Run.")
