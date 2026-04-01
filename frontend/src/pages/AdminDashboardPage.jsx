import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../services/api.js";
import { showError, showSuccess } from "../utils/swal.js";

function Stat({ label, value }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet("/api/admin/dashboard");
      setData(res);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const maxMonth = useMemo(() => {
    const counts = (data?.weddingsPerMonth || []).map((x) => x.count || 0);
    return Math.max(1, ...counts);
  }, [data?.weddingsPerMonth]);

  async function markRead(id) {
    try {
      await apiPatch(`/api/admin/notifications/${id}/read`, {});
      showSuccess("Marked as read.");
      load();
    } catch (err) {
      showError(err.message);
    }
  }

  if (loading) return <p className="user-muted">Loading admin dashboard…</p>;

  const stats = data?.stats || {};
  const rsvp = data?.rsvpBreakdown || {};
  const users = data?.userStatus || {};
  const totalRsvp = (rsvp.accepted || 0) + (rsvp.pending || 0) + (rsvp.declined || 0);
  const acceptedPct = totalRsvp ? Math.round(((rsvp.accepted || 0) / totalRsvp) * 100) : 0;
  const pendingPct = totalRsvp ? Math.round(((rsvp.pending || 0) / totalRsvp) * 100) : 0;
  const declinedPct = Math.max(0, 100 - acceptedPct - pendingPct);
  const totalUsers = (users.active || 0) + (users.inactive || 0);
  const activePct = totalUsers ? Math.round(((users.active || 0) / totalUsers) * 100) : 0;

  return (
    <div className="admin-page">
      <div className="admin-stats-grid">
        <Stat label="Total Weddings" value={stats.totalWeddings || 0} />
        <Stat label="Total Users" value={stats.totalUsers || 0} />
        <Stat label="Total Guests" value={stats.totalGuests || 0} />
        <Stat label="RSVP Pending" value={stats.pendingRsvp || 0} />
      </div>

      <div className="admin-panels-3">
        <section className="admin-panel">
          <h3>RSVP Breakdown</h3>
          <div
            className="admin-pie"
            style={{
              background: `conic-gradient(#2f855a 0deg ${acceptedPct * 3.6}deg, #ecc94b ${acceptedPct * 3.6}deg ${(acceptedPct + pendingPct) * 3.6}deg, #e53e3e ${(acceptedPct + pendingPct) * 3.6}deg 360deg)`,
            }}
          />
          <p className="admin-mini-row">
            Accepted {acceptedPct}% • Pending {pendingPct}% • Declined {declinedPct}%
          </p>
        </section>

        <section className="admin-panel">
          <h3>Weddings Per Month</h3>
          <div className="admin-bars">
            {(data?.weddingsPerMonth || []).map((m) => (
              <div key={m.label} className="admin-bar-col">
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                </div>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <h3>User Status</h3>
          <div
            className="admin-pie"
            style={{
              background: `conic-gradient(#4c84e6 0deg ${activePct * 3.6}deg, #ef4444 ${activePct * 3.6}deg 360deg)`,
            }}
          />
          <p className="admin-mini-row">Active {activePct}% • Inactive {Math.max(0, 100 - activePct)}%</p>
        </section>
      </div>

      <section className="admin-panel admin-noti-preview">
        <h3>Latest Notifications</h3>
        {(data?.latestNotifications || []).length === 0 ? (
          <p className="user-muted">No notifications.</p>
        ) : (
          (data?.latestNotifications || []).map((n) => (
            <div key={n._id} className={`admin-noti-row ${n.isRead ? "is-read" : ""}`}>
              <p>{n.message}</p>
              <button type="button" className="icon-btn" onClick={() => markRead(n._id)} disabled={n.isRead}>
                ✓
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
