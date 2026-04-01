import { Link, Outlet, useNavigate } from "react-router-dom";
import { clearAuth } from "../services/api.js";
import { confirmLogout } from "../utils/swal.js";

function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    const ok = await confirmLogout();
    if (!ok) return;
    clearAuth();
    navigate("/");
  }

  return (
    <div className="user-shell">
      <header className="user-header">
        <Link to="/admin/dashboard" className="user-logo">
          WEDGUEST
        </Link>
        <button type="button" className="btn-white btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="user-main">
        <Outlet />
      </main>
      <footer className="user-footer">© 2026 WEDGUEST. All Rights Reserved.</footer>
    </div>
  );
}

export default AdminLayout;
