import React, { useEffect, useMemo, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import AgGridComponent from "../AgGridComponent/AgGridComponent";
import { apiService } from "../../../services/api/apiService";

function FeaturePair({ rowData, isBaseLoading = false, onLoadingChange }) {
  const columnNames = useMemo(() => {
    if (!Array.isArray(rowData) || rowData.length === 0) {
      return [];
    }
    return Object.keys(rowData[0]).filter((name) => name !== "column_name");
  }, [rowData]);

  const [Data, setData] = useState([]);
  const [changedData, setChangedData] = useState();
  const [colDef, setColDef] = useState([]);
  const [drop, setDrop] = useState(false);
  const [absolute, setAbsolute] = useState(false);

  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");
  const [isPairLoading, setIsPairLoading] = useState(false);

  useEffect(() => {
    if (typeof onLoadingChange === "function") {
      onLoadingChange(isPairLoading);
    }
  }, [isPairLoading, onLoadingChange]);

  useEffect(() => {
    if (!columnNames.length) {
      return;
    }

    setFilter1((prev) => (columnNames.includes(prev) ? prev : columnNames[0]));
    setFilter2((prev) => {
      if (columnNames.includes(prev)) {
        return prev;
      }
      return columnNames[1] || columnNames[0];
    });
  }, [columnNames]);

  useEffect(() => {
    if (!columnNames.length || !filter1 || !filter2) {
      return;
    }

    const colNames = new Set(columnNames);
    colNames.add("");
    let tempRowData = JSON.parse(JSON.stringify(rowData));
    let newRowData = {};
    for (let i = 0; i < tempRowData.length; i++) {
      const { column_name, ...rest } = tempRowData[i];
      const tempObj = { [columnNames[i]]: rest };
      newRowData = { ...newRowData, ...tempObj };
    }

    if (colNames.has(filter1) && colNames.has(filter2)) {
      if (filter1 || filter2) {
        const fetchData = async () => {
          setIsPairLoading(true);
          try {
            const response = await apiService.matflow.dataset.getCorrelationFeaturePair({
              file: newRowData,
              gradient: true,
              feature1: filter1,
              feature2: filter2,
              drop: false,
              absol: false,
              high: 0.0,
            });

            let { data } = response;
            data = JSON.parse(data);

            setData(data);
            if (!Array.isArray(data) || data.length === 0) {
              setColDef([]);
              setChangedData([]);
              return;
            }
            const tempColDef = Object.keys(data[0]).map((val) => ({
              headerName: val,
              field: val,
              flex: 1,
              minWidth: 170,
              valueGetter: (params) => {
                return params.data[val];
              },
            }));
            setColDef(tempColDef);
            setChangedData(data);
          } catch (error) {
            console.error("Failed to load feature-pair correlations:", error);
            setData([]);
            setChangedData([]);
            setColDef([]);
          } finally {
            setIsPairLoading(false);
          }
        };

        fetchData();
      }
    }
  }, [filter1, filter2, rowData]);

  useEffect(() => {
    let temp = JSON.parse(JSON.stringify(Data));
    if (drop) {
      temp = temp.filter(
        (val) => parseInt(val["Correlation Coefficient"]) !== 1
      );
    }
    if (absolute) {
      temp = temp.map((val) => {
        return {
          ...val,
          "Correlation Coefficient": Math.abs(
            parseFloat(val["Correlation Coefficient"])
          ),
        };
      });
    }

    setChangedData(temp);
  }, [drop, absolute, Data]);

  return (
    <div className="mt-3">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid items-end gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label
            htmlFor="feature-1-filter"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
          >
            Feature 1 Filter
          </label>
          <select
            id="feature-1-filter"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
            value={filter1}
            onChange={(e) => setFilter1(e.target.value)}
          >
            {columnNames.map((name) => (
              <option key={`feature-1-${name}`} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-4">
          <label
            htmlFor="feature-2-filter"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
          >
            Feature 2 Filter
          </label>
          <select
            id="feature-2-filter"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
            value={filter2}
            onChange={(e) => setFilter2(e.target.value)}
          >
            {columnNames.map((name) => (
              <option key={`feature-2-${name}`} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-4 flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2">
            <label
              htmlFor="drop-perfect"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-[#0D9488]/10"
            >
              <input
                id="drop-perfect"
                type="checkbox"
                checked={drop}
                onChange={(e) => setDrop(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-[#0D9488]"
              />
              <span>Drop Perfect</span>
            </label>
            <label
              htmlFor="absolute-value"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-[#0D9488]/10"
            >
              <input
                id="absolute-value"
                type="checkbox"
                checked={absolute}
                onChange={(e) => setAbsolute(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-[#0D9488]"
              />
              <span>Absolute Value</span>
            </label>
        </div>
        </div>
      </div>

      {(isBaseLoading || isPairLoading) && (
        <div className="mt-4 flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600">
          <CircularProgress size={34} sx={{ color: "#0D9488" }} />
          <p className="mt-3 text-sm font-medium text-gray-600">Loading feature-pair data...</p>
        </div>
      )}

      {!isBaseLoading && !isPairLoading && Data.length > 0 && colDef.length > 0 && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2">
          <AgGridComponent rowData={changedData} columnDefs={colDef} height={520} />
        </div>
      )}

      {!isBaseLoading && !isPairLoading && Data.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Select filters to preview feature-pair correlation rows.
        </div>
      )}
    </div>
  );
}

export default FeaturePair;
