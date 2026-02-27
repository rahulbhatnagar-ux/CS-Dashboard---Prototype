import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

/* ── Lazy-loaded page components ──
   Each page is code-split into its own chunk.
   Only downloaded when the user navigates to that route. */

// Operations
const CODashboard = lazy(() => import('./pages/operations/CODashboard'));
const SLAAnalysis = lazy(() => import('./pages/operations/SLAAnalysis'));
const CTIBoardStatus = lazy(() => import('./pages/operations/CTIBoardStatus'));

// Intelligence
const CSATAnalysis = lazy(() => import('./pages/intelligence/CSATAnalysis'));
const ChannelMix = lazy(() => import('./pages/intelligence/ChannelMix'));
const ProductFeedback = lazy(() => import('./pages/intelligence/ProductFeedback'));
const ChatbotDeepDive = lazy(() => import('./pages/intelligence/ChatbotDeepDive'));
const EmailDeepDive = lazy(() => import('./pages/intelligence/EmailDeepDive'));
const SearchAnalysis = lazy(() => import('./pages/intelligence/SearchAnalysis'));
const SearchDeepDive = lazy(() => import('./pages/intelligence/SearchDeepDive'));
const KBHealthDeepDive = lazy(() => import('./pages/intelligence/KBHealthDeepDive'));
const HCDeflection = lazy(() => import('./pages/intelligence/HCDeflection'));
const EscalationAnalysis = lazy(() => import('./pages/intelligence/EscalationAnalysis'));

// Agent Workspace
const Customer360 = lazy(() => import('./pages/agent/Customer360'));
const CSETicketResolver = lazy(() => import('./pages/agent/CSETicketResolver'));
const CTITicketResolver = lazy(() => import('./pages/agent/CTITicketResolver'));

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}><LoadingSpinner message="Loading page..." /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CODashboard />} />
          <Route path="sla" element={<SLAAnalysis />} />
          <Route path="cti-board" element={<CTIBoardStatus />} />
          <Route path="csat" element={<CSATAnalysis />} />
          <Route path="channel-mix" element={<ChannelMix />} />
          <Route path="product-feedback" element={<ProductFeedback />} />
          <Route path="chatbot" element={<ChatbotDeepDive />} />
          <Route path="email" element={<EmailDeepDive />} />
          <Route path="search" element={<SearchDeepDive />} />
          <Route path="kb-health" element={<KBHealthDeepDive />} />
          <Route path="hc-deflection" element={<HCDeflection />} />
          <Route path="escalation" element={<EscalationAnalysis />} />
          <Route path="customer-360" element={<Customer360 />} />
          <Route path="cse-resolver" element={<CSETicketResolver />} />
          <Route path="cti-resolver" element={<CTITicketResolver />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
