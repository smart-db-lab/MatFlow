import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { GrTableAdd } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  setActiveID,
  setNodeType,
  setRightSidebarData,
} from "../../../Slices/SideBarSlice";
import { handleAppendDataset } from "../../../util/NodeFunctions";

function AppendDatasetNode({ id, data }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [visible, setVisible] = useState(false);
  const rflow = useReactFlow();
  const nodeDetails = rflow.getNode(id);
  const [dataset_name, setDatasetName] = useState("");
  const type = nodeDetails.type;
  const dispatch = useDispatch();
  const activeID = useSelector((state) => state.sideBar.active_id);

  useEffect(() => {
    if (activeID === id) {
      dispatch(setRightSidebarData(data));
    }
  }, [activeID, id, data]);

  useEffect(() => {
    (async function () {
      const temp = rflow
        .getEdges()
        .filter(
          (edge) =>
            edge.source === id &&
            rflow.getNode(edge.target).type === "Upload File"
        );
      temp.forEach(async (val) => {
        await handleAppendDataset(rflow, val);
      });
    })();
  }, [data, rflow]);

  useEffect(() => {
    const data = nodeDetails.data;
    if (data && data.append) {
      setDatasetName(data.append.dataset_name || "");
    }
  }, [nodeDetails]);

  const handleSave = () => {
    const tempNode = {
      ...nodeDetails,
      data: {
        ...nodeDetails.data,
        append: {
          file: Object.values(data)[0],
          file2: Object.values(data)[1],
          dataset_name,
        },
      },
    };

    const tempNodes = rflow.getNodes().map((node) => {
      if (node.id === id) return tempNode;
      return node;
    });

    rflow.setNodes(tempNodes);
  };

  return (
    <>
      <div
        className="relative flex bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
        onDoubleClick={() => {
          setVisible(!visible);
        }}
        onClick={() => {
          dispatch(setRightSidebarData(data));
          dispatch(setNodeType(type));
          dispatch(setActiveID(id));
        }}
      >
        <Handle type="source" position={Position.Right}></Handle>
        <Handle
          type="target"
          id="a"
          className="top-4"
          position={Position.Left}
        ></Handle>
        <Handle
          type="target"
          id="b"
          className="top-16"
          position={Position.Left}
        ></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center gap-1 p-2 py-3 min-w-[80px]">
          <GrTableAdd size={"20"} />
          <span>Append Dataset</span>
        </div>
      </div>
      {data && Object.keys(data).length >= 2 && (
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
            Edit Append Dataset Options
          </h1>

          <div className="min-w-[500px] mx-auto w-full p-6 py-4 space-y-4">
            <Input
              label="New Dataset Name"
              fullWidth
              clearable
              value={dataset_name}
              onChange={(e) => setDatasetName(e.target.value)}
            />
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
      )}
    </>
  );
}

export default AppendDatasetNode;
{
  /* <UpdateMergeDatasetNode
          visible={visible}
          setVisible={setVisible}
          table1={Object.values(data)[0]}
          table2={Object.values(data)[1]}
          nodeId={id}
        /> */
}
