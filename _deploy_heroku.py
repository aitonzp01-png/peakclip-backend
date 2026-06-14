import requests, json, time

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Set builder to HEROKU with explicit build/start commands
mutation = """mutation {
    serviceInstanceUpdate(environmentId: "%s", serviceId: "%s", input: {
        builder: HEROKU,
        buildCommand: "npm run build",
        startCommand: "npm start"
    })
}""" % (env_id, service_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=15)
print("HEROKU update:", r.text[:300])

# Deploy
mutation2 = """mutation {
    serviceInstanceDeployV2(serviceId: "%s", environmentId: "%s")
}""" % (service_id, env_id)

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation2}, headers=headers, timeout=15)
deploy_id = r2.json().get("data", {}).get("serviceInstanceDeployV2", "")
print("Deploy ID:", deploy_id)

for i in range(60):
    time.sleep(10)
    q = "query { deployment(id: \"" + deploy_id + "\") { id status } }"
    r3 = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
    d = r3.json().get("data", {}).get("deployment", {})
    s = d.get("status", "")
    print(f"{(i+1)*10}s: {s}")
    if s in ("SUCCESS", "FAILED", "CRASHED"):
        break
