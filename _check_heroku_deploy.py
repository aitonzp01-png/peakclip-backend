import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

q = "query { deployment(id: \"d184952e-7cbf-4d1a-bc91-ac2fad7c9eb2\") { id status meta } }"
r = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2)[:3000])
