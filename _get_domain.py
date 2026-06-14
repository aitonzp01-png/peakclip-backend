import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get domains from instance
query = """
query {
    serviceInstance(id: "e551d0c4-ca73-4557-adbc-5881d5c16bf2") {
        id
        domains {
            serviceDomains {
                domain
            }
            customDomains {
                domain
            }
        }
    }
}
"""

r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
print(json.dumps(r.json(), indent=2)[:2000])
