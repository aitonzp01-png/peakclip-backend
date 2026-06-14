import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check Builder enum values
query = """query {
    __type(name: "Builder") {
        enumValues {
            name
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2))
