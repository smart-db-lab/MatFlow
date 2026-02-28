import React, { useEffect, useState } from "react";
import { RxRocket } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import { setActiveID, setNodeType, setRightSidebarData } from "../../../Slices/SideBarSlice";
import {
  handleModelDeployment,
  handleOutputTable,
} from "../../../util/NodeFunctions";
import UpdateModelDeploymentNode from "../../UpdateNodes/UpdateModelDeploymentNode/UpdateModelDeploymentNode";

function ModelDeploymentNode({ id, data }) {
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
      const tempText = rflow
        .getEdges()
        .filter(
          (edge) =>
            edge.source === id && rflow.getNode(edge.target).type === "Text"
        );

      const tempTable = rflow
        .getEdges()
        .filter(
          (edge) =>
            edge.source === id && rflow.getNode(edge.target).type === "Table"
        );
      tempText.forEach(async (val) => {
        await handleModelDeployment(rflow, val);
      });
      tempTable.forEach(async (val) => {
        await handleOutputTable(rflow, val);
      });
    })();
  }, [data, rflow]);

  return (
    <>
      <div
        className="flex relative bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
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
        <Handle type="target" position={Position.Left}></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center gap-1 p-2 py-3 min-w-[80px]">
          <RxRocket size={"25"} />
          <span>Model Deployment</span>
        </div>
      </div>
      {data && data.table && (
        <UpdateModelDeploymentNode
          visible={visible}
          setVisible={setVisible}
          nodeId={id}
          csvData={data.table}
        />
      )}
    </>
  );
}

export default ModelDeploymentNode;
