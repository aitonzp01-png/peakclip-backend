import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get the variableCollectionUpsert mutation details
query = """query {
    __type(name: "Mutation") {
        fields {
            name
            args {
                name
                type { name kind ofType { name kind ofType { name } } }
            }
        }
    }
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
fields = r.json().get("data", {}).get("__type", {}).get("fields", [])
for f in fields:
    if "variable" in f["name"].lower():
        print(f["name"])
        for a in f["args"]:
            print(f"  {a['name']}: {a['type']['name']} ({a['type']['kind']})")
