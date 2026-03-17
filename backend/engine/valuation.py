import sqlite3
import pandas as pd
from scipy import stats  # Ensure this is installed: pip install scipy
import os

# Setup Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, '..', 'vigiball_v2.db')
CSV_PATH_2425 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2024_2025.csv"
CSV_PATH_2526 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2025_2026.csv"

# --- CONFIGURATION ---

STAT_PROFILES = {
    'FW': {'xg': True, 'gls': True, 'xag': True, 'gca90': True, 'prgc': True, 'succ%': True, 'att_pen': True},
    'AM': {'xag': True, 'kp': True, 'prgp': True, 'gca90': True, 'prgc': True, 'att_pen': True},
    'CM': {'xag': True, 'kp': True, 'cmp%': True, 'prgp': True, 'tkl%': True, 'int': True},
    'DM': {'cmp%': True, 'tkl%': True, 'int': True, 'recov': True, 'prgdist': True, 'tkl+int': True},
    'DF': {'won%': True, 'recov': True, 'prgdist': True, 'blocks': True, 'tkl+int': True, 'clr': True}
}

def get_raw_csv_stats(player_name):
    total_mp, total_gls, total_ast = 0, 0, 0
    search_name = player_name.strip().lower()
    for path in [CSV_PATH_2425, CSV_PATH_2526]:
        if os.path.exists(path):
            try:
                df_raw = pd.read_csv(path)
                p_match = df_raw[df_raw['Player'].str.lower().str.contains(search_name, na=False)]
                if not p_match.empty:
                    total_mp += p_match['MP'].sum()
                    total_gls += p_match['Gls'].sum()
                    total_ast += p_match['Ast'].sum()
            except: continue
    return int(total_mp), int(total_gls), int(total_ast)

def get_primary_position(pos_string, player_name):
    overrides = {"Odegaard": "AM", "Palmer": "AM", "De Bruyne": "AM", "Rice": "DM", "Rodri": "DM"}
    for name, pos in overrides.items():
        if name in player_name: return pos
    pos_string = str(pos_string).upper()
    if 'FW' in pos_string: return 'FW'
    if 'DF' in pos_string: return 'DF'
    return 'CM'

def generate_scout_note(name, pos, age, squad, market_value, p_score):
    return [
        f"Subject identified: {name}", 
        f"Role: {pos}", 
        f"Performance Score: {p_score}/10",
        f"Market Context: {squad}",
        f"AI Estimate: £{market_value}M"
    ]

# --- MAIN ENGINE ---

def calculate_valuation(player_name):
    raw_mp, raw_gls, raw_ast = get_raw_csv_stats(player_name)
    conn = sqlite3.connect(DB_PATH)
    search_term = f"%{player_name}%"
    
    # Fetch Data
    df_2425 = pd.read_sql("SELECT * FROM stats_2425 WHERE player LIKE ?", conn, params=(search_term,))
    df_2526 = pd.read_sql("SELECT * FROM stats_2526 WHERE player LIKE ?", conn, params=(search_term,))

    # SAFETY CHECK 1: Player Existence
    if df_2425.empty and df_2526.empty:
        conn.close()
        return {"error": "Player not found."}

    # Bio Info
    latest_record = df_2526.iloc[0] if not df_2526.empty else df_2425.iloc[0]
    pos_group = get_primary_position(latest_record['pos'], latest_record['player'])
    age = float(latest_record['age'])
    squad = latest_record['squad']
    
    # Stat Averaging
    if not df_2526.empty and not df_2425.empty:
        player_stats = (df_2526.mean(numeric_only=True) * 0.6) + (df_2425.mean(numeric_only=True) * 0.4)
    else:
        player_stats = df_2526.mean(numeric_only=True) if not df_2526.empty else df_2425.mean(numeric_only=True)

    # Benchmarking
    metrics = STAT_PROFILES.get(pos_group, STAT_PROFILES['CM'])
    # Query peers based on position to avoid the "Haaland vs Midfielders" issue
    peers_df = pd.read_sql(f"SELECT * FROM stats_2526 WHERE pos LIKE '%{pos_group}%' AND [90s] >= 5.0", conn)
    conn.close()

    if peers_df.empty: peers_df = df_2526 # Fallback if no peers found

    percentiles = {}
    for stat, higher_is_better in metrics.items():
        if stat not in peers_df.columns: continue
        
        # Calculate rates (stats per 90)
        is_rate = any(x in stat for x in ['pct', 'gca90', '%'])
        peer_vals = peers_df[stat].fillna(0) if is_rate else (peers_df[stat] / peers_df['90s']).fillna(0)
        p_val = player_stats[stat] if is_rate else (player_stats[stat] / player_stats['90s'])
        
        # Calculate Percentile
        pct = stats.percentileofscore(peer_vals, p_val) / 100.0
        if not higher_is_better: pct = 1.0 - pct
        percentiles[stat] = pct

    # Scoring
    p_score = (sum(percentiles.values()) / len(percentiles)) * 10
    
    # Valuation
    market_value = (p_score * 4.5) + 12.0 # Standard base
    
    # Goal Scorer Scarcity Premium (The Haaland Fix)
    goal_rate = raw_gls / raw_mp if raw_mp > 5 else 0
    if pos_group == "FW" and goal_rate > 0.4:
        market_value += (goal_rate * 40.0)

    # Age/Big Club modifiers
    if age < 23: market_value *= 1.3
    elif age > 31: market_value *= 0.75
    
    big_six = ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham", "Real Madrid", "Bayern"]
    if any(team in squad for team in big_six): market_value += 12.0

    return {
        "name": latest_record['player'],
        "scout_note": generate_scout_note(latest_record['player'], pos_group, age, squad, round(market_value, 2), round(p_score, 1)),
        "position": pos_group,
        "matches": raw_mp, "goals": raw_gls, "assists": raw_ast,
        "market_value_m": round(market_value, 2),
        "p_score": round(p_score, 2),
        "age": age, "squad": squad,
        "percentiles": {k: round(v * 100, 1) for k, v in percentiles.items()}
    }