from flask import Flask, request, jsonify
from groq import Groq
import redis
import json
from datetime import datetime
import uuid

app = Flask(_name_)

# Initialize Groq client
client = Groq(api_key="YOUR_GROQ_API_KEY")

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Function to analyze message and return summary + severity
def analyze_severity(text):
    prompt = f"""
    You are an emergency response assistant.
    Given this message: "{text}", summarize it briefly
    and assign a severity level from 1 to 3
    (1=Low, 2=Moderate, 3=Critical).
    Respond ONLY in JSON like: {{"summary": "...", "severity": 3}}
    """

    response = client.responses.create(
        model="openai/gpt-oss-20b",
        input=prompt
    )

    try:
        content = response.output_text.strip()
        result = json.loads(content)
    except Exception:
        result = {"summary": content, "severity": 1}
    return result

# ----------------- Flask Routes -----------------

@app.route('/incoming_message', methods=['POST'])
def receive_message():
    data = request.get_json()
    text = data.get("text")
    location = data.get("location", "Unknown")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    result = analyze_severity(text)
    summary = result["summary"]
    severity = int(result["severity"])
    timestamp = datetime.utcnow().isoformat()
    message_id = str(uuid.uuid4())

    # Store in Redis
    message_data = {
        "id": message_id,
        "text": text,
        "summary": summary,
        "severity": severity,
        "location": location,
        "timestamp": timestamp
    }
    r.hset(f"message:{message_id}", mapping=message_data)
    r.zadd("messages_by_severity", {message_id: severity})

    return jsonify({
        "summary": summary,
        "severity": severity,
        "location": location,
        "timestamp": timestamp
    })

# ----------------- Sample Testing Route -----------------
@app.route('/test_sample_messages', methods=['GET'])
def test_sample_messages():
    sample_messages = [
        {"text": "There is a massive fire in downtown Bengaluru.", "location": "Bengaluru"},
        {"text": "A minor traffic accident happened near MG Road.", "location": "Bengaluru"},
        {"text": "Gas leak reported in Patna Railway Station, people are panicking.", "location": "Patna"},
        {"text": "Power outage in Sector 22, Chandigarh.", "location": "Chandigarh"},
        {"text": "Flooding reported near river banks in Kerala.", "location": "Kerala"},
    ]

    results = []
    for msg in sample_messages:
        res = receive_message_internal(msg["text"], msg["location"])
        results.append(res)
    return jsonify(results)

# ----------------- Helper for Testing -----------------
def receive_message_internal(text, location):
    result = analyze_severity(text)
    summary = result["summary"]
    severity = int(result["severity"])
    timestamp = datetime.utcnow().isoformat()
    message_id = str(uuid.uuid4())

    message_data = {
        "id": message_id,
        "text": text,
        "summary": summary,
        "severity": severity,
        "location": location,
        "timestamp": timestamp
    }
    r.hset(f"message:{message_id}", mapping=message_data)
    r.zadd("messages_by_severity", {message_id: severity})
    return message_data

# ----------------- Other Routes -----------------
@app.route('/get_sorted_messages', methods=['GET'])
def get_sorted_messages():
    message_ids = r.zrevrange("messages_by_severity", 0, -1)
    messages = [r.hgetall(f"message:{mid}") for mid in message_ids if r.hgetall(f"message:{mid}")]
    return jsonify(messages)

@app.route('/get_messages_by_location', methods=['GET'])
def get_messages_by_location():
    loc = request.args.get("loc")
    if not loc:
        return jsonify({"error": "Location parameter missing"}), 400

    message_ids = r.zrevrange("messages_by_severity", 0, -1)
    messages = [
        r.hgetall(f"message:{mid}")
        for mid in message_ids
        if r.hgetall(f"message:{mid}") and loc.lower() in r.hgetall(f"message:{mid}").get("location", "").lower()
    ]
    return jsonify(messages)

@app.route('/get_top_critical', methods=['GET'])
def get_top_critical():
    top_n = int(request.args.get("n", 5))
    message_ids = r.zrevrange("messages_by_severity", 0, top_n - 1)
    messages = [r.hgetall(f"message:{mid}") for mid in message_ids]
    return jsonify(messages)

# ----------------- Run Server -----------------
if _name_ == '_main_':
    app.run(debug=True)