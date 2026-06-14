import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check VariableUpsertInput
for t in ["VariableUpsertInput", "VariableCollectionUpsertInput"]:
    query = """query {
        __type(name: "%s") {
            name
            inputFields {
                name
                type { name kind }
            }
        }
    }""" % t
    r = requests.post("https://api.railway.app/graphql/v2", json={"query": query}, headers=headers, timeout=30)
    data = r.json()
    type_data = data.get("data", {}).get("__type")
    print(f"\n=== {t} ===")
    if type_data:
        for field in type_data.get("inputFields", []):
            print(f"  {field['name']}: {field['type']['name']}")
    else:
        print(f"  Not found")
