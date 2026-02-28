import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import MultipleDropDown from "../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";

function UpdateModelEvaluationNode({ visible, setVisible, nodeId, metrics }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [display_result, setDisplayResult] = useState("All");
  const [columnName] = useState(Object.keys(metrics));
  const [filtered_column, setFilteredColumn] = useState(columnName);
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    const data = nodeDetails.data;
    if (data) {
      setFilteredColumn(data.filtered_column);
      setDisplayResult(data.display_result || "All");
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        filtered_column,
        display_result,
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
        <h1 className="text-center font-medium tracking-wider text-2xl">
          Edit Model Evaluation Options
        </h1>

        <div className="min-w-[500px] mx-auto w-full p-6 py-4">
          <div>
            <Radio.Group
              orientation="horizontal"
              label="Display Result"
              defaultValue={display_result}
              onChange={(e) => {
                setDisplayResult(e);
                if (e === "All") {
                  setFilteredColumn(columnName);
                } else if (e === "Train") {
                  setFilteredColumn(
                    columnName.filter((val) =>
                      val.toLowerCase().includes("train")
                    )
                  );
                } else if (e === "Test") {
                  setFilteredColumn(
                    columnName.filter((val) =>
                      val.toLowerCase().includes("test")
                    )
                  );
                } else setFilteredColumn([]);
              }}
              size="sm"
            >
              <Radio value="All" color="success">
                All
              </Radio>
              <Radio value="Train" color="success">
                Train
              </Radio>
              <Radio value="Test" color="success">
                Test
              </Radio>
              <Radio value="Custom" color="success">
                Custom
              </Radio>
            </Radio.Group>
          </div>
          {display_result === "Custom" && (
            <div className="mt-4">
              <p>Columns</p>
              <MultipleDropDown
                columnNames={columnName}
                setSelectedColumns={setFilteredColumn}
                defaultValue={filtered_column}
              />
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

export default UpdateModelEvaluationNode;
