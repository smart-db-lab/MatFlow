import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
    Loader2,
} from "lucide-react";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import GridPaginationControls from "../../Components/AgGridComponent/GridPaginationControls";
import { apiService } from "../../../services/api/apiService";
import { sessionGetString } from "../../../util/sessionProjectStorage";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DatasetDisplay = ({ csvData }) => {
    const { projectId } = useParams();
    const activeFile = useSelector((state) => state.uploadedFile.activeFile);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
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
    const datasetName = filename || "Selected Dataset";

    const totalPages =
        totalRows !== null
            ? Math.max(1, Math.ceil(totalRows / pageSize))
            : null;

    const fetchPage = useCallback(
        async (targetPage) => {
            if (!projectId || !filename) return;

            const expectedActiveFileId = sessionGetString(
                "activeFileId",
                projectId,
            );
            if (
                typeof expectedActiveFileId === "string" &&
                activeFile?.name &&
                expectedActiveFileId !== activeFile.name
            ) {
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const res = await apiService.matflow.dataset.readFilePaginated(
                    projectId,
                    folder,
                    filename,
                    targetPage,
                    pageSize,
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
                    const start = (targetPage - 1) * pageSize;
                    setRowData(csvData.slice(start, start + pageSize));
                    setTotalRows(csvData.length);
                } else {
                    setError("Failed to load data.");
                }
            } finally {
                setLoading(false);
            }
        },
        [projectId, folder, filename, pageSize, csvData, activeFile],
    );

    // Fetch page 1 whenever the active file changes
    useEffect(() => {
        setPage(1);
        setRowData(null);
        setTotalRows(null);
        fetchPage(1);
    }, [activeFile, projectId, pageSize]);

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
        rowData ?? (Array.isArray(csvData) ? csvData.slice(0, pageSize) : []);
    const displayTotal =
        totalRows ?? (Array.isArray(csvData) ? csvData.length : 0);

    return (
        <div>
            {/* Header */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                    Materials Property Preview - {datasetName}
                </h2>
                {loading && (
                    <Loader2
                        size={16}
                        className="animate-spin text-[#0D9488]"
                    />
                )}
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
                            totalRowsOverride={displayTotal}
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
                <GridPaginationControls
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRecords={displayTotal}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    loading={loading}
                    onPageChange={goToPage}
                    onPageSizeChange={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(1);
                    }}
                />
            )}
        </div>
    );
};

export default DatasetDisplay;
