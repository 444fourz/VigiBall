import sqlite3
import os

# This finds the folder where THIS script is saved
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# This joins that folder with the database name
DB_PATH = os.path.join(BASE_DIR, 'vigiball_v2.db') 

print(f"Connecting to: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
try:
    cursor = conn.execute("SELECT * FROM stats_2526 LIMIT 1")
    cols = [description[0] for description in cursor.description]
    print("✅ Table Found! Columns:", cols)
except sqlite3.OperationalError as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()