import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

q = "query { deployment(id: \"479c3fbf-516e-4426-a8ea-f9031e026495\") { id status meta diagnosis } }"
r = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2)[:2000])
