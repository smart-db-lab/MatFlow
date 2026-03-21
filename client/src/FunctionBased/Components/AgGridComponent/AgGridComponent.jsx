import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Columns3, Download, Maximize2 } from "lucide-react";
import GridPaginationControls from "./GridPaginationControls";

function AgGridComponent({
  rowData,
  columnDefs,
  rowHeight = 30,
  headerHeight = 36,
  download = false,
  height = 600,
  minHeight = 220,
  adaptiveHeight = true,
  downloadFileName = "table.csv",
  enablePagination = true,
  paginationPageSize: _paginationPageSize = 10,
  paginationThreshold = 0,
  autoPageSize = true,
  capAdaptiveHeight = true,
  onDownload = null,
  totalRowsOverride = null,
}) {
  const gridRef = useRef();
  const DEFAULT_PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(
    Number.isFinite(_paginationPageSize) && _paginationPageSize > 0
      ? _paginationPageSize
      : DEFAULT_PAGE_SIZE,
  );

  const defaultColDef = useMemo(() => {
    return {
      valueFormatter: (data) => {
        return data.value !== null ? data.value : "N/A";
      },
      filter: true,
      filterParams: {
        suppressAndOrCondition: true,
        newRowsAction: "keep",
      },
      sortable: true,
      resizable: true,
    };
  }, []);

  const sizeToFit = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const autoSizeAll = useCallback(() => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeAllColumns();
  }, []);

  const totalRows = useMemo(
    () => (Array.isArray(rowData) ? rowData.length : 0),
    [rowData]
  );
  const summaryRows = useMemo(() => {
    const parsed =
      totalRowsOverride === null || totalRowsOverride === undefined
        ? null
        : Number(totalRowsOverride);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : totalRows;
  }, [totalRowsOverride, totalRows]);
  const totalColumns = useMemo(() => {
    if (Array.isArray(columnDefs) && columnDefs.length > 0) {
      return columnDefs.filter((col) => Boolean(col?.field)).length;
    }
    return 0;
  }, [columnDefs]);

  const shouldPaginate = useMemo(() => {
    if (!enablePagination) return false;
    return totalRows > paginationThreshold;
  }, [enablePagination, totalRows, paginationThreshold]);

  const totalPages = useMemo(() => {
    if (!shouldPaginate) return 1;
    return Math.max(1, Math.ceil(totalRows / currentPageSize));
  }, [shouldPaginate, totalRows, currentPageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [totalRows]);

  const resolvedHeight = useMemo(() => {
    if (!adaptiveHeight) return height;
    const visibleRows = shouldPaginate
      ? Math.max(
          Math.min(currentPageSize, totalRows || currentPageSize),
          1
        )
      : Math.max(totalRows, 1);
    const paginationPanelHeight = shouldPaginate ? 36 : 0;
    const contentHeight =
      headerHeight + visibleRows * rowHeight + paginationPanelHeight + 24;
    const desiredHeight = Math.max(minHeight, contentHeight);
    if (!capAdaptiveHeight) return desiredHeight;
    return Math.min(height, desiredHeight);
  }, [
    adaptiveHeight,
    totalRows,
    shouldPaginate,
    currentPageSize,
    headerHeight,
    rowHeight,
    minHeight,
    height,
    capAdaptiveHeight,
  ]);

  const buildCsvContent = useCallback((rows, columns) => {
    const header = columns.join(",");
    const lines = rows.map((row) =>
      columns
        .map((col) => {
          const value = row?.[col];
          const normalized = value === null || value === undefined ? "" : String(value);
          return `"${normalized.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    return [header, ...lines].join("\n");
  }, []);

  const triggerCsvDownload = useCallback((csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <>
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
          {summaryRows.toLocaleString()} rows • {totalColumns.toLocaleString()} columns
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          onClick={sizeToFit}
        >
          <Maximize2 size={14} />
          Size to Fit
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          onClick={autoSizeAll}
        >
          <Columns3 size={14} />
          Auto-Size All
        </button>
        {download && (
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            onClick={async () => {
              const exportRows = Array.isArray(rowData) ? rowData : [];
              const exportColumns =
                Array.isArray(columnDefs) && columnDefs.length > 0
                  ? columnDefs.map((col) => col?.field).filter(Boolean)
                  : Object.keys(exportRows[0] || {});
              const csvContent = buildCsvContent(exportRows, exportColumns);
              triggerCsvDownload(csvContent, downloadFileName);

              if (typeof onDownload === "function") {
                await Promise.resolve(
                  onDownload({
                    fileName: downloadFileName,
                    rows: exportRows,
                  }),
                );
              }
            }}
          >
            <Download size={14} />
            Download
          </button>
        )}
        </div>
      </div>
      <div
        className="ag-theme-alpine matflow-grid"
        style={{ width: "100%", height: `${resolvedHeight}px` }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={rowHeight}
          defaultColDef={defaultColDef}
          headerHeight={headerHeight}
          rowModelType="clientSide"
          // Enable row virtualization (enabled by default)
          suppressRowVirtualisation={false}
          // Adjust the row buffer to improve performance (default is 10)
          rowBuffer={20}
          domLayout="normal"
          animateRows={true}
          suppressCellFocus={true}
          tooltipShowDelay={100}
          pagination={shouldPaginate}
          paginationPageSize={currentPageSize}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          paginationAutoPageSize={false}
          suppressPaginationPanel={shouldPaginate}
          alwaysShowVerticalScroll={false}
          onPaginationChanged={() => {
            if (!gridRef.current?.api) return;
            setCurrentPage(gridRef.current.api.paginationGetCurrentPage() + 1);
          }}
        ></AgGridReact>
      </div>
      {shouldPaginate && (
        <GridPaginationControls
          page={currentPage}
          totalPages={totalPages}
          pageSize={currentPageSize}
          totalRecords={totalRows}
          onPageChange={(nextPage) => {
            const clamped = Math.max(1, Math.min(nextPage, totalPages));
            setCurrentPage(clamped);
            gridRef.current?.api?.paginationGoToPage(clamped - 1);
          }}
          onPageSizeChange={(nextSize) => {
            setCurrentPageSize(nextSize);
            setCurrentPage(1);
            if (gridRef.current?.api) {
              if (typeof gridRef.current.api.paginationSetPageSize === "function") {
                gridRef.current.api.paginationSetPageSize(nextSize);
              } else if (typeof gridRef.current.api.setGridOption === "function") {
                gridRef.current.api.setGridOption("paginationPageSize", nextSize);
              }
              gridRef.current.api.paginationGoToFirstPage();
            }
          }}
          loading={false}
        />
      )}
    </>
  );
}

export default AgGridComponent;
