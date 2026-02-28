import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAuthHeaders } from "../../../../../../util/adminAuth";
import {
  setHyperparameterData,
  setModelSetting,
} from "../../../../../../Slices/ModelBuilding";
import MultipleDropDown from "../../../../../Components/MultipleDropDown/MultipleDropDown";
import NextTable from "../../../../../Components/NextTable/NextTable";
import { apiService } from "../../../../../../services/api/apiService";

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
    (state) => state.modelBuilding.hyperparameter
  );
  const regressor = useSelector((state) => state.modelBuilding.regressor);
  const type = useSelector((state) => state.modelBuilding.type);
  const target_variable = useSelector(
    (state) => state.modelBuilding.target_variable
  );
  const dispatch = useDispatch();
  const [hData, setHData] = useState();
  const [optimizedData, setOptimizedData] = useState({
    "Number of jobs": -1,
    fit_intercept: true,
    "Display Metrices": DISPLAY_METRICES,
  });
  const [loading, setLoading] = useState(false);

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

  const handleOptimization = async () => {
    try {
      setLoading(true);
      const data = await apiService.matflow.ml.hyperparameterOptimization({
        train,
        test,
        [type === "regressor" ? "regressor" : "classifier"]: regressor,
        type,
        target_var: target_variable,
        ...hyperparameterOption,
      });
      console.log(data);
      setHData(data);
      setOptimizedData({ ...optimizedData, ...data.param });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div>
      {Type === "function" && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Hyperparameter Optimization Settings
          </h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of cross-validation folds
              </label>
              <Input
                onChange={(e) =>
                  dispatch(
                    setHyperparameterData({
                      ...hyperparameterOption,
                      "Number of cross-validation folds": e.target.value,
                    })
                  )
                }
                value={hyperparameterOption?.["Number of cross-validation folds"] || ""}
                type="number"
                size="md"
                bordered
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
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
                    })
                  )
                }
                value={hyperparameterOption?.["Random state for hyperparameter search"] || ""}
                type="number"
                size="md"
                bordered
                className="w-full"
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
                <Loading size="lg">
                  <span className="text-gray-600">Fetching Data...</span>
                </Loading>
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
      <div className={Type === "function" ? "mt-6" : ""}>
        {Type === "function" && (
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Model Settings
          </h2>
        )}
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[150px] max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of jobs
            </label>
            <Input
              value={optimizedData["Number of jobs"]}
              type="number"
              size="md"
              bordered
              className="w-full"
              onChange={(e) =>
                setOptimizedData({
                  ...optimizedData,
                  "Number of jobs": e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center">
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
              <span className="text-sm font-medium text-gray-700">Fit Intercept</span>
            </Checkbox>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Display Metrices
          </label>
          <div className="max-w-md">
            <MultipleDropDown
              columnNames={DISPLAY_METRICES}
              defaultValue={optimizedData["Display Metrices"]}
              setSelectedColumns={(e) =>
                setOptimizedData({ ...optimizedData, "Display Metrices": e })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinearRegression;
