import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get environments
query = """query {
    project(id: "e1decff0-239f-46f1-83c8-040e1c3ebdeb") {
        environments {
            edges {
                node {
                    id
                    name
                }
            }
        }
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2))

# Also check EnvironmentVariables type
query2 = """query {
    __type(name: "EnvironmentVariables") {
        name
        inputFields {
            name
            type { name kind }
        }
    }
}"""

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": query2}, headers=headers, timeout=30)
print("EnvVars type:", json.dumps(r2.json(), indent=2))
