// src/App.jsx
import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import { fetchCurrentUser, setAuthToken, logout as apiLogout, getIdToken } from "./api";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notes = lazy(() => import("./pages/Notes"));

/**
 * App root.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  
  const showToast = useCallback((message, { timeout = 3500 } = {}) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    if (timeout > 0) {
      toastTimerRef.current = setTimeout(() => setToast(null), timeout);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    try {
      apiLogout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("sp_token");
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setBootstrapping(true);
      try {
        const token = getIdToken();
        if (!token) {
          setBootstrapping(false);
          return;
        }

        setAuthToken(token);

        try {
          const me = await fetchCurrentUser();
          setUser(me);
        } catch (err) {
          console.warn("Backend fetch failed:", err);
          clearSession();
        }
      } catch (err) {
        console.warn("Session restore failed:", err);
        clearSession();
      } finally {
        setBootstrapping(false);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSession]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession();
      showToast("Session expired. Please sign in again.", { timeout: 4000 });
    };

    window.addEventListener("sp:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("sp:auth-expired", handleAuthExpired);
    };
  }, [clearSession, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleLogin = useCallback(
    async ({ user: maybeUser, token }) => {
      try {
        if (!token) {
          throw new Error("No token provided to handleLogin");
        }
        setAuthToken(token);
        localStorage.setItem("sp_token", token);

        if (maybeUser && maybeUser.email) {
          setUser(maybeUser);
        } else {
          const me = await fetchCurrentUser();
          setUser(me);
        }
        showToast("Successfully signed in.", { timeout: 2500 });
      } catch (err) {
        console.error("handleLogin error:", err);
        clearSession();
        showToast("Login failed. Please try again.", { timeout: 4000 });
      }
    },
    [clearSession, showToast]
  );

  const handleLogout = useCallback(() => {
    clearSession();
    showToast("You are signed out.", { timeout: 2500 });
  }, [clearSession, showToast]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4 text-sm">
          Bootstrapping your workspace...
        </div>
      </div>
    );
  }

  const isAuthed = !!user;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="pt-6 pb-12">
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthed ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/login"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthed={isAuthed}>
                  <Dashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute isAuthed={isAuthed}>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 rounded-md bg-slate-800/90 px-4 py-2 text-sm text-slate-100 shadow"
        >
          {toast}
        </div>
      )}
    </div>
  );
}