import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get the latest successful deployment instance with domains
query = """
query {
    deployment(id: "d9756990-4b68-4085-9be9-81bb8a7a4a44") {
        id
        status
        serviceId
        instances {
            id
        }
    }
}
"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
data = r.json()
print(json.dumps(data, indent=2)[:1000])
# Get instance ID
instance_id = data.get('data', {}).get('deployment', {}).get('instances', [{}])[0].get('id', '')
print(f"\nInstance ID: {instance_id}")
