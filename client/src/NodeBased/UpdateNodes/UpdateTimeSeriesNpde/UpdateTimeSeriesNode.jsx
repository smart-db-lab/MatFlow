import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../services/api/apiService";

function UpdateTimeSeriesNode({ visible, setVisible, csvData, nodeId }) {
  const allColumnNames = Object.keys(csvData[0]);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [target_variable, setTargetVariable] = useState("");
  const [format, setFormat] = useState("");
  const [time, setTime] = useState("");
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);
  const [newTime, setNewTime] = useState();

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.timeSeries) {
      setTargetVariable(data.timeSeries.target_variable);
    }
  }, [nodeDetails]);

  useEffect(() => {
    if (time) {
      // console.log(time);
      let splittedFormat = format.split(" ");

      let date = splittedFormat[0];
      const separator = date[2];
      date = date.split(separator);
      let temp = "";
      date.forEach((val) => {
        if (val[1] === "Y") temp += time.$y;
        if (val[1] === "m") temp += time.$M;
        if (val[1] === "d") temp += time.$D;
        temp += separator;
      });
      temp = temp.slice(0, -1);

      if (splittedFormat.length > 1) {
        temp += " ";
        temp += time.$H + " " + time.$m + " " + time.$s;
      }

      setNewTime(temp);
    }
  }, [time, format]);

  useEffect(() => {
    (async function () {
      const data = await apiService.matflow.timeSeries.timeSeries({
        file: csvData,
        select_column: target_variable,
      });
      if ("format" in data) {
        setFormat(data.format);
      }
    })();
  }, [target_variable]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        timeSeries: {
          target_variable,
          date: newTime,
        },
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
        <h1 className="text-center font-medium tracking-wider text-3xl px-6">
          Edit Time Series Analyis Options
        </h1>
        <div className="min-w-[500px] mx-auto w-full p-6 py-4 pb-12 mt-4">
          <div className="w-full">
            <p>Select Column</p>
            <SingleDropDown
              columnNames={allColumnNames}
              onValueChange={setTargetVariable}
              initValue={target_variable}
            />
          </div>
          {format && (
            <div className="mt-6">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DateTimePicker"]}>
                  <DateTimePicker
                    views={[
                      "year",
                      "month",
                      "day",
                      "hours",
                      "minutes",
                      "seconds",
                    ]}
                    label={`Select a time. Format: (${format})`}
                    onChange={(e) => setTime(e)}
                  />
                </DemoContainer>
              </LocalizationProvider>
            </div>
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

export default UpdateTimeSeriesNode;
