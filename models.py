import requests

response = requests.get(
    "https://api.intelligence.io.net/v1/models",
    headers={"Authorization": "Bearer io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6ImYxYjcwNmE2LWRlYTEtNDA3MC1iMDAyLTRmMzkwNTQ4YjIxOSIsImV4cCI6NDkzMjE4NDA0N30.Ky8v0R_Lt6G0VgGSL6P43PyHrlPRS0ukyXdDryhPBvlYQvEbLZ6_IuzmEN1Bz5uzqjqc2MPQ8qX8grfa8lKXXA"}
)

models = response.json()["data"]
attestation_models = [m for m in models if m.get("supports_attestation")]

for model in attestation_models:
    print(f"{model['name']}: {model['model_id']}")