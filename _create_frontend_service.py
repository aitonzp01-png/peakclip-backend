import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Create a new service for the frontend
mutation = """mutation {
    serviceCreate(
        input: {
            projectId: "e1decff0-239f-46f1-83c8-040e1c3ebdeb",
            name: "peakclip-frontend"
        }
    ) {
        id
        name
    }
}"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
print("Create service:", json.dumps(r.json(), indent=2))
