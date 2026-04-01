import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPost, apiPut } from "../services/api.js";
import Modal from "../components/Modal.jsx";
import { confirmDeleteWedding, showError, showSuccess } from "../utils/swal.js";

function formatLongDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function toInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function WeddingCard({ wedding, onEdit, onDelete, onOpen }) {
  return (
    <button type="button" className="wedding-card" onClick={() => onOpen(wedding)}>
      <div className="wedding-card-top">
        <h3 className="wedding-card-title">{wedding.coupleName}</h3>
        <div className="wedding-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn" aria-label="Edit wedding" onClick={() => onEdit(wedding)}>
            ✎
          </button>
          <button type="button" className="icon-btn danger" aria-label="Delete wedding" onClick={() => onDelete(wedding)}>
            🗑
          </button>
        </div>
      </div>
      <div className="wedding-card-body">
        <div className="wedding-card-meta">
          <p>
            <span aria-hidden>♥</span> {formatLongDate(wedding.weddingDate)}
          </p>
          <p>
            <span aria-hidden>📍</span> {wedding.location}
          </p>
          <p>
            <span aria-hidden>👤</span> Guests: {wedding.guestCount ?? 0}
          </p>
        </div>
        <div className="wedding-card-art" aria-hidden>
          <svg viewBox="0 0 120 100" width="120" height="100">
            {/* Heart shape */}
            <path
              d="M60 88 C20 55 8 35 8 22 C8 10 18 4 30 4 C42 4 52 14 60 28 C68 14 78 4 90 4 C102 4 112 10 112 22 C112 35 100 55 60 88Z"
              fill="#e33e3e"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

function WeddingsPage() {
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({ coupleName: "", weddingDate: "", location: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/api/weddings");
      setWeddings(res.weddings || []);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm({ coupleName: "", weddingDate: "", location: "" });
    setAddOpen(true);
  }

  function openEdit(w) {
    setEditing(w);
    setForm({
      coupleName: w.coupleName || "",
      weddingDate: toInputDate(w.weddingDate),
      location: w.location || "",
    });
    setEditOpen(true);
  }

  async function saveNew(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/weddings", {
        coupleName: form.coupleName,
        weddingDate: form.weddingDate,
        location: form.location,
      });
      showSuccess("Wedding created.");
      setAddOpen(false);
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiPut(`/api/weddings/${editing._id}`, {
        coupleName: form.coupleName,
        weddingDate: form.weddingDate,
        location: form.location,
      });
      showSuccess("Wedding updated.");
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(w) {
    const ok = await confirmDeleteWedding(w.coupleName);
    if (!ok) return;
    try {
      await apiDelete(`/api/weddings/${w._id}`);
      showSuccess("Wedding deleted.");
      await load();
    } catch (err) {
      showError(err.message);
    }
  }

  function goGuests(w) {
    navigate(`/user/weddings/${w._id}/guests`);
  }

  return (
    <div className="user-page">
      <div className="user-page-head">
        <h1 className="user-page-title">Manage Wedding Guests</h1>
        <button type="button" className="btn-white" onClick={openAdd}>
          + Add New
        </button>
      </div>

      {loading ? (
        <p className="user-muted">Loading weddings…</p>
      ) : weddings.length === 0 ? (
        <div className="empty-panel">
          <p>No weddings yet.</p>
          <button type="button" className="btn-white" onClick={openAdd}>
            + Add your first wedding
          </button>
        </div>
      ) : (
        <div className="wedding-grid">
          {weddings.map((w) => (
            <WeddingCard key={w._id} wedding={w} onEdit={openEdit} onDelete={confirmDelete} onOpen={goGuests} />
          ))}
        </div>
      )}

      <Modal
        title="Add New Wedding Card"
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setAddOpen(false)}>
              Close
            </button>
            <button type="submit" form="add-wedding-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="add-wedding-form" className="modal-form" onSubmit={saveNew}>
          <label>
            Name
            <input
              required
              minLength={2}
              value={form.coupleName}
              onChange={(e) => setForm((f) => ({ ...f, coupleName: e.target.value }))}
              placeholder="Example: Jake & Chloe"
            />
          </label>
          <label>
            Date
            <input
              type="date"
              required
              value={form.weddingDate}
              onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
            />
          </label>
          <label>
            Location
            <input
              required
              minLength={2}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Example: Brisbane"
            />
          </label>
        </form>
      </Modal>

      <Modal
        title={editing ? `Edit Wedding Card — ${editing.coupleName}` : "Edit Wedding Card"}
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setEditOpen(false)}>
              Close
            </button>
            <button type="submit" form="edit-wedding-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="edit-wedding-form" className="modal-form" onSubmit={saveEdit}>
          <label>
            Name
            <input
              required
              minLength={2}
              value={form.coupleName}
              onChange={(e) => setForm((f) => ({ ...f, coupleName: e.target.value }))}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              required
              value={form.weddingDate}
              onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
            />
          </label>
          <label>
            Location
            <input
              required
              minLength={2}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}

export default WeddingsPage;
