# AI Scam Sensei (Web Demo)

This is a solo project scaffold for the GWC AI + Cybersecurity Challenge. It's a browser-based demo that analyzes pasted messages using explainable heuristics and provides an optional hook to call a Hugging Face model.

Getting started
- Open `index.html` in your browser (double-click or use Live Server).

What to edit
- `script.js` contains `analyzeMessage()` — the rule-based logic you'll likely expand.
- `callModel()` shows how to call the Hugging Face inference API; add your API key to test.

Hugging Face notes
- To call a model, get an API key from https://huggingface.co/settings/tokens and then call `callModel(text, API_KEY, MODEL_NAME)`.
- Example model types: a phishing classifier or general text classification model.

Usage
1. Open `index.html` in the browser via the local server.
2. Paste your message and click "Analyze" for heuristic results.
3. The page shows explainable reasons and a risk score. No external model calls are required.

Deployment
- Deploy via GitHub Pages by pushing this folder to a repository and enabling Pages.

Project writeup tips
- Emphasize the combination of heuristics (explainable) + optional ML (model confidence).
- Highlight accessibility: plain-language reasons and clear verdicts.
- Be explicit in the submission that this is a decision-support tool, not a definitive detector.
