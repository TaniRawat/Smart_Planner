// src/pages/Register.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser, fetchCurrentUser, setAuthToken } from "../api";

/**
 * Register page (Premium Enhanced UI/UX)
 * - Client validation with visual feedback
 * - Animated transitions and effects
 * - Accessibility-first design
 * - Register -> login -> fetch /auth/me -> onLogin({ user, token })
 */
export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ 
    email: false, 
    password: false, 
    confirmPassword: false 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Calculate password strength
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [password]);

  const isEmailValid = (value) => /\S+@\S+\.\S+/.test(value);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const parseErrorMessage = (err) => {
    if (!err) return "An unknown error occurred.";
    if (err?.response?.data) {
      const d = err.response.data;
      if (typeof d.detail === "string") return d.detail;
      if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
      if (typeof d === "string") return d;
    }
    if (err?.message) return err.message;
    return String(err);
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength === 0) return "bg-slate-700";
    if (strength <= 2) return "bg-rose-500";
    if (strength <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getPasswordStrengthText = (strength) => {
    if (strength === 0) return "Enter a password";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setHint("");

    // Client-side validation
    if (!isEmailValid(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (new TextEncoder().encode(password).length > 512) {
      setError("Password is too long. Use a shorter passphrase.");
      return;
    }

    setLoading(true);

    try {
      // Register user
      await registerUser(email.trim(), password, email.trim().split('@')[0], email.trim().split('@')[0]);

      // Login immediately
      const tokenData = await loginUser(email.trim(), password);
      const token = tokenData?.access_token;
      if (!token) {
        setError("Account created but no token returned. Please log in.");
        setLoading(false);
        navigate("/login");
        return;
      }

      // Persist token and set header
      setAuthToken(token);

      // Fetch user profile
      let user = { email: email.trim() };
      try {
        const me = await fetchCurrentUser();
        if (me && me.email) user = me;
      } catch (innerErr) {
        console.warn("fetchCurrentUser failed after register:", innerErr);
        setHint("Account created. Profile will load on dashboard.");
      }

      // Notify parent
      if (typeof onLogin === "function") {
        onLogin({ user, token });
      }

      resetForm();
      if (mountedRef.current) navigate("/dashboard");
    } catch (err) {
      const message = parseErrorMessage(err) || "Could not create account. Please try again.";
      setError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 5}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-600 blur-lg rounded-full"></div>
                <div className="relative p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Join Study<span className="text-emerald-400">Lab</span>
              </h1>
            </div>
            <p className="text-slate-400">Start your organized study journey today</p>
          </div>

          {/* Register Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-8 shadow-2xl">
              {/* Welcome Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <p className="mt-2 text-slate-400">Start tracking your study tasks and priorities</p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-6 animate-fade-in rounded-xl bg-gradient-to-r from-rose-950/40 to-rose-900/20 border border-rose-500/20 p-4 flex items-start gap-3"
                >
                  <div className="p-1.5 bg-rose-500/20 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-rose-200">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError("")}
                    className="text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="reg-email" className="text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                      error && email && !isEmailValid(email)
                        ? "border-rose-500/30 bg-rose-500/5" 
                        : isFocused.email 
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-slate-800/50 bg-slate-800/20"
                    }`}></div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="relative block w-full rounded-xl border-0 bg-slate-900/50 py-3.5 pl-12 pr-4 text-slate-200 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 sm:text-sm transition-all duration-300"
                      autoComplete="email"
                      onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reg-password" className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <div className="text-xs text-slate-500">
                      Min. 6 characters
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                      error && password && password.length < 6
                        ? "border-rose-500/30 bg-rose-500/5" 
                        : isFocused.password 
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-slate-800/50 bg-slate-800/20"
                    }`}></div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="relative block w-full rounded-xl border-0 bg-slate-900/50 py-3.5 pl-12 pr-12 text-slate-200 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 sm:text-sm transition-all duration-300"
                      autoComplete="new-password"
                      onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength <= 2 ? "text-rose-400" :
                          passwordStrength <= 3 ? "text-amber-400" :
                          "text-emerald-400"
                        }`}>
                          {getPasswordStrengthText(passwordStrength)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                              level <= passwordStrength 
                                ? getPasswordStrengthColor(passwordStrength)
                                : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Password Tips */}
                  <div className="rounded-lg bg-slate-900/30 p-3 border border-slate-800/50">
                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tips for a strong password:
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1 ml-5">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>Use at least 8 characters</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>Mix uppercase and lowercase letters</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>Include numbers and special characters</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="reg-confirm-password" className="text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                      error && confirmPassword && password !== confirmPassword
                        ? "border-rose-500/30 bg-rose-500/5" 
                        : isFocused.confirmPassword 
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-slate-800/50 bg-slate-800/20"
                    }`}></div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="reg-confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="relative block w-full rounded-xl border-0 bg-slate-900/50 py-3.5 pl-12 pr-12 text-slate-200 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 sm:text-sm transition-all duration-300"
                      autoComplete="new-password"
                      onFocus={() => setIsFocused(prev => ({ ...prev, confirmPassword: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, confirmPassword: false }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-200"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {password && confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Hint Message */}
                {hint && !error && (
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">{hint}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="rounded-lg bg-slate-900/30 p-4 border border-slate-800/50">
                  <label className="inline-flex items-start gap-3 text-sm text-slate-300 group cursor-pointer">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        required
                        disabled={loading}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border border-slate-700 bg-slate-900 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-disabled:opacity-50 transition-all duration-200 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        I agree to the{" "}
                        <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
                          Terms of Service
                        </a>
                        {" "}and{" "}
                        <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </div>
                  </label>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-300 active:scale-[0.99]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Create Account
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900 text-slate-500">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-900/50 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-700 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Existing Account
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">Privacy Policy</a>
              <br />
              <span className="mt-1 block">Need help? <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Contact Support</a></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}