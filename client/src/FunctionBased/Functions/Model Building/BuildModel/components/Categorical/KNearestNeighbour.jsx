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

const DISPLAY_METRICES = ["Accuracy", "Precision", "Recall", "F1-Score"];

function KNearestNeighbour({
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
  const [optimized_data, setOptimizedData] = useState({
    "Multiclass Average": "micro",
    n_neighbors: 2,
    weights: "uniform",
    metric: "minkowski",
  });
  const [hData, setHData] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Type === "node" && initValue) {
      setOptimizedData({
        ...optimized_data,
        ...initValue,
      });
    }
  }, []);

  useEffect(() => {
    dispatch(setModelSetting(optimized_data));
    if (Type === "node") {
      onValueChange(optimized_data);
    }
  }, [dispatch, optimized_data]);

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
      setOptimizedData({ ...optimized_data, ...data.param });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div>
      {Type === "function" && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Hyperparameter Optimization Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of iterations for hyperparameter search
              </label>
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
                size="md"
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of cross-validation folds</label>
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
                size="md"
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Random state for hyperparameter search</label>
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
                size="md"
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
              {loading ? "Running..." : "Run Optimization"}
            </button>
            {hData && hData.result && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Best Estimator</p>
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
      <div className={Type === "function" ? "mt-2" : ""}>
        {Type === "function" && (
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Model Settings
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            type="number"
            fullWidth
            bordered
            size="md"
            label="Number of neighbors"
            value={optimized_data.n_neighbors || 2}
            onChange={(e) =>
              setOptimizedData({
                ...optimized_data,
                n_neighbors: e.target.value,
              })
            }
            step={1}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight Function</label>
            <SingleDropDown
              columnNames={["uniform", "distance"]}
              initValue={optimized_data.weights || "uniform"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, weights: e })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Distance Metric</label>
            <SingleDropDown
              columnNames={["minkowski", "euclidean", "manhattan"]}
              initValue={optimized_data.metric || "minkowski"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, metric: e })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Multiclass Average</label>
            <SingleDropDown
              columnNames={["micro", "macro", "weighted"]}
              initValue={optimized_data["Multiclass Average"] || "micro"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, "Multiclass Average": e })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Metrices</label>
          <MultipleDropDown
            columnNames={DISPLAY_METRICES}
            defaultValue={
              optimized_data["Display Metrices"] || DISPLAY_METRICES
            }
            setSelectedColumns={(e) =>
              setOptimizedData({ ...optimized_data, "Display Metrices": e })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default KNearestNeighbour;
