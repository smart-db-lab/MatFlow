import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";
import SingleDropDown from "../../../FunctionBased/Components/SingleDropDown/SingleDropDown";
import DropColumn from "../../../FunctionBased/Functions/Feature Engineering/DropColumn/DropColumn";
import DropRow from "../../../FunctionBased/Functions/Feature Engineering/DropRow/DropRow";

function UpdateDropRowsColumnNode({ visible, setVisible, csvData, nodeId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [dropOption, setDropOption] = useState("Row");
  const [data, setData] = useState();
  const [dataset_name, setDatasetName] = useState("");
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(nodeId);

  useEffect(() => {
    let dataa = nodeDetails.data;
    if (dataa && dataa.dropColumnRow) {
      dataa = dataa.dropColumnRow;
      setData(dataa);
      setDatasetName(dataa.dataset_name);
      setDropOption(dataa.dropOption)
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        dropColumnRow: { ...data, dataset_name, dropOption, file: csvData },
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
          Edit Drop Column/Rows Options
        </h1>
        <div className="min-w-[600px] mx-auto w-full p-6 py-4 space-y-4">
          <div>
            <p>Drop Option</p>
            <SingleDropDown
              initValue={dropOption}
              columnNames={["Row", "Column"]}
              onValueChange={(e) => {
                setDropOption(e);
                setData();
              }}
            />
          </div>
          <div>
            {dropOption === "Row" ? (
              <DropRow
                csvData={csvData}
                type="node"
                initValue={data}
                onValueChange={setData}
              />
            ) : (
              <DropColumn
                csvData={csvData}
                type="node"
                initValue={data}
                onValueChange={setData}
              />
            )}
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

export default UpdateDropRowsColumnNode;
