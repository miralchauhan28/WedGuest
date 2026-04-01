import { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination.jsx";
import { apiDelete, apiGet, apiPatch } from "../services/api.js";
import { showError, showSuccess } from "../utils/swal.js";

function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", "10");
    return qs.toString();
  }, [page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/admin/notifications?${query}`);
      setRows(res.notifications || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id) {
    try {
      await apiPatch(`/api/admin/notifications/${id}/read`, {});
      showSuccess("Notification marked as read.");
      load();
    } catch (err) {
      showError(err.message);
    }
  }

  async function clearAll() {
    try {
      await apiDelete("/api/admin/notifications");
      showSuccess("All notifications cleared.");
      setPage(1);
      load();
    } catch (err) {
      showError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <section className="admin-panel admin-noti-page">
        <div className="admin-noti-head">
          <h3>Notifications</h3>
          <div className="user-actions">
            <button type="button" className="btn-white btn-sm" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <p className="user-muted">Loading notifications…</p>
        ) : rows.length === 0 ? (
          <p className="user-muted">No notifications.</p>
        ) : (
          rows.map((n) => (
            <div key={n._id} className={`admin-noti-row ${n.isRead ? "is-read" : ""}`}>
              <p>{n.message}</p>
              <button type="button" className="icon-btn" onClick={() => markRead(n._id)} disabled={n.isRead}>
                ✓
              </button>
            </div>
          ))
        )}
      </section>
      <div className="table-foot">
        <div />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default AdminNotificationsPage;
