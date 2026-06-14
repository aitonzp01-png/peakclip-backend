import requests, json, time

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"

# Get latest commit SHA
q = """query {
    deployments(input: { serviceId: "%s", environmentId: "%s" }) {
        edges {
            node {
                id
                status
                createdAt
            }
        }
    }
}""" % (service_id, env_id)

# Deploy from latest commit
mutation = """mutation {
    serviceInstanceDeployV2(serviceId: "%s", environmentId: "%s")
}""" % (service_id, env_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=15)
result = r.json()
print("Deploy result:", json.dumps(result, indent=2))
deploy_id = result.get("data", {}).get("serviceInstanceDeployV2", "")
print("Deploy ID:", deploy_id)

# Wait for build
if deploy_id:
    for i in range(20):
        time.sleep(15)
        q = "query { deployment(id: \"" + deploy_id + "\") { id status url } }"
        r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
        d = r2.json().get("data", {}).get("deployment", {})
        print(f"{(i+1)*15}s: {d.get('status', '')} url={d.get('url', 'none')}")
        if d.get("status") in ("SUCCESS", "FAILED", "CRASHED"):
            break
