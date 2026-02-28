import React, { useEffect, useState } from "react";
import { AiOutlineLineChart } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import { setActiveID, setNodeType, setRightSidebarData } from "../../../Slices/SideBarSlice";
import { handleTimeSeriesAnalysis } from "../../../util/NodeFunctions";
import UpdateTimeSeriesNode from "../../UpdateNodes/UpdateTimeSeriesNpde/UpdateTimeSeriesNode";

function TimeSeriesNode({ id, data }) {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const rflow = useReactFlow();
  const type = rflow.getNode(id).type;
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
            edge.source === id && rflow.getNode(edge.target).type === "Graph"
        );
      temp.forEach(async (val) => {
        await handleTimeSeriesAnalysis(rflow, val);
      });
    })();
  }, [data]);

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
        <div className="grid place-items-center p-3 px-4 min-w-[80px]">
          <AiOutlineLineChart size={"30"} />
          <span className="mt-1 text-center text-sm">
            Time Series <br /> Analysis
          </span>
        </div>
      </div>
      {data && data.table && (
        <UpdateTimeSeriesNode
          visible={visible}
          setVisible={setVisible}
          csvData={data.table}
          nodeId={id}
        />
      )}
    </>
  );
}

export default TimeSeriesNode;
