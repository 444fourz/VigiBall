import sqlite3
import pandas as pd
from scipy import stats
import os

# Setup Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, '..', 'vigiball_v2.db')
CSV_PATH_2425 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2024_2025.csv"
CSV_PATH_2526 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2025_2026.csv"

# --- 1. CONFIGURATION & HELPERS ---

STAT_PROFILES = {
    'FW': { # Strikers/Wingers
        'xg': True, 
        'gls': True, 
        'xag': True, 
        'gca90': True, 
        'prgc': True, 
        'succ%': True, 
        'att_pen': True
    },
    'AM': { # Attacking Midfielders (Palmer, Odegaard)
        'xag': True, 
        'kp': True, 
        'prgp': True, 
        'gca90': True, 
        'prgc': True, 
        'att_pen': True 
    },
    'CM': { # Box-to-Box
        'xag': True, 
        'kp': True, 
        'cmp%': True, 
        'prgp': True, 
        'tkl%': True, 
        'int': True, 
        'mis': False, 
        'dis': False
    },
    'DM': { # Defensive Midfielders (Rice, Rodri)
        'cmp%': True, 
        'tkl%': True, 
        'int': True, 
        'recov': True, 
        'prgdist': True, 
        'blocks': True, 
        'tkl+int': True, 
        'clr': True
    },
    'DF': { # Defenders
        'won%': True, 
        'att_3rd': True, 
        'recov': True, 
        'prgdist': True, 
        'blocks': True, 
        'tkl+int': True, 
        'clr': True
    }
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
            except Exception as e:
                print(f"Error reading {path}: {e}")
    return int(total_mp), int(total_gls), int(total_ast)

def get_primary_position(pos_string, player_name):
    overrides = {
        "Martin Ødegaard": "AM", "Cole Palmer": "AM", "Kevin De Bruyne": "AM",
        "Declan Rice": "DM", "Rodri": "DM", "João Palhinha": "DM", "Bruno Fernandes": "AM"
    }
    for name, pos in overrides.items():
        if name in player_name: return pos
    pos_string = str(pos_string).upper()
    if 'GK' in pos_string: return 'GK'
    if 'MF,FW' in pos_string or 'FW,MF' in pos_string: return 'AM'
    if 'MF,DF' in pos_string or 'DF,MF' in pos_string: return 'DM'
    if 'FW' in pos_string: return 'FW'
    if 'MF' in pos_string: return 'CM' 
    if 'DF' in pos_string: return 'DF'
    return 'CM'

def generate_scout_note(name, pos, age, squad, market_value, p_score):
    insights = [f"Subject identified: {name}", f"Role: {pos}", f"Squad: {squad}"]
    if p_score >= 8.5: insights.append("Performance: Elite outlier status")
    elif p_score <= 4.0: insights.append("Warning: Metric decay detected")
    if age < 22: insights.append("Age Factor: High ceiling detected")
    elif age > 31: insights.append("Age Factor: Veteran depreciation")
    big_six = ["Manchester City", "Arsenal", "Liverpool", "Manchester Utd", "Chelsea", "Tottenham"]
    if any(team in squad for team in big_six): insights.append("Market Context: Big Six premium active")
    insights.append(f"AI Estimate: £{market_value}M")
    return insights

# --- 2. THE MAIN ENGINE ---

def calculate_valuation(player_name):
    raw_mp, raw_gls, raw_ast = get_raw_csv_stats(player_name)
    
    conn = sqlite3.connect(DB_PATH)
    search_term = f"%{player_name}%"
    
    # Fetch from separate tables (v2 database)
    df_2425 = pd.read_sql("SELECT * FROM stats_2425 WHERE player LIKE ?", conn, params=(search_term,))
    df_2526 = pd.read_sql("SELECT * FROM stats_2526 WHERE player LIKE ?", conn, params=(search_term,))

    if df_2425.empty and df_2526.empty:
        conn.close()
        return {"error": "Player not found in database records."}

    # Bio from latest, Stats are weighted
    latest_record = df_2526.iloc[0] if not df_2526.empty else df_2425.iloc[0]
    
    if not df_2526.empty and not df_2425.empty:
        s1 = df_2425.mean(numeric_only=True)
        s2 = df_2526.mean(numeric_only=True)
        player_stats = (s2 * 0.6) + (s1 * 0.4)
    else:
        player_stats = df_2526.mean(numeric_only=True) if not df_2526.empty else df_2425.mean(numeric_only=True)

    # These are now 100% visible to the engine
    pos_group = get_primary_position(latest_record['pos'], latest_record['player'])
    age = float(latest_record['age'])
    squad = latest_record['squad']
    metrics = STAT_PROFILES.get(pos_group, STAT_PROFILES['CM'])

    # Benchmarking Peers
    db_tag = 'MF' if pos_group in ['AM', 'CM', 'DM'] else pos_group
    peers_24 = pd.read_sql(f"SELECT * FROM stats_2425 WHERE pos LIKE '%{db_tag}%' AND [90s] >= 5.0", conn)
    peers_25 = pd.read_sql(f"SELECT * FROM stats_2526 WHERE pos LIKE '%{db_tag}%' AND [90s] >= 5.0", conn)
    peers_df = pd.concat([peers_24, peers_25], ignore_index=True)
    conn.close()

    percentiles = {}
    for stat, higher_is_better in metrics.items():
        if stat not in peers_df.columns: continue
        is_rate = 'pct' in stat or stat == 'gca90'
        peer_vals = peers_df[stat].fillna(0) if is_rate else (peers_df[stat] / peers_df['90s']).fillna(0)
        p_val = player_stats[stat] if is_rate else (player_stats[stat] / player_stats['90s'])
        
        pct = stats.percentileofscore(peer_vals, p_val) / 100.0
        if not higher_is_better: pct = 1.0 - pct
        percentiles[stat] = pct

    p_score = (sum(percentiles.values()) / len(percentiles)) * 10
    
    # Valuation logic
    elite_score = 0
    if age <= 23 and p_score > 7.5: elite_score = (24 - age) * p_score * 3.0
    elif 23 < age <= 31 and p_score > 8.0: elite_score = p_score * 5.0 * ((32.0 - age) / 9.0)
    elif age >= 32 and p_score > 7.0: elite_score = p_score * 2.0 * (1.0 / (age - 30.0))

    market_value = (p_score * 5.0) + 5.0 + elite_score

    return {
        "name": latest_record['player'],
        "scout_note": generate_scout_note(latest_record['player'], pos_group, age, squad, round(market_value, 2), p_score),
        "position": pos_group,
        "matches": raw_mp, "goals": raw_gls, "assists": raw_ast,
        "market_value_m": round(market_value, 2),
        "p_score": round(p_score, 2),
        "age": age, "squad": squad,
        "percentiles": {k: round(v * 100, 1) for k, v in percentiles.items()}
    }