
from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

with open("units.json", "r", encoding="utf-8") as f:
    unit_data = json.load(f)

@app.route("/api/units", methods=["GET"])
def get_units():
    return jsonify(list(unit_data.keys()))

@app.route("/api/<unit>", methods=["GET"])
def get_unit(unit):
    return jsonify(unit_data.get(unit, {}))

@app.route("/api/<unit>/<node>", methods=["POST"])
def update_node(unit, node):
    data = request.json
    value = data.get("value")
    if unit in unit_data and node in unit_data[unit]:
        unit_data[unit][node]["value"] = value
        with open("units.json", "w", encoding="utf-8") as f:
            json.dump(unit_data, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "OK"})
    return jsonify({"error": "Invalid request"}), 400

if __name__ == "__main__":
    app.run(port=5000)
