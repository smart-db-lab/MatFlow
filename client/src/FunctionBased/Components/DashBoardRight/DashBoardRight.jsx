import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiHome } from "react-icons/hi";
import { HiOutlineDocumentReport, HiOutlinePuzzle } from "react-icons/hi";
import { AiOutlineLineChart } from "react-icons/ai";
import { PiGraph } from "react-icons/pi";
import {
    Star,
    Pencil,
    Trash2,
    X,
    Search,
    FolderOpen,
    PlusCircle,
    FlaskConical,
    Crosshair,
    TrendingUp,
    Share2,
    Eye,
} from "lucide-react";
import { setActiveFunction } from "../../../Slices/SideBarSlice";
import {
    setActiveFile,
    setActiveFolderAction,
} from "../../../Slices/UploadedFileSlice";
import { isGuestMode } from "../../../util/guestSession";
import DatasetCorrelation from "../../Functions/Dataset/DatasetCorrelation";
import DatasetDisplay from "../../Functions/Dataset/DatasetDisplay";
import ChartFilePreview from "../../Functions/Dataset/ChartFilePreview";
import DatasetDuplicates from "../../Functions/Dataset/DatasetDuplicates";
import DatasetGroup from "../../Functions/Dataset/DatasetGroup";
import DatasetInformation from "../../Functions/Dataset/DatasetInformation";
import DatasetStatistics from "../../Functions/Dataset/DatasetStatistics";
import UnifiedEDA from "../../Functions/EDA/UnifiedEDA";
import BarPlot from "../../Functions/EDA/BarPlot";
import BoxPlot from "../../Functions/EDA/BoxPlot";
import CustomPlot from "../../Functions/EDA/CustomPlot";
import Histogram from "../../Functions/EDA/Histogram";
import LinePlot from "../../Functions/EDA/LinePlot";
import PiePlot from "../../Functions/EDA/PiePlot";
import RegPlot from "../../Functions/EDA/RegPlot";
import ScatterPlot from "../../Functions/EDA/ScatterPlot";
import ViolinPlot from "../../Functions/EDA/ViolinPlot";
import UnifiedFeatureEngineering from "../../Functions/Feature Engineering/UnifiedFeatureEngineering";
import FinalDataset from "../../Functions/FinalDataset/FinalDataset";
import BuildModel from "../../Functions/Model Building/BuildModel/BuildModel";
import ModelEvaluation from "../../Functions/Model Building/ModelEvaluation/ModelEvaluation";
import ModelPrediction from "../../Functions/Model Building/ModelPrediction/ModelPrediction";
import Models from "../../Functions/Model Building/Models/Models";
import SplitDataset from "../../Functions/Model Building/SplitDataset/SplitDataset";
import ModelBuildingWorkflow from "../../Functions/Model Building/ModelBuildingWorkflow";
import ModelDeployment from "../../Functions/ModelDeployment/ModelDeployment";
import ReverseML from "../../Functions/InvML/ReverseML";
import TimeSeriesAnalysis from "../../Functions/TimeSeriesAnalysis/TimeSeriesAnalysis";
import Imputation from "../../Functions/Feature Engineering/Imputation/Imputation";
import PSO from "../../Functions/InvML/PSO";
import SMILESGeneration from "../../Functions/InvML/SMILESGeneration/SMILESGeneration";
import SMILEStoIUPAC from "../../Functions/InvML/SMILEStoIUPAC/SMILEStoIUPAC";
import SMILESToSyntheticScore from "../../Functions/InvML/SMILESToSAS/SMILESToSyntheticScore";
import SMILESToDFT from "../../Functions/InvML/SMILESToDFT/SMILESToDFT";
import SMILESMolecularStructure from "../../Functions/InvML/SMILESMolecularStructure/SMILESMolecularStructure";
import ConfirmDeleteModal from "../../../Components/ConfirmDeleteModal";
import {
    FUNCTION_LABEL_MAP,
    canUseEdaMetaOnly as canUseEdaMetaOnlyConfig,
    canUseSplitMetaOnly as canUseSplitMetaOnlyConfig,
    isChartPreviewFunction as isChartPreviewFunctionConfig,
    isDatasetContext as isDatasetContextConfig,
    isPreviewFunction as isPreviewFunctionConfig,
    normalizeDatasetTagValue,
} from "./config/dashboardFunctionConfig";
import { useDashboardDataset } from "./hooks/useDashboardDataset";
import { useProjectManager } from "./hooks/useProjectManager";
import ProjectInfoModal from "./components/ProjectInfoModal";
import HomeConfirmModal from "./components/HomeConfirmModal";

function DashBoardRight({ projectName, projectId, openModal, onModalOpened }) {
    const PAGE_SIZE = 6;
    const activeFunction = useSelector((state) => state.sideBar.activeFunction);
    const activeFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const render = useSelector((state) => state.uploadedFile.rerender);

    // Project management state
    const guest = isGuestMode();
    const [showHomeConfirm, setShowHomeConfirm] = useState(false);
    const {
        csvData,
        fileMeta,
        isLoading,
        hasCsvRows,
        hasFileMeta,
        effectiveCsvData,
    } = useDashboardDataset({
        activeFile,
        activeFunction,
        projectId,
        activeWorkspaceId,
        render,
        dispatch,
    });
    const {
        projects,
        showProjectsModal,
        setShowProjectsModal,
        showCreateModal,
        setShowCreateModal,
        showSampleModal,
        setShowSampleModal,
        showDeleteModal,
        setShowDeleteModal,
        projectInfoTarget,
        setProjectInfoTarget,
        searchQuery,
        setSearchQuery,
        showFavoritesOnly,
        setShowFavoritesOnly,
        currentPage,
        setCurrentPage,
        formName,
        setFormName,
        formDescription,
        setFormDescription,
        editingId,
        setEditingId,
        projectToDelete,
        setProjectToDelete,
        sampleLoading,
        sampleError,
        setSampleError,
        filteredProjects,
        totalPages,
        visibleProjects,
        recentProjects,
        confirmDeleteProject,
        handleSaveEdit,
        toggleFavorite,
        openCreate,
        openEdit,
        openProjectById,
        handleCreateSample,
        isEditMode,
        modalPrimaryLabel,
        modalPrimaryAction,
    } = useProjectManager({
        guest,
        projectId,
        navigate,
    });

    const handleConfirmHomeReset = () => {
        dispatch(setActiveFunction(""));
        dispatch(setActiveFile(""));
        dispatch(setActiveFolderAction(""));
        setShowHomeConfirm(false);
        navigate("/matflow/dashboard");
    };

    const handleHomeClick = () => {
        const isAlreadyWorkspaceHome =
            !projectId && !activeFile && !activeFunction;

        if (isAlreadyWorkspaceHome) {
            toast.info("You are already on workspace home.", {
                toastId: "already-workspace-home",
            });
            return;
        }

        setShowHomeConfirm(true);
    };

    useEffect(() => {
        if (!openModal) return;
        if (openModal === "projects") setShowProjectsModal(true);
        else if (openModal === "create") openCreate();
        else if (openModal === "sample") {
            setSampleError(null);
            setShowSampleModal(true);
        }
        onModalOpened?.();
    }, [openModal]);

    // Preview tab renders independently – DatasetDisplay self-fetches paginated data
    const isPreviewFunction = isPreviewFunctionConfig(activeFunction);
    const isChartPreviewFunction =
        isChartPreviewFunctionConfig(activeFunction);
    const canUseSplitMetaOnly = canUseSplitMetaOnlyConfig(
        activeFunction,
        activeWorkspaceId,
    );
    const canUseEdaMetaOnly = canUseEdaMetaOnlyConfig(
        activeFunction,
        activeWorkspaceId,
    );
    const showWorkspaceScreen = !isLoading && !projectId;
    const showBlankProjectPanel =
        !isLoading && Boolean(projectId) && (!activeFile || !activeFunction);
    const datasetTagFunctions = useMemo(
        () => [
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
        ],
        [],
    );
    const isDatasetContext = isDatasetContextConfig(activeFile, activeFunction);
    const activeDatasetTagValue = normalizeDatasetTagValue(activeFunction);
    const activeDatasetTag =
        datasetTagFunctions.find((item) => item.value === activeDatasetTagValue)
            ?.label || activeDatasetTagValue;
    const activeFunctionDisplayLabel =
        FUNCTION_LABEL_MAP[activeFunction] || activeFunction;

    return (
        <div className="flex-grow h-full overflow-y-auto px-6 bg-white">
            {/* Home bar with integrated breadcrumb */}
            <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 mb-1 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <button
                        onClick={handleHomeClick}
                        className="w-6 h-6 rounded-full bg-[#0D9488] hover:bg-[#0F766E] flex items-center justify-center transition-colors shrink-0"
                    >
                        <HiHome className="w-3 h-3 text-white" />
                    </button>
                    <span
                        className={`text-xs font-medium cursor-pointer transition-colors ${!activeFile && !activeFunction ? "text-[#0D9488]" : "text-gray-700 hover:text-[#0D9488]"}`}
                        onClick={handleHomeClick}
                    >
                        Home
                    </span>
                    {activeFunction && (
                        <>
                            <svg
                                className="w-3 h-3 text-gray-400 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                            <span className="text-xs font-medium text-[#0D9488]">
                                {activeFunctionDisplayLabel}
                            </span>
                        </>
                    )}
                </div>
            </div>
            {isDatasetContext && (
                <div className="w-full pt-3 mb-4 pb-3 border-b border-gray-300">
                    <div className="flex flex-wrap gap-2">
                        {datasetTagFunctions.map(({ value, label, icon }) => {
                            const isActive = activeDatasetTagValue === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        dispatch(setActiveFunction(value))
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                                        isActive
                                            ? "bg-[#0D9488] text-white shadow-md"
                                            : "bg-white text-[#0F766E] border border-gray-300 hover:bg-[#0D9488]/10 hover:border-[#0D9488]"
                                    }`}
                                >
                                    <span
                                        className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                                            isActive
                                                ? "border-white/90 bg-white text-[#0D9488]"
                                                : "border-[#0D9488]/20 bg-[#0D9488]/10 text-[#0D9488]"
                                        }`}
                                    >
                                        {icon}
                                    </span>
                                    <span title={label}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Full-data spinner: hidden for preview tab (DatasetDisplay fetches its own paginated data) */}
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

            {/* Preview tab: renders immediately, self-fetches paginated data independently of full load */}
            {activeFunction && activeFile && isPreviewFunction && (
                <DatasetDisplay csvData={csvData} />
            )}
            {activeFunction && activeFile && isChartPreviewFunction && (
                <ChartFilePreview
                    projectId={projectId}
                    activeFile={activeFile}
                />
            )}

            {/* EDA/plots can render from metadata-only columns in workspace mode. */}
            {activeFunction &&
                activeFile &&
                canUseEdaMetaOnly &&
                hasFileMeta && (
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

            {activeFunction &&
                activeFile &&
                canUseEdaMetaOnly &&
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

            {/* Split / Model Building entry can render from metadata only (no full CSV fetch). */}
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

            {!isLoading &&
                activeFunction &&
                activeFile &&
                (activeFunction === "Model Deployment" ||
                    activeFunction === "Materials Property Prediction") && (
                    <ModelDeployment csvData={csvData} />
                )}

            {/* All other tabs: require the full CSV to be in memory */}
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
                    )}{" "}
                    {csvData &&
                        activeFunction &&
                        activeFunction === "SMILES Generation" && (
                            <SMILESGeneration csvData={csvData} />
                        )}{" "}
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
                    {csvData &&
                        activeFunction &&
                        (activeFunction === "Model Deployment" ||
                            activeFunction ===
                                "Materials Property Prediction") && (
                            <ModelDeployment csvData={csvData} />
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
                                    onClick={openCreate}
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
                                    onClick={() => setShowProjectsModal(true)}
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
                                    onClick={() => {
                                        setSampleError(null);
                                        setShowSampleModal(true);
                                    }}
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
                                        onClick={() =>
                                            setShowProjectsModal(true)
                                        }
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
                                                onClick={() => {
                                                    openProjectById(project.id);
                                                }}
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

            {/* Projects list modal */}
            {showProjectsModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => {
                        setShowProjectsModal(false);
                        setEditingId(null);
                        setFormName("");
                        setFormDescription("");
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-[#0D9488] flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-white">
                                My Projects
                                {projects.length > 0 && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-sm font-bold text-white">
                                        {projects.length}
                                    </span>
                                )}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowProjectsModal(false);
                                    setEditingId(null);
                                }}
                                className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        {/* Search & filter */}
                        <div className="px-5 py-3 shrink-0 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                        <Search size={12} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-500 focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:bg-white outline-none transition-colors"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFavoritesOnly(!showFavoritesOnly)
                                    }
                                    className={`w-8 h-8 rounded border flex items-center justify-center transition-all hover:scale-110 ${showFavoritesOnly ? "border-yellow-300 bg-yellow-50 text-yellow-500" : "border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300"}`}
                                    title={
                                        showFavoritesOnly
                                            ? "Show all"
                                            : "Show starred only"
                                    }
                                >
                                    <Star
                                        size={14}
                                        fill={
                                            showFavoritesOnly
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                </button>
                            </div>
                        </div>
                        {/* Project list */}
                        <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">
                            {filteredProjects.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-sm text-gray-600">
                                        {projects.length === 0
                                            ? "No projects yet."
                                            : "No results found."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-gray-100">
                                        {visibleProjects.map((project) => (
                                            <div key={project.id}>
                                                {editingId === project.id ? (
                                                    <div className="py-3 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={formName}
                                                            onChange={(e) =>
                                                                setFormName(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none"
                                                            placeholder="Project name"
                                                            autoFocus
                                                        />
                                                        <textarea
                                                            value={
                                                                formDescription
                                                            }
                                                            onChange={(e) =>
                                                                setFormDescription(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            rows={2}
                                                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none resize-none"
                                                            placeholder="Description"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingId(
                                                                        null,
                                                                    );
                                                                    setFormName(
                                                                        "",
                                                                    );
                                                                    setFormDescription(
                                                                        "",
                                                                    );
                                                                }}
                                                                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleSaveEdit
                                                                }
                                                                disabled={
                                                                    !formName.trim()
                                                                }
                                                                className="px-3 py-1 text-xs text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] disabled:opacity-50"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`flex items-center gap-2 py-3 cursor-pointer transition-colors ${projectId === project.id ? "" : "hover:bg-gray-50"} -mx-5 px-5`}
                                                        onClick={() => {
                                                            setShowProjectsModal(
                                                                false,
                                                            );
                                                            openProjectById(
                                                                project.id,
                                                            );
                                                        }}
                                                    >
                                                        <span className="h-10 w-10 shrink-0 rounded-xl bg-[#E6F7F5] text-[#0D9488] flex items-center justify-center">
                                                            <FolderOpen
                                                                size={16}
                                                            />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p
                                                                className={`font-semibold truncate text-[15px] ${projectId === project.id ? "text-[#0D9488]" : "text-gray-900"}`}
                                                            >
                                                                {project.name ||
                                                                    "Untitled"}
                                                            </p>
                                                            <p className="text-sm text-gray-700 truncate">
                                                                {project.description ||
                                                                    new Date(
                                                                        project.updatedAt ||
                                                                            project.createdAt ||
                                                                            Date.now(),
                                                                    ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div
                                                            className="flex items-center gap-1.5 shrink-0"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setProjectInfoTarget(
                                                                        project,
                                                                    );
                                                                }}
                                                                className="w-6 h-6 rounded border border-indigo-300 bg-white flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all hover:scale-110"
                                                                title="View details"
                                                            >
                                                                <Eye
                                                                    size={12}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) =>
                                                                    toggleFavorite(
                                                                        project,
                                                                        e,
                                                                    )
                                                                }
                                                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 ${project.isFavorite ? "border-yellow-300 bg-yellow-50 text-yellow-500" : "border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300"}`}
                                                                title={
                                                                    project.isFavorite
                                                                        ? "Unstar"
                                                                        : "Star"
                                                                }
                                                            >
                                                                <Star
                                                                    size={12}
                                                                    fill={
                                                                        project.isFavorite
                                                                            ? "currentColor"
                                                                            : "none"
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        project,
                                                                    )
                                                                }
                                                                className="w-6 h-6 rounded border border-[#0D9488]/30 bg-white flex items-center justify-center text-[#0D9488] hover:bg-[#0D9488]/10 transition-all hover:scale-110"
                                                                title="Edit"
                                                            >
                                                                <Pencil
                                                                    size={12}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setProjectToDelete(
                                                                        project,
                                                                    );
                                                                    setShowDeleteModal(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="w-6 h-6 rounded border border-red-300 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                                                                title="Delete"
                                                            >
                                                                <Trash2
                                                                    size={12}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {filteredProjects.length > PAGE_SIZE && (
                                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                                className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110"
                                            >
                                                ‹
                                            </button>
                                            <span className="text-sm text-gray-700 font-medium">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(
                                                            totalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create project modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => {
                        setShowCreateModal(false);
                        setFormName("");
                        setFormDescription("");
                        setEditingId(null);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-sm w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 bg-[#0D9488] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#0B7F74] flex items-center justify-center text-white">
                                    <FolderOpen size={16} />
                                </div>
                                <h2 className="text-lg leading-none font-bold text-white tracking-tight">
                                    {isEditMode
                                        ? "Edit Project"
                                        : "Create New Project"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormName("");
                                    setFormDescription("");
                                    setEditingId(null);
                                }}
                                className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                            <div>
                                <label
                                    htmlFor="create-project-name"
                                    className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-1.5"
                                >
                                    <span>Project Name</span>
                                    <span className="text-xs font-semibold tracking-wide text-red-600 uppercase">
                                        Required
                                    </span>
                                </label>
                                <input
                                    id="create-project-name"
                                    type="text"
                                    placeholder="My project"
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
                                    autoFocus
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#BCD8FA] rounded-xl text-sm text-[#0F172A] placeholder:text-[#86A4CC] focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="create-project-desc"
                                    className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-1.5"
                                >
                                    <span>Description</span>
                                    <span className="inline-flex items-center rounded-full border border-[#BFD7F7] bg-[#EAF2FF] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-[#365A8C]">
                                        Optional
                                    </span>
                                </label>
                                <textarea
                                    id="create-project-desc"
                                    placeholder="What is this project about?"
                                    rows={3}
                                    value={formDescription}
                                    onChange={(e) =>
                                        setFormDescription(e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#BCD8FA] rounded-xl text-sm text-[#0F172A] placeholder:text-[#86A4CC] focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] outline-none resize-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="px-5 pb-4 pt-1 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormName("");
                                    setFormDescription("");
                                    setEditingId(null);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={modalPrimaryAction}
                                disabled={!formName.trim()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(13,148,136,0.22)] hover:bg-[#0F766E] hover:shadow-[0_8px_20px_rgba(13,148,136,0.3)] disabled:bg-[#E7EFFB] disabled:text-[#94AACE] disabled:shadow-none disabled:cursor-not-allowed transition-all"
                            >
                                <PlusCircle size={14} />
                                <span>{modalPrimaryLabel}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sample project modal */}
            {showSampleModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => !sampleLoading && setShowSampleModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] max-w-sm w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 bg-[#0D9488] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#0B7F74] flex items-center justify-center text-white">
                                    <FlaskConical size={16} />
                                </div>
                                <h2 className="text-lg leading-none font-bold text-white tracking-tight">
                                    Explore Sample Data
                                </h2>
                            </div>
                            <button
                                type="button"
                                disabled={sampleLoading}
                                onClick={() => setShowSampleModal(false)}
                                className="h-8 w-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="px-5 py-5 space-y-3">
                            {sampleError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                                    {sampleError.error ||
                                        sampleError.message ||
                                        "Failed to create sample project."}
                                </p>
                            )}
                            {[
                                {
                                    type: "classification",
                                    label: "Classification Dataset",
                                    description:
                                        "Standardized data for categorical prediction models.",
                                    icon: <Crosshair size={20} />,
                                    iconBg: "bg-[#E9FBF6]",
                                    iconColor: "text-[#0D9488]",
                                },
                                {
                                    type: "regression",
                                    label: "Regression Dataset",
                                    description:
                                        "Structured values for continuous variable forecasting.",
                                    icon: <TrendingUp size={20} />,
                                    iconBg: "bg-[#FFF7EC]",
                                    iconColor: "text-[#F97316]",
                                },
                                {
                                    type: "graph",
                                    label: "Graph Topology",
                                    description:
                                        "Relational data for complex network analysis.",
                                    icon: <Share2 size={20} />,
                                    iconBg: "bg-[#EEF2FF]",
                                    iconColor: "text-[#4F46E5]",
                                },
                            ].map(
                                ({
                                    type,
                                    label,
                                    description,
                                    icon,
                                    iconBg,
                                    iconColor,
                                }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        disabled={sampleLoading}
                                        onClick={() =>
                                            handleCreateSample(type)
                                        }
                                        className="w-full text-left rounded-xl border border-[#DCEAFD] bg-white hover:border-[#0D9488]/45 hover:bg-[#F8FFFD] px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
                                        >
                                            {icon}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-semibold text-[#0F172A] leading-tight">
                                                {label}
                                            </p>
                                            <p className="text-sm text-[#334155] leading-tight mt-1">
                                                {description}
                                            </p>
                                        </div>
                                    </button>
                                ),
                            )}
                        </div>
                        <div className="px-5 pb-5 flex justify-end">
                            <button
                                type="button"
                                disabled={sampleLoading}
                                onClick={() => setShowSampleModal(false)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(220,38,38,0.24)] hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={showDeleteModal && Boolean(projectToDelete)}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                }}
                onConfirm={confirmDeleteProject}
                title="Delete Project"
                itemName={projectToDelete?.name || "Untitled"}
                itemTypeLabel="project"
            />

            <ProjectInfoModal
                projectInfoTarget={projectInfoTarget}
                onClose={() => setProjectInfoTarget(null)}
            />

            <HomeConfirmModal
                isOpen={showHomeConfirm}
                onClose={() => setShowHomeConfirm(false)}
                onConfirm={handleConfirmHomeReset}
            />
        </div>
    );
}

export default DashBoardRight;
