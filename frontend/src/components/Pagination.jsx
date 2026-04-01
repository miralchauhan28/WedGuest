function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const items = [];
  const windowSize = 8;
  if (totalPages <= windowSize) {
    for (let i = 1; i <= totalPages; i += 1) items.push(i);
  } else {
    for (let i = 1; i <= windowSize; i += 1) items.push(i);
    items.push("ellipsis");
    items.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      {items.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`e-${idx}`} className="pagination-ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pagination-page ${p === page ? "is-active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
    </nav>
  );
}

export default Pagination;
