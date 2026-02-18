import sqlite3
import pandas as pd
from scipy import stats
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, '..', 'vigiball.db')


# Define the metrics for each position, and whether HIGHER is better (True) or LOWER is better (False)
STAT_PROFILES = {
    'FW': {
        'xg': True, 'npg': True, 'xag': True, 'gca90': True,
        'prgc': True, 'succ_pct': True, 'sot_pct': True, 'touches_box': True
    },
    'MF': {
        'xag': True, 'kp': True, 'cmp_pct': True, 'prgp': True,
        'tkl_pct': True, 'interceptions': True, 'miscontrols': False, 'dispossessed': False
    },
    'DF': {
        'aerial_won_pct': True, 'def_act_att_3rd': True, 'recoveries': True,
        'prg_pass_dist': True, 'blocks': True, 'tkl_int': True, 'clearances': True
    },
    'GK': {
        'psxg_plus_minus': True, 'save_pct': True, 'cross_stop_pct': True,
        'launch_pct': True, 'opa_sweeper': True
    }
}

def get_primary_position(pos_string):
    """Categorize the FBRef position string into our 4 main buckets."""
    pos_string = str(pos_string).upper()
    if 'GK' in pos_string: return 'GK'
    if 'FW' in pos_string: return 'FW'
    if 'MF' in pos_string: return 'MF'
    if 'DF' in pos_string: return 'DF'
    return 'MF' # Fallback

def calculate_valuation(player_name, season="2025-2026"):
    """
    Calculates the P-Score and Market Value for a given player.
    """
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Fetch the target player
    query = "SELECT * FROM players WHERE name LIKE ? AND season = ?"
    player_df = pd.read_sql(query, conn, params=(player_name, season))
    
    if player_df.empty:
        conn.close()
        return {"error": f"Player '{player_name}' not found."}
        
    player = player_df.iloc[0]
    pos_group = get_primary_position(player['pos'])
    metrics = STAT_PROFILES[pos_group]
    
    # 2. Fetch the Peer Group (Same position group, >= 5 matches to remove noise)
    peer_query = f"SELECT * FROM players WHERE pos LIKE '%{pos_group}%' AND season = ? AND n90s >= 5.0"
    peers_df = pd.read_sql(peer_query, conn, params=(season,))
    conn.close()

    # 3. Calculate Percentile Ranks
    percentiles = {}
    for stat, higher_is_better in metrics.items():
        # Convert total stats to "Per 90" where necessary (excluding percentages/rates)
        is_rate = 'pct' in stat or stat == 'gca90'
        
        # Safe extraction of peer values
        if is_rate:
            peer_values = peers_df[stat].fillna(0)
            player_val = player[stat] if pd.notna(player[stat]) else 0
        else:
            # Divide by 90s for volume stats
            peer_values = (peers_df[stat] / peers_df['n90s']).fillna(0)
            player_val = (player[stat] / player['n90s']) if pd.notna(player[stat]) and player['n90s'] > 0 else 0
            
        # Calculate Percentile (0.0 to 1.0)
        pct = stats.percentileofscore(peer_values, player_val) / 100.0
        
        # Invert if lower is better (e.g., Miscontrols)
        if not higher_is_better:
            pct = 1.0 - pct
            
        percentiles[stat] = pct

    # 4. Compute P-Score (Average of percentiles scaled to 10)
    # Assuming equal weighting for the experiment's simplicity, but you can adjust weights here
    avg_percentile = sum(percentiles.values()) / len(percentiles)
    p_score = avg_percentile * 10 

    # 5. Elite Score (E) Calculation
    # Measures the 'generational talent' premium or 'aging veteran' deflation
    age = player['age'] if pd.notna(player['age']) else 25.0
    elite_score = 0.0

    # Bracket 1: Elite Prospect (Age <= 23)
    if age <= 23 and p_score > 7.5:
        k = 3.0
        elite_score = (24 - age) * p_score * k

    # Bracket 2: Prime Prospect (23 < Age <= 31)
    elif 23 < age <= 31 and p_score > 8.0:
        k = 5.0
        s = (32.0 - age) / 9.0
        elite_score = p_score * k * s

    # Bracket 3: Veteran (Age >= 32)
    elif age >= 32 and p_score > 7.0:
        k = 2.0
        r = 1.0 / (age - 30.0)  
        elite_score = p_score * k * r

    # 6. Final Valuation Calculation
    # Base Value: Every point of P-Score is worth £5m, plus a basic £5m floor.
    base_value_millions = (p_score * 5.0) + 5.0 
    
    # The Elite Score is added as the 'inflation/premium'
    market_value = base_value_millions + elite_score

    return {
        "name": player['name'],
        "position_group": pos_group,
        "age": round(age, 1),
        "p_score": round(p_score, 2),
        "market_value_m": round(market_value, 2),
        "percentiles": {k: round(v * 100, 1) for k, v in percentiles.items()}
    }

# --- TEST THE ENGINE ---
if __name__ == "__main__":
    # --- SANITY CHECK ---
    conn = sqlite3.connect(DB_PATH)
    count = pd.read_sql("SELECT count(*) as total FROM players", conn).iloc[0]['total']
    print(f"Total players in database: {count}")
    conn.close()
    # --------------------

    test_player = "Rodri" 
    result = calculate_valuation(test_player, season="2024-2025")
    
    if "error" in result:
        print(result["error"])
    else:
        print(f"\n--- Valuation Report: {result['name']} ---")
        print(f"Position: {result['position_group']} | Age: {result['age']}")
        print(f"P-Score:  {result['p_score']} / 10")
        print(f"AI Value: £{result['market_value_m']}m")
        print("Stat Breakdown (Percentiles):")
        for stat, pct in result['percentiles'].items():
            print(f"  - {stat}: {pct}th percentile")