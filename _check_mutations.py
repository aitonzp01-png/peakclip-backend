import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Introspect mutations related to service
query = """query {
    __schema {
        mutationType {
            fields {
                name
                args { name type { name kind } }
            }
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
data = r.json()
# Filter for service-related mutations
for field in data.get("data", {}).get("__schema", {}).get("mutationType", {}).get("fields", []):
    if "service" in field["name"].lower():
        print(f"\n{field['name']}")
        for arg in field.get("args", []):
            print(f"  {arg['name']}: {arg['type']['name']}")
