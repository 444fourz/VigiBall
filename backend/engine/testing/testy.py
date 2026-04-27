import sqlite3

def setup_evaluation_table():
    conn = sqlite3.connect('vigiball_v2.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id TEXT,
            player_name TEXT,
            initial_guess REAL,
            ai_suggested_value REAL,
            final_decision REAL,
            bias_score REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

setup_evaluation_table()