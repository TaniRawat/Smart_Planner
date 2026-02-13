#!/usr/bin/env python3
import requests
import json

# Login
print("Testing login...")
login_resp = requests.post('http://localhost:8000/api/v1/auth/login', json={'email': 'testuser@example.com', 'password': 'testpass123'})
print(f'Login status: {login_resp.status_code}')
login_data = login_resp.json()
print(f'Login response: {json.dumps(login_data, indent=2)}')
token = login_data['access_token']

# Get tasks with token
print("\nTesting /tasks endpoint with token...")
headers = {'Authorization': f'Bearer {token}'}
print(f'Headers: {headers}')
tasks_resp = requests.get('http://localhost:8000/api/v1/tasks?per_page=200', headers=headers)
print(f'Tasks status: {tasks_resp.status_code}')
print(f'Tasks response: {json.dumps(tasks_resp.json(), indent=2)}')
