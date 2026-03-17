import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef } from "react";
import { Columns3, Download, Maximize2 } from "lucide-react";

function AgGridComponent({
  rowData,
  columnDefs,
  rowHeight = 50,
  headerHeight = 50,
  download = false,
  height = 600,
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

  const onPageSizeChanged = useCallback((e) => {
    gridRef.current.api.paginationSetPageSize(Number(e.target.value));
  }, []);

  return (
    <>
      <div
        className="ag-theme-alpine matflow-grid"
        style={{ width: "100%", height: `${height}px` }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={rowHeight}
          defaultColDef={defaultColDef}
          headerHeight={headerHeight}
          rowModelType="clientSide"
          // Enable pagination
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[10, 50, 100, 500]}
          suppressRowVirtualisation={false}
          // Adjust the row buffer to improve performance (default is 10)
          rowBuffer={20}
          domLayout="normal"
          animateRows={true}
          suppressCellFocus={true}
          tooltipShowDelay={100}
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
        <div className="flex items-center gap-2 ml-4">
          <label htmlFor="page-size" className="text-xs font-semibold text-gray-600">Rows per page:</label>
          <select 
            id="page-size"
            onChange={onPageSizeChanged} 
            defaultValue={50}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
        </div>
        {download && (
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => gridRef.current.api.exportDataAsCsv()}
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
