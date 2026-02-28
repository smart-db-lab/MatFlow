import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import { applyPlotlyTheme } from "../../../shared/plotlyTheme";
import * as Stat from "statistics.js";
import { fetchDataFromIndexedDB } from "../../../util/indexDB";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import FeaturePair from "../../Components/FeaturePair/FeaturePair";
import { apiService } from "../../../services/api/apiService";

function DatasetCorrelation({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [constRowData, setConstRowData] = useState([]);
  const [constColDef, setConstColDef] = useState([]);
  const [relationMethod, setRelationMethod] = useState("pearson");
  const [displayType, setDisplayType] = useState("table");
  const [colWithInd, setColWithInd] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [columnNames, setColumnNames] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [plotlyData, setPlotlyData] = useState();
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (activeCsvFile && Array.isArray(csvData) && csvData.length > 0) {
      const calculateCorrelations = (data) => {
        let columnNames = Object.keys(data[0]);
        columnNames = columnNames.filter(
          (val) => typeof data[0][val] === "number" && val !== "id"
        );
        const correlations = {};

        for (let i = 0; i < columnNames.length; i++) {
          const column1 = columnNames[i];
          correlations[column1] = {};

          for (let j = 0; j < columnNames.length; j++) {
            const column2 = columnNames[j];
            const column1Data = [];
            const column2Data = [];
            const tempData = [];

            for (let k = 0; k < data.length; k++) {
              const val1 = parseFloat(data[k][column1]);
              const val2 = parseFloat(data[k][column2]);

              if (!isNaN(val1) && !isNaN(val2)) {
                column1Data.push(val1);
                column2Data.push(val2);

                tempData.push({
                  [column1]: val1,
                  [column2]: val2,
                });
              }
            }

            const bodyVars = {
              [column1]: "metric",
              [column2]: "metric",
            };

            const temp = new Stat(tempData, bodyVars);
            // Calculate the correlation coefficient using simple-statistics correlation function
            const l = Object.keys(bodyVars);

            if (relationMethod === "spearman") {
              const cc = temp.spearmansRho(
                l[0],
                l[l.length === 1 ? 0 : 1],
                true
              );

              // // Store the correlation coefficient in the correlations object
              correlations[column1][column2] = cc.rho.toFixed(3);
            } else if (relationMethod === "pearson") {
              const cc = temp.correlationCoefficient(
                l[0],
                l[l.length === 1 ? 0 : 1]
              );

              // // Store the correlation coefficient in the correlations object
              correlations[column1][column2] =
                cc.correlationCoefficient.toFixed(3);
            }
          }
        }

        return correlations;
      };

      const fetchCSVData = async () => {
        try {
          const res = await fetchDataFromIndexedDB(activeCsvFile.name);

          const correlations = calculateCorrelations(csvData);
          const { columnDefs, rowData } = generateAgGridData(correlations);

          setColumnDefs(columnDefs);
          setRowData(rowData);
          setInitialData(res);
          setConstRowData(rowData);
          setConstColDef(columnDefs);

          const allColumnName = rowData[0] ? Object.keys(rowData[0]) : [];
          let tempColInd = {};
          for (let i = 0; i < allColumnName.length; i++) {
            tempColInd = { ...tempColInd, [allColumnName[i]]: i };
          }
          setColWithInd(tempColInd);
          setColumnNames(allColumnName);
          setSelectedColumns(allColumnName);
        } catch (error) {
          console.error("Error:", error);
        }
      };
      fetchCSVData();
    }
  }, [activeCsvFile, relationMethod, csvData]);

  useEffect(() => {
    if (relationMethod === "kendall") {
      const fetchData = async () => {
        const response = await apiService.matflow.dataset.getCorrelation({ file: initialData });
        let { data } = response;

        const tempData = typeof data === 'string' ? JSON.parse(data) : data;

        let columnName = Object.keys(tempData[0]);
        columnName = columnName.filter((val) => val !== "id");
        let newData = [];
        for (let i = 0; i < columnName.length; i++) {
          const { id, ...rest } = tempData[i];
          newData.push(rest);
        }

        let columnDefs = Object.keys(newData[0]).map((columnName) => ({
          headerName: columnName,
          field: columnName,
          valueGetter: (params) => {
            return params.data[columnName];
          },
        }));
        columnDefs = [{ headerName: "", field: "column_name" }, ...columnDefs];
        // let ind = 0;
        newData = newData.map((val, ind) => {
          return { ...val, column_name: columnName[ind] };
        });

        setRowData(newData);
        setConstRowData(newData);
        setColumnDefs(columnDefs);
        setConstColDef(columnDefs);
      };

      fetchData();
    }
  }, [relationMethod, initialData]);

  const generateAgGridData = (correlations) => {
    let columnDefs = Object.keys(correlations).map((columnName) => ({
      headerName: columnName,
      field: columnName,
      valueGetter: (params) => {
        return params.data[columnName];
      },
    }));
    columnDefs = [{ headerName: "", field: "column_name" }, ...columnDefs];
    const columnName = Object.keys(correlations);
    let ind = 0;

    let rowData = Object.values(correlations);
    rowData = rowData.map((val) => {
      return { ...val, column_name: columnName[ind++] };
    });

    return { columnDefs, rowData };
  };

  useEffect(() => {
    const columnSelected = new Set(selectedColumns);

    let tempData = JSON.parse(JSON.stringify(constRowData));
    let tempColDef = JSON.parse(JSON.stringify(constColDef));

    // Change Row Data
    for (let i = 0; i < columnNames.length; i++) {
      if (columnSelected.has(columnNames[i])) continue;
      const colInd = colWithInd[columnNames[i]];
      for (let j = 0; j < tempData.length; j++) {
        if (colInd === j) tempData[j] = {};
        delete tempData[j][columnNames[i]];
      }
    }
    tempData = tempData.filter((val) => Object.keys(val).length !== 0);

    // Change Column
    for (let i = 0; i < columnNames.length; i++) {
      if (columnSelected.has(columnNames[i])) continue;
      tempColDef = tempColDef.filter((val) => val.field !== columnNames[i]);
    }

    setRowData(tempData);
    setColumnDefs(tempColDef);
  }, [selectedColumns]);

  useEffect(() => {
    if (displayType === "heatmap") {
      const fetchData = async () => {
        const res = await apiService.matflow.dataset.getCorrelationHeatmap({ file: rowData });
        const data = res.data || res;

        setPlotlyData(typeof data === 'string' ? JSON.parse(data) : data);
      };
      fetchData();
    }
  }, [rowData, displayType]);

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
    <div className="ag-theme-alpine w-full h-[600px]">
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Correlation</h1>
            <p className="text-sm text-gray-500">Compare feature relationships across selected columns</p>
          </div>
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className="rounded-lg border border-[#0D9488]/30 bg-white px-3 py-2 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
          >
            {showControls ? "Hide Controls" : "Show Controls"}
          </button>
        </div>
      </div>
      {rowData && columnDefs && (
        <>
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="correlation-method" className="text-sm font-medium text-gray-700">
                  Correlation Method
                </label>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  name="correlation-method"
                  id="correlation-method"
                  value={relationMethod}
                  onChange={(e) => setRelationMethod(e.target.value)}
                >
                  <option value="pearson">Pearson</option>
                  <option value="kendall">Kendall</option>
                  <option value="spearman">Spearman</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="display-type" className="text-sm font-medium text-gray-700">
                  Display Type
                </label>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  name="display-type"
                  id="display-type"
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value)}
                >
                  <option value="table">Table</option>
                  <option value="heatmap">Heatmap</option>
                  <option value="feature_pair">Feature Pair</option>
                </select>
              </div>
            </div>

            {showControls && (
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
                  {filteredColumns
                    .filter((column) => column !== "column_name")
                    .map((column, index) => (
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

          {displayType === "table" ? (
            <div className="rounded-xl border border-gray-200 bg-white p-2">
              <AgGridComponent columnDefs={columnDefs} rowData={rowData} />
            </div>
          ) : displayType === "heatmap" ? (
            <div>
              {plotlyData && (
                <div className="flex justify-center mt-8">
                  <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Plot
                      data={plotlyData?.data}
                      layout={applyPlotlyTheme(plotlyData.layout, "Correlation Heatmap")}
                      config={{
                        responsive: true,
                        displaylogo: false,
                      }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <FeaturePair rowData={rowData} />
          )}
        </>
      )}
    </div>
  );
}

export default DatasetCorrelation;
