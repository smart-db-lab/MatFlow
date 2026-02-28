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
import SingleDropDown from "../../../../../Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../../../../services/api/apiService";

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
    (state) => state.modelBuilding.hyperparameter
  );
  const regressor = useSelector((state) => state.modelBuilding.regressor);
  const type = useSelector((state) => state.modelBuilding.type);
  const target_variable = useSelector(
    (state) => state.modelBuilding.target_variable
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
          <div className="grid grid-cols-2 gap-8">
            <div className="w-full flex flex-col justify-start gap-4 mt-2">
              <div className="w-full">
                <p className="mb-1">
                  Number of iterations for hyperparameter search
                </p>
                <Input
                  onChange={(e) =>
                    dispatch(
                      setHyperparameterData({
                        ...hyperparameterOption,
                        "Number of iterations for hyperparameter search":
                          e.target.value,
                      })
                    )
                  }
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
              <div className="w-full">
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
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
              <div className="w-full">
                <p className="mb-1">Random state for hyperparameter search</p>
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
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
            </div>
            <div className="w-full">
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
                  <Loading size="lg" color={"success"}>
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
            color="success"
            label="Alpha"
            value={optimizedData.alpha}
            onChange={(e) =>
              setOptimizedData({ ...optimizedData, alpha: e.target.value })
            }
            step={0.1}
          />
          <Input
            fullWidth
            type="number"
            value={optimizedData.max_iter}
            onChange={(e) =>
              setOptimizedData({ ...optimizedData, max_iter: e.target.value })
            }
            bordered
            color="success"
            label="Max Iterations"
          />
          <Input
            fullWidth
            bordered
            color="success"
            type="number"
            value={optimizedData.tol}
            onChange={(e) =>
              setOptimizedData({ ...optimizedData, tol: e.target.value })
            }
            step={0.01}
            label="Tolerance"
          />
          <div>
            <p>Solver</p>
            <SingleDropDown
              columnNames={SELECTION}
              initValue={optimizedData.selection}
              onValueChange={(e) =>
                setOptimizedData({ ...optimizedData, selection: e })
              }
            />
          </div>
          <Checkbox
            isSelected={optimizedData.fit_intercept}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                fit_intercept: e.valueOf(),
              })
            }
            color="success"
            size={Type === "node" ? "sm" : "md"}
          >
            Fit Intercept
          </Checkbox>
          <Checkbox
            isSelected={optimizedData.warm_start}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                warm_start: e.valueOf(),
              })
            }
            color="success"
            size={Type === "node" ? "sm" : "md"}
          >
            Warm Start
          </Checkbox>
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

export default LassoRegression;
