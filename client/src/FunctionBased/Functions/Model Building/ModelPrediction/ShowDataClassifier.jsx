import React from "react";
import Plot from "react-plotly.js";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";

function ShowDataClassifier({ data, result }) {
  if (
    result === "Confusion Matrix" ||
    result === "Actual vs. Predicted" ||
    result === "ROC Curve" ||
    result === "Precision-Recall Curve"
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
    let columnDef = Object.keys(data.table[0]).map((val) => ({
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
            <AgGridComponent rowData={data.table} columnDefs={columnDef} />
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

  if (result === "Classification Report") {
    const temp = data.replaceAll("\n", "<br />");
    return (
      <div>
        <pre dangerouslySetInnerHTML={{ __html: temp }}></pre>
      </div>
    );
  }

  if (
    result === "Accuracy" ||
    result === "Precision" ||
    result === "Recall" ||
    result === "F1-Score"
  )
    return (
      <div className="font-semibold text-3xl">
        {result} : {data}
      </div>
    );
  return <div></div>;
}

export default ShowDataClassifier;
