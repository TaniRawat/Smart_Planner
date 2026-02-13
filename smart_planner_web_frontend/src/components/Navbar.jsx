// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

/**
 * Professional Navbar with:
 * - Avatar-based dropdown
 * - Mobile-friendly collapsed menu
 * - Smooth transitions
 * - Clear visual hierarchy
 * - Logout confirmation pattern
 */
export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    onLogout?.();
    navigate("/login");
  };

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white group-hover:scale-110 transition">
            SP
          </span>
          <span className="font-semibold text-slate-50 group-hover:text-white transition">
            Smart Study Planner
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-500 px-3 py-1 font-medium text-white hover:bg-indigo-400 transition"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className={`transition ${location.pathname.startsWith("/dashboard") ? "text-white" : "text-slate-300 hover:text-white"}`}
              >
                Dashboard
              </Link>
              <Link
                to="/notes"
                className={`transition ${location.pathname.startsWith("/notes") ? "text-white" : "text-slate-300 hover:text-white"}`}
              >
                Notes
              </Link>
              {/* Avatar → Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-full border border-slate-700 p-1 hover:bg-slate-800 transition"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-100">
                    {avatarLetter}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-lg py-2 animate-fadeIn"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <p className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800">
                      {user.email}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden flex items-center justify-center h-8 w-8 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <span className="text-lg">&times;</span>
          ) : (
            <span className="text-lg">&#9776;</span>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 animate-slideDown">
          {!user ? (
            <div className="flex flex-col gap-3 text-sm">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white transition"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-500 px-3 py-1 font-medium text-white hover:bg-indigo-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/notes"
                className="text-slate-300 hover:text-white transition"
                onClick={() => setMenuOpen(false)}
              >
                Notes
              </Link>
              <div className="text-slate-400 text-xs py-1">{user.email}</div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-3 py-1 text-slate-100 hover:bg-slate-800 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
