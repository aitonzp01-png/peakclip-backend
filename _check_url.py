import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check latest successful deployment
query = """query {
    deployment(id: "f0d48def-4ab9-4198-a7cf-18539e1f8521") {
        id
        status
        url
        staticUrl
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print("Deployment:", json.dumps(r.json(), indent=2))

# Check service for URL/domain
query2 = """query {
    service(id: "d9ec568e-5f74-492d-88cf-596dd499d2ea") {
        id
        name
    }
}"""

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": query2}, headers=headers, timeout=30)
print("Service:", json.dumps(r2.json(), indent=2))
