import sqlite3
import pandas as pd
import os

# Define paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
NEW_DB_PATH = os.path.join(CURRENT_DIR, 'vigiball_v2.db')
CSV_2425 = os.path.join(CURRENT_DIR, "players_data-2024_2025.csv")
CSV_2526 = os.path.join(CURRENT_DIR, "players_data-2025_2026.csv")

def migrate():
    # Connect to the NEW database
    conn = sqlite3.connect(NEW_DB_PATH)
    
    # 1. Process 2024/25 Data
    if os.path.exists(CSV_2425):
        df_2425 = pd.read_csv(CSV_2425)
        # Clean column names (remove spaces/lowercase for easier SQL)
        df_2425.columns = [c.lower().replace(' ', '_') for c in df_2425.columns]
        df_2425.to_sql('stats_2425', conn, if_exists='replace', index=False)
        print("✅ stats_2425 table created.")
    
    # 2. Process 2025/26 Data
    if os.path.exists(CSV_2526):
        df_2526 = pd.read_csv(CSV_2526)
        df_2526.columns = [c.lower().replace(' ', '_') for c in df_2526.columns]
        df_2526.to_sql('stats_2526', conn, if_exists='replace', index=False)
        print("✅ stats_2526 table created.")

    conn.close()
    print(f"\nMigration complete! New database at: {NEW_DB_PATH}")

if __name__ == "__main__":
    migrate()