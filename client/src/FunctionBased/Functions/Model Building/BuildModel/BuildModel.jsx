import {Input, Modal} from "@nextui-org/react";
import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {toast} from "react-toastify";
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
import {ReadFile} from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { syncSplitAndModelCache } from "../../../../util/modelDatasetSync";

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

function BuildModel({
                        csvData,
                        nodeData = undefined,
                        type = "function",
                        initValue = undefined,
                        onValueChange = undefined,
                    }) {
    const { projectId } = useParams();
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
    const model_setting = useSelector(
        (state) => state.modelBuilding.model_setting
    );
    const Type = useSelector((state) => state.modelBuilding.type);
    const target_variable = useSelector(
        (state) => state.modelBuilding.target_variable
    );
    const reg = useSelector((state) => state.modelBuilding.regressor);
    const [nicherData, setNicherData] = useState();
    const [showEncodingConfirmModal, setShowEncodingConfirmModal] = useState(false);
    const [categoricalColumns, setCategoricalColumns] = useState([]);

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    const getCategoricalFeatureColumns = (rows, targetVar) => {
        if (!Array.isArray(rows) || rows.length === 0) return [];
        const candidateColumns = Object.keys(rows[0] || {}).filter((col) => col !== targetVar);
        const isNumericLike = (value) => {
            if (value === null || value === undefined) return true;
            const strVal = String(value).trim();
            if (strVal === "") return true;
            return !Number.isNaN(Number(strVal));
        };

        return candidateColumns.filter((col) =>
            rows.some((row) => !isNumericLike(row?.[col]))
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

            let tempDatasets = await fetchDataFromIndexedDB("splitted_dataset");
            for (const val of tempDatasets) {
                if (e === Object.keys(val)[0]) {
                    setCurrentDataset(e);
                    setWhatKind(val[e][0]);

                    // Show loading message
                    const loadingToast = toast.info("Loading dataset, please wait...", {
                        autoClose: false,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: false,
                        progress: undefined,
                    });

                    try {
                        // Attempt to read files
                        const trainData = await ReadFile({
                            projectId,
                            foldername: val[e][5] || '',
                            filename: val[e][1] + ".csv",
                        });
                        const testData = await ReadFile({
                            projectId,
                            foldername: val[e][5] || '',
                            filename: val[e][2] + ".csv",
                        });

                        // Dismiss loading toast
                        toast.dismiss(loadingToast);

                        // Check if data was loaded successfully
                        if (!testData || !trainData || !testData.length || !trainData.length) {
                            toast.warn("Failed to load train/test data. Please split your dataset properly.", {
                                autoClose: false,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                            });
                            return; // Exit early
                        }

                        // If we get here, both datasets loaded successfully
                        // Set the model type based on whatKind
                        if (val[e][0] === "Continuous") {
                            setAllRegressor(REGRESSOR);
                            setRegressor(REGRESSOR[0]);
                            dispatch(setReg(REGRESSOR[0]));
                            dispatch(setType("regressor"));
                            setModelName("LR_Regression");
                        } else {
                            setAllRegressor(CLASSIFIER);
                            setRegressor(CLASSIFIER[0]);
                            dispatch(setReg(CLASSIFIER[0]));
                            dispatch(setType("classifier"));
                            setModelName("KNN_Classification");
                        }
                        dispatch(setTargetVariable(val[e][3]));
                        dispatch(setHyperparameterData({}));
                        dispatch(setModelSetting({}));
                        setNicherData("");

                        // Finally set the data
                        setTrain(trainData);
                        setTest(testData);

                        // Verify the target variable exists in the data
                        const targetExists = trainData.length > 0 && val[e][3] in trainData[0];
                        if (!targetExists) {
                            toast.warn(`Target variable '${val[e][3]}' not found in train data. Please check your dataset.`, {
                                autoClose: false,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                            });
                        }
                    } catch (fileErr) {
                        // Dismiss loading toast
                        toast.dismiss(loadingToast);

                        toast.error(`Error loading datasets: ${fileErr.message}`, {
                            autoClose: false,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    }

                    // We found the matching dataset, so we can break the loop
                    break;
                }
            }
        } catch (error) {
            console.error(error);
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
        try {
            // Guard against React click event being passed directly from onClick
            const shouldAutoEncode =
                typeof autoEncodeCategorical === "boolean" ? autoEncodeCategorical : false;

            // Validate that train and test data are available
            if (!train || !test || train.length === 0 || test.length === 0) {
                throw new Error("Train or test data is missing. Please select a properly split dataset first.");
            }

            // Check if target variable exists in the data
            if (!target_variable || !csvData.some(row => target_variable in row)) {
                throw new Error(`Target variable '${target_variable}' not found in dataset. Please choose a valid target.`);
            }

            // Model name validation
            let tempModel = await fetchDataFromIndexedDB("models");
            tempModel.forEach((val) => {
                if (current_dataset === Object.keys(val)[0]) {
                    if (val[current_dataset] && val[current_dataset][model_name]) {
                        throw new Error("Model name already exists! Please choose a different name.");
                    }
                }
            });

            // For regression models, request confirmation before auto-encoding categorical feature columns
            if (Type === "regressor" && !shouldAutoEncode) {
                const detectedCategoricalColumns = getCategoricalFeatureColumns(train, target_variable);
                if (detectedCategoricalColumns.length > 0) {
                    setCategoricalColumns(detectedCategoricalColumns);
                    setShowEncodingConfirmModal(true);
                    return;
                }
            }

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
                [Type === "regressor" ? "regressor" : "classifier"]: reg,
                ...model_setting,
                file: csvData,
                auto_encode_categorical: shouldAutoEncode,
            });

            if (data.error) {
                if (data.requires_confirmation && Array.isArray(data.categorical_columns)) {
                    setCategoricalColumns(data.categorical_columns);
                    setShowEncodingConfirmModal(true);
                    return;
                }
                throw new Error(data.error || "Failed to build model. Server returned an error.");
            }

            setNicherData(data.metrics);

            let allModels = await fetchDataFromIndexedDB("models");
            const ind = allModels.findIndex((obj) => current_dataset in obj);

            if (ind !== -1) {
                allModels[ind][current_dataset] = {
                    ...allModels[ind][current_dataset],
                    [model_name]: {
                        metrics: data.metrics,
                        metrics_table: data.metrics_table,
                        y_pred: JSON.parse(data.y_pred),
                        type: Type,
                        regressor,
                        model_deploy: data.model_deploy,
                    },
                };
            } else {
                allModels.push({
                    [current_dataset]: {
                        [model_name]: {
                            metrics: data.metrics,
                            metrics_table: data.metrics_table,
                            y_pred: JSON.parse(data.y_pred),
                            type: Type,
                            regressor,
                            model_deploy: data.model_deploy,
                        },
                    },
                });
            }
            await updateDataInIndexedDB("models", allModels);

            toast.success("Model Built Successfully!", {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            // Emit event to trigger stage completion and auto-redirect
            window.dispatchEvent(new CustomEvent('stageComplete', {
                detail: { stage: 'build' }
            }));
        } catch (error) {
            // Show user-friendly error text instead of technical stack details
            const rawMessage = error?.message || "";
            const userFriendlyMessage = rawMessage.includes("Converting circular structure")
                ? "We couldn't process this request. Please try again by clicking Submit once more."
                : rawMessage.includes("could not convert string to float")
                    ? "Your selected model needs numeric input. Please confirm encoding for categorical columns and retry."
                    : (rawMessage || "Something went wrong while building the model. Please try again.");
            toast.error(userFriendlyMessage, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };
    useEffect(() => {
        if (whatKind === "Continuous") {
            if (regressor === REGRESSOR[0]) setModelName("LR_Regression");
            if (regressor === REGRESSOR[1]) setModelName("Ridge_Regression");
            if (regressor === REGRESSOR[2]) setModelName("Lasso_Regression");
            if (regressor === REGRESSOR[3]) setModelName("DT_Regression");
            if (regressor === REGRESSOR[4]) setModelName("RF_Classification");
            if (regressor === REGRESSOR[5]) setModelName("svr_Regression");
        } else {
            if (regressor === CLASSIFIER[0]) setModelName("KNN_Classification");
            if (regressor === CLASSIFIER[1]) setModelName("SVM_Classification");
            if (regressor === CLASSIFIER[2]) setModelName("LR_Classification");
            if (regressor === CLASSIFIER[3]) setModelName("DT_Classification");
            if (regressor === CLASSIFIER[4]) setModelName("RF_Classification");
            if (regressor === CLASSIFIER[5]) setModelName("MLP_Classification");
        }
    }, [whatKind, regressor]);

    if (loading) return <div className="text-gray-600">Loading...</div>;
    if (allDatasetName.length === 0 && type === "function")
        return (
            <div className="my-6">
                <h1 className="text-xl font-medium text-gray-700">Split a dataset to continue</h1>
            </div>
        );

    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-2">
                {type === "function" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Train Test Dataset</label>
                            <SingleDropDown
                                columnNames={allDatasetName}
                                onValueChange={(e) => handleDatasetChange(e)}
                            />
                        </div>
                        {allRegressor && allRegressor.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {whatKind === "Continuous" ? "Regressor" : "Classifier"}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Model Name</label>
                            <Input
                                value={model_name}
                                onChange={(e) => setModelName(e.target.value)}
                                size="md"
                                bordered
                                className="w-full"
                            />
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
                                        !train || !test || train.length === 0 || test.length === 0
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-[#0D9488] hover:bg-[#0F766E] text-white cursor-pointer"
                                    }`}
                                    onClick={() => handleSave()}
                                    disabled={!train || !test || train.length === 0 || test.length === 0}
                                >
                                    Submit
                                </button>
                            </div>
                            {nicherData && (
                                <div className="mt-4 mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <h2 className="text-sm font-semibold text-gray-700 px-4 py-2 bg-gray-50 border-b border-gray-200">
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
                                            {Object.entries(nicherData).map(([key, value], index) => (
                                                <tr key={key} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                    <td className="py-1.5 px-4 border-b border-gray-100 text-gray-700 text-xs">
                                                        {key}
                                                    </td>
                                                    <td className="py-1.5 px-4 border-b border-gray-100 text-gray-700 font-medium text-xs">
                                                        {typeof value === "number"
                                                            ? value.toFixed(4)
                                                            : value}
                                                    </td>
                                                </tr>
                                            ))}
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
            <Modal
                open={visible}
                onClose={closeModal}
                aria-labelledby="help-modal"
                aria-describedby="help-modal-description"
                width="600px"
                scroll
                closeButton
            >
                <div className="bg-white text-left rounded-lg shadow-lg px-4 py-2 overflow-auto max-h-[80vh]">
                    <Docs section={"buildModel"}/>
                </div>
            </Modal>

            <Modal
                open={showEncodingConfirmModal}
                onClose={() => setShowEncodingConfirmModal(false)}
                aria-labelledby="encoding-confirm-modal"
                aria-describedby="encoding-confirm-modal-description"
                width="560px"
                closeButton
            >
                <div className="bg-white text-left rounded-lg shadow-lg px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Encode categorical features?</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        The selected regression model requires numeric features, but your dataset contains categorical columns.
                        Matflow can encode them automatically before training.
                    </p>

                    {categoricalColumns.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Detected categorical columns</p>
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
                </div>
            </Modal>
        </div>
    );
}

export default BuildModel;
