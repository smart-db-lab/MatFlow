import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import { apiService } from "../../../services/api/apiService";

function DatasetGroup({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [initialData, setInitialData] = useState([]);

  const [rowData, setRowData] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectValue, setSelectValue] = useState("count");
  const [showControls, setShowControls] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnNames, setColumnNames] = useState([]);

  const columnDefs = useMemo(() => {
    if (!rowData) return;
    let columns = Object.keys(rowData[0] || {});
    columns = columns.filter((col) => col !== "id");
    return columns.map((column) => ({
      headerName: column,
      field: column,
      valueGetter: (params) => {
        return params.data[column];
      },
    }));
  }, [rowData]);

  useEffect(() => {
    if (activeCsvFile && Array.isArray(csvData) && csvData.length > 0) {
      const fetchCSVData = async () => {
        try {
          setRowData(csvData);
          let tempColumns = Object.keys(csvData[0]);
          setInitialData(csvData);

          tempColumns = tempColumns.filter((col) => col !== "id");
          setColumnNames(tempColumns);
          setSelectedColumns(tempColumns.length > 0 ? [tempColumns[0]] : []);
        } catch (error) {
          console.error("Error:", error);
        }
      };

      fetchCSVData();
    }
  }, [activeCsvFile, csvData]);

  useEffect(() => {
    if (initialData && initialData.length) {
      const fetchData = async () => {
        try {
          const response = await apiService.matflow.dataset.groupData({
            file: initialData,
            group_var: selectedColumns,
            agg_func: selectValue,
          });

          let { data } = response;
          const tempData = typeof data === 'string' ? JSON.parse(data) : data;
          setRowData(tempData);
        } catch (error) {
          console.error(error);
        }
      };

      fetchData();
    }
  }, [initialData, selectValue, selectedColumns]);

  const handleColumnToggle = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(
        selectedColumns.filter((selectedColumn) => selectedColumn !== column)
      );
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const filteredColumns = columnNames.filter((column) =>
    column.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Data</h1>
            <p className="text-sm text-gray-500">Group columns and apply aggregation</p>
          </div>
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className="rounded-lg border border-[#0D9488]/30 bg-white px-3 py-2 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
          >
            {showControls ? "Hide Controls" : "Apply Aggregation"}
          </button>
        </div>

        {showControls && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
              <label className="text-sm font-medium text-gray-700 md:w-44">
                Aggregate Function
              </label>
              <select
                name="aggFunc"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="count">count</option>
                <option value="sum">sum</option>
                <option value="min">min</option>
                <option value="max">max</option>
                <option value="mean">mean</option>
                <option value="median">median</option>
                <option value="std">std</option>
                <option value="var">var</option>
              </select>
            </div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search columns
            </label>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter column name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
            />
            <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
              {filteredColumns.map((column, index) => (
                <label key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <span>{column}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ag-theme-alpine mt-4 h-[600px] w-full rounded-xl border border-gray-200 bg-white p-2">
        {rowData && columnDefs && (
          <AgGridComponent rowData={rowData} columnDefs={columnDefs} />
        )}
      </div>
    </div>
  );
}

export default DatasetGroup;
