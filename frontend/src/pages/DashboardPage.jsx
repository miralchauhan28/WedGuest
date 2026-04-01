import { useMemo } from "react";

function DashboardPage() {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("wedguest_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const title = user?.role === "admin" ? "Admin Dashboard" : "User Dashboard";

  return (
    <div className="page-center dark-bg">
      <div className="card">
        <h2>{title}</h2>
        <p className="subtext">Welcome {user?.name || "Guest"}.</p>
      </div>
    </div>
  );
}

export default DashboardPage;
