import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import NextTable from "../../../../Components/NextTable/NextTable";
import { apiService } from "../../../../../services/api/apiService";

function MutualInformation({ csvData }) {
  const method = useSelector((state) => state.featureSelection.method);
  const target_var = useSelector(
    (state) => state.featureSelection.target_variable
  );
  const [data, setData] = useState();

  useEffect(() => {
    if (method === "Mutual Information") {
      (async function () {
        const Data = await apiService.matflow.featureEngineering.featureSelection({
          method,
          target_var,
          dataset: csvData,
        });

        setData(Data.selected_features);
      })();
    }
  }, [method, target_var, csvData]);

  return (
    <div>
      {data && (
        <div className="mt-8">
          <div>
            <h3 className="font-medium text-lg mb-1">
              Selected Features and Scores:{" "}
            </h3>
            <NextTable rowData={data.selected_features} />
          </div>
          {data.graph_data && data.graph_data.scatter_plot && (
            <div className="flex justify-center mt-4">
              <Plot
                data={JSON.parse(data.graph_data.scatter_plot).data}
                layout={{
                  ...JSON.parse(data.graph_data.scatter_plot).layout,
                  showlegend: true,
                }}
                config={{
                  editable: true,
                  responsive: true,
                }}
              />
            </div>
          )}
          {data.graph_data && data.graph_data.bar_plot && (
            <div className="flex justify-center mt-4">
              <Plot
                data={JSON.parse(data.graph_data.bar_plot).data}
                layout={{
                  ...JSON.parse(data.graph_data.bar_plot).layout,
                  showlegend: true,
                }}
                config={{
                  editable: true,
                  responsive: true,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MutualInformation;
