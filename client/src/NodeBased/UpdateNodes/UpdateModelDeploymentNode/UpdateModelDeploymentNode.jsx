import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import MultipleDropDown from "../../../FunctionBased/Components/MultipleDropDown/MultipleDropDown";

function UpdateModelDeploymentNode({ visible, setVisible, nodeId, csvData }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [allColumnNames, setAllColumnNames] = useState([]);
  const [allColumnValues, setAllColumnValues] = useState([]);
  const [filtered_column, setFilteredColumn] = useState(allColumnValues);
  const [select_columns, setSelectColumns] = useState("all");
  const [model_deploy, setModelDeploy] = useState();
  const [train, setTrain] = useState();
  const [target_var, setTargetVar] = useState();
  const [filter_col_name, setFilterColName] = useState([]);
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    let data = nodeDetails.data;
    // console.log(data);
    setAllColumnValues(data.result_init);
    setAllColumnNames(data.result_init.map((val) => val.col));
    setFilteredColumn(data.result);
    setModelDeploy(data.model.model_deploy);
    setTrain(data.train);
    setTargetVar(data.target_var);
    setSelectColumns(data.select_columns || "all");
    setFilterColName(data.filter_col_name || []);
  }, [nodeDetails]);

  const handleChangeValue = (ind, value) => {
    setFilteredColumn(
      filtered_column.map((val, i) => {
        if (i === ind)
          return {
            ...val,
            value:
              val.data_type === "float" ? parseFloat(value) : parseInt(value),
          };
        return val;
      })
    );
  };

  const handleSave = () => {
    let table = nodeDetails.data.table_init;
    if (select_columns === "custom") {
      table = nodeDetails.data.table.filter((val) =>
        filter_col_name.includes(val["Name of Features"])
      );
    }
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        model_deploy,
        train,
        target_var,
        select_columns,
        result: filtered_column,
        table,
        filter_col_name,
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
          Edit Model Deployment Options
        </h1>

        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-4">
          <div className="mt-4">
            <Radio.Group
              label="Select Columns"
              orientation="horizontal"
              color="success"
              defaultValue={select_columns}
              onChange={(e) => {
                setFilterColName([]);
                if (e === "all") {
                  setFilteredColumn(allColumnValues);
                } else {
                  setFilteredColumn([]);
                }
                setSelectColumns(e);
              }}
            >
              <Radio value="all">All Columns</Radio>
              <Radio value="custom">Custom Columns</Radio>
            </Radio.Group>
          </div>
          {select_columns === "custom" && (
            <div className="mt-4">
              <p>Custom Columns</p>
              <MultipleDropDown
                columnNames={allColumnNames}
                defaultValue={filter_col_name}
                setSelectedColumns={(e) => {
                  setFilterColName(e);
                  const tempSet = new Set(e);
                  const temp = allColumnValues.filter((val) =>
                    tempSet.has(val.col)
                  );
                  setFilteredColumn(temp);
                }}
              />
            </div>
          )}
          {filtered_column && filtered_column.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-col gap-4">
                {filtered_column.map((val, ind) => (
                  <div key={ind}>
                    <p className="mb-1">{filtered_column[ind].col}</p>
                    <Input
                      bordered
                      color="success"
                      value={
                        filtered_column[ind].data_type === "float"
                          ? parseFloat(filtered_column[ind].value)
                          : parseInt(filtered_column[ind].value)
                      }
                      onChange={(e) => handleChangeValue(ind, e.target.value)}
                      fullWidth
                      step={
                        filtered_column[ind].data_type === "float" ? 0.01 : 1
                      }
                      type="number"
                      size="lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 shadow-md border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4 z-[100]">
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

export default UpdateModelDeploymentNode;
