import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
from transformers_interpret import SequenceClassificationExplainer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---- Setup ----
app = Flask(__name__)
CORS(app)

MODEL_NAME = "jy46604790/Fake-News-Bert-Detect"
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
clf = pipeline("text-classification", model=model, tokenizer=tokenizer)
explainer = SequenceClassificationExplainer(model, tokenizer)

# Import an emotion detection model
TONE_MODEL = "nateraw/bert-base-uncased-emotion"
tone_clf = pipeline("text-classification", model=TONE_MODEL, tokenizer=TONE_MODEL)

FEEDBACK_FILE = "feedback_data.json"

# ---- Utility Functions ----
def load_feedback():
    if not os.path.exists(FEEDBACK_FILE):
        return []
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_feedback(entry):
    data = load_feedback()
    data.append(entry)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def check_similarity(new_text, threshold=0.85):
    entries = load_feedback()
    texts = [entry["text"] for entry in entries]
    if not texts:
        return None

    vectorizer = TfidfVectorizer().fit_transform(texts + [new_text])
    cosine_sim = cosine_similarity(vectorizer[-1], vectorizer[:-1])[0]

    best_match_index = cosine_sim.argmax()
    best_score = cosine_sim[best_match_index]

    if best_score > threshold:
        return entries[best_match_index]
    return None

# ---- Prediction Endpoint ----
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("text", "")
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Check for similar previous feedback
        match = check_similarity(text)
        if match:
            return jsonify({
                "label": match["original_label"],
                "confidence_tier": "prior feedback",
                "confidence_score": "N/A",
                "top_words": [],
                "explanation": f"🗂️ A similar article was flagged by a user as fake:'{match['feedback']}'",
                "previous_feedback": match
            })

        # Prediction
        result = clf(text)[0]
        label_mapping = {"LABEL_0": "FAKE", "LABEL_1": "REAL"}
        label = label_mapping.get(result["label"], result["label"])
        confidence_score = result["score"]

        # Attribution
        attributions = explainer(text)
        top_contributions = [
            (word, round(score, 3)) for word, score in attributions
            if word.isalpha() and abs(score) > 0.05
        ]
        top_words = [word for word, _ in top_contributions][:5]

        pos = sum(score for _, score in attributions if score > 0.05)
        neg = sum(abs(score) for _, score in attributions if score < -0.05)
        if abs(pos - neg) < 0.2:
            explanation = "⚠️ The model considered both fake and real signals in this article."
        elif pos > neg:
            explanation = "🧠 Most signals pushed the model toward its final decision."
        else:
            explanation = "💡 The model’s decision had mixed influences—please review carefully."

        def interpret_confidence(score):
            if score >= 0.9:
                return "high confidence"
            elif score >= 0.7:
                return "moderate confidence"
            else:
                return "low confidence"

        # --- New: Tone Analysis ---
        tone_result = tone_clf(text)
        tone_label = tone_result[0]["label"]
        tone_confidence = round(tone_result[0]["score"], 4)

        return jsonify({
            "label": label,
            "confidence_tier": interpret_confidence(confidence_score),
            "confidence_score": round(confidence_score, 4),
            "top_words": top_words,
            "explanation": explanation,
            "original_text": text,
            "tone": {
                "label": tone_label,
                "confidence": tone_confidence
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Feedback Submission Endpoint ----
@app.route("/feedback", methods=["POST"])
def receive_feedback():
    try:
        data = request.get_json()
        save_feedback({
            "text": data.get("text", ""),
            "feedback": data.get("feedback", ""),
            "original_label": data.get("label", "")
        })
        return jsonify({"status": "Feedback saved!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)

