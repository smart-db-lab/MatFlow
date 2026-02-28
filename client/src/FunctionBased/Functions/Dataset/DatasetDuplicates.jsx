import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

function DatasetDuplicates({ csvData }) {
  // const [rowData, setRowData] = useState([]);
  const [duplicateRows, setDuplicateRows] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [excludeKeys, setExcludeKeys] = useState(["id"]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (activeCsvFile) {
      // Function to find duplicate rows
      const findDuplicateRows = (data) => {
        const duplicates = [];
        const seen = new Set();


        data.forEach((obj) => {
          const excludedObj = {};
          for (const key in obj) {
            if (!excludeKeys.includes(key)) {
              excludedObj[key] = obj[key];
            }
          }
          const key = Object.values(excludedObj).join("|");
          if (seen.has(key)) {
            duplicates.push(obj);
          } else {
            seen.add(key);
          }
        });

        return duplicates;
      };
      const fetchCSVData = async () => {
        try {
          let cNames = Object.keys(csvData[0]);
          cNames = cNames.filter((val) => val !== "id");
          setColumnNames(cNames);

          const generatedColumnDefs = generateColumnDefs(csvData, excludeKeys);
          setColumnDefs(generatedColumnDefs);

          // Find duplicate rows
          const duplicates = findDuplicateRows(csvData);
          setDuplicateRows(duplicates);
        } catch (error) {
          console.error("Error:", error);
        }
      };

      fetchCSVData();
    }
  }, [activeCsvFile, excludeKeys, csvData]);

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const findMissingValues = (firstList, secondList) => {
        const firstSet = new Set(firstList);
        const missingValues = [];

        for (const value of secondList) {
          if (!firstSet.has(value)) {
            missingValues.push(value);
          }
        }
        return missingValues;
      };
      const colShowing = findMissingValues(
        excludeKeys,
        Object.keys(csvData[0])
      );
      setSelectedColumns(colShowing);
    }
  }, [excludeKeys, csvData]);

  // Function to generate column definitions dynamically
  const generateColumnDefs = (data, exKey) => {
    // Assuming your data contains headers as an array of strings
    const headers = data[0];
    const baadDibo = new Set(exKey);

    const columnName = Object.keys(headers);

    const columnDefs = [];
    for (let i = 0; i < columnName.length; i++) {
      if (baadDibo.has(columnName[i]) && columnName[i] !== "id") continue;
      columnDefs.push({
        headerName: columnName[i],
        field: columnName[i].toLowerCase().replace(/\s/g, ""),
        valueGetter: (params) => {
          return params.data[columnName[i]];
        },
      });
    }
    return columnDefs;
  };

  // Function to generate row data dynamically

  const handleColumnToggle = (column) => {
    if (selectedColumns.includes(column)) {
      setExcludeKeys([...excludeKeys, column]);
      setSelectedColumns(
        selectedColumns.filter((selectedColumn) => selectedColumn !== column)
      );
    } else {
      setExcludeKeys(excludeKeys.filter((val) => val !== column));
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const filteredColumns = columnNames.filter((column) =>
    column.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="mt-4">
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Duplicate Rows</h1>
            <p className="text-sm text-gray-500">
              Found <span className="font-semibold text-gray-700">{duplicateRows.length}</span> duplicate rows
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="rounded-lg border border-[#0D9488]/30 bg-white px-3 py-2 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
          >
            {showFilters ? "Hide Filters" : "Filter Columns"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 border-t border-gray-100 pt-4">
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

      <div className="ag-theme-alpine h-[600px] w-full rounded-xl border border-gray-200 bg-white p-2">
        {duplicateRows && duplicateRows.length > 0 ? (
          <AgGridComponent rowData={duplicateRows} columnDefs={columnDefs} />
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-500">
            No duplicate rows found for current filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default DatasetDuplicates;
