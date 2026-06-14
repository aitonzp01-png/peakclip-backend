import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Clear buildCommand and startCommand so railway.json takes over
mutation = """mutation {
    serviceInstanceUpdate(environmentId: "%s", serviceId: "%s", input: {
        buildCommand: "",
        startCommand: ""
    })
}""" % (env_id, service_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=15)
print("Clear commands:", r.text[:200])

# Trigger deploy
mutation2 = """mutation {
    serviceInstanceDeployV2(serviceId: "%s", environmentId: "%s")
}""" % (service_id, env_id)

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation2}, headers=headers, timeout=15)
result = r2.json()
print("Deploy:", json.dumps(result, indent=2))
deploy_id = result.get("data", {}).get("serviceInstanceDeployV2", "")
print("Deploy ID:", deploy_id)

# Monitor
if deploy_id:
    import time
    for i in range(30):
        time.sleep(10)
        q = "query { deployment(id: \"" + deploy_id + "\") { id status } }"
        r3 = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
        d = r3.json().get("data", {}).get("deployment", {})
        print(f"{(i+1)*10}s: {d.get('status', '')}")
        if d.get("status") in ("SUCCESS", "FAILED", "CRASHED"):
            break
