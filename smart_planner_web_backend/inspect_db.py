import sqlite3

conn = sqlite3.connect('smart_planner.db')
cursor = conn.cursor()

# Check all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print(f"Tables in database: {[t[0] for t in tables]}")

# Check tasks table specifically
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'")
create_sql = cursor.fetchone()
print(f"\nCreate statement for tasks table:\n{create_sql[0]}")
