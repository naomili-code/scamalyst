// AI Scam Sensei - rule-based analyzer with optional model hook
const analyzeBtn = document.getElementById('analyzeBtn');
const examplesBtn = document.getElementById('examplesBtn');
const messageEl = document.getElementById('message');
const resultEl = document.getElementById('result');
const verdictEl = document.getElementById('verdict');
const scoreEl = document.getElementById('score');
const reasonsEl = document.getElementById('reasons');
const meterFill = document.getElementById('meterFill');

const urgencyWords = ['urgent','immediately','act now','final notice','asap','verify now','last chance','limited time'];
const personalRequests = ['password','ssn','social security','bank account','verify your account','card number','cvv','pin'];

function analyzeMessage(text){
  text = (text||'').trim();
  let score = 0;
  const reasons = [];
  const lower = text.toLowerCase();

  if(!text) return {score:0,verdict:'No text',reasons:['No message provided']};

  // Urgency
  urgencyWords.forEach(w=>{ if(lower.includes(w)){ score += 2; reasons.push('Uses urgent or pressuring language: "'+w+'"'); }});

  // Requests for sensitive info
  personalRequests.forEach(w=>{ if(lower.includes(w)){ score += 3; reasons.push('Requests sensitive personal information: "'+w+'"'); }});

  // Links
  const linkMatch = text.match(/https?:\/\/[\w\-\.\/\?\=\&\%\#]+/i);
  if(linkMatch){ score += 2; reasons.push('Contains an external link: '+linkMatch[0]); }

  // Shortened links (common in scams)
  if(/bit\.ly|tinyurl|t\.co|goo\.gl|owly|is\.gd/i.test(text)){ score += 2; reasons.push('Uses a shortened or obfuscated link'); }

  // Sender-name mismatch hints (heuristic)
  if(/from:\s*\w+/i.test(text) && /@\w+\./.test(text) && !/\b(official|support|admin|service)\b/i.test(text)){
    score += 1; reasons.push('Sender may not match official address');
  }

  // Too many exclamation marks or all-caps
  const exclam = (text.match(/!/g)||[]).length;
  if(exclam >= 2){ score += 1; reasons.push('High-emotion formatting (multiple exclamation points)'); }
  if(/^[^a-z]*[A-Z\s0-9\W]+$/.test(text.replace(/\s+/g,'')) && text.length>20){ score += 1; reasons.push('Unusual ALL-CAPS formatting'); }

  // Spelling/grammar heuristics (simple)
  const commonMistakes = /recieve|banking\s+information|congradulations/i;
  if(commonMistakes.test(text)){ score += 1; reasons.push('Possible spelling/grammar oddities'); }

  // Requests to click and verify or urgent downloads
  if(/click (here|the link)|verify (your|account)|update (your|account)|download attached/i.test(lower)){
    score += 2; reasons.push('Asks to click a link, verify, or download — common in phishing');
  }

  // Heuristic verdict
  let verdict = 'Likely Safe';
  if(score >= 7) verdict = 'Likely Scam';
  else if(score >= 3) verdict = 'Suspicious';

  return {score,verdict,reasons};
}

function renderResult(res){
  resultEl.classList.remove('hidden');
  verdictEl.textContent = res.verdict;
  scoreEl.textContent = res.score;
  reasonsEl.innerHTML = '';
  res.reasons.forEach(r=>{ const li = document.createElement('li'); li.textContent = r; reasonsEl.appendChild(li); });

  // meter width
  const pct = Math.min(100, Math.round((res.score/10)*100));
  meterFill.style.width = pct+'%';
}

analyzeBtn.addEventListener('click', ()=>{
  const text = messageEl.value;
  const res = analyzeMessage(text);
  renderResult(res);
});

examplesBtn.addEventListener('click', ()=>{
  messageEl.value = `Dear customer, your account has been suspended. Click here https://bit.ly/verify-now to verify immediately or your account will be closed.`;
});

// Optional: function to call a Hugging Face inference model (requires API key)
async function callModel(text, apiKey, model="facebook/bart-large-mnli"){
  if(!apiKey) throw new Error('Missing API key');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {method:'POST',headers:{Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json'},body:JSON.stringify({inputs:text})});
  return res.json();
}
