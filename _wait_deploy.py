import requests, time

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
deploy_id = "55065a97-1a19-462f-95d0-859a34a11ec4"

for i in range(12):
    time.sleep(10)
    q = "query { deployment(id: \"" + deploy_id + "\") { id status url staticUrl } }"
    r = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
    d = r.json().get("data", {}).get("deployment", {})
    print(f"{i*10}s: {d.get('status', '')} url={d.get('url', '') or d.get('staticUrl', '')}")
    if d.get("status") in ("SUCCESS", "FAILED", "CRASHED"):
        break
