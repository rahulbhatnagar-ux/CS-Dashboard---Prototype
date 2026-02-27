// TODO: Replace all mock data with BigQuery queries once credentials are configured
// BQ Project: bem---beli-emas-murni

const csatData = {
  overall: 3.9,
  humanAssisted: 4.1,
  botOnly: 3.2,
  dsatRate: 18.4,
  trend: [
    { week: 'W1 Jan', all: 3.8, human: 4.0 },
    { week: 'W2 Jan', all: 3.8, human: 4.0 },
    { week: 'W3 Jan', all: 3.9, human: 4.1 },
    { week: 'W4 Jan', all: 3.9, human: 4.3 },
    { week: 'W1 Feb', all: 3.9, human: 4.1 },
    { week: 'W2 Feb', all: 4.0, human: 4.2 },
    { week: 'W3 Feb', all: 3.9, human: 4.3 },
  ],
  byChannel: [
    { channel: 'Live Chat', score: 4.3 },
    { channel: 'In-App', score: 4.1 },
    { channel: 'Phone', score: 3.8 },
    { channel: 'Email', score: 3.6 },
    { channel: 'Bot', score: 3.2 },
  ],
};

const coRatings = {
  csat: { all: 3.9, human: 4.3 },
  appRatings: { google: 4.7, apple: 4.6 },
  playStoreCategories: [
    { name: 'Withdrawal/Deposit', total: 8, s5: 1, s4: 1, s3: 0, s2: 0, s1: 6 },
    { name: 'Fees/Charges', total: 3, s5: 0, s4: 0, s3: 0, s2: 0, s1: 3 },
    { name: 'App Crashes', total: 3, s5: 0, s4: 0, s3: 0, s2: 1, s1: 2 },
    { name: 'UI/UX Confusion', total: 1, s5: 0, s4: 0, s3: 0, s2: 1, s1: 0 },
    { name: 'Customer Service', total: 3, s5: 1, s4: 1, s3: 0, s2: 0, s1: 1 },
    { name: 'Feature Requests', total: 1, s5: 1, s4: 0, s3: 0, s2: 0, s1: 0 },
  ],
};

const channelShift = [
  { period: 'Pre-HC (Sep)', email: 58, inApp: 15, phone: 12, chat: 10, hc: 0, bot: 5 },
  { period: 'Month 1 (Nov)', email: 42, inApp: 14, phone: 11, chat: 9, hc: 18, bot: 6 },
  { period: 'Month 2 (Dec)', email: 28, inApp: 12, phone: 10, chat: 8, hc: 35, bot: 7 },
  { period: 'Current (Feb)', email: 9, inApp: 11, phone: 9, chat: 7, hc: 60, bot: 4 },
];

const channelMixMetrics = {
  hcShare: 60,
  emailShare: 9,
  emailPrev: 58,
  fcrRate: 72.3,
  containment: 78,
  avgChannelsPerIssue: 1.4,
};

const productFeedback = {
  googleRating: 4.7,
  appleRating: 4.6,
  negativeThemes: 7,
  topIssue: { name: 'Withdrawals', mentions: 847 },
  themes: [
    { theme: 'Withdrawal Complexity', mentions: 847, sentiment: -0.62, trend: 'up', sources: 'Chat + Email + Play Store' },
    { theme: 'Face Verification Frustration', mentions: 623, sentiment: -0.78, trend: 'up', sources: 'Chat + Tickets' },
    { theme: 'BCA Name Matching Issues', mentions: 412, sentiment: -0.71, trend: 'stable', sources: 'Tickets + Email' },
    { theme: 'Tax Reporting / Portfolio Statement', mentions: 287, sentiment: -0.45, trend: 'up', sources: 'Email + Tickets' },
    { theme: 'App Stability / Crashes', mentions: 198, sentiment: -0.83, trend: 'down', sources: 'Play Store + Chat' },
    { theme: 'Fee Transparency', mentions: 156, sentiment: -0.59, trend: 'stable', sources: 'Play Store + Chat' },
    { theme: 'PIN / OTP Issues', mentions: 134, sentiment: -0.52, trend: 'down', sources: 'Chat + Tickets' },
    { theme: 'Positive - App Experience', mentions: 89, sentiment: 0.72, trend: 'stable', sources: 'Play Store' },
  ],
};

const chatbotAnalysis = {
  totalSessions: 24471,
  containmentRate: 91.4,
  failurePhraseRate: 92.3,
  avgTurnsBeforeEscalation: 15.6,
  botToAgentRate: 8.4,
  intents: [
    { name: 'Query', value: 4035 },
    { name: 'Account Issue', value: 3734 },
    { name: 'Complaint', value: 717 },
    { name: 'Follow Up', value: 74 },
    { name: 'Greeting', value: 66 },
    { name: 'Clarification', value: 41 },
    { name: 'Feature Request', value: 36 },
  ],
  outcomes: { botOnly: 22372, botAgent: 2048, agentOnly: 51 },
};

const mockTranscript = {
  caseNumber: '00439512',
  sessionId: 'MS-2026-02-24-001',
  messages: [
    { sender: 'bot', text: 'Halo! Selamat datang di Pluang. Ada yang bisa saya bantu?', time: '14:01' },
    { sender: 'user', text: 'Saya mau withdraw tapi gagal terus', time: '14:02' },
    { sender: 'bot', text: 'Mohon maaf atas ketidaknyamanannya. Bisa ceritakan lebih detail error yang muncul?', time: '14:02' },
    { sender: 'user', text: 'Error "nama tidak sesuai" padahal sudah benar', time: '14:03' },
    { sender: 'bot', text: 'Saya mengerti. Untuk masalah verifikasi nama bank, saya perlu menghubungkan Anda dengan agen kami. Mohon tunggu sebentar.', time: '14:03' },
    { sender: 'agent', text: 'Halo, saya Aldi dari tim support. Saya akan bantu cek masalah nama bank Anda. Bisa kirimkan screenshot error?', time: '14:05' },
    { sender: 'user', text: '[Screenshot attached]', time: '14:06' },
    { sender: 'agent', text: 'Terima kasih. Saya lihat nama di BCA tidak sesuai dengan format kami. Saya akan proses manual adjustment.', time: '14:08' },
  ],
  evaluation: {
    intentAccuracy: 8,
    responseRelevance: 7,
    resolutionQuality: 6,
    escalationAppropriateness: 9,
  },
};

const mockEmailThread = {
  caseNumber: '00439307',
  emails: [
    {
      from: 'user@gmail.com', to: 'support@pluang.com',
      date: '2026-02-22 10:30', subject: 'Withdrawal Failed - BCA Name Issue',
      body: 'Hi, I tried to withdraw my balance to BCA but it keeps saying name mismatch. My bank account name is correct. Please help resolve this urgently.',
    },
    {
      from: 'support@pluang.com', to: 'user@gmail.com',
      date: '2026-02-22 14:15', subject: 'Re: Withdrawal Failed - BCA Name Issue',
      body: 'Dear Customer,\n\nThank you for reaching out. We understand the frustration with the name mismatch issue.\n\nCould you please provide:\n1. Your registered full name\n2. Bank account holder name (exactly as shown on BCA)\n3. Screenshot of the error\n\nThis will help us resolve the issue faster.\n\nBest regards,\nPluang Support Team',
    },
    {
      from: 'user@gmail.com', to: 'support@pluang.com',
      date: '2026-02-22 15:40', subject: 'Re: Re: Withdrawal Failed - BCA Name Issue',
      body: 'Here are the details:\n1. DYNA RATNASARI PLASHINTANIA\n2. DYNA RATNASARI P (BCA truncates long names)\n3. [Screenshot attached]\n\nPlease fix this ASAP, I need the funds.',
    },
  ],
  evaluation: {
    completeness: 7,
    tone: 8,
    resolutionQuality: 6,
    escalationAppropriateness: 7,
  },
};

const searchStats = {
  totalSearches: 26436,
  zeroResults: 15812,
  zeroResultRate: 59.8,
  channels: { 'Internal App': 16314, 'Public KB': 10122 },
  ragQueries: 32972,
  topSearchTerms: [
    { term: 'emas', count: 13, hasArticle: true },
    { term: 'saham as', count: 13, hasArticle: true },
    { term: 'withdraw', count: 11, hasArticle: true },
    { term: 'pin', count: 9, hasArticle: true },
    { term: 'rekening bank', count: 8, hasArticle: true },
    { term: 'npwp', count: 7, hasArticle: false },
    { term: 'coretax', count: 6, hasArticle: false },
    { term: 'portfolio statement', count: 5, hasArticle: false },
  ],
};

const hcDeflection = {
  hcVisits: { app: 46030, web: 238, uniqueUsers: 35505 },
  containmentRate: 78,
  identityMatch: 93.2,
  topArticles: [
    { title: 'Data untuk hapus rekening bank', views: 1457, score: 7.2 },
    { title: 'Dokumen ubah nomor handphone', views: 840, score: 6.8 },
    { title: 'Mengganti rekening bank', views: 593, score: 7.5 },
    { title: 'Cara Mengatur Ulang PIN', views: 514, score: 8.1 },
    { title: 'Akun terkunci - PIN salah', views: 447, score: 7.8 },
    { title: 'Waktu hapus rekening bank', views: 392, score: 6.5 },
    { title: 'Data delete bank account (EN)', views: 325, score: 7.0 },
    { title: 'Kendala tidak menerima OTP', views: 277, score: 6.9 },
    { title: 'Notifikasi hapus rekening bank', views: 241, score: 6.3 },
    { title: 'Cara Withdraw ke Bank', views: 218, score: 7.4 },
  ],
  scoreDistribution: [
    { range: '1-3', count: 8 },
    { range: '3-5', count: 22 },
    { range: '5-7', count: 68 },
    { range: '7-9', count: 74 },
  ],
  totalArticles: 1003,
  scoredArticles: 172,
  avgScore: 6.7,
};

const slaFallback = {
  byChannel: [
    { channel: 'Live Chat', sla: 96, avgFRT: 1.8, volume: 7540 },
    { channel: 'In-App', sla: 94, avgFRT: 2.1, volume: 7020 },
    { channel: 'Phone', sla: 91, avgFRT: 3.2, volume: 6021 },
    { channel: 'EmailCase', sla: 82, avgFRT: 8.4, volume: 16786 },
    { channel: 'Email', sla: 71, avgFRT: 12.6, volume: 13440 },
    { channel: 'Instagram', sla: 64, avgFRT: 18.2, volume: 922 },
    { channel: 'Play Store', sla: 58, avgFRT: 24.1, volume: 1875 },
  ],
};

// --- Section 1 Operations: Additional mock data for ExCo deck format ---

const weeklyHighlights = [
  'Regular tickets decreased ~21%, Plus tickets decreased ~26%, driven by lower incoming volume & spam optimization (misrouted Gojek calls & Gmail spam)',
  'Since 4 Feb 2026, Response Time includes queue time \u2192 Feb W1 is the new baseline',
  'Improvements in SLA Feb W2\u2013W3 driven by agent handling tweaks and lower incoming volume',
];

const slaSummary = {
  channels: [
    { channel: 'Live Chat', sla: 96, frtMedian: '2m 14s', target: 90 },
    { channel: 'In-App', sla: 94, frtMedian: '3m 45s', target: 90 },
    { channel: 'EmailCase', sla: 82, frtMedian: '4h 12m', target: 85 },
    { channel: 'Email', sla: 71, frtMedian: '8h 30m', target: 80 },
    { channel: 'Phone', sla: 88, frtMedian: '1m 30s', target: 85 },
  ],
};

const plusIssueBreakdown = [
  { issue: 'BCA Name Not Unique', w1: 10, w2: 27, w3: 26, w4: 29, trend: 'up', description: 'Top-up is not reflected because the name between the user account and the top-up bank account doesn\'t match, or an incomplete top-up request.' },
  { issue: 'Order Not Executed', w1: 9, w2: 9, w3: 26, w4: 28, trend: 'up', description: 'User asks why their order was not cancelled/still active when they already clicked the cancel button.' },
  { issue: 'Massive Issue (Resolved)', w1: 0, w2: 0, w3: 0, w4: 0, trend: 'resolved', description: 'One-time incident, now resolved.' },
  { issue: 'Ops Checking Correct Details', w1: 23, w2: 12, w3: 15, w4: 5, trend: 'down', description: 'Operational verification checks for user detail accuracy.' },
];

const topIssueDescriptions = {
  'Face Verification Failed': 'Users must re-authenticate on a new device to perform sensitive actions (send crypto, withdraw cash, change/reset PIN). Selfie match failures cause account lockouts.',
  'BCA Name Not Unique': 'Top-up is not reflected due to a name mismatch between the user account and the bank account, or an incomplete top-up request.',
  'Portfolio Statement': 'User requests a portfolio statement for tax reporting purposes (Wealth Report / Lapor Harta). Example case: 00438498.',
  'Inquiry about Tax': 'General inquiries about tax related information (e.g. ask for company name, NPWP number).',
  'New Device Manual Verification': 'Manual verification required when user switches to a new device.',
};

const playStoreImprovements = [
  { category: 'Withdrawal/Deposit', reviews: 6, description: 'Withdrawals are perceived as complicated with unclear steps and long processing times.' },
  { category: 'Fees/Charges/Hidden Costs', reviews: 3, description: 'Including spreads, buy/sell fees, and perceived hidden costs that users discover after transacting.' },
  { category: 'App Crashes / Technical Issues', reviews: 2, description: 'Frequent crashes, lag, and unresponsive screens reported especially during market hours.' },
];

const slaTrend = [
  { week: 'W1', liveChat: 87, inApp: 91, emailCase: 78, email: 65, phone: 82 },
  { week: 'W2', liveChat: 92, inApp: 93, emailCase: 80, email: 68, phone: 85 },
  { week: 'W3', liveChat: 96, inApp: 94, emailCase: 82, email: 71, phone: 88 },
  { week: 'W4', liveChat: 96, inApp: 95, emailCase: 84, email: 73, phone: 89 },
];

const actionPlans = [
  { id: 1, action: 'Eliminating Supervisor Queue', status: 'Done', date: '15 Jan', impact: null },
  { id: 2, action: 'Trial: PSL agent concurrency 2\u21925 tickets', status: 'Done', date: null, impact: '94.9% \u2192 96.2%' },
  { id: 3, action: 'Moving regular agent to PSL (1HC)', status: 'In Progress', date: 'ETA Feb 2026', impact: null },
  { id: 4, action: 'Prioritise Live chat in queue assignment', status: 'Done', date: '23 Jan', impact: '60% \u2192 87%' },
];

module.exports = {
  csatData,
  coRatings,
  channelShift,
  channelMixMetrics,
  productFeedback,
  chatbotAnalysis,
  mockTranscript,
  mockEmailThread,
  searchStats,
  hcDeflection,
  slaFallback,
  // New Section 1 mock data
  weeklyHighlights,
  slaSummary,
  plusIssueBreakdown,
  topIssueDescriptions,
  playStoreImprovements,
  slaTrend,
  actionPlans,
};
