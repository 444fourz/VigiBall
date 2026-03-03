import sqlite3
import pandas as pd
import os

# Ensure we have the correct path to your database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'vigiball.db')

def check_player_ages(player_name):
    conn = sqlite3.connect(DB_PATH)
    
    # We query for name, season, and age to see how they are paired in the database
    query = """
    SELECT name, season, age, squad 
    FROM players 
    WHERE name LIKE ? 
    ORDER BY season DESC
    """
    
    df = pd.read_sql(query, conn, params=(f"%{player_name}%",))
    
    print(f"\n--- Database Records for: {player_name} ---")
    if df.empty:
        print("No records found.")
    else:
        print(df.to_string(index=False))
    
    conn.close()

# Let's check our two "Age Trap" players
check_player_ages("Bruno Fernandes")
check_player_ages("Bukayo Saka")