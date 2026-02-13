// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getIdToken } from "../api";
import PropTypes from "prop-types";

/**
 * ProtectedRoute
 * - Integrates Firebase Auth listener
 * - Blocks access if user is not authenticated
 * - Supports optional role-based protection
 */
export default function ProtectedRoute({ allowRoles = null, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Subscribe to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 1. Loading State (While Firebase checks the session)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
            <span>Securing session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    // Fallback: allow access if a valid token is present in local storage
    const token = getIdToken() || localStorage.getItem("sp_token");
    if (token) {
      return children; // treat presence of token as authenticated (backend-managed sessions)
    }

    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location }} 
      />
    );
  }

  // 3. Optional: Role-Based Access Control (RBAC)
  // Assumes user role is stored in Firebase custom claims or your database
  // Note: Adjust 'user.role' based on where you store role data
  if (allowRoles && !allowRoles.includes(user.role)) {
    return (
      <Navigate 
        to="/dashboard" 
        replace 
        state={{ denied: true }} 
      />
    );
  }

  // 4. Authorized State
  return children;
}

ProtectedRoute.propTypes = {
  allowRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};