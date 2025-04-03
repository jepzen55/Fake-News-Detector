import requests

url = "http://127.0.0.1:5000/predict"
data = {"text": "Scientists discovered a cure for all diseases!"}

response = requests.post(url, json=data)
print(response.json())  # Expected output: {'label': 'FAKE', 'confidence': 0.95}
