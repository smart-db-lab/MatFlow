import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useDispatch, useSelector } from "react-redux";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  setActiveID,
  setNodeType,
  setRightSidebarData,
} from "../../../Slices/SideBarSlice";

function ChartNode({ id, data }) {
  // console.log(data);
  const [visible, setVisible] = useState(false);
  const handler = () => setVisible(true);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const rflow = useReactFlow();
  const type = rflow.getNode(id).type;
  const dispatch = useDispatch();
  const activeID = useSelector((state) => state.sideBar.active_id);

  useEffect(() => {
    if (activeID === id) {
      dispatch(setRightSidebarData(JSON.stringify(data)));
    }
  }, [activeID, id, data]);

  const closeHandler = () => {
    setVisible(false);
  };

  return (
    <>
      <div
        className="flex relative bg-white border-2 border-black shadow-[6px_6px_0_1px_rgba(0,0,0,0.7)]"
        onDoubleClick={handler}
        onClick={() => {
          dispatch(setRightSidebarData(JSON.stringify(data)));
          dispatch(setNodeType(type));
          dispatch(setActiveID(id));
        }}
      >
        {/* <Handle type="source" position={Position.Right}></Handle> */}
        <Handle type="target" position={Position.Left}></Handle>
        {activeID === id && (
          <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-0 translate-x-1/2 translate-y-1/2 bg-green-700"></div>
        )}
        <div className="grid place-items-center p-2 py-3 min-w-[80px]">
          <AutoGraphOutlinedIcon />
          <span>Graph</span>
        </div>
      </div>
      <Modal
        closeButton
        width="700px"
        fullScreen={isFullScreen}
        aria-labelledby="modal-title"
        open={visible}
        scroll
        onClose={closeHandler}
      >
        <Modal.Header>
          <h1 className="text-3xl tracking-wide font-semibold">Data Graph</h1>
          <span
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="absolute left-0 top-0 translate-x-1/2 translate-y-1/2"
          >
            {isFullScreen ? (
              <FullscreenExitIcon color="action" />
            ) : (
              <FullscreenIcon color="action" />
            )}
          </span>
        </Modal.Header>
        <Modal.Body>
          <div>
            {!data || !data.method ? (
              <>
                {data && data.graph && (
                  <div className="flex justify-center mt-4">
                    <Plot
                      data={data.graph?.data}
                      layout={{ ...data.graph.layout, showlegend: true }}
                      config={{
                        editable: true,
                        responsive: true,
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                {data.graphs &&
                  data.graphs.map((graph, ind) => (
                    <div key={ind} className="flex justify-center my-4">
                      <Plot
                        data={graph.data}
                        layout={{ ...graph.layout, showlegend: true }}
                        config={{
                          editable: true,
                          responsive: true,
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default ChartNode;
