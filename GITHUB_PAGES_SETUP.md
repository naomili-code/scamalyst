# Deploy Scamalyst to GitHub Pages

## Quick Start (5 minutes)

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new).
2. Name it: `scamalyst` (or your preferred name).
3. Make it **Public** (required for free GitHub Pages).
4. Leave other settings as default.
5. Click **Create repository**.

### Step 2: Push Your Code

In PowerShell, navigate to your project folder:

```powershell
cd C:\Users\Naomi\Desktop\HTML\scamalyst

# Initialize git (if not already done)
git init
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Add all files
git add .

# Commit
git commit -m "Initial commit: Scamalyst MVP"

# Add remote and push
git remote add origin https://github.com/naomili-code/scamalyst.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub.
2. Click **Settings** → **Pages** (left sidebar).
3. Under "Source", select **Deploy from a branch**.
4. Select **main** branch and **/root** folder.
5. Click **Save**.
6. Wait 1–2 minutes for the build.
7. Your site will be live at: `https://naomili-code.github.io/scamalyst/`

---

## Project Structure (for GitHub Pages)

Your repo should look like this:

```
scamalyst/
├── index.html          (main page)
├── styles.css          (styling)
├── script.js           (logic)
├── README.md           (project overview)
├── PROJECT_STATUS.md   (project status)
└── .gitignore          (optional: exclude files)
```

GitHub Pages will automatically serve `index.html` as the root.

---

## Testing Your Live Site

1. Open the URL: `https://naomili-code.github.io/scamalyst/`
2. Try the example dropdown and click Analyze.
3. Share the link with others—it's live and doesn't require any server!

---

## What to Include in Your README

Add a clear summary at the top of `README.md`:

```markdown
# Scamalyst

A web-based tool that detects AI-generated phishing scams and helps users protect their identities.

**Try it live:** [GitHub Pages Link](https://naomili-code.github.io/scamalyst/)

## Features

- Detects scam patterns (urgency, suspicious links, phishing)
- Detects AI-generated text (formal patterns, contractions, generic phrases)
- Explains why each message is risky
- 5 example messages to learn from
- Offline, privacy-first (no data tracking)

## How to Use

1. Paste a message (email, text, social media)
2. Or select an example from the dropdown
3. Click "Analyze"
4. See scam risk + AI likelihood with reasons

## Project Notes

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for implementation details and deployment readiness.
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Site returns 404** | Ensure repo is Public and Pages is enabled. Wait 1-2 min for build. |
| **Styles/JS not loading** | Clear browser cache (Ctrl+Shift+Delete) or hard refresh (Ctrl+F5). |
| **Changes not appearing** | Push to main, wait 1-2 min, hard refresh. |
| **Can't push to GitHub** | Check SSH key or use HTTPS with a personal access token. |

---

## Optional: Custom Domain

If you own a domain, you can link it in GitHub Pages settings (advanced).

---

## GWC Submission Checklist

Before submitting to the challenge, ensure:

- [ ] Site is live on GitHub Pages
- [ ] All features work (examples, Analyze button, both meters)
- [ ] README explains the project clearly
- [ ] PROJECT_STATUS.md covers problem, solution, and impact
- [ ] Code is clean and commented (especially AI detection logic)
- [ ] No API keys or secrets committed
- [ ] Accessibility tested (keyboard nav, screen reader friendly)
- [ ] Submission form includes link to live site + GitHub repo

---

## Questions?

- **GitHub Pages docs:** https://docs.github.com/en/pages
- **GWC Challenge:** https://www.girlswhocode.com/gwc-challenges

Good luck with your submission! 🚀
