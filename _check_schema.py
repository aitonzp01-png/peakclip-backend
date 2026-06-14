import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check serviceConnect input type
query = """query {
    __type(name: "ServiceConnectInput") {
        name
        inputFields {
            name
            type { name kind ofType { name } }
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2))
