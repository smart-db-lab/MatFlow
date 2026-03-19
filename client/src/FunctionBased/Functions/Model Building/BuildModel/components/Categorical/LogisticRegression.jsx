import { Input, Loading } from "../../../../Feature Engineering/muiCompat";
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
import SingleDropDown from "../../../../../Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../../../../services/api/apiService";
import {
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../../../../Feature Engineering/feUi";

const DISPLAY_METRICES = ["Accuracy", "Precision", "Recall", "F1-Score"];

function LogisticRegression({
    train,
    test,
    Type = "function",
    initValue = undefined,
    onValueChange = undefined,
}) {
    const showPersistentError = (message) => {
        toast.error(message || "Failed to optimize hyperparameters.", {
            autoClose: false,
            closeOnClick: true,
        });
    };

    const hyperparameterOption = useSelector(
        (state) => state.modelBuilding.hyperparameter,
    );
    const regressor = useSelector((state) => state.modelBuilding.regressor);
    const type = useSelector((state) => state.modelBuilding.type);
    const target_variable = useSelector(
        (state) => state.modelBuilding.target_variable,
    );
    const dispatch = useDispatch();
    const [optimizedData, setOptimizedData] = useState({
        "Multiclass Average": "micro",
        C: 1,
        tol: 0.0001,
        max_iter: 100,
        random_state: 42,
        penalty: "l2",
        solver: "lbfgs",
    });
    const [hData, setHData] = useState();
    const [loading, setLoading] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const hasOptimizationFields =
        [
            "Number of iterations for hyperparameter search",
            "Number of cross-validation folds",
            "Random state for hyperparameter search",
        ].length > 0;

    useEffect(() => {
        if (Type === "node" && initValue) {
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

            const normalizedResult = Array.isArray(data?.result)
                ? data.result
                : JSON.parse(data?.result || "[]");
            setHData({ ...data, result: normalizedResult });
            setOptimizedData({ ...optimizedData, ...data.param });
        } catch (error) {
            showPersistentError(
                error?.message || "Failed to optimize hyperparameters.",
            );
        }
        setLoading(false);
    };
    const shouldShowModelSettings =
        Type !== "function" || showAdvancedSettings;

    return (
        <div>
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
                        <div className="mt-3">
                            <h2 className="text-base font-semibold text-gray-700 mb-3">
                                Hyperparameter Optimization Settings
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Number of iterations for hyperparameter
                                        search
                                    </label>
                                    <Input
                                        onChange={(e) =>
                                            dispatch(
                                                setHyperparameterData({
                                                    ...hyperparameterOption,
                                                    "Number of iterations for hyperparameter search":
                                                        e.target.value,
                                                }),
                                            )
                                        }
                                        fullWidth
                                        bordered
                                        size="sm"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Number of cross-validation folds
                                    </label>
                                    <Input
                                        onChange={(e) =>
                                            dispatch(
                                                setHyperparameterData({
                                                    ...hyperparameterOption,
                                                    "Number of cross-validation folds":
                                                        e.target.value,
                                                }),
                                            )
                                        }
                                        fullWidth
                                        bordered
                                        size="sm"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Random state for hyperparameter search
                                    </label>
                                    <Input
                                        onChange={(e) =>
                                            dispatch(
                                                setHyperparameterData({
                                                    ...hyperparameterOption,
                                                    "Random state for hyperparameter search":
                                                        e.target.value,
                                                }),
                                            )
                                        }
                                        fullWidth
                                        bordered
                                        size="sm"
                                        type="number"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <button
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors"
                                    onClick={handleOptimization}
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Running..."
                                        : "Run Optimization"}
                                </button>
                                {hData && hData.result && (
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Best Estimator
                                        </p>
                                        <div className="max-h-32 overflow-y-auto">
                                            <NextTable rowData={hData.result} />
                                        </div>
                                    </div>
                                )}
                                {loading && (
                                    <div className="flex items-center gap-2">
                                        <Loading size="md" color={"primary"}>
                                            Fetching Data...
                                        </Loading>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {shouldShowModelSettings && (
                <div className="mt-8">
                    {Type === "function" && (
                        <h2 className={FE_SECTION_TITLE_CLASS}>
                            Model Settings
                        </h2>
                    )}
                    <div
                        className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${
                            Type === "node" && "!grid-cols-2 !gap-4"
                        }`}
                    >
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>C</label>
                        <Input
                            type="number"
                            fullWidth
                            bordered
                            value={optimizedData.C || 1}
                            onChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    C: e.target.value,
                                })
                            }
                            step={0.01}
                        />
                    </div>
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>Tolerance</label>
                        <Input
                            type="number"
                            fullWidth
                            bordered
                            value={optimizedData.tol || 0.0001}
                            onChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    tol: e.target.value,
                                })
                            }
                            step={0.001}
                        />
                    </div>
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>
                            Max Iteration
                        </label>
                        <Input
                            type="number"
                            fullWidth
                            bordered
                            value={optimizedData.max_iter || 100}
                            onChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    max_iter: e.target.value,
                                })
                            }
                            step={1}
                        />
                    </div>
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>
                            Random State
                        </label>
                        <Input
                            type="number"
                            fullWidth
                            bordered
                            value={optimizedData.random_state || 42}
                            onChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    random_state: e.target.value,
                                })
                            }
                            step={1}
                        />
                    </div>

                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>Penalty</label>
                        <SingleDropDown
                            columnNames={["None", "l1", "l2", "elasticnet"]}
                            initValue={optimizedData.penalty || "l2"}
                            onValueChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    penalty: e,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>Solver</label>
                        <SingleDropDown
                            columnNames={[
                                "lbfgs",
                                "newton-cg",
                                "liblinear",
                                "sag",
                                "saga",
                            ]}
                            initValue={optimizedData.solver || "lbfgs"}
                            onValueChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    solver: e,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={FE_SUB_LABEL_CLASS}>
                            Multiclass Average
                        </label>
                        <SingleDropDown
                            columnNames={["micro", "macro", "weighted"]}
                            initValue={
                                optimizedData["Multiclass Average"] || "micro"
                            }
                            onValueChange={(e) =>
                                setOptimizedData({
                                    ...optimizedData,
                                    "Multiclass Average": e,
                                })
                            }
                        />
                    </div>
                    </div>
                </div>
            )}
            <div className="mt-4">
                <label className={FE_SUB_LABEL_CLASS}>Display Metrics</label>
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
    );
}

export default LogisticRegression;
