import styled from "@emotion/styled";
import { Slider, Stack } from "@mui/material";
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

const DISPLAY_METRICES = [
    "R-Squared",
    "Mean Absolute Error",
    "Mean Squared Error",
    "Root Mean Squared Error",
];

const CRITERION = [
    "friedman_mse",
    "squared_error",
    "absolute_error",
    "poisson",
];

const MAX_FEATURE = ["sqrt", "log2", "None"];

function RandomForestRegression({
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
        min_samples_leaf: 1,
        min_samples_split: 2,
        "Display Metrices": DISPLAY_METRICES,
        max_features: "sqrt",
        max_depth: 10,
        criterion: "friedman_mse",
    });
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
                            <label className={FE_SUB_LABEL_CLASS}>Criterion</label>
                            <SingleDropDown
                                columnNames={CRITERION}
                                initValue={optimizedData.criterion}
                                onValueChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        criterion: e,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className={FE_SUB_LABEL_CLASS}>
                                Max Features
                            </label>
                            <SingleDropDown
                                columnNames={MAX_FEATURE}
                                initValue={optimizedData.max_features}
                                onValueChange={(e) =>
                                    setOptimizedData({
                                        ...optimizedData,
                                        max_features: e,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mt-4">
                            <label className={FE_SUB_LABEL_CLASS}>
                                Min. Samples Split
                            </label>
                            <Stack
                                spacing={2}
                                direction="row"
                                sx={{ mb: 1 }}
                                alignItems="center"
                            >
                                <span>2</span>
                                <PrettoSlider
                                    aria-label="Auto Bin Slider"
                                    min={2}
                                    max={10}
                                    step={1}
                                    value={optimizedData.min_samples_split}
                                    onChange={(e, v) =>
                                        setOptimizedData({
                                            ...optimizedData,
                                            min_samples_split: v,
                                        })
                                    }
                                    valueLabelDisplay="on"
                                    color="primary"
                                />
                                <span>10</span>
                            </Stack>
                        </div>
                        <div className="mt-4">
                            <label className={FE_SUB_LABEL_CLASS}>Max Depth</label>
                            <Stack
                                spacing={2}
                                direction="row"
                                sx={{ mb: 1 }}
                                alignItems="center"
                            >
                                <span>1</span>
                                <PrettoSlider
                                    aria-label="Auto Bin Slider"
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={optimizedData.max_depth}
                                    onChange={(e, v) =>
                                        setOptimizedData({
                                            ...optimizedData,
                                            max_depth: v,
                                        })
                                    }
                                    valueLabelDisplay="on"
                                    color="primary"
                                />
                                <span>100</span>
                            </Stack>
                        </div>
                        <div className="mt-4">
                            <label className={FE_SUB_LABEL_CLASS}>
                                Min. Samples Leaf
                            </label>
                            <Stack
                                spacing={2}
                                direction="row"
                                sx={{ mb: 1 }}
                                alignItems="center"
                            >
                                <span>1</span>
                                <PrettoSlider
                                    aria-label="Auto Bin Slider"
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={optimizedData.min_samples_leaf}
                                    onChange={(e, v) =>
                                        setOptimizedData({
                                            ...optimizedData,
                                            min_samples_leaf: v,
                                        })
                                    }
                                    valueLabelDisplay="on"
                                    color="primary"
                                />
                                <span>10</span>
                            </Stack>
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

export default RandomForestRegression;

const PrettoSlider = styled(Slider)({
    color: "#52af77",
    height: 8,
    "& .MuiSlider-track": {
        border: "none",
    },
    "& .MuiSlider-thumb": {
        height: 24,
        width: 24,
        backgroundColor: "#fff",
        border: "2px solid currentColor",
        "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit",
        },
        "&:before": {
            display: "none",
        },
    },
    "& .MuiSlider-valueLabel": {
        lineHeight: 1.2,
        fontSize: 12,
        background: "unset",
        padding: 0,
        width: 32,
        height: 32,
        borderRadius: "50% 50% 50% 0",
        backgroundColor: "#52af77",
        transformOrigin: "bottom left",
        transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
        "&:before": { display: "none" },
        "&.MuiSlider-valueLabelOpen": {
            transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
        },
        "& > *": {
            transform: "rotate(45deg)",
        },
    },
});
