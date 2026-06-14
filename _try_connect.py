import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Try different repo URL formats
for repo_url in [
    "https://github.com/aitonzp01-png/peakclipnuevo.git",
    "aitonzp01-png/peakclipnuevo",
    "github.com/aitonzp01-png/peakclipnuevo",
]:
    mutation = """mutation {
        serviceConnect(id: "%s", input: {
            repo: "%s",
            branch: "master"
        }) {
            id
        }
    }""" % (service_id, repo_url)

    r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
    print(f"\nRepo: {repo_url}")
    data = r.json()
    if "errors" in data:
        print(f"  Error: {data['errors'][0]['message'][:100]}")
    else:
        print(f"  Success: {data}")
        break
