import { useEffect, useMemo, useState } from "react";
import { apiGet, getStoredUser } from "../services/api.js";
import { showError } from "../utils/swal.js";

function formatLongDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" aria-hidden>
        {icon}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub ? <div className="stat-card-sub">{sub}</div> : null}
    </div>
  );
}

function PieChart({ confirmed, pending, declined }) {
  const total = confirmed + pending + declined;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const c = pct(confirmed);
  const p = pct(pending);
  const d = pct(declined);
  const cEnd = total ? (c / 100) * 360 : 0;
  const pEnd = total ? ((c + p) / 100) * 360 : 0;

  const gradient = total
    ? `conic-gradient(#22c55e 0deg ${cEnd}deg, #eab308 ${cEnd}deg ${pEnd}deg, #ef4444 ${pEnd}deg 360deg)`
    : "conic-gradient(#cbd5e1 0deg 360deg)";

  return (
    <div className="pie-wrap">
      <div
        className="pie-chart"
        style={{
          background: gradient,
          position: "relative",
          overflow: "visible",
        }}
        title="RSVP breakdown"
      >
        {total > 0 && (
          <>
            {/* Confirmed (Green area, should be in the middle upper right) */}
            {c > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `calc(50% + 34% * ${Math.cos(((c / 200) * 360 - 90) * (Math.PI / 180))})`,
                  top: `calc(50% + 34% * ${Math.sin(((c / 200) * 360 - 90) * (Math.PI / 180))})`,
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "1.15em",
                  pointerEvents: "none",
                  zIndex: 2,
                  textShadow: "0 0 8px #1a2217, 0 1px 1px #14532d",
                  background: "transparent",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  letterSpacing: "0.5px",
                  userSelect: "none",
                  minWidth: "2.5em",
                  textAlign: "center",
                }}
              >
                {`${c}%`}
              </div>
            )}
            {/* Pending (Yellow area, should be more lower center right area) */}
            {p > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `calc(50% + 34% * ${Math.cos(((c + p / 2) / 100 * 360 - 90) * (Math.PI / 180))})`,
                  top: `calc(50% + 34% * ${Math.sin(((c + p / 2) / 100 * 360 - 90) * (Math.PI / 180))})`,
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "1.15em",
                  pointerEvents: "none",
                  zIndex: 2,
                  textShadow: "0 0 8px #79630b, 0 1px 1px #78350f",
                  background: "transparent",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  letterSpacing: "0.5px",
                  userSelect: "none",
                  minWidth: "2.5em",
                  textAlign: "center",
                }}
              >
                {`${p}%`}
              </div>
            )}
            {/* Declined (Red area, left side and upper left for small values) */}
            {d > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `calc(50% + 34% * ${Math.cos(((c + p + d / 2) / 100 * 360 - 90) * (Math.PI / 180))})`,
                  top: `calc(50% + 34% * ${Math.sin(((c + p + d / 2) / 100 * 360 - 90) * (Math.PI / 180))})`,
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "1.15em",
                  pointerEvents: "none",
                  zIndex: 2,
                  textShadow: "0 0 8px #7f1d1d, 0 1px 1px #450a0a",
                  background: "transparent",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  letterSpacing: "0.5px",
                  userSelect: "none",
                  minWidth: "2.5em",
                  textAlign: "center",
                }}
              >
                {`${d}%`}
              </div>
            )}
          </>
        )}
        {!total && (
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center",
              color: "#94a3b8",
              fontWeight: 700,
              fontSize: "1.2em",
              userSelect: "none",
            }}
          >
            —
          </div>
        )}
      </div>
      <ul className="pie-legend">
        <li>
          <span className="dot dot--g" /> Confirmed {total ? `${c}% (${confirmed})` : "—"}
        </li>
        <li>
          <span className="dot dot--y" /> Pending {total ? `${p}% (${pending})` : "—"}
        </li>
        <li>
          <span className="dot dot--r" /> Declined {total ? `${d}% (${declined})` : "—"}
        </li>
      </ul>
    </div>
  );
}

function UserDashboardPage() {
  const user = getStoredUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet("/api/user/dashboard");
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) showError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats;
  const breakdown = data?.attendanceBreakdown || { confirmed: 0, pending: 0, declined: 0 };
  const upcoming = data?.upcomingWeddings || [];

  const maxDays = useMemo(() => {
    const uw = data?.upcomingWeddings || [];
    const ds = uw.map((w) => Math.max(0, w.daysUntil ?? 0));
    return ds.length ? Math.max(...ds, 1) : 1;
  }, [data?.upcomingWeddings]);

  return (
    <div className="user-page">
      <h1 className="user-greeting">Welcome, {user?.name || "User"}!</h1>

      {loading ? (
        <p className="user-muted">Loading dashboard…</p>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Weddings Created"
              value={stats?.weddingsCount ?? 0}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21c-4.8-4.2-8-7.12-8-10.5C4 6.42 7.42 3 12 7.4 16.58 3 20 6.42 20 10.5c0 3.38-3.2 6.3-8 10.5z" />
                </svg>
              }
            />
            <StatCard
              label="Total Guests"
              value={stats?.totalGuests ?? 0}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M16 11a4 4 0 1 0-8 0" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              }
            />
            <StatCard
              label="Confirmed RSVPs"
              value={stats?.accepted ?? 0}
              sub={stats?.totalGuests ? `${stats.rsvpPct}% of all guests` : undefined}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            />
          </div>

          <div className="dash-grid-2">
            <section className="panel-card">
              <h2 className="panel-title">Guest Attendance Breakdown</h2>
              <PieChart
                confirmed={breakdown.confirmed}
                pending={breakdown.pending}
                declined={breakdown.declined}
              />
            </section>

            <section className="panel-card">
              <h2 className="panel-title">Upcoming Weddings Timeline</h2>
              {upcoming.length === 0 ? (
                <p className="user-muted">No weddings yet. Create one from Manage Guests.</p>
              ) : (
                <div className="timeline">
                  <div className="timeline-axis">
                    <span>0</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>400</span>
                  </div>
                  {upcoming.map((w) => {
                    const days = Math.max(0, w.daysUntil ?? 0);
                    const widthPct = Math.min(100, Math.max(12, (days / maxDays) * 100));
                    return (
                      <div key={w._id} className="timeline-row">
                        <div className="timeline-row-top">
                          <span className="timeline-names">{w.coupleName}</span>
                          <span className="timeline-date">{formatLongDate(w.weddingDate)}</span>
                        </div>
                        <div className="timeline-bar-track">
                          <div className="timeline-bar-fill" style={{ width: `${widthPct}%` }} />
                        </div>
                        <div className="timeline-countdown">In {days} Days</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default UserDashboardPage;
