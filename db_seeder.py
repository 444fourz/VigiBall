import sqlite3
import pandas as pd
import os

DB_NAME = "vigiball.db"
DATA_FILES = {
    "2024-2025": "players_data-2024_2025.csv",
    "2025-2026": "players_data-2025_2026.csv"  # Will be updated as season goes on
}

# Mapping the CSV File headings to Table names and making them more appropriate
COLUMN_MAP = {
    # Player Identities
    "Player": "name",
    "Nation": "nation",
    "Pos": "pos",
    "Squad": "squad",
    "Comp": "comp",
    "Age": "age",
    "90s": "n90s",

    # Attackers (FW)
    "xG": "xg",
    "G-PK": "npg",
    "xAG": "xag",
    "GCA90": "gca90",
    "PrgC": "prgc",
    "Succ%": "succ_pct",
    "SoT%": "sot_pct",
    "Att Pen": "touches_box",

    # Midfielders (MF)
    "KP": "kp",
    "Cmp%": "cmp_pct",
    "PrgP": "prgp",
    "Tkl%": "tkl_pct",
    "Int": "interceptions",
    "Mis": "miscontrols",
    "Dis": "dispossessed",

    # Defenders (DF)
    "Won%": "aerial_won_pct",
    "Att 3rd": "def_act_att_3rd",
    "Recov": "recoveries",
    "PrgDist": "prg_pass_dist",
    "Blocks": "blocks",
    "Tkl+Int": "tkl_int",
    "Clr": "clearances",

    # Goalkeepers (GK)
    "PSxG+/-": "psxg_plus_minus",
    "Save%": "save_pct",
    "Stp%": "cross_stop_pct",
    "Launch%": "launch_pct",
    "#OPA": "opa_sweeper"
}

def clean_percentage(value):
    # Making Percentages into Floats
    if pd.isna(value): return None
    return float(str(value).replace('%', ''))

def clean_age(value):
    # Converts the player age from '25-082' (years-days) to float 25.22 by doing days/365
    if pd.isna(value): return None
    s = str(value)
    if '-' in s:
        parts = s.split('-')
        return float(parts[0]) + (float(parts[1]) / 365.0)
    return float(s)

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # --- 1. PLAYERS TABLE ---
    # Build schema dynamically from our map
    # All columns are REAL (numbers) except identity columns
    text_cols = ["name", "nation", "pos", "squad", "comp", "season"]
    columns_sql = []
    
    for db_col in COLUMN_MAP.values():
        col_type = "TEXT" if db_col in text_cols else "REAL"
        columns_sql.append(f"{db_col} {col_type}")
    
    columns_sql_str = ", ".join(columns_sql)

    create_players_sql = f"""
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season TEXT,
        {columns_sql_str}
    );
    """
    cursor.execute(create_players_sql)

    # --- 2. USER BIDS TABLE ---
    # Stores the experimental results (User Valuation vs AI Valuation)
    create_bids_sql = """
    CREATE TABLE IF NOT EXISTS user_bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        player_id INTEGER,
        phase TEXT,          -- 'phase1', 'phase2', 'phase3'
        bid_amount REAL,
        time_taken REAL,     -- Seconds taken to bid
        mvpa_shown REAL,     -- The AI price shown (if any)
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id)
    );
    """
    cursor.execute(create_bids_sql)

    conn.commit()
    conn.close()
    print(f"✅ Database initialized: {DB_NAME} (Tables: players, user_bids)")

def seed_season(season, filepath):
    # Reads CSV, cleans it, wipes old season data, inserts new data
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filepath}. Skipping {season}.")
        return

    print(f"🔄 Seeding {season} from {filepath}...")
    
    # 1. Load Data
    df = pd.read_csv(filepath)
    
    # 2. Filter & Rename Columns
    # Keep only the columns we mapped
    existing_cols = [c for c in COLUMN_MAP.keys() if c in df.columns]
    df = df[existing_cols].copy()
    df.rename(columns=COLUMN_MAP, inplace=True)
    
    # 3. Clean Data
    if 'age' in df.columns:
        df['age'] = df['age'].apply(clean_age)
    
    # List of likely percentage columns to clean
    pct_cols = ['succ_pct', 'sot_pct', 'cmp_pct', 'tkl_pct', 'aerial_won_pct', 'save_pct', 'cross_stop_pct', 'launch_pct']
    for col in pct_cols:
        if col in df.columns:
            df[col] = df[col].apply(clean_percentage)

    # 4. Add Season Column
    df['season'] = season

    # 5. Database Operations
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # DELETE existing data for this season (Prevents duplicates when re-running)
    cursor.execute("DELETE FROM players WHERE season = ?", (season,))
    deleted_count = cursor.rowcount
    if deleted_count > 0:
        print(f"   - Removed {deleted_count} old records for {season}")

    # INSERT new data
    df.to_sql('players', conn, if_exists='append', index=False)
    print(f"   - Inserted {len(df)} records for {season}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    for season, file in DATA_FILES.items():
        seed_season(season, file)
    print("\n🚀 Database seeding complete!")