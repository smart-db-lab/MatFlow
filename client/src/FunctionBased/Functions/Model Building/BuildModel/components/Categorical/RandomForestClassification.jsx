import { Checkbox, Input, Loading } from "../../../../Feature Engineering/muiCompat";
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

const DISPLAY_METRICES = ["Accuracy", "Precision", "Recall", "F1-Score"];

function RandomForestClassification({
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
    "Multiclass Average": "micro",
    n_estimators: 100,
    min_samples_split: 2,
    min_samples_leaf: 2,
    random_state: 0,
    criterion: "gini",
    max_depth: "None",
    auto: true,
  });

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

  const [hData, setHData] = useState();
  const [loading, setLoading] = useState();

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
            label="Number of Estimators"
            value={optimizedData.n_estimators || 100}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                n_estimators: e.target.value,
              })
            }
            step={1}
          />
          <Input
            type="number"
            fullWidth
            bordered
            label="Min. Samples Split"
            value={optimizedData.min_samples_split || 2}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                min_samples_split: e.target.value,
              })
            }
            step={1}
          />
          <Input
            type="number"
            fullWidth
            bordered
            label="Min. Samples Leaf"
            value={optimizedData.min_samples_leaf || 2}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                min_samples_leaf: e.target.value,
              })
            }
            step={1}
          />
          <Input
            type="number"
            fullWidth
            bordered
            label="Random State"
            value={optimizedData.random_state || 0}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                random_state: e.target.value,
              })
            }
            step={1}
          />

          <div>
            <p>Criterion</p>
            <SingleDropDown
              columnNames={["gini", "entropy", "log_loss"]}
              initValue={optimizedData.criterion || "gini"}
              onValueChange={(e) =>
                setOptimizedData({
                  ...optimizedData,
                  criterion: e,
                })
              }
            />
          </div>

          <div>
            <p>Multiclass Average</p>
            <SingleDropDown
              columnNames={["micro", "macro", "weighted"]}
              initValue={optimizedData["Multiclass Average"] || "micro"}
              onValueChange={(e) =>
                setOptimizedData({
                  ...optimizedData,
                  "Multiclass Average": e,
                })
              }
            />
          </div>
          <div>
            <p>Max Depth</p>
            <SingleDropDown
              columnNames={["None"]}
              disabled={true}
              initValue={"None"}
            />
          </div>
          <Checkbox
            isSelected={!!optimizedData.auto}
            onChange={(e) =>
              setOptimizedData({
                ...optimizedData,
                auto: e.valueOf(),
              })
            }
            size={Type === "node" ? "sm" : "md"}
          >
            Auto
          </Checkbox>
        </div>
        <div className="mt-4">
          <p className="mb-2">Display Metrices</p>
          <MultipleDropDown
            columnNames={DISPLAY_METRICES}
            defaultValue={optimizedData["Display Metrices"] || DISPLAY_METRICES}
            setSelectedColumns={(e) =>
              setOptimizedData({ ...optimizedData, "Display Metrices": e })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default RandomForestClassification;
