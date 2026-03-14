import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Panel as Pan,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { toast } from "react-toastify";
import uuid from "react-uuid";
import ReactFlow, {
  Background,
  MarkerType,
  Panel,
  addEdge,
  useEdges,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import AddModify from "../NodeBased/CustomNodes/AddModify/AddModify";
import AlterFieldNameNode from "../NodeBased/CustomNodes/AlterFieldNameNode/AlterFieldNameNode";
import AppendDatasetNode from "../NodeBased/CustomNodes/AppendDatasetNode/AppendDatasetNode";
import BuildModelNode from "../NodeBased/CustomNodes/BuildModelNode/BuildModelNode";
import ChangeDtypeNode from "../NodeBased/CustomNodes/ChangeDTypeNode/ChangeDtypeNode";
import ChartNode from "../NodeBased/CustomNodes/ChartNode/ChartNode";
import ClusterNode from "../NodeBased/CustomNodes/ClusterNode/ClusterNode";
import CorelationNode from "../NodeBased/CustomNodes/CorelationNode/CorelationNode";
import DropRowsColumnNode from "../NodeBased/CustomNodes/DropRowsColumnNode/DropRowsColumnNode";
import DuplicateNode from "../NodeBased/CustomNodes/DuplicateNode/DuplicateNode";
import EDANode from "../NodeBased/CustomNodes/EDANode/EDANode";
import EncodingNode from "../NodeBased/CustomNodes/EncodingNode/EncodingNode";
import FeatureSelectionNode from "../NodeBased/CustomNodes/FeatureSelectionNode/FeatureSelectionNode";
import FileNode from "../NodeBased/CustomNodes/FileNode/FileNode";
import GroupNode from "../NodeBased/CustomNodes/GroupNode/GroupNode";
import HyperParameterNode from "../NodeBased/CustomNodes/HyperparameterNode/HyperParameterNode";
import ImputationNode from "../NodeBased/CustomNodes/ImputationNode/ImputationNode";
import InformationNode from "../NodeBased/CustomNodes/InformationNode/InformationNode";
import MergeDatasetNode from "../NodeBased/CustomNodes/MergeDatasetNode/MergeDatasetNode";
import ModelDeploymentNode from "../NodeBased/CustomNodes/ModelDeploymentNode/ModelDeploymentNode";
import ModelEvaluationNode from "../NodeBased/CustomNodes/ModelEvaluationNode/ModelEvaluationNode";
import ModelNode from "../NodeBased/CustomNodes/ModelNode/ModelNode";
import ModelPredictionNode from "../NodeBased/CustomNodes/ModelPredictionNode/ModelPredictionNode";
import ReverseMLNode from "../NodeBased/CustomNodes/ReverseMLNode/ReverseMLNode";
import ScalingNode from "../NodeBased/CustomNodes/ScalingNode/ScalingNode";
import SplitDatasetNode from "../NodeBased/CustomNodes/SplitDatasetNode/SplitDatasetNode";
import StatisticsNode from "../NodeBased/CustomNodes/StatisticsNode/StatisticsNode";
import TableNode from "../NodeBased/CustomNodes/TableNode/TableNode";
import TestTrainDatasetNode from "../NodeBased/CustomNodes/TestTrainDatasetNode/TestTrainDatasetNode";
import TextNode from "../NodeBased/CustomNodes/TextNode/TextNode";
import TimeSeriesNode from "../NodeBased/CustomNodes/TimeSeiresNode/TimeSeriesNode";
import UploadFile from "../NodeBased/CustomNodes/UploadFile/UploadFile";
import Controls from "../NodeBased/components/Controls/Controls";
import EditorTopbar from "../NodeBased/components/EditorTopbar/EditorTopbar";
import OutputPanel from "../NodeBased/components/OutputPanel/OutputPanel";
import Sidebar from "../NodeBased/components/Sidebar/Sidebar";

import { setNodeType, setRightSidebarData } from "../Slices/SideBarSlice";
import {
  handleAddModify,
  handleAlterFieldName,
  handleAppendDataset,
  handleChangeDtype,
  handleCluster,
  handleDatasetCorrelation,
  handleDatasetDuplicate,
  handleDatasetGroup,
  handleDatasetInformation,
  handleDatasetStatistics,
  handleDropRowColumn,
  handleEncoding,
  handleFeatureSelection,
  handleFileForMergeDataset,
  handleHyperParameter,
  handleImputation,
  handleImputationInit,
  handleMergeDataset,
  handleModel,
  handleModelDeployment,
  handleModelDeploymentInit,
  handleModelEvaluation,
  handleModelEvaluationInit,
  handleModelPrediction,
  handleModelPredictionInit,
  handleModelPredictionText,
  handleOutputTable,
  handlePlotOptions,
  handleReverseML,
  handleScaling,
  handleSplitDataset,
  handleTestTrainDataset,
  handleTestTrainPrint,
  handleTimeSeriesAnalysis,
  isItTimeSeriesFile,
} from "../util/NodeFunctions";

const nodeTypes = {
  "Upload File": UploadFile,
  Graph: ChartNode,
  Table: TableNode,
  EDA: EDANode,
  ReverseML: ReverseMLNode,
  "Time Series Analysis": TimeSeriesNode,
  "Merge Dataset": MergeDatasetNode,
  "Add/Modify": AddModify,
  "Change Dtype": ChangeDtypeNode,
  "Alter Field Name": AlterFieldNameNode,
  "Drop Column/Rows": DropRowsColumnNode,
  Scaling: ScalingNode,
  Encoding: EncodingNode,
  Cluster: ClusterNode,
  "Append Dataset": AppendDatasetNode,
  Information: InformationNode,
  Statistics: StatisticsNode,
  Corelation: CorelationNode,
  Correlation: CorelationNode,
  Group: GroupNode,
  Duplicate: DuplicateNode,
  Imputation: ImputationNode,
  "Split Dataset": SplitDatasetNode,
  "Test-Train Dataset": TestTrainDatasetNode,
  "Build Model": BuildModelNode,
  "Hyper-parameter Optimization": HyperParameterNode,
  Model: ModelNode,
  "Model Deployment": ModelDeploymentNode,
  Text: TextNode,
  "Model Evaluation": ModelEvaluationNode,
  "Model Prediction": ModelPredictionNode,
  "Feature Selection": FeatureSelectionNode,
  File: FileNode,
};

const initialNodes = [
  {
    id: uuid(),
    type: "Upload File",
    position: {
      x: 100,
      y: window.innerHeight / 2 - 200,
    },
  },
];

function EditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const reactFlowWrapper = useRef(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const rflow = useReactFlow();
  const edgeList = useEdges();
  const showRightSidebar = useSelector(
    (state) => state.sideBar.showRightSideBar
  );
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const ref = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (ref.current && !showRightSidebar) {
      ref.current.collapse();
    }
  }, [showRightSidebar]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      // check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: uuid(),
        type,
        position,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodesDelete = (e) => {
    // console.log(e[0].id)
  };

  const onEdgesDelete = (e) => {
    const sourceNode = rflow.getNode(e[0].source);
    const targetNode = rflow.getNode(e[0].target);
    dispatch(setRightSidebarData(undefined));
    dispatch(setNodeType(""));
    // if (
    //   sourceNode.type === "Upload File" &&
    //   targetNode.type === "Merge Dataset"
    // ) {
    //   const tempNodes = rflow.getNodes().map((val) => {
    //     if (val.id === targetNode.id) {
    //       delete val.data[sourceNode.data.file_name];
    //       if (val.data.merge && Object.keys(val.data).length <= 2) {
    //         delete val.data.merge;
    //       }
    //     }
    //     return val;
    //   });
    //   console.log(tempNodes);
    //   rflow.setNodes(tempNodes);
    //   return;
    // }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === e[0].target) return { ...val, data: undefined };
      return val;
    });
    console.log(tempNodes);
    rflow.setNodes(tempNodes);
  };

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem("flow"));

      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        rflow.setViewport({ x, y, zoom });
      }
    };

    restoreFlow();
  }, [setNodes, rflow.setViewport]);

  useEffect(() => {
    onRestore();
  }, []);

  const onConnect = useCallback(
    async (params) => {
      const source = rflow.getNode(params.source);
      const target = rflow.getNode(params.target);
      const typeSource = rflow.getNode(params.source).type;
      const typeTarget = rflow.getNode(params.target).type;
      let ok = false;

      if (typeTarget !== "Merge Dataset" && typeTarget !== "Append Dataset") {
        const temp = edgeList.filter((val) => val.target === params.target);
        if (temp && temp.length > 0) {
          toast.error(`Connection limit of ${typeTarget} node is 1`, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          return;
        }
      }

      setEdges((eds) => {
        const temp = {
          ...params,
          style: { strokeWidth: 1, stroke: "grey" },
          animated: true,
        };
        const allEdges = addEdge(temp, eds);
        // console.log(allEdges)
        return allEdges;
      });

      if (
        (typeSource === "Upload File" || typeSource === "File") &&
        (typeTarget === "Table" ||
          typeTarget === "EDA" ||
          typeTarget === "ReverseML" ||
          typeTarget === "Add/Modify" ||
          typeTarget === "Change Dtype" ||
          typeTarget === "Alter Field Name" ||
          typeTarget === "Drop Column/Rows" ||
          typeTarget === "Scaling" ||
          typeTarget === "Encoding" ||
          typeTarget === "Cluster" ||
          typeTarget === "Information" ||
          typeTarget === "Statistics" ||
          typeTarget === "Corelation" ||
          typeTarget === "Correlation" ||
          typeTarget === "Group" ||
          typeTarget === "Duplicate" ||
          typeTarget === "Split Dataset" ||
          typeTarget === "Feature Selection")
      ) {
        ok = await handleOutputTable(rflow, params);
      }

      if (
        (typeSource === "EDA" ||
          typeSource === "Upload File" ||
          typeSource === "File") &&
        typeTarget === "Graph"
      ) {
        // console.log(rflow);
        ok = await handlePlotOptions(rflow, params);
      }

      if (typeSource === "ReverseML" && typeTarget === "Table") {
        ok = await handleReverseML(rflow, params);
      }

      if (
        (typeSource === "Upload File" || typeSource === "File") &&
        typeTarget === "Time Series Analysis"
      ) {
        ok = await isItTimeSeriesFile(rflow, params);
      }

      if (typeSource === "Time Series Analysis" && typeTarget === "Graph") {
        ok = await handleTimeSeriesAnalysis(rflow, params);
      }

      if (
        (typeSource === "Upload File" || typeSource === "File") &&
        (typeTarget === "Merge Dataset" || typeTarget === "Append Dataset")
      ) {
        ok = await handleFileForMergeDataset(rflow, params);
      }

      if (typeSource === "Merge Dataset" && typeTarget === "File") {
        ok = await handleMergeDataset(rflow, params);
      }

      if (typeSource === "Add/Modify" && typeTarget === "File") {
        ok = await handleAddModify(rflow, params);
      }

      if (typeSource === "Change Dtype" && typeTarget === "File") {
        ok = await handleChangeDtype(rflow, params);
      }

      if (typeSource === "Alter Field Name" && typeTarget === "File") {
        ok = await handleAlterFieldName(rflow, params);
      }

      if (typeSource === "Drop Column/Rows" && typeTarget === "File") {
        ok = await handleDropRowColumn(rflow, params);
      }

      if (typeSource === "Scaling" && typeTarget === "File") {
        ok = await handleScaling(rflow, params);
      }

      if (typeSource === "Encoding" && typeTarget === "File") {
        ok = await handleEncoding(rflow, params);
      }

      if (typeSource === "Cluster" && typeTarget === "Table") {
        ok = await handleCluster(rflow, params, "table");
      }

      if (typeSource === "Cluster" && typeTarget === "Graph") {
        ok = await handleCluster(rflow, params, "graph");
      }

      if (typeSource === "Append Dataset" && typeTarget === "File") {
        ok = await handleAppendDataset(rflow, params);
      }

      if (typeSource === "Information" && typeTarget === "Table") {
        ok = handleDatasetInformation(rflow, params);
      }

      if (typeSource === "Statistics" && typeTarget === "Table") {
        ok = handleDatasetStatistics(rflow, params);
      }

      if ((typeSource === "Corelation" || typeSource === "Correlation") && typeTarget === "Table") {
        ok = await handleDatasetCorrelation(rflow, params, "table");
      }

      if ((typeSource === "Corelation" || typeSource === "Correlation") && typeTarget === "Graph") {
        ok = await handleDatasetCorrelation(rflow, params, "graph");
      }

      if (typeSource === "Group" && typeTarget === "Table") {
        ok = await handleDatasetGroup(rflow, params);
      }

      if (typeSource === "Duplicate" && typeTarget === "Table") {
        ok = await handleDatasetDuplicate(rflow, params);
      }

      if (
        (typeSource === "Upload File" || typeSource === "File") &&
        typeTarget === "Imputation"
      ) {
        ok = await handleImputationInit(rflow, params);
      }

      if (typeSource === "Imputation" && typeTarget === "File") {
        ok = await handleImputation(rflow, params);
      }

      if (
        typeSource === "Split Dataset" &&
        typeTarget === "Test-Train Dataset"
      ) {
        ok = await handleSplitDataset(rflow, params);
      }

      if (
        typeSource === "Test-Train Dataset" &&
        (typeTarget === "Build Model" ||
          typeTarget === "Hyper-parameter Optimization")
      ) {
        ok = await handleTestTrainDataset(rflow, params);
      }

      if (typeSource === "Test-Train Dataset" && typeTarget === "File") {
        ok = await handleTestTrainPrint(rflow, params);
      }

      if (
        typeSource === "Hyper-parameter Optimization" &&
        typeTarget === "Build Model"
      ) {
        ok = await handleHyperParameter(rflow, params);
      }

      if (typeSource === "Build Model" && typeTarget === "Model") {
        ok = await handleModel(rflow, params);
      }

      if (typeSource === "Model" && typeTarget === "Model Deployment") {
        ok = await handleModelDeploymentInit(rflow, params);
      }

      if (typeSource === "Model Deployment" && typeTarget === "Table") {
        ok = await handleOutputTable(rflow, params);
      }

      if (typeSource === "Model Deployment" && typeTarget === "Text") {
        ok = await handleModelDeployment(rflow, params);
      }

      if (typeSource === "Model" && typeTarget === "Model Evaluation") {
        ok = await handleModelEvaluationInit(rflow, params);
      }

      if (typeSource === "Model Evaluation" && typeTarget === "Table") {
        ok = await handleModelEvaluation(rflow, params, "table");
      }

      if (typeSource === "Model Evaluation" && typeTarget === "Graph") {
        ok = await handleModelEvaluation(rflow, params, "graph");
      }

      if (typeSource === "Model" && typeTarget === "Model Prediction") {
        ok = await handleModelPredictionInit(rflow, params);
      }

      if (
        typeSource === "Model Prediction" &&
        (typeTarget === "Graph" || typeTarget === "Table")
      ) {
        ok = await handleModelPrediction(rflow, params);
      }

      if (typeSource === "Model Prediction" && typeTarget === "Text") {
        ok = await handleModelPredictionText(rflow, params);
      }

      if (
        typeSource === "Feature Selection" &&
        (typeTarget === "Table" || typeTarget === "Graph")
      ) {
        ok = await handleFeatureSelection(rflow, params);
      }

      if (!ok) return;

      setTimeout(() => {
        let tempEdge = rflow.getEdges().map((val) => {
          if (val.source === source.id && val.target === target.id) {
            return {
              ...val,
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: "#000",
              },
              style: { strokeWidth: 2, stroke: "#000" },
            };
          }
          return val;
        });

        if (!ok) {
          tempEdge = tempEdge.filter(
            (val) => !(val.source === source.id && val.target === target.id)
          );
        }

        rflow.setEdges(tempEdge);
      }, 0);
    },

    [nodes, rflow, edgeList]
  );

  return (
    <div className="flex  flex-col md:flex-row flex-1 h-screen bg-slate-200">
      <Sidebar onValueChange={setSidebarWidth} />
      <EditorTopbar reactFlowInstance={reactFlowInstance} />

      <PanelGroup autoSaveId="editor" direction="horizontal">
        <Pan defaultSize={75} minSize={50}>
          <div
            className="reactflow-wrapper h-full flex-grow"
            ref={reactFlowWrapper}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              // fitView
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              // className="relative"
            >
              <Background
                color="grey"
                variant={"dots"}
                gap={15}
                className="bg-slate-100"
              />
              {/* <Panel position="top-right">
            <button
              className="bg-white p-3 px-6 tracking-wider font-medium shadow-lg rounded border-2 border-black"
              onClick={onSave}
            >
              Save
            </button>
          </Panel> */}
              <Panel position="bottom-left">
                <Controls />
              </Panel>
            </ReactFlow>
          </div>
        </Pan>
        <PanelResizeHandle
          style={{ zIndex: "70", width: "4px" }}
          className="grid place-items-center hover:bg-gray-400 bg-[whitesmoke]"
        ></PanelResizeHandle>
        <Pan
          collapsedSize={0}
          collapsible={true}
          defaultSize={25}
          ref={ref}
          minSize={5}
        >
          <OutputPanel />
        </Pan>
      </PanelGroup>

      
    </div>
  );
}

export default EditorPage;
