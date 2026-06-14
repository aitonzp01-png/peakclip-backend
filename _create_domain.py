import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"

# Create a Railway domain for the frontend
mutation = """mutation {
    serviceDomainCreate(input: {
        serviceId: "%s",
        environmentId: "%s"
    }) {
        id
        domain
    }
}""" % (service_id, env_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
print("Create domain:", json.dumps(r.json(), indent=2))

# Check instance config to see build/start commands
query = """query {
    serviceInstance(environmentId: "%s", serviceId: "%s") {
        id
        buildCommand
        startCommand
        rootDirectory
    }
}""" % (env_id, service_id)

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print("Instance config:", json.dumps(r2.json(), indent=2))
