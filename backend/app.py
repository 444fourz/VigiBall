from flask import Flask, jsonify, request
from flask_cors import CORS
from engine.valuation import calculate_valuation
import sqlite3
import uuid
import json
import os

app = Flask(__name__)
CORS(app) # Allows React to talk to Flask
app.config['JSON_SORT_KEYS'] = False

# Absolute path to your SQLite database
DB_PATH = r"C:\Users\nayee\OneDrive - Aston University\Desktop\CS3\FYP\FYP Workspace\VigiBall\backend\vigiball_v2.db"

# --- EXPERIMENT DATA ROUTES (SQL BACKED) ---

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
        results = [dict(row) for row in rows]
        return jsonify(results)
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/save_result', methods=['POST'])
def save_result():
    """Saves a single player evaluation from a participant to the SQL DB."""
    data = request.json
    test_id = data.get('test_id', 'STANDARD')
    session_id = data.get('session_id')
    player = data.get('player')
    initial_guess = data.get('initial_guess')
    ai_value = data.get('ai_value')
    final_bid = data.get('final_bid')
    time_out = 1 if data.get('time_out') else 0

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("""
            INSERT INTO experiment_results 
            (test_id, session_id, player_name, initial_guess, ai_value, final_bid, time_out) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (test_id, session_id, player, initial_guess, ai_value, final_bid, time_out))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error saving to SQL: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/clear_results', methods=['POST'])
def clear_results():
    """Wipes both results and custom test configurations from SQL."""
    conn = sqlite3.connect(DB_PATH)
    try:
        # 1. Wipe the participant responses
        conn.execute("DELETE FROM experiment_results")
        
        # 2. Wipe the custom test links/cohorts
        conn.execute("DELETE FROM evaluation_tests")
        
        conn.commit()
        return jsonify({
            "status": "success", 
            "message": "Full system reset: Results and Test IDs wiped."
        })
    except Exception as e:
        print(f"Reset Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()
        
# --- ADMIN / TEST BUILDER ROUTES ---

@app.route('/api/admin/save-test', methods=['POST'])
def save_test():
    """Creates a new unique test cohort and returns the ID."""
    data = request.json
    selected_players = data.get('players', [])
    
    if not selected_players:
        return jsonify({"error": "No players selected"}), 400
        
    test_id = str(uuid.uuid4())[:8]
    
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO evaluation_tests (test_id, player_names) VALUES (?, ?)",
            (test_id, json.dumps(selected_players))
        )
        conn.commit()
        return jsonify({"test_id": test_id, "url": f"/test/{test_id}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/admin/list-tests', methods=['GET'])
def list_tests():
    """Lists all available test IDs for the Admin sidebar."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute("SELECT test_id FROM evaluation_tests ORDER BY created_at DESC")
        tests = [row[0] for row in cursor.fetchall()]
        return jsonify(tests)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-test/<test_id>', methods=['GET'])
def get_test(test_id):
    """Fetches the list of players for a specific test ID."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute("SELECT player_names FROM evaluation_tests WHERE test_id = ?", (test_id,))
        row = cursor.fetchone()
        if row:
            players_list = json.loads(row[0])
            return jsonify({"player_names": players_list})
        return jsonify({"error": "Test session not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/search_players')
def search_players():
    """Live search for the Admin Test Builder."""
    query = request.args.get('q', '').lower()
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute(
            "SELECT DISTINCT player FROM stats_2526 WHERE player LIKE ? LIMIT 8", 
            (f"%{query}%",)
        )
        results = [row[0] for row in cursor.fetchall()]
        return jsonify(results)
    finally:
        conn.close()

# --- ENGINE ROUTES ---

@app.route('/api/evaluate', methods=['GET'])
def evaluate():
    """The main AI valuation engine."""
    player_name = request.args.get('name')
    if not player_name:
        return jsonify({"error": "No name provided"}), 400
    
    result = calculate_valuation(player_name)
    return jsonify(result)

@app.route('/')
def home():
    return "VigiBall Backend is Active."

if __name__ == '__main__':
    app.run(debug=True, port=5000)