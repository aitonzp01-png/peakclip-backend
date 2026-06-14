import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
project_id = "e1decff0-239f-46f1-83c8-040e1c3ebdeb"
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
service_id = "4fa6072f-a613-4641-b3e1-b0361990c2c7"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

variables = [
    ("PUBLIC_URL", "https://peakclip-backend-production.up.railway.app"),
    ("FRONTEND_URL", "https://peakclip-app.railway.app"),
]

for name, value in variables:
    mutation = """
    mutation {
        variableUpsert(input: {
            projectId: "%s",
            environmentId: "%s",
            serviceId: "%s",
            name: "%s",
            value: "%s"
        })
    }
    """ % (project_id, env_id, service_id, name, value)

    r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=60)
    result = r.json()
    if 'data' in result:
        print(f"OK: {name} = {value}")
    else:
        print(f"FAIL: {name} - {result}")
