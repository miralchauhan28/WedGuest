import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "../components/Pagination.jsx";
import { apiGet } from "../services/api.js";
import { showError, showSuccess } from "../utils/swal.js";

const RSVP_OPTIONS = ["Pending", "Accepted", "Declined"];
const ATTENDEE_OPTIONS = ["Yes", "No"];
const MEAL_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Gluten-free", "Standard", "Other"];

function AdminWeddingGuestsPage() {
  const { weddingId } = useParams();
  const [wedding, setWedding] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [mealFilter, setMealFilter] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("");

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
    if (attendeeFilter) qs.set("attendee", attendeeFilter);
    if (mealFilter) qs.set("mealPref", mealFilter);
    if (rsvpFilter) qs.set("rsvp", rsvpFilter);
    return qs.toString();
  }, [page, search, attendeeFilter, mealFilter, rsvpFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/admin/weddings/${weddingId}/guests?${query}`);
      setWedding(res.wedding || null);
      setRows(res.guests || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, weddingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function fetchAllGuests() {
    const all = [];
    let p = 1;
    let pages = 1;
    let w = wedding;
    do {
      const res = await apiGet(`/api/admin/weddings/${weddingId}/guests?page=${p}&limit=50`);
      if (!w) w = res.wedding;
      all.push(...(res.guests || []));
      pages = res.totalPages || 1;
      p += 1;
    } while (p <= pages);
    return { all, wedding: w };
  }

  function fileBaseName() {
    const n = String(wedding?.coupleName || "wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return n.replace(/^-+|-+$/g, "") || "wedding";
  }

  function toCsv(data) {
    const headers = ["Name", "Email", "Phone", "Attendee", "Meal Pref", "RSVP Status"];
    const lines = [headers.join(",")];
    for (const g of data) {
      lines.push(
        [g.name, g.email, g.phone, g.attendee, g.mealPreference || "", g.rsvpStatus]
          .map((x) => `"${String(x || "").replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    return lines.join("\r\n");
  }

  async function downloadCsv() {
    setExportOpen(false);
    setExporting(true);
    try {
      const { all } = await fetchAllGuests();
      const blob = new Blob([toCsv(all)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBaseName()}-guests.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("Guest CSV downloaded.");
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function downloadPdf() {
    setExportOpen(false);
    setExporting(true);
    try {
      const { all, wedding: w } = await fetchAllGuests();
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const navy = [5, 10, 36];
      doc.setFillColor(...navy);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 72, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("WEDGUEST", 40, 45);
      doc.setTextColor(...navy);
      doc.setFontSize(14);
      doc.text(`Wedding: ${w?.coupleName || "-"}`, 40, 102);
      doc.setFontSize(10);
      doc.text(`Host: ${w?.ownerName || "-"}`, 40, 122);
      doc.text(`Location: ${w?.location || "-"}`, 40, 138);
      doc.text(`Date: ${w?.weddingDate ? new Date(w.weddingDate).toLocaleDateString("en-AU") : "-"}`, 40, 154);
      autoTable(doc, {
        startY: 172,
        head: [["Name", "Email", "Phone", "Attendee", "Meal", "RSVP"]],
        body: all.map((g) => [g.name, g.email, g.phone, g.attendee, g.mealPreference || "-", g.rsvpStatus]),
        headStyles: { fillColor: navy, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 247, 252] },
        margin: { left: 40, right: 40 },
      });
      doc.save(`${fileBaseName()}-guests.pdf`);
      showSuccess("Guest PDF downloaded.");
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="user-page-head">
        <div>
          <Link className="user-back" to="/admin/weddings">← Weddings</Link>
          <h2 className="user-page-title">{wedding?.coupleName || "Wedding"}'s Guests</h2>
        </div>
        <div className="download-menu-wrap">
          <button type="button" className="btn-white btn-sm" onClick={() => setExportOpen((v) => !v)} disabled={exporting}>
            Download
          </button>
          {exportOpen && (
            <div className="download-menu">
              <button type="button" className="download-menu-item" onClick={downloadCsv}>Excel (CSV)</button>
              <button type="button" className="download-menu-item" onClick={downloadPdf}>PDF</button>
            </div>
          )}
        </div>
      </div>

      <div className="guest-toolbar">
        <div className="guest-search admin-search-full">
          <span aria-hidden>☰</span>
          <input type="search" placeholder="Search..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <span aria-hidden>⌕</span>
        </div>
        <div className="guest-filters">
          <select value={attendeeFilter} onChange={(e) => { setAttendeeFilter(e.target.value); setPage(1); }}>
            <option value="">Attendee</option>
            {ATTENDEE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={mealFilter} onChange={(e) => { setMealFilter(e.target.value); setPage(1); }}>
            <option value="">Meal pref</option>
            {MEAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={rsvpFilter} onChange={(e) => { setRsvpFilter(e.target.value); setPage(1); }}>
            <option value="">RSVP status</option>
            {RSVP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading guests…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6}>No guests found for this wedding.</td></tr>
            ) : (
              rows.map((g) => (
                <tr key={g._id}>
                  <td>{g.name}</td>
                  <td>{g.email}</td>
                  <td>{g.phone}</td>
                  <td>{g.attendee}</td>
                  <td>{g.mealPreference || "-"}</td>
                  <td>{g.rsvpStatus}</td>
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

export default AdminWeddingGuestsPage;
