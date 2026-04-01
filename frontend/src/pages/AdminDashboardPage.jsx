function AdminDashboardPage() {
  return (
    <div className="user-page">
      <h1 className="user-page-title">Admin Dashboard</h1>
      <div className="panel-card admin-intro">
        <p className="user-muted">
          This is the administrator area. User-facing wedding and guest management lives under{" "}
          <strong>/user</strong> routes.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
