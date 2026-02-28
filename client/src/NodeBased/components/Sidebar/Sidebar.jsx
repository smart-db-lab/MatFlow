import { Collapse } from "@nextui-org/react";
import { useEffect, useRef } from "react";
import { AiOutlineDoubleLeft } from "react-icons/ai";

import { useDispatch, useSelector } from "react-redux";
import { setShowLeftSideBar } from "../../../Slices/SideBarSlice";
import {
  DATASET_NODES,
  FEATURE_ENGINEERING,
  FUNCTION_NODES,
  IO_NODES,
  MODEL_BUILDING,
} from "../../../util/util";

const Sidebar = ({ onValueChange }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };
  const dispatch = useDispatch();
  const showLeftSidebar = useSelector((state) => state.sideBar.showLeftSideBar);
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      onValueChange(ref.current.offsetWidth);
    }
  }, [ref.current]);

  return (
    <div
      className={`relative top-[70px] z-50 overflow-y-auto grid place-items-center ${
        !showLeftSidebar ? "max-w-0" : "max-w-sm"
      } transition-[width] border-r shadow `}
      ref={ref}
      style={{ height: "calc(100vh - 70px)" }}
    >
      {showLeftSidebar && (
        <button
          onClick={() => dispatch(setShowLeftSideBar(!showLeftSidebar))}
          className="absolute z-[50] right-0 top-0 translate-y-1/2 -translate-x-1/2 border p-1 px-1.5 border-gray-400/70 rounded text-gray-700 "
        >
          <AiOutlineDoubleLeft size="15" />
        </button>
      )}
      <aside className="bg-white h-full w-full p-4 border-l-2 shadow-2xl ">
        <h3 className="font-bold  text-3xl mb-2">Node Packet</h3>
        <p className=" mb-4">Drag and Drop nodes onto your editor.</p>
        <div className="grid gap-4">
          {/* Input-Output Nodes */}
          <Collapse.Group bordered>
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">
                  Input-Output Nodes
                </h1>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                {IO_NODES.map((node) => {
                  return (
                    <button
                      key={node.key}
                      className="grid gap-1 place-items-center border-2 px-2 py-3 rounded-md shadow text-sm "
                      onDragStart={(event) => onDragStart(event, node.label)}
                      draggable
                    >
                      {node.icon && <span>{node.icon}</span>}
                      <span className="text-xs">{node.label}</span>
                    </button>
                  );
                })}
              </div>
            </Collapse>
          </Collapse.Group>

          {/* Dataset Nodes */}
          <Collapse.Group bordered>
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">Dataset Nodes</h1>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                {DATASET_NODES.map((node) => {
                  return (
                    <button
                      key={node.key}
                      className="grid gap-1 place-items-center border-2 px-2 py-3 rounded-md shadow text-sm "
                      onDragStart={(event) => onDragStart(event, node.label)}
                      draggable
                    >
                      {node.icon && <span>{node.icon}</span>}
                      <span className="text-xs">{node.label}</span>
                    </button>
                  );
                })}
              </div>
            </Collapse>
          </Collapse.Group>

          {/* Function Nodes */}
          <Collapse.Group bordered>
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">Function Nodes</h1>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                {FUNCTION_NODES.map((node) => {
                  if (node.children.length === 0) {
                    return (
                      <button
                        key={node.key}
                        className="grid gap-1 place-items-center border-2 px-2 py-3 rounded-md shadow text-sm "
                        onDragStart={(event) => onDragStart(event, node.label)}
                        draggable
                      >
                        {node.icon && <span>{node.icon}</span>}
                        <span className="text-xs">{node.label}</span>
                      </button>
                    );
                  }
                })}
              </div>
            </Collapse>
          </Collapse.Group>

          {/* Feature Engineering Nodes */}
          <Collapse.Group bordered>
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">
                  Feature Engineering
                </h1>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                {FEATURE_ENGINEERING.map((node) => (
                  <button
                    className="grid gap-1 place-items-center border-2 px-2 py-3 rounded-md shadow text-sm "
                    onDragStart={(event) => onDragStart(event, node.label)}
                    draggable
                    key={node.key}
                  >
                    {node.icon && <span>{node.icon}</span>}
                    <span className="text-xs">{node.label}</span>
                  </button>
                ))}
              </div>
            </Collapse>
          </Collapse.Group>

          {/* Model Building Nodes */}
          <Collapse.Group bordered>
            <Collapse
              title={
                <h1 className="font-medium tracking-wider">
                  Model Building Nodes
                </h1>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                {MODEL_BUILDING.map((node) => (
                  <button
                    className="grid gap-1 place-items-center border-2 px-2 py-3 rounded-md shadow text-sm "
                    onDragStart={(event) => onDragStart(event, node.label)}
                    draggable
                    key={node.key}
                  >
                    {node.icon && <span>{node.icon}</span>}
                    <span className="text-xs">{node.label}</span>
                  </button>
                ))}
              </div>
            </Collapse>
          </Collapse.Group>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;


