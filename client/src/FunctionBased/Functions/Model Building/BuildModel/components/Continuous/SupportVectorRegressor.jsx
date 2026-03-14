import { Input, Loading } from "../../../../Feature Engineering/muiCompat";
import React, { useEffect, useState } from "react";
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

const DISPLAY_METRICES = [
  "R-Squared",
  "Mean Absolute Error",
  "Mean Squared Error",
  "Root Mean Squared Error",
];

const KERNEL = ["linear", "rbf", "poly", "sigmoid"];

function SupportVectorRegressor({
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
    "Display Metrices": DISPLAY_METRICES,
    C: 1,
    epsilon: 0.1,
    kernel: "linear",
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
        <div>
          <h1 className="text-2xl font-medium tracking-wide mb-2">
            Hyperparameter Optimization Settings
          </h1>
          <div className="mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:max-w-xs">
                <p className="mb-1">Number of cross-validation folds</p>
                <Input
                  onChange={(e) =>
                    dispatch(
                      setHyperparameterData({
                        ...hyperparameterOption,
                        "Number of cross-validation folds": e.target.value,
                      })
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
      <div className="mt-8">
        {Type === "function" && (
          <h1 className="text-2xl font-medium tracking-wide mb-3">
            Model Settings
          </h1>
        )}
        <div
          className={`grid grid-cols-3 gap-8 ${
            Type === "node" && "!grid-cols-2 !gap-4"
          }`}
        >
          <Input
            type="number"
            fullWidth
            bordered
            label="C"
            value={optimizedData.C}
            onChange={(e) =>
              setOptimizedData({ ...optimizedData, C: e.target.value })
            }
            step={0.1}
          />
          <Input
            fullWidth
            type="number"
            value={optimizedData.epsilon}
            onChange={(e) =>
              setOptimizedData({ ...optimizedData, epsilon: e.target.value })
            }
            step={0.01}
            bordered
            label="Epsilon"
          />

          <div>
            <p>Kernel</p>
            <SingleDropDown
              columnNames={KERNEL}
              initValue={optimizedData.kernel}
              onValueChange={(e) =>
                setOptimizedData({ ...optimizedData, kernel: e })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2">Display Metrices</p>
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
  );
}

export default SupportVectorRegressor;
