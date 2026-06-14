import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Try using deployment logs API
query = """query {
    deployment(id: "658b2b3d-a11d-498d-9028-110f474a9dd7") {
        id
        status
        meta
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2)[:1000])
