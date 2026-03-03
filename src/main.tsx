import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }
      },
        React.createElement('div', { className: 'window active', style: { width: 350 } },
          React.createElement('div', { className: 'title-bar' },
            React.createElement('div', { className: 'title-bar-text' }, 'Error')
          ),
          React.createElement('div', { className: 'window-body has-space', style: { textAlign: 'center' } },
            React.createElement('p', null, this.state.error),
            React.createElement('button', { onClick: function() { window.location.reload(); } }, 'Reload')
          )
        )
      );
    }
    return this.props.children;
  }
}

function removeLoading() {
  var ls = document.getElementById('loading-screen');
  if (ls) {
    ls.style.opacity = '0';
    setTimeout(function() {
      if (ls && ls.parentNode) ls.parentNode.removeChild(ls);
    }, 300);
  }
}

var rootEl = document.getElementById('root');
if (rootEl) {
  var root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
}

// Remove loading screen after React renders
removeLoading();
setTimeout(removeLoading, 1000);
setTimeout(function() {
  var ls = document.getElementById('loading-screen');
  if (ls && ls.parentNode) ls.parentNode.removeChild(ls);
}, 3000);
