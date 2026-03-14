import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef } from "react";
import { Columns3, Download, Maximize2 } from "lucide-react";

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
  paginationPageSize = 25,
  paginationThreshold = 40,
  autoPageSize = true,
  capAdaptiveHeight = true,
}) {
  const gridRef = useRef();

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

  const shouldPaginate = useMemo(() => {
    if (!enablePagination) return false;
    return totalRows > paginationThreshold;
  }, [enablePagination, totalRows, paginationThreshold]);

  const resolvedHeight = useMemo(() => {
    if (!adaptiveHeight) return height;
    const visibleRows = shouldPaginate
      ? Math.max(
          Math.min(
            autoPageSize ? paginationThreshold : paginationPageSize,
            totalRows || (autoPageSize ? paginationThreshold : paginationPageSize)
          ),
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
    paginationPageSize,
    autoPageSize,
    headerHeight,
    rowHeight,
    minHeight,
    height,
    capAdaptiveHeight,
  ]);

  return (
    <>
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
          paginationPageSize={paginationPageSize}
          paginationAutoPageSize={shouldPaginate && autoPageSize}
          alwaysShowVerticalScroll={false}
        ></AgGridReact>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pb-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/35 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
          onClick={sizeToFit}
        >
          <Maximize2 size={14} />
          Size to Fit
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/35 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
          onClick={autoSizeAll}
        >
          <Columns3 size={14} />
          Auto-Size All
        </button>
        {download && (
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() =>
              gridRef.current.api.exportDataAsCsv({
                fileName: downloadFileName,
              })
            }
          >
            <Download size={14} />
            Download
          </button>
        )}
      </div>
    </>
  );
}

export default AgGridComponent;
