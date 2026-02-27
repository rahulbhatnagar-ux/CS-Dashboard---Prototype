import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Route-level error boundary.
 * Catches render errors in child pages and shows a recovery UI
 * instead of crashing the entire app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Page crash:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: 40, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,71,87,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <AlertTriangle size={28} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, marginBottom: 20 }}>
            This page encountered an error. The rest of the dashboard is still working — try reloading or navigating to a different page.
          </p>
          {this.state.error && (
            <pre style={{
              fontSize: 11, color: 'var(--accent-red)', background: 'var(--bg-hover)',
              padding: '8px 16px', borderRadius: 8, maxWidth: 500, overflow: 'auto',
              marginBottom: 16, fontFamily: 'var(--font-mono)',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button onClick={this.handleReset} className="btn-primary" style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
