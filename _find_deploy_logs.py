import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get query fields - look for log-related queries
query = """query {
    __schema {
        queryType {
            fields {
                name
                args { name type { name kind } }
                type { name kind ofType { name } }
            }
        }
    }
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
fields = r.json().get("data", {}).get("__schema", {}).get("queryType", {}).get("fields", [])
log_fields = [f for f in fields if "log" in f["name"].lower()]
print("Log queries:", json.dumps(log_fields, indent=2))
print("---")
# Also look for deployment-related queries
deploy_fields = [f for f in fields if "deploy" in f["name"].lower()]
print("Deploy queries:", len(deploy_fields))
for f in deploy_fields:
    print(f["name"], f["args"])
