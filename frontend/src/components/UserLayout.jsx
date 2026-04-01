import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "../services/api.js";
import { confirmLogout } from "../utils/swal.js";

function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const dashActive = path === "/user/dashboard" || path === "/user";
  const guestsActive = path.startsWith("/user/weddings");
  const profileActive = path.startsWith("/user/profile");

  async function handleLogout() {
    const ok = await confirmLogout();
    if (!ok) return;
    clearAuth();
    navigate("/");
  }

  return (
    <div className="user-shell">
      <header className="user-header">
        <Link to="/user/dashboard" className="user-logo">
          WEDGUEST
        </Link>
        <button
          type="button"
          className="nav-toggle-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
        <nav className={`user-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main">
          <Link
            className={dashActive ? "nav-pill" : "nav-plain"}
            to="/user/dashboard"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            className={guestsActive ? "nav-pill" : "nav-plain"}
            to="/user/weddings"
            onClick={() => setMenuOpen(false)}
          >
            Manage Guests
          </Link>
          <Link
            className={profileActive ? "nav-pill" : "nav-plain"}
            to="/user/profile"
            onClick={() => setMenuOpen(false)}
          >
            My Profile
          </Link>
          <button type="button" className="nav-plain nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="user-main">
        <Outlet />
      </main>

      <footer className="user-footer">© 2026 WEDGUEST. All Rights Reserved.</footer>
    </div>
  );
}

export default UserLayout;
