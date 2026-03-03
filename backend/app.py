from flask import Flask, jsonify, request
from flask_cors import CORS
from engine.valuation import calculate_valuation

app = Flask(__name__)
CORS(app) # Allows React to talk to Flask

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