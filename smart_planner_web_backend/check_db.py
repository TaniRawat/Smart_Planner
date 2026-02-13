import sqlite3

conn = sqlite3.connect('smart_planner.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(tasks)")
cols = cursor.fetchall()
for c in cols:
    print(f"{c[1]} ({c[2]})")
