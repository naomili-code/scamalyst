const analyzeBtn = document.getElementById('analyzeBtn');
const examplesBtn = document.getElementById('examplesBtn');
const messageEl = document.getElementById('message');
const resultEl = document.getElementById('result');
const verdictEl = document.getElementById('verdict');
const scoreEl = document.getElementById('score');
const reasonsEl = document.getElementById('reasons');
const meterFill = document.getElementById('meterFill');
const aiMeterFill = document.getElementById('aiMeterFill');

const urgencyWords = ['urgent','immediately','act now','final notice','asap','verify now','last chance','limited time'];
const personalRequests = ['password','ssn','social security','bank account','verify your account','card number','cvv','pin'];

// Only set up event listeners if elements exist (on analyze page)
if(analyzeBtn) {
  analyzeBtn.addEventListener('click', () => {
    const text = messageEl.value;
    if(!text.trim()) {
      alert('Please paste a message to analyze.');
      return;
    }
    const scamRes = analyzeMessage(text);
    const aiRes = detectAI(text);
    renderResult(scamRes, aiRes);
  });
}

if(examplesBtn || document.getElementById('exampleSelect')) {
  const selectEl = document.getElementById('exampleSelect');
  if(selectEl) {
    selectEl.addEventListener('change', (e) => {
      if(e.target.value && messageEl) {
        messageEl.value = exampleMessages[e.target.value];
      }
    });
  }
}

// Clear button handler
const clearBtn = document.getElementById('clearBtn');
if(clearBtn && messageEl) {
  clearBtn.addEventListener('click', () => {
    messageEl.value = '';
    if(resultEl) resultEl.classList.add('hidden');
  });
}

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

function renderResult(scamRes, aiRes){
  if(!resultEl) return; // Only render if on analyze page
  
  resultEl.classList.remove('hidden');
  
  // Scam detection section
  verdictEl.innerHTML = `<strong>Scam Risk:</strong> ${scamRes.verdict}<br/><strong>AI Likelihood:</strong> ${aiRes.verdict}`;
  verdictEl.setAttribute('role', 'status');
  
  const scoreEl = document.getElementById('score');
  if(scoreEl) scoreEl.textContent = `Scam: ${scamRes.score}/10 | AI: ${Math.round(aiRes.score*100)}%`;
  
  reasonsEl.innerHTML = '';
  const heading = document.createElement('strong');
  heading.textContent = 'Scam Detection Reasons:';
  reasonsEl.appendChild(heading);
  scamRes.reasons.forEach(r=>{ const li = document.createElement('li'); li.textContent = r; reasonsEl.appendChild(li); });
  
  // AI detection reasons
  const aiHeading = document.createElement('strong');
  aiHeading.textContent = 'AI Detection Reasons:';
  aiHeading.style.marginTop = '12px';
  aiHeading.style.display = 'block';
  reasonsEl.appendChild(aiHeading);
  aiRes.reasons.forEach(r=>{ const li = document.createElement('li'); li.textContent = r; reasonsEl.appendChild(li); });

  // Scam meter width (0-10 scale)
  const scamPct = Math.min(100, Math.round((scamRes.score/10)*100));
  meterFill.style.width = scamPct+'%';
  
  // AI meter width (0-1 scale converted to percentage)
  const aiPct = Math.min(100, Math.round(aiRes.score*100));
  aiMeterFill.style.width = aiPct+'%';
}

// Example messages object
const exampleMessages = {
  scam: `Dear Valued Customer,

Your account has been SUSPENDED immediately. Verify your account now by clicking here https://bit.ly/verify-now or your account will be permanently closed! Act now!

No response within 24 hours will result in termination.

Security Team`,
  
  'ai-chatgpt': `As an AI language model, I must clarify that cybersecurity is a critical topic. The landscape of digital threats has evolved significantly. It is important to note that protecting personal information requires multiple layers of defense. Per my programming, I should mention that best practices include using strong passwords, enabling two-factor authentication, and staying informed about phishing attempts.`,
  
  'ai-formal': `The implementation of robust cybersecurity protocols necessitates a comprehensive understanding of threat vectors. Contemporary digital infrastructure demands adherence to established security frameworks and industry standards. Organizations are therefore recommended to establish proactive monitoring systems and regularly evaluate their defensive mechanisms.`,
  
  'human-casual': `Hey! So I just got this weird email asking me to verify my password. Total scam right? Anyway, be careful out there. My friend almost fell for the same thing last week.`,
  
  'human-professional': `I wanted to share some thoughts on improving our security practices. There are a few things we could do better. First, we should consider updating our password policies. Also, maybe we need clearer guidelines for identifying suspicious emails? Let me know what you think.`
};

// AI Detection: heuristic features to detect AI-generated text
function detectAI(text){
  text = (text||'').trim();
  if(!text) return {score: 0, verdict: 'No text', reasons: ['No message provided']};

  const reasons = [];
  let score = 0;
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(w=>w.length>0);
  const sentences = text.split(/[.!?]+/).filter(s=>s.trim().length>0);

  // Feature 1: Average word length
  const avgWordLen = words.reduce((sum, w)=>sum+w.length, 0) / (words.length||1);
  if(avgWordLen > 5.5) { score += 0.15; reasons.push('Higher average word length (typical of AI)'); }

  // Feature 2: Sentence length variance (AI tends to have consistent lengths)
  const sentenceLengths = sentences.map(s=>s.split(/\s+/).length);
  const meanSentenceLen = sentenceLengths.reduce((a,b)=>a+b, 0) / (sentenceLengths.length||1);
  const variance = sentenceLengths.reduce((sum, len)=>sum + Math.pow(len - meanSentenceLen, 2), 0) / (sentenceLengths.length||1);
  const stdDev = Math.sqrt(variance);
  if(stdDev < 3 && sentences.length > 3) { score += 0.1; reasons.push('Low sentence-length variance (sign of AI consistency)'); }

  // Feature 3: Stopword ratio (AI often uses more common words)
  const stopwords = new Set(['the','a','an','is','are','was','were','be','by','at','to','in','on','of','and','or','but','if','for','with','as','from']);
  const stopwordCount = words.filter(w=>stopwords.has(w.toLowerCase())).length;
  const stopwordRatio = stopwordCount / (words.length||1);
  if(stopwordRatio > 0.35) { score += 0.1; reasons.push('High stopword ratio (typical of AI)'); }

  // Feature 4: Contraction usage (humans use more contractions)
  const contractions = (text.match(/\b(don't|won't|can't|it's|that's|i'm|you're|we're|they're|isn't|aren't|wasn't|weren't|haven't|hasn't|didn't|doesn't|wouldn't|couldn't|shouldn't|mightn't)\b/gi)||[]).length;
  if(contractions === 0 && words.length > 20) { score += 0.12; reasons.push('No contractions detected (AI often avoids them)'); }

  // Feature 5: Generic AI phrases
  const aiPhrases = /(as an ai|i'm an ai|as a language model|i'm a language model|as an artificial intelligence|i cannot|i am not able to|i cannot directly|per my programming|i must clarify|i should note)/gi;
  if(aiPhrases.test(text)) { score += 0.25; reasons.push('Contains generic AI phrases or disclaimers'); }

  // Feature 6: Punctuation density
  const punctCount = (text.match(/[.,;:!?"'()-]/g)||[]).length;
  const punctDensity = punctCount / text.length;
  if(punctDensity < 0.04) { score += 0.08; reasons.push('Low punctuation density (AI tends to be more formal)'); }

  // Feature 7: Exclamation and question mark usage (humans vary more)
  const exclamCount = (text.match(/!/g)||[]).length;
  const questionCount = (text.match(/\?/g)||[]).length;
  if(exclamCount === 0 && questionCount === 0 && words.length > 30) { score += 0.08; reasons.push('No exclamations or questions (humans use them more)'); }

  // Feature 8: Repeated n-grams (AI can repeat patterns)
  const trigrams = new Map();
  for(let i=0; i<words.length-2; i++){
    const trigram = [words[i], words[i+1], words[i+2]].join(' ').toLowerCase();
    trigrams.set(trigram, (trigrams.get(trigram)||0) + 1);
  }
  const repeatedTrigrams = Array.from(trigrams.values()).filter(c=>c>1).length;
  if(repeatedTrigrams > words.length * 0.05) { score += 0.1; reasons.push('Repeated phrase patterns (sign of AI repetition)'); }

  // Feature 9: Formality indicators (multiple commas, semicolons)
  const formalPunctCount = (text.match(/[,;]/g)||[]).length;
  if(formalPunctCount > words.length * 0.1) { score += 0.07; reasons.push('High formal punctuation usage'); }

  // Clamp score to [0,1]
  score = Math.min(1, Math.max(0, score));

  let verdict = 'Likely Human';
  if(score >= 0.6) verdict = 'Likely AI-Generated';
  else if(score >= 0.35) verdict = 'Possibly AI-Generated';

  return { score, verdict, reasons: reasons.length > 0 ? reasons : ['No AI indicators detected'] };
}

// No external model calls — purely rule-based analyzer
