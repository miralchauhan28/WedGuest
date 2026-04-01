import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination.jsx";
import { apiGet } from "../services/api.js";
import { showError } from "../utils/swal.js";

function AdminWeddingsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", "12");
    if (search) qs.set("search", search);
    return qs.toString();
  }, [page, search]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/api/admin/weddings?${query}`);
        setRows(res.weddings || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  return (
    <div className="admin-page">
      <div className="guest-toolbar">
        <div className="guest-search admin-search-full">
          <span aria-hidden>☰</span>
          <input
            type="search"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <span aria-hidden>⌕</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Wedding</th>
              <th>Date</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Loading weddings…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No weddings found.</td>
              </tr>
            ) : (
              rows.map((w) => (
                <tr key={w._id}>
                  <td>{w.userName}</td>
                  <td>{w.coupleName}</td>
                  <td>{new Date(w.weddingDate).toLocaleDateString("en-AU")}</td>
                  <td>{w.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-foot">
          <div />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

export default AdminWeddingsPage;
