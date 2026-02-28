import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";

function UpdateAlterFieldNameNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState([{ column_name: "", new_field_name: "" }]);
  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const columnNames = Object.keys(csvData[0]);
  const [dataset_name, setDatasetName] = useState("");
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    let data = nodeDetails.data;
    if (data && data.alterFieldName) {
      data = data.alterFieldName;
      setDatasetName(data.dataset_name || "");
      setNumberOfColumns(data.number_of_columns || 1);
      setData(data.data || { column_name: "", new_field_name: "" });
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        alterFieldName: {
          number_of_columns: numberOfColumns,
          data,
          file: csvData,
          dataset_name,
        },
      },
    };

    const tempNodes = rflow.getNodes().map((node) => {
      if (node.id === nodeId) return tempNode;
      return node;
    });
    rflow.setNodes(tempNodes);
  };

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setData(temp);
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
          Edit Add/Modify Options
        </h1>

        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-4">
          <Input
            label="Number of columns"
            value={numberOfColumns}
            onChange={(e) => {
              const val = e.target.value;
              setNumberOfColumns(val);
              if (val < data.length) setData(data.slice(0, val));
              else {
                const temp = JSON.parse(JSON.stringify(data));
                while (val - temp.length > 0) {
                  temp.push({
                    column_name: "",
                    new_field_name: "",
                  });
                }
                setData(temp);
              }
            }}
            type="number"
            step={1}
            fullWidth
          />
          <div className="mt-8">
            {columnNames &&
              data.map((val, index) => {
                return (
                  <div key={index} className="flex items-end gap-8 mt-6">
                    <div className="w-full">
                      <p>Column {index + 1}</p>
                      <SingleDropDown
                        columnNames={columnNames}
                        onValueChange={(e) =>
                          handleChange(e, index, "column_name")
                        }
                        initValue={val.column_name}
                      />
                    </div>
                    <Input
                      fullWidth
                      label="New Field Name"
                      placeholder="New name."
                      value={val.new_field_name}
                      onChange={(e) =>
                        handleChange(e.target.value, index, "new_field_name")
                      }
                    />
                  </div>
                );
              })}
          </div>
          <div>
            <Input
              label="New Dataset Name"
              fullWidth
              clearable
              value={dataset_name}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
        </div>

        <div className=" bg-white border-t-2 border-gray-200 flex items-center gap-4 w-full justify-end px-6 py-3 pt-6 mt-4 z-[100]">
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

export default UpdateAlterFieldNameNode;
