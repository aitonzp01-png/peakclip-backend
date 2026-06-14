import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

query = """
query {
    serviceInstance(
        environmentId: "d7af84c3-eec9-4033-a884-9a0c42b0f05e",
        serviceId: "4fa6072f-a613-4641-b3e1-b0361990c2c7"
    ) {
        id
        domains {
            serviceDomains {
                domain
            }
        }
    }
}
"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
data = r.json()
print(json.dumps(data, indent=2)[:2000])
