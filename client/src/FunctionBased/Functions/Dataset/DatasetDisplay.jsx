import React, { useState } from "react";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

const DatasetDisplay = ({ csvData }) => {
  const [value] = useState("All");
  const [filterText] = useState("");

  

  // Define the row data based on the selected view option
  let rowData;
  if (value === "Head") {
    rowData = csvData.slice(0, 10); // Display the first 10 rows
  } else if (value === "Tail") {
    rowData = csvData.slice(-10); // Display the last 10 rows
  } else if (value === "Custom") {
    // Apply custom filtering based on filterText
    rowData = csvData.filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== null &&
          value.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  } else {
    rowData = csvData; // Display all rows
  }

  const columnDefs =
    csvData.length > 0
      ? Object.keys(csvData[0]).map((key) => ({
          headerName: key,
          field: key,
          valueGetter: (params) => {
            return params.data[key];
          },
        }))
      : [];

  // console.log(columnDefs);

  return (
    <div>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Display Dataset</h1>
        <p className="mt-1 text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{rowData.length}</span> rows
        </p>
      </div>

      <div className="mt-4 w-full">
        {rowData.length > 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <AgGridComponent rowData={rowData} columnDefs={columnDefs} />
          </div>
        ) : (
          <div className="grid h-[200px] place-items-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
            No rows to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetDisplay;
