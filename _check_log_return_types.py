import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get the return type of deploymentLogs query
query = """query {
    __schema {
        queryType {
            fields {
                name
                type { name kind ofType { name kind ofType { name kind ofType { name } } } }
            }
        }
    }
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
fields = r.json().get("data", {}).get("__schema", {}).get("queryType", {}).get("fields", [])
for f in fields:
    if f["name"] == "deploymentLogs":
        print("deploymentLogs return type:", json.dumps(f["type"], indent=2))

# Also check buildLogs return type
for f in fields:
    if f["name"] == "buildLogs":
        print("buildLogs return type:", json.dumps(f["type"], indent=2))
