import { jsontohtml } from "jsontohtml-render";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { NODES } from "../../../util/util";
import Output from "../Output/Output";

function OutputPanel() {
  const data = useSelector((state) => state.sideBar.data);
  const nodeType = useSelector((state) => state.sideBar.nodeType);
  const [showData, setShowData] = useState(false);
  const [showConnect, setShowConnect] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  // console.log({ data, nodeType });

  return (
    <div
      className={`relative top-[70px] z-50 overflow-y-auto w-full transition-[width] border-r shadow-xl bg-white px-3 pb-3`}
      style={{ height: "calc(100vh - 70px)" }}
    >
      <PanelGroup autoSaveId="rightsidebar" direction="vertical">
        <Panel
          collapsible={true}
          defaultSize={60}
          collapsedSize={5}
          minSize={20}
          onCollapse={(e) => {
            if (e) setShowOutput(false);
            else setShowOutput(true);
          }}
        >
          <div
            className={`relative  h-full pb-2 mb-2 ${
              showOutput && "overflow-y-auto"
            }`}
          >
            <h3 className="text-lg bg-white font-semibold tracking-wide py-2  sticky top-0 z-[50]">
              Output
            </h3>
            {showOutput && data && (
              <Output outputData={{ type: nodeType, data }} />
            )}
          </div>
        </Panel>
        <PanelResizeHandle className="h-1.5 w-[80%] mx-auto rounded-full bg-gray-500/20"></PanelResizeHandle>
        <Panel
          collapsible={true}
          defaultSize={15}
          collapsedSize={5}
          onCollapse={(e) => {
            if (e) setShowConnect(false);
            else setShowConnect(true);
          }}
        >
          <div
            className={`relative  h-full pb-2 mb-2 ${
              showConnect && "overflow-y-auto"
            }`}
          >
            <h3 className="text-lg bg-white font-semibold tracking-wide py-2  sticky top-0 z-[50]">
              Can Connect With
            </h3>
            {showConnect && (
              <div
                className="h-full w-full mt-1"
                dangerouslySetInnerHTML={{
                  __html: jsontohtml(
                    nodeType ? NODES[nodeType] : { msg: "Select a node" },
                    {
                      colors: {
                        background: "whitesmoke",
                        keys: "red",
                        values: {
                          string: "green",
                          number: "#FFA500",
                          comma_colon_quotes: "#9c9c9c",
                        },
                      },
                      bracket_pair_lines: { color: "#bcbcbc" },
                    }
                  ),
                }}
              ></div>
            )}
          </div>
        </Panel>
        <PanelResizeHandle className="h-1.5 w-[80%] mx-auto rounded-full bg-gray-500/20"></PanelResizeHandle>
        <Panel
          onCollapse={(e) => {
            if (e) setShowData(false);
            else setShowData(true);
          }}
          collapsible={true}
          defaultSize={5}
          collapsedSize={5}
          minSize={10}
        >
          <div
            className={` h-full relative pb-2 ${showData && "overflow-auto"}`}
          >
            <h3 className="text-lg bg-white font-semibold tracking-wide py-2  sticky top-0 z-[50]">
              Data
            </h3>
            {showData && (
              <div
                className="h-full w-full mt-1"
                dangerouslySetInnerHTML={{
                  __html: jsontohtml(
                    data && Object.keys(data).length
                      ? data
                      : { msg: "Select a node" },
                    {
                      colors: {
                        background: "whitesmoke",
                        keys: "red",
                        values: {
                          string: "green",
                          number: "#FFA500",
                          comma_colon_quotes: "#9c9c9c",
                        },
                      },
                      bracket_pair_lines: { color: "#bcbcbc" },
                    }
                  ),
                }}
              ></div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default OutputPanel;
