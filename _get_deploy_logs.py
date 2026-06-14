import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
deploy_id = "44bbbc62-9be3-4a08-b906-bd642eab4d50"

# Try buildLogs first
q = """query {
    buildLogs(deploymentId: "%s", limit: 500) {
        severity
        message
        timestamp
        tags { deploymentId serviceId }
    }
}""" % deploy_id

import sys
sys.stdout.reconfigure(encoding='utf-8')  # noqa

r = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=30)
result = r.json()
data = result.get("data", {}).get("buildLogs", [])
for log in data[15:]:
    msg = log.get("message", "")
    if msg:
        print(msg)
if len(data) == 500:
    print("---TRUNCATED---")
