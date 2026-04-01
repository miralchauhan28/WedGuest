import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "../services/api.js";
import { confirmLogout } from "../utils/swal.js";

function NavIcon({ name }) {
  if (name === "dashboard") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 2.5a8.5 8.5 0 1 0 8.5 8.5H11V2.5Z" fill="currentColor" />
        <path d="M12.5 2.63a8.52 8.52 0 0 1 6.87 6.87H12.5V2.63Z" fill="currentColor" opacity=".45" />
      </svg>
    );
  }
  if (name === "weddings") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19.5S4.5 15.3 4.5 9.8a3.7 3.7 0 0 1 6.5-2.4A3.7 3.7 0 0 1 17.5 9.8c0 5.5-6.5 9.7-6.5 9.7Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="14.5" cy="8.5" r="2.5" fill="currentColor" opacity=".75" />
        <path d="M2.5 17.5a5.5 5.5 0 0 1 11 0H2.5Z" fill="currentColor" />
        <path d="M11 17.5a4 4 0 0 1 8 0h-8Z" fill="currentColor" opacity=".75" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 21a2.01 2.01 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm7-5v-5a7 7 0 0 0-6-6.92V3a1 1 0 1 0-2 0v1.08A7 7 0 0 0 4 11v5l-1 1v1h16v-1l-1-1Zm-2 1H6v-6a5 5 0 0 1 10 0v6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    const ok = await confirmLogout();
    if (!ok) return;
    clearAuth();
    navigate("/");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin/dashboard" className="admin-logo">
          WEDGUEST
        </Link>
        <nav className="admin-side-nav">
          <Link
            to="/admin/dashboard"
            className={`admin-nav-item ${location.pathname === "/admin/dashboard" ? "is-active" : ""}`}
          >
            <span className="admin-nav-icon" aria-hidden><NavIcon name="dashboard" /></span>
            Dashboard
          </Link>
          <Link
            to="/admin/weddings"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/weddings") ? "is-active" : ""}`}
          >
            <span className="admin-nav-icon" aria-hidden><NavIcon name="weddings" /></span>
            Weddings
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/users") ? "is-active" : ""}`}
          >
            <span className="admin-nav-icon" aria-hidden><NavIcon name="users" /></span>
            Users
          </Link>
          <Link
            to="/admin/notifications"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/notifications") ? "is-active" : ""}`}
          >
            <span className="admin-nav-icon" aria-hidden><NavIcon name="notifications" /></span>
            Notifications
          </Link>
        </nav>
      </aside>

      <div className="admin-content-wrap">
        <header className="admin-topbar">
          <h1>Admin Dashboard</h1>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-top-logout" onClick={handleLogout}>
              <span aria-hidden>↪</span>
              Logout
            </button>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
