import requests, json

token = "fa6ae6e5-e2d1-4386-88c2-8ee2afc1318b"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
env_id = "d7af84c3-eec9-4033-a884-9a0c42b0f05e"
project_id = "eab72b87-774e-44b8-8d7a-4f59a42b48fa"

# Set project-level variables (shared across all services in this environment)
# These will be available during build
mutation = """mutation {
    variableCollectionUpsert(projectId: "%s", environmentId: "%s", collection: VARIABLE_COLLECTION_PROJECT, variables: [
        {name: "NEXT_PUBLIC_SUPABASE_URL", value: "https://cjcvvvwbzqqyegtfiprb.supabase.co"},
        {name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY3Z2dndienFxeWVndGZpcHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTU2NDUsImV4cCI6MjA2Mjg3MTY0NX0.EgxqA2vnFxVq7E5Tj2W2LOFRK78yq2GBZgLhMH6nSMg"},
        {name: "NEXT_PUBLIC_BACKEND_URL", value: "https://peakclip-backend-production.up.railway.app"}
    ])
}""" % (project_id, env_id)

r = requests.post("https://api.railway.app/graphql/v2", json={"query": mutation}, headers=headers, timeout=15)
print("Project vars:", r.text[:500])
