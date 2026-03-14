import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setActiveFunction } from "../../../Slices/SideBarSlice";
import { fetchDataFromIndexedDB } from "../../../util/indexDB";
import { sessionSetString } from "../../../util/sessionProjectStorage";
import SplitDataset from "./SplitDataset/SplitDataset";
import BuildModel from "./BuildModel/BuildModel";
import ModelEvaluation from "./ModelEvaluation/ModelEvaluation";
import ModelPrediction from "./ModelPrediction/ModelPrediction";
import Models from "./Models/Models";
import { Stepper, Step, StepLabel, StepButton, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const STAGES = [
    {
        id: "split",
        label: "Split Dataset",
        functionName: "Split Dataset",
        key: "splitted_dataset",
    },
    {
        id: "build",
        label: "Build Model",
        functionName: "Build Model",
        key: "models",
        requires: "split",
    },
    {
        id: "evaluate",
        label: "Model Evaluation",
        functionName: "Model Evaluation",
        key: "models",
        requires: "build",
    },
    {
        id: "predict",
        label: "Model Prediction",
        functionName: "Model Prediction",
        key: "models",
        requires: "build",
    },
    {
        id: "models",
        label: "Models",
        functionName: "Models",
        key: "models",
        alwaysAccessible: true,
    },
];

// Styled Stepper to match MLflow theme - Compact version with Google Ads style
const StyledStepper = styled(Stepper)(({ theme }) => ({
    padding: "8px 0",
    "& .MuiStep-root": {
        padding: "0 4px",
    },
    "& .MuiStepLabel-root": {
        padding: "0",
        "& .MuiStepLabel-label": {
            fontSize: "0.75rem",
            fontWeight: 500,
            marginTop: "4px",
            "&.Mui-active": {
                color: "#0D9488",
                fontWeight: 600,
            },
            "&.Mui-completed": {
                color: "#0D9488",
                fontWeight: 500,
            },
            "&.Mui-disabled": {
                color: "#9ca3af",
            },
        },
        "& .MuiStepLabel-iconContainer": {
            padding: "0",
            "& .MuiStepIcon-root": {
                fontSize: "1.25rem",
                width: "24px",
                height: "24px",
                "&.Mui-active": {
                    color: "#0D9488",
                    "& .MuiStepIcon-text": {
                        fill: "#ffffff",
                        fontWeight: 600,
                    },
                },
                "&.Mui-completed": {
                    color: "#0D9488",
                },
                "&.Mui-disabled": {
                    color: "#d1d5db",
                    "& .MuiStepIcon-text": {
                        fill: "#9ca3af",
                    },
                },
            },
        },
    },
    "& .MuiStepButton-root": {
        padding: "4px 8px",
        borderRadius: "4px",
        "&:hover:not(.Mui-disabled)": {
            backgroundColor: "rgba(59, 130, 246, 0.08)",
        },
        "&.Mui-disabled": {
            cursor: "not-allowed",
        },
    },
    "& .MuiStepConnector-root": {
        top: "12px",
        left: "calc(-50% + 12px)",
        right: "calc(50% + 12px)",
        "& .MuiStepConnector-line": {
            borderTopWidth: 2,
            borderColor: "#d1d5db",
        },
        "&.Mui-active .MuiStepConnector-line": {
            borderColor: "#0D9488",
        },
        "&.Mui-completed .MuiStepConnector-line": {
            borderColor: "#0D9488",
        },
    },
}));

function ModelBuildingWorkflow({ csvData }) {
    const dispatch = useDispatch();
    const { projectId } = useParams();
    const splitDbName = projectId
        ? `splitted_dataset:${projectId}`
        : "splitted_dataset";
    const modelsDbName = projectId ? `models:${projectId}` : "models";
    const activeFunction = useSelector((state) => state.sideBar.activeFunction);
    const functionNodeMap = {
        "Split Dataset": "5-0-0",
        "Build Model": "5-0-1",
        "Model Evaluation": "5-0-2",
        "Model Prediction": "5-0-3",
        Models: "5-0-4",
    };
    const [completionStatus, setCompletionStatus] = useState({
        split: false,
        build: false,
        evaluate: false,
        predict: false,
        models: true, // Always accessible
    });
    const [currentStage, setCurrentStage] = useState("split");
    const [loading, setLoading] = useState(true);

    // Determine current stage from activeFunction
    useEffect(() => {
        const stageMap = {
            "Split Dataset": "split",
            "Model Building": "split",
            "Build Model": "build",
            "Model Evaluation": "evaluate",
            "Model Prediction": "predict",
            Models: "models",
        };

        if (activeFunction && stageMap[activeFunction]) {
            setCurrentStage(stageMap[activeFunction]);
        }
    }, [activeFunction]);

    // Check completion status from IndexedDB
    const checkCompletionStatus = async () => {
        try {
            setLoading(true);

            // Check split dataset completion
            const splitData = await fetchDataFromIndexedDB(splitDbName);
            const splitComplete = splitData && splitData.length > 0;

            // Check models completion
            const modelsData = await fetchDataFromIndexedDB(modelsDbName);
            const modelsComplete = modelsData && modelsData.length > 0;

            setCompletionStatus({
                split: splitComplete,
                build: modelsComplete,
                evaluate: modelsComplete,
                predict: modelsComplete,
                models: true,
            });

            return { splitComplete, modelsComplete };
        } catch (error) {
            console.error("Error checking completion status:", error);
            return { splitComplete: false, modelsComplete: false };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkCompletionStatus();
    }, [projectId]);

    // Listen for custom events from child components
    useEffect(() => {
        const handleStageComplete = async (event) => {
            const { stage } = event.detail;

            // Refresh completion chips/step state, then move deterministically.
            await checkCompletionStatus();

            if (stage === "split") {
                dispatch(setActiveFunction("Build Model"));
                sessionSetString("activeFunction", projectId, "Build Model");
                window.dispatchEvent(
                    new CustomEvent("forceFunctionSelection", {
                        detail: {
                            nodeId: functionNodeMap["Build Model"],
                            label: "Build Model",
                        },
                    }),
                );
            } else if (stage === "build") {
                dispatch(setActiveFunction("Model Evaluation"));
                sessionSetString(
                    "activeFunction",
                    projectId,
                    "Model Evaluation",
                );
                window.dispatchEvent(
                    new CustomEvent("forceFunctionSelection", {
                        detail: {
                            nodeId: functionNodeMap["Model Evaluation"],
                            label: "Model Evaluation",
                        },
                    }),
                );
            }
        };

        window.addEventListener("stageComplete", handleStageComplete);

        return () => {
            window.removeEventListener("stageComplete", handleStageComplete);
        };
    }, [dispatch, projectId]);

    const handleStageClick = (stage) => {
        // Only allow navigation to completed stages or current stage
        if (
            stage.alwaysAccessible ||
            completionStatus[stage.id] ||
            currentStage === stage.id
        ) {
            dispatch(setActiveFunction(stage.functionName));
            sessionSetString("activeFunction", projectId, stage.functionName);
            const nodeId = functionNodeMap[stage.functionName];
            if (nodeId) {
                window.dispatchEvent(
                    new CustomEvent("forceFunctionSelection", {
                        detail: { nodeId, label: stage.functionName },
                    }),
                );
            }
        }
    };

    const isStageAccessible = (stage) => {
        if (stage.alwaysAccessible) return true;
        if (stage.requires) {
            return completionStatus[stage.requires];
        }
        return true;
    };

    const getStageState = (stage) => {
        if (currentStage === stage.id) {
            return "active";
        }
        if (completionStatus[stage.id]) {
            return "completed";
        }
        if (isStageAccessible(stage)) {
            return "available";
        }
        return "disabled";
    };

    // Get active step index for MUI Stepper
    const getActiveStep = () => {
        return STAGES.findIndex((stage) => stage.id === currentStage);
    };

    // Determine if step is completed (before current step)
    const isStepCompleted = (index) => {
        const activeStepIndex = getActiveStep();
        return index < activeStepIndex;
    };

    // Determine if step is disabled (future steps)
    const isStepDisabled = (index) => {
        const activeStepIndex = getActiveStep();
        return index > activeStepIndex;
    };

    const renderStageComponent = () => {
        switch (currentStage) {
            case "split":
                return <SplitDataset csvData={csvData} />;
            case "build":
                return <BuildModel csvData={csvData} />;
            case "evaluate":
                return <ModelEvaluation />;
            case "predict":
                return <ModelPrediction csvData={csvData} />;
            case "models":
                return <Models csvData={csvData} />;
            default:
                return <SplitDataset csvData={csvData} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                Loading...
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Progress Bar - Material UI Stepper */}
            <Box className="w-full bg-white px-4 py-2 mb-2">
                <StyledStepper activeStep={getActiveStep()} alternativeLabel>
                    {STAGES.map((stage, index) => {
                        const activeStepIndex = getActiveStep();
                        const isCompleted = isStepCompleted(index);
                        const isActive = index === activeStepIndex;
                        const isDisabled = isStepDisabled(index);
                        const isAccessible =
                            !isDisabled &&
                            (isCompleted ||
                                isActive ||
                                isStageAccessible(stage));

                        return (
                            <Step
                                key={stage.id}
                                completed={isCompleted}
                                active={isActive}
                                disabled={isDisabled}
                            >
                                <StepButton
                                    onClick={() =>
                                        isAccessible && handleStageClick(stage)
                                    }
                                    disabled={isDisabled}
                                    sx={{
                                        "&:hover:not(.Mui-disabled)": {
                                            backgroundColor:
                                                "rgba(59, 130, 246, 0.08)",
                                        },
                                        "&.Mui-disabled": {
                                            cursor: "not-allowed",
                                        },
                                    }}
                                >
                                    <StepLabel
                                        StepIconProps={{
                                            sx: {
                                                "&.Mui-active": {
                                                    color: "#0D9488",
                                                },
                                                "&.Mui-completed": {
                                                    color: "#0D9488",
                                                },
                                                "&.Mui-disabled": {
                                                    color: "#d1d5db",
                                                },
                                            },
                                        }}
                                    >
                                        {stage.label}
                                    </StepLabel>
                                </StepButton>
                            </Step>
                        );
                    })}
                </StyledStepper>
            </Box>

            {/* Stage Content */}
            <div className="flex-1">{renderStageComponent()}</div>
        </div>
    );
}

export default ModelBuildingWorkflow;
