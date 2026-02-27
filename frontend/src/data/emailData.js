// ============================================================
// Email Deep Dive — Effort-Based Analysis
// Sources: Salesforce Case Export, Email Automation Framework,
//          Cascading Failure Hypothesis, CleverTap analytics
// Period: Oct 2025 – Jan 2026 (90-day window)
// ============================================================

export const emailData = {
  // ─────────────────────────────────────────────────
  // HERO METRICS
  // ─────────────────────────────────────────────────
  hero: {
    title: "Email: The Terminal Station",
    subtitle: "Where every channel's failures land",
    tagline: "30,226 tickets \u00b7 51.3% of all volume \u00b7 80.7% ceremony rate",
    metrics: [
      { label: "Email Volume (90d)", value: "30,226", subtext: "51.3% of 58,957 total", icon: "mail", status: null },
      { label: "Email Growth", value: "+48%", subtext: "Despite HC launch Nov 17", icon: "trending-up", status: "critical" },
      { label: "Ceremony Rate", value: "80.7%", subtext: "Only 19.3% moves resolution forward", icon: "clock", status: "critical" },
      { label: "Deflectable", value: "76.4%", subtext: "23,093 cases avoidable", icon: "target", status: "warning" },
    ]
  },

  // ─────────────────────────────────────────────────
  // TREND & WORKLOAD
  // ─────────────────────────────────────────────────
  channelMix: {
    totalTickets90d: 58957,
    emailTickets90d: 30226,
    emailPct: 51.3,
    channels: [
      { name: "Email",               volume: 30226, pct: 51.3, trend: "+48%",   color: "#FF4757" },
      { name: "Live Chat",           volume: 10026, pct: 17.0, trend: "Stable", color: "#FFB020" },
      { name: "Chatbot (contained)", volume: 12684, pct: 21.5, trend: "N/A",    color: "#7B61FF" },
      { name: "Phone",               volume:  6021, pct: 10.2, trend: "+12%",   color: "#7B61FF" },
    ]
  },

  monthlyTrend: [
    { month: "Jul 2025",  email: 4200, total: 12697, emailPct: 33.1, hcLive: false },
    { month: "Aug 2025",  email: 3900, total:  9825, emailPct: 39.7, hcLive: false },
    { month: "Sep 2025",  email: 4400, total: 11045, emailPct: 39.8, hcLive: false },
    { month: "Oct 2025",  email: 4800, total: 13291, emailPct: 36.1, hcLive: false },
    { month: "Nov 2025",  email: 5600, total: 12053, emailPct: 46.5, hcLive: true, note: "HC launched Nov 17" },
    { month: "Dec 2025",  email: 6200, total: 11562, emailPct: 53.6, hcLive: true },
    { month: "Jan 2026",  email: 7100, total: 13500, emailPct: 52.6, hcLive: true },
  ],

  prePostHC: {
    before: { email: 58, liveChat: 25, phone: 12, bot: 5,  hc: 0  },
    after:  { email: 51, liveChat: 17, phone: 10, bot: 22, hc: 0  },
    note: "Post-HC 'Email' = combined Email + EmailCase origins. SF workflow relabeled after HC launch.",
    insight: "Email share appears to drop in raw SF reports because the Origin changed from 'Email' to 'EmailCase' after HC launch. Combined (Email + EmailCase), email actually grew +48% in absolute volume. The HC created a new entry point but did not reduce email demand."
  },

  // ─────────────────────────────────────────────────
  // THE EFFORT PROBLEM — TWO LENSES
  // ─────────────────────────────────────────────────

  // LENS 1: CUSTOMER EFFORT
  customerEffort: {
    headline: "A customer's journey to resolution should be 1 channel, 1 explanation, <1 hour. Email averages 2.4 channels, 3.2 explanations, 3 days.",

    channelComparison: [
      {
        channel: "HC Self-Service (ideal)",
        channelsTouched: 1, timesExplained: 0,
        avgResolution: "<5 min", resolutionUnit: "minutes",
        waitTime: "None", effortScore: 1, effortLabel: "Minimal", color: "#00D09C",
      },
      {
        channel: "Chatbot \u2192 Resolved",
        channelsTouched: 1, timesExplained: 1,
        avgResolution: "~10 min", resolutionUnit: "minutes",
        waitTime: "None", effortScore: 2, effortLabel: "Low", color: "#00D09C",
      },
      {
        channel: "Live Chat \u2192 Resolved",
        channelsTouched: 1, timesExplained: 2,
        avgResolution: "~30 min", resolutionUnit: "minutes",
        waitTime: "Queue time", effortScore: 4, effortLabel: "Moderate", color: "#FFB020",
        note: "15.6 bot turns before agent handoff. 41.4% re-ask rate.",
      },
      {
        channel: "Email \u2192 Resolved",
        channelsTouched: 1, timesExplained: 2,
        avgResolution: "~3 days", resolutionUnit: "days",
        waitTime: "Hours to first reply", effortScore: 6, effortLabel: "High", color: "#FF4757",
        note: "Avg 3.2 email exchanges. 80.7% are non-resolution messages.",
      },
      {
        channel: "Cascade: Bot \u2192 LC \u2192 Email",
        channelsTouched: 3, timesExplained: 3,
        avgResolution: "~3+ days", resolutionUnit: "days",
        waitTime: "Cumulative across channels", effortScore: 9, effortLabel: "Severe", color: "#FF4757",
        note: "User re-explains at every handoff. Context lost entirely.",
      },
      {
        channel: "Full cascade: App \u2192 HC \u2192 Bot \u2192 LC \u2192 Email",
        channelsTouched: 5, timesExplained: 3,
        avgResolution: "3\u20135 days", resolutionUnit: "days",
        waitTime: "Cumulative \u2014 days of anxiety", effortScore: 12, effortLabel: "Extreme", color: "#CC3844",
        note: "5 channels touched. 3 re-explanations. 3\u20135 day wait. This is the face verification case study.",
      },
    ],

    cascadeEffort: [
      { pattern: "Live Chat \u2192 Email",        users: 1458, channelsTouched: 2, reExplanations: 2, avgDays: 3, effort: "High" },
      { pattern: "HC \u2192 Bot \u2192 Email",         users:  628, channelsTouched: 3, reExplanations: 2, avgDays: 3, effort: "High" },
      { pattern: "Email \u2192 Phone",            users:  185, channelsTouched: 2, reExplanations: 2, avgDays: 1, effort: "High" },
      { pattern: "In-App \u2192 LC \u2192 Email",      users:   69, channelsTouched: 3, reExplanations: 3, avgDays: 3, effort: "Severe" },
      { pattern: "LC \u2192 Email \u2192 Phone",       users:   69, channelsTouched: 3, reExplanations: 3, avgDays: 4, effort: "Severe" },
      { pattern: "HC visitors \u2192 Emailed",    users:  628, channelsTouched: 2, reExplanations: 1, avgDays: 3, effort: "High" },
    ],

    effortScoreExplainer: {
      title: "Customer Effort Score (CES)",
      formula: "Channels Touched \u00d7 2 + Re-explanations \u00d7 2 + Days-to-Resolve \u00d7 1",
      scale: [
        { range: "1\u20132", label: "Minimal", color: "#00D09C", meaning: "Self-served or single-contact resolution" },
        { range: "3\u20135", label: "Moderate", color: "#FFB020", meaning: "Some friction but resolved in one session" },
        { range: "6\u20138", label: "High",     color: "#FF4757", meaning: "Multi-touch, multi-day, re-explanation needed" },
        { range: "9+",  label: "Severe",   color: "#CC3844", meaning: "Full cascade \u2014 user exhausted the system" },
      ],
    },
  },

  // LENS 2: AGENT EFFORT
  agentEffort: {
    headline: "For every 10 email messages an agent handles, only 1.9 move resolution forward. The rest is ceremony.",

    overall: {
      avgTouchesPerCase: 3.2,
      ceremonyRate: 80.7,
      productiveRate: 19.3,
      reCollectionRate: 41.4,
      l2EscalationRate: 5.8,
      repeatEmailerRate: 22.4,
    },

    actionBreakdown: [
      { action: "Template Reply",    pct: 35, effort: "LOW",    automatable: true,  desc: "Standard response from template \u2014 FAQ answers, verification steps" },
      { action: "Info Request",      pct: 20, effort: "LOW",    automatable: true,  desc: "Asking user for KTP photo, phone number, screenshot" },
      { action: "System Lookup",     pct: 15, effort: "MEDIUM", automatable: true,  desc: "Checking top-up status, KYC state, account balance" },
      { action: "Data Change",       pct: 10, effort: "MEDIUM", automatable: true,  desc: "Phone number update, name change, email update" },
      { action: "Manual Process",    pct: 8,  effort: "HIGH",   automatable: false, desc: "BCA refund reconciliation, multi-step SOP" },
      { action: "Approval/Override", pct: 5,  effort: "HIGH",   automatable: false, desc: "Account deactivation, large refund, identity override" },
      { action: "Redirect",          pct: 4,  effort: "LOW",    automatable: true,  desc: "Sending user to another channel or app download" },
      { action: "No Action (Close)", pct: 3,  effort: "ZERO",   automatable: true,  desc: "Spam, duplicate, auto-resolved \u2014 just close it" },
    ],

    ceremonyBreakdown: [
      { type: "Acknowledgment emails",    pct: 25, desc: "\"We received your request\" \u2014 adds zero resolution value" },
      { type: "Status update messages",   pct: 20, desc: "\"Your case is being processed\" \u2014 no new information" },
      { type: "Info re-collection",       pct: 18, desc: "Agent re-asks name, email, issue that user already provided" },
      { type: "Template padding",         pct: 10, desc: "Greeting + closing + signature blocks in every message" },
      { type: "Internal routing messages", pct: 5, desc: "\"I'm transferring you to the right team\" \u2014 user waits again" },
      { type: "Follow-up prompts",        pct: 3,  desc: "\"Can you confirm?\" for things already confirmed" },
    ],

    effortByCategory: [
      { category: "Change User Name",       l2Rate: 52.2, primaryAction: "Info Request \u2192 Data Change \u2192 Approval", agentEffort: "High", touches: 4 },
      { category: "New Device Verification", l2Rate: 27.0, primaryAction: "Info Request \u2192 Approval \u2192 Manual",     agentEffort: "High", touches: 4 },
      { category: "Acct Activation/Deact.",  l2Rate: 25.9, primaryAction: "Approval / Override \u2192 Info Request",    agentEffort: "High", touches: 3 },
      { category: "Suspicious Activity",     l2Rate: 25.9, primaryAction: "Manual Process \u2192 Approval",             agentEffort: "High", touches: 5 },
      { category: "Basic Verification",      l2Rate: 11.7, primaryAction: "Info Request \u2192 System Lookup",          agentEffort: "Medium", touches: 3 },
      { category: "Change Phone Number",     l2Rate: 10.9, primaryAction: "Info Request \u2192 Data Change",            agentEffort: "Medium", touches: 3 },
      { category: "PIN",                     l2Rate: 7.3,  primaryAction: "Template Reply \u2192 Data Change",          agentEffort: "Low", touches: 2 },
      { category: "Login",                   l2Rate: 1.5,  primaryAction: "Template Reply \u2192 System Lookup",        agentEffort: "Low", touches: 2 },
      { category: "Direct BCA Refund",       l2Rate: 0.9,  primaryAction: "System Lookup \u2192 Manual Process",        agentEffort: "Medium", touches: 3 },
      { category: "Spam",                    l2Rate: 0,    primaryAction: "No Action (Close)",                     agentEffort: "Zero", touches: 0 },
      { category: "Others Inquiry",          l2Rate: 0,    primaryAction: "Template Reply \u2192 Redirect",             agentEffort: "Low", touches: 1 },
      { category: "Account (general)",       l2Rate: 0,    primaryAction: "Template Reply \u2192 Info Request",         agentEffort: "Low", touches: 2 },
    ],

    effortReframe: {
      current: {
        label: "Current state: 3.2 touches \u00d7 80.7% ceremony",
        productiveTouches: 0.6,
        totalTouches: 3.2,
        insight: "Per email case, the agent does 3.2 message exchanges. Of those, only 0.6 are productive (resolution actions). The other 2.6 are ceremony \u2014 acknowledgments, status, re-collection, templates.",
      },
      target: {
        label: "Target state: 1.5 touches \u00d7 30% ceremony",
        productiveTouches: 1.05,
        totalTouches: 1.5,
        insight: "With auto-acknowledge, upfront info collection, and context handoff, touch count drops to 1.5 with 70% productive. Agent time recaptured for complex cases.",
      },
    },
  },

  // ─────────────────────────────────────────────────
  // ISSUE CATEGORY BREAKDOWN
  // L2 escalation rates are REAL from Salesforce data
  // ─────────────────────────────────────────────────
  categories: [
    { name: "Spam / Irrelevant",               volume: 4510, pctOfEmail: 14.9, l2Rate: 0,    verdict: "ELIMINATE",      priority: "P0", effort: "S",   reduction: 1500, agentAction: "No Action (Close)", customerEffort: 1, agentEffort: "Zero" },
    { name: "Others Inquiry",                   volume: 3283, pctOfEmail: 10.9, l2Rate: 0,    verdict: "AUTO_REPLY",     priority: "P0", effort: "M",   reduction: 800,  agentAction: "Template Reply",    customerEffort: 3, agentEffort: "Low" },
    { name: "Account (general)",                volume: 2982, pctOfEmail:  9.9, l2Rate: 0,    verdict: "KB_ROUTING",     priority: "P1", effort: "M",   reduction: 750,  agentAction: "Template + Info",   customerEffort: 4, agentEffort: "Low" },
    { name: "Direct BCA Refund",                volume: 2203, pctOfEmail:  7.3, l2Rate: 0.9,  verdict: "STATUS_API",     priority: "P2", effort: "XL",  reduction: 550,  agentAction: "System Lookup",     customerEffort: 7, agentEffort: "Medium" },
    { name: "Change Phone Number",              volume: 1816, pctOfEmail:  6.0, l2Rate: 10.9, verdict: "SELF_SERVICE",   priority: "P1", effort: "L",   reduction: 450,  agentAction: "Info \u2192 Data Change",customerEffort: 5, agentEffort: "Medium" },
    { name: "Basic Verification",               volume: 1004, pctOfEmail:  3.3, l2Rate: 11.7, verdict: "STATUS_CHECK",   priority: "P2", effort: "L",   reduction: 250,  agentAction: "Info \u2192 Sys Lookup", customerEffort: 6, agentEffort: "Medium" },
    { name: "Acct Activation/Deactivation",     volume:  838, pctOfEmail:  2.8, l2Rate: 25.9, verdict: "APPROVAL_FLOW",  priority: "P2", effort: "L",   reduction: 200,  agentAction: "Approval/Override", customerEffort: 7, agentEffort: "High" },
    { name: "Verification Inquiry",             volume:  834, pctOfEmail:  2.8, l2Rate: 0,    verdict: "AUTO_REPLY",     priority: "P1", effort: "S",   reduction: 400,  agentAction: "Template Reply",    customerEffort: 3, agentEffort: "Low" },
    { name: "Login",                            volume:  733, pctOfEmail:  2.4, l2Rate: 1.5,  verdict: "SELF_SERVICE",   priority: "P1", effort: "S",   reduction: 300,  agentAction: "Template + Lookup", customerEffort: 5, agentEffort: "Low" },
    { name: "New Device Verification",          volume:  645, pctOfEmail:  2.1, l2Rate: 27.0, verdict: "GUIDED_FLOW",    priority: "P2", effort: "L",   reduction: 150,  agentAction: "Info \u2192 Approval",   customerEffort: 8, agentEffort: "High" },
    { name: "Change Data",                      volume:  610, pctOfEmail:  2.0, l2Rate: 0,    verdict: "SELF_SERVICE",   priority: "P1", effort: "M",   reduction: 300,  agentAction: "Data Change",       customerEffort: 4, agentEffort: "Medium" },
    { name: "Top Up Inquiry",                   volume:  583, pctOfEmail:  1.9, l2Rate: 0,    verdict: "AUTO_REPLY",     priority: "P1", effort: "S",   reduction: 300,  agentAction: "Template Reply",    customerEffort: 3, agentEffort: "Low" },
    { name: "Change User Name",                 volume:  416, pctOfEmail:  1.4, l2Rate: 52.2, verdict: "SELF_SERVICE",   priority: "P2", effort: "M",   reduction: 150,  agentAction: "Info \u2192 Approval",   customerEffort: 8, agentEffort: "High" },
    { name: "Verification Issue",               volume:  359, pctOfEmail:  1.2, l2Rate: 0,    verdict: "STATUS_CHECK",   priority: "P2", effort: "L",   reduction: 100,  agentAction: "Info \u2192 Sys Lookup", customerEffort: 6, agentEffort: "Medium" },
    { name: "Crypto Inquiry",                   volume:  344, pctOfEmail:  1.1, l2Rate: 0,    verdict: "AUTO_REPLY",     priority: "P1", effort: "S",   reduction: 150,  agentAction: "Template Reply",    customerEffort: 3, agentEffort: "Low" },
    { name: "PIN",                              volume:  343, pctOfEmail:  1.1, l2Rate: 7.3,  verdict: "SELF_SERVICE",   priority: "P1", effort: "S",   reduction: 200,  agentAction: "Template \u2192 Change", customerEffort: 4, agentEffort: "Low" },
    { name: "Direct BCA Ops Checking",          volume:  337, pctOfEmail:  1.1, l2Rate: 0,    verdict: "STATUS_API",     priority: "P2", effort: "XL",  reduction: 100,  agentAction: "System Lookup",     customerEffort: 5, agentEffort: "Medium" },
    { name: "Top-up Issue",                     volume:  309, pctOfEmail:  1.0, l2Rate: 0,    verdict: "STATUS_API",     priority: "P2", effort: "XL",  reduction: 150,  agentAction: "System Lookup",     customerEffort: 7, agentEffort: "Medium" },
    { name: "Suspicious Activity",              volume:  270, pctOfEmail:  0.9, l2Rate: 25.9, verdict: "HUMAN_REQUIRED", priority: "P3", effort: "\u2014",  reduction: 0,    agentAction: "Manual + Approval", customerEffort: 9, agentEffort: "High" },
    { name: "BCA Direct Ops Checking",          volume:  270, pctOfEmail:  0.9, l2Rate: 0,    verdict: "STATUS_API",     priority: "P2", effort: "L",   reduction: 100,  agentAction: "System Lookup",     customerEffort: 5, agentEffort: "Medium" },
    { name: "Other (long tail, 25%)",           volume: 7543, pctOfEmail: 25.0, l2Rate: 5,    verdict: "MIXED",          priority: "P3", effort: "Var", reduction: 500,  agentAction: "Mixed",             customerEffort: 5, agentEffort: "Mixed" },
  ],

  verdictDefs: {
    ELIMINATE:      { label: "Eliminate",       color: "#7A7490", bg: "#1C1835", desc: "Auto-filter, zero agent touch" },
    AUTO_REPLY:     { label: "Auto-Reply",      color: "#5B41DF", bg: "#1A1540", desc: "Template response + KB link" },
    KB_ROUTING:     { label: "KB Routing",      color: "#5B41DF", bg: "#1A1540", desc: "Route to specific KB article" },
    SELF_SERVICE:   { label: "Self-Service",    color: "#00D09C", bg: "#0D2820", desc: "In-app guided flow" },
    STATUS_API:     { label: "Status API",      color: "#8B6914", bg: "#2A2010", desc: "Backend API integration" },
    STATUS_CHECK:   { label: "Status Check",    color: "#8B6914", bg: "#2A2010", desc: "Status page / lookup" },
    GUIDED_FLOW:    { label: "Guided Flow",     color: "#CC3860", bg: "#2A1520", desc: "Multi-step guided resolution" },
    APPROVAL_FLOW:  { label: "Approval Flow",   color: "#7B61FF", bg: "#1A1540", desc: "Self-service + admin approval" },
    HUMAN_REQUIRED: { label: "Human Required",  color: "#CC3844", bg: "#2A1520", desc: "Agent-handled, reduce ceremony" },
    MIXED:          { label: "Mixed",           color: "#7A7490", bg: "#1C1835", desc: "Quarterly audit needed" },
  },

  // ─────────────────────────────────────────────────
  // AUTOMATION SCORING MATRIX
  // ─────────────────────────────────────────────────
  automationScoring: [
    { category: "Spam",                   vol: 5, simp: 5, data: 5, impact: 3, cost: 5, weighted: 4.6, priority: "P0", type: "Auto-filter rule" },
    { category: "Others Inquiry",         vol: 5, simp: 4, data: 4, impact: 3, cost: 5, weighted: 4.3, priority: "P0", type: "Auto-reply + KB" },
    { category: "Account (general)",      vol: 5, simp: 3, data: 3, impact: 3, cost: 5, weighted: 3.9, priority: "P1", type: "KB + smart routing" },
    { category: "Login",                  vol: 3, simp: 4, data: 4, impact: 5, cost: 3, weighted: 3.7, priority: "P1", type: "Self-service reset" },
    { category: "PIN",                    vol: 3, simp: 4, data: 4, impact: 5, cost: 3, weighted: 3.7, priority: "P1", type: "Self-service reset" },
    { category: "Change Phone Number",    vol: 4, simp: 2, data: 3, impact: 5, cost: 4, weighted: 3.5, priority: "P1", type: "Guided flow + OTP" },
    { category: "Top Up Inquiry",         vol: 3, simp: 4, data: 4, impact: 3, cost: 3, weighted: 3.4, priority: "P1", type: "Auto-reply + KB" },
    { category: "Direct BCA Refund",      vol: 4, simp: 1, data: 2, impact: 5, cost: 4, weighted: 3.1, priority: "P2", type: "BCA API integration" },
    { category: "Basic Verification",     vol: 3, simp: 2, data: 3, impact: 4, cost: 3, weighted: 2.9, priority: "P2", type: "Status checker" },
    { category: "Acct Activation",        vol: 3, simp: 2, data: 3, impact: 4, cost: 3, weighted: 2.9, priority: "P2", type: "Approval workflow" },
    { category: "New Device Verification",vol: 3, simp: 2, data: 2, impact: 4, cost: 3, weighted: 2.8, priority: "P2", type: "Guided flow" },
    { category: "Change User Name",       vol: 2, simp: 2, data: 3, impact: 3, cost: 2, weighted: 2.3, priority: "P3", type: "Ops workflow" },
    { category: "Suspicious Activity",    vol: 2, simp: 1, data: 2, impact: 5, cost: 2, weighted: 2.2, priority: "P3", type: "Human-required" },
  ],

  // ─────────────────────────────────────────────────
  // AUTOMATION ROADMAP
  // ─────────────────────────────────────────────────
  automationRoadmap: {
    currentMonthly: 6000,
    phases: [
      {
        phase: "P0", label: "Quick Wins", timeline: "Week 1\u20132",
        initiatives: [
          { id: "EMAIL-001", name: "Spam auto-filter", reduction: 1500, effort: "1 week", owner: "SF Admin", deps: "SF admin access" },
          { id: "EMAIL-009", name: "Channel redirect auto-reply", reduction: 500, effort: "1 week", owner: "SF Admin + Product", deps: "HC URL + auto-response rule" },
          { id: "EMAIL-002", name: "KB-matched auto-reply", reduction: 800, effort: "2\u20133 weeks", owner: "SF Admin + CX", deps: "Keyword \u2192 KB mapping" },
        ],
        totalReduction: 2800, remainingEmail: 3200, color: "#00D09C",
        effortImpact: "Eliminates all zero-value email. Agent time recaptured: ~47% of email workload.",
      },
      {
        phase: "P1", label: "Self-Service", timeline: "Week 3\u20136",
        initiatives: [
          { id: "EMAIL-003", name: "Login/PIN self-service deep link", reduction: 300, effort: "1 week", owner: "Product + SF Admin", deps: "App deep link" },
          { id: "EMAIL-004", name: "Phone change guided flow", reduction: 450, effort: "4\u20136 weeks", owner: "Engineering + Product", deps: "User mgmt API" },
          { id: "\u2014", name: "Data extraction + flow analysis", reduction: 0, effort: "2 weeks", owner: "Analytics", deps: "SOQL queries" },
        ],
        totalReduction: 3550, remainingEmail: 2450, color: "#7B61FF",
        effortImpact: "Users self-serve for auth and data changes. Agent effort shifts to complex-only.",
      },
      {
        phase: "P2", label: "API Integration", timeline: "Month 2\u20133",
        initiatives: [
          { id: "EMAIL-005", name: "BCA refund status automation", reduction: 500, effort: "6\u20138 weeks", owner: "Engineering", deps: "BCA API" },
          { id: "EMAIL-006", name: "Verification status checker", reduction: 250, effort: "4\u20136 weeks", owner: "Engineering + Product", deps: "KYC API" },
          { id: "EMAIL-007", name: "Account deactivation self-service", reduction: 200, effort: "4\u20136 weeks", owner: "Engineering + Product", deps: "User mgmt API + approval" },
          { id: "EMAIL-008", name: "New device verification flow", reduction: 150, effort: "4\u20136 weeks", owner: "Engineering", deps: "Device mgmt API" },
        ],
        totalReduction: 4650, remainingEmail: 1350, color: "#FFB020",
        effortImpact: "System lookups automated. Customer effort score drops from 6\u20138 to 1\u20132 for transaction issues.",
      },
      {
        phase: "P3", label: "Full Automation", timeline: "Month 3+",
        initiatives: [
          { id: "\u2014", name: "Remaining subcategory automation", reduction: 500, effort: "Ongoing", owner: "Cross-functional", deps: "P1 analysis" },
          { id: "\u2014", name: "Proactive notifications", reduction: 1000, effort: "8\u201312 weeks", owner: "Engineering + Product", deps: "Event system + push" },
        ],
        totalReduction: 5650, remainingEmail: 350, color: "#7B61FF",
        effortImpact: "Proactive notifications prevent emails before they happen. Near-zero customer effort.",
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // CASE STUDIES — framed as EFFORT stories
  // ─────────────────────────────────────────────────
  caseStudies: [
    {
      title: "Face Verification Failure",
      subtitle: "\"I can't log in \u2014 Face Verification keeps failing\"",
      channelsTouched: 5, daysToResolve: 3, timesExplained: 3,
      customerEffortScore: 12, targetEffortScore: 1,
      journey: [
        { channel: "App",       result: "FAIL",    detail: "User stuck on Face Verification. App shows 'Try again' 3\u00d7." },
        { channel: "HC Search", result: "FAIL",    detail: "Generic article. Doesn't solve device-specific issue." },
        { channel: "Chatbot",   result: "FAIL",    detail: "Dead-end apology. No agent offer. 52.8% rate." },
        { channel: "Live Chat", result: "PARTIAL", detail: "Agent re-asks everything. Escalates to L2." },
        { channel: "Email",     result: "PARTIAL", detail: "3 days, 6 emails. L2 finally resolves." },
      ],
      fix: "Detect device verification failure at app level \u2192 guided flow \u2192 resolve at Stage 1.",
      effortSaved: "Customer effort: 12 \u2192 1. Agent effort: 6 emails + L2 \u2192 0 touches.",
    },
    {
      title: "Failed BCA Top-Up Refund",
      subtitle: "\"My top-up didn't go through but money was deducted\"",
      channelsTouched: 4, daysToResolve: 5, timesExplained: 3,
      customerEffortScore: 11, targetEffortScore: 1,
      journey: [
        { channel: "App",       result: "FAIL",    detail: "Top-up fails. Money deducted. No auto-detect." },
        { channel: "HC Search", result: "FAIL",    detail: "FAQ doesn't address failed transactions." },
        { channel: "Chatbot",   result: "FAIL",    detail: "Bot can't check transaction status." },
        { channel: "Live Chat", result: "PARTIAL", detail: "Agent checks BCA ops manually. 20 min." },
        { channel: "Email",     result: "PARTIAL", detail: "Day 3: no refund. New agent starts over. Day 5." },
      ],
      fix: "Detect failed top-up \u2192 real-time status + auto-trigger refund \u2192 push notification.",
      effortSaved: "Customer effort: 11 \u2192 1. Agent effort: 2 agents \u00d7 manual BCA check \u2192 0 touches.",
    },
    {
      title: "Ticket Status Check (PII Search)",
      subtitle: "\"What's happening with my ticket?\" \u2014 15,497 users do this",
      channelsTouched: 3, daysToResolve: 1, timesExplained: 2,
      customerEffortScore: 7, targetEffortScore: 1,
      journey: [
        { channel: "HC Search", result: "FAIL",     detail: "Types email address in search. Zero results." },
        { channel: "Chatbot",   result: "FAIL",     detail: "'I don't have access to account information.'" },
        { channel: "Live Chat", result: "RESOLVED", detail: "Agent relays status. 5 minutes. Pure status relay." },
      ],
      fix: "Ticket status page in app. PII detection \u2192 redirect to 'Check my ticket' flow.",
      effortSaved: "Customer effort: 7 \u2192 1. Agent effort: 5 min status relay \u00d7 15,497 users \u2192 0.",
      scale: "15,497 users search PII this way. #1 search cascade driver.",
    },
  ],

  // ─────────────────────────────────────────────────
  // METRICS & TARGETS
  // ─────────────────────────────────────────────────
  metrics: [
    { metric: "Monthly email volume",         baseline: "~6,000/mo",  target3m: "4,200 (\u221230%)", target6m: "2,400 (\u221260%)", method: "SF Case: Origin = Email" },
    { metric: "Email % of total",             baseline: "51.3%",      target3m: "35%",          target6m: "20%",          method: "SF origin distribution" },
    { metric: "Avg touches per case",         baseline: "3.2",        target3m: "2.0 (\u221238%)",   target6m: "1.5 (\u221253%)",   method: "EmailMessage count per Case" },
    { metric: "Ceremony rate",                baseline: "80.7%",      target3m: "50%",          target6m: "30%",          method: "Non-resolution msg / total" },
    { metric: "Customer effort score (avg)",  baseline: "~6",         target3m: "4",            target6m: "2",            method: "CES formula per resolved case" },
    { metric: "L2 escalation rate",           baseline: "5.8%",       target3m: "4%",           target6m: "3%",           method: "Escalated / total email" },
    { metric: "Repeat emailer rate",          baseline: "22.4%",      target3m: "15%",          target6m: "8%",           method: "Contacts with 2+ cases" },
    { metric: "Re-collection rate",           baseline: "41.4%",      target3m: "20%",          target6m: "10%",          method: "Cases where agent re-asks info" },
    { metric: "Spam volume",                  baseline: "~1,500/mo",  target3m: "150 (\u221290%)",   target6m: "50 (\u221297%)",    method: "SF auto-filter + audit" },
    { metric: "HC adoption by email users",   baseline: "17.9%",      target3m: "40%",          target6m: "60%",          method: "Identity stitch: email\u2192HC" },
  ],

  // ─────────────────────────────────────────────────
  // REPORTED VS REALITY
  // ─────────────────────────────────────────────────
  reportedVsReality: [
    { channel: "HC Deflection",     reported: "99.88%", reality: "~91%",  why: "9.2% created tickets later. Deflection = form invisibility, not resolution." },
    { channel: "Bot Containment",   reported: "90.9%",  reality: "~10%",  why: "67.7% failure. 52.8% dead-ends. Contained = user gave up." },
    { channel: "Search Answer Rate",reported: "100%",   reality: "<19%",  why: "RAG always answers. 95% PII fail. 81.6% no click." },
  ],

  // ─────────────────────────────────────────────────
  // CASCADE FUNNEL
  // ─────────────────────────────────────────────────
  cascadeFunnel: [
    { stage: "HC Entry",        volume: 49730, failRate: "58% generic entry",            keyFail: "App doesn't pass intent",       cascadeDown: "32,972 search" },
    { stage: "Search & KB",     volume: 32972, failRate: "95% PII; 81.6% no click",      keyFail: "PII search + KB mismatch",      cascadeDown: "14,875 bot sessions" },
    { stage: "Chatbot",         volume: 14875, failRate: "67.7% failure; 52.8% dead-end", keyFail: "Apologize \u2192 stop",           cascadeDown: "10,026 LC + email" },
    { stage: "Live Chat",       volume: 10026, failRate: "15.6 turns; 41.4% re-ask",     keyFail: "Context lost at handoff",       cascadeDown: "26.8% \u2192 email" },
    { stage: "Email",           volume: 30226, failRate: "80.7% ceremony; 3d resolution", keyFail: "Multi-touch, no resolution",   cascadeDown: "6,021 phone" },
    { stage: "Phone",           volume:  6021, failRate: "Last resort",                   keyFail: "User exhausted all options",    cascadeDown: "Terminal" },
  ],

  // ─────────────────────────────────────────────────
  // DATA SOURCES
  // ─────────────────────────────────────────────────
  source: {
    primary: "Salesforce Case Export via BigQuery (347,395 cases) | Jul 2025 \u2013 Jan 2026",
    secondary: [
      "Email Automation Framework (9-tab analysis) \u2014 subcategory volumes, L2 rates, agent actions, scoring, roadmap",
      "Cascading Failure Hypothesis (12 slides) \u2014 cascade funnel, effort metrics, case studies",
      "CleverTap HC Analytics \u2014 49,730 unique users, entry point data",
      "Chatbot Transcripts \u2014 51,266 messages across 14,875 sessions",
      "Search Utterances \u2014 32,972 queries (SF + RAG)",
    ],
    methodology: [
      "Email volumes from Salesforce Case export filtered by Origin = Email/EmailCase",
      "L2 escalation rates are actual Salesforce data per subcategory",
      "Customer Effort Score: Channels\u00d72 + Re-explanations\u00d72 + Days\u00d71",
      "Agent action taxonomy from Email Automation Framework Tab 5",
      "Ceremony rate (80.7%) from Cascading Failure analysis of EmailMessage content",
      "Automation scoring: Volume(30%) + Simplicity(25%) + Data(15%) + Impact(15%) + CostSave(15%)",
    ],
  },
};
