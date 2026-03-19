import { FlaskConical, FolderOpen, PlusCircle } from "lucide-react";
import {
    HiOutlineDocumentReport,
    HiOutlinePuzzle,
} from "react-icons/hi";
import { AiOutlineLineChart } from "react-icons/ai";
import { PiGraph } from "react-icons/pi";
import DatasetDisplay from "../../../Functions/Dataset/DatasetDisplay";
import ChartFilePreview from "../../../Functions/Dataset/ChartFilePreview";
import UnifiedEDA from "../../../Functions/EDA/UnifiedEDA";
import BarPlot from "../../../Functions/EDA/BarPlot";
import PiePlot from "../../../Functions/EDA/PiePlot";
import BoxPlot from "../../../Functions/EDA/BoxPlot";
import Histogram from "../../../Functions/EDA/Histogram";
import ViolinPlot from "../../../Functions/EDA/ViolinPlot";
import ScatterPlot from "../../../Functions/EDA/ScatterPlot";
import RegPlot from "../../../Functions/EDA/RegPlot";
import LinePlot from "../../../Functions/EDA/LinePlot";
import ModelBuildingWorkflow from "../../../Functions/Model Building/ModelBuildingWorkflow";
import ModelDeployment from "../../../Functions/ModelDeployment/ModelDeployment";
import DatasetInformation from "../../../Functions/Dataset/DatasetInformation";
import DatasetStatistics from "../../../Functions/Dataset/DatasetStatistics";
import DatasetCorrelation from "../../../Functions/Dataset/DatasetCorrelation";
import DatasetDuplicates from "../../../Functions/Dataset/DatasetDuplicates";
import DatasetGroup from "../../../Functions/Dataset/DatasetGroup";
import UnifiedFeatureEngineering from "../../../Functions/Feature Engineering/UnifiedFeatureEngineering";
import TimeSeriesAnalysis from "../../../Functions/TimeSeriesAnalysis/TimeSeriesAnalysis";
import ReverseML from "../../../Functions/InvML/ReverseML";
import PSO from "../../../Functions/InvML/PSO";
import SMILESGeneration from "../../../Functions/InvML/SMILESGeneration/SMILESGeneration";
import SMILEStoIUPAC from "../../../Functions/InvML/SMILEStoIUPAC/SMILEStoIUPAC";
import SMILESToSyntheticScore from "../../../Functions/InvML/SMILESToSAS/SMILESToSyntheticScore";
import SMILESToDFT from "../../../Functions/InvML/SMILESToDFT/SMILESToDFT";
import SMILESMolecularStructure from "../../../Functions/InvML/SMILESMolecularStructure/SMILESMolecularStructure";
import FinalDataset from "../../../Functions/FinalDataset/FinalDataset";

function DashboardContentRouter({
    isLoading,
    isPreviewFunction,
    isChartPreviewFunction,
    canUseSplitMetaOnly,
    canUseEdaMetaOnly,
    activeFunction,
    activeFile,
    projectId,
    hasFileMeta,
    effectiveCsvData,
    fileMeta,
    csvData,
    hasCsvRows,
    showWorkspaceScreen,
    showBlankProjectPanel,
    recentProjects,
    onOpenCreate,
    onOpenProjects,
    onOpenSample,
    onOpenProject,
}) {
    const datasetTagFunctions = [
        {
            value: "Dataset Preview",
            label: "Materials Property Preview",
            icon: <HiOutlineDocumentReport size={13} />,
        },
        {
            value: "Information",
            label: "Materials Data Profile",
            icon: <HiOutlineDocumentReport size={13} />,
        },
        {
            value: "Statistics",
            label: "Materials Property Summary",
            icon: <AiOutlineLineChart size={13} />,
        },
        {
            value: "Correlation",
            label: "Structure-Property Analysis",
            icon: <PiGraph size={13} />,
        },
        {
            value: "Duplicate",
            label: "Duplicate Materials Detection",
            icon: <HiOutlineDocumentReport size={13} />,
        },
        {
            value: "Group",
            label: "Group Analysis",
            icon: <HiOutlinePuzzle size={13} />,
        },
    ];

    return (
        <>
            {isLoading &&
                !isPreviewFunction &&
                !isChartPreviewFunction &&
                !canUseSplitMetaOnly &&
                !canUseEdaMetaOnly && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading dataset...</p>
                        </div>
                    </div>
                )}
            {activeFunction && activeFile && isPreviewFunction && (
                <DatasetDisplay csvData={csvData} />
            )}
            {activeFunction && activeFile && isChartPreviewFunction && (
                <ChartFilePreview projectId={projectId} activeFile={activeFile} />
            )}
            {activeFunction && activeFile && canUseEdaMetaOnly && hasFileMeta && (
                <>
                    {(activeFunction === "EDA" ||
                        activeFunction === "Exploratory Data Analysis" ||
                        activeFunction === "Visual Data Analysis") && (
                        <UnifiedEDA csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Bar Plot" && (
                        <BarPlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Pie Plot" && (
                        <PiePlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Box Plot" && (
                        <BoxPlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Histogram" && (
                        <Histogram csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Violin Plot" && (
                        <ViolinPlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Scatter Plot" && (
                        <ScatterPlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Reg Plot" && (
                        <RegPlot csvData={effectiveCsvData} />
                    )}
                    {activeFunction === "Line Plot" && (
                        <LinePlot csvData={effectiveCsvData} />
                    )}
                </>
            )}
            {activeFunction && activeFile && canUseEdaMetaOnly && !hasFileMeta && (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-gray-600 text-sm">
                            Loading column info...
                        </p>
                    </div>
                </div>
            )}
            {activeFunction &&
                activeFile &&
                canUseSplitMetaOnly &&
                hasFileMeta && (
                    <ModelBuildingWorkflow csvData={effectiveCsvData} />
                )}
            {activeFunction &&
                activeFile &&
                canUseSplitMetaOnly &&
                !hasFileMeta && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                            <p className="text-gray-600 text-sm">
                                Loading column info...
                            </p>
                        </div>
                    </div>
                )}
            {activeFunction &&
                activeFile &&
                (activeFunction === "Model Deployment" ||
                    activeFunction === "Materials Property Prediction") && (
                    <ModelDeployment csvData={csvData} />
                )}
            {!isLoading &&
            activeFunction &&
            activeFile &&
            activeFunction !== "Model Deployment" &&
            activeFunction !== "Materials Property Prediction" &&
            !isChartPreviewFunction &&
            hasCsvRows &&
            !isPreviewFunction &&
            !canUseSplitMetaOnly &&
            !canUseEdaMetaOnly ? (
                <>
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Information" && (
                            <DatasetInformation csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Statistics" && (
                            <DatasetStatistics csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        (activeFunction === "Corelation" ||
                            activeFunction === "Correlation") && (
                            <DatasetCorrelation csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Duplicate" && (
                            <DatasetDuplicates csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Group" && (
                            <DatasetGroup csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        (activeFunction === "EDA" ||
                            activeFunction === "Exploratory Data Analysis" ||
                            activeFunction === "Visual Data Analysis") && (
                            <UnifiedEDA csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Bar Plot" && (
                            <BarPlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Pie Plot" && (
                            <PiePlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Box Plot" && (
                            <BoxPlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Histogram" && (
                            <Histogram csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Violin Plot" && (
                            <ViolinPlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Scatter Plot" && (
                            <ScatterPlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Reg Plot" && (
                            <RegPlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Line Plot" && (
                            <LinePlot csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        (activeFunction === "Add/Modify" ||
                            activeFunction === "Feature Engineering" ||
                            activeFunction === "Data Prep" ||
                            activeFunction ===
                                "Materials Feature Engineering" ||
                            activeFunction === "Manage Material Properties" ||
                            activeFunction ===
                                "Materials Descriptor Generation" ||
                            activeFunction === "Change Dtype" ||
                            activeFunction === "Alter Field Name" ||
                            activeFunction === "Imputation" ||
                            activeFunction === "Encoding" ||
                            activeFunction === "Scaling" ||
                            activeFunction === "Drop Column" ||
                            activeFunction === "Drop Rows" ||
                            activeFunction === "Append Dataset" ||
                            activeFunction === "Merge Dataset" ||
                            activeFunction === "Feature Selection" ||
                            activeFunction === "Cluster" ||
                            activeFunction === "Best Scaler") && (
                            <UnifiedFeatureEngineering csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        (activeFunction === "Split Dataset" ||
                            activeFunction === "Model Building" ||
                            activeFunction === "Generate Predictive Model" ||
                            activeFunction === "Build Predictive Model" ||
                            activeFunction === "Build Model" ||
                            activeFunction === "Model Evaluation" ||
                            activeFunction === "Model Prediction" ||
                            activeFunction === "Models") && (
                            <ModelBuildingWorkflow csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "Time Series Analysis" && (
                            <TimeSeriesAnalysis csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "ReverseML" && (
                            <ReverseML csvData={csvData} />
                        )}
                    {csvData && activeFunction && activeFunction === "PSO" && (
                        <PSO csvData={csvData} />
                    )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES Generation" && (
                            <SMILESGeneration csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES to IUPAC" && (
                            <SMILEStoIUPAC csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES to Synthetic Score" && (
                            <SMILESToSyntheticScore csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES to DFT" && (
                            <SMILESToDFT csvData={csvData} />
                        )}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES Structure" && (
                            <SMILESMolecularStructure csvData={csvData} />
                        )}
                    {activeFunction &&
                        (activeFunction === "Final Dataset" ||
                            activeFunction === "Model-Ready Dataset") && (
                            <FinalDataset />
                        )}
                </>
            ) : !isLoading &&
              activeFunction &&
              activeFile &&
              activeFunction !== "Model Deployment" &&
              activeFunction !== "Materials Property Prediction" &&
              !isChartPreviewFunction &&
              !hasCsvRows &&
              !isPreviewFunction &&
              !canUseSplitMetaOnly &&
              !canUseEdaMetaOnly ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <p className="text-gray-600">
                            No data available for the selected file.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Please check if the file has rows and try again.
                        </p>
                    </div>
                </div>
            ) : showWorkspaceScreen ? (
                <div className="h-[72vh] flex items-center justify-center">
                    <div className="w-full max-w-5xl">
                        <div className="mb-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#0D9488]">
                                    Workspace
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Get Started
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Create a project, open an existing one, or
                                    explore sample data.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <div className="w-full space-y-3.5">
                                <button
                                    type="button"
                                    onClick={onOpenCreate}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-[#BFE3DD] border-l-4 border-l-[#0D9488] bg-gradient-to-r from-[#F0FDFA] to-white hover:border-[#0D9488]/60 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(13,148,136,0.16)] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-lg bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                            <PlusCircle size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold text-gray-900">
                                                Create Project
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Set up a new project from
                                                scratch.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={onOpenProjects}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-[#BFE3DD] border-l-4 border-l-[#0D9488] bg-gradient-to-r from-[#F0FDFA] to-white hover:border-[#0D9488]/60 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(13,148,136,0.16)] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-lg bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                            <FolderOpen size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold text-gray-900">
                                                Projects
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Browse and open existing
                                                projects.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={onOpenSample}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-[#BFE3DD] border-l-4 border-l-[#0D9488] bg-gradient-to-r from-[#F0FDFA] to-white hover:border-[#0D9488]/60 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(13,148,136,0.16)] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-lg bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                            <FlaskConical size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold text-gray-900">
                                                Explore Sample Data
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Start with a ready-to-use sample
                                                workflow.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <div className="w-full lg:pl-6 lg:border-l border-gray-200">
                                <div className="flex items-center justify-between rounded-lg border border-[#D9ECE9] bg-gradient-to-r from-[#F0FDFA] to-white px-3 py-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Recent Projects
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={onOpenProjects}
                                        className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E]"
                                    >
                                        View all
                                    </button>
                                </div>
                                {recentProjects.length > 0 ? (
                                    <div className="mt-3 space-y-2.5">
                                        {recentProjects.map((project) => (
                                            <button
                                                key={project.id}
                                                type="button"
                                                onClick={() =>
                                                    onOpenProject(project.id)
                                                }
                                                className="w-full text-left rounded-xl border border-[#D9ECE9] bg-white px-3 py-3 hover:border-[#9FD7CF] hover:bg-[#F0FDFA] transition-all"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-8 w-8 shrink-0 rounded-lg bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                                        <FolderOpen size={14} />
                                                    </span>
                                                    <p className="text-sm font-semibold text-[#0D9488] truncate">
                                                        {project.name ||
                                                            "Untitled project"}
                                                    </p>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            String(
                                                                project.name ||
                                                                    "",
                                                            )
                                                                .toLowerCase()
                                                                .includes(
                                                                    "sample",
                                                                )
                                                                ? "bg-[#E6F7F5] text-[#0F766E]"
                                                                : "bg-[#ECFDF5] text-[#0F766E]"
                                                        }`}
                                                    >
                                                        {String(
                                                            project.name || "",
                                                        )
                                                            .toLowerCase()
                                                            .includes("sample")
                                                            ? "Sample"
                                                            : "Recent"}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                                                    {project.description ||
                                                        new Date(
                                                            project.updatedAt ||
                                                                project.createdAt ||
                                                                Date.now(),
                                                        ).toLocaleDateString()}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-gray-600">
                                        No recent projects yet. Create one to
                                        start building your workflow.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : showBlankProjectPanel ? (
                <div className="h-full w-full bg-white" />
            ) : null}
        </>
    );
}

export default DashboardContentRouter;
