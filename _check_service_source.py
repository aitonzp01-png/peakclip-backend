import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check service details
query = """query {
    project(id: "e1decff0-239f-46f1-83c8-040e1c3ebdeb") {
        services {
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
data = r.json()
services = data.get("data", {}).get("project", {}).get("services", {}).get("edges", [])
for s in services:
    sid = s["node"]["id"]
    name = s["node"]["name"]
    
    # Get service details with source info
    q2 = """query {
        service(id: "%s") {
            id
            name
            source {
                ... on GitRepoSource {
                    repo
                    branch
                    rootDirectory
                }
            }
        }
    }""" % sid
    
    r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": q2}, headers=headers, timeout=30)
    print(f"\n=== {name} ({sid}) ===")
    print(json.dumps(r2.json(), indent=2))
