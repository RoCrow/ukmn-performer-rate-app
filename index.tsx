

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Define types for the ErrorBoundary component's props and state.
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// A component to catch runtime errors in the component tree and display a fallback UI.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to the console for more details
    console.error("Caught an error by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI when an error is caught
      return (
        <div style={{
          backgroundColor: '#111827',
          color: '#f3f4f6',
          fontFamily: 'monospace',
          padding: '2rem',
          height: '100vh',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>Application Error</h1>
          <p style={{ color: '#d1d5db', marginTop: '1rem' }}>Something went wrong while rendering the application.</p>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            padding: '1rem',
            borderRadius: '0.5rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginTop: '1rem',
            border: '1px solid #374151'
          }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <details style={{ marginTop: '1.5rem', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer', outline: 'none' }}>Click to see component stack trace</summary>
            <pre style={{
              backgroundColor: '#1f2937',
              padding: '1rem',
              borderRadius: '0.5rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              marginTop: '0.5rem',
              border: '1px solid #374151'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
