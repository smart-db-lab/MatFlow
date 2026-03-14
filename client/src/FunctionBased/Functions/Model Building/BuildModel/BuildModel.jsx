import {
    CircularProgress,
    Dialog,
    DialogContent,
    TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../../../util/adminAuth";
import {
    setHyperparameterData,
    setModelSetting,
    setReg,
    setTargetVariable,
    setType,
} from "../../../../Slices/ModelBuilding";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import DecisionTreeClassification from "./components/Categorical/DecisionTreeClassification";
import KNearestNeighbour from "./components/Categorical/KNearestNeighbour";
import LogisticRegression from "./components/Categorical/LogisticRegression";
import MultilayerPerceptron from "./components/Categorical/MultilayerPerceptron";
import RandomForestClassification from "./components/Categorical/RandomForestClassification";
import SupportVectorMachine from "./components/Categorical/SupportVectorMachine";
import DecisionTreeRegression from "./components/Continuous/DecisionTreeRegression";
import LassoRegression from "./components/Continuous/LassoRegression";
import LinearRegression from "./components/Continuous/LinearRegression";
import RandomForestRegression from "./components/Continuous/RandomForestRegression";
import RidgeRegression from "./components/Continuous/RidgeRegression";
import SupportVectorRegressor from "./components/Continuous/SupportVectorRegressor";
import { ReadFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";
import {
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../../Feature Engineering/feUi";

const REGRESSOR = [
    "Linear Regression",
    "Ridge Regression",
    "Lasso Regression",
    "Decision Tree Regression",
    "Random Forest Regression",
    "Support Vector Regressor",
];

const CLASSIFIER = [
    "K-Nearest Neighbors",
    "Support Vector Machine",
    "Logistic Regression",
    "Decision Tree Classification",
    "Random Forest Classification",
    "Multilayer Perceptron",
];

const toModelSlug = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const formatModelTimestamp = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${y}${m}${d}_${hh}${mm}${ss}`;
};

const buildProfessionalModelName = (modelLabel, datasetLabel) => {
    const modelPart = toModelSlug(modelLabel || "model");
    const datasetPart = toModelSlug(datasetLabel || "dataset");
    return `${modelPart}_${datasetPart}_${formatModelTimestamp()}`;
};

function BuildModel({
    csvData,
    nodeData = undefined,
    type = "function",
    initValue = undefined,
    onValueChange = undefined,
}) {
    const { projectId } = useParams();
    const splitDbName = projectId
        ? `splitted_dataset:${projectId}`
        : "splitted_dataset";
    const modelsDbName = projectId ? `models:${projectId}` : "models";
    // const [regressor, setRegressor] = useState(Regressor[0]);
    const [allRegressor, setAllRegressor] = useState();
    const [regressor, setRegressor] = useState();
    const [allDatasetName, setAllDatasetName] = useState([]);
    const [loading, setLoading] = useState(false);
    const [whatKind, setWhatKind] = useState();
    const dispatch = useDispatch();
    const [train, setTrain] = useState();
    const [test, setTest] = useState();
    const [model_name, setModelName] = useState("");
    const [current_dataset, setCurrentDataset] = useState();
    const [isDatasetReady, setIsDatasetReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const model_setting = useSelector(
        (state) => state.modelBuilding.model_setting,
    );
    const Type = useSelector((state) => state.modelBuilding.type);
    const target_variable = useSelector(
        (state) => state.modelBuilding.target_variable,
    );
    const reg = useSelector((state) => state.modelBuilding.regressor);
    const [nicherData, setNicherData] = useState();
    const [showEncodingConfirmModal, setShowEncodingConfirmModal] =
        useState(false);
    const [categoricalColumns, setCategoricalColumns] = useState([]);
    const [trainFilename, setTrainFilename] = useState("");
    const [testFilename, setTestFilename] = useState("");
    const [splitFolder, setSplitFolder] = useState("");
    const activeWorkspaceId = useSelector(
        (state) => state.workspace?.activeWorkspaceId,
    );

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    const getCategoricalFeatureColumns = (rows, targetVar) => {
        if (!Array.isArray(rows) || rows.length === 0) return [];
        const candidateColumns = Object.keys(rows[0] || {}).filter(
            (col) => col !== targetVar,
        );
        const isNumericLike = (value) => {
            if (value === null || value === undefined) return true;
            const strVal = String(value).trim();
            if (strVal === "") return true;
            return !Number.isNaN(Number(strVal));
        };

        return candidateColumns.filter((col) =>
            rows.some((row) => !isNumericLike(row?.[col])),
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const synced = await syncSplitAndModelCache(projectId);
            setAllDatasetName(synced.splitNames || []);
            setLoading(false);
        };

        fetchData();
    }, [projectId]);

    useEffect(() => {
        if (type === "node" && nodeData) {
            setWhatKind(nodeData.whatKind);
            if (nodeData.whatKind === "Continuous") {
                setAllRegressor(REGRESSOR);
                setRegressor(nodeData.regressor || REGRESSOR[0]);
                dispatch(setReg(nodeData.regressor || REGRESSOR[0]));
                dispatch(setType("regressor"));
                setModelName(nodeData.model_name || "LR_Regression");
            } else {
                setAllRegressor(CLASSIFIER);
                setRegressor(nodeData.regressor || CLASSIFIER[0]);
                dispatch(setReg(nodeData.regressor || CLASSIFIER[0]));
                dispatch(setType("classifier"));
                setModelName(nodeData.model_name || "KNN_Classification");
            }
            dispatch(setTargetVariable(nodeData.target_variable));
            dispatch(setHyperparameterData({}));
            dispatch(setModelSetting({}));
            setNicherData("");
            setTrain(nodeData.train);
            setTest(nodeData.test);
        }
    }, [nodeData]);

    const handleDatasetChange = async (e) => {
        try {
            setTrain(null);
            setTest(null);
            setAllRegressor(null);
            setCurrentDataset(null);
            setIsDatasetReady(false);

            let tempDatasets = await fetchDataFromIndexedDB(splitDbName);
            for (const val of tempDatasets) {
                if (e === Object.keys(val)[0]) {
                    setWhatKind(val[e][0]);
                    setTrainFilename(val[e][1] || "");
                    setTestFilename(val[e][2] || "");
                    setSplitFolder(val[e][5] || "");

                    // Show loading message
                    const loadingToast = toast.info(
                        "Loading dataset, please wait...",
                        {
                            autoClose: false,
                            hideProgressBar: false,
                            closeOnClick: false,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                        },
                    );

                    try {
                        // Log the file paths we're trying to load for debugging
                        const trainPath = `${val[e][5] || ""}/${val[e][1]}`;
                        const testPath = `${val[e][5] || ""}/${val[e][2]}`;
                        console.log("Attempting to load train/test files:", {
                            trainPath,
                            testPath,
                            splitData: val[e],
                        });

                        // Attempt to read files - try multiple potential locations
                        let trainData, testData;
                        const folders = [val[e][5] || "", "train_test", ""]; // Try original folder, train_test, and root

                        // Try to load train file
                        for (const folder of folders) {
                            try {
                                trainData = await ReadFile({
                                    projectId,
                                    foldername: folder,
                                    filename: val[e][1] + "",
                                });
                                if (trainData && trainData.length > 0) {
                                    console.log(
                                        `Found train data in folder: ${folder}`,
                                    );
                                    break;
                                }
                            } catch (err) {
                                console.log(
                                    `Train file not found in folder: ${folder}`,
                                    err.message,
                                );
                            }
                        }

                        // Try to load test file
                        for (const folder of folders) {
                            try {
                                testData = await ReadFile({
                                    projectId,
                                    foldername: folder,
                                    filename: val[e][2] + "",
                                });
                                if (testData && testData.length > 0) {
                                    console.log(
                                        `Found test data in folder: ${folder}`,
                                    );
                                    break;
                                }
                            } catch (err) {
                                console.log(
                                    `Test file not found in folder: ${folder}`,
                                    err.message,
                                );
                            }
                        }

                        // Dismiss loading toast
                        toast.dismiss(loadingToast);

                        // Check if data was loaded successfully
                        if (
                            !testData ||
                            !trainData ||
                            !testData.length ||
                            !trainData.length
                        ) {
                            const missingFiles = [];
                            if (!trainData || !trainData.length)
                                missingFiles.push(`Train: ${val[e][1]}`);
                            if (!testData || !testData.length)
                                missingFiles.push(`Test: ${val[e][2]}`);

                            toast.error(
                                `Failed to load train/test data files:\n${missingFiles.join("\n")}\n\nTried in folders: ${folders.join(", ")}\n\nPlease split your dataset again to regenerate the files.`,
                                {
                                    autoClose: false,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                },
                            );
                            return; // Exit early
                        }

                        // If we get here, both datasets loaded successfully
                        // Set the model type based on whatKind
                        if (val[e][0] === "Continuous") {
                            setAllRegressor(REGRESSOR);
                            setRegressor(REGRESSOR[0]);
                            dispatch(setReg(REGRESSOR[0]));
                            dispatch(setType("regressor"));
                            setModelName(
                                buildProfessionalModelName(REGRESSOR[0], e),
                            );
                        } else {
                            setAllRegressor(CLASSIFIER);
                            setRegressor(CLASSIFIER[0]);
                            dispatch(setReg(CLASSIFIER[0]));
                            dispatch(setType("classifier"));
                            setModelName(
                                buildProfessionalModelName(CLASSIFIER[0], e),
                            );
                        }
                        dispatch(setTargetVariable(val[e][3]));
                        dispatch(setHyperparameterData({}));
                        dispatch(setModelSetting({}));
                        setNicherData("");

                        // Finally set the data
                        setCurrentDataset(e);
                        setTrain(trainData);
                        setTest(testData);
                        setIsDatasetReady(true);

                        // Verify the target variable exists in the data
                        const targetExists =
                            trainData.length > 0 && val[e][3] in trainData[0];
                        if (!targetExists) {
                            toast.warn(
                                `Target variable '${val[e][3]}' not found in train data. Please check your dataset.`,
                                {
                                    autoClose: false,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                },
                            );
                        }
                    } catch (fileErr) {
                        // Dismiss loading toast
                        toast.dismiss(loadingToast);
                        setIsDatasetReady(false);

                        toast.error(
                            `Error loading datasets: ${fileErr.message}`,
                            {
                                autoClose: false,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                            },
                        );
                    }

                    // We found the matching dataset, so we can break the loop
                    break;
                }
            }
        } catch (error) {
            console.error(error);
            setIsDatasetReady(false);
            toast.error(`Error: ${error.message}`, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };
    const handleSave = async (autoEncodeCategorical = false) => {
        if (isSubmitting) return;
        try {
            // Guard against React click event being passed directly from onClick
            const shouldAutoEncode =
                typeof autoEncodeCategorical === "boolean"
                    ? autoEncodeCategorical
                    : false;

            // Validate that train and test data are available
            if (!train || !test || train.length === 0 || test.length === 0) {
                throw new Error(
                    "Train or test data is missing. Please select a properly split dataset first.",
                );
            }

            // Check if target variable exists in the data
            if (
                !target_variable ||
                !csvData.some((row) => target_variable in row)
            ) {
                throw new Error(
                    `Target variable '${target_variable}' not found in dataset. Please choose a valid target.`,
                );
            }

            // Model name validation
            let tempModel = await fetchDataFromIndexedDB(modelsDbName);
            const typedModelName = String(model_name || "").trim();
            const finalModelName =
                typedModelName ||
                buildProfessionalModelName(regressor, current_dataset);
            tempModel.forEach((val) => {
                if (current_dataset === Object.keys(val)[0]) {
                    if (
                        val[current_dataset] &&
                        val[current_dataset][finalModelName]
                    ) {
                        throw new Error(
                            "Model name already exists! Please choose a different name.",
                        );
                    }
                }
            });

            // For regression models, request confirmation before auto-encoding categorical feature columns
            if (Type === "regressor" && !shouldAutoEncode) {
                const detectedCategoricalColumns = getCategoricalFeatureColumns(
                    train,
                    target_variable,
                );
                if (detectedCategoricalColumns.length > 0) {
                    setCategoricalColumns(detectedCategoricalColumns);
                    setShowEncodingConfirmModal(true);
                    return;
                }
            }

            setIsSubmitting(true);

            // Show loading state
            const loadingToast = toast.info("Building model, please wait...", {
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
            });

            // Close the loading toast
            toast.dismiss(loadingToast);

            const data = await apiService.matflow.ml.buildModel({
                test,
                train,
                target_var: target_variable,
                type: Type,
                model_name: finalModelName,
                workspace_id: activeWorkspaceId || undefined,
                train_filename: trainFilename || undefined,
                test_filename: testFilename || undefined,
                [Type === "regressor" ? "regressor" : "classifier"]: reg,
                ...model_setting,
                file: csvData,
                auto_encode_categorical: shouldAutoEncode,
            });

            if (data.error) {
                if (
                    data.requires_confirmation &&
                    Array.isArray(data.categorical_columns)
                ) {
                    setCategoricalColumns(data.categorical_columns);
                    setShowEncodingConfirmModal(true);
                    return;
                }
                throw new Error(
                    data.error ||
                        "Failed to build model. Server returned an error.",
                );
            }

            setNicherData(data.metrics);

            let allModels = await fetchDataFromIndexedDB(modelsDbName);
            const ind = allModels.findIndex((obj) => current_dataset in obj);

            if (ind !== -1) {
                allModels[ind][current_dataset] = {
                    ...allModels[ind][current_dataset],
                    [finalModelName]: {
                        metrics: data.metrics,
                        metrics_table: data.metrics_table,
                        y_pred: JSON.parse(data.y_pred),
                        type: Type,
                        regressor,
                        model_deploy: data.model_deploy,
                        input_schema: Array.isArray(data.input_schema)
                            ? data.input_schema
                            : [],
                        feature_columns: Array.isArray(data.feature_columns)
                            ? data.feature_columns
                            : [],
                        workspace_model_file: data.workspace_model_file || "",
                        workspace_metadata_file:
                            data.workspace_metadata_file || "",
                        split_folder: splitFolder || "",
                    },
                };
            } else {
                allModels.push({
                    [current_dataset]: {
                        [finalModelName]: {
                            metrics: data.metrics,
                            metrics_table: data.metrics_table,
                            y_pred: JSON.parse(data.y_pred),
                            type: Type,
                            regressor,
                            model_deploy: data.model_deploy,
                            input_schema: Array.isArray(data.input_schema)
                                ? data.input_schema
                                : [],
                            feature_columns: Array.isArray(data.feature_columns)
                                ? data.feature_columns
                                : [],
                            workspace_model_file:
                                data.workspace_model_file || "",
                            workspace_metadata_file:
                                data.workspace_metadata_file || "",
                            split_folder: splitFolder || "",
                        },
                    },
                });
            }
            await updateDataInIndexedDB(modelsDbName, allModels);
            setModelName(finalModelName);

            toast.success(
                `Model Built Successfully! Saved as: ${finalModelName}`,
                {
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                },
            );

            // Emit event to trigger stage completion and auto-redirect
            window.dispatchEvent(
                new CustomEvent("stageComplete", {
                    detail: { stage: "build" },
                }),
            );
        } catch (error) {
            // Show user-friendly error text instead of technical stack details
            const rawMessage = error?.message || "";
            const userFriendlyMessage = rawMessage.includes(
                "Converting circular structure",
            )
                ? "We couldn't process this request. Please try again by clicking Submit once more."
                : rawMessage.includes("could not convert string to float")
                  ? "Your selected model needs numeric input. Please confirm encoding for categorical columns and retry."
                  : rawMessage ||
                    "Something went wrong while building the model. Please try again.";
            toast.error(userFriendlyMessage, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    useEffect(() => {
        if (type === "node") return;
        if (!regressor || !current_dataset) return;
        setModelName(buildProfessionalModelName(regressor, current_dataset));
    }, [regressor, current_dataset, type]);

    if (loading)
        return (
            <div className="my-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-gray-600">
                    <CircularProgress size={34} sx={{ color: "#0D9488" }} />
                    <p className="text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    if (allDatasetName.length === 0 && type === "function")
        return (
            <div className="my-6">
                <h1 className={FE_SECTION_TITLE_CLASS}>
                    Split a dataset to continue
                </h1>
            </div>
        );

    return (
        <div className="w-full h-full overflow-y-auto font-sans text-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-2">
                {type === "function" && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className={FE_SUB_LABEL_CLASS}>
                                    Select Dataset
                                </label>
                                <SingleDropDown
                                    columnNames={allDatasetName}
                                    onValueChange={(e) =>
                                        handleDatasetChange(e)
                                    }
                                />
                            </div>
                            {allRegressor && allRegressor.length > 0 && (
                                <div className="md:col-span-1">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        {whatKind === "Continuous"
                                            ? "Regressor"
                                            : "Classifier"}
                                    </label>
                                    <SingleDropDown
                                        columnNames={allRegressor}
                                        onValueChange={(e) => {
                                            setRegressor(e);
                                            dispatch(setReg(e));
                                            dispatch(setHyperparameterData({}));
                                            dispatch(setModelSetting({}));
                                            setNicherData("");
                                        }}
                                        initValue={allRegressor[0]}
                                    />
                                </div>
                            )}
                            {current_dataset && isDatasetReady && (
                                <div className="md:col-span-1">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Model Name
                                    </label>
                                    <TextField
                                        value={model_name}
                                        onChange={(e) =>
                                            setModelName(e.target.value)
                                        }
                                        size="small"
                                        fullWidth
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {allRegressor && (
                    <>
                        {/* Regressor (for Numerical Column) */}
                        {whatKind && whatKind === "Continuous" ? (
                            <div className={`${type === "function" && "mt-2"}`}>
                                {regressor === REGRESSOR[0] && (
                                    <LinearRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === REGRESSOR[1] && (
                                    <RidgeRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === REGRESSOR[2] && (
                                    <LassoRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === REGRESSOR[3] && (
                                    <DecisionTreeRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === REGRESSOR[4] && (
                                    <RandomForestRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === REGRESSOR[5] && (
                                    <SupportVectorRegressor
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className={`${type === "function" && "mt-2"}`}>
                                {regressor === CLASSIFIER[0] && (
                                    <KNearestNeighbour
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === CLASSIFIER[1] && (
                                    <SupportVectorMachine
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === CLASSIFIER[2] && (
                                    <LogisticRegression
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === CLASSIFIER[3] && (
                                    <DecisionTreeClassification
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === CLASSIFIER[4] && (
                                    <RandomForestClassification
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                                {regressor === CLASSIFIER[5] && (
                                    <MultilayerPerceptron
                                        train={train}
                                        test={test}
                                        Type={type}
                                        initValue={initValue}
                                        onValueChange={onValueChange}
                                    />
                                )}
                            </div>
                        )}

                        {type === "function" && (
                            <>
                                <div className="mt-4 mb-4">
                                    <button
                                        className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                                            isSubmitting
                                                ? "bg-[#0D9488]/70 text-white cursor-not-allowed"
                                                : !train ||
                                                    !test ||
                                                    train.length === 0 ||
                                                    test.length === 0
                                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                                  : "bg-[#0D9488] hover:bg-[#0F766E] text-white cursor-pointer"
                                        }`}
                                        onClick={() => handleSave()}
                                        disabled={
                                            !train ||
                                            !test ||
                                            train.length === 0 ||
                                            test.length === 0 ||
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting ? (
                                            <span className="inline-flex items-center gap-2">
                                                <CircularProgress
                                                    size={16}
                                                    sx={{ color: "#ffffff" }}
                                                />
                                                Building...
                                            </span>
                                        ) : (
                                            "Submit"
                                        )}
                                    </button>
                                </div>
                                {nicherData && (
                                    <div className="mt-4 mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <h2
                                            className={`${FE_SECTION_TITLE_CLASS} px-4 py-2 bg-gray-50 border-b border-gray-200 !mb-0`}
                                        >
                                            Model Performance Metrics
                                        </h2>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="py-1.5 px-4 border-b border-gray-200 text-left font-medium text-gray-700 text-xs">
                                                            Metric
                                                        </th>
                                                        <th className="py-1.5 px-4 border-b border-gray-200 text-left font-medium text-gray-700 text-xs">
                                                            Value
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(
                                                        nicherData,
                                                    ).map(
                                                        (
                                                            [key, value],
                                                            index,
                                                        ) => (
                                                            <tr
                                                                key={key}
                                                                className={
                                                                    index %
                                                                        2 ===
                                                                    0
                                                                        ? "bg-white"
                                                                        : "bg-gray-50"
                                                                }
                                                            >
                                                                <td className="py-1.5 px-4 border-b border-gray-100 text-gray-700 text-xs">
                                                                    {key}
                                                                </td>
                                                                <td className="py-1.5 px-4 border-b border-gray-100 text-gray-700 font-medium text-xs">
                                                                    {typeof value ===
                                                                    "number"
                                                                        ? value.toFixed(
                                                                              4,
                                                                          )
                                                                        : value}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* DOCS */}
            <button
                className="fixed bottom-16 right-4 bg-[#0D9488] hover:bg-[#0F766E] text-lg font-bold text-white rounded-full w-8 h-8 shadow-lg transition-all flex items-center justify-center z-50"
                onClick={openModal}
            >
                ?
            </button>
            <Dialog open={visible} onClose={closeModal} maxWidth="md" fullWidth>
                <DialogContent dividers className="!px-4 !py-3">
                    <Docs section={"buildModel"} />
                </DialogContent>
            </Dialog>

            <Dialog
                open={showEncodingConfirmModal}
                onClose={() => setShowEncodingConfirmModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent className="!px-5 !py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Encode categorical features?
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                        The selected regression model requires numeric features,
                        but your dataset contains categorical columns. Matflow
                        can encode them automatically before training.
                    </p>

                    {categoricalColumns.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 mb-1.5">
                                Detected categorical columns
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {categoricalColumns.map((col) => (
                                    <span
                                        key={col}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowEncodingConfirmModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded-md bg-[#0D9488] text-white hover:bg-[#0F766E]"
                            onClick={async () => {
                                setShowEncodingConfirmModal(false);
                                await handleSave(true);
                            }}
                        >
                            Encode and Continue
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default BuildModel;
