import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import { setActiveID, setNodeType, setRightSidebarData } from "../../../Slices/SideBarSlice";
import { handleTestTrainDataset } from "../../../util/NodeFunctions";
import UpdateTestTrainDatasetNode from "../../UpdateNodes/UpdateTestTrainDatasetNode/UpdateTestTrainDatasetNode";

function TestTrainDatasetNode({ id, data }) {
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
            (rflow.getNode(edge.target).type === "Build Model" ||
              rflow.getNode(edge.target).type ===
                "Hyper-parameter Optimization")
        );
      temp.forEach(async (val) => {
        await handleTestTrainDataset(rflow, val);
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
        <Handle type="source" position={Position.Top} id="test"></Handle>
        <Handle type="source" position={Position.Bottom} id="train"></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center gap-1 p-2 py-3 min-w-[80px]">
          {!data ? (
            <>
              {/* <SplitscreenIcon /> */}
              <span>Test-Train Dataset</span>
            </>
          ) : (
            <div className="grid gap-2">
              <button className="border p-2 text-xs border-gray-600 rounded shadow-sm hover:bg-black hover:text-gray-200 font-medium text-gray-700">
                {data.test_dataset_name}
              </button>
              <button className="border p-2 text-xs border-gray-600 rounded shadow-sm hover:bg-black hover:text-gray-200 font-medium text-gray-700">
                {data.train_dataset_name}
              </button>
            </div>
          )}
        </div>
      </div>
      {data && data.whatKind && (
        <UpdateTestTrainDatasetNode
          visible={visible}
          setVisible={setVisible}
          whatKind={data.whatKind}
          nodeId={id}
        />
      )}
    </>
  );
}

export default TestTrainDatasetNode;
