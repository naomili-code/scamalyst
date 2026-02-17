# 🧠 Scamalyst

**Learn to spot phishing scams AND AI-generated text before they fool you.**

Scamalyst is a free, open-source educational tool that helps users detect both phishing scams and AI-generated text in emails, social media messages, and other communications.

## 🎯 The Problem

Scammers use psychology and language tricks to manipulate victims. Meanwhile, the rise of AI-generated text creates new risks: AI can help create convincing phishing emails at scale. Users need practical tools to recognize these threats.

## ✨ What It Does

### Scam Detection
Analyzes messages for 10+ red flags:
- Urgency and pressuring language ("act now", "limited time")
- Requests for sensitive information (passwords, SSN, credit cards)
- Suspicious links and shortened URLs
- All-caps formatting and excessive punctuation
- Grammar anomalies
- Phishing tactics (verify account, click here, download attached)

### AI Detection
Identifies AI-generated text using 9 heuristics:
1. **Word length** — AI uses longer, formal words
2. **Sentence consistency** — AI has less variable sentence lengths
3. **Stopword ratio** — AI overuses common words like "the", "is"
4. **Contractions** — Humans use more contractions; AI avoids them
5. **AI phrases** — Detects explicit AI disclaimers ("as an AI", "per my programming")
6. **Punctuation density** — AI uses less punctuation overall
7. **Emotion markers** — AI avoids exclamation marks and questions
8. **N-gram patterns** — AI repeats phrase structures
9. **Formal punctuation** — AI uses more commas and semicolons

## 📱 Pages

- **Home** (`home.html`) — Landing page with value proposition and CTA
- **Analyze** (`analyze.html`) — Main tool for testing messages
  - Textarea input
  - Example dropdown (5 realistic samples)
  - Dual scoring meters (Scam Risk 0-10, AI Likelihood 0-100%)
  - Red flags explanation
  - Teaching points
- **Practice** (`practice.html`) — Interactive quiz with 8 scenarios
  - Users guess: Safe / Suspicious / Scam
  - Instant feedback and score tracking
  - Educational explanations
- **About** (`about.html`) — Project story and mission
- **Ethics** (`ethics.html`) — Transparency, privacy, and AI detection boundaries
  - Why this project exists
  - How AI helps and limitations
  - Privacy commitment (all analysis is local—no data sent anywhere)
  - Target audience (high school & college students)
  - AI detection ethics and limitations
  - Next steps for improvement

## 🛠️ Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Responsive design (mobile-first)
- **JavaScript (Vanilla)** — No frameworks, no external dependencies
- **Client-side only** — All analysis happens in the browser
- **Zero backend** — No data collection, no user tracking
- **Privacy-first** — Messages never leave your device

## 🚀 Running Locally

### Option 1: Python HTTP Server (Recommended)
```bash
cd c:\Users\Naomi\Desktop\HTML\scamalyst
py -3 -m http.server 8000
```
Then open `http://localhost:8000/` (or `http://localhost:8000/home.html`) in your browser.

### Option 2: Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click any HTML file → "Open with Live Server"

### Option 3: Direct File (Limited)
Open any `.html` file directly in your browser (some features may not work due to CORS restrictions with `file://` protocol).

## 📁 Project Structure

```
scamalyst/
├── index.html          # Main entry page
├── home.html           # Landing page
├── analyze.html        # Main tool
├── practice.html       # Practice mode
├── about.html          # Project story and mission
├── ethics.html         # Ethics and transparency
├── styles.css          # Comprehensive styling (600+ lines)
├── script.js           # Analyzer logic (220+ lines)
├── README.md           # This file
├── PROJECT_STATUS.md   # Build and testing status
├── GITHUB_PAGES_SETUP.md # Deployment instructions
└── pexels-googledeepmind-17485706.jpg # Background image
```

## 🧠 How It Works

### Scam Analysis
```javascript
analyzeMessage(text) → {score: 0-10, verdict: string, reasons: array}
```
- **Score 0-2**: Likely Safe
- **Score 3-6**: Suspicious
- **Score 7-10**: Likely Scam

### AI Detection
```javascript
detectAI(text) → {score: 0-1, verdict: string, reasons: array}
```
- **Score 0.0-0.35**: Likely Human
- **Score 0.35-0.60**: Possibly AI-Generated
- **Score 0.60-1.0**: Likely AI-Generated

Both functions return **reasons** explaining the verdict, making it educational.

## 🎓 Educational Value

Unlike a simple "yes/no" detector, Scamalyst:
- ✅ Explains WHY a message is flagged
- ✅ Teaches real scam tactics
- ✅ Shows linguistic patterns of AI text
- ✅ Includes practice mode for hands-on learning
- ✅ Covers ethics and limitations transparently

## 🔒 Privacy & Ethics

- **No server** — All processing happens on your device
- **No tracking** — We don't collect, store, or share data
- **Open source** — Code is transparent and auditable
- **Honest about limits** — We explain what we can and can't detect
- **Teaching focused** — Goal is to educate, not to shame users

## ⚠️ Limitations

1. **Not perfect** — No detector is 100% accurate
2. **Context matters** — Some legitimate emails may have "scam" characteristics
3. **Language-specific** — Trained on English text patterns
4. **No ML** — Rule-based heuristics, not machine learning (simpler & more explainable)
5. **False positives possible** — Always verify suspicious messages independently

## 🏆 Project Highlights

This project emphasizes:
- **AI + Cybersecurity** — Detects both phishing scams and AI-generated text
- **Real-world impact** — Helps protect identity, money, and peace of mind
- **Accessible UX** — Clear, approachable language for broad audiences
- **Ethical approach** — Transparent about capabilities and limitations
- **Scalable deployment** — Can be hosted for free on GitHub Pages

## 🚀 Deployment (GitHub Pages)

See `GITHUB_PAGES_SETUP.md` for step-by-step instructions.

In short:
1. Push to GitHub
2. Enable Pages in repo settings
3. Site is live at `https://naomili-code.github.io/scamalyst/`

## 📝 License

Open source for educational use. Feel free to fork, modify, and improve!

## 🙌 Credits

- **Naomi** — Developer
- **Pexels** — Background image
- **Everyone who reported phishing attempts** — Your real-world examples made this possible

---

**Last Updated:** February 2026  
**Status:** Actively maintained ✨
