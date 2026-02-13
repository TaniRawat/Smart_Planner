#!/usr/bin/env python3
import requests
import json

# Test create task
print("Testing task creation...")
token = "test-token-123"
headers = {'Authorization': f'Bearer {token}'}

create_resp = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'testuser@example.com', 'password': 'testpass123'}
)
data = create_resp.json()
token = data['access_token']
headers = {'Authorization': f'Bearer {token}'}

task_data = {
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "medium",
    "due_date": "2026-02-15T10:00:00"
}

create_task_resp = requests.post(
    'http://localhost:8000/api/v1/tasks/',
    json=task_data,
    headers=headers
)
print(f'Create task status: {create_task_resp.status_code}')
print(f'Create task response: {json.dumps(create_task_resp.json(), indent=2)}')

# Try to get tasks again
tasks_resp = requests.get('http://localhost:8000/api/v1/tasks?per_page=200', headers=headers)
print(f'\nGet tasks status: {tasks_resp.status_code}')
print(f'Get tasks response: {json.dumps(tasks_resp.json(), indent=2)[:500]}...')
