// src/pages/Login.jsx - SIMPLIFIED VERSION
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, setAuthToken } from '../api';

const Login = ({ onLogin }) => {
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [fieldError, setFieldError] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  const navigate = useNavigate();
  const emailRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    // Move focus to error when it changes
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Email validation
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError({});

    if (loading) return;

    // Client-side validation
    let hasError = false;
    const newFieldError = {};

    if (!email.trim()) {
      newFieldError.email = "Email address is required";
      hasError = true;
    } else if (!isValidEmail(email)) {
      newFieldError.email = "Please enter a valid email address";
      hasError = true;
    }

    if (!password) {
      newFieldError.password = "Password is required";
      hasError = true;
    } else if (password.length < 6) {
      newFieldError.password = "Password must be at least 6 characters";
      hasError = true;
    }

    if (hasError) {
      setFieldError(newFieldError);
      return;
    }

    setLoading(true);

    try {
      // Use backend login
      const tokenData = await loginUser(email, password);
      const token = tokenData?.access_token || tokenData?.token;

      if (!token) {
        throw new Error("Login succeeded but no token returned.");
      }

      // Persist token & set axios header
      setAuthToken(token, { persist: remember });

      // Inform parent (App) so it can set user state and complete login flow
      if (onLogin) {
        try {
          await onLogin({ user: tokenData?.user, token });
        } catch (err) {
          // ignore; parent will show errors if needed
        }
      }

      console.log("Login successful");
      navigate('/dashboard');

    } catch (err) {
      // Parse error messages
      let message = "Invalid email or password";

      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data) && data[0]?.msg) {
          message = data[0].msg;
        } else if (typeof data === "string") {
          message = data;
        }
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Test backend connection
  const testBackend = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/health`);
      const result = await response.json();
      alert(`Backend status: ${JSON.stringify(result)}`);
    } catch (err) {
      alert(`Backend test failed: ${err.message}`);
    }
  };

  // Handle demo login
  const handleDemoLogin = () => {
    setEmail("demo@studylab.com");
    setPassword("demopassword123");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg rounded-full"></div>
                <div className="relative p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Smart Study<span className="text-indigo-400">Planner</span>
              </h1>
            </div>
            <p className="text-slate-400">Organize your study journey with intelligence</p>
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-3xl blur opacity-20"></div>
            
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-8 shadow-2xl">
              {/* Welcome Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-4">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="mt-2 text-slate-400">Log in to your Smart Study Planner account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  aria-live="assertive"
                  className="mb-6 animate-fade-in rounded-xl bg-gradient-to-r from-rose-950/40 to-rose-900/20 border border-rose-500/20 p-4"
                >
                  <p className="text-sm text-rose-200">{error}</p>
                </div>
              )}

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-6" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800/50 bg-slate-900/50 py-3.5 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {fieldError.email && (
                    <p className="text-xs text-rose-400">{fieldError.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <Link 
                      to="/forgot" 
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800/50 bg-slate-900/50 py-3.5 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldError.password && (
                    <p className="text-xs text-rose-400">{fieldError.password}</p>
                  )}
                </div>

                {/* Remember Me & Demo Login */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      disabled={loading}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Try Demo Account
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
                >
                  {loading ? 'Authenticating...' : 'Login to Dashboard'}
                </button>
              </form>

              {/* Additional Buttons for Testing */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={testBackend}
                  className="w-full text-sm text-slate-400 hover:text-slate-300 py-2 border border-slate-800/50 rounded-xl hover:bg-slate-800/30"
                >
                  Test Backend Connection
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900 text-slate-500">New to Smart Study Planner?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-900/50 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white"
                >
                  Create an Account
                </Link>
              </div>
            </div>
          </div>

          {/* Development info */}
          <div className="mt-8 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
            <p className="text-xs text-slate-500">
              Backend running at {import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;