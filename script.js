// Global element references (populated when DOM is ready)
let analyzeBtn, messageEl, websiteEl, resultEl, reasonsEl, meterFill, aiMeterFill, aiMeterContainer;

let currentMode = 'message'; // Track current analysis mode

const urgencyWords = [
  'urgent', 'act now', 'immediately', 'right now', 'limited time', 'expires soon',
  'final notice', 'last chance', 'within 24 hours', 'account suspended', 'verify now',
  'security alert', 'response required'
];

const personalRequests = [
  'password', 'passcode', 'otp', 'verification code', 'ssn', 'social security',
  'credit card', 'debit card', 'cvv', 'bank account', 'routing number',
  'login credentials', 'private key', 'wallet seed', 'gift card'
];

// Wait for DOM to be ready before accessing elements
function initModeToggle() {
  // Populate global element references
  messageEl = document.getElementById('message');
  websiteEl = document.getElementById('websiteInput');
  resultEl = document.getElementById('result');
  reasonsEl = document.getElementById('reasons');
  meterFill = document.getElementById('meterFill');
  aiMeterFill = document.getElementById('aiMeterFill');
  
  const modeMessageBtn = document.getElementById('modeMessage');
  const modeWebsiteBtn = document.getElementById('modeWebsite');
  const messageMode = document.getElementById('messageMode');
  const websiteMode = document.getElementById('websiteMode');
  const exampleLabel = document.getElementById('exampleLabel');
  const exampleSelect = document.getElementById('exampleSelect');
  aiMeterContainer = document.getElementById('aiMeterContainer');

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
      // Clear previous results
      if(resultEl) resultEl.classList.add('hidden');
      if(reasonsEl) reasonsEl.innerHTML = '';
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
      // Clear previous results
      if(resultEl) resultEl.classList.add('hidden');
      if(reasonsEl) reasonsEl.innerHTML = '';
    });
  }
}

// Initialize when DOM is ready
function initAllListeners() {
  initModeToggle();
  initButtonListeners();
}

if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllListeners);
} else {
  initAllListeners();
}

// Initialize button event listeners when DOM is ready
function initButtonListeners() {
  analyzeBtn = document.getElementById('analyzeBtn');
  
  if(analyzeBtn) {
    analyzeBtn.addEventListener('click', runAnalysis);
  }

  

  const selectEl = document.getElementById('exampleSelect');
  if(selectEl) {
    selectEl.addEventListener('change', (e) => {
      if(e.target.value && messageEl) {
        messageEl.value = exampleMessages[e.target.value];
      }
    });
  }

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

  // Dark mode toggle - set up when DOM is ready
  const darkModeToggle = document.getElementById('darkModeToggle');
  if(darkModeToggle) {
    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if(savedDarkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.textContent = '☀️';
    }
    
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDarkMode);
      darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    });
  }
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

  // Attachment risk analyzer
  const dangerousAttachment = /\b[\w\- ]+\.(exe|scr|bat|cmd|com|js|vbs|jar|msi|iso|dll)\b/i;
  const macroAttachment = /\b[\w\- ]+\.(docm|xlsm|pptm)\b/i;
  const doubleExtension = /\b[\w\- ]+\.(pdf|doc|docx|xls|xlsx|jpg|png)\.(exe|scr|bat|cmd|js|vbs)\b/i;
  const attachmentLure = /\b(attached|attachment|invoice attached|open the file|enable macros|download file)\b/i;

  if(dangerousAttachment.test(text)) {
    score += 3;
    reasons.push('Attachment risk: message references potentially dangerous file types');
  }
  if(macroAttachment.test(text) || /enable content|enable editing|enable macro/i.test(lower)) {
    score += 2;
    reasons.push('Attachment risk: macro-enabled document or macro prompt detected');
  }
  if(doubleExtension.test(text)) {
    score += 3;
    reasons.push('Attachment risk: suspicious double-extension filename detected');
  }
  if(attachmentLure.test(lower) && /urgent|immediately|asap|today|final notice/i.test(lower)) {
    score += 1;
    reasons.push('Attachment risk: urgent pressure to open or download a file');
  }

  // Sender identity check (heuristic mismatch)
  const emailMatch = text.match(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/i);
  if(emailMatch) {
    const senderDomain = (emailMatch[1] || '').toLowerCase();
    const brandDomainMap = {
      'paypal': 'paypal.com',
      'amazon': 'amazon.com',
      'apple': 'apple.com',
      'microsoft': 'microsoft.com',
      'google': 'google.com',
      'bank of america': 'bankofamerica.com',
      'chase': 'chase.com',
      'wells fargo': 'wellsfargo.com'
    };

    for(const [brand, expectedDomain] of Object.entries(brandDomainMap)) {
      if(lower.includes(brand) && !senderDomain.includes(expectedDomain)) {
        score += 2;
        reasons.push(`Sender identity mismatch: claims "${brand}" but sender domain is "${senderDomain}"`);
        break;
      }
    }
  }

  // Invoice/payment scam detector
  const invoiceTerms = /\b(invoice|payment|past due|overdue|billing|wire transfer|bank transfer|outstanding balance|accounts payable)\b/i;
  const riskyPayment = /\b(gift card|crypto|bitcoin|ethereum|wire|zelle|cash app|venmo)\b/i;
  const accountChange = /\b(updated bank details|new bank account|change in payment details|send payment to this account)\b/i;
  const noVerification = /\b(do not call|no need to verify|confidential payment request|keep this between us)\b/i;

  if(invoiceTerms.test(text) && riskyPayment.test(text)) {
    score += 3;
    reasons.push('Payment scam pattern: invoice/payment request with high-risk payment method');
  }
  if(accountChange.test(lower)) {
    score += 2;
    reasons.push('Payment scam pattern: sudden request to change payment destination');
  }
  if(invoiceTerms.test(text) && /urgent|immediate|today|within 24 hours|final notice/i.test(lower)) {
    score += 1;
    reasons.push('Payment scam pattern: urgency tied to billing or invoice request');
  }
  if(noVerification.test(lower)) {
    score += 2;
    reasons.push('Payment scam pattern: discourages independent verification');
  }

  // Heuristic verdict
  let verdict = 'Likely Safe';
  if(score >= 7) verdict = 'Likely Scam';
  else if(score >= 3) verdict = 'Suspicious';

  return {score,verdict,reasons};
}

function setScamMeterColor(score) {
  if(!meterFill) return;
  if(score <= 2) {
    meterFill.style.background = 'linear-gradient(90deg, #2ecc71, #2ecc71)';
  } else if(score >= 7) {
    meterFill.style.background = 'linear-gradient(90deg, #e74c3c, #e74c3c)';
  } else {
    meterFill.style.background = 'linear-gradient(90deg, #2ecc71, #f1c40f, #e74c3c)';
  }
}

function renderMessageResult(scamRes, aiRes){
  if(!resultEl) return; // Only render if on analyze page
  
  resultEl.classList.remove('hidden');
  
  reasonsEl.innerHTML = '';
  
  // Add threat category icons to reasons
  scamRes.reasons.forEach((r, idx) => { 
    const li = document.createElement('li'); 
    const icon = getThreatIcon('Scam');
    li.innerHTML = `${icon} <strong>Scam Risk:</strong> ${r}`;
    li.style.animationDelay = (idx * 0.1) + 's';
    li.style.animation = 'slideIn 0.4s ease-out both';
    reasonsEl.appendChild(li); 
  });
  
  const aiReasonList = Array.isArray(aiRes?.reasons) ? [...aiRes.reasons] : [];
  const hasConcreteAIReason = aiReasonList.some((r) => r && r !== 'No AI indicators detected');

  if(aiRes.score >= 0.35 && !hasConcreteAIReason) {
    aiReasonList.push('Composite linguistic patterns suggest possible AI-generated writing.');
  }

  if(aiReasonList.length === 0) {
    aiReasonList.push('No AI indicators detected');
  }

  // Add AI detection reasons with icons
  aiReasonList.forEach((r, idx) => { 
    const li = document.createElement('li'); 
    const icon = getThreatIcon('AI');
    li.innerHTML = `${icon} <strong>AI Indicator:</strong> ${r}`;
    li.style.animationDelay = ((scamRes.reasons.length + idx) * 0.1) + 's';
    li.style.animation = 'slideIn 0.4s ease-out both';
    reasonsEl.appendChild(li); 
  });

  // Scam meter width (0-10 scale) with animation
  const scamPct = Math.min(100, Math.round((scamRes.score/10)*100));
  setScamMeterColor(scamRes.score);
  
  // Use setTimeout to ensure animation plays
  setTimeout(() => {
    meterFill.style.width = scamPct+'%';
  }, 10);
  
  // AI meter width (0-1 scale converted to percentage)
  const aiPct = Math.min(100, Math.round(aiRes.score*100));
  setTimeout(() => {
    aiMeterFill.style.width = aiPct+'%';
  }, 10);
  
  // Update score label with animated counter
  const scoreEl = document.getElementById('scamScore');
  if(scoreEl) {
    animateCounter(scoreEl, 0, Math.min(10, scamRes.score), '/10');
  }
  
  const aiScoreEl = document.getElementById('aiScore');
  if(aiScoreEl) {
    animateCounter(aiScoreEl, 0, Math.round(aiRes.score*100), '%');
  }
  
  const redFlagsSection = document.querySelector('.red-flags-section');
  updateRiskBadge(redFlagsSection, scamRes.score);
  
  // Threat breakdown chart removed for clarity

  const messageInsights = document.getElementById('messageInsights');
  if(messageInsights) messageInsights.classList.remove('hidden');

  if(messageEl) {
    const scamType = classifyScamType(messageEl.value, scamRes.reasons, scamRes.score);
    renderScamTypeInsight(scamType, scamRes.score);
    renderSafetyActions(scamType.type, scamRes.score);
    renderHighlightedPreview(messageEl.value, scamType.type, scamRes.score);
  }
}

function renderWebsiteResult(websiteRes) {
  if(!resultEl) return;
  
  resultEl.classList.remove('hidden');
  
  // Hide AI meter for website mode
  if(aiMeterContainer) aiMeterContainer.style.display = 'none';
  const scoreLabel = document.getElementById('scoreLabel');
  if(scoreLabel) scoreLabel.textContent = 'Legitimacy Risk Score';
  
  const scamPct = Math.min(100, Math.round((websiteRes.score/10)*100));
  setScamMeterColor(websiteRes.score);
  
  // Animate meter with delay
  setTimeout(() => {
    meterFill.style.width = scamPct+'%';
  }, 10);
  
  // Update score with animated counter
  const scoreEl = document.getElementById('scamScore');
  if(scoreEl) {
    animateCounter(scoreEl, 0, Math.min(10, websiteRes.score), '/10');
  }
  
  // Display red flags with threat icons
  reasonsEl.innerHTML = '';
  if(websiteRes.redFlags.length > 0) {
    websiteRes.redFlags.forEach((flag, idx)=>{ 
      const li = document.createElement('li');
      const icon = getThreatIcon(flag.category);
      li.innerHTML = `${icon} <strong>${flag.category}:</strong> ${flag.message}`; 
      li.style.animationDelay = (idx * 0.1) + 's';
      li.style.animation = 'slideIn 0.4s ease-out both';
      reasonsEl.appendChild(li); 
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<strong>✓ All Clear:</strong> No major red flags detected.';
    li.style.animation = 'slideIn 0.4s ease-out both';
    reasonsEl.appendChild(li);
  }
  
  const redFlagsSection = document.querySelector('.red-flags-section');
  updateRiskBadge(redFlagsSection, websiteRes.score);
  
  // Threat breakdown chart removed for clarity

  const messageInsights = document.getElementById('messageInsights');
  if(messageInsights) messageInsights.classList.add('hidden');
}

function updateRiskBadge(redFlagsSection, score) {
  if(!redFlagsSection) return;

  const badgeHTML = renderRiskBadge(score);

  const textArtifactRegex = /<span class="risk-badge[^>]*>[^<]*<\/span>/g;
  redFlagsSection.innerHTML = redFlagsSection.innerHTML.replace(textArtifactRegex, '').trim();

  redFlagsSection.querySelectorAll('.risk-badge').forEach((badge) => badge.remove());
  redFlagsSection.insertAdjacentHTML('afterbegin', badgeHTML);

  redFlagsSection.classList.remove('risk-very-low', 'risk-low', 'risk-medium', 'risk-high', 'risk-very-high');
  if(score < 1) redFlagsSection.classList.add('risk-very-low');
  else if(score < 3) redFlagsSection.classList.add('risk-low');
  else if(score < 5) redFlagsSection.classList.add('risk-medium');
  else if(score < 7) redFlagsSection.classList.add('risk-high');
  else redFlagsSection.classList.add('risk-very-high');
}

function classifyScamType(text, reasons = [], scamScore = 0) {
  const lower = (text || '').toLowerCase();
  const typeScores = {
    phishing: 0,
    attachment: 0,
    payment: 0,
    impersonation: 0
  };

  if(/verify|account suspended|security alert|click here|login/i.test(lower)) typeScores.phishing += 2;
  if(/https?:\/\/|bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd/i.test(lower)) typeScores.phishing += 1;

  if(/\.(exe|scr|bat|cmd|com|js|vbs|jar|msi|iso|dll|docm|xlsm|pptm)\b/i.test(lower)) typeScores.attachment += 3;
  if(/attachment|attached|open the file|enable macro|enable content/i.test(lower)) typeScores.attachment += 2;

  if(/invoice|payment|past due|overdue|wire transfer|bank transfer|billing/i.test(lower)) typeScores.payment += 2;
  if(/gift card|crypto|bitcoin|zelle|venmo|cash app|updated bank details|new bank account/i.test(lower)) typeScores.payment += 2;

  if(/from:\s*\w+|dear customer|dear valued customer|official notice/i.test(lower)) typeScores.impersonation += 1;
  if(/paypal|amazon|apple|microsoft|google|bank of america|chase|wells fargo/i.test(lower)) typeScores.impersonation += 1;
  if(reasons.some(r => /mismatch|official address/i.test(r))) typeScores.impersonation += 2;

  let type = null;
  let score = -1;
  for(const [candidate, candidateScore] of Object.entries(typeScores)) {
    if(candidateScore > score) {
      type = candidate;
      score = candidateScore;
    }
  }

  const labels = {
    phishing: {
      label: 'Phishing / Credential Theft',
      detail: 'This message pushes verification or link-click behavior to steal credentials.'
    },
    attachment: {
      label: 'Malicious Attachment Lure',
      detail: 'This message pressures the target to open a risky file or enable dangerous content.'
    },
    payment: {
      label: 'Invoice / Payment Diversion Scam',
      detail: 'This message attempts to redirect money through urgent or unverified payment instructions.'
    },
    impersonation: {
      label: 'Brand / Identity Impersonation',
      detail: 'This message appears to imitate a trusted person or organization.'
    },
    neutral: {
      label: 'No Clear Scam Pattern',
      detail: 'No specific scam pattern is strongly indicated from this text alone.'
    }
  };

  if(scamScore < 3 || score <= 0 || !type) {
    return { type: 'neutral', ...labels.neutral };
  }

  return { type, ...labels[type] };
}

function hasActionableScamType(type, score) {
  return Boolean(type && type !== 'neutral' && score >= 3);
}

function renderScamTypeInsight(scamType, score) {
  const cardEl = document.getElementById('scamTypeCard');
  const labelEl = document.getElementById('scamTypeLabel');
  const detailEl = document.getElementById('scamTypeDetail');

  const show = hasActionableScamType(scamType?.type, score);
  if(cardEl) cardEl.classList.toggle('hidden', !show);
  if(!show) return;

  if(labelEl) labelEl.textContent = scamType.label;
  if(detailEl) detailEl.textContent = scamType.detail;
}

function getSafetyActionsByType(type, score) {
  const baseActions = [
    'Do not click links or open attachments from this message.',
    'Verify the request through an official channel you look up yourself.',
    'Report and block the sender if the message is untrusted.'
  ];

  const typeActions = {
    attachment: [
      'Do not download or open the attached file.',
      'Never enable macros or “Enable Content” for untrusted files.',
      'Scan the file with antivirus before opening anything.'
    ],
    payment: [
      'Pause payment and confirm by calling a verified number.',
      'Do not send money via gift cards, wire, or crypto for urgent requests.',
      'Confirm bank detail changes with a known contact at the organization.'
    ],
    impersonation: [
      'Check the sender domain carefully for lookalikes or misspellings.',
      'Contact the real organization directly from its official website.',
      'Do not share OTPs, passwords, or account details.'
    ],
    phishing: [
      'Do not sign in from links in the message.',
      'Open the official website manually in a new tab.',
      'Change passwords if you already clicked a suspicious link.'
    ]
  };

  const actions = [...(typeActions[type] || typeActions.phishing), ...baseActions];
  if(score >= 7) actions.unshift('Treat this as high risk and stop interacting immediately.');
  return Array.from(new Set(actions)).slice(0, 5);
}

function renderSafetyActions(type, score) {
  const cardEl = document.getElementById('safetyActionsCard');
  const listEl = document.getElementById('safetyActionsList');
  if(!listEl) return;

  const show = hasActionableScamType(type, score);
  if(cardEl) cardEl.classList.toggle('hidden', !show);
  listEl.innerHTML = '';
  if(!show) return;

  const actions = getSafetyActionsByType(type, score);
  actions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    listEl.appendChild(li);
  });
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHighlightedPreview(text, type, score) {
  const cardEl = document.getElementById('highlightedPhrasesCard');
  const previewEl = document.getElementById('flaggedMessagePreview');
  if(!previewEl) return;

  const show = hasActionableScamType(type, score);
  if(cardEl) cardEl.classList.toggle('hidden', !show);
  if(!show) {
    previewEl.textContent = '';
    return;
  }

  const raw = (text || '').trim();
  if(!raw) {
    previewEl.textContent = 'Paste a message to see highlighted risk phrases.';
    return;
  }

  let safe = escapeHtml(raw.length > 1800 ? raw.slice(0, 1800) + '…' : raw);
  const highlightPatterns = [
    /(urgent|immediately|act now|final notice|within 24 hours|security alert)/gi,
    /(password|otp|verification code|ssn|credit card|bank account|routing number)/gi,
    /(click here|verify your account|download attached|enable macro|enable content)/gi,
    /(wire transfer|gift card|crypto|bitcoin|zelle|venmo|cash app)/gi,
    /(https?:\/\/[^\s]+|bit\.ly\/[\w-]+|tinyurl\/[\w-]+)/gi
  ];

  highlightPatterns.forEach(pattern => {
    safe = safe.replace(pattern, '<mark class="risk-highlight">$1</mark>');
  });

  previewEl.innerHTML = safe;
}

// Example messages object
const exampleMessages = {
  scam: `Dear Valued Customer,

Your account has been SUSPENDED immediately. Verify your account now by clicking here https://bit.ly/verify-now or your account will be permanently closed! Act now!

No response within 24 hours will result in termination.

Security Team`,

  'attachment-lure': `Subject: URGENT Payroll Correction Required

Hi,

Please review the attached file payroll_update_2026.pdf.exe and confirm immediately.
If you cannot open it, enable macros and click "Enable Content".
This must be completed today to avoid payment delay.

Finance Desk`,

  'sender-mismatch': `From: PayPal Support <alerts@secure-paypal-check.com>

Dear customer,

We detected unusual activity in your PayPal account.
Verify your identity now at https://bit.ly/paypal-secure-check within 24 hours
or your account will be suspended.

PayPal Security Team`,

  'invoice-diversion': `Subject: Updated banking details for Invoice #88421

Hi Accounts Payable,

Please process the outstanding invoice today via wire transfer using our NEW bank account details below.
Do not call to verify due to an ongoing internal audit.
If payment is delayed, late penalties will apply immediately.

Regards,
Vendor Billing`,
  
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
  if(score >= 8) verdict = '🚨 VERY HIGH RISK - Potentially Dangerous';
  else if(score >= 6) verdict = '⚠️ High Risk - Multiple Threats Detected';
  else if(score >= 4) verdict = '🟡 Medium Risk - Suspicious Activity';
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

  // MALWARE & SECURITY THREATS
  // Check for malware distribution indicators
  const malwareIndicators = ['download virus', 'free malware', 'trojan download', 'spyware', 'ransomware', 'keylogger', 'backdoor', 'worm download'];
  malwareIndicators.forEach(indicator => {
    if(html.includes(indicator)) {
      score += 3;
      flags.push({ category: 'Malware Risk', message: `Potential malware distribution: "${indicator}"` });
    }
  });

  // Check for suspicious downloads/executables
  if(html.match(/\.(exe|bat|cmd|scr|vbs|com|msi|dll)\b/gi)) {
    score += 2;
    flags.push({ category: 'Malware Risk', message: 'Offers suspicious executable files for download' });
  }

  // Check for unverified links that might be malicious
  const linkCount = (html.match(/href=["']https?:\/\//gi) || []).length;
  if(linkCount > 20) {
    score += 1;
    flags.push({ category: 'Malware Risk', message: 'Excessive external links (common malware distribution tactic)' });
  }

  // PHISHING INDICATORS (in addition to existing scam checks)
  const phishingPhrases = ['verify account', 'confirm identity', 'update payment', 'click here immediately', 'unusual activity detected', 'security alert', 'unusual sign-in activity'];
  phishingPhrases.forEach(phrase => {
    if(html.includes(phrase)) {
      score += 1.5;
      flags.push({ category: 'Phishing Risk', message: `Phishing-style language: "${phrase}"` });
    }
  });

  // HARMFUL/INAPPROPRIATE CONTENT
  // Check for indicators of hate speech or inappropriate content
  const hateSpeechTerms = ['hate group', 'extremist', 'racist content', 'white supremacy', 'genocide denial', 'slur'];
  hateSpeechTerms.forEach(term => {
    if(html.includes(term)) {
      score += 2.5;
      flags.push({ category: 'Harmful Content', message: `Potential hate speech or extremist content: "${term}"` });
    }
  });

  // Check for adult/inappropriate content indicators
  const adultkeywords = ['porn', 'xxx', 'nude', 'adult content'];
  const adultCount = adultkeywords.filter(kw => html.includes(kw)).length;
  if(adultCount > 0) {
    score += 1.5;
    flags.push({ category: 'Harmful Content', message: 'Contains adult/inappropriate content warnings' });
  }

  // Check for self-harm or dangerous content
  const selfHarmIndicators = ['self-harm', 'eating disorder tips', 'suicide method', 'depression glorification'];
  selfHarmIndicators.forEach(indicator => {
    if(html.includes(indicator)) {
      score += 2.5;
      flags.push({ category: 'Mental Health Risk', message: `Dangerous content that glorifies or encourages harm: "${indicator}"` });
    }
  });

  // MISINFORMATION & CREDIBILITY
  // Check for misinformation/conspiracy language
  const misinfoIndicators = ['government conspiracy', 'fake news', 'coverup', 'illuminati', 'chemtrails'];
  misinfoIndicators.forEach(indicator => {
    if(html.includes(indicator)) {
      score += 1;
      flags.push({ category: 'Misinformation', message: `Potential misinformation: "${indicator}"` });
    }
  });

  // PRIVACY & DATA HARVESTING
  // Check for suspicious data collection
  const dataHarvestPhrases = ['track your location', 'monitor activity', 'sell your data', 'harvesting personal info'];
  dataHarvestPhrases.forEach(phrase => {
    if(html.includes(phrase)) {
      score += 1.5;
      flags.push({ category: 'Privacy Risk', message: `Suspicious data collection practices: "${phrase}"` });
    }
  });

  // Check for password harvesting forms without security indicators
  const hasPasswordForm = html.includes('password') || html.includes('type="password"');
  const hasSSL = html.includes('https') && html.includes('secure');
  if(hasPasswordForm && !hasSSL) {
    score += 2;
    flags.push({ category: 'Privacy Risk', message: 'Password form without SSL/security indicators (password theft risk)' });
  }

  // DIGITAL PIRACY
  // Check for piracy/illegal content distribution
  const piracyIndicators = ['free movie download', 'download copyrighted', 'torrent', 'crack serial key', 'warez', 'pirated software'];
  piracyIndicators.forEach(indicator => {
    if(html.includes(indicator)) {
      score += 2;
      flags.push({ category: 'Legal Risk', message: `Potential illegal content: "${indicator}"` });
    }
  });

  // PREDATORY BEHAVIOR
  // Check for grooming or predatory language targeting minors
  const predatoryPhrases = ['meet young people', 'underage', 'minor friend finder', 'grooming'];
  predatoryPhrases.forEach(phrase => {
    if(html.includes(phrase)) {
      score += 3;
      flags.push({ category: 'Predatory Risk', message: `Potential predatory content detected: "${phrase}"` });
    }
  });

  // DANGEROUS BEHAVIOR ENCOURAGEMENT
  // Check for encouragement of unsafe security practices
  const unsafeSecurityPhrases = ['ignore security warnings', 'disable antivirus', 'turn off firewall', 'weak password is fine'];
  unsafeSecurityPhrases.forEach(phrase => {
    if(html.includes(phrase)) {
      score += 1.5;
      flags.push({ category: 'Security Malpractice', message: `Encourages unsafe practices: "${phrase}"` });
    }
  });

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

// Analyzer and chatbot are rule-based (no external model calls)

// ============ Floating Action Button ============
window.toggleFABMenu = function() {
  const menu = document.getElementById('fabMenu');
  console.log('Toggle FAB menu called');
  if(menu) {
    menu.classList.toggle('show');
    console.log('Menu show class now:', menu.classList.contains('show'));
  }
};

window.closeFABMenu = function() {
  const menu = document.getElementById('fabMenu');
  console.log('Close FAB menu called');
  if(menu) {
    menu.classList.remove('show');
  }
};

// ============ Chatbot (FAB) ============
const CHAT_MODE = 'local';

function getHelpText(topic) {
  const helpTopics = {
    scam: 'COMMON SCAM INDICATORS\n\n- Urgent or threatening language\n- Requests for passwords, SSN, or card numbers\n- Suspicious links or shortened URLs\n- Mentions of gift cards, wire, or crypto\n- Impersonating banks, companies, or government\n- Grammar and spelling errors\n- Pressure to act immediately\n- Claims of unexpected money or prizes',
    ai: 'AI-GENERATED TEXT SIGNS\n\n- Repetitive sentence structure\n- Generic phrases ("I hope this finds you well")\n- Overly formal tone or awkward word choice\n- Few or no contractions ("do not" vs "don\'t")\n- Too many adjectives and filler\n- No personal details or references\n- Consistent, predictable punctuation',
    url: 'SUSPICIOUS WEBSITE RED FLAGS\n\n- Misspelled domain names\n- Missing HTTPS or strange redirects\n- No contact info or privacy policy\n- Low-quality images or sloppy design\n- "Too good to be true" pricing\n- Only accepts crypto, gift cards, or wire\n- Newly created domain\n- Excessive pop-ups or forced downloads'
  };

  return helpTopics[topic] || 'Ask a question about scam safety or how Scamalyst works.';
}

function openChatbot() {
  const panel = document.getElementById('chatbotPanel');
  if(!panel) return;
  panel.classList.add('show');
  panel.setAttribute('aria-hidden', 'false');

  const messages = document.getElementById('chatbotMessages');
  if(messages && messages.children.length === 0) {
    appendChatMessage('bot', 'Ask about scam safety or how Scamalyst works. This FAQ bot answers common questions.');
  }

  const input = document.getElementById('chatbotInput');
  if(input) input.focus();
}

function closeChatbot() {
  const panel = document.getElementById('chatbotPanel');
  if(!panel) return;
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden', 'true');
}

function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  if(!panel) return;
  const isOpen = panel.classList.contains('show');
  if(isOpen) {
    closeChatbot();
  } else {
    openChatbot();
  }
}

function appendChatMessage(role, text) {
  const messages = document.getElementById('chatbotMessages');
  if(!messages) return null;
  const msg = document.createElement('div');
  msg.className = `chatbot-message ${role}`;
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
}

function localChatReply(userText) {
  const text = (userText || '').toLowerCase();

  const replies = [
    { keys: ['what is scamalyst', 'what does this site do', 'what is this'],
      answer: 'Scamalyst helps you spot scam patterns and teaches red flags in messages and websites. Use Analyze for a quick check and Practice for examples.' },
    { keys: ['how does it work', 'how do i use', 'how to use'],
      answer: 'Paste a message or URL into Analyze. You will get a risk score and red flags. Practice Mode shows examples and explanations.' },
    { keys: ['analyze', 'analysis', 'scanner'],
      answer: 'Go to Analyze, paste the message or URL, and click Analyze. The tool highlights urgency, suspicious links, and sensitive info requests.' },
    { keys: ['practice', 'examples', 'learn'],
      answer: 'Practice Mode shows real-world examples and teaches why they are risky. It is a safe way to learn patterns.' },
    { keys: ['phishing', 'email', 'text', 'sms'],
      answer: 'Phishing often uses urgency, impersonation, and links to fake login pages. Do not click links; go to the official site directly.' },
    { keys: ['website', 'url', 'link'],
      answer: getHelpText('url') },
    { keys: ['ai', 'generated', 'chatgpt'],
      answer: getHelpText('ai') },
    { keys: ['scam', 'fraud', 'fake', 'gift card', 'wire', 'crypto'],
      answer: getHelpText('scam') },
    { keys: ['report', 'where report', 'who to report'],
      answer: 'Report scams to the platform where you saw them, and consider reporting to local consumer protection agencies or your bank if money is involved.' }
  ];

  for(const rule of replies) {
    if(rule.keys.some(k => text.includes(k))) return rule.answer;
  }

  return 'I can help with scam safety and using Scamalyst. Try asking about phishing, suspicious websites, AI-generated text, or how to use Analyze/Practice.';
}

async function callChatbot(userText) {
  if(CHAT_MODE === 'local') return localChatReply(userText);
  return 'Chatbot is in FAQ-only mode.';
}

function sendHelpTopic(topic) {
  openChatbot();
  appendChatMessage('bot', getHelpText(topic));
}

async function sendChatMessage(event) {
  if(event) event.preventDefault();
  const input = document.getElementById('chatbotInput');
  if(!input) return false;

  const text = input.value.trim();
  if(!text) return false;

  input.value = '';
  appendChatMessage('user', text);
  const placeholder = appendChatMessage('bot', 'Thinking...');

  try {
    const reply = await callChatbot(text);
    if(placeholder) placeholder.textContent = reply || 'Sorry, I could not generate a response.';
  } catch (err) {
    if(placeholder) placeholder.textContent = 'Sorry, something went wrong.';
  }

  return false;
}

// Close menu when clicking outside (with better checks)
document.addEventListener('click', function(e) {
  const fabBtn = document.getElementById('fabBtn');
  const fabMenu = document.getElementById('fabMenu');
  
  // Only close if clicking outside both button and menu
  if(fabMenu && fabMenu.classList.contains('show')) {
    const isClickOnButton = fabBtn && (e.target === fabBtn || fabBtn.contains(e.target));
    const isClickOnMenu = fabMenu.contains(e.target);
    
    if(!isClickOnButton && !isClickOnMenu) {
      console.log('Closing menu - click was outside');
      fabMenu.classList.remove('show');
    }
  }
});

// ============ Animated Number Counter ============
function animateCounter(element, startValue, endValue, suffix = '') {
  const duration = 1500;
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startValue + (endValue - startValue) * easeOut);
    
    element.textContent = current + suffix;
    
    if(progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// ============ Render Progress Circle ============
function renderProgressCircle(score, maxScore = 10) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / maxScore) * circumference;
  
  const gradientId = `gradient-${Math.random()}`;
  
  return `<svg class="progress-circle" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2ecc71;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#f1c40f;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e74c3c;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle class="progress-circle-bg" cx="60" cy="60" r="${radius}"></circle>
    <circle class="progress-circle-fill" cx="60" cy="60" r="${radius}" style="stroke-dashoffset: ${offset}"></circle>
  </svg>`;
}

// ============ Threat Category Icons ============
const threatIcons = {
  'Scam': '🚨',
  'AI': '🤖',
  'Malware': '🦠',
  'Phishing': '🎣',
  'Hate Speech': '😤',
  'Self-Harm': '⚠️',
  'Misinformation': '❌',
  'Privacy Breach': '🔓',
  'Piracy': '🏴‍☠️',
  'Predatory Risk': '🛑',
  'Security Malpractice': '🔒',
  'Payment': '💰',
  'Credential Request': '🔑'
};

function getThreatIcon(category) {
  return threatIcons[category] || '⚠️';
}

// ============ Render Risk Badge ============
function renderRiskBadge(score, maxScore = 10) {
  let level = 'very-low';
  let text = 'VERY LOW RISK';
  
  const percentage = (score / maxScore) * 100;
  if(percentage > 80) {
    level = 'very-high';
    text = 'VERY HIGH RISK';
  } else if(percentage > 60) {
    level = 'high';
    text = 'HIGH RISK';
  } else if(percentage > 40) {
    level = 'medium';
    text = 'MEDIUM RISK';
  } else if(percentage > 20) {
    level = 'low';
    text = 'LOW RISK';
  }
  
  return `<span class="risk-badge ${level}">${text}</span>`;
}

// ============ Help Function for FAB ============
function showHelp(topic) {
  const message = getHelpText(topic);
  alert(message);

  // Close the FAB menu
  const fabMenu = document.getElementById('fabMenu');
  if(fabMenu) fabMenu.classList.remove('show');
}

// ============ Threat Breakdown Chart ============
function createThreatChart(flags) {
  if(!flags || flags.length === 0) return '';
  
  const categoryCounts = {};
  flags.forEach(flag => {
    const cat = flag.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(categoryCounts));
  
  let bars = '';
  for(const [category, count] of Object.entries(categoryCounts)) {
    const height = (count / maxCount) * 100;
    bars += `
      <div class="chart-bar" style="height: ${height}%; opacity: 0.7 + ${count / maxCount} * 0.3;">
        <div class="chart-bar-value">${count}</div>
        <div class="chart-bar-label">${category.substring(0, 8)}</div>
      </div>
    `;
  }
  
  return `
    <div class="threat-chart-container">
      <div class="chart-title">📊 Threat Distribution</div>
      <div class="chart-bars">${bars}</div>
    </div>
  `;
}

// ============ Tooltip Helper ============
function createTooltip(text, tooltip) {
  return `<span class="tooltip-trigger">${text}<span class="tooltip-text">${tooltip}</span></span>`;
}

function runAnalysis(event) {
  if(event && typeof event.preventDefault === 'function') event.preventDefault();

  if(currentMode === 'message') {
    const text = messageEl ? messageEl.value : '';
    if(!text.trim()) {
      alert('Please paste a message to analyze.');
      return false;
    }
    const scamRes = analyzeMessage(text);
    const aiRes = detectAI(text);
    renderMessageResult(scamRes, aiRes);
    return false;
  }

  if(currentMode === 'website') {
    const input = websiteEl ? websiteEl.value : '';
    if(!input.trim()) {
      alert('Please enter a website URL or HTML to analyze.');
      return false;
    }
    const websiteRes = analyzeWebsite(input);
    renderWebsiteResult(websiteRes);
    return false;
  }

  return false;
}

window.runAnalysis = runAnalysis;