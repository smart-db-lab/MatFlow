import React, { useEffect, useState } from "react";
import { AiOutlineMergeCells } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  setActiveID,
  setNodeType,
  setRightSidebarData,
} from "../../../Slices/SideBarSlice";
import { handleMergeDataset } from "../../../util/NodeFunctions";
import UpdateMergeDatasetNode from "../../UpdateNodes/UpdateMergeDatasetNode/UpdateMergeDatasetNode";

function MergeDatasetNode({ id, data }) {
  const [visible, setVisible] = useState(false);
  const rflow = useReactFlow();
  const type = rflow.getNode(id).type;
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
        await handleMergeDataset(rflow, val);
      });
    })();
  }, [data, rflow]);

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
          <AiOutlineMergeCells size={"25"} />
          <span>Merge Dataset</span>
        </div>
      </div>
      {data && Object.keys(data).length >= 2 && (
        <UpdateMergeDatasetNode
          visible={visible}
          setVisible={setVisible}
          table1={Object.values(data)[0]}
          table2={Object.values(data)[1]}
          nodeId={id}
        />
      )}
    </>
  );
}

export default MergeDatasetNode;
