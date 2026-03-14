import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
} from "lucide-react";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import { apiService } from "../../../services/api/apiService";

const PAGE_SIZE = 100;

const DatasetDisplay = ({ csvData }) => {
    const { projectId } = useParams();
    const activeFile = useSelector((state) => state.uploadedFile.activeFile);

    const [page, setPage] = useState(1);
    const [totalRows, setTotalRows] = useState(null);
    const [rowData, setRowData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Derive folder + filename from activeFile.name (e.g. "ws/original_dataset/file.csv")
    const { folder, filename } = useMemo(() => {
        if (!activeFile?.name) return { folder: "", filename: "" };
        const parts = activeFile.name.split("/");
        return {
            filename: parts[parts.length - 1],
            folder: parts.slice(0, -1).join("/"),
        };
    }, [activeFile]);

    const totalPages =
        totalRows !== null
            ? Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
            : null;

    const fetchPage = useCallback(
        async (targetPage) => {
            if (!projectId || !filename) return;
            setLoading(true);
            setError(null);
            try {
                const res = await apiService.matflow.dataset.readFilePaginated(
                    projectId,
                    folder,
                    filename,
                    targetPage,
                    PAGE_SIZE,
                );
                if (res && Array.isArray(res.data)) {
                    setRowData(res.data);
                    setTotalRows(res.total_rows);
                } else {
                    // Fallback: server returned full array (shouldn't happen but safe)
                    setRowData(Array.isArray(res) ? res : []);
                    setTotalRows(Array.isArray(res) ? res.length : 0);
                }
            } catch (err) {
                // Fallback to csvData prop if server paginated call fails
                if (Array.isArray(csvData) && csvData.length > 0) {
                    const start = (targetPage - 1) * PAGE_SIZE;
                    setRowData(csvData.slice(start, start + PAGE_SIZE));
                    setTotalRows(csvData.length);
                } else {
                    setError("Failed to load data.");
                }
            } finally {
                setLoading(false);
            }
        },
        [projectId, folder, filename, csvData],
    );

    // Fetch page 1 whenever the active file changes
    useEffect(() => {
        setPage(1);
        setRowData(null);
        setTotalRows(null);
        fetchPage(1);
    }, [activeFile, projectId]);

    // Fetch when page changes
    useEffect(() => {
        if (page !== 1) fetchPage(page);
    }, [page]);

    const goToPage = (p) => {
        const clamped = Math.max(1, Math.min(p, totalPages || 1));
        setPage(clamped);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const columnDefs = useMemo(() => {
        const sample = rowData?.[0] || csvData?.[0];
        if (!sample) return [];
        return Object.keys(sample).map((key) => ({
            headerName: key,
            field: key,
            valueGetter: (params) =>
                params.data[key] !== null && params.data[key] !== undefined
                    ? params.data[key]
                    : "",
        }));
    }, [rowData, csvData]);

    const displayRows =
        rowData ?? (Array.isArray(csvData) ? csvData.slice(0, PAGE_SIZE) : []);
    const displayTotal =
        totalRows ?? (Array.isArray(csvData) ? csvData.length : 0);
    const rowLabel = displayTotal === 1 ? "row" : "rows";

    return (
        <div>
            {/* Header */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">
                    Materials Property Preview
                </h2>
                <div className="flex items-center gap-3">
                    {loading && (
                        <Loader2
                            size={16}
                            className="animate-spin text-[#0D9488]"
                        />
                    )}
                    <p className="rounded-md border border-[#D9ECE9] bg-[#F0FDFA] px-3 py-1.5 text-base font-semibold text-[#0F766E]">
                        {displayTotal.toLocaleString()} {rowLabel}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4 w-full">
                {error ? (
                    <div className="grid h-[200px] place-items-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-500">
                        {error}
                    </div>
                ) : displayRows.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-2">
                        <AgGridComponent
                            rowData={displayRows}
                            columnDefs={columnDefs}
                            enablePagination={false}
                            capAdaptiveHeight={false}
                        />
                    </div>
                ) : loading ? (
                    <div className="grid h-[200px] place-items-center rounded-xl border border-gray-200 bg-white">
                        <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
                            <Loader2
                                size={24}
                                className="animate-spin text-[#0D9488]"
                            />
                            Loading data…
                        </div>
                    </div>
                ) : (
                    <div className="grid h-[200px] place-items-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
                        No rows to display.
                    </div>
                )}
            </div>

            {/* Pagination controls */}
            {totalPages !== null && totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                        Showing rows{" "}
                        {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
                        {Math.min(
                            page * PAGE_SIZE,
                            displayTotal,
                        ).toLocaleString()}{" "}
                        of {displayTotal.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goToPage(1)}
                            disabled={page === 1 || loading}
                            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            title="First page"
                        >
                            <ChevronsLeft size={14} />
                        </button>
                        <button
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1 || loading}
                            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            title="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="flex items-center gap-1 px-2 text-xs text-gray-600">
                            Page
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={page}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (!isNaN(v)) goToPage(v);
                                }}
                                className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                            />
                            of {totalPages.toLocaleString()}
                        </span>
                        <button
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages || loading}
                            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            title="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => goToPage(totalPages)}
                            disabled={page === totalPages || loading}
                            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            title="Last page"
                        >
                            <ChevronsRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatasetDisplay;
