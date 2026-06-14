import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
project_id = "eab72b87-774e-44b8-8d7a-4f59a42b48fa"
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Get variables for the frontend service
query = """query VariablesForServiceDeployment($projectId: String!, $environmentId: String!, $serviceId: String!) {
    variablesForServiceDeployment(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
}"""
r = requests.post("https://api.railway.app/graphql/v2", json={"query": query, "variables": {
    "projectId": project_id,
    "environmentId": env_id,
    "serviceId": service_id
}}, headers=headers, timeout=15)
print(json.dumps(r.json(), indent=2))
