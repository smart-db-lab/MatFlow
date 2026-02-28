import styled from "@emotion/styled";
import { Slider, Stack } from "@mui/material";
import { Checkbox } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import NextTable from "../../../../Components/NextTable/NextTable";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../../../services/api/apiService";

function SelectKBest({ csvData }) {
  const allNumberColumn = Object.keys(csvData[0]);
  const method = useSelector((state) => state.featureSelection.method);
  const d_type = useSelector((state) => state.featureSelection.data_type);
  const target_var = useSelector(
    (state) => state.featureSelection.target_variable
  );
  const [best_Kfeature, setBestKFeature] = useState(1);
  const [score_func, setScoreFunction] = useState(
    d_type === "number" ? "f_regression" : "f_classif"
  );
  const [show_graph, setShowGraph] = useState(false);
  const [data, setData] = useState();

  useEffect(() => {
    if (method === "SelectKBest") {
      (async function () {
        const Data = await apiService.matflow.featureEngineering.featureSelection({
          method,
          best_Kfeature,
          score_func,
          target_var,
          dataset: csvData,
        });

        setData(Data.selected_features);
      })();
    }
  }, [method, best_Kfeature, score_func, target_var, csvData]);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3">
          <p>Select number of features to keep:</p>
          <div className="mt-12">
            <Stack
              spacing={2}
              direction="row"
              sx={{ mb: 1 }}
              alignItems="center"
            >
              <span>1</span>
              <PrettoSlider
                aria-label="Auto Bin Slider"
                min={1}
                max={allNumberColumn.length - 1}
                step={1}
                defaultValue={1}
                value={best_Kfeature}
                onChange={(e) => setBestKFeature(e.target.value)}
                valueLabelDisplay="on"
                color="primary"
              />
              <span>{allNumberColumn.length - 1}</span>
            </Stack>
          </div>
        </div>
        <div>
          <div>
            <p>Select Score Function:</p>
            <SingleDropDown
              columnNames={
                d_type === "number"
                  ? ["f_regression", "mutual_info_regression"]
                  : ["f_classif", "mutual_info_classif"]
              }
              initValue={score_func}
              onValueChange={setScoreFunction}
            />
          </div>
          <Checkbox
            key={`show-graph-${show_graph}`}
            label="Show Graph"
            className="mt-4"
            color="primary"
            defaultSelected={show_graph}
            onChange={(e) => setShowGraph(e.valueOf())}
          />
        </div>
      </div>
      {data && (
        <div className="mt-8">
          <div>
            <h3 className="font-medium text-lg mb-1">
              Selected Features and Scores:{" "}
            </h3>
            <NextTable rowData={data.selected_features} />
          </div>
          {show_graph && data.graph_data && data.graph_data.bar_plot && (
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
          {show_graph && data.graph_data && data.graph_data.scatter_plot && (
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
        </div>
      )}
    </div>
  );
}

export default SelectKBest;

const PrettoSlider = styled(Slider)({
  color: "#52af77",
  height: 8,
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "unset",
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: "#52af77",
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&:before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
});
