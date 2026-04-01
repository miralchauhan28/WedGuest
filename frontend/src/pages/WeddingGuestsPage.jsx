import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiRequest,
  downloadBlob,
} from "../services/api.js";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { confirmDeleteGuest, showError, showSuccess } from "../utils/swal.js";

const MEAL_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Gluten-free", "Standard", "Other"];
const RSVP_OPTIONS = ["Pending", "Accepted", "Declined"];
const ATTENDEE_OPTIONS = ["Yes", "No"];

function emptyGuestForm() {
  return {
    name: "",
    email: "",
    phone: "",
    attendee: "",
    mealPreference: "",
    rsvpStatus: "Pending",
  };
}

function GuestFormFields({ form, onChange, readOnly }) {
  const ro = readOnly ? { readOnly: true } : {};
  return (
    <>
      <label>
        Name
        <input
          {...ro}
          required={!readOnly}
          minLength={readOnly ? undefined : 2}
          value={form.name}
          onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))}
          placeholder="Enter guest's name"
        />
      </label>
      <label>
        Email
        <input
          {...ro}
          type="email"
          required={!readOnly}
          value={form.email}
          onChange={(e) => onChange((f) => ({ ...f, email: e.target.value }))}
          placeholder="Enter guest's email id"
        />
      </label>
      <label>
        Phone
        <input
          {...ro}
          required={!readOnly}
          minLength={readOnly ? undefined : 6}
          value={form.phone}
          onChange={(e) => onChange((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Enter guest's phone number"
        />
      </label>
      <label>
        Attendee
        {readOnly ? (
          <input readOnly value={form.attendee} />
        ) : (
          <select
            required
            value={form.attendee}
            onChange={(e) => onChange((f) => ({ ...f, attendee: e.target.value }))}
          >
            <option value="">Select…</option>
            {ATTENDEE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </label>
      <label>
        Meal Preference
        {readOnly ? (
          <input readOnly value={form.mealPreference} />
        ) : (
          <select
            value={form.mealPreference}
            onChange={(e) => onChange((f) => ({ ...f, mealPreference: e.target.value }))}
          >
            <option value="">Select…</option>
            {MEAL_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </label>
      <label>
        RSVP
        {readOnly ? (
          <input readOnly value={form.rsvpStatus} />
        ) : (
          <select
            required
            value={form.rsvpStatus}
            onChange={(e) => onChange((f) => ({ ...f, rsvpStatus: e.target.value }))}
          >
            {RSVP_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </label>
    </>
  );
}

function WeddingGuestsPage() {
  const { weddingId } = useParams();
  const fileRef = useRef(null);

  const [weddingTitle, setWeddingTitle] = useState("");
  const [weddingDetails, setWeddingDetails] = useState(null);
  const [guests, setGuests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [mealFilter, setMealFilter] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeGuest, setActiveGuest] = useState(null);
  const [form, setForm] = useState(emptyGuestForm);
  const [saving, setSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSearchInput("");
    setSearch("");
    setAttendeeFilter("");
    setMealFilter("");
    setRsvpFilter("");
    setPage(1);
  }, [weddingId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", "10");
    if (search) qs.set("search", search);
    if (attendeeFilter) qs.set("attendee", attendeeFilter);
    if (mealFilter) qs.set("mealPref", mealFilter);
    if (rsvpFilter) qs.set("rsvp", rsvpFilter);
    return qs.toString();
  }, [page, search, attendeeFilter, mealFilter, rsvpFilter]);

  const loadWedding = useCallback(async () => {
    const res = await apiGet(`/api/weddings/${weddingId}`);
    setWeddingTitle(res.wedding?.coupleName || "Wedding");
    setWeddingDetails(res.wedding || null);
  }, [weddingId]);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/weddings/${weddingId}/guests?${queryString}`);
      setGuests(res.guests || []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      showError(e.message);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [weddingId, queryString]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadWedding();
      } catch (e) {
        if (!cancelled) showError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWedding]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  useEffect(() => {
    const id = setInterval(() => {
      loadGuests();
    }, 15000);
    return () => clearInterval(id);
  }, [loadGuests]);

  function openAdd() {
    setForm(emptyGuestForm());
    setAddOpen(true);
  }

  function openEdit(g) {
    setActiveGuest(g);
    setForm({
      name: g.name || "",
      email: g.email || "",
      phone: g.phone || "",
      attendee: g.attendee || "",
      mealPreference: g.mealPreference || "",
      rsvpStatus: g.rsvpStatus || "Pending",
    });
    setEditOpen(true);
  }

  function openView(g) {
    setActiveGuest(g);
    setForm({
      name: g.name || "",
      email: g.email || "",
      phone: g.phone || "",
      attendee: g.attendee || "",
      mealPreference: g.mealPreference || "",
      rsvpStatus: g.rsvpStatus || "Pending",
    });
    setViewOpen(true);
  }

  async function saveNew(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost(`/api/weddings/${weddingId}/guests`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        attendee: form.attendee,
        mealPreference: form.mealPreference,
        rsvpStatus: form.rsvpStatus,
      });
      showSuccess("Guest added.");
      setAddOpen(false);
      setPage(1);
      await loadGuests();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!activeGuest) return;
    setSaving(true);
    try {
      await apiPut(`/api/weddings/${weddingId}/guests/${activeGuest._id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        attendee: form.attendee,
        mealPreference: form.mealPreference,
        rsvpStatus: form.rsvpStatus,
      });
      showSuccess("Guest updated.");
      setEditOpen(false);
      setActiveGuest(null);
      await loadGuests();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(g) {
    const ok = await confirmDeleteGuest(g.name);
    if (!ok) return;
    try {
      await apiDelete(`/api/weddings/${weddingId}/guests/${g._id}`);
      showSuccess("Guest removed.");
      await loadGuests();
    } catch (err) {
      showError(err.message);
    }
  }

  async function onDownloadTemplate() {
    try {
      await downloadBlob(`/api/weddings/${weddingId}/guests/template`, "wedguest-guests-template.csv");
      showSuccess("Template downloaded.");
    } catch (e) {
      showError(e.message);
    }
  }

  async function onBulkFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiRequest(`/api/weddings/${weddingId}/guests/bulk`, {
        method: "POST",
        body: fd,
      });
      const extra =
        res.errors?.length > 0
          ? ` Some rows were skipped: ${res.errors
              .slice(0, 5)
              .map((x) => `row ${x.row}`)
              .join(", ")}${res.errors.length > 5 ? "…" : ""}.`
          : "";
      showSuccess((res.message || "Upload complete.") + extra);
      await loadGuests();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function fetchAllGuestsForExport() {
    const all = [];
    let currentPage = 1;
    let pages = 1;
    do {
      const res = await apiGet(`/api/weddings/${weddingId}/guests?page=${currentPage}&limit=50`);
      all.push(...(res.guests || []));
      pages = res.totalPages || 1;
      currentPage += 1;
    } while (currentPage <= pages);
    return all;
  }

  function sanitizeFileName(name) {
    return String(name || "wedding")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "wedding";
  }

  function toCsv(guestRows) {
    const headers = ["Name", "Email", "Phone", "Attendee", "Meal Pref", "RSVP Status"];
    const lines = [headers.join(",")];
    for (const g of guestRows) {
      const cells = [
        g.name || "",
        g.email || "",
        g.phone || "",
        g.attendee || "",
        g.mealPreference || "",
        g.rsvpStatus || "",
      ].map((x) => `"${String(x).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    return lines.join("\r\n");
  }

  function weddingDateText(dateIso) {
    if (!dateIso) return "N/A";
    return new Date(dateIso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  async function exportExcelCsv() {
    setExportOpen(false);
    setExporting(true);
    try {
      const allGuests = await fetchAllGuestsForExport();
      const csv = toCsv(allGuests);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = sanitizeFileName(weddingTitle);
      a.href = url;
      a.download = `${base}-guests.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("Guest CSV downloaded.");
    } catch (err) {
      showError(err.message || "Could not export CSV.");
    } finally {
      setExporting(false);
    }
  }

  async function exportPdf() {
    setExportOpen(false);
    setExporting(true);
    try {
      const allGuests = await fetchAllGuestsForExport();
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const navy = [5, 10, 36];
      const light = [245, 247, 252];

      doc.setFillColor(...navy);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 74, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("WEDGUEST", 40, 46);

      doc.setTextColor(...navy);
      doc.setFontSize(16);
      doc.text("Wedding Guest Report", 40, 105);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Wedding: ${weddingDetails?.coupleName || weddingTitle || "N/A"}`, 40, 128);
      doc.text(`Date: ${weddingDateText(weddingDetails?.weddingDate)}`, 40, 146);
      doc.text(`Location: ${weddingDetails?.location || "N/A"}`, 40, 164);
      doc.text(`Total Guests: ${allGuests.length}`, 40, 182);

      autoTable(doc, {
        startY: 204,
        head: [["Name", "Email", "Phone", "Attendee", "Meal Pref", "RSVP"]],
        body: allGuests.map((g) => [
          g.name || "",
          g.email || "",
          g.phone || "",
          g.attendee || "",
          g.mealPreference || "-",
          g.rsvpStatus || "",
        ]),
        styles: { fontSize: 10, cellPadding: 6, textColor: [17, 24, 39] },
        headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: light },
        tableLineColor: [223, 228, 239],
        tableLineWidth: 0.5,
        margin: { left: 40, right: 40 },
      });

      const base = sanitizeFileName(weddingTitle);
      doc.save(`${base}-guests.pdf`);
      showSuccess("Guest PDF downloaded.");
    } catch (err) {
      showError(err.message || "Could not export PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="user-page">
      <div className="user-page-head">
        <div>
          <Link className="user-back" to="/user/weddings">
            ← Weddings
          </Link>
          <h1 className="user-page-title">Manage Guests — {weddingTitle}</h1>
        </div>
        <div className="user-actions">
          <button type="button" className="btn-white" onClick={onDownloadTemplate}>
            ⬇ Download Template
          </button>
          <button type="button" className="btn-white" onClick={() => fileRef.current?.click()} disabled={saving}>
            ＋ Upload Template
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={onBulkFile}
          />
          <button type="button" className="btn-white btn-em" onClick={openAdd}>
            ＋ Add New
          </button>
        </div>
      </div>

      <div className="guest-toolbar">
        <div className="guest-search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="guest-filters">
          <select value={attendeeFilter} onChange={(e) => { setAttendeeFilter(e.target.value); setPage(1); }}>
            <option value="">Attendee</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <select value={mealFilter} onChange={(e) => { setMealFilter(e.target.value); setPage(1); }}>
            <option value="">Meal pref</option>
            {MEAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select value={rsvpFilter} onChange={(e) => { setRsvpFilter(e.target.value); setPage(1); }}>
            <option value="">RSVP status</option>
            {RSVP_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="user-muted">Loading guests…</p>
      ) : guests.length === 0 ? (
        <div className="empty-panel">
          <p>
            {total === 0 && !search && !attendeeFilter && !mealFilter && !rsvpFilter
              ? "No guests yet for this wedding."
              : "No guests match your search or filters."}
          </p>
          <button type="button" className="btn-white" onClick={openAdd}>
            Add a guest
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Attendee</th>
                <th>Meal Pref</th>
                <th>RSVP Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g._id}>
                  <td>
                    <button type="button" className="linkish" onClick={() => openView(g)}>
                      {g.name}
                    </button>
                  </td>
                  <td>{g.email}</td>
                  <td>{g.phone}</td>
                  <td>{g.attendee}</td>
                  <td>{g.mealPreference || "—"}</td>
                  <td>{g.rsvpStatus}</td>
                  <td className="row-actions">
                    <button type="button" className="icon-btn" aria-label="View guest" onClick={() => openView(g)}>
                      👁
                    </button>
                    <button type="button" className="icon-btn" aria-label="Edit guest" onClick={() => openEdit(g)}>
                      ✎
                    </button>
                    <button type="button" className="icon-btn danger" aria-label="Delete guest" onClick={() => confirmDelete(g)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot">
            <div className="download-menu-wrap">
              <button
                type="button"
                className="btn-white btn-sm"
                onClick={() => setExportOpen((v) => !v)}
                disabled={exporting}
              >
                Download
              </button>
              {exportOpen && (
                <div className="download-menu">
                  <button type="button" className="download-menu-item" onClick={exportExcelCsv} disabled={exporting}>
                    Excel (CSV)
                  </button>
                  <button type="button" className="download-menu-item" onClick={exportPdf} disabled={exporting}>
                    PDF
                  </button>
                </div>
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal
        title="Add Guest"
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setAddOpen(false)}>
              Close
            </button>
            <button type="submit" form="add-guest-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="add-guest-form" className="modal-form" onSubmit={saveNew}>
          <GuestFormFields form={form} onChange={setForm} readOnly={false} />
        </form>
      </Modal>

      <Modal
        title={activeGuest ? `Edit Guest — ${activeGuest.name}` : "Edit Guest"}
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn-muted" disabled={saving} onClick={() => setEditOpen(false)}>
              Close
            </button>
            <button type="submit" form="edit-guest-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="edit-guest-form" className="modal-form" onSubmit={saveEdit}>
          <GuestFormFields form={form} onChange={setForm} readOnly={false} />
        </form>
      </Modal>

      <Modal
        title={activeGuest ? `Guest — ${activeGuest.name}` : "Guest"}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        footer={
          <button type="button" className="btn-primary" onClick={() => setViewOpen(false)}>
            Close
          </button>
        }
      >
        <div className="modal-form">
          <GuestFormFields form={form} onChange={() => {}} readOnly />
        </div>
      </Modal>
    </div>
  );
}

export default WeddingGuestsPage;
