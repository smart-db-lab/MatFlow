import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function GridPaginationControls({
  page,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) {
  if (!totalRecords || totalPages < 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);

  return (
    <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-800">
          Records per page
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
          disabled={loading}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
          Showing records {start.toLocaleString()}-{end.toLocaleString()} of{" "}
          {totalRecords.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1 || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-80"
          title="First page"
          aria-label="Go to first page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-80"
          title="Previous page"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 shadow-sm">
          <span className="whitespace-nowrap">Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) onPageChange(v);
            }}
            className="w-16 rounded border border-slate-300 px-2 py-0.5 text-center text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            disabled={loading}
            aria-label="Current page number"
          />
          <span className="whitespace-nowrap">of {totalPages.toLocaleString()}</span>
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-80"
          title="Next page"
          aria-label="Go to next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-80"
          title="Last page"
          aria-label="Go to last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default GridPaginationControls;
