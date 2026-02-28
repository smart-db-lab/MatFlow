import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";
import BarPlot from "./plots/BarPlot";
import BoxPlot from "./plots/BoxPlot";
import CountPlot from "./plots/CountPlot";
import CustomPlot from "./plots/CustomPlot";
import Histogram from "./plots/Histogram";
import LinePlot from "./plots/LinePlot";
import PiePlot from "./plots/PiePlot";
import RegPlot from "./plots/RegPlot";
import ScatterPlot from "./plots/ScatterPlot";
import ViolinPlot from "./plots/ViolinPlot";
import VennDiagram from "../../../FunctionBased/Functions/EDA/VennDiagram.jsx";
const PLOT = [
  "Bar Plot",
  "Pie Plot",
  "Histogram",
  "Box Plot",
  "Violin Plot",
  "Scatter Plot",
  "Reg Plot",
  "Line Plot",
  "Custom Plot",
  "Venn Diagram"
];

function UpdateEDANode({ visible, setVisible, csvData }) {
  // console.log(csvData)
  const rflow = useReactFlow();
  const [plotType, setPlotType] = useState(PLOT[0]);
  const nodeId = useSelector((state) => state.EDA.nodeId);
  const nodeDetails = rflow.getNode(nodeId);
  const [plotOption, setPlotOption] = useState();
  const plot = useSelector((state) => state.EDA.plot);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (plot) setPlotOption(plot);
  }, [plot]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        plotOption,
      },
    };
    const tempNodes = rflow.getNodes().map((node) => {
      if (node.id === nodeId) return tempNode;
      return node;
    });
    rflow.setNodes(tempNodes);
  };

  return (
    <div>
      <Dialog
        open={visible}
        onClose={() => setVisible(false)}
        fullScreen={fullScreen}
        scroll="paper"
      >
        <span
          className="ml-auto p-2 cursor-pointer"
          onClick={() => setVisible(false)}
        >
          <CloseIcon color="action" />
        </span>
        <h1 className="text-center font-medium tracking-wider text-3xl">
          Edit EDA Options
        </h1>
        <div className="min-w-[500px] mx-auto w-full p-6 py-4">
          <div className="w-full">
            <p className="tracking-wide">Plot Type</p>
            <SingleDropDown
              columnNames={PLOT}
              initValue={plotType}
              onValueChange={(e) => {
                setPlotType(e);
                const tempNode = {
                  ...nodeDetails,
                  data: {
                    ...nodeDetails.data,
                    plot: e,
                    plotOption: {}, // Use plotOption if it exists, otherwise use {}
                  },
                };

                const tempNodes = rflow.getNodes().map((node) => {
                  if (node.id === nodeId) return tempNode;
                  return node;
                });

                rflow.setNodes(tempNodes);
              }}
            />
          </div>
          {plotType === "Bar Plot" && (
            <BarPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Box Plot" && (
            <BoxPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Pie Plot" && (
            <PiePlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Violin Plot" && (
            <ViolinPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Scatter Plot" && (
            <ScatterPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Reg Plot" && (
            <RegPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Line Plot" && (
            <LinePlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Custom Plot" && (
            <CustomPlot csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Histogram" && (
            <Histogram csvData={csvData} setPlotOption={setPlotOption} />
          )}
          {plotType === "Venn Diagram" && (
            <VennDiagram csvData={csvData} setPlotOption={setPlotOption} />
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4">
          <button
            className="font-medium border-2 p-2 px-4 text-lg tracking-wider border-gray-500 rounded"
            onClick={() => {
              setVisible(false);
            }}
          >
            Close
          </button>
          <button
            className="font-medium border-2 p-2 px-4 text-lg tracking-wider bg-black text-white rounded"
            onClick={() => {
              handleSave();
              setVisible(false);
            }}
          >
            Save
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default UpdateEDANode;
