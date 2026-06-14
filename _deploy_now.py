import requests, json, time

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Set build/start commands
mutation = """mutation {
    serviceInstanceUpdate(environmentId: "%s", serviceId: "%s", input: {
        buildCommand: "npm run build",
        startCommand: "npm start"
    })
}""" % (env_id, service_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
print("Set commands:", r.status_code, r.text[:200])

time.sleep(2)

# Deploy from latest commit on master
mutation2 = """mutation {
    serviceInstanceDeployV2(serviceId: "%s", environmentId: "%s")
}""" % (service_id, env_id)

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation2}, headers=headers, timeout=30)
print("Deploy:", json.dumps(r2.json(), indent=2))
new_deploy_id = r2.json().get("data", {}).get("serviceInstanceDeployV2", "")
print("Deploy ID:", new_deploy_id)

# Wait and check
if new_deploy_id:
    for i in range(15):
        time.sleep(10)
        q = "query { deployment(id: \"" + new_deploy_id + "\") { id status url } }"
        r3 = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
        d = r3.json().get("data", {}).get("deployment", {})
        print(f"{i*10}s: {d.get('status', '')} url={d.get('url', 'none')}")
        if d.get("status") in ("SUCCESS", "FAILED", "CRASHED"):
            break
