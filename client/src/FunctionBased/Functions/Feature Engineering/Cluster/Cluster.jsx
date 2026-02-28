import styled from "@emotion/styled";
import { TextField } from "@mui/material";
import { Slider, Stack } from "@mui/material";
import { Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import AgGridComponent from "../../../Components/AgGridComponent/AgGridComponent";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function Cluster({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const allColumns = Object.keys(csvData[0]);
  const [numberOfClass, setNumberOfClass] = useState(3);
  const [display_type, setDisplayType] = useState("Graph");
  const [target_variable, setTargetVariable] = useState("");
  const [data, setData] = useState(["", "", ""]);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [graphTableData, setGraphTableData] = useState();
  const [columnDefs, setColumnDefs] = useState();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (type === "node" && initValue) {
      setNumberOfClass(initValue.numberOfClass || 3);
      setTargetVariable(initValue.target_variable || "");
      setData(initValue.data || ["", "", ""]);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        display_type,
        target_variable,
        data,
        numberOfClass,
      });
    }
  }, [data, target_variable, numberOfClass]);

  useEffect(() => {
    if (display_type === "Table" && graphTableData) {
      const tableData = graphTableData.table;
      const tempColumnDefs =
        tableData.length > 0
          ? Object.keys(tableData[0]).map((key) => ({
              headerName: key,
              field: key,
              valueGetter: (params) => {
                return params.data[key];
              },
            }))
          : [];
      setColumnDefs(tempColumnDefs);
    }
  }, [display_type, graphTableData]);

  const handleSave = async () => {
    try {
      const Data = await apiService.matflow.featureEngineering.cluster({
        file: csvData,
        display_type,
        target_variable,
        data,
      });

      setGraphTableData(Data);
    } catch (error) {
      toast.error("Something went wrong. Please try again", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="mt-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 tracking-wide">
          Number of classes
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Select how many class names you want to define.
        </p>
        <div className="mt-8">
          <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
            <span className="text-sm font-medium text-gray-700">1</span>
            <PrettoSlider
              aria-label="Auto Bin Slider"
              min={1}
              max={10}
              step={1}
              defaultValue={3}
              value={numberOfClass}
              onChange={(e) => {
                const val = e.target.value;
                setNumberOfClass(val);
                if (val < data.length) setData(data.slice(0, val));
                else {
                  const temp = JSON.parse(JSON.stringify(data));
                  while (val - temp.length > 0) {
                    temp.push("");
                  }
                  setData(temp);
                }
              }}
              valueLabelDisplay="on"
              color="primary"
            />
            <span className="text-sm font-medium text-gray-700">10</span>
          </Stack>
        </div>
      </div>
      <div
        className={`grid grid-cols-2 mt-8 gap-4 ${
          type === "node" && "grid-cols-1"
        }`}
      >
        {data.map((val, index) => {
          return (
            <div key={index} className="">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                Class {index + 1} Name
              </label>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter class name"
                required
                value={val}
                onChange={(e) =>
                  setData(
                    data.map((d, ind) => {
                      if (ind === index) return e.target.value;
                      return d;
                    })
                  )
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9ca3af",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#0D9488",
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.95rem",
                    color: "#1f2937",
                  },
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
        {type === "function" && (
          <div className="w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px]">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-1.5">
              Display Type
            </p>
            <SingleDropDown
              columnNames={["Graph", "Table"]}
              onValueChange={setDisplayType}
              initValue={display_type}
            />
          </div>
        )}
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-1.5">
            Target Variable
          </p>
          <SingleDropDown
            columnNames={allColumns}
            onValueChange={setTargetVariable}
            initValue={target_variable}
          />
        </div>
      </div>
      {type === "function" && (
        <button
          className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
          onClick={handleSave}
        >
          Submit
        </button>
      )}

      <div className="mt-4">
        {type === "function" &&
          graphTableData &&
          (display_type === "Graph" ? (
            <div className="flex justify-center mt-4">
              <Plot
                data={JSON.parse(graphTableData.graph).data}
                layout={{
                  ...JSON.parse(graphTableData.graph).layout,
                  showlegend: true,
                }}
                config={{ editable: true, responsive: true }}
              />
            </div>
          ) : (
            <div className="mt-4 w-full">
              {graphTableData.table.length > 0 && (
                <div
                  className="ag-theme-alpine"
                  style={{ height: "600px", width: "100%" }}
                >
                  <AgGridComponent
                    rowData={graphTableData.table}
                    columnDefs={columnDefs}
                    download={true}
                  />
                </div>
              )}
            </div>
          ))}
      </div>

      {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
      <Modal
        open={visible}
        onClose={closeModal}
        aria-labelledby="help-modal"
        aria-describedby="help-modal-description"
        width="800px"
        scroll
        closeButton
      >
        <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
          <Docs section={"cluster"} />
        </div>
      </Modal>
    </div>
  );
}

export default Cluster;

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
