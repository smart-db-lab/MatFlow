import { Collapse } from "@nextui-org/react";
import { jsontohtml } from "jsontohtml-render";
import React from "react";
import Plot from "react-plotly.js";
import AgGridAutoDataComponent from "../../../FunctionBased/Components/AgGridComponent/AgGridAutoDataComponent";

const TABLE = [
  "Alter Field Name",
  "File",
  "Table",
  "Change Dtype",
  "Imputation",
  "Encoding",
  "Scaling",
  "Drop Column/Rows",
  "Feature Selection",
  "Cluster",
  "Add/Modify",
  "Upload File",
  "ReverseML",
  "Time Series Analysis",
  "Split Dataset",
];

function Output({ outputData: { data, type } }) {
  let model_setting;
  let hyper;
  let graphs;
  let tables;

  if (data.method && data.method === "Feature Selection") {
    tables = data.tables;
  }

  if (type === "Graph") {
    const tmp = JSON.parse(data);
    if (tmp.method) graphs = tmp.graphs;
    else if (tmp.graph) graphs = [tmp.graph];
    console.log(graphs);
  }

  if (
    type === "Build Model" ||
    type === "Model" ||
    type === "Hyper-parameter Optimization"
  ) {
    model_setting = data.model_setting;
    hyper = data.hyper;
    data = data.testTrain;
  }

  if (!type)
    return <h1 className="text-lg mt-1">Select a node to see the output</h1>;

  if (!data) return <h1 className="text-lg mt-1">No data found.</h1>;

  const renderModelSetting = (hyperEnabled = false) => {
    return (
      <Collapse.Group bordered className="mt-2">
        <Collapse
          title={
            <h1 className="font-medium tracking-wider">
              {hyperEnabled ? "Hyperparameter" : "Model"} Setting
            </h1>
          }
        >
          <div
            className="h-full w-full mt-1 overflow-auto"
            dangerouslySetInnerHTML={{
              __html: jsontohtml(hyperEnabled ? hyper : model_setting, {
                colors: {
                  background: "whitesmoke",
                  keys: "red",
                  values: {
                    string: "green",
                    number: "#FFA500",
                    comma_colon_quotes: "#9c9c9c",
                  },
                },
                bracket_pair_lines: { color: "#bcbcbc" },
              }),
            }}
          ></div>
        </Collapse>
      </Collapse.Group>
    );
  };

  if (TABLE.includes(type) && type === "Table" && !tables && data.table)
    return (
      <Collapse.Group bordered className="mt-2">
        <Collapse title={<h1 className="font-medium tracking-wider">Table</h1>}>
          <div className=" w-full h-full overflow-auto">
            {data.file_name && (
              <h3 className="font-medium text-center text-lg mb-1">
                File Name: {data.file_name}
              </h3>
            )}
            <AgGridAutoDataComponent
              rowData={data.table}
              download
              height="500px"
              rowHeight={40}
              headerHeight={40}
              paginationPageSize={10}
            />
          </div>
        </Collapse>
      </Collapse.Group>
    );

  if (type === "Append Dataset" || type === "Merge Dataset")
    return (
      <>
        {Object.keys(data).map((val, ind) => (
          <Collapse.Group bordered key={ind} className="mt-2">
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">Table {ind + 1}</h1>
              }
            >
              <div className=" w-full h-full overflow-auto">
                {data[val] && (
                  <h3 className="font-medium text-center text-lg mb-1">
                    File Name: {val}
                  </h3>
                )}
                <AgGridAutoDataComponent
                  rowData={data[val]}
                  download
                  height="500px"
                  rowHeight={40}
                  headerHeight={40}
                  paginationPageSize={10}
                />
              </div>
            </Collapse>
          </Collapse.Group>
        ))}
      </>
    );

  if (
    type === "Test-Train Dataset" ||
    type === "Build Model" ||
    type === "Model" ||
    type === "Hyper-parameter Optimization"
  )
    return (
      <>
        {["table", "test", "train"].map((val, ind) => (
          <Collapse.Group bordered key={ind} className="mt-2">
            <Collapse
              title={
                <h1 className="font-medium tracking-wider capitalize">
                  {val === "table" ? val : val + " Dataset"}
                </h1>
              }
            >
              <div className=" w-full h-full overflow-auto">
                {data[
                  val === "test"
                    ? "test_dataset_name"
                    : val === "train"
                    ? "train_dataset_name"
                    : ""
                ] && (
                  <h3 className="font-medium text-center text-lg mb-1">
                    File Name:{" "}
                    {
                      data[
                        val === "test"
                          ? "test_dataset_name"
                          : val === "train"
                          ? "train_dataset_name"
                          : ""
                      ]
                    }
                  </h3>
                )}
                <AgGridAutoDataComponent
                  rowData={data[val]}
                  download
                  height="500px"
                  rowHeight={40}
                  headerHeight={40}
                  paginationPageSize={10}
                />
              </div>
            </Collapse>
          </Collapse.Group>
        ))}
        {type === "Build Model" && renderModelSetting()}
        {type === "Hyper-parameter Optimization" && renderModelSetting(true)}
      </>
    );

  if (type === "Model Deployment")
    return (
      <Collapse.Group bordered className="mt-2">
        <Collapse
          title={<h1 className="font-medium tracking-wider">Features</h1>}
        >
          <div className=" w-full h-full overflow-auto">
            <AgGridAutoDataComponent
              rowData={data.table}
              download
              height="500px"
              rowHeight={40}
              headerHeight={40}
              paginationPageSize={10}
            />
          </div>
        </Collapse>
      </Collapse.Group>
    );

  if (type === "Graph" && graphs)
    return (
      <>
        {graphs.map((val, ind) => (
          <Collapse.Group bordered key={ind} className="mt-2">
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">Graph {ind + 1}</h1>
              }
            >
              <div
                key={ind}
                className="flex justify-center my-4 overflow-auto w-full h-full"
              >
                <Plot
                  data={val.data}
                  layout={{
                    ...val.layout,
                    showlegend: true,
                    width: 600,
                    height: 500,
                  }}
                  config={{
                    editable: true,
                    responsive: true,
                    autosizable: true,
                  }}
                />
              </div>
            </Collapse>
          </Collapse.Group>
        ))}
      </>
    );

  if (tables) {
    return (
      <>
        {tables.map((val, ind) => (
          <Collapse.Group bordered key={ind} className="mt-2">
            <Collapse
              title={
                <h1 className="font-medium tracking-wider capitalize">
                  {val.heading}
                </h1>
              }
            >
              <div className=" w-full h-full overflow-auto">
                <AgGridAutoDataComponent
                  rowData={val.table}
                  download
                  height="500px"
                  rowHeight={40}
                  headerHeight={40}
                  paginationPageSize={10}
                />
              </div>
            </Collapse>
          </Collapse.Group>
        ))}
      </>
    );
  }

  return <h3>There are no specific output in this node</h3>
}

export default Output;
