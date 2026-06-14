import requests

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
project_id = "e1decff0-239f-46f1-83c8-040e1c3ebdeb"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

vars = [
    ("NEXT_PUBLIC_SUPABASE_URL", "https://tjuiourlpbwivjzyewav.supabase.co"),
    ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyMTcsImV4cCI6MjA5NjE4NDIxN30.T3ajCu0Ne0YtTBhr6oqb9zCQ9MUBFOSKcV81Yp5MitE"),
    ("NEXT_PUBLIC_BACKEND_URL", "https://peakclip-backend-production.up.railway.app"),
    ("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwODIxNywiZXhwIjoyMDk2MTg0MjE3fQ.XcxhPAO1Ikl6wl6ydA_YnNiYLX2rMF3iMp8wBxFQadA"),
]

for name, value in vars:
    mutation = "mutation { variableUpsert(input: { environmentId: \"" + env_id + "\", projectId: \"" + project_id + "\", serviceId: \"" + service_id + "\", name: \"" + name + "\", value: \"" + value + "\" }) }"
    r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=60)
    if r.status_code != 200 or "error" in r.text.lower():
        print(f"FAIL {name}: {r.text[:100]}")
    else:
        print(f"OK   {name}")
