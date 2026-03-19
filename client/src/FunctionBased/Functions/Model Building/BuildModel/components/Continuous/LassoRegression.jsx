import {
    Checkbox,
    Input,
    Loading,
} from "../../../../Feature Engineering/muiCompat";
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

const DISPLAY_METRICES = [
    "R-Squared",
    "Mean Absolute Error",
    "Mean Squared Error",
    "Root Mean Squared Error",
];

const SELECTION = ["cyclic", "random"];

function LassoRegression({
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
    const [optimizedData, setOptimizedData] = useState({
        warm_start: true,
        fit_intercept: true,
        "Display Metrices": DISPLAY_METRICES,
        alpha: 1,
        max_iter: 1000,
        tol: 0,
        selection: "cyclic",
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:max-w-xs">
                                    <p className="mb-1">
                                        Number of iterations for hyperparameter
                                        search
                                    </p>
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
                                        bordered
                                        type="number"
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:max-w-xs">
                                    <p className="mb-1">
                                        Number of cross-validation folds
                                    </p>
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
                                        bordered
                                        type="number"
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:max-w-xs">
                                    <p className="mb-1">
                                        Random state for hyperparameter search
                                    </p>
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
                                        bordered
                                        type="number"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="w-full mt-4">
                                {hData && hData.result && (
                                    <>
                                        <p className="mb-2 font-medium tracking-wide">
                                            Best Estimator
                                        </p>
                                        <NextTable rowData={hData.result} />
                                    </>
                                )}
                                {loading && (
                                    <div className="grid place-content-center h-full">
                                        <Loading size="lg">
                                            Fetching Data...
                                        </Loading>
                                    </div>
                                )}
                            </div>
                            <button
                                className="self-start border-2 px-4 tracking-wider border-primary-btn text-black font-medium text-sm rounded-md py-2 mt-6"
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
                <div className="mt-8">
                    {Type === "function" && (
                        <h2 className={FE_SECTION_TITLE_CLASS}>Model Settings</h2>
                    )}
                    <div
                        className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${
                            Type === "node" && "!grid-cols-2 !gap-4"
                        }`}
                    >
                        <div>
                            <label className={FE_SUB_LABEL_CLASS}>Alpha</label>
                            <Input
                                type="number"
                                fullWidth
                                bordered
                                value={optimizedData.alpha}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        alpha: e.target.value,
                                    })
                                }
                                step={0.1}
                            />
                        </div>
                        <div>
                            <label className={FE_SUB_LABEL_CLASS}>
                                Max Iterations
                            </label>
                            <Input
                                fullWidth
                                type="number"
                                value={optimizedData.max_iter}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        max_iter: e.target.value,
                                    })
                                }
                                bordered
                            />
                        </div>
                        <div>
                            <label className={FE_SUB_LABEL_CLASS}>Tolerance</label>
                            <Input
                                fullWidth
                                bordered
                                type="number"
                                value={optimizedData.tol}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        tol: e.target.value,
                                    })
                                }
                                step={0.01}
                            />
                        </div>
                        <div>
                            <label className={FE_SUB_LABEL_CLASS}>Solver</label>
                            <SingleDropDown
                                columnNames={SELECTION}
                                initValue={optimizedData.selection}
                                onValueChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        selection: e,
                                    })
                                }
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <Checkbox
                                isSelected={optimizedData.fit_intercept}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        fit_intercept: e.valueOf(),
                                    })
                                }
                                size={Type === "node" ? "sm" : "md"}
                            >
                                Fit Intercept
                            </Checkbox>
                        </div>
                        <div className="flex items-center pt-6">
                            <Checkbox
                                isSelected={optimizedData.warm_start}
                                onChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        warm_start: e.valueOf(),
                                    })
                                }
                                size={Type === "node" ? "sm" : "md"}
                            >
                                Warm Start
                            </Checkbox>
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

export default LassoRegression;
