import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
deploy_id = "658b2b3d-a11d-498d-9028-110f474a9dd7"

# Try to get build steps/logs
for query_name, q in [
    ("steps", "query { deployment(id: \"" + deploy_id + "\") { id status steps { edges { node { ... on DeploymentStep { id stepName status } } } } } }"),
    ("logs", "query { deployment(id: \"" + deploy_id + "\") { id status } }"),
]:
    r = requests.post("https://api.railway.app/graphql/v2", json={"query": q}, headers=headers, timeout=15)
    print(f"\n=== {query_name} ===")
    print(json.dumps(r.json(), indent=2)[:500])
