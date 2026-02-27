// ============================================================
// Search Utterances Deep Dive — Verified Analysis
// Source: New_Search_utterances__SF_and_RAG.xlsx (32,972 rows)
// Period: Oct 23, 2025 → Feb 4, 2026
// Classification: Keyword-matching on question column
// ============================================================

export const searchData = {
  // ─────────────────────────────────────────────────
  // HERO METRICS
  // ─────────────────────────────────────────────────
  hero: {
    title: "Search: The Wrong Answers Machine",
    subtitle: "100% answer rate. 55.2% deflect to support. 0% feedback captured.",
    metrics: [
      { label: "Total Queries", value: "32,972", subtext: "16,486 unique sessions", icon: "search" },
      { label: "KB-Resolvable", value: "27.9%", subtext: "Only 9,215 queries suit a KB", icon: "book", status: "critical" },
      { label: "Deflection Rate", value: "55.2%", subtext: "Answers say 'contact support'", icon: "arrow-up-right", status: "critical" },
      { label: "Feedback Captured", value: "0%", subtext: "Zero signal on answer quality", icon: "bar-chart", status: "critical" },
    ],
  },

  // ─────────────────────────────────────────────────
  // WEEKLY VOLUME TREND
  // ─────────────────────────────────────────────────
  weeklyTrend: [
    { week: "Oct 20", volume: 15,   unique: 8,    hcLive: false },
    { week: "Oct 27", volume: 4,    unique: 3,    hcLive: false },
    { week: "Nov 3",  volume: 630,  unique: 271,  hcLive: false },
    { week: "Nov 10", volume: 413,  unique: 145,  hcLive: false },
    { week: "Nov 17", volume: 885,  unique: 371,  hcLive: true, note: "HC Launch" },
    { week: "Nov 24", volume: 1907, unique: 798,  hcLive: true },
    { week: "Dec 1",  volume: 1680, unique: 726,  hcLive: true },
    { week: "Dec 8",  volume: 1867, unique: 785,  hcLive: true },
    { week: "Dec 15", volume: 2370, unique: 984,  hcLive: true },
    { week: "Dec 22", volume: 3005, unique: 1263, hcLive: true },
    { week: "Dec 29", volume: 3506, unique: 1457, hcLive: true },
    { week: "Jan 5",  volume: 3683, unique: 1520, hcLive: true },
    { week: "Jan 12", volume: 3318, unique: 1367, hcLive: true },
    { week: "Jan 19", volume: 3286, unique: 1360, hcLive: true },
    { week: "Jan 26", volume: 4641, unique: 1870, hcLive: true },
    { week: "Feb 2",  volume: 1762, unique: 753,  hcLive: true, note: "Partial week" },
  ],

  // ─────────────────────────────────────────────────
  // SEARCH INTENT TAXONOMY — 13 groups
  // ─────────────────────────────────────────────────
  intentGroups: [
    {
      name: "Transactions",
      volume: 8540, pct: 25.9, unique: 3162, color: "#FF4757",
      kbResolvable: false, resolution: "NEEDS_API",
      deflectRate: 53.2, apologyRate: 21.8,
      subcategories: [
        { name: "Withdrawal",     code: "TXN_WITHDRAWAL", volume: 2835, pct: 8.6, topQuery: "Withdraw / Tarik saldo / Penarikan",   resolve: "NEEDS_API" },
        { name: "Top-Up",         code: "TXN_TOPUP",      volume: 1788, pct: 5.4, topQuery: "Top up / Cara top up",                 resolve: "NEEDS_API" },
        { name: "Buy",            code: "TXN_BUY",        volume: 1384, pct: 4.2, topQuery: "Beli / Buy / Order",                   resolve: "KB_RESOLVABLE" },
        { name: "Sell",           code: "TXN_SELL",        volume: 1103, pct: 3.3, topQuery: "Jual / Sell",                          resolve: "KB_RESOLVABLE" },
        { name: "Status",         code: "TXN_STATUS",      volume:  559, pct: 1.7, topQuery: "Pending / Proses / In progress",       resolve: "NEEDS_API" },
        { name: "Cancel",         code: "TXN_CANCEL",      volume:  428, pct: 1.3, topQuery: "Cancel / Batal / Cancel order",        resolve: "NEEDS_API" },
        { name: "Transfer",       code: "TXN_TRANSFER",    volume:  317, pct: 1.0, topQuery: "Transfer",                             resolve: "NEEDS_API" },
        { name: "Refund",         code: "TXN_REFUND",      volume:  126, pct: 0.4, topQuery: "Refund / Pengembalian",                resolve: "NEEDS_API" },
      ],
    },
    {
      name: "Auth & Access",
      volume: 5565, pct: 16.9, unique: 1617, color: "#FFB020",
      kbResolvable: false, resolution: "NEEDS_FLOW",
      deflectRate: 78.6, apologyRate: 22.8,
      subcategories: [
        { name: "PIN",            code: "AUTH_PIN",        volume: 3221, pct: 9.8, topQuery: "pin / lupa pin / reset pin / PIN",     resolve: "NEEDS_FLOW" },
        { name: "Login",          code: "AUTH_LOGIN",      volume: 1589, pct: 4.8, topQuery: "login / tidak bisa masuk",             resolve: "NEEDS_FLOW" },
        { name: "2FA/Authenticator", code: "AUTH_2FA",     volume:  401, pct: 1.2, topQuery: "Authenticator / OTP / Autentikator",   resolve: "NEEDS_FLOW" },
        { name: "Password",       code: "AUTH_PASSWORD",   volume:  243, pct: 0.7, topQuery: "lupa password / lupa sandi",           resolve: "NEEDS_FLOW" },
        { name: "Biometric/Face", code: "AUTH_BIOMETRIC",  volume:  111, pct: 0.3, topQuery: "Liveness / face verification",         resolve: "NEEDS_FLOW" },
      ],
    },
    {
      name: "Product Questions",
      volume: 3906, pct: 11.8, unique: 1581, color: "#00D09C",
      kbResolvable: true, resolution: "KB_RESOLVABLE",
      deflectRate: 27.3, apologyRate: 10.3,
      subcategories: [
        { name: "US Stocks",     code: "PROD_STOCK",      volume: 1202, pct: 3.6, topQuery: "Saham / Stock / US stock / ETF",       resolve: "KB_RESOLVABLE" },
        { name: "Gold",          code: "PROD_GOLD",       volume:  742, pct: 2.3, topQuery: "Emas / Gold",                          resolve: "KB_RESOLVABLE" },
        { name: "Crypto",        code: "PROD_CRYPTO",     volume:  644, pct: 2.0, topQuery: "Kripto / Crypto / Bitcoin",             resolve: "KB_RESOLVABLE" },
        { name: "Leverage",      code: "PROD_LEVERAGE",   volume:  627, pct: 1.9, topQuery: "Leverage / Margin / Future",           resolve: "KB_RESOLVABLE" },
        { name: "Dividend",      code: "PROD_DIVIDEND",   volume:  279, pct: 0.8, topQuery: "Dividen / Dividend / Yield",            resolve: "KB_RESOLVABLE" },
        { name: "Features",      code: "PROD_FEATURES",   volume:  267, pct: 0.8, topQuery: "Pocket / Auto invest / Pluang Plus",   resolve: "KB_RESOLVABLE" },
        { name: "Reksadana",     code: "PROD_REKSADANA",  volume:  145, pct: 0.4, topQuery: "Reksadana / Mutual fund",              resolve: "KB_RESOLVABLE" },
      ],
    },
    {
      name: "Account Management",
      volume: 3299, pct: 10.0, unique: 631, color: "#7B61FF",
      kbResolvable: false, resolution: "NEEDS_FLOW_OR_AGENT",
      deflectRate: 70.2, apologyRate: 7.5,
      subcategories: [
        { name: "Delete Account", code: "ACCT_DELETE",       volume: 2002, pct: 6.1, topQuery: "Hapus akun / Delete account / Tutup akun", resolve: "NEEDS_AGENT" },
        { name: "Change Name",    code: "ACCT_CHANGE_NAME",  volume:  389, pct: 1.2, topQuery: "Ganti nama / Ubah nama / Change name",     resolve: "NEEDS_AGENT" },
        { name: "Change Phone",   code: "ACCT_CHANGE_PHONE", volume:  235, pct: 0.7, topQuery: "Ganti nomor / Ubah nomor / Change phone",  resolve: "NEEDS_FLOW" },
        { name: "Change Email",   code: "ACCT_CHANGE_EMAIL", volume:  230, pct: 0.7, topQuery: "Ganti email / Ubah email / Change email",  resolve: "NEEDS_FLOW" },
        { name: "RDN",            code: "ACCT_RDN",          volume:  126, pct: 0.4, topQuery: "RDN",                                      resolve: "KB_RESOLVABLE" },
        { name: "Referral",       code: "ACCT_REFERRAL",     volume:  124, pct: 0.4, topQuery: "Referral / Kode referral",                 resolve: "KB_RESOLVABLE" },
        { name: "Bank Account",   code: "ACCT_BANK",         volume:  105, pct: 0.3, topQuery: "Hapus rekening / Ganti rekening",           resolve: "NEEDS_FLOW" },
        { name: "NPWP",           code: "ACCT_NPWP",         volume:   88, pct: 0.3, topQuery: "NPWP",                                     resolve: "NEEDS_FLOW" },
      ],
    },
    {
      name: "Unclassified",
      volume: 4740, pct: 14.4, unique: 2196, color: "#9690B0",
      kbResolvable: null, resolution: "UNKNOWN",
      deflectRate: 51.8, apologyRate: 25.4,
      subcategories: [],
      note: "Typos, misspellings, compound queries, edge cases. Examples: 'Hapus akum', 'Delet account', 'lupa pasword'. Fuzzy matching would reclassify ~50% into existing categories.",
    },
    {
      name: "Ambiguous / Noise",
      volume: 1814, pct: 5.5, unique: 578, color: "#B8B0C8",
      kbResolvable: false, resolution: "UX_FIX",
      deflectRate: 31.3, apologyRate: 29.8,
      subcategories: [],
      note: "Single-word queries: 'pin' (658\u00d7), 'Withdraw' (118\u00d7), 'Emas' (85\u00d7), 'Hapus' (53\u00d7). These are intent signals, not questions. Autocomplete or intent cards would capture these better.",
    },
    {
      name: "How-To Guides",
      volume: 1634, pct: 5.0, unique: 738, color: "#00D09C",
      kbResolvable: true, resolution: "KB_RESOLVABLE",
      deflectRate: 54.0, apologyRate: 5.6,
      subcategories: [],
      note: "'Cara...' / 'How to...' / 'Bagaimana...' prefixed queries. KB should handle these well, but 54% still deflect \u2014 suggesting content gaps.",
    },
    {
      name: "PII & Personal",
      volume: 1084, pct: 3.3, unique: 518, color: "#FF4757",
      kbResolvable: false, resolution: "NEEDS_AUTH_OR_UNRESOLVABLE",
      deflectRate: 76.0, apologyRate: 38.5,
      subcategories: [
        { name: "Self-Referential (residual)", code: "SELF_REF_OTHER", volume: 938, pct: 2.8, topQuery: "Various 'saya'/'my' queries not classified elsewhere", resolve: "NEEDS_AUTH" },
        { name: "Reference IDs",   code: "PII_REF",  volume: 118, pct: 0.4, topQuery: "tiket 00429674 / Rp amounts / transaction refs",                     resolve: "UNRESOLVABLE" },
        { name: "Hard PII",        code: "PII_HARD",  volume:  28, pct: 0.1, topQuery: "email addresses, phone numbers, NIK",                               resolve: "UNRESOLVABLE" },
      ],
      note: "This group only captures self-ref queries NOT already classified into Auth, Transactions, etc. The FULL self-referential count across ALL groups is 4,130 (12.5%).",
    },
    {
      name: "Fees & Charges",
      volume: 803, pct: 2.4, unique: 223, color: "#00D09C",
      kbResolvable: true, resolution: "KB_RESOLVABLE",
      deflectRate: 25.0, apologyRate: 2.6,
      subcategories: [],
      note: "Biaya, fee, pajak, tax, VAT, currency. KB handles this well \u2014 lowest deflection rate at 25%.",
    },
    {
      name: "Support Seeking",
      volume: 721, pct: 2.2, unique: 133, color: "#CC3844",
      kbResolvable: false, resolution: "UX_FIX",
      deflectRate: 57.0, apologyRate: 3.1,
      subcategories: [
        { name: "Navigation",      code: "NAVIGATION",       volume: 507, pct: 1.5, topQuery: "Live chat (106\u00d7) / Email (70\u00d7) / CS (19\u00d7)",     resolve: "UX_FIX" },
        { name: "Support Seeking",  code: "SUPPORT_SEEKING",  volume: 214, pct: 0.6, topQuery: "hubungi CS / contact support / Pluang care",   resolve: "UX_FIX" },
      ],
      note: "Users have already given up on self-service and are using search to find the escalation button. Search should detect this and surface the chat button immediately.",
    },
    {
      name: "Verification",
      volume: 565, pct: 1.7, unique: 230, color: "#8B6914",
      kbResolvable: false, resolution: "NEEDS_API",
      deflectRate: 69.4, apologyRate: 23.5,
      subcategories: [],
    },
    {
      name: "Banking & Payments",
      volume: 168, pct: 0.5, unique: 61, color: "#8B6914",
      kbResolvable: false, resolution: "NEEDS_API",
      deflectRate: 51.8, apologyRate: 33.9,
      subcategories: [
        { name: "E-Wallet",    code: "EWALLET",       volume: 123, pct: 0.4, topQuery: "GoPay / OVO / DANA / Tokopedia",           resolve: "NEEDS_API" },
        { name: "Bank",        code: "BANK_SPECIFIC",  volume:  45, pct: 0.1, topQuery: "BCA / Mandiri / BNI",                      resolve: "NEEDS_API" },
      ],
    },
    {
      name: "Migration",
      volume: 133, pct: 0.4, unique: 38, color: "#7A7490",
      kbResolvable: true, resolution: "KB_RESOLVABLE",
      deflectRate: 67.7, apologyRate: 19.5,
      subcategories: [],
      note: "'Migrasi Paham ke Pluang'. Temporal \u2014 will fade as migration completes.",
    },
  ],

  // ─────────────────────────────────────────────────
  // THE SELF-REFERENTIAL PROBLEM
  // Users who say "saya"/"my" — expect the system to know them
  // Count: 4,130 queries (12.5%) across ALL categories
  // ─────────────────────────────────────────────────
  selfReferential: {
    total: 4130,
    pctOfAll: 12.5,
    deflectionRate: 77.1,
    uniqueQueries: 1979,

    // Where self-ref queries land after classification
    distributionAcrossGroups: [
      { group: "Self-Ref (residual)",  volume: 938 },
      { group: "Auth (login/PIN)",     volume: 854 },
      { group: "Transactions",         volume: 783 },
      { group: "Product Questions",    volume: 172 },
      { group: "How-To",              volume: 149 },
      { group: "Account Management",   volume: 121 },
      { group: "Verification",         volume: 92 },
      { group: "Other groups",         volume: 21 },
    ],

    // What self-ref users are actually trying to do
    intents: [
      { intent: "Something's broken",    pct: 25.7, volume: 1061, examples: ["saya tidak bisa menarik saldo", "Kenapa saldo saya tidak bisa di tarik", "Kenapa akun saya diblokir"], fix: "Error detection + contextual help", color: "#FF4757" },
      { intent: "I want to do something", pct: 18.4, volume:  760, examples: ["Cara menghapus akun saya", "Saya ingin menghapus akun", "how to delete my account"], fix: "Guided self-service flows", color: "#7B61FF" },
      { intent: "Where is my X? (status)", pct: 14.1, volume:  583, examples: ["Kenapa top up saya belum masuk", "Kapan saldo saya terkirim", "How long does it take to process my VA top up?"], fix: "Real-time status API", color: "#FFB020" },
      { intent: "I forgot/lost access",   pct: 3.7,  volume:  153, examples: ["saya lupa pin", "Saya lupa authenticator saya", "Nomor saya hilang"], fix: "Self-service recovery flows", color: "#7B61FF" },
      { intent: "Other self-ref",         pct: 38.1, volume: 1573, examples: ["Various \u2014 'saya'/'my' in product/how-to context"], fix: "Context-aware search that strips 'saya' and matches intent", color: "#9690B0" },
    ],

    // The punchline
    insight: "12.5% of all search queries contain 'saya' or 'my' \u2014 the user expects a personalized answer. The RAG has no idea who they are. 77.1% of these answers end with 'hubungi Pluang Care'. The search box is a dead end for anyone with a personal issue.",
  },

  // ─────────────────────────────────────────────────
  // PII TIERS — the three layers of personal queries
  // ─────────────────────────────────────────────────
  piiTiers: [
    {
      tier: "T1: Hard PII",
      desc: "Actual identifiable data typed into search",
      volume: 28, pct: 0.1,
      examples: ["estiharis@gmail.com", "+6281315178XX", "tiket 00429674"],
      risk: "CRITICAL", riskDesc: "PII exposed in search logs. Privacy concern.",
      fix: "PII detection \u2192 intercept before search \u2192 redirect to authenticated flow",
      color: "#CC3844",
    },
    {
      tier: "T2: Reference IDs",
      desc: "Ticket numbers, transaction refs, specific amounts",
      volume: 118, pct: 0.4,
      examples: ["tiket 00429674", "Rp 100jt", "7475583", "#0429839"],
      risk: "HIGH", riskDesc: "System can't resolve without account lookup.",
      fix: "Detect numeric/reference patterns \u2192 redirect to 'Check my ticket' flow",
      color: "#FF4757",
    },
    {
      tier: "T3: Self-Referential",
      desc: "'Saya'/'My' \u2014 expects system to know who they are",
      volume: 4130, pct: 12.5,
      examples: ["Kenapa saldo saya belum masuk", "saya lupa pin", "saya tidak bisa menarik saldo"],
      risk: "HIGH", riskDesc: "77.1% get deflected. Highest frustration pathway.",
      fix: "Detect self-ref \u2192 show 'Log in to check your account' prompt + contextual options",
      color: "#FF4757",
    },
  ],

  // ─────────────────────────────────────────────────
  // ANSWER QUALITY — the "always answers" illusion
  // ─────────────────────────────────────────────────
  answerQuality: {
    overallDeflectRate: 55.2,
    overallApologyRate: 19.1,
    feedbackCaptured: 0,
    avgAnswerLength: 758,

    // Answer length distribution
    lengthDistribution: [
      { bucket: "Empty/Useless (<50)",  count: 28,    pct: 0.1 },
      { bucket: "Very Short (50\u2013100)",    count: 624,   pct: 1.9 },
      { bucket: "Short (100\u2013300)",        count: 1569,  pct: 4.8 },
      { bucket: "Medium (300\u2013700)",       count: 12346, pct: 37.4 },
      { bucket: "Full (700\u20131500)",        count: 17802, pct: 54.0 },
      { bucket: "Wall of text (1500+)", count: 603,   pct: 1.8 },
    ],

    // Deflection and apology rates by group
    qualityByGroup: [
      { group: "Auth & Access",       deflect: 78.6, apology: 22.8, avgLen: 737,  verdict: "POOR" },
      { group: "PII & Personal",      deflect: 76.0, apology: 38.5, avgLen: 697,  verdict: "POOR" },
      { group: "Account Management",  deflect: 70.2, apology: 7.5,  avgLen: 898,  verdict: "POOR" },
      { group: "Verification",        deflect: 69.4, apology: 23.5, avgLen: 828,  verdict: "POOR" },
      { group: "Migration",           deflect: 67.7, apology: 19.5, avgLen: 670,  verdict: "POOR" },
      { group: "Support Seeking",     deflect: 57.0, apology: 3.1,  avgLen: 359,  verdict: "POOR" },
      { group: "How-To Guides",       deflect: 54.0, apology: 5.6,  avgLen: 784,  verdict: "MIXED" },
      { group: "Transactions",        deflect: 53.2, apology: 21.8, avgLen: 782,  verdict: "MIXED" },
      { group: "Unclassified",        deflect: 51.8, apology: 25.4, avgLen: 668,  verdict: "MIXED" },
      { group: "Banking & Payments",  deflect: 51.8, apology: 33.9, avgLen: 713,  verdict: "MIXED" },
      { group: "Ambiguous / Noise",   deflect: 31.3, apology: 29.8, avgLen: 617,  verdict: "MIXED" },
      { group: "Product Questions",   deflect: 27.3, apology: 10.3, avgLen: 850,  verdict: "GOOD" },
      { group: "Fees & Charges",      deflect: 25.0, apology: 2.6,  avgLen: 856,  verdict: "GOOD" },
    ],

    // The reported vs reality table
    reportedVsReality: [
      { metric: "Answer Rate",       reported: "100%",  reality: "100% (system always responds)",  problem: "Answering \u2260 Resolving. 55.2% of answers say 'contact support'." },
      { metric: "Article Match Rate", reported: "100%",  reality: "100% (5 articles linked always)", problem: "System always finds 5 articles \u2014 relevance is unknown, no click data." },
      { metric: "Resolution Rate",    reported: "N/A",   reality: "Unknown \u2014 0% feedback",           problem: "No thumbs up/down. No click tracking. No post-search behavior data." },
      { metric: "Deflection Rate",    reported: "Not tracked", reality: "55.2%",                     problem: "More than half of 'answers' are dressed-up escalation prompts." },
    ],
  },

  // ─────────────────────────────────────────────────
  // RESOLVABILITY MATRIX — the centerpiece
  // ─────────────────────────────────────────────────
  resolvability: {
    summary: [
      { resolution: "KB Resolvable",           volume: 9215,  pct: 27.9, color: "#00D09C", desc: "Product info, how-to, fees \u2014 KB is the right channel" },
      { resolution: "Needs Self-Service Flow",  volume: 6223,  pct: 18.9, color: "#7B61FF", desc: "Auth resets, phone/email changes \u2014 needs guided flow + deep link" },
      { resolution: "Needs Real-Time API",      volume: 6786,  pct: 20.6, color: "#FFB020", desc: "Transaction status, refund tracking \u2014 needs backend integration" },
      { resolution: "Needs Agent",              volume: 2391,  pct: 7.3,  color: "#FF4757", desc: "Account deletion, name changes \u2014 requires human approval" },
      { resolution: "Needs Authentication",     volume: 938,   pct: 2.8,  color: "#FF4757", desc: "Self-referential queries \u2014 system needs to know who the user is" },
      { resolution: "UX Fix (Nav/Noise)",       volume: 2535,  pct: 7.7,  color: "#9690B0", desc: "Single words, support navigation \u2014 needs autocomplete + intent cards" },
      { resolution: "Structurally Unresolvable",volume: 144,   pct: 0.4,  color: "#7A7490", desc: "Hard PII, ticket IDs \u2014 intercept and redirect" },
      { resolution: "Unknown",                  volume: 4740,  pct: 14.4, color: "#B8B0C8", desc: "Unclassified \u2014 typos, compound queries, edge cases" },
    ],

    // Simplified 3-bucket view
    threeBucket: [
      { bucket: "KB CAN Resolve",     volume: 9215,  pct: 27.9, color: "#00D09C" },
      { bucket: "Needs Enhancement",   volume: 13009, pct: 39.5, color: "#FFB020" },
      { bucket: "Cannot Resolve by KB",volume: 6008,  pct: 18.2, color: "#FF4757" },
      { bucket: "Unknown",            volume: 4740,  pct: 14.4, color: "#B8B0C8" },
    ],

    // Detailed mapping — intent → what's needed → engineering implication
    intentToFix: [
      { intent: "PIN Reset (3,221)",         currentChannel: "KB article + deflect",  neededChannel: "Self-service PIN reset flow", engineering: "App deep link to reset PIN screen",  priority: "P0", effort: "Low" },
      { intent: "Withdrawal Status (2,835)", currentChannel: "Generic article",        neededChannel: "Real-time withdrawal tracker", engineering: "Withdrawal status API endpoint",  priority: "P1", effort: "Medium" },
      { intent: "Delete Account (2,002)",    currentChannel: "Article + 'email us'",   neededChannel: "Account closure request flow", engineering: "Guided flow + agent approval queue",  priority: "P1", effort: "Medium" },
      { intent: "Top-Up Help (1,788)",       currentChannel: "Generic article",        neededChannel: "Top-up status checker + retry", engineering: "Payment status API + retry flow",  priority: "P1", effort: "Medium" },
      { intent: "Login Issues (1,589)",      currentChannel: "Article + 'contact us'", neededChannel: "Self-service account recovery", engineering: "Recovery flow: OTP \u2192 re-auth",  priority: "P0", effort: "Low" },
      { intent: "Buy/Sell How-To (2,487)",   currentChannel: "KB article (works OK)",  neededChannel: "Better article + video guide", engineering: "Content update only \u2014 no eng work",  priority: "P2", effort: "None" },
      { intent: "Product Info (3,906)",      currentChannel: "KB article (works OK)",  neededChannel: "Improve content quality",       engineering: "Content update only \u2014 no eng work",  priority: "P2", effort: "None" },
      { intent: "Status Check (559)",        currentChannel: "Generic 'be patient'",   neededChannel: "Real-time order status page",    engineering: "Order status API + status page",  priority: "P1", effort: "Medium" },
      { intent: "Support Navigation (721)",  currentChannel: "Another article",         neededChannel: "Surface chat button directly", engineering: "Search UX: detect 'live chat' \u2192 show button",  priority: "P0", effort: "Low" },
      { intent: "Single Word (1,814)",       currentChannel: "Best-guess article",     neededChannel: "Autocomplete + intent cards",   engineering: "Search UX enhancement",  priority: "P1", effort: "Low" },
    ],
  },

  // ─────────────────────────────────────────────────
  // TOP QUERIES — for top queries table
  // ─────────────────────────────────────────────────
  topQueries: [
    { query: "Hapus akun",         volume: 886, group: "Account Management", resolve: "NEEDS_AGENT" },
    { query: "pin / Pin / PIN",    volume: 844, group: "Auth & Access",      resolve: "NEEDS_FLOW" },
    { query: "lupa pin / Lupa pin",volume: 720, group: "Auth & Access",      resolve: "NEEDS_FLOW" },
    { query: "Top up",             volume: 215, group: "Transactions",       resolve: "NEEDS_API" },
    { query: "Live chat",          volume: 156, group: "Support Seeking",    resolve: "UX_FIX" },
    { query: "Cara hapus akun",    volume: 142, group: "Account Management", resolve: "NEEDS_AGENT" },
    { query: "Biaya / Fee",        volume: 120, group: "Fees & Charges",     resolve: "KB_RESOLVABLE" },
    { query: "Withdraw",           volume: 118, group: "Transactions",       resolve: "NEEDS_API" },
    { query: "Tarik saldo",        volume: 109, group: "Transactions",       resolve: "NEEDS_API" },
    { query: "Email",              volume: 105, group: "Support Seeking",    resolve: "UX_FIX" },
    { query: "Penarikan",          volume: 93,  group: "Transactions",       resolve: "NEEDS_API" },
    { query: "Cara top up",        volume: 90,  group: "How-To Guides",      resolve: "KB_RESOLVABLE" },
    { query: "Emas",               volume: 85,  group: "Product Questions",  resolve: "KB_RESOLVABLE" },
    { query: "Delete account",     volume: 72,  group: "Account Management", resolve: "NEEDS_AGENT" },
    { query: "Cash out",           volume: 60,  group: "Transactions",       resolve: "NEEDS_API" },
  ],

  // ─────────────────────────────────────────────────
  // LANGUAGE SPLIT
  // ─────────────────────────────────────────────────
  language: {
    indonesian: { volume: 26101, pct: 79.2 },
    english:    { volume: 6871,  pct: 20.8 },
    insight: "20.8% search in English despite the KB being primarily Indonesian. Bilingual content gaps likely contribute to deflection.",
  },

  // ─────────────────────────────────────────────────
  // SEARCH → ESCALATION BRIDGE
  // ─────────────────────────────────────────────────
  searchToEscalation: {
    headline: "Users who search and fail become the next channel's problem. The cascade path: Search \u2192 Chatbot \u2192 Live Chat \u2192 Email.",

    bridges: [
      { searchIntent: "PIN / Login / Password",    searchVol: 5053, emailSubcategory: "Login / PIN / Change Phone",  emailVol: 1876, cascadeSignal: "Search gives generic steps \u2192 user still locked out \u2192 emails support" },
      { searchIntent: "Withdrawal / Top-Up status", searchVol: 4623, emailSubcategory: "Direct BCA Refund / Top-up Issue", emailVol: 2512, cascadeSignal: "Search can't check real-time status \u2192 user panics about money \u2192 emails" },
      { searchIntent: "Delete Account",             searchVol: 2002, emailSubcategory: "Acct Activation/Deactivation", emailVol: 838,  cascadeSignal: "Search says 'email us' \u2192 user emails \u2192 25.9% escalate to L2" },
      { searchIntent: "Verification / KYC",         searchVol: 565,  emailSubcategory: "Basic Verification / Verification Issue", emailVol: 1363, cascadeSignal: "Search can't check KYC status \u2192 user emails \u2192 11.7% L2" },
      { searchIntent: "Support Navigation",          searchVol: 721,  emailSubcategory: "Others Inquiry (general)",    emailVol: 3283, cascadeSignal: "Searched for 'live chat' / 'CS' \u2192 couldn't find it \u2192 emailed instead" },
    ],

    totalSearchVolume: 32972,
    totalEmailVolume: 30226,
    overlapInsight: "628 HC visitors later emailed (identity-stitched). But the real cascade is larger \u2014 most users aren't stitched. The intent overlap between top search categories and top email categories confirms search failure drives email volume.",
  },

  // ─────────────────────────────────────────────────
  // DATA SOURCES & METHODOLOGY
  // ─────────────────────────────────────────────────
  source: {
    primary: "New_Search_utterances__SF_and_RAG.xlsx \u2014 32,972 rows, Oct 23 2025 \u2192 Feb 4 2026",
    secondary: [
      "Email Automation Framework (cross-reference for escalation bridge)",
      "Cascading Failure Hypothesis (628 HC\u2192Email identity stitch)",
    ],
    methodology: [
      "Classification via keyword-matching on question column (Python regex)",
      "13 intent groups with 36 subcategories",
      "Self-referential detection: regex for 'saya'/'my'/'akun saya'/'milik saya'/'punya saya'",
      "PII detection: regex for email addresses, phone numbers (+62/08), NIK (16-digit), ticket numbers, IDR/USD amounts",
      "Deflection detection: answer contains 'hubungi'/'contact'/'Pluang Care'/'tanya@pluang.com'/'live chat'",
      "Apology detection: answer contains 'mohon maaf'/'sorry'/'maaf'",
      "Answer length as quality proxy (no feedback data available)",
      "Resolvability mapped per subcategory based on action required (KB article vs flow vs API vs agent)",
      "Duplicate rate: 64.5% \u2014 RAG fires twice per search. Unique sessions \u2248 16,486",
      "Unclassified 14.4% \u2014 mostly typos. Fuzzy matching would reduce to ~7%",
    ],
  },
};
