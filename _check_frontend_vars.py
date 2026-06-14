import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
project_id = "eab72b87-774e-44b8-8d7a-4f59a42b48fa"

# Check env vars for the frontend service
query = """query {
    variables(projectId: "%s", environmentId: "%s") {
        name
        value
    }
}""" % (project_id, env_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2))
