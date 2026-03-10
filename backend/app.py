from flask import Flask, jsonify, request
from flask_cors import CORS
from engine.valuation import calculate_valuation
import csv
import os
import pandas as pd

app = Flask(__name__)
CORS(app) # Allows React to talk to Flask
app.config['JSON_SORT_KEYS'] = False

@app.route('/api/get_results', methods=['GET'])
def get_results():
    results = []
    try:
        if not os.path.exists('experiment_results.csv'):
            return jsonify([])

        with open('experiment_results.csv', mode='r', encoding='utf-8') as file:
            # Use DictReader to automatically map headers to values
            reader = csv.DictReader(file)
            for row in reader:
                # Clean the row: replace None keys/values with empty strings
                clean_row = {str(k): (v if v is not None else "") for k, v in row.items() if k is not None}
                if clean_row: # Only add if the row isn't empty
                    results.append(clean_row)
                    
        return jsonify(results)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/save_result', methods=['POST'])
def save_result():
    data = request.json
    # Add 'session_id' to the list of fields to save
    fields = [
        data.get('session_id'), 
        data.get('player'), 
        data.get('initial_guess'), 
        data.get('ai_value'), 
        data.get('final_bid'),
        data.get('time_out')
    ]
    
    with open('experiment_results.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(fields)
        
    return jsonify({"status": "success"})

import os

@app.route('/api/clear_results', methods=['POST'])
def clear_results():
    try:
        # Define the header row to reset the file
        header = ['session_id', 'player', 'initial_guess', 'ai_value', 'final_bid', 'time_out']
        
        with open('experiment_results.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            
        return jsonify({"status": "success", "message": "Data wiped successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/')
def home():
    return "VigiBall Backend is Running! Use /api/evaluate?name=PlayerName to get data."
@app.route('/api/evaluate', methods=['GET'])
def evaluate():
    player_name = request.args.get('name')
    if not player_name:
        return jsonify({"error": "No name provided"}), 400
    
    result = calculate_valuation(player_name)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)