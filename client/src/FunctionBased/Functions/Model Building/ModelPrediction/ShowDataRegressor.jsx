import React from "react";
import Plot from "react-plotly.js";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";

function ShowDataRegressor({ data, result }) {
  if (
    result === "Regression Line Plot" ||
    result === "Actual vs. Predicted" ||
    result === "Residuals vs. Predicted" ||
    result === "Histogram of Residuals" ||
    result === "QQ Plot" ||
    result === "Box Plot of Residuals"
  )
    return (
      <div className="mt-4 text-center">
        <Plot
          data={JSON.parse(data.graph).data}
          layout={{ ...JSON.parse(data.graph).layout, showlegend: true }}
          config={{ editable: true, responsive: true }}
        />
      </div>
    );

  if (result === "Target Value") {
    let columnDef = Object.keys(JSON.parse(data.table)[0]).map((val) => ({
      headerName: val,
      field: val,
    }));

    return (
      <div className="flex gap-4">
        <div className="flex-1 mr-4">
          <div
            className="ag-theme-alpine"
            style={{ height: "600px", width: "100%" }}
          >
            <AgGridComponent
              rowData={JSON.parse(data.table)}
              columnDefs={columnDef}
            />
          </div>
        </div>
        <div className="mt-4 text-center flex-1">
          <Plot
            data={JSON.parse(data.graph).data}
            layout={{ ...JSON.parse(data.graph).layout, showlegend: true }}
            config={{ editable: true, responsive: true }}
          />
        </div>
      </div>
    );
  }

  if (
    result === "R-Squared" ||
    result === "Mean Absolute Error" ||
    result === "Mean Squared Error" ||
    result === "Root Mean Squared Error"
  )
    return (
      <div className="font-semibold text-3xl">
        {result} : {data}
      </div>
    );
  return <div>ShowDataRegressor</div>;
}

export default ShowDataRegressor;
