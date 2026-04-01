import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "../components/Pagination.jsx";
import { apiGet } from "../services/api.js";
import { showError, showSuccess } from "../utils/swal.js";

function AdminWeddingsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  async function fetchAllWeddings() {
    const all = [];
    let p = 1;
    let pages = 1;
    do {
      const res = await apiGet(`/api/admin/weddings?page=${p}&limit=50`);
      all.push(...(res.weddings || []));
      pages = res.totalPages || 1;
      p += 1;
    } while (p <= pages);
    return all;
  }

  function toCsv(data) {
    const headers = ["Created By", "Wedding", "Date", "Location", "Guest Count"];
    const lines = [headers.join(",")];
    for (const w of data) {
      lines.push(
        [w.userName, w.coupleName, new Date(w.weddingDate).toLocaleDateString("en-AU"), w.location, w.guestCount]
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
      const all = await fetchAllWeddings();
      const blob = new Blob([toCsv(all)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "weddings-overview.csv";
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("Weddings CSV downloaded.");
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
      const all = await fetchAllWeddings();
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
      doc.text("Admin Weddings Report", 40, 102);
      autoTable(doc, {
        startY: 120,
        head: [["Created By", "Wedding", "Date", "Location", "Guests"]],
        body: all.map((w) => [
          w.userName,
          w.coupleName,
          new Date(w.weddingDate).toLocaleDateString("en-AU"),
          w.location,
          String(w.guestCount || 0),
        ]),
        headStyles: { fillColor: navy, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 247, 252] },
        margin: { left: 40, right: 40 },
      });
      doc.save("weddings-overview.pdf");
      showSuccess("Weddings PDF downloaded.");
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
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

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Created By</th>
              <th>Wedding</th>
              <th>Date</th>
              <th>Location</th>
              <th>Guests</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading weddings…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5}>No weddings found.</td>
              </tr>
            ) : (
              rows.map((w) => (
                <tr key={w._id}>
                  <td>{w.userName}</td>
                  <td>
                    <Link className="linkish" to={`/admin/weddings/${w._id}/guests`}>
                      {w.coupleName}
                    </Link>
                  </td>
                  <td>{new Date(w.weddingDate).toLocaleDateString("en-AU")}</td>
                  <td>{w.location}</td>
                  <td>{w.guestCount || 0}</td>
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
