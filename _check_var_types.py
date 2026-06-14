import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check VariableCollectionUpsertInput fully
query = """query {
    upsertType: __type(name: "VariableCollectionUpsertInput") {
        inputFields {
            name
            type { name kind ofType { name kind ofType { name } } }
        }
    }
    varInput: __type(name: "VariableInput") {
        inputFields {
            name
            type { name kind }
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2))
