import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Search for log-related types and fields
query = """query {
    __schema {
        types {
            name
            kind
        }
    }
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
types = r.json().get("data", {}).get("__schema", {}).get("types", [])
log_types = [t for t in types if "log" in t["name"].lower() or "Log" in t["name"]]
print("Log types:", json.dumps(log_types, indent=2))
