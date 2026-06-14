import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check input types
query = """query {
    __type(name: "VariableUpsertInput") {
        inputFields { name type { name kind ofType { name kind ofType { name } } } }
    }
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
print("VariableUpsertInput:", json.dumps(r.json(), indent=2))

query2 = """query {
    __type(name: "VariableCollectionUpsertInput") {
        inputFields { name type { name kind ofType { name kind ofType { name } } } }
    }
}"""
r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": query2}, headers=headers, timeout=15)
print("VariableCollectionUpsertInput:", json.dumps(r2.json(), indent=2))
