import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
service_id = "d9ec568e-5f74-492d-88cf-596dd499d2ea"

# Connect service to GitHub repo
mutation = """mutation {
    serviceInstanceConnect(
        input: {
            serviceId: "%s",
            source: {
                repo: "https://github.com/aitonzp01-png/peakclipnuevo.git",
                branch: "master",
                rootDirectory: "peakclip-app"
            }
        }
    ) {
        id
    }
}""" % service_id

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=30)
print("Connect service:", json.dumps(r.json(), indent=2))
