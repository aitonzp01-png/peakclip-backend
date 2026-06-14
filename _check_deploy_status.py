import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check deployment status
query = """query {
    deployment(id: "6ea44080-8f01-4460-a587-dd7bce2f6f7a") {
        id
        status
        serviceId
        url
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2))
