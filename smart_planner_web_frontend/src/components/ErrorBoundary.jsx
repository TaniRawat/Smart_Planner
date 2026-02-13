// src/components/ErrorBoundary.jsx - Error handling component
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            An unexpected error occurred. Please try again.
          </p>
          {this.state.error && (
            <details style={{
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              maxWidth: '600px',
              margin: 'auto',
              marginBottom: '20px',
              fontSize: '12px'
            }}>
              <summary>Error details</summary>
              {this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
          <button
            onClick={this.resetError}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
