import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
deploy_id = "8aae18fd-0bd4-4af9-b288-9b27db124f90"

# Check deployment events
query = """query {
    deployment(id: "%s") {
        id
        status
        meta
        diagnosis
        canRedeploy
    }
}""" % deploy_id

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2))

# Check if there's a build step
q2 = """query {
    __type(name: "Deployment") {
        fields {
            name
            type { name kind }
        }
    }
}"""

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": q2}, headers=headers, timeout=15)
print("Deployment fields:", json.dumps(r2.json(), indent=2)[:2000])
