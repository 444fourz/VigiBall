CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    squad TEXT,
    comp TEXT,
    p_score REAL,
    base_value REAL,
    elite_score REAL,
    market_premium REAL,
    final_mvpa REAL,
    scout_note TEXT
);

CREATE TABLE IF NOT EXISTS user_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    player_id INTEGER,
    phase1_bid REAL,
    phase2_bid REAL,
    phase3_bid REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players (id)
);