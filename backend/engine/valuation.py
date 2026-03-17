import sqlite3
import pandas as pd
from scipy import stats
import os

# Setup Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, '..', 'vigiball.db')
CSV_PATH_2425 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2024_2025.csv"
CSV_PATH_2526 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2025_2026.csv"

def get_raw_csv_stats(player_name):
    """
    Helper to sum raw stats from CSV files for Phase 1.
    Uses case-insensitive partial matching to prevent '0 stats' error.
    """
    total_mp, total_gls, total_ast = 0, 0, 0
    search_name = player_name.strip().lower()

    for path in [CSV_PATH_2425, CSV_PATH_2526]:
        if os.path.exists(path):
            try:
                df_raw = pd.read_csv(path)
                # Flexible matching: handles special characters and casing
                p_match = df_raw[df_raw['Player'].str.lower().str.contains(search_name, na=False)]
                
                if not p_match.empty:
                    total_mp += p_match['MP'].sum()
                    total_gls += p_match['Gls'].sum()
                    total_ast += p_match['Ast'].sum()
            except Exception as e:
                print(f"Error reading {path}: {e}")
    
    return int(total_mp), int(total_gls), int(total_ast)

# Stats profiles for Phase 2 Tooltips and Percentiles
STAT_PROFILES = {
    'FW': {'xg': True, 'npg': True, 'xag': True, 'gca90': True, 'prgc': True, 'succ_pct': True, 'touches_box': True},
    'AM': {'xag': True, 'kp': True, 'prgp': True, 'gca90': True, 'prgc': True, 'touches_box': True},
    'CM': {'xag': True, 'kp': True, 'cmp_pct': True, 'prgp': True, 'tkl_pct': True, 'interceptions': True, 'miscontrols': False, 'dispossessed': False},
    'DM': {'cmp_pct': True, 'tkl_pct': True, 'interceptions': True, 'recoveries': True, 'prg_pass_dist': True, 'blocks': True, 'tkl_int': True, 'clearances': True},
    'DF': {'aerial_won_pct': True, 'def_act_att_3rd': True, 'recoveries': True, 'prg_pass_dist': True, 'blocks': True, 'tkl_int': True, 'clearances': True},
    'GK': {'psxg_plus_minus': True, 'save_pct': True, 'cross_stop_pct': True, 'launch_pct': True, 'opa_sweeper': True}
}

def get_primary_position(pos_string, player_name):
    """Categorize the FBRef position string with manual overrides."""
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
    """Generates the list of insights for the Scout's Note component."""
    insights = [f"Subject identified: {name}", f"Role: {pos}", f"Squad: {squad}"]
    if p_score >= 8.5: insights.append("Performance: Elite outlier status")
    elif p_score <= 4.0: insights.append("Warning: Metric decay detected")
    
    if age < 22: insights.append("Age Factor: High ceiling detected")
    elif age > 31: insights.append("Age Factor: Veteran depreciation")
    
    big_six = ["Manchester City", "Arsenal", "Liverpool", "Manchester Utd", "Chelsea", "Tottenham"]
    if any(team in squad for team in big_six):
        insights.append("Market Context: Big Six premium active")

    insights.append(f"AI Estimate: £{market_value}M")
    return insights

def calculate_valuation(player_name):
    """The main engine: Aggregates CSV/SQL data and computes AI valuation."""
    # 1. Get RAW stats for Phase 1
    raw_mp, raw_gls, raw_ast = get_raw_csv_stats(player_name)

    # 2. Get ADVANCED stats from SQL
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT * FROM players WHERE name LIKE ? AND season IN ('2024-2025', '2025-2026')"
    player_df = pd.read_sql(query, conn, params=(f"%{player_name}%",))
    
    if player_df.empty:
        conn.close()
        return {"error": "Player not found in database"}

    # Use mean for stats, latest row for bio
    player_avg = player_df.mean(numeric_only=True)
    latest_record = player_df.iloc[-1]
    
    pos_group = get_primary_position(latest_record['pos'], latest_record['name'])
    age = float(latest_record['age'])
    squad = latest_record['squad']
    metrics = STAT_PROFILES.get(pos_group, STAT_PROFILES['CM'])

    # 3. Peer Group Benchmarking
    db_tag = 'MF' if pos_group in ['AM', 'CM', 'DM'] else pos_group
    peer_query = f"SELECT * FROM players WHERE pos LIKE '%{db_tag}%' AND season IN ('2024-2025', '2025-2026') AND n90s >= 5.0"
    peers_df = pd.read_sql(peer_query, conn)
    conn.close()

    # 4. Percentile Math
    percentiles = {}
    for stat, higher_is_better in metrics.items():
        if stat not in peers_df.columns or stat not in player_avg:
            continue
            
        is_rate = 'pct' in stat or stat == 'gca90'
        if is_rate:
            peer_vals = peers_df[stat].fillna(0)
            p_val = player_avg[stat]
        else:
            peer_vals = (peers_df[stat] / peers_df['n90s']).fillna(0)
            p_val = (player_avg[stat] / player_avg['n90s']) if player_avg['n90s'] > 0 else 0
        
        pct = stats.percentileofscore(peer_vals, p_val) / 100.0
        if not higher_is_better: pct = 1.0 - pct
        percentiles[stat] = pct

    # 5. Final P-Score and Valuation
    p_score = (sum(percentiles.values()) / len(percentiles)) * 10
    
    # Valuation Multipliers
    elite_score = 0
    if age <= 23 and p_score > 7.5:
        elite_score = (24 - age) * p_score * 3.0
    elif 23 < age <= 31 and p_score > 8.0:
        elite_score = p_score * 5.0 * ((32.0 - age) / 9.0)
    elif age >= 32 and p_score > 7.0:
        elite_score = p_score * 2.0 * (1.0 / (age - 30.0))

    market_value = (p_score * 5.0) + 5.0 + elite_score

    return {
        "name": latest_record['name'],
        "scout_note": generate_scout_note(latest_record['name'], pos_group, age, squad, round(market_value, 2), p_score),
        "position": pos_group,
        "matches": raw_mp,
        "goals": raw_gls,
        "assists": raw_ast,
        "market_value_m": round(market_value, 2),
        "p_score": round(p_score, 2),
        "age": age,
        "squad": squad,
        "percentiles": {k: round(v * 100, 1) for k, v in percentiles.items()}
    }

if __name__ == "__main__":
    # Test Run
    test_player = "Bukayo Saka" 
    result = calculate_valuation(test_player)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"\n--- VALUATION REPORT: {result['name']} ---")
        print(f"Bio: {result['position']} | {result['age']}y/o | {result['squad']}")
        print(f"Phase 1 Stats: {result['matches']} MP | {result['goals']} Gls | {result['assists']} Ast")
        print(f"AI Valuation: £{result['market_value_m']}M")
        print(f"Scout's Note (Sample): {result['scout_note'][0]}")