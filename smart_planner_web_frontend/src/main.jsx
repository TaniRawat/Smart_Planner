// src/main.jsx
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Import Firebase configuration (must be imported once at root)
import "./firebase/config.js";

/**
 * Global Error Boundary
 * Prevents the entire UI from crashing on component errors.
 * Provides graceful error handling with user-friendly fallback UI.
 */
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      error: error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error("Root level error:", error);
    console.error("Error details:", errorInfo);
    
    // You could also send error to error tracking service here
    // e.g., Sentry, LogRocket, etc.
    
    this.setState({
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Force reload if needed (alternative to resetting state)
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 flex items-center justify-center p-6">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Error card */}
          <div className="relative z-10 max-w-md w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-8 shadow-2xl">
              {/* Error icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20">
                  <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              {/* Error message */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-slate-400 text-center mb-6">
                {process.env.NODE_ENV === 'development' 
                  ? this.state.error?.message || "An unexpected error occurred"
                  : "Please refresh the page or try again later."}
              </p>
              
              {/* Development details (only shown in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <details className="text-sm">
                    <summary className="text-slate-300 cursor-pointer hover:text-slate-200 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs text-slate-400 overflow-auto mt-2 p-2 bg-slate-900/50 rounded">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <div className="mt-2 border-t border-slate-700 pt-2">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </pre>
                  </details>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 active:scale-[0.99]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl border border-slate-800/50 bg-slate-900/50 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-700 transition-all duration-300 text-sm font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Refresh Page
                  </div>
                </button>
              </div>
              
              {/* Contact support link */}
              <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
                <p className="text-xs text-slate-500">
                  If the problem persists, please{" "}
                  <a 
                    href="mailto:support@smartstudyplanner.com" 
                    className="text-indigo-400 hover:text-indigo-300 transition-colors hover:underline"
                  >
                    contact support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Loading Fallback Component
 * Shows a beautiful loading screen while components are being lazy-loaded.
 */
const LoadingFallback = () => (
  <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 flex items-center justify-center">
    {/* Animated background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
    </div>
    
    {/* Loading content */}
    <div className="relative z-10 text-center">
      {/* Logo/Spinner */}
      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg rounded-full animate-ping opacity-20"></div>
        <div className="relative p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white animate-pulse">
          Smart Study<span className="text-indigo-400">Planner</span>
        </h2>
        <p className="text-slate-400 animate-pulse">
          Loading your study dashboard...
        </p>
        
        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1 pt-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * App Initialization
 * Sets up React with all necessary providers and error boundaries.
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter basename="/">
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);

/**
 * Optional: Service Worker Registration for PWA
 */
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful:', registration);
      },
      (error) => {
        console.log('ServiceWorker registration failed:', error);
      }
    );
  });
}

/**
 * Optional: Global error handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // You could send this to your error tracking service
  // if (window.Sentry) {
  //   window.Sentry.captureException(event.reason);
  // }
});

/**
 * Optional: Global error handler for uncaught errors
 */
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});