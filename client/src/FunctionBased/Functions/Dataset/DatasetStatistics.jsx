import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as stats from "simple-statistics";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

function DatasetStatistics({ csvData }) {
  const [columnStats, setColumnStats] = useState([]);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const fetchCSVData = async () => {
        setColumnStats(calculateColumnStats(csvData));
      };
      fetchCSVData();
    }
  }, [activeCsvFile, csvData]);

  const calculateColumnStats = (rowData) => {
    if (!rowData || rowData.length === 0) return [];

    let columns = Object.keys(rowData[0] || {});
    const columnStatsData = [];
    columns = columns.filter((item) => {
      const dtype = typeof rowData[0][item];
      return dtype === "number";
    });

    columns.forEach((column) => {
      if (column !== "id") {
        let values = rowData
          .map((row) => parseFloat(row[column]))
          .filter((value) => !isNaN(value));
        const count = values.length;
        if (count > 0) {
          const min = stats.min(values).toFixed(3);
          const max = stats.max(values).toFixed(3);
          const std = stats.standardDeviation(values).toFixed(3);

          const mean = stats.mean(values).toFixed(3);
          const percentile25 = stats.quantile(values, 0.25).toFixed(3);
          const median = stats.quantile(values, 0.5).toFixed(3);
          const percentile75 = stats.quantile(values, 0.75).toFixed(3);

          columnStatsData.push({
            column,
            count,
            min,
            max,
            std,
            mean,
            "25%": percentile25,
            "50%": median,
            "75%": percentile75,
          });
        }
      }
    });

    return columnStatsData;
  };

  const columnDefs = useMemo(() => {
    const columns = Object.keys(columnStats[0] || {});
    return columns.map((column) => ({
      headerName: column,
      field: column,
      valueGetter: (params) => {
        return params.data[column];
      },
    }));
  }, [columnStats]);

  return (
    <div>
      <div className="my-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Dataset Statistics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Numeric columns analyzed: <span className="font-semibold text-gray-700">{columnStats.length}</span>
        </p>
      </div>
      <div className="w-full">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-2">
          <AgGridComponent rowData={columnStats} columnDefs={columnDefs} />
        </div>
      </div>
    </div>
  );
}

export default DatasetStatistics;
