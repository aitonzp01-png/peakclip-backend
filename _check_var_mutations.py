import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Find variable mutations
query = """query {
    __schema {
        mutationType {
            fields {
                name
                args { name type { name kind ofType { name } } }
            }
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
data = r.json()
for field in data.get("data", {}).get("__schema", {}).get("mutationType", {}).get("fields", []):
    if "variable" in field["name"].lower():
        print(f"\n{field['name']}")
        for arg in field.get("args", []):
            print(f"  {arg['name']}: {arg['type']['name']}")
        # Check input type
        for arg in field.get("args", []):
            if "input" in arg["name"].lower():
                print(f"  Input type: {arg['type']['name']}")
