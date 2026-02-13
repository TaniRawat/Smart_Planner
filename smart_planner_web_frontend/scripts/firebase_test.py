import requests
import os

API_KEY = os.environ.get('VITE_FIREBASE_API_KEY') or 'AIzaSyCNJ9YYFb7zjagO1qxPtH8-mWfYp68M8kg'
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
body = {
    "email": "noone@example.com",
    "password": "wrongpass",
    "returnSecureToken": True,
}

resp = requests.post(url, json=body)
print('STATUS', resp.status_code)
print(resp.text)
