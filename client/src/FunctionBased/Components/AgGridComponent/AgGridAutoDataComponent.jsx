import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Columns3, Download, Maximize2, Table2 } from "lucide-react";

function AgGridAutoDataComponent({
  rowData,
  rowHeight = 50,
  paginationPageSize = 10,
  headerHeight = 50,
  download = false,
  height = "600px",
  customColumnOrder = null,
  downloadOptions = null,
  themeVariant = "default",
  flatContainer = false,
}) {
  const gridRef = useRef();
  const safeRowData = Array.isArray(rowData) ? rowData : [];
  const isDatasetTheme = themeVariant === "dataset";

  const columnDefs = useMemo(() => {
    if (safeRowData.length === 0 || !safeRowData[0]) return [];
    
    const allKeys = Object.keys(safeRowData[0]);
    let orderedKeys = allKeys;
    
    // Apply custom column ordering if provided
    if (customColumnOrder && Array.isArray(customColumnOrder)) {
      // First add columns in the specified order
      orderedKeys = customColumnOrder.filter(key => allKeys.includes(key));
      // Then add any remaining columns that weren't specified
      orderedKeys = [...orderedKeys, ...allKeys.filter(key => !customColumnOrder.includes(key))];
    }
    
    return orderedKeys.map((key) => ({
      headerName: key,
      field: key,
      valueGetter: (params) => {
        return params.data[key];
      },
    }));
  }, [safeRowData, customColumnOrder]);

  const defaultColDef = useMemo(() => {
    return {
      valueFormatter: (data) => {
        // console.log(data);
        return data.value !== null ? data.value : "N/A";
      },
      filter: true, // Enable filtering for the column
      filterParams: {
        suppressAndOrCondition: true, // Optional: Suppress 'and'/'or' filter conditions
        newRowsAction: "keep", // Optional: Preserve filter when new rows are loaded
      },
      sortable: true,
      resizable: true,
    };
  }, []);

  const sizeToFit = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeAllColumns(skipHeader);
  }, []);

  // Function to reorder columns based on customColumnOrder
  const reorderColumns = useCallback(() => {
    if (gridRef.current && gridRef.current.columnApi && customColumnOrder && Array.isArray(customColumnOrder)) {
      const allColumns = gridRef.current.columnApi.getColumns();
      const orderedColumnIds = customColumnOrder.filter(key => 
        allColumns.some(col => col.getColId() === key)
      );
      const remainingColumnIds = allColumns
        .map(col => col.getColId())
        .filter(id => !customColumnOrder.includes(id));
      
      const finalOrder = [...orderedColumnIds, ...remainingColumnIds];
      gridRef.current.columnApi.setColumnOrder(finalOrder);
    }
  }, [customColumnOrder]);

  // Reorder columns when grid is ready
  const onGridReady = useCallback(() => {
    if (gridRef.current) {
      // Small delay to ensure grid is fully initialized
      setTimeout(() => {
        reorderColumns();
      }, 100);
    }
  }, [reorderColumns]);

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.relative')) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Reorder columns when customColumnOrder changes
  useEffect(() => {
    if (gridRef.current && gridRef.current.columnApi) {
      reorderColumns();
    }
  }, [customColumnOrder, reorderColumns]);

  const handleDownload = useCallback((downloadType) => {
    if (safeRowData.length === 0) return;
    
    if (downloadType === 'full') {
      // Download all data
      gridRef.current.api.exportDataAsCsv();
    } else if (downloadType === 'minimal' && downloadOptions && downloadOptions.minimalColumns) {
      // Download only specified columns
      const minimalData = safeRowData.map(row => {
        const minimalRow = {};
        downloadOptions.minimalColumns.forEach(col => {
          if (row[col] !== undefined) {
            minimalRow[col] = row[col];
          }
        });
        return minimalRow;
      });
      
      // Create CSV content
      const headers = downloadOptions.minimalColumns.join(',');
      const csvContent = [
        headers,
        ...minimalData.map(row => 
          downloadOptions.minimalColumns.map(col => 
            row[col] !== undefined ? `"${row[col]}"` : '""'
          ).join(',')
        )
      ].join('\n');
      
      // Download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'results_minimal.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setShowDownloadDropdown(false);
  }, [safeRowData, downloadOptions]);

  return (
    <>
      <div
        className={
          isDatasetTheme
            ? flatContainer
              ? "ag-theme-alpine matflow-grid w-full bg-white"
              : "ag-theme-alpine matflow-grid w-full rounded-xl border border-gray-200 bg-white p-2"
            : "ag-theme-alpine mb-12"
        }
        style={{ height, width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={safeRowData}
          columnDefs={columnDefs}
          rowHeight={rowHeight}
          // pagination
          // paginationPageSize={paginationPageSize}
          rowModelType="clientSide"
          suppressRowVirtualisation={false}
          rowBuffer={20}
          domLayout="normal"
          defaultColDef={defaultColDef}
          headerHeight={headerHeight}
          onGridReady={onGridReady}
        ></AgGridReact>
      </div>
      <div className={`flex flex-wrap items-center gap-2 mt-3 pb-2 ${isDatasetTheme ? "" : ""}`}>
        <button
          className={
            isDatasetTheme
              ? "inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/35 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
              : "inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
          }
          onClick={sizeToFit}
        >
          <Maximize2 size={14} />
          Size to Fit
        </button>
        
        <button
          className={
            isDatasetTheme
              ? "inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/35 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
              : "inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
          }
          onClick={() => autoSizeAll(false)}
        >
          <Columns3 size={14} />
          Auto-Size All
        </button>
        
        {download && (
          <div className="relative">
            {downloadOptions && downloadOptions.minimalColumns ? (
              // Show dropdown for SAS and DFT components - SAME STYLING AS OTHER BUTTONS
              <>
                <button
                  className={
                    isDatasetTheme
                      ? "inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      : "inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
                  }
                  onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                >
                  <Download size={14} />
                  Download
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showDownloadDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showDownloadDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[160px] overflow-hidden">
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 border-b border-gray-100 transition-colors duration-150"
                      onClick={() => handleDownload('full')}
                    >
                      <div className="flex items-center gap-2">
                        <Download size={13} className="text-gray-500" />
                        Full Download
                      </div>
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors duration-150"
                      onClick={() => handleDownload('minimal')}
                    >
                      <div className="flex items-center gap-2">
                        <Table2 size={13} className="text-gray-500" />
                        Minimal Download
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Show simple download button for other components - SAME STYLING AS OTHER BUTTONS
              <button
                className={
                  isDatasetTheme
                    ? "inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    : "inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
                }
                onClick={() => handleDownload('full')}
              >
                <Download size={14} />
                Download
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default AgGridAutoDataComponent;
