import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Set build command and start command explicitly for Next.js
mutation = """mutation {
    serviceInstanceUpdate(environmentId: "%s", serviceId: "%s", input: {
        buildCommand: "npm run build",
        startCommand: "npm start"
    })
}""" % (env_id, service_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
print("Set build/start commands:", r.status_code, r.text[:200])

# Trigger new deploy
mutation2 = """mutation {
    serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s")
}""" % (service_id, env_id)

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation2}, headers=headers, timeout=30)
print("Redeploy:", json.dumps(r2.json(), indent=2))
