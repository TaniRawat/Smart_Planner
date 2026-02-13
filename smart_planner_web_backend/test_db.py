import sqlite3

conn = sqlite3.connect('smart_planner.db')
cursor = conn.cursor()

# Try the query directly
try:
    cursor.execute("SELECT * FROM tasks LIMIT 1")
    print("Query succeeded")
    columns = [desc[0] for desc in cursor.description]
    print(f"Columns: {columns}")
except Exception as e:
    print(f"Query failed: {e}")

# Check for views
cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
views = cursor.fetchall()
print(f"Views: {views}")
