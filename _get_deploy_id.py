import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

query = """
query {
    project(id: "e1decff0-239f-46f1-83c8-040e1c3ebdeb") {
        deployments {
            edges {
                node {
                    id
                    serviceId
                    status
                    createdAt
                }
            }
        }
    }
}
"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
data = r.json()
for dep in data.get('data', {}).get('project', {}).get('deployments', {}).get('edges', []):
    n = dep['node']
    if n['status'] == 'SUCCESS' and n['serviceId'] == '4fa6072f-a613-4641-b3e1-b0361990c2c7':
        print(f"DEPLOYMENT ID: {n['id']}")
        print(f"Status: {n['status']}")
        print(f"Created: {n['createdAt']}")
        break
