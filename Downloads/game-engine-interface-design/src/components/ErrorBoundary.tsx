import React from 'react';

interface State {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('FunnyNetworkEngine Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          fontFamily: 'Segoe UI, sans-serif',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32,
            maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', color: '#c0392b' }}>FunnyNetworkEngine Crashed</h2>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
              style={{
                padding: '8px 24px', borderRadius: 6, cursor: 'pointer',
                background: 'linear-gradient(180deg, #4580c4, #1e5799)',
                color: '#fff', border: '1px solid #1a3f6f', fontSize: 13,
              }}
            >
              🔄 Reload Engine
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
