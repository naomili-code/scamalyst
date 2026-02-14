const analyzeBtn = document.getElementById('analyzeBtn');
const examplesBtn = document.getElementById('examplesBtn');
const messageEl = document.getElementById('message');
const websiteEl = document.getElementById('websiteInput');
const resultEl = document.getElementById('result');
const verdictEl = document.getElementById('verdict');
const reasonsEl = document.getElementById('reasons');
const meterFill = document.getElementById('meterFill');
const aiMeterFill = document.getElementById('aiMeterFill');

let currentMode = 'message'; // Track current analysis mode

// Mode toggle
const modeMessageBtn = document.getElementById('modeMessage');
const modeWebsiteBtn = document.getElementById('modeWebsite');
const messageMode = document.getElementById('messageMode');
const websiteMode = document.getElementById('websiteMode');
const exampleLabel = document.getElementById('exampleLabel');
const exampleSelect = document.getElementById('exampleSelect');
const aiMeterContainer = document.getElementById('aiMeterContainer');

if(modeMessageBtn && modeWebsiteBtn) {
  modeMessageBtn.addEventListener('click', () => {
    currentMode = 'message';
    messageMode.classList.remove('hidden');
    websiteMode.classList.add('hidden');
    modeMessageBtn.classList.add('active');
    modeWebsiteBtn.classList.remove('active');
    exampleLabel.style.display = 'inline-block';
    exampleSelect.style.display = 'inline-block';
    if(aiMeterContainer) aiMeterContainer.style.display = 'block';
  });
  
  modeWebsiteBtn.addEventListener('click', () => {
    currentMode = 'website';
    messageMode.classList.add('hidden');
    websiteMode.classList.remove('hidden');
    modeMessageBtn.classList.remove('active');
    modeWebsiteBtn.classList.add('active');
    exampleLabel.style.display = 'none';
    exampleSelect.style.display = 'none';
    if(aiMeterContainer) aiMeterContainer.style.display = 'none';
  });
}

const urgencyWords = ['urgent','immediately','act now','final notice','asap','verify now','last chance','limited time'];
const personalRequests = ['password','ssn','social security','bank account','verify your account','card number','cvv','pin'];

// Only set up event listeners if elements exist (on analyze page)
if(analyzeBtn) {
  analyzeBtn.addEventListener('click', () => {
    if(currentMode === 'message') {
      const text = messageEl.value;
      if(!text.trim()) {
        alert('Please paste a message to analyze.');
        return;
      }
      const scamRes = analyzeMessage(text);
      const aiRes = detectAI(text);
      renderMessageResult(scamRes, aiRes);
    } else if(currentMode === 'website') {
      const input = websiteEl.value;
      if(!input.trim()) {
        alert('Please enter a website URL or HTML to analyze.');
        return;
      }
      const websiteRes = analyzeWebsite(input);
      renderWebsiteResult(websiteRes);
    }
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
if(clearBtn) {
  clearBtn.addEventListener('click', () => {
    if(currentMode === 'message' && messageEl) {
      messageEl.value = '';
    } else if(currentMode === 'website' && websiteEl) {
      websiteEl.value = '';
    }
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

function renderMessageResult(scamRes, aiRes){
  if(!resultEl) return; // Only render if on analyze page
  
  resultEl.classList.remove('hidden');
  
  // Scam detection section
  verdictEl.innerHTML = `<strong>Scam Risk:</strong> ${scamRes.verdict}<br/><strong>AI Likelihood:</strong> ${aiRes.verdict}`;
  verdictEl.setAttribute('role', 'status');
  
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
  
  // Update score label
  const scoreEl = document.getElementById('scamScore');
  if(scoreEl) scoreEl.textContent = `${scamRes.score}/10`;
  const aiScoreEl = document.getElementById('aiScore');
  if(aiScoreEl) aiScoreEl.textContent = `${Math.round(aiRes.score*100)}%`;
  
  // Populate teaching points
  populateTeachingPoints(scamRes.reasons.concat(aiRes.reasons));
}

function renderWebsiteResult(websiteRes) {
  if(!resultEl) return;
  
  resultEl.classList.remove('hidden');
  
  // Update verdict
  verdictEl.innerHTML = `<strong>Website Assessment:</strong> ${websiteRes.verdict}`;
  verdictEl.setAttribute('role', 'status');
  
  // Hide AI meter for website mode
  if(aiMeterContainer) aiMeterContainer.style.display = 'none';
  
  // Update scam meter
  const scoreLabel = document.getElementById('scoreLabel');
  if(scoreLabel) scoreLabel.textContent = 'Legitimacy Risk Score';
  
  const scamPct = Math.min(100, Math.round((websiteRes.score/10)*100));
  meterFill.style.width = scamPct+'%';
  
  const scoreEl = document.getElementById('scamScore');
  if(scoreEl) scoreEl.textContent = `${websiteRes.score}/10`;
  
  // Display red flags
  reasonsEl.innerHTML = '';
  if(websiteRes.redFlags.length > 0) {
    websiteRes.redFlags.forEach(flag=>{ 
      const li = document.createElement('li'); 
      li.innerHTML = `<strong>${flag.category}:</strong> ${flag.message}`; 
      reasonsEl.appendChild(li); 
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No major red flags detected.';
    reasonsEl.appendChild(li);
  }
  
  // Populate teaching points for website flags
  populateWebsiteTeachingPoints(websiteRes.redFlags);
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

// Teaching Points: Explanations for why each red flag matters
const teachingExplanations = {
  'urgent': 'Scammers use urgent language to make you act without thinking. Real companies give you time to verify.',
  'pressure': 'Artificial urgency is a classic manipulation tactic. Legitimate businesses don\'t pressure you.',
  'verify': 'Fake verification requests are phishing attempts to steal your credentials. Real companies verify internally.',
  'password': 'Never give your password to anyone—not even your bank. Legitimate companies never ask for passwords via email.',
  'ssn': 'Requesting Social Security numbers is a major red flag. Legitimate companies only ask when necessary and via secure channels.',
  'bank account': 'Never share banking credentials via email or text. This is classic identity theft.',
  'cvv': 'CVV codes are for secure transactions only. Legitimate companies never ask for them via email.',
  'pin': 'PINs should never be shared. This is a sign of fraud.',
  'link': 'External links in suspicious messages often lead to phishing sites or malware. Verify URLs before clicking.',
  'shortened': 'Shortened links hide the actual destination. Scammers use these to disguise phishing URLs.',
  'seller mismatch': 'If the sender\'s email doesn\'t match the claimed company, it\'s likely a fake.',
  'exclamation': 'High-emotion formatting (lots of ! or ALL CAPS) is used to bypass your critical thinking.',
  'spelling': 'Professional companies proofread. Spelling errors often indicate scams or AI-generated content.',
  'click': 'Phishing emails try to get you to click links. Legitimate companies don\'t use high-pressure link requests.',
  'download': 'Unsolicited downloads are common malware delivery methods.',
  'generic ai': 'These phrases indicate AI-generated text, which scammers use to write convincing fake messages.',
  'low variance': 'Humans vary sentence length naturally. Consistent lengths suggest AI.',
  'no contractions': 'Humans use contractions (don\'t, can\'t). AI often avoids them, making text seem formal.',
  'high stopword': 'AI relies on common words. This linguistic pattern is typical of AI-generated text.',
  'no punctuation': 'Lack of punctuation variation is unusual for humans but common in AI.',
  'no questions': 'Humans ask questions and express excitement. Absence of these is a hallmark of AI.',
  'repeated patterns': 'AI tends to repeat phrase patterns. Human writing is more varied.',
  'formal punctuation': 'Excessive formal punctuation (commas, semicolons) is typical of AI.',
  
  // Website-specific explanations
  'contact': 'Legitimate businesses want you to reach them. Missing contact info is a major scam indicator.',
  'phone': 'Real companies have phones. No phone number often means the business doesn\'t exist.',
  'professional email': 'Using personal emails (@gmail.com) instead of a business domain is suspicious.',
  'return policy': 'Legitimate stores have return policies. Their absence suggests a scam.',
  'privacy': 'Privacy and terms are legal requirements for real websites. Missing them is a red flag.',
  'cryptocurrency': 'Crypto payments can\'t be reversed. Scammers love this. Legitimate businesses offer refunds.',
  'wire transfer': 'Wire transfers are untraceable. Once sent, your money is gone. Scam sites demand this.',
  'discount': 'Deals that seem too good to be true usually are. 90% off often means the site is fake.',
  'grammar': 'Sloppy writing suggests a rushed or fake site. Real companies invest in quality content.',
  'https': 'HTTP is unencrypted. HTTPS protects data. Always use HTTPS, but note: scammers can get certificates too.',
  'suspicious tld': 'Domains like .xyz or .shop are cheap and popular with scammers. Legitimate brands use .com, .org, .net.',
  'misspelled domain': 'Scammers register domains that look like famous brands (amaz0n.com, gooogle.com) to trick you.',
  'subdomain': 'A suspicious subdomain before the real domain means the real site isn\'t involved. Example: amazon.com.fake-site.com',
  'about': 'A vague "About Us" page is often a sign of a fake business. Real companies talk about their story and team.',
  'popup': 'Unexpected popups asking for info are phishing attempts. Real sites don\'t spam you with popups.'
};

function populateTeachingPoints(reasons) {
  const teachingPointsEl = document.getElementById('teachingPoints');
  if(!teachingPointsEl) return;
  
  teachingPointsEl.innerHTML = '';
  const explanationsShown = new Set();
  
  reasons.forEach(reason => {
    const lower = reason.toLowerCase();
    
    // Find matching explanation
    for(const [key, explanation] of Object.entries(teachingExplanations)) {
      if(lower.includes(key) && !explanationsShown.has(key)) {
        const div = document.createElement('div');
        div.className = 'teaching-point';
        div.innerHTML = `<strong>💡 ${reason.split(':')[0]}:</strong> ${explanation}`;
        teachingPointsEl.appendChild(div);
        explanationsShown.add(key);
        break;
      }
    }
  });
  
  // If no specific explanations found, add general guidance
  if(explanationsShown.size === 0) {
    const div = document.createElement('div');
    div.className = 'teaching-point';
    div.innerHTML = '<strong>✓ Good to know:</strong> When in doubt, trust your instincts. If something feels off, verify independently before sharing information or clicking links.';
    teachingPointsEl.appendChild(div);
  }
}

function populateWebsiteTeachingPoints(flags) {
  const teachingPointsEl = document.getElementById('teachingPoints');
  if(!teachingPointsEl) return;
  
  teachingPointsEl.innerHTML = '';
  const explanationsShown = new Set();
  
  flags.forEach(flag => {
    const lower = flag.message.toLowerCase();
    
    // Find matching explanation
    for(const [key, explanation] of Object.entries(teachingExplanations)) {
      if(lower.includes(key) && !explanationsShown.has(key)) {
        const div = document.createElement('div');
        div.className = 'teaching-point';
        div.innerHTML = `<strong>💡 ${flag.category}:</strong> ${explanation}`;
        teachingPointsEl.appendChild(div);
        explanationsShown.add(key);
        break;
      }
    }
  });
  
  // If no specific explanations, add general guidance
  if(explanationsShown.size === 0) {
    const div = document.createElement('div');
    div.className = 'teaching-point';
    div.innerHTML = '<strong>✓ Good to know:</strong> When evaluating a website, look at multiple factors. A single red flag might be innocent, but several together suggest a scam.';
    teachingPointsEl.appendChild(div);
  }
}
function analyzeWebsite(input) {
  let score = 0;
  const redFlags = [];
  
  // Determine if input is a URL or HTML
  const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://') || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input.trim());
  
  if(isUrl) {
    // Analyze URL
    const urlAnalysis = analyzeURL(input.trim());
    score += urlAnalysis.score;
    redFlags.push(...urlAnalysis.flags);
  } else {
    // Analyze HTML content
    const htmlAnalysis = analyzeHTMLContent(input);
    score += htmlAnalysis.score;
    redFlags.push(...htmlAnalysis.flags);
  }
  
  // Clamp score to 0-10
  score = Math.min(10, Math.max(0, score));
  
  let verdict = 'Likely Legitimate';
  if(score >= 8) verdict = '⚠️ Very High Risk - Likely Scam';
  else if(score >= 6) verdict = '⚠️ High Risk - Likely Scam';
  else if(score >= 4) verdict = '🟡 Medium Risk - Suspicious';
  else if(score >= 2) verdict = '🟡 Low Risk - Some Concerns';
  
  return { score, verdict, redFlags };
}

function analyzeURL(urlStr) {
  let score = 0;
  const flags = [];
  
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
    const domain = url.hostname.toLowerCase();
    
    // Check for HTTPS
    if(url.protocol === 'http:') {
      score += 2;
      flags.push({ category: 'Security', message: 'Uses HTTP instead of HTTPS (not secure)' });
    }
    
    // Check for suspicious TLDs
    const suspiciousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.shop', '.store', '.top', '.win', '.review', '.work', '.download', '.loan', '.date'];
    const tld = '.' + domain.split('.').pop();
    if(suspiciousTLDs.includes(tld)) {
      score += 2;
      flags.push({ category: 'Domain', message: `Suspicious top-level domain (${tld})` });
    }
    
    // Check for misspelled domains (common brand look-alikes)
    const commonBrands = ['amazon', 'apple', 'google', 'microsoft', 'facebook', 'paypal', 'ebay', 'netflix', 'spotify', 'dropbox'];
    const domainName = domain.split('.')[0];
    commonBrands.forEach(brand => {
      const similarity = levenshteinDistance(domainName, brand);
      if(similarity <= 2 && similarity > 0 && domainName.length > 3) {
        score += 3;
        flags.push({ category: 'Domain', message: `Domain name "${domainName}" resembles legitimate brand "${brand}"` });
      }
      // Check for common zero replacements (0 instead of O)
      if(/[0O]/.test(domainName)) {
        const normalized = domainName.replace(/0/g, 'o');
        if(normalized.includes(brand)) {
          score += 2.5;
          flags.push({ category: 'Domain', message: `Domain uses zero (0) to mimic brand name` });
        }
      }
    });
    
    // Check for subdomains trying to impersonate legitimate sites
    const parts = domain.split('.');
    if(parts.length > 2) {
      const suspiciousSubdom = /login|verify|confirm|account|update|secure|auth|admin|panel/i;
      if(suspiciousSubdom.test(parts[0])) {
        score += 1.5;
        flags.push({ category: 'Domain', message: `Suspicious subdomain (${parts[0]})` });
      }
    }
    
  } catch(e) {
    flags.push({ category: 'URL Format', message: 'Invalid URL format' });
    score += 1;
  }
  
  return { score, flags };
}

function analyzeHTMLContent(htmlStr) {
  let score = 0;
  const flags = [];
  const html = htmlStr.toLowerCase();
  
  // Check for missing contact information
  if(!html.includes('contact') && !html.includes('phone') && !html.includes('address') && !html.includes('email')) {
    score += 2;
    flags.push({ category: 'Contact Info', message: 'No contact information found' });
  }
  
  if(!html.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/) && !html.match(/[\w\.-]+@[\w\.-]+\.\w+/)) {
    score += 1.5;
    flags.push({ category: 'Contact Info', message: 'Missing phone number or professional email' });
  }
  
  // Check for missing return/privacy policies
  if(!html.includes('return') && !html.includes('refund') && !html.includes('policy')) {
    score += 2;
    flags.push({ category: 'Policies', message: 'No return or refund policy mentioned' });
  }
  
  if(!html.includes('privacy') || !html.includes('terms')) {
    score += 1.5;
    flags.push({ category: 'Policies', message: 'Missing privacy or terms of service' });
  }
  
  // Check for suspicious payment methods (crypto, wire transfers only)
  const cryptoOnly = html.includes('bitcoin') || html.includes('ethereum') || html.includes('cryptocurrency');
  const wireOnly = html.includes('wire transfer') && !html.includes('credit card');
  if(cryptoOnly || wireOnly) {
    score += 2.5;
    flags.push({ category: 'Payment', message: 'Only accepts cryptocurrency or wire transfers (non-reversible)' });
  }
  
  // Check for excessive discounts
  const discounts = html.match(/(\d+)\s*%\s*off/gi) || [];
  discounts.forEach(d => {
    const percent = parseInt(d);
    if(percent >= 75) {
      score += 1.5;
      flags.push({ category: 'Pricing', message: `Extremely high discount (${percent}% off) - too good to be true` });
    }
  });
  
  // Check for grammar/spelling errors (simple heuristics)
  const commonErrors = ['recieve', 'occured', 'seperate', 'definately', 'neccessary', 'untill', 'wiht', 'teh '];
  commonErrors.forEach(err => {
    if(html.includes(err)) {
      score += 0.8;
      flags.push({ category: 'Content Quality', message: `Spelling error detected: "${err}"` });
    }
  });
  
  // Check for urgent language
  const urgentPhrases = ['act now', 'limited time', 'hurry', 'buy now', 'expires soon', 'last chance', 'verify immediately', 'confirm now'];
  urgentPhrases.forEach(phrase => {
    if(html.includes(phrase)) {
      score += 0.8;
      flags.push({ category: 'Content', message: `Urgent/pressuring language: "${phrase}"` });
    }
  });
  
  // Check for suspicious popups
  if(html.includes('alert(') || html.includes('popup') || html.includes('window.open')) {
    score += 1;
    flags.push({ category: 'Scripts', message: 'Contains popup scripts or suspicious popups' });
  }
  
  // Check about us page
  if(!html.includes('about') || (html.match(/about.*?(generic|company|our)/i) && html.match(/about/i).length < 2)) {
    score += 0.8;
    flags.push({ category: 'Content', message: 'Missing or minimal "About Us" page' });
  }
  
  // Check for generic business language only
  if(!html.includes('phone') && !html.includes('address') && !html.includes('team')) {
    score += 0.7;
    flags.push({ category: 'Content', message: 'No specific business details or team information' });
  }
  
  return { score, flags };
}

// Simple Levenshtein distance for string similarity
function levenshteinDistance(a, b) {
  const matrix = [];
  for(let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for(let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for(let i = 1; i <= b.length; i++) {
    for(let j = 1; j <= a.length; j++) {
      if(b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

// No external model calls — purely rule-based analyzer
