import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../services/api.js";
import { showError } from "../utils/swal.js";

function Stat({ label, value }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

function PieSliceLabels({ values, colors }) {
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const slices = values.map((v, idx) => {
    const before = values.slice(0, idx).reduce((a, b) => a + b, 0);
    const start = before / total;
    const end = (before + v) / total;
    return { v, idx, start, end };
  });

  return (
    <>
      {slices.map(({ v, idx, start, end }) => {
        if (!v) return null;
        const mid = (start + end) / 2;
        const angle = mid * Math.PI * 2 - Math.PI / 2;
        const r = 74;
        const x = 110 + Math.cos(angle) * r;
        const y = 110 + Math.sin(angle) * r;
        const pct = Math.round((v / total) * 100);
        return (
          <span
            key={`${idx}-${v}`}
            className="admin-pie-label"
            style={{ left: `${x}px`, top: `${y}px`, borderColor: colors[idx] }}
          >
            {pct}%
          </span>
        );
      })}
    </>
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

  const maxTopGuests = useMemo(() => {
    const counts = (data?.topWeddingsByGuests || []).map((x) => x.guestCount || 0);
    return Math.max(1, ...counts);
  }, [data?.topWeddingsByGuests]);

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
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weddingsSeries = (data?.weddingsPerMonth || []).length
    ? data.weddingsPerMonth
    : monthLabels.map((label) => ({ label, count: 0 }));
  const topWeddings = data?.topWeddingsByGuests || [];

  return (
    <div className="admin-page">
      <div className="admin-stats-grid">
        <Stat label="Total Weddings" value={stats.totalWeddings || 0} />
        <Stat label="Total Users" value={stats.totalUsers || 0} />
        <Stat label="Total Guests" value={stats.totalGuests || 0} />
        <Stat label="RSVP Pending" value={stats.pendingRsvp || 0} />
      </div>

      <div className="admin-charts-row">
        <section className="admin-panel">
          <h3>RSVP Breakdown</h3>
          <div className="admin-pie-wrap">
            <div
              className="admin-pie"
              style={{
                background: `conic-gradient(#2f855a 0deg ${acceptedPct * 3.6}deg, #ecc94b ${acceptedPct * 3.6}deg ${(acceptedPct + pendingPct) * 3.6}deg, #e53e3e ${(acceptedPct + pendingPct) * 3.6}deg 360deg)`,
              }}
            />
            <PieSliceLabels values={[rsvp.accepted || 0, rsvp.pending || 0, rsvp.declined || 0]} colors={["#2f855a", "#ecc94b", "#e53e3e"]} />
          </div>
          <div className="admin-pie-legend">
            <p><span className="dot dot--g" /> Confirmed {acceptedPct}% ({rsvp.accepted || 0})</p>
            <p><span className="dot dot--y" /> Pending {pendingPct}% ({rsvp.pending || 0})</p>
            <p><span className="dot dot--r" /> Declined {declinedPct}% ({rsvp.declined || 0})</p>
          </div>
        </section>

        <section className="admin-panel">
          <h3>User Status</h3>
          <div className="admin-pie-wrap">
            <div
              className="admin-pie"
              style={{
                background: `conic-gradient(#4c84e6 0deg ${activePct * 3.6}deg, #ef4444 ${activePct * 3.6}deg 360deg)`,
              }}
            />
            <PieSliceLabels values={[users.active || 0, users.inactive || 0]} colors={["#4c84e6", "#ef4444"]} />
          </div>
          <div className="admin-pie-legend">
            <p><span className="dot dot--b" /> Active {activePct}% ({users.active || 0})</p>
            <p><span className="dot dot--r" /> Inactive {Math.max(0, 100 - activePct)}% ({users.inactive || 0})</p>
          </div>
        </section>
      </div>

      <div className="admin-bars-row">
        <section className="admin-panel admin-bar-panel">
          <h3>Weddings Per Month</h3>
          <div className="admin-bars">
            {weddingsSeries.map((m) => (
              <div key={m.label} className="admin-bar-col">
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                </div>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-bar-panel">
          <h3>Top Weddings By Guest Count</h3>
          {topWeddings.length === 0 ? (
            <p className="admin-mini-row">No guest data yet.</p>
          ) : (
            <div className="admin-hbars">
              {topWeddings.map((w) => (
                <div key={w.weddingId} className="admin-hbar-row">
                  <div className="admin-hbar-label">{w.coupleName}</div>
                  <div className="admin-hbar-track">
                    <div
                      className="admin-hbar-fill"
                      style={{ width: `${(w.guestCount / maxTopGuests) * 100}%` }}
                    />
                  </div>
                  <div className="admin-hbar-value">{w.guestCount}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel admin-noti-preview">
        <div className="admin-noti-head">
          <h3>Latest Notifications</h3>
          <p className="admin-noti-help">
            To mark as read or clear notifications, go to{" "}
            <Link to="/admin/notifications">Notifications</Link>.
          </p>
        </div>
        {(data?.latestNotifications || []).length === 0 ? (
          <p className="user-muted">No notifications.</p>
        ) : (
          (data?.latestNotifications || []).map((n) => (
            <div key={n._id} className={`admin-noti-row ${n.isRead ? "is-read" : ""}`}>
              <p>{n.message}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
