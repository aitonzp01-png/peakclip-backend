import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
project_id = "e1decff0-239f-46f1-83c8-040e1c3ebdeb"

# Try to delete the old service first
delete_mutation = """mutation {
    serviceDelete(id: "d9ec568e-5f74-492d-88cf-596dd499d2ea")
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": delete_mutation}, headers=headers, timeout=30)
print("Delete:", json.dumps(r.json(), indent=2))

# Create new service with source directly
create_mutation = """mutation {
    serviceCreate(input: {
        name: "peakclip-frontend",
        projectId: "%s",
        source: {
            repo: "https://github.com/aitonzp01-png/peakclipnuevo.git",
            branch: "master"
        }
    }) {
        id
        name
    }
}""" % project_id

r2 = requests.post("https://api.railway.app/graphql/v2", json={"query": create_mutation}, headers=headers, timeout=30)
print("Create with source:", json.dumps(r2.json(), indent=2))
