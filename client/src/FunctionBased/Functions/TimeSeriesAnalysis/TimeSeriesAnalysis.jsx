import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { Collapse } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../util/adminAuth";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../services/api/apiService";

function TimeSeriesAnalysis({ csvData }) {
  const allColumnNames = Object.keys(csvData[0]);
  const [dataTimeWarning, setDateTimeWarning] = useState(false);
  const [target_variable, setTargetVariable] = useState("");
  const [timeSeriesData, setTimeSeriesData] = useState();
  const [newTime, setNewTime] = useState();
  const [time, setTime] = useState();
  const [graphData, setGraphData] = useState();

  useEffect(() => {
    if (time) {
      // console.log(time);
      let splittedFormat = timeSeriesData.format.split(" ");

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
  }, [time, timeSeriesData]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await apiService.matflow.timeSeries.timeSeries({
        file: csvData,
        select_column: target_variable,
      });
      if (data.error) {
        setDateTimeWarning(true);
      } else {
        setGraphData(typeof data.graph === 'string' ? JSON.parse(data.graph) : data.graph);
        setTimeSeriesData(data);
      }
    };
    fetchData();
  }, [target_variable, csvData]);

  useEffect(() => {
    if (dataTimeWarning) {
      toast.warn("No datetime found! (Check another dataset)", {
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [dataTimeWarning]);

  const handleSave = async () => {
    try {
      const data = await apiService.matflow.timeSeries.timeSeriesAnalysis({
        file: csvData,
        date: newTime,
        select_column: target_variable,
      });
      setTimeSeriesData(data);
      setGraphData(typeof data.graph === 'string' ? JSON.parse(data.graph) : data.graph);
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

  const initialColumnDefs =
    csvData.length > 0
      ? Object.keys(csvData[0]).map((key) => ({
          headerName: key,
          field: key,
          valueGetter: (params) => {
            return params.data[key];
          },
        }))
      : [];

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-medium tracking-wide">
        Time Series Analysis
      </h1>
      <div className="mt-4">
        <Collapse.Group
          bordered
          accordion={false}
          borderWeight={"normal"}
          css={{ borderColor: "green" }}
          shadow
        >
          <Collapse
            title={
              <h1 className="font-medium tracking-wide text-lg">
                Original Dataset
              </h1>
            }
          >
            <div className="w-full h-[570px]">
              {csvData.length > 0 && (
                <div
                  className="ag-theme-alpine"
                  style={{ height: "510px", width: "100%" }}
                >
                  <AgGridComponent
                    rowData={csvData}
                    columnDefs={initialColumnDefs}
                    rowHeight={40}
                  />
                </div>
              )}
            </div>
          </Collapse>
        </Collapse.Group>
      </div>
      {!dataTimeWarning && (
        <div className="mt-8">
          <div className="flex items-end gap-8">
            <div className="w-full">
              <p>Select Column</p>
              <SingleDropDown
                columnNames={allColumnNames}
                onValueChange={setTargetVariable}
              />
            </div>
          </div>
          {timeSeriesData && timeSeriesData.format && (
            <>
              <div className="mt-4">
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
                      label={`Select a time. Format: (${timeSeriesData.format})`}
                      onChange={(e) => setTime(e)}
                    />
                  </DemoContainer>
                </LocalizationProvider>
              </div>
              <button
                className="self-start mt-4 border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
                onClick={handleSave}
              >
                Submit
              </button>
              {graphData && (
                <div className="flex justify-center mt-4">
                  <Plot
                    data={graphData.data}
                    layout={{
                      ...graphData.layout,
                      showlegend: true,
                    }}
                    config={{
                      editable: true,
                      responsive: true,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeSeriesAnalysis;
