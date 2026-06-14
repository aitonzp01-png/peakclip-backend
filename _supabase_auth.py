import requests, json

# Try to update auth settings via Supabase Management REST API
# Using service_role key for auth admin operations
url = 'https://tjuiourlpbwivjzyewav.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWlvdXJscGJ3aXZqenlld2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwODIxNywiZXhwIjoyMDk2MTg0MjE3fQ.XcxhPAO1Ikl6wl6ydA_YnNiYLX2rMF3iMp8wBxFQadA'

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# Try to get current auth settings
r = requests.get(f'{url}/auth/v1/admin/settings', headers=headers, timeout=15)
print('GET auth settings:', r.status_code, r.text[:300])

# Try to update settings to disable email confirm
# Based on Supabase GoTrue admin API
payload = {
    "external": {
        "email": {
            "enabled": True,
            "autoconfirm": True
        }
    },
    "mailer": {
        "autoconfirm": True
    }
}

# Try various endpoints
endpoints = [
    f'{url}/auth/v1/settings',
    f'{url}/auth/v1/admin/settings',
    f'{url}/auth/v1/admin/config',
    f'{url}/auth/admin/config',
]

for ep in endpoints:
    r = requests.put(ep, headers=headers, json=payload, timeout=15)
    print(f'PUT {ep.split("/")[-1]}: {r.status_code} {r.text[:200]}')
    if r.status_code == 200:
        break
