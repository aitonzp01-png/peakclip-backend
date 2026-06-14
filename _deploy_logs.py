import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"

# Get deployment failure details
query = """query {
    deployments(input: { serviceId: "%s", environmentId: "%s" }) {
        edges {
            node {
                id
                status
                createdAt
                staticUrl
            }
        }
    }
}""" % (service_id, env_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2)[:2000])
