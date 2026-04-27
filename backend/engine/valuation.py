import sqlite3
import pandas as pd
from scipy import stats  # Ensure this is installed: pip install scipy
import os
import random

# Setup Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, '..', 'vigiball_v2.db')
CSV_PATH_2425 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2024_2025.csv"
CSV_PATH_2526 = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\players_data-2025_2026.csv"

# --- CONFIGURATION ---

STAT_PROFILES = {
    'FW': {'xg': True, 'gls': True, 'xag': True, 'gca90': True, 'prgc': True, 'succ%': True, 'att_pen': True},
    'MF': {'xag': True, 'kp': True, 'cmp%': True, 'prgp': True, 'tkl%': True, 'int': True},
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

def get_primary_position(pos_string, player_name=None):
    pos = str(pos_string).upper()
    
    if 'GK' in pos: return 'GK'
    if 'FW' in pos: return 'FW'
    if 'DF' in pos: return 'DF'
    
    # Standardize all Midfielders (CM, DM, AM, MF) to one 'MF' group
    return 'MF'

def generate_scout_note(name, pos, age, squad, market_value, p_score):
    # Logic for trend analysis
    if p_score >= 8.0:
        trend_analysis = "Elite-tier output; statistical ceiling not yet reached."
    elif p_score >= 6.5:
        trend_analysis = "Consistent performer; high floor with moderate variance."
    else:
        trend_analysis = "Performance fluctuations detected; efficiency dropping below league mean."

    # Logic for age/market risk
    if age <= 23:
        risk_profile = f"Developmental asset. Age ({age}) suggests significant resale premium."
    elif age >= 30:
        risk_profile = f"Veteran profile. Valuation adjusted for diminishing physical returns and contract shelf-life."
    else:
        risk_profile = f"Prime-age bracket. Maximum market liquidity expected."

    notes = [
        f"INTEL: {name} ({pos}) internal audit complete.",
        f"SQUAD CONTEXT: Subject is a key tactical component at {squad}.",
        f"ANALYTIC TREND: {trend_analysis}",
        f"MARKET RISK: {risk_profile}",
        f"VIGIBALL APPRAISAL: £{market_value}M based on 24-month rolling metrics."
    ]

    random.shuffle(notes)
    
    return notes

# --- MAIN ENGINE ---

def calculate_valuation(player_name):
    raw_mp, raw_gls, raw_ast = get_raw_csv_stats(player_name)
    conn = sqlite3.connect(DB_PATH)
    search_term = f"%{player_name}%"
    
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
    metrics = STAT_PROFILES.get(pos_group, STAT_PROFILES['MF'])
    peers_df = pd.read_sql(f"SELECT * FROM stats_2526 WHERE pos LIKE '%{pos_group}%' AND [90s] >= 5.0", conn)
    conn.close()

    if peers_df.empty: peers_df = df_2526 # Fallback if no peers found

    # 6. Percentile Calculation
    percentiles = {}
    for stat, higher_is_better in metrics.items():
        # Step A: Check if the stat exists in the peer data
        if stat not in peers_df.columns:
            continue

        # Step B: Clean the Peer Data (Force to numbers, handle NaNs)
        peer_series = pd.to_numeric(peers_df[stat], errors='coerce').fillna(0)
        
        # Step C: Clean the Player Data
        p_val = pd.to_numeric(player_stats.get(stat, 0), errors='coerce')
        if pd.isna(p_val):
            p_val = 0

        # Step D: Scale Correction (Fixes the 0.89 vs 89.9 issue)
        # If player is 0.89 but peers are 80-90, multiply player by 100
        if p_val > 0 and p_val < 1.0 and peer_series.max() > 1.0:
            p_val = p_val * 100.0
        # If player is 89.0 but peers are 0.8-0.9, divide player by 100
        elif p_val > 1.0 and peer_series.max() <= 1.0:
            p_val = p_val / 100.0

        # Step E: Calculate the Percentile
        # stats.percentileofscore returns 0-100; we divide by 100 for 0.0-1.0
        pct_score = stats.percentileofscore(peer_series, p_val) / 100.0
        
        # Step F: Apply Logic Flipped (e.g., for 'Turnovers' lower is better)
        if not higher_is_better:
            pct_score = 1.0 - pct_score
            
        # Step G: Store the final result
        percentiles[stat] = pct_score

    # Scoring
    p_score = (sum(percentiles.values()) / len(percentiles)) * 10
    
    # Valuation
    market_value = (p_score * 4.5) + 12.0
    
    # Goal Scorer Scarcity Premium
    goal_rate = raw_gls / raw_mp if raw_mp > 5 else 0
    if pos_group == "FW" and goal_rate > 0.4:
        market_value += (goal_rate * 40.0)

    # Age/Big Club modifiers
    if age < 23: market_value *= 1.3
    elif age > 31: market_value *= 0.75
    
    big_six = ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham",]
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