from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
from transformers_interpret import SequenceClassificationExplainer

# Load model and tokenizer
MODEL_NAME = "jy46604790/Fake-News-Bert-Detect"
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
clf = pipeline("text-classification", model=model, tokenizer=tokenizer)
explainer = SequenceClassificationßExplainer(model, tokenizer)




# 🔹 Confidence interpretation
def interpret_confidence(score):
    if score >= 0.9:
        return "high confidence"
    elif score >= 0.7:
        return "moderate confidence"
    else:
        return "low confidence"

# 🔹 Analyze contribution balance
def analyze_contributions(attributions):
    pos = sum(score for _, score in attributions if score > 0.05)
    neg = sum(abs(score) for _, score in attributions if score < -0.05)
    if abs(pos - neg) < 0.2:
        return "⚠️ The model considered both fake and real signals in this article."
    elif pos > neg:
        return "🧠 Most signals pushed the model toward its final decision."
    else:
        return "💡 The model’s decision had mixed influences—please review carefully or find another source."

# 🔹 Run on user input
def analyze_text(text):
    result = clf(text)[0]
    label_mapping = {"LABEL_0": "FAKE", "LABEL_1": "REAL"}
    label = label_mapping.get(result["label"], result["label"])
    confidence_score = round(result["score"], 4)
    confidence_tier = interpret_confidence(confidence_score)

    attributions = explainer(text)
    top_contributions = [
        (word, round(score, 3)) for word, score in attributions
        if word.isalpha() and abs(score) > 0.05
    ]
    top_words = [word for word, _ in top_contributions][:5]
    explanation_text = analyze_contributions(attributions)

    print("\n📰 Prediction Results")
    print("---------------------------")
    print(f"Label: {label}")
    print(f"Confidence: {confidence_score} ({confidence_tier})")
    print(f"Top Contributing Words: {', '.join(top_words)}")
    print(f"Explanation: {explanation_text}")
    print("---------------------------\n")


user_text = "Donald Trump is the president of the United States."
analyze_text(user_text)
