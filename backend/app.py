from flask import Flask, jsonify, request
from flask_cors import CORS
from engine.valuation import calculate_valuation
import sqlite3
import uuid
import json
import os
import pandas as pd
app = Flask(__name__)
CORS(app) 
app.config['JSON_SORT_KEYS'] = False
DB_PATH = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\vigiball_v2.db"

# Experiment data results
@app.route('/api/get_results', methods=['GET'])
def get_results():
    """Fetches participant responses, optionally filtered by test_id."""
    test_id = request.args.get('test_id')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    try:
        if test_id and test_id != "ALL":
            cursor = conn.execute("""
                SELECT * FROM experiment_results 
                WHERE test_id = ? 
                ORDER BY timestamp DESC
            """, (test_id,))
        else:
            cursor = conn.execute("SELECT * FROM experiment_results ORDER BY timestamp DESC")
            
        rows = cursor.fetchall()
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/save_result', methods=['POST'])
def save_result():
    """Saves evaluation and calculates Weight of Advice (Automation Bias)."""
    data = request.json
    test_id = data.get('test_id', 'STANDARD')
    session_id = data.get('session_id')
    player = data.get('player')
    
    try:
        initial = float(data.get('initial_guess', 0))
        ai_val = float(data.get('ai_value', 0))
        final = float(data.get('final_bid', 0))
        time_out = 1 if data.get('time_out') else 0

        # WoA/Bias calculation logic
        denominator = abs(ai_val - initial)
        if denominator == 0:
            bias_score = 0.0
        else:
            # We cap at 1.0 to ensure the chart stays within 0-100% scale
            bias_score = round(max(0, min(abs(final - initial) / denominator, 1.0)), 2)
        conn = sqlite3.connect(DB_PATH)
        conn.execute("""
            INSERT INTO experiment_results 
            (test_id, session_id, player_name, initial_guess, ai_value, final_bid, bias_score, time_out) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (test_id, session_id, player, initial, ai_val, final, bias_score, time_out))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "bias_score": bias_score})
    except Exception as e:
        print(f"Error saving result: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/bias-stats', methods=['GET'])
def get_bias_stats():
    """AGGREGATED DATA: For the Admin Bar Chart."""
    conn = sqlite3.connect(DB_PATH)
    try:
        query = """
            SELECT player_name, 
                   AVG(bias_score) as avg_bias, 
                   COUNT(*) as sample_size,
                   AVG(time_out) * 100 as timeout_rate
            FROM experiment_results 
            GROUP BY player_name 
            ORDER BY avg_bias DESC
        """
        df = pd.read_sql(query, conn)
        return jsonify(df.to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/clear_results', methods=['POST'])
def clear_results():
    """Full system reset."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DELETE FROM experiment_results")
        conn.execute("DELETE FROM evaluation_tests")
        conn.commit()
        return jsonify({"status": "success", "message": "System Reset Successful."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

# Admin routes
@app.route('/api/admin/save-test', methods=['POST'])
def save_test():
    data = request.json
    selected_players = data.get('players', [])
    if not selected_players:
        return jsonify({"error": "No players selected"}), 400
        
    test_id = str(uuid.uuid4())[:8]
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("INSERT INTO evaluation_tests (test_id, player_names) VALUES (?, ?)",
                     (test_id, json.dumps(selected_players)))
        conn.commit()
        return jsonify({"test_id": test_id, "url": f"/test/{test_id}"})
    finally:
        conn.close()

@app.route('/api/admin/list-tests', methods=['GET'])
def list_tests():
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute("SELECT test_id FROM evaluation_tests ORDER BY created_at DESC")
        return jsonify([row[0] for row in cursor.fetchall()])
    finally:
        conn.close()

@app.route('/api/get-test/<test_id>', methods=['GET'])
def get_test(test_id):
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute("SELECT player_names FROM evaluation_tests WHERE test_id = ?", (test_id,))
        row = cursor.fetchone()
        if row:
            return jsonify({"player_names": json.loads(row[0])})
        return jsonify({"error": "Test not found"}), 404
    finally:
        conn.close()

@app.route('/api/search_players')
def search_players():
    query = request.args.get('q', '')
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute(
            "SELECT DISTINCT player FROM stats_2526 WHERE player LIKE ? LIMIT 8", 
            (f"%{query}%",)
        )
        return jsonify([row[0] for row in cursor.fetchall()])
    finally:
        conn.close()

# Engine routes
@app.route('/api/evaluate', methods=['GET'])
def evaluate():
    player_name = request.args.get('name')
    if not player_name:
        return jsonify({"error": "No name provided"}), 400
    return jsonify(calculate_valuation(player_name))
@app.route('/')
def home():
    return "VigiBall Backend is Active."
if __name__ == '__main__':
    app.run(debug=True, port=5000)