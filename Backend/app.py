from flask import Flask, request, jsonify
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
from transformers_interpret import SequenceClassificationExplainer
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model & tokenizer
MODEL_NAME = "jy46604790/Fake-News-Bert-Detect"
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
clf = pipeline("text-classification", model=model, tokenizer=tokenizer)
explainer = SequenceClassificationExplainer(model, tokenizer)

# Confidence tiering
def interpret_confidence(score):
    if score >= 0.9:
        return "high confidence"
    elif score >= 0.7:
        return "moderate confidence"
    else:
        return "low confidence"

# Attribution analysis
def analyze_contributions(attributions):
    pos = sum(score for _, score in attributions if score > 0.05)
    neg = sum(abs(score) for _, score in attributions if score < -0.05)
    if abs(pos - neg) < 0.2:
        return "⚠️ The model considered both fake and real signals in this article."
    elif pos > neg:
        return "🧠 Most signals pushed the model toward its final decision."
    else:
        return "💡 The model’s decision had mixed influences—please review carefully or find another source."

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "No text provided"}), 400

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
        explanation_text = analyze_contributions(attributions)

        return jsonify({
            "label": label,
            "confidence_tier": interpret_confidence(confidence_score),
            "confidence_score": round(confidence_score, 4),
            "top_words": top_words,
            "explanation": explanation_text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
