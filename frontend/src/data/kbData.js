// ============================================================
// KB Health Deep Dive — Verified Analysis
// Source: Knowledge_Base__Data_2.xlsx (5 tabs)
// Period: Jan 2025 → Jan 2026
// ============================================================

export const kbData = {
  // ─────────────────────────────────────────────────
  // HERO METRICS
  // ─────────────────────────────────────────────────
  hero: {
    title: "The Knowledge Base: Correct but Unhelpful",
    subtitle: "1,013 articles. 88.4% have ≤10 views. Accuracy 8.2/10. Usefulness 5.7/10.",
    metrics: [
      { label: "Total Articles", value: "1,013", subtext: "Across 74 sub-categories", icon: "📖" },
      { label: "Ghost Rate", value: "88.4%", subtext: "895 articles with ≤10 views", icon: "👻", status: "critical" },
      { label: "Accuracy", value: "8.2", subtext: "Content is factually correct", icon: "✓", status: "good" },
      { label: "Usefulness", value: "5.7", subtext: "But it doesn't resolve issues", icon: "⚠️", status: "critical" },
    ],
  },

  // ─────────────────────────────────────────────────
  // TAB 1: THE GHOST LIBRARY
  // ─────────────────────────────────────────────────
  viewDistribution: {
    totalArticles: 1013,
    totalViews: 12916,

    tiers: [
      { tier: "Ghost (0–1 views)",      count: 418, pct: 41.3, color: "#1C1835",  desc: "Never read. May as well not exist." },
      { tier: "Dormant (2–10 views)",    count: 477, pct: 47.1, color: "#9690B0",  desc: "Barely read. Less than 1 view/week." },
      { tier: "Low (11–50 views)",       count:  75, pct:  7.4, color: "#FFB020",  desc: "Occasionally found." },
      { tier: "Active (51–200 views)",   count:  31, pct:  3.1, color: "#7B61FF",  desc: "Regularly accessed." },
      { tier: "High (201–500 views)",    count:   8, pct:  0.8, color: "#00D09C",  desc: "High traffic. Worth optimizing." },
      { tier: "Top (500+ views)",        count:   4, pct:  0.4, color: "#FF4757",  desc: "Critical articles. Must be excellent." },
    ],

    concentration: {
      top12: { articles: 12, pctArticles: 1.2, views: 5785, pctViews: 44.8 },
      top50: { articles: 50, pctArticles: 4.9, views: 9374, pctViews: 72.6 },
      bottom895: { articles: 895, pctArticles: 88.4, views: 3542, pctViews: 27.4 },
    },

    insight: "The top 12 articles (1.2%) capture 44.8% of all views. The bottom 895 (88.4%) share just 27.4%. This is a Pareto failure — you're maintaining ~900 articles that no one reads.",
  },

  // Top 20 articles with complete data
  topArticles: [
    { rank: 1,  article: "Data untuk hapus rekening bank terdaftar",      views: 1457, votes: 0,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 2,  article: "Dokumen untuk ubah nomor handphone",            views: 840,  votes: 1,  upRate: null,  category: "Change Phone Number",        feedbackStatus: "BLIND_SPOT" },
    { rank: 3,  article: "Mengganti/Menghapus rekening bank di Pluang",   views: 593,  votes: 2,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 4,  article: "Cara Mengatur Ulang PIN Jika Lupa",             views: 514,  votes: 4,  upRate: 25.0,  category: "PIN",                        feedbackStatus: "URGENT_FIX" },
    { rank: 5,  article: "Akun terkunci - PIN melewati batas",            views: 447,  votes: 0,  upRate: null,  category: "PIN",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 6,  article: "Waktu hapus rekening bank di Pluang",           views: 392,  votes: 0,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 7,  article: "Data to delete bank account (EN)",              views: 325,  votes: 1,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 8,  article: "Hal yang diperhatikan jika tak bisa ubah PIN",  views: 277,  votes: 2,  upRate: null,  category: "PIN",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 9,  article: "Kendala tidak menerima OTP",                    views: 266,  votes: 3,  upRate: 100.0, category: "OTP",                        feedbackStatus: "GOOD" },
    { rank: 10, article: "Notifikasi setelah hapus rekening bank",        views: 241,  votes: 0,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 11, article: "Data untuk login di Pluang",                    views: 220,  votes: 1,  upRate: null,  category: "OTP",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 12, article: "Mengubah PIN melalui aplikasi",                 views: 213,  votes: 6,  upRate: 50.0,  category: "PIN",                        feedbackStatus: "URGENT_FIX" },
    { rank: 13, article: "Data untuk login atau registrasi",              views: 177,  votes: 0,  upRate: null,  category: "Login",                      feedbackStatus: "BLIND_SPOT" },
    { rank: 14, article: "Batasan mencoba memasukkan PIN",                views: 172,  votes: 0,  upRate: null,  category: "PIN",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 15, article: "Documents for change phone number (EN)",        views: 171,  votes: 0,  upRate: null,  category: "Change Phone Number",        feedbackStatus: "BLIND_SPOT" },
    { rank: 16, article: "Cara kerja login menggunakan OTP",              views: 157,  votes: 0,  upRate: null,  category: "OTP",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 17, article: "Replacing/Deleting bank accounts (EN)",         views: 149,  votes: 0,  upRate: null,  category: "Change/Delete Bank Account", feedbackStatus: "BLIND_SPOT" },
    { rank: 18, article: "Data required to login or register (EN)",       views: 143,  votes: 0,  upRate: null,  category: "Login",                      feedbackStatus: "BLIND_SPOT" },
    { rank: 19, article: "Account locked - PIN exceeded (EN)",            views: 136,  votes: 0,  upRate: null,  category: "PIN",                        feedbackStatus: "BLIND_SPOT" },
    { rank: 20, article: "Apa itu Order book",                            views: 125,  votes: 0,  upRate: null,  category: "Crypto Transaction",         feedbackStatus: "BLIND_SPOT" },
  ],

  // ─────────────────────────────────────────────────
  // TAB 2: CONTENT QUALITY
  // ─────────────────────────────────────────────────
  qualityScoring: {
    totalScored: 175,
    avgOverall: 6.62,
    medianOverall: 6.8,
    maxScore: 8.8,
    zeroExcellent: true, // No articles scored 9+

    // Sub-dimension averages (THE KEY FINDING)
    subDimensions: [
      { dimension: "Accuracy",     avg: 8.2, below5: 4,  above7: 162, desc: "Content is factually correct",  color: "#00D09C" },
      { dimension: "Clarity",      avg: 7.3, below5: 7,  above7: 130, desc: "Language is understandable",     color: "#7B61FF" },
      { dimension: "Completeness", avg: 6.0, below5: 56, above7: 70,  desc: "Articles often miss key steps",  color: "#FFB020" },
      { dimension: "Usefulness",   avg: 5.7, below5: 53, above7: 69,  desc: "Content doesn't resolve issues", color: "#FF4757" },
    ],

    accuracyUsefulnessGap: {
      accuracy: 8.2,
      usefulness: 5.7,
      gap: 2.6,
      insight: "Content is factually correct but doesn't resolve the user's problem. The 2.6-point accuracy-usefulness gap means articles answer 'what is X?' but not 'how do I fix X?'",
    },

    // Score distribution
    scoreDistribution: [
      { range: "0–3 (Poor)",         count: 2,  pct: 1.1  },
      { range: "4–5 (Below Average)", count: 47, pct: 26.9 },
      { range: "6 (Average)",         count: 47, pct: 26.9 },
      { range: "7 (Good)",            count: 26, pct: 14.9 },
      { range: "8+ (Very Good)",      count: 50, pct: 28.6 },
      { range: "9+ (Excellent)",      count: 0,  pct: 0.0  },
    ],

    // Quality by L1 category (THIS IS WHERE SCORING JOINS RELIABLY)
    categoryQuality: [
      { category: "Account Management",  articles: 34, avgScore: 5.2, completeness: 4.3, accuracy: 7.4, clarity: 6.5, usefulness: 3.8, below5: 13, verdict: "CRITICAL" },
      { category: "Topup",               articles: 3,  avgScore: 4.7, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 2, verdict: "CRITICAL" },
      { category: "Onboarding",          articles: 1,  avgScore: 4.6, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 1, verdict: "CRITICAL" },
      { category: "Cashout",             articles: 3,  avgScore: 5.7, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 1, verdict: "WARNING" },
      { category: "Pockets",             articles: 3,  avgScore: 5.9, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 1, verdict: "WARNING" },
      { category: "Marketing Program",   articles: 6,  avgScore: 6.2, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 2, verdict: "WARNING" },
      { category: "Asset Options",        articles: 14, avgScore: 6.3, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 2, verdict: "OK" },
      { category: "Asset Gold",           articles: 13, avgScore: 7.1, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 3, verdict: "OK" },
      { category: "Asset Crypto",         articles: 14, avgScore: 7.1, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 1, verdict: "OK" },
      { category: "Application",          articles: 15, avgScore: 7.1, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 0, verdict: "OK" },
      { category: "Asset Mutual Fund",    articles: 16, avgScore: 7.1, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 3, verdict: "OK" },
      { category: "Portfolio/Calcs",      articles: 12, avgScore: 7.2, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 0, verdict: "GOOD" },
      { category: "Web Trading",          articles: 2,  avgScore: 7.3, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 0, verdict: "GOOD" },
      { category: "Asset Crypto Futures", articles: 18, avgScore: 7.4, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 2, verdict: "GOOD" },
      { category: "Asset US Stocks",      articles: 21, avgScore: 7.5, completeness: null, accuracy: null, clarity: null, usefulness: null, below5: 1, verdict: "GOOD" },
    ],

    // Account Management vs Product content deep dive
    acctVsProduct: {
      accountMgmt: { completeness: 4.3, accuracy: 7.4, clarity: 6.5, usefulness: 3.8, overall: 5.2 },
      productContent: { completeness: 6.9, accuracy: 8.6, clarity: 7.8, usefulness: 6.5, overall: 7.3 },
      insight: "Account Management articles — the highest-demand operational category — score 3.8 on usefulness. Product content scores 6.5. The KB invests quality where demand is lowest.",
    },

    // The 47 re-evaluated articles: scores DROPPED
    reEvaluation: {
      count: 47,
      originalAvg: 6.62,
      updatedAvg: 4.87,
      drop: -1.75,
      insight: "47 articles were re-scored. Average dropped from 6.62 → 4.87 (−1.75 points). 83% now score below 5.0. Content is degrading, not improving. There is no quality feedback loop.",
      distribution: [
        { range: "1–3 (Poor)",      count: 2,  pct: 4.3  },
        { range: "4–5 (Below Avg)", count: 39, pct: 83.0 },
        { range: "6+ (Average+)",   count: 6,  pct: 12.8 },
      ],
    },
  },

  // ─────────────────────────────────────────────────
  // TAB 2 CONTINUED: USER FEEDBACK (UPVOTES)
  // ─────────────────────────────────────────────────
  userFeedback: {
    totalVotes: 3193,
    articlesWithVotes: 368,
    articlesWithoutVotes: 645,
    overallUpvoteRate: 75.6,
    upvotes: 2415,
    downvotes: 778,

    // Reliable ratings (3+ votes)
    reliableRatings: {
      total: 54,
      avgUpvoteRate: 71.5,
      tiers: [
        { tier: "Problematic (<50%)",  count: 9,  pct: 16.7, color: "#FF4757" },
        { tier: "Needs Work (50–70%)", count: 27, pct: 50.0, color: "#FFB020" },
        { tier: "Acceptable (70–85%)", count: 10, pct: 18.5, color: "#7B61FF" },
        { tier: "Good (85%+)",         count: 8,  pct: 14.8, color: "#00D09C" },
      ],
    },

    // Most voted articles
    mostVoted: [
      { article: "Seputar Autentikator di Aplikasi Pluang",         votes: 382, upRate: 79.1, category: "Authenticator" },
      { article: "Pengumuman Penyesuaian Waktu Operasional",        votes: 286, upRate: 96.2, category: "Announcement" },
      { article: "Mendaftarkan Rekening Bank pada Aplikasi Pluang",  votes: 190, upRate: 82.6, category: "Bank Registration" },
      { article: "Apakah Aman Berinvestasi di Pluang?",             votes: 137, upRate: 85.4, category: "About Pluang" },
      { article: "Cara Melakukan Perubahan Nomor Handphone",         votes: 122, upRate: 74.6, category: "Change Phone" },
      { article: "Top Up via QRIS",                                  votes: 101, upRate: 83.2, category: "Topup QRIS" },
      { article: "Pertanyaan Umum Tentang Withdrawable Cash",        votes: 91,  upRate: 86.8, category: "Cashout" },
      { article: "Pengumuman Pemeliharaan/Maintenance di Pluang",    votes: 81,  upRate: 93.8, category: "Announcement" },
      { article: "Bagaimana Cara Menonaktifkan Akun Pluang?",        votes: 68,  upRate: 66.2, category: "Deactivation" },
      { article: "Verifikasi Identitas di Pluang",                   votes: 66,  upRate: 54.5, category: "Verification" },
    ],

    // Worst rated articles (3+ votes)
    worstRated: [
      { article: "Faktor alasan spread dapat berubah",               votes: 3,  upRate: 0.0,  views: 1,   category: "Overview Page" },
      { article: "Moving USDT from Margin to Spot",                  votes: 6,  upRate: 0.0,  views: 1,   category: "Crypto Futures Wallet" },
      { article: "Syarat menggunakan leverage",                      votes: 3,  upRate: 0.0,  views: 1,   category: "US Stocks Others" },
      { article: "Tampilan nilai kurs IDR-USD",                      votes: 3,  upRate: 0.0,  views: 5,   category: "USD Transaction" },
      { article: "Penarikan dana melalui E-Wallet",                  votes: 3,  upRate: 0.0,  views: 7,   category: "Cashout Tax & Fees" },
      { article: "Pengertian Withdrawable Cash",                     votes: 11, upRate: 9.1,  views: 1,   category: "US Stocks Others" },
      { article: "Moving USDT from Spot to Margin",                  votes: 5,  upRate: 20.0, views: 1,   category: "Crypto Futures Wallet" },
      { article: "Cara Mengatur Ulang PIN Jika Lupa",                votes: 4,  upRate: 25.0, views: 514, category: "PIN" },
      { article: "Cara Menjual Saham AS",                            votes: 4,  upRate: 25.0, views: 17,  category: "US Stocks Transaction" },
      { article: "Memindahkan Saldo USDT Margin ke Spot",            votes: 23, upRate: 39.1, views: 1,   category: "Crypto Futures Wallet" },
    ],

    // The critical blind spots: high views, zero feedback
    blindSpots: {
      count: 31,
      desc: "31 articles with 50+ views have ZERO user feedback. The #1 viewed article (1,457 views) has never received a single vote.",
      articles: [
        { article: "Data untuk hapus rekening bank terdaftar",    views: 1457, category: "Change/Delete Bank Account" },
        { article: "Akun terkunci - PIN melewati batas",          views: 447,  category: "PIN" },
        { article: "Waktu hapus rekening bank di Pluang",         views: 392,  category: "Change/Delete Bank Account" },
        { article: "Notifikasi setelah hapus rekening bank",      views: 241,  category: "Change/Delete Bank Account" },
        { article: "Data untuk login atau registrasi",            views: 177,  category: "Login" },
        { article: "Batasan mencoba memasukkan PIN",              views: 172,  category: "PIN" },
        { article: "Documents for change phone number (EN)",      views: 171,  category: "Change Phone Number" },
        { article: "Cara kerja login menggunakan OTP",            views: 157,  category: "OTP" },
        { article: "Replacing/Deleting bank accounts (EN)",       views: 149,  category: "Change/Delete Bank Account" },
        { article: "Data required to login or register (EN)",     views: 143,  category: "Login" },
      ],
    },

    feedbackDesert: "645 articles (63.7%) have zero votes. We have feedback on only 36.3% of all content. For the top 20 most-viewed articles, 17 have zero or insufficient feedback.",
  },

  // ─────────────────────────────────────────────────
  // TAB 3: SUPPLY vs DEMAND
  // ─────────────────────────────────────────────────
  supplyDemand: {
    insight: "Users search by ACTION (withdraw, delete, reset PIN). The KB is organized by PRODUCT (gold, stocks, crypto). Highest-traffic operational categories have the worst content quality.",

    // Category-level: articles, views, search demand, quality
    categories: [
      { category: "Change/Delete Bank Account", articles: 8,  views: 3349, searchDemand: null,  avgScore: null,     demandType: "Operational", imbalance: "HIGH_DEMAND_OK_SUPPLY" },
      { category: "PIN",                        articles: 19, views: 2335, searchDemand: 3221,  avgScore: 5.2,      demandType: "Operational", imbalance: "HIGH_DEMAND_LOW_QUALITY" },
      { category: "OTP",                        articles: 11, views: 1232, searchDemand: null,   avgScore: null,     demandType: "Operational", imbalance: "HIGH_DEMAND_NO_SCORE" },
      { category: "Change Phone Number",        articles: 9,  views: 1040, searchDemand: 235,   avgScore: null,     demandType: "Operational", imbalance: "MODERATE" },
      { category: "Login",                      articles: 10, views: 751,  searchDemand: 1589,  avgScore: null,     demandType: "Operational", imbalance: "HIGH_DEMAND_NO_SCORE" },
      { category: "Crypto Transaction",         articles: 28, views: 497,  searchDemand: 644,   avgScore: 7.1,      demandType: "Product",     imbalance: "OK" },
      { category: "MF Transaction",             articles: 41, views: 321,  searchDemand: 145,   avgScore: 7.1,      demandType: "Product",     imbalance: "OVER_SUPPLIED" },
      { category: "Direct BCA",                 articles: 13, views: 253,  searchDemand: null,   avgScore: null,     demandType: "Operational", imbalance: "MODERATE" },
      { category: "Pluang Acct Activ/Deactiv",  articles: 13, views: 184,  searchDemand: 2002,  avgScore: 5.2,      demandType: "Operational", imbalance: "EXTREME_UNDERSUPPLY" },
      { category: "Crypto Futures Transaction",  articles: 77, views: 166,  searchDemand: 627,   avgScore: 7.4,      demandType: "Product",     imbalance: "EXTREME_OVERSUPPLY" },
      { category: "Gold Transaction",           articles: 24, views: 170,  searchDemand: 742,   avgScore: 7.1,      demandType: "Product",     imbalance: "OVER_SUPPLIED" },
      { category: "US Stocks Transaction",      articles: 41, views: 111,  searchDemand: 1202,  avgScore: 7.5,      demandType: "Product",     imbalance: "OVER_SUPPLIED" },
      { category: "Cashout Failed",             articles: 3,  views: 148,  searchDemand: 2835,  avgScore: 5.7,      demandType: "Operational", imbalance: "EXTREME_UNDERSUPPLY" },
      { category: "Pockets Transaction",        articles: 45, views: 101,  searchDemand: 267,   avgScore: 5.9,      demandType: "Product",     imbalance: "OVER_SUPPLIED" },
      { category: "Options Transaction",        articles: 36, views: 91,   searchDemand: null,   avgScore: 6.3,      demandType: "Product",     imbalance: "OVER_SUPPLIED" },
    ],

    // The headline demand-supply ratios
    demandSupplyRatios: [
      { intent: "Transactions (withdraw/topup/status)", searchVol: 8540, kbArticles: 6,  ratio: "1,423:1", verdict: "EXTREME GAP" },
      { intent: "PIN / Auth / Login",                   searchVol: 5565, kbArticles: 21, ratio: "265:1",   verdict: "SEVERE GAP" },
      { intent: "Account Delete/Manage",                searchVol: 3299, kbArticles: 34, ratio: "97:1",    verdict: "GAP" },
      { intent: "Product: US Stocks",                   searchVol: 1202, kbArticles: 70, ratio: "17:1",    verdict: "BALANCED" },
      { intent: "Product: Crypto",                      searchVol: 644,  kbArticles: 28, ratio: "23:1",    verdict: "BALANCED" },
      { intent: "Product: Gold",                        searchVol: 742,  kbArticles: 28, ratio: "26:1",    verdict: "BALANCED" },
      { intent: "Fees & Charges",                       searchVol: 803,  kbArticles: 26, ratio: "31:1",    verdict: "BALANCED" },
    ],
  },

  // ─────────────────────────────────────────────────
  // TAB 4: ARPI FRAMEWORK & PRIORITY QUEUE
  // ─────────────────────────────────────────────────
  arpiFramework: {
    title: "Article Review Priority Index (ARPI)",
    version: "1.0",

    methodology: {
      description: "ARPI produces a deterministic review priority for every article. Every formula is transparent. Every weight is justified. Anyone can audit the calculation.",

      dimensions: [
        {
          name: "Demand (D)",
          source: "Search utterance volume mapped to KB category",
          formula: "D = search_volume_for_category / max_search_volume",
          range: "0–1 (normalized)",
          rationale: "Higher search demand = more users need this content = higher priority to get it right.",
          example: "PIN/Auth: D = 1.0 (5,565 searches). Gold product: D = 0.13 (742 searches).",
          dataSource: "New_Search_utterances__SF_and_RAG.xlsx",
        },
        {
          name: "Visibility (V)",
          source: "Article View Count from Salesforce Knowledge",
          formula: "V = log\u2081\u2080(views+1) / log\u2081\u2080(max_views+1)",
          range: "0–1 (log-normalized to prevent top articles from dominating)",
          rationale: "More viewed = more users affected by quality. Log scale so a 100-view article still registers.",
          example: "1,457 views: V = 1.0. 50 views: V = 0.54. 5 views: V = 0.22.",
          dataSource: "Knowledge_Base__Data_2.xlsx → Article Views",
        },
        {
          name: "Effectiveness (E)",
          source: "User upvote/downvote ratio (articles with \u22653 votes only)",
          formula: "E = upvote_count / total_votes",
          range: "0–1 (direct ratio)",
          rationale: "Low upvote rate = users tell us the content isn't helping. Most direct quality signal available.",
          example: "25% upvote (1/4): E = 0.25. 85% upvote: E = 0.85.",
          caveat: "Only 54 articles have \u22653 votes. For articles with <3 votes, E = UNKNOWN.",
          dataSource: "Knowledge_Base__Data_2.xlsx → Article Upvote",
        },
      ],

      qualityBonus: {
        name: "Quality Score (Q) — Bonus dimension",
        source: "AI-generated quality assessment with 4 sub-dimensions",
        formula: "Q = Usefulness\u00d70.4 + Completeness\u00d70.3 + Clarity\u00d70.2 + Accuracy\u00d70.1",
        range: "0–10",
        weights: [
          { dimension: "Usefulness",   weight: 0.4, why: "Does the article resolve the user's problem? Most important for self-service." },
          { dimension: "Completeness", weight: 0.3, why: "Does the article cover all necessary steps? Missing steps = user escalates." },
          { dimension: "Clarity",      weight: 0.2, why: "Can the user understand and follow instructions?" },
          { dimension: "Accuracy",     weight: 0.1, why: "Is content factually correct? Low weight because accuracy is already high (8.2 avg)." },
        ],
        caveat: "Available for 175 articles only. Joins at category level, not article level. Used as category-level context, not article-level scoring.",
        dataSource: "Knowledge_Base__Data_2.xlsx → Article Scoring",
      },

      priorityFormula: {
        withEffectiveness: "ARPI = D \u00d7 V \u00d7 (1 \u2212 E)",
        withoutEffectiveness: "ARPI = D \u00d7 V \u00d7 0.5",
        missingContent: "ARPI = D \u00d7 1.0",
        interpretation: "High demand \u00d7 High visibility \u00d7 Low effectiveness = FIX FIRST. High demand \u00d7 No content = CREATE FIRST.",
      },
    },

    // The four action queues
    actionQueues: [
      {
        queue: "FIX FIRST",
        emoji: "\uD83D\uDD34",
        criteria: "High ARPI + low effectiveness (upvote <70%)",
        action: "Rewrite for usefulness — add step-by-step, deep links, resolution paths",
        articles: [
          { article: "Cara Mengatur Ulang PIN Jika Lupa",          views: 514, upRate: 25.0, votes: 4,  category: "PIN",           arpiScore: "HIGH" },
          { article: "Mengubah PIN melalui aplikasi",               views: 213, upRate: 50.0, votes: 6,  category: "PIN",           arpiScore: "HIGH" },
          { article: "Cara Login di Aplikasi Pluang",               views: 123, upRate: 66.7, votes: 6,  category: "Login",         arpiScore: "MEDIUM" },
          { article: "Cara kerja login atau registrasi di Pluang",  views: 77,  upRate: 66.7, votes: 3,  category: "Login",         arpiScore: "MEDIUM" },
        ],
        count: 4,
      },
      {
        queue: "REVIEW (Blind Spots)",
        emoji: "\uD83D\uDFE1",
        criteria: "High views (50+) + zero or insufficient feedback",
        action: "Instrument voting immediately. Content audit. Don't wait for data — review now.",
        articles: [
          { article: "Data untuk hapus rekening bank terdaftar",    views: 1457, category: "Change/Delete Bank Account" },
          { article: "Dokumen untuk ubah nomor handphone",          views: 840,  category: "Change Phone Number" },
          { article: "Mengganti/Menghapus rekening bank",           views: 593,  category: "Change/Delete Bank Account" },
          { article: "Akun terkunci - PIN melewati batas",          views: 447,  category: "PIN" },
          { article: "Waktu hapus rekening bank di Pluang",         views: 392,  category: "Change/Delete Bank Account" },
          { article: "Data to delete bank account (EN)",            views: 325,  category: "Change/Delete Bank Account" },
          { article: "Hal yang diperhatikan jika tak bisa ubah PIN",views: 277,  category: "PIN" },
          { article: "Notifikasi setelah hapus rekening bank",      views: 241,  category: "Change/Delete Bank Account" },
          { article: "Data untuk login di Pluang",                  views: 220,  category: "OTP" },
          { article: "Data untuk login atau registrasi",            views: 177,  category: "Login" },
        ],
        count: 31,
        note: "Full list is 31 articles. Showing top 10 by views. These represent 5,169 views with ZERO quality signal.",
      },
      {
        queue: "CREATE",
        emoji: "\uD83D\uDFE2",
        criteria: "High search demand + thin/no KB coverage",
        action: "Write new articles focused on resolution, not explanation",
        gaps: [
          { intent: "Withdrawal status/failed",  searchVol: 2835, currentArticles: 3,  gap: "No real-time status. Articles say 'be patient'." },
          { intent: "Account deletion process",   searchVol: 2002, currentArticles: 13, gap: "Articles explain policy but don't provide the actual form/flow." },
          { intent: "Top-up troubleshooting",     searchVol: 1788, currentArticles: 3,  gap: "Generic FAQ. No failure-specific troubleshooting." },
          { intent: "Transaction cancellation",   searchVol: 428,  currentArticles: 0,  gap: "No articles on how to cancel orders." },
          { intent: "Refund process/timeline",    searchVol: 126,  currentArticles: 0,  gap: "No articles on refund timelines or process." },
        ],
        count: 5,
      },
      {
        queue: "RETIRE",
        emoji: "\u26AB",
        criteria: "Zero views + zero demand + no unique content",
        action: "Archive or merge into existing articles. Reduces maintenance burden.",
        stats: {
          ghostArticles: 418,
          dormantArticles: 477,
          candidateForRetirement: "~200–300 after dedup audit",
          estimatedSavings: "Reduce content maintenance scope by 20–30%",
        },
        note: "Retirement requires a dedup audit first. Many articles are duplicates in different languages or slight variations. A single merge pass could reduce the library from 1,013 to ~700.",
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // TAB 5: INSTRUMENTATION GAPS
  // ─────────────────────────────────────────────────
  instrumentation: {
    headline: "You can't improve what you can't measure. The KB currently has 5 critical measurement gaps.",

    gaps: [
      {
        gap: "No feedback on 63.7% of articles",
        impact: "645 articles have zero votes. 31 high-traffic articles are blind spots.",
        fix: "Make the upvote/downvote prompt more visible. Auto-prompt after 30s on article. A/B test prompt placement.",
        effort: "LOW", owner: "Product / SF Admin",
      },
      {
        gap: "No click-through from search to article",
        impact: "We know what users search and what articles exist, but not whether search → article → resolution happens.",
        fix: "Track search_query → article_click → article_view event chain in analytics.",
        effort: "MEDIUM", owner: "Engineering / Analytics",
      },
      {
        gap: "No post-article behavior tracking",
        impact: "After viewing an article, did the user: resolve (leave HC)? Search again? Escalate? We don't know.",
        fix: "Track next_action after article_view: search, escalate, exit, another_article.",
        effort: "MEDIUM", owner: "Engineering / Analytics",
      },
      {
        gap: "AI scoring doesn't join to views/votes",
        impact: "175 scored articles use FAQ question text as ID. Views use article title. Zero direct matches. Quality insights are category-level only.",
        fix: "Add a shared article_id (SF Knowledge ID) to the scoring pipeline. One-time mapping exercise.",
        effort: "LOW", owner: "Data / Content Team",
      },
      {
        gap: "No content freshness tracking",
        impact: "We don't know when articles were last updated. Stale content = wrong instructions = escalation.",
        fix: "Extract LastModifiedDate from SF Knowledge. Flag articles not updated in 90+ days.",
        effort: "LOW", owner: "SF Admin",
      },
    ],

    currentState: {
      whatWeHave: [
        "Article views (1,013 articles)",
        "Upvote/downvote (368 articles, 36.3%)",
        "AI quality scores (175 articles, 17.3%)",
        "Category mapping (1,464 mappings)",
        "Search utterances (32,972 queries)",
      ],
      whatWeMiss: [
        "Click-through rates",
        "Post-article behavior",
        "Time-on-article",
        "Content freshness dates",
        "Article-level quality-to-view joins",
        "Session-level search\u2192article\u2192outcome tracking",
      ],
    },
  },

  // ─────────────────────────────────────────────────
  // DATA SOURCES & METHODOLOGY
  // ─────────────────────────────────────────────────
  source: {
    primary: "Knowledge_Base__Data_2.xlsx — 5 tabs (Views, Scoring, Evaluation Updated, Upvotes, Category Mapping)",
    secondary: [
      "New_Search_utterances__SF_and_RAG.xlsx — search demand cross-reference",
      "Email_Automation_Framework — escalation category cross-reference",
    ],
    methodology: [
      "Article views: SF Knowledge article view counts, aggregated to article level. 1,013 unique articles, 12,916 total views.",
      "View tiers: Ghost (0\u20131), Dormant (2\u201310), Low (11\u201350), Active (51\u2013200), High (201\u2013500), Top (500+).",
      "Quality scores: AI-generated (175 articles). Sub-dimensions: Completeness, Accuracy, Clarity, Usefulness. Overall \u2248 mean of sub-scores (correlation 0.99).",
      "Re-evaluation: 47 articles re-scored. Avg dropped 6.62 \u2192 4.87. 83% now below 5.0.",
      "Upvotes: SF Article Upvote. 3,193 votes across 368 articles. 'Reliable' threshold: \u22653 votes (54 articles).",
      "ARPI formula: Demand (search vol, 0\u20131) \u00d7 Visibility (log-normalized views, 0\u20131) \u00d7 (1 \u2212 Effectiveness). Effectiveness = upvote rate for articles with 3+ votes.",
      "Quality score weights: Usefulness(40%) + Completeness(30%) + Clarity(20%) + Accuracy(10%). Weighted toward resolution capability.",
      "Category-level quality joins via L1 category (scoring) \u2192 sub-category (views/votes). Not article-level due to naming mismatch between datasets.",
      "Demand-supply ratio: Search utterance volume per intent group / KB article count per matching category.",
    ],
  },
};
