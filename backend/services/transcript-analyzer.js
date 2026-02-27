/**
 * Transcript Analyzer — Server-side scoring engine
 * Analyzes chatbot conversations and returns scores + key moments
 */

// ── Regex patterns ──

const FAILURE_RX = /maaf|tidak dapat|hubungi tim|contact support|tidak bisa membantu|cannot help|unable to|tim dukungan|customer service kami|tidak menemukan|sorry|apologize|mohon maaf|saya tidak bisa/gi;
const REDIRECT_RX = /hubungi|tanya@pluang\.com|live chat|pluang care|contact support|silakan hubungi|please contact|email kami|customer service|agen kami/gi;
const FRUSTRATION_RX = /kenapa|masih|tidak bisa|gagal|kesal|marah|kecewa|useless|terrible|worst|broken|not working|sudah lama|!!!|manusia|raise issue|raise a case|talk to agent|speak to human|bicara dengan/gi;
const RESOLUTION_RX = /berhasil|selesai|sudah selesai|resolved|completed|done|terima kasih|thank you|thanks|makasih|solved|helped/gi;
const ESCALATION_RX = /agent|manusia|orang|human|customer service|bicara dengan|connect|transfer|live chat|speak to/gi;
const KB_RX = /artikel|article|panduan|guide|faq|bantuan|help.*center|https?:\/\/|www\./gi;
const GREETING_RX = /halo|hello|hi |selamat|welcome|salam|good morning|good afternoon|assalamualaikum/gi;
const DISCLAIMER_RX = /ai support|virtual assistant|may not be perfect|tidak sempurna|asisten virtual/gi;
const PROMISE_RX = /saya akan|i will|i'll resolve|saya bantu selesaikan|pasti|will fix/gi;
const GENERIC_RX = /saya mengerti|i understand your concern|saya paham|maaf atas ketidaknyamanan/gi;
const ACTION_RX = /langkah|step|coba|try|click|klik|artikel|article|http|www\.|panduan|guide|ikuti/gi;

// ── Key Moment Types ──
const MOMENT_TYPES = {
  FAILURE_POINT: { type: 'failure_point', label: 'FAILURE POINT', sublabel: 'Bot Dead End', icon: '🔴', color: '#EF4444', severity: 1 },
  REDIRECT: { type: 'redirect', label: 'REDIRECT', sublabel: 'Handoff to Other Channel', icon: '🟠', color: '#F97316', severity: 3 },
  USER_FRUSTRATION: { type: 'user_frustration', label: 'USER FRUSTRATION', sublabel: 'Repeated or Escalated Request', icon: '🔴', color: '#EF4444', severity: 2 },
  RESOLUTION: { type: 'resolution', label: 'RESOLUTION SIGNAL', sublabel: 'Positive Outcome Indicator', icon: '🟢', color: '#34D399', severity: 7 },
  BOT_LOOP: { type: 'bot_loop', label: 'BOT LOOP', sublabel: 'Repeated Response', icon: '🟡', color: '#FBBF24', severity: 5 },
  ESCALATION: { type: 'escalation', label: 'ESCALATION EVENT', sublabel: 'Agent Handoff', icon: '🔵', color: '#38BDF8', severity: 6 },
  INTENT_MISS: { type: 'intent_miss', label: 'INTENT MISS', sublabel: 'Generic/Unrelated Response', icon: '🟡', color: '#FBBF24', severity: 4 },
  POSITIVE: { type: 'positive', label: 'POSITIVE INTERACTION', sublabel: 'Actionable Bot Response', icon: '🟢', color: '#34D399', severity: 8 },
};

/**
 * Compute word overlap ratio between two strings
 */
function wordOverlap(a, b) {
  const w1 = new Set((a || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const w2 = new Set((b || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (w1.size === 0 || w2.size === 0) return 0;
  const overlap = [...w1].filter(w => w2.has(w)).length;
  return overlap / Math.min(w1.size, w2.size);
}

/**
 * Classify each message with role info
 */
function classifyMessages(messages) {
  return messages.map((m, i) => {
    const isUser = m.sender === 'EndUser';
    const isBot = m.sender === 'Chatbot' || m.sender === 'Bot';
    const isAgent = m.sender === 'Agent';
    const isSystem = !isUser && !isBot && !isAgent;
    return { ...m, index: i, isUser, isBot, isAgent, isSystem };
  });
}

/**
 * Detect key moments in the conversation
 */
function detectKeyMoments(classified, totalTurns) {
  const moments = [];
  const userMsgs = classified.filter(m => m.isUser);
  const botMsgs = classified.filter(m => m.isBot);

  // 1. Failure Points — bot sends failure phrase
  botMsgs.forEach(m => {
    const text = m.text || '';
    FAILURE_RX.lastIndex = 0;
    if (FAILURE_RX.test(text)) {
      // Find the user message just before this bot message
      const prevUser = classified.filter(c => c.isUser && c.index < m.index).pop();
      moments.push({
        ...MOMENT_TYPES.FAILURE_POINT,
        turn: m.index + 1,
        totalTurns,
        messages: [
          ...(prevUser ? [{ sender: 'EndUser', text: prevUser.text }] : []),
          { sender: 'Chatbot', text: m.text },
        ],
        explanation: 'Bot admitted inability to help — used failure/apology language without resolution',
      });
    }
  });

  // 2. Redirect/Handoff — bot redirects to another channel
  botMsgs.forEach(m => {
    const text = m.text || '';
    REDIRECT_RX.lastIndex = 0;
    if (REDIRECT_RX.test(text)) {
      // Avoid duplicate if already a failure point for the same message
      const alreadyFailure = moments.some(mo => mo.type === 'failure_point' && mo.turn === m.index + 1);
      if (!alreadyFailure) {
        const prevUser = classified.filter(c => c.isUser && c.index < m.index).pop();
        moments.push({
          ...MOMENT_TYPES.REDIRECT,
          turn: m.index + 1,
          totalTurns,
          messages: [
            ...(prevUser ? [{ sender: 'EndUser', text: prevUser.text }] : []),
            { sender: 'Chatbot', text: m.text },
          ],
          explanation: 'Bot redirected user to another channel (email, live chat, etc.) instead of resolving',
        });
      }
    }
  });

  // 3. User Frustration — repeated question or escalation language
  for (let i = 1; i < userMsgs.length; i++) {
    const overlap = wordOverlap(userMsgs[i - 1].text, userMsgs[i].text);
    if (overlap > 0.5 && (userMsgs[i - 1].text || '').split(/\s+/).length > 2) {
      const nextBot = classified.filter(c => c.isBot && c.index > userMsgs[i].index)[0];
      moments.push({
        ...MOMENT_TYPES.USER_FRUSTRATION,
        turn: userMsgs[i].index + 1,
        totalTurns,
        messages: [
          { sender: 'EndUser', text: userMsgs[i].text },
          ...(nextBot ? [{ sender: 'Chatbot', text: nextBot.text }] : []),
        ],
        explanation: `User repeated their question (${Math.round(overlap * 100)}% word overlap with earlier message)`,
      });
    }
  }

  // Also check for explicit escalation language from user
  userMsgs.forEach(m => {
    ESCALATION_RX.lastIndex = 0;
    if (ESCALATION_RX.test(m.text || '')) {
      const alreadyFrustration = moments.some(mo => mo.type === 'user_frustration' && mo.turn === m.index + 1);
      if (!alreadyFrustration) {
        const nextBot = classified.filter(c => (c.isBot || c.isAgent) && c.index > m.index)[0];
        moments.push({
          ...MOMENT_TYPES.USER_FRUSTRATION,
          turn: m.index + 1,
          totalTurns,
          messages: [
            { sender: 'EndUser', text: m.text },
            ...(nextBot ? [{ sender: nextBot.isAgent ? 'Agent' : 'Chatbot', text: nextBot.text }] : []),
          ],
          explanation: 'User explicitly requested escalation to a human agent',
        });
      }
    }
  });

  // 4. Resolution Signal — user says thanks / resolved
  userMsgs.forEach(m => {
    RESOLUTION_RX.lastIndex = 0;
    if (RESOLUTION_RX.test(m.text || '')) {
      const prevBot = classified.filter(c => c.isBot && c.index < m.index).pop();
      moments.push({
        ...MOMENT_TYPES.RESOLUTION,
        turn: m.index + 1,
        totalTurns,
        messages: [
          ...(prevBot ? [{ sender: 'Chatbot', text: prevBot.text }] : []),
          { sender: 'EndUser', text: m.text },
        ],
        explanation: 'User expressed gratitude or indicated the issue was resolved',
      });
    }
  });

  // 5. Bot Loop — bot gives same/similar response twice
  for (let i = 1; i < botMsgs.length; i++) {
    const overlap = wordOverlap(botMsgs[i - 1].text, botMsgs[i].text);
    if (overlap > 0.7 && (botMsgs[i - 1].text || '').split(/\s+/).length > 3) {
      const prevUser = classified.filter(c => c.isUser && c.index < botMsgs[i].index).pop();
      moments.push({
        ...MOMENT_TYPES.BOT_LOOP,
        turn: botMsgs[i].index + 1,
        totalTurns,
        messages: [
          ...(prevUser ? [{ sender: 'EndUser', text: prevUser.text }] : []),
          { sender: 'Chatbot', text: botMsgs[i].text },
        ],
        explanation: `Bot repeated a near-identical response (${Math.round(overlap * 100)}% text overlap with earlier bot message)`,
      });
    }
  }

  // 6. Escalation Event — agent joins
  classified.forEach(m => {
    if (m.isAgent) {
      const prevBot = classified.filter(c => c.isBot && c.index < m.index).pop();
      const isFirstAgent = !classified.some(c => c.isAgent && c.index < m.index);
      if (isFirstAgent) {
        moments.push({
          ...MOMENT_TYPES.ESCALATION,
          turn: m.index + 1,
          totalTurns,
          messages: [
            ...(prevBot ? [{ sender: 'Chatbot', text: prevBot.text }] : []),
            { sender: 'Agent', text: m.text },
          ],
          explanation: 'Human agent joined the conversation — escalation from bot',
        });
      }
    }
  });

  // 7. Intent Miss — user asks specific, bot responds generic
  botMsgs.forEach(m => {
    GENERIC_RX.lastIndex = 0;
    ACTION_RX.lastIndex = 0;
    const isGeneric = GENERIC_RX.test(m.text || '');
    ACTION_RX.lastIndex = 0;
    const hasAction = ACTION_RX.test(m.text || '');
    if (isGeneric && !hasAction) {
      const prevUser = classified.filter(c => c.isUser && c.index < m.index).pop();
      if (prevUser && (prevUser.text || '').split(/\s+/).length > 3) {
        const alreadyCovered = moments.some(mo =>
          (mo.type === 'failure_point' || mo.type === 'redirect') && mo.turn === m.index + 1
        );
        if (!alreadyCovered) {
          moments.push({
            ...MOMENT_TYPES.INTENT_MISS,
            turn: m.index + 1,
            totalTurns,
            messages: [
              { sender: 'EndUser', text: prevUser.text },
              { sender: 'Chatbot', text: m.text },
            ],
            explanation: 'Bot gave a generic response without specific actionable content',
          });
        }
      }
    }
  });

  // 8. Positive Interaction — bot provides article link or step-by-step
  botMsgs.forEach(m => {
    KB_RX.lastIndex = 0;
    ACTION_RX.lastIndex = 0;
    const hasKb = KB_RX.test(m.text || '');
    ACTION_RX.lastIndex = 0;
    const hasAction = ACTION_RX.test(m.text || '');
    FAILURE_RX.lastIndex = 0;
    const hasFail = FAILURE_RX.test(m.text || '');
    if ((hasKb || hasAction) && !hasFail) {
      const prevUser = classified.filter(c => c.isUser && c.index < m.index).pop();
      moments.push({
        ...MOMENT_TYPES.POSITIVE,
        turn: m.index + 1,
        totalTurns,
        messages: [
          ...(prevUser ? [{ sender: 'EndUser', text: prevUser.text }] : []),
          { sender: 'Chatbot', text: m.text },
        ],
        explanation: 'Bot provided specific actionable information (article, steps, or link)',
      });
    }
  });

  // Deduplicate: keep only one moment per turn, preferring higher severity (lower number)
  const byTurn = {};
  moments.forEach(m => {
    if (!byTurn[m.turn] || m.severity < byTurn[m.turn].severity) {
      byTurn[m.turn] = m;
    }
  });

  // Sort by severity (most severe first), limit to 5
  const sorted = Object.values(byTurn).sort((a, b) => a.severity - b.severity);
  return sorted.slice(0, 5);
}

/**
 * Main scoring engine
 * @param {Array} messages - Array of { sender, text, timestamp, senderName }
 * @param {Object} sessionMeta - Session metadata from SF
 * @returns {Object} Analysis results
 */
function analyzeTranscript(messages, sessionMeta = {}) {
  if (!messages || messages.length === 0) {
    return {
      scores: { resolution: { score: 0, evidence: 'No messages to analyze' }, effort: { score: 0, evidence: '' }, accuracy: { score: 0, evidence: '' }, compliance: { score: 0, evidence: '' }, escalation: null, overall: { score: 0 } },
      keyMoments: [],
      summary: { totalTurns: 0, userTurns: 0, botTurns: 0, agentTurns: 0, duration: 'N/A', outcome: 'empty', agentType: 'Unknown' },
    };
  }

  const classified = classifyMessages(messages);
  const userMsgs = classified.filter(m => m.isUser);
  const botMsgs = classified.filter(m => m.isBot);
  const agentMsgs = classified.filter(m => m.isAgent);
  const totalTurns = messages.length;
  const hasAgent = agentMsgs.length > 0;
  const wasEscalated = hasAgent || sessionMeta.agentType === 'BotToAgent' || sessionMeta.agentType === 'Agent';

  // ── Detect key moments ──
  const keyMoments = detectKeyMoments(classified, totalTurns);

  // ── Compute duration ──
  function formatDuration(ms) {
    if (ms < 0) return 'N/A';
    const totalMins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (totalMins < 60) return `${totalMins}m ${secs}s`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  let duration = 'N/A';
  let activeDuration = null; // time from first to last message (actual chat time)
  let sessionWindow = null;  // SF session start→end (includes idle time)

  // Session window from SF metadata
  if (sessionMeta.startTime && sessionMeta.endTime) {
    const ms = new Date(sessionMeta.endTime) - new Date(sessionMeta.startTime);
    sessionWindow = formatDuration(ms);
  }

  // Active duration from message timestamps (first → last message)
  if (messages.length >= 2 && messages[0].timestamp && messages[messages.length - 1].timestamp) {
    const ms = new Date(messages[messages.length - 1].timestamp) - new Date(messages[0].timestamp);
    activeDuration = formatDuration(ms);
  }

  // Use active duration as primary (more meaningful), fall back to session window
  duration = activeDuration || sessionWindow || 'N/A';

  // ── Determine outcome ──
  const lastBotText = botMsgs.length > 0 ? (botMsgs[botMsgs.length - 1].text || '') : '';
  const lastUserText = userMsgs.length > 0 ? (userMsgs[userMsgs.length - 1].text || '') : '';
  RESOLUTION_RX.lastIndex = 0;
  const userResolved = RESOLUTION_RX.test(lastUserText);
  FAILURE_RX.lastIndex = 0;
  const botFailed = FAILURE_RX.test(lastBotText);
  REDIRECT_RX.lastIndex = 0;
  const botRedirected = REDIRECT_RX.test(lastBotText);

  let outcome = 'unknown';
  if (wasEscalated) outcome = 'escalated';
  else if (userResolved && !botFailed) outcome = 'resolved';
  else if (botFailed || botRedirected) outcome = 'unresolved';
  else if (userMsgs.length <= 1 && botMsgs.length <= 2) outcome = 'abandoned';
  else outcome = 'contained';

  // ── Determine agent type label ──
  let agentType = sessionMeta.agentType || 'Unknown';
  if (agentType === 'Unknown') {
    if (hasAgent && botMsgs.length > 0) agentType = 'Bot → Agent';
    else if (hasAgent) agentType = 'Agent only';
    else agentType = 'Bot only';
  } else if (agentType === 'BotToAgent') {
    agentType = 'Bot → Agent';
  }

  // ═══════════════════════════════════════
  // SCORING — 5 dimensions
  // ═══════════════════════════════════════

  // ── Resolution (weight: 30%) ──
  let resolutionScore = 5;
  let resolutionEvidence = [];

  // Check for redirect without case creation
  let redirectCount = 0;
  botMsgs.forEach(m => {
    REDIRECT_RX.lastIndex = 0;
    if (REDIRECT_RX.test(m.text || '')) redirectCount++;
  });
  if (redirectCount > 0) {
    resolutionScore -= 3;
    resolutionEvidence.push(`Bot sent ${redirectCount} redirect(s) without resolving`);
  }

  // Check if conversation ends with failure
  FAILURE_RX.lastIndex = 0;
  if (botMsgs.length > 0 && FAILURE_RX.test(lastBotText)) {
    resolutionScore -= 2;
    resolutionEvidence.push('Last bot message contained failure/apology phrase');
  }

  // Check for user gratitude/resolution
  let userGratitude = 0;
  userMsgs.forEach(m => {
    RESOLUTION_RX.lastIndex = 0;
    if (RESOLUTION_RX.test(m.text || '')) userGratitude++;
  });
  if (userGratitude > 0) {
    resolutionScore += 3;
    resolutionEvidence.push(`User expressed gratitude/resolution ${userGratitude} time(s)`);
  }

  // Check for specific articles or actionable steps
  let kbCount = 0;
  botMsgs.forEach(m => {
    KB_RX.lastIndex = 0;
    ACTION_RX.lastIndex = 0;
    if (KB_RX.test(m.text || '') || ACTION_RX.test(m.text || '')) kbCount++;
  });
  if (kbCount > 0) {
    resolutionScore += 2;
    resolutionEvidence.push(`Bot provided ${kbCount} actionable response(s)`);
  }

  // Penalty for re-asks
  let reaskCount = 0;
  for (let i = 1; i < userMsgs.length; i++) {
    if (wordOverlap(userMsgs[i - 1].text, userMsgs[i].text) > 0.5) reaskCount++;
  }
  if (reaskCount > 0) {
    resolutionScore -= reaskCount;
    resolutionEvidence.push(`User re-asked ${reaskCount} time(s)`);
  }

  resolutionScore = Math.max(1, Math.min(10, resolutionScore));

  // ── Effort (weight: 25%) ──
  let effortScore = 8;
  let effortEvidence = [];

  // Penalty for many user messages
  if (userMsgs.length > 3) {
    effortScore -= (userMsgs.length - 3);
    effortEvidence.push(`User sent ${userMsgs.length} messages (${userMsgs.length - 3} beyond ideal)`);
  }

  // Penalty for re-asks
  if (reaskCount > 0) {
    effortScore -= (reaskCount * 2);
    effortEvidence.push(`User had to repeat question ${reaskCount} time(s)`);
  }

  // Penalty for bot loops
  let botLoopCount = 0;
  for (let i = 1; i < botMsgs.length; i++) {
    if (wordOverlap(botMsgs[i - 1].text, botMsgs[i].text) > 0.7) botLoopCount++;
  }
  if (botLoopCount > 0) {
    effortScore -= botLoopCount;
    effortEvidence.push(`Bot looped ${botLoopCount} time(s)`);
  }

  // Bonus for quick resolution
  if (totalTurns <= 3 && outcome === 'resolved') {
    effortScore += 1;
    effortEvidence.push('Resolved in 3 or fewer turns');
  }

  // Penalty for late escalation
  if (wasEscalated) {
    const botTurnsBeforeAgent = classified.filter(m => m.isBot && m.index < (agentMsgs[0]?.index || 999)).length;
    if (botTurnsBeforeAgent > 6) {
      effortScore -= 2;
      effortEvidence.push(`Escalated after ${botTurnsBeforeAgent} bot turns (too many)`);
    }
  }

  effortScore = Math.max(1, Math.min(10, effortScore));

  // ── Bot Accuracy (weight: 20%) ──
  let accuracyScore = 5;
  let accuracyEvidence = [];

  // Bonus for specific info
  if (kbCount > 0) {
    accuracyScore += 2;
    accuracyEvidence.push('Bot provided relevant, specific information');
  }

  // Penalty for duplicates
  if (botLoopCount > 0) {
    accuracyScore -= (botLoopCount * 2);
    accuracyEvidence.push(`${botLoopCount} near-duplicate bot response(s)`);
  }

  // Penalty for generic responses
  let genericCount = 0;
  botMsgs.forEach(m => {
    GENERIC_RX.lastIndex = 0;
    ACTION_RX.lastIndex = 0;
    if (GENERIC_RX.test(m.text || '')) {
      ACTION_RX.lastIndex = 0;
      if (!ACTION_RX.test(m.text || '')) genericCount++;
    }
  });
  if (genericCount > 0) {
    accuracyScore -= genericCount;
    accuracyEvidence.push(`${genericCount} generic response(s) without actionable content`);
  }

  // Bonus for correct topic identification (bot mentions keywords from user's first message)
  if (userMsgs.length > 0 && botMsgs.length > 0) {
    const userWords = new Set((userMsgs[0].text || '').toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const firstBotWords = (botMsgs[0].text || '').toLowerCase();
    const topicMatch = [...userWords].filter(w => firstBotWords.includes(w)).length;
    if (topicMatch >= 2) {
      accuracyScore += 2;
      accuracyEvidence.push('Bot correctly identified user topic');
    }
  }

  // Penalty for completely unrelated response
  if (userMsgs.length > 0 && botMsgs.length > 0) {
    const firstUserTopicOverlap = wordOverlap(userMsgs[0].text, botMsgs[0].text);
    if (firstUserTopicOverlap < 0.05 && (userMsgs[0].text || '').split(/\s+/).length > 4) {
      accuracyScore -= 3;
      accuracyEvidence.push('Bot response appears unrelated to user query');
    }
  }

  accuracyScore = Math.max(1, Math.min(10, accuracyScore));

  // ── Compliance (weight: 15%) ──
  let complianceScore = 7;
  let complianceEvidence = [];

  // Check greeting
  if (botMsgs.length > 0) {
    GREETING_RX.lastIndex = 0;
    if (GREETING_RX.test(botMsgs[0].text || '')) {
      complianceScore += 1;
      complianceEvidence.push('Proper greeting in first bot message');
    }
  }

  // Check disclaimer
  const allBotText = botMsgs.map(m => m.text || '').join(' ');
  DISCLAIMER_RX.lastIndex = 0;
  if (DISCLAIMER_RX.test(allBotText)) {
    complianceScore += 1;
    complianceEvidence.push('AI assistant disclaimer shown');
  }

  // Penalty for broken promises
  let promiseCount = 0;
  botMsgs.forEach(m => {
    PROMISE_RX.lastIndex = 0;
    if (PROMISE_RX.test(m.text || '')) promiseCount++;
  });
  if (promiseCount > 0 && (botFailed || botRedirected)) {
    complianceScore -= 2;
    complianceEvidence.push(`Bot promised resolution ${promiseCount} time(s) then failed/redirected`);
  }

  // Bonus for offering alternative
  if (redirectCount > 0 && !botFailed) {
    complianceScore += 1;
    complianceEvidence.push('Bot offered alternative channel when unable to help');
  }

  complianceScore = Math.max(1, Math.min(10, complianceScore));

  // ── Escalation Quality (weight: 10%) — only if escalated ──
  let escalationScore = null;
  let escalationEvidence = [];

  if (wasEscalated && agentMsgs.length > 0) {
    escalationScore = 5;

    // Penalty for too many bot turns before escalation
    const botTurnsBeforeAgent = classified.filter(m => m.isBot && m.index < agentMsgs[0].index).length;
    if (botTurnsBeforeAgent > 4) {
      escalationScore -= (botTurnsBeforeAgent - 4);
      escalationEvidence.push(`${botTurnsBeforeAgent} bot turns before escalation (${botTurnsBeforeAgent - 4} too many)`);
    }

    // Bonus for context passing (bot summarizes before handoff)
    const lastBotBeforeAgent = classified.filter(m => m.isBot && m.index < agentMsgs[0].index).pop();
    if (lastBotBeforeAgent) {
      const summaryWords = (lastBotBeforeAgent.text || '').toLowerCase();
      if (summaryWords.includes('mengenai') || summaryWords.includes('regarding') ||
          summaryWords.includes('tentang') || summaryWords.includes('about') ||
          summaryWords.includes('issue') || summaryWords.includes('masalah')) {
        escalationScore += 2;
        escalationEvidence.push('Bot summarized issue context before handoff');
      }
    }

    // Penalty if agent re-asks the issue
    if (agentMsgs.length > 0) {
      const firstAgentText = (agentMsgs[0].text || '').toLowerCase();
      if (firstAgentText.includes('apa masalah') || firstAgentText.includes('what issue') ||
          firstAgentText.includes('ada yang bisa') || firstAgentText.includes('how can i help') ||
          firstAgentText.includes('bisa saya bantu')) {
        escalationScore -= 2;
        escalationEvidence.push('Agent had to re-ask what the issue is (no context passed)');
      }
    }

    // Bonus if user asked for agent (appropriate trigger)
    const userAskedForAgent = userMsgs.some(m => {
      ESCALATION_RX.lastIndex = 0;
      return ESCALATION_RX.test(m.text || '');
    });
    if (userAskedForAgent) {
      escalationScore += 1;
      escalationEvidence.push('Escalation triggered by user request (appropriate)');
    }

    escalationScore = Math.max(1, Math.min(10, escalationScore));
  }

  // ── Overall weighted average ──
  const weights = { resolution: 0.30, effort: 0.25, accuracy: 0.20, compliance: 0.15, escalation: 0.10 };
  let overall;
  if (escalationScore !== null) {
    overall = (resolutionScore * weights.resolution) + (effortScore * weights.effort) +
              (accuracyScore * weights.accuracy) + (complianceScore * weights.compliance) +
              (escalationScore * weights.escalation);
  } else {
    // Redistribute escalation weight proportionally
    const totalWeight = weights.resolution + weights.effort + weights.accuracy + weights.compliance;
    overall = ((resolutionScore * weights.resolution) + (effortScore * weights.effort) +
               (accuracyScore * weights.accuracy) + (complianceScore * weights.compliance)) / totalWeight;
  }
  overall = Math.round(overall * 10) / 10;

  return {
    scores: {
      resolution: { score: resolutionScore, maxScore: 10, weight: '30%', evidence: resolutionEvidence.join('; ') || 'No issues detected' },
      effort: { score: effortScore, maxScore: 10, weight: '25%', evidence: effortEvidence.join('; ') || 'Minimal user effort required' },
      accuracy: { score: accuracyScore, maxScore: 10, weight: '20%', evidence: accuracyEvidence.join('; ') || 'Responses were relevant' },
      compliance: { score: complianceScore, maxScore: 10, weight: '15%', evidence: complianceEvidence.join('; ') || 'Standard compliance met' },
      escalation: escalationScore !== null ? { score: escalationScore, maxScore: 10, weight: '10%', evidence: escalationEvidence.join('; ') || 'Standard escalation' } : null,
      overall: { score: overall, maxScore: 10 },
    },
    keyMoments: keyMoments.map(km => ({
      type: km.type,
      label: km.label,
      sublabel: km.sublabel,
      icon: km.icon,
      color: km.color,
      severity: km.severity <= 2 ? 'high' : km.severity <= 5 ? 'medium' : 'low',
      turn: km.turn,
      totalTurns: km.totalTurns,
      messages: km.messages,
      explanation: km.explanation,
    })),
    summary: {
      totalTurns,
      userTurns: userMsgs.length,
      botTurns: botMsgs.length,
      agentTurns: agentMsgs.length,
      duration,
      activeDuration: activeDuration || duration,
      sessionWindow: sessionWindow || null,
      outcome,
      agentType,
    },
  };
}

module.exports = { analyzeTranscript };
