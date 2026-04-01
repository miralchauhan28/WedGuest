import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { apiDelete, apiGet, apiPost, apiPut } from "../services/api.js";
import { confirmDeleteGuest, showError, showSuccess } from "../utils/swal.js";

function emptyForm() {
  return { name: "", email: "", isActive: true };
}

function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

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
    if (status) qs.set("status", status);
    return qs.toString();
  }, [page, search, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/admin/users?${query}`);
      setRows(res.users || []);
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

  function openAdd() {
    setForm(emptyForm());
    setAddOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, isActive: !!u.isActive });
    setEditOpen(true);
  }

  async function createUser(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/admin/users", { name: form.name, email: form.email });
      showSuccess("User created.");
      setAddOpen(false);
      load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(e) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiPut(`/api/admin/users/${editing.id}`, {
        name: form.name,
        email: form.email,
        isActive: !!form.isActive,
      });
      showSuccess("User updated.");
      setEditOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(u) {
    const ok = await confirmDeleteGuest(u.name);
    if (!ok) return;
    try {
      await apiDelete(`/api/admin/users/${u.id}`);
      showSuccess("User deleted.");
      load();
    } catch (err) {
      showError(err.message);
    }
  }

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
        <div className="guest-filters">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button type="button" className="btn-white btn-em" onClick={openAdd}>
          + Add New
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Weddings Created</th>
              <th>Active Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading users…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5}>No users found.</td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.weddingsCreated}</td>
                  <td>{u.isActive ? "Active" : "Inactive"}</td>
                  <td className="row-actions">
                    <button type="button" className="icon-btn" onClick={() => openEdit(u)}>
                      ✎
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => removeUser(u)}>
                      🗑
                    </button>
                  </td>
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

      <Modal
        title="Add New User"
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setAddOpen(false)}>
              Close
            </button>
            <button type="submit" form="admin-add-user" className="btn-primary" disabled={saving}>
              Save
            </button>
          </>
        }
      >
        <form id="admin-add-user" className="modal-form" onSubmit={createUser}>
          <label>
            Name
            <input required minLength={2} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </label>
        </form>
      </Modal>

      <Modal
        title={editing ? `Edit User — ${editing.name}` : "Edit User"}
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setEditOpen(false)}>
              Close
            </button>
            <button type="submit" form="admin-edit-user" className="btn-primary" disabled={saving}>
              Save
            </button>
          </>
        }
      >
        <form id="admin-edit-user" className="modal-form" onSubmit={updateUser}>
          <label>
            Name
            <input required minLength={2} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </label>
          <label>
            Status
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}

export default AdminUsersPage;
