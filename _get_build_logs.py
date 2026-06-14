import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Try the railway logs API endpoint
r = requests.get(
    "https://api.railway.app/v2/deployments/479c3fbf-516e-4426-a8ea-f9031e026495/logs",
    headers=headers,
    timeout=15
)
print(f"Logs API: {r.status_code}")
print(r.text[:2000])
