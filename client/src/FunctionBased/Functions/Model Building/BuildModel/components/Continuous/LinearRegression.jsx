import { CircularProgress, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getAuthHeaders } from "../../../../../../util/adminAuth";
import {
    setHyperparameterData,
    setModelSetting,
} from "../../../../../../Slices/ModelBuilding";
import MultipleDropDown from "../../../../../Components/MultipleDropDown/MultipleDropDown";
import NextTable from "../../../../../Components/NextTable/NextTable";
import { apiService } from "../../../../../../services/api/apiService";
import SafeCheckbox from "../../../../../../Components/SafeCheckbox";

const DISPLAY_METRICES = [
    "R-Squared",
    "Mean Absolute Error",
    "Mean Squared Error",
    "Root Mean Squared Error",
];

function LinearRegression({
    train,
    test,
    Type = "function",
    initValue = undefined,
    onValueChange = undefined,
}) {
    const hyperparameterOption = useSelector(
        (state) => state.modelBuilding.hyperparameter,
    );
    const regressor = useSelector((state) => state.modelBuilding.regressor);
    const type = useSelector((state) => state.modelBuilding.type);
    const target_variable = useSelector(
        (state) => state.modelBuilding.target_variable,
    );
    const dispatch = useDispatch();
    const [hData, setHData] = useState();
    const [optimizedData, setOptimizedData] = useState({
        "Number of jobs": -1,
        fit_intercept: true,
        "Display Metrices": DISPLAY_METRICES,
    });
    const [loading, setLoading] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const hasOptimizationFields =
        [
            "Number of cross-validation folds",
            "Random state for hyperparameter search",
        ].length > 0;
    const shouldShowModelSettings =
        Type !== "function" || showAdvancedSettings;

    useEffect(() => {
        if (Type === "node" && initValue) {
            // console.log(initValue)
            setOptimizedData({
                ...optimizedData,
                ...initValue,
            });
        }
    }, []);

    useEffect(() => {
        dispatch(setModelSetting(optimizedData));
        if (Type === "node") {
            onValueChange(optimizedData);
        }
    }, [dispatch, optimizedData]);

    const showPersistentError = (message) => {
        toast.error(message || "Failed to optimize hyperparameters.", {
            autoClose: false,
            closeOnClick: true,
        });
    };

    const handleOptimization = async () => {
        try {
            setLoading(true);
            const data = await apiService.matflow.ml.hyperparameterOptimization(
                {
                    train,
                    test,
                    [type === "regressor" ? "regressor" : "classifier"]:
                        regressor,
                    type,
                    target_var: target_variable,
                    ...hyperparameterOption,
                },
            );
            console.log(data);
            setHData(data);
            setOptimizedData({ ...optimizedData, ...data.param });
        } catch (error) {
            showPersistentError(
                error?.message || "Failed to optimize hyperparameters.",
            );
        }
        setLoading(false);
    };

    return (
        <div className="font-sans text-gray-900">
            {Type === "function" && hasOptimizationFields && (
                <div className="mb-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                setShowAdvancedSettings((prev) => !prev)
                            }
                            className="inline-flex items-center gap-2 rounded-md border border-[#0D9488]/35 bg-white px-3 py-1.5 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
                        >
                            {showAdvancedSettings
                                ? "Hide Advanced Settings"
                                : "Show Advanced Settings"}
                        </button>
                    </div>
                    {showAdvancedSettings && (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-700 mb-3">
                                Hyperparameter Optimization Settings
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Number of cross-validation folds
                                    </label>
                                    <TextField
                                        onChange={(e) =>
                                            dispatch(
                                                setHyperparameterData({
                                                    ...hyperparameterOption,
                                                    "Number of cross-validation folds":
                                                        e.target.value,
                                                }),
                                            )
                                        }
                                        value={
                                            hyperparameterOption?.[
                                                "Number of cross-validation folds"
                                            ] || ""
                                        }
                                        type="number"
                                        size="small"
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Random state for hyperparameter search
                                    </label>
                                    <TextField
                                        onChange={(e) =>
                                            dispatch(
                                                setHyperparameterData({
                                                    ...hyperparameterOption,
                                                    "Random state for hyperparameter search":
                                                        e.target.value,
                                                }),
                                            )
                                        }
                                        value={
                                            hyperparameterOption?.[
                                                "Random state for hyperparameter search"
                                            ] || ""
                                        }
                                        type="number"
                                        size="small"
                                        fullWidth
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                {hData && hData.result && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">
                                            Best Estimator
                                        </p>
                                        <NextTable rowData={hData.result} />
                                    </div>
                                )}
                                {loading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CircularProgress size={20} />
                                            <span>Fetching Data...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                className="px-4 py-2 text-sm font-medium rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={handleOptimization}
                                disabled={loading}
                            >
                                Run Optimization
                            </button>
                        </div>
                    )}
                </div>
            )}
            {shouldShowModelSettings && (
                <div
                    className={`${Type === "function" ? "mt-4" : ""} rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm`}
                >
                    {Type === "function" && (
                        <h2 className="text-base font-semibold text-gray-700 mb-3">
                            Model Settings
                        </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Number of jobs
                            </label>
                            <TextField
                                value={optimizedData["Number of jobs"]}
                                type="number"
                                size="small"
                                fullWidth
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        "Number of jobs": e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center h-full">
                            <SafeCheckbox
                                isSelected={optimizedData.fit_intercept}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        fit_intercept: e.valueOf(),
                                    })
                                }
                                size={Type === "node" ? "sm" : "md"}
                            >
                                <span className="text-sm font-medium text-gray-700">
                                    Fit Intercept
                                </span>
                            </SafeCheckbox>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Display Metrics
                </label>
                <div className="w-full">
                    <MultipleDropDown
                        columnNames={DISPLAY_METRICES}
                        defaultValue={
                            optimizedData["Display Metrics"] ||
                            optimizedData["Display Metrices"] ||
                            DISPLAY_METRICES
                        }
                        setSelectedColumns={(e) =>
                            setOptimizedData({
                                ...optimizedData,
                                "Display Metrics": e,
                                "Display Metrices": e,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
}

export default LinearRegression;
