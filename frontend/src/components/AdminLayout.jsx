import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "../services/api.js";
import { confirmLogout } from "../utils/swal.js";

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
            Dashboard
          </Link>
          <Link
            to="/admin/weddings"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/weddings") ? "is-active" : ""}`}
          >
            Weddings
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/users") ? "is-active" : ""}`}
          >
            Users
          </Link>
          <Link
            to="/admin/notifications"
            className={`admin-nav-item ${location.pathname.startsWith("/admin/notifications") ? "is-active" : ""}`}
          >
            Notifications
          </Link>
        </nav>
        <button type="button" className="admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="admin-content-wrap">
        <header className="admin-topbar">
          <h1>Admin Dashboard</h1>
          <div className="admin-avatar">◉</div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
