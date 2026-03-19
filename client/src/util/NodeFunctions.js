import { toast } from "react-toastify";
import * as stats from "simple-statistics";
import * as Stat from "statistics.js";
import { apiService } from "../services/api/apiService";

const EDA_LINK = {
  "Bar Plot": "eda_barplot",
  "Box Plot": "eda_boxplot",
  "Custom Plot": "eda_customplot",
  Histogram: "eda_histogram",
  "Line Plot": "eda_lineplot",
  "Pie Plot": "eda_pieplot",
  "Reg Plot": "eda_regplot",
  "Scatter Plot": "eda_scatterplot",
  "Violin Plot": "eda_violinplot",
};

const CROSS_VALID = [
  "Linear Regression",
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "Support Vector Regressor",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];
const RANDOM_STATE = [
  "Linear Regression",
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];
const ITER = [
  "Ridge Regression",
  "Lasso Regression",
  "Decision Tree Regression",
  "Random Forest Regression",
  "K-Nearest Neighbors",
  "Support Vector Machine",
  "Logistic Regression",
  "Decision Tree Classification",
  "Random Forest Classification",
  "Multilayer Perceptron",
];

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

const DISPLAY_METRICES = [
  "R-Squared",
  "Mean Absolute Error",
  "Mean Squared Error",
  "Root Mean Squared Error",
];

const raiseErrorToast = (rflow, params, error) => {
  // Error paile connected node er data delete kore dibe
  const tempNodes = rflow.getNodes().map((val) => {
    if (val.id === params.target) return { ...val, data: {} };
    return val;
  });
  rflow.setNodes(tempNodes);

  toast.error(error, {
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const handleOutputTable = async (rflow, params) => {
  try {
    const csvFile = rflow.getNode(params.source).data;

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: csvFile.table, file_name: csvFile.file_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handlePlotOptions = async (rflow, params) => {
  try {
    // const { plot, plotOption, nodeId } = Plot;
    const file = rflow.getNode(params.source).data;
    if (!file || !file.table) {
      throw new Error("File not found.");
    }
    if (Object.keys(file.plotOption).length === 0) return true;

    const plotType = file.plot || "Bar Plot";
    const edaMethod = EDA_LINK[plotType]?.replace('eda_', '').replace('plot', 'Plot') || 'barPlot';
    const payload = {
      ...file.plotOption,
      file: file.table,
    };
    
    let data;
    switch (plotType) {
      case "Bar Plot": data = await apiService.matflow.eda.barPlot(payload); break;
      case "Box Plot": data = await apiService.matflow.eda.boxPlot(payload); break;
      case "Custom Plot": data = await apiService.matflow.eda.customPlot(payload); break;
      case "Histogram": data = await apiService.matflow.eda.histogram(payload); break;
      case "Line Plot": data = await apiService.matflow.eda.linePlot(payload); break;
      case "Pie Plot": data = await apiService.matflow.eda.piePlot(payload); break;
      case "Reg Plot": data = await apiService.matflow.eda.regPlot(payload); break;
      case "Scatter Plot": data = await apiService.matflow.eda.scatterPlot(payload); break;
      case "Violin Plot": data = await apiService.matflow.eda.violinPlot(payload); break;
      default: data = await apiService.matflow.eda.barPlot(payload);
    }
    data = typeof data === 'string' ? JSON.parse(data) : data;

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target) return { ...val, data: { graph: data } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleReverseML = async (rflow, params) => {
  try {
    const { table, reverseml } = rflow.getNode(params.source).data;
    // console.log("first");
    if (!table) throw new Error("Check your file in upload node.");
    const data = await apiService.matflow.reverseML.reverseML({
      file: table,
      "Select Feature": reverseml["Select Feature"],
      "Select Target Variable": reverseml["Select Target Variable"],
      "Enter Values": reverseml["Enter Values"],
    });

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target) return { ...val, data: { table: data } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const isItTimeSeriesFile = async (rflow, params) => {
  try {
    const { table, timeSeries } = rflow.getNode(params.source).data;

    let option = { file: table };
    if (timeSeries && timeSeries.target_variable)
      option = { ...option, select_column: timeSeries.target_variable };
    else option = { ...option, select_column: "" };

    const data = await apiService.matflow.timeSeries.timeSeries(option);
    if ("error" in data && data.error) {
      toast.warn("No date-time column found in the dataset.", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return false;
    }
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target) return { ...val, data: { table } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleTimeSeriesAnalysis = async (rflow, params) => {
  try {
    const { table, timeSeries } = rflow.getNode(params.source).data;
    if (!timeSeries) return;
    // console.log(timeSeries);
    const data = await apiService.matflow.timeSeries.timeSeriesAnalysis({
      file: table,
      date: timeSeries.date,
      select_column: timeSeries.target_variable,
    });

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return { ...val, data: { graph: JSON.parse(data.graph) } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleFileForMergeDataset = async (rflow, params) => {
  try {
    const fileNode = rflow.getNode(params.source).data;
    const targetNodeFile = rflow.getNode(params.target).data;

    if (
      typeof targetNodeFile === "object" &&
      Object.keys(targetNodeFile).length === 2
    ) {
      throw new Error("Can't accept more than two dataset to merge");
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { ...val.data, [fileNode["file_name"]]: fileNode.table },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleMergeDataset = async (rflow, params) => {
  try {
    const { merge } = rflow.getNode(params.source).data;

    if (!merge) throw new Error("Check Merge Dataset Node.");

    let response = await apiService.matflow.featureEngineering.mergeDataset({
      how: merge.how,
      left_dataframe: merge.left_dataframe,
      right_dataframe: merge.right_dataframe,
      file: merge.table1,
      file2: merge.table2,
    });

    let data = typeof response === 'string' ? JSON.parse(response) : response;

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return { ...val, data: { table: data, file_name: merge.dataset_name } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleAppendDataset = async (rflow, params) => {
  try {
    const { append } = rflow.getNode(params.source).data;

    if (!append) throw new Error("Check Append Dataset Node.");

    let response = await apiService.matflow.featureEngineering.appendDataset(append);

    let data = typeof response === 'string' ? JSON.parse(response) : response;

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: append.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleAddModify = async (rflow, params) => {
  try {
    let { addModify } = rflow.getNode(params.source).data;
    // console.log(addModify);
    if (!addModify) throw new Error("Check Add/Modify Node.");
    if (addModify.option === "Add") {
      addModify.select_column = addModify.column_name;
    }
    const data = await apiService.matflow.featureEngineering.featureCreation(addModify);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: addModify.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleChangeDtype = async (rflow, params) => {
  try {
    let { changeDtype } = rflow.getNode(params.source).data;
    // console.log(changeDtype);
    if (!changeDtype) throw new Error("Check Change Dtype Node.");

    const data = await apiService.matflow.featureEngineering.changeDtype(changeDtype);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: changeDtype.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleAlterFieldName = async (rflow, params) => {
  try {
    let { alterFieldName } = rflow.getNode(params.source).data;

    if (!alterFieldName) throw new Error("Check Alter Field Name Node.");

    const data = await apiService.matflow.featureEngineering.alterFieldName(alterFieldName);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: alterFieldName.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleDropRowColumn = async (rflow, params) => {
  try {
    let { dropColumnRow } = rflow.getNode(params.source).data;

    if (!dropColumnRow) throw new Error("Check Drop Row/Column Node.");
    const payload = {
      default_value: dropColumnRow.default_value,
      select_columns: dropColumnRow.select_columns,
      file: dropColumnRow.file,
    };
    const data = dropColumnRow.dropOption === "Row"
      ? await apiService.matflow.featureEngineering.dropRows(payload)
      : await apiService.matflow.featureEngineering.dropColumn(payload);
    // console.log(data)
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: dropColumnRow.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleScaling = async (rflow, params) => {
  try {
    let { scaling } = rflow.getNode(params.source).data;

    if (!scaling) throw new Error("Check Scaling Node.");
    const data = await apiService.matflow.featureEngineering.scaling(scaling);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: scaling.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleEncoding = async (rflow, params) => {
  try {
    let { encoding } = rflow.getNode(params.source).data;

    if (!encoding) throw new Error("Check Encoding Node.");
    const data = await apiService.matflow.featureEngineering.encoding(encoding);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: encoding.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleCluster = async (rflow, params, outputType) => {
  try {
    let { cluster } = rflow.getNode(params.source).data;

    if (!cluster) throw new Error("Check Cluster Node.");
    const data = await apiService.matflow.featureEngineering.cluster(cluster);
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            [outputType === "table" ? "table" : "graph"]:
              outputType === "table" ? data.table : JSON.parse(data.graph),
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleDatasetInformation = (rflow, params) => {
  let { table: rowData } = rflow.getNode(params.source).data;

  const columns = Object.keys(rowData[0] || {});
  const columnInfo = [];

  columns.forEach((column) => {
    const uniqueValues = new Set();
    let nonNullCount = 0;

    if (column !== "id") {
      rowData.forEach((row) => {
        const value = row[column];
        if (value !== undefined && value !== null) {
          uniqueValues.add(value);
          nonNullCount++;
        }
      });

      const nullCount = rowData.length - nonNullCount;
      const nullPercentage = (nullCount / rowData.length) * 100;
      const dtype = typeof rowData[0][column];

      columnInfo.push({
        column,
        uniqueValues: uniqueValues.size,
        nonNullCount,
        nullPercentage,
        dtype,
      });
    }
  });

  const tempNodes = rflow.getNodes().map((val) => {
    if (val.id === params.target)
      return {
        ...val,
        data: {
          table: columnInfo,
        },
      };
    return val;
  });
  rflow.setNodes(tempNodes);
  return true;
};

export const handleDatasetStatistics = (rflow, params) => {
  let { table: rowData } = rflow.getNode(params.source).data;

  let columns = Object.keys(rowData[0] || {});
  const columnStatsData = [];
  columns = columns.filter((item) => {
    const dtype = typeof rowData[0][item];
    return dtype === "number";
  });

  columns.forEach((column) => {
    if (column !== "id") {
      let values = rowData
        .map((row) => parseFloat(row[column]))
        .filter((value) => !isNaN(value));
      const count = values.length;
      if (count > 0) {
        const min = stats.min(values).toFixed(3);
        const max = stats.max(values).toFixed(3);
        const std = stats.standardDeviation(values).toFixed(3);

        const mean = stats.mean(values).toFixed(3);
        const percentile25 = stats.quantile(values, 0.25).toFixed(3);
        const median = stats.quantile(values, 0.5).toFixed(3);
        const percentile75 = stats.quantile(values, 0.75).toFixed(3);

        columnStatsData.push({
          column,
          count,
          min,
          max,
          std,
          mean,
          "25%": percentile25,
          "50%": median,
          "75%": percentile75,
        });
      }
    }
  });

  const tempNodes = rflow.getNodes().map((val) => {
    if (val.id === params.target)
      return {
        ...val,
        data: {
          table: columnStatsData,
        },
      };
    return val;
  });
  rflow.setNodes(tempNodes);
  return true;
};

export const handleDatasetCorrelation = async (rflow, params, outputType) => {
  try {
    const { table: rowData, correlation } = rflow.getNode(params.source).data;

    if (!correlation) throw new Error("Check Correlation Node");

    const calculateCorrelations = (data) => {
      let columnNames = Object.keys(data[0]);
      columnNames = columnNames.filter(
        (val) => typeof data[0][val] === "number" && val !== "id"
      );
      const correlations = {};

      for (let i = 0; i < columnNames.length; i++) {
        const column1 = columnNames[i];
        correlations[column1] = {};

        for (let j = 0; j < columnNames.length; j++) {
          const column2 = columnNames[j];
          const column1Data = [];
          const column2Data = [];
          const tempData = [];

          for (let k = 0; k < data.length; k++) {
            const val1 = parseFloat(data[k][column1]);
            const val2 = parseFloat(data[k][column2]);

            if (!isNaN(val1) && !isNaN(val2)) {
              column1Data.push(val1);
              column2Data.push(val2);

              tempData.push({
                [column1]: val1,
                [column2]: val2,
              });
            }
          }

          const bodyVars = {
            [column1]: "metric",
            [column2]: "metric",
          };

          const temp = new Stat(tempData, bodyVars);
          // Calculate the correlation coefficient using simple-statistics correlation function
          const l = Object.keys(bodyVars);

          if (correlation.method === "spearman") {
            const cc = temp.spearmansRho(l[0], l[l.length === 1 ? 0 : 1], true);

            // // Store the correlation coefficient in the correlations object
            correlations[column1][column2] = cc.rho.toFixed(3);
          } else if (correlation.method === "pearson") {
            const cc = temp.correlationCoefficient(
              l[0],
              l[l.length === 1 ? 0 : 1]
            );

            // // Store the correlation coefficient in the correlations object
            correlations[column1][column2] =
              cc.correlationCoefficient.toFixed(3);
          }
        }
      }

      return correlations;
    };

    let cor = calculateCorrelations(rowData);

    if (correlation.method === "kendall") {
      const response = await apiService.matflow.dataset.getCorrelation({ file: rowData });
      let { data } = response;

      cor = JSON.parse(data);
      let columnName = Object.keys(cor[0]);
      columnName = columnName.filter((val) => val !== "id");
      let newData = [];
      for (let i = 0; i < columnName.length; i++) {
        const { id, ...rest } = cor[i];
        newData.push({ ...rest, column_name: columnName[i] });
      }
      // console.log({ newData });
      cor = newData;
    } else {
      let ind = 0;
      const columnName = Object.keys(cor);
      cor = Object.values(cor);
      cor = cor.map((val) => {
        return { ...val, column_name: columnName[ind++] };
      });
    }

    const columnNames = Object.keys(rowData[0]);
    let colWithInd = {};
    for (let i = 0; i < columnNames.length; i++) {
      colWithInd = { ...colWithInd, [columnNames[i]]: i };
    }

    const columnSelected = new Set(correlation.show_column);

    let tempData = JSON.parse(JSON.stringify(cor));
    for (let i = 0; i < columnNames.length; i++) {
      if (columnSelected.has(columnNames[i])) continue;
      const colInd = colWithInd[columnNames[i]];
      for (let j = 0; j < tempData.length; j++) {
        if (colInd === j) tempData[j] = {};
        delete tempData[j][columnNames[i]];
      }
    }
    // console.log(tempData);
    tempData = tempData.filter((val) => Object.keys(val).length !== 0);

    cor = tempData;

    let graphData = undefined;
    if (outputType === "graph") {
      const response = await apiService.matflow.dataset.getCorrelationHeatmap({ file: cor });
      const data = response.data || response;
      graphData = typeof data === 'string' ? JSON.parse(data) : data;
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            [outputType === "table" ? "table" : "graph"]:
              outputType === "table" ? cor : graphData,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleDatasetGroup = async (rflow, params) => {
  try {
    let { group } = rflow.getNode(params.source).data;

    if (!group) throw new Error("Check Group Node.");
    const response = await apiService.matflow.dataset.groupData({
      file: group.file,
      group_var: group.selectedColumn,
      agg_func: group.agg_func,
    });

    let { data } = response;
    // console.log(JSON.parse(data));
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: JSON.parse(data) },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleDatasetDuplicate = async (rflow, params) => {
  try {
    let { table: rowData, duplicate } = rflow.getNode(params.source).data;

    if (!duplicate) throw new Error("Check Duplicate Node.");

    const duplicates = [];
    const seen = new Set();

    rowData.forEach((obj) => {
      const excludedObj = {};
      for (const key in obj) {
        if (!duplicate.excludeKeys.includes(key)) {
          excludedObj[key] = obj[key];
        }
      }
      const key = Object.values(excludedObj).join("|");
      if (seen.has(key)) {
        duplicates.push(obj);
      } else {
        seen.add(key);
      }
    });

    if (duplicates.length === 0) {
      toast.warning("No duplicate data found", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return false;
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: duplicates },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleImputationInit = async (rflow, params) => {
  try {
    const { table } = rflow.getNode(params.source).data;

    if (!table) throw new Error("Something wrong with upload node");

    const data = await apiService.matflow.featureEngineering.imputationData1({
      file: table,
    });

    if (!data.null_var || data.null_var.length === 0) {
      toast.warning("This dataset doen't contain any imputation", {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return false;
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return { ...val, data: { table, null_var: data.null_var } };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleImputation = async (rflow, params) => {
  try {
    let { table, imputation } = rflow.getNode(params.source).data;

    if (!imputation) throw new Error("Check Imputation Node.");

    let data = await apiService.matflow.featureEngineering.imputationResult({
      file: table,
      Select_columns: imputation.select_column,
      strategy:
        imputation.activeStrategy === "mode"
          ? "constant"
          : imputation.activeStrategy,
      fill_group: imputation.fill_group,
      constant: imputation.constant,
    });
    // console.log(data);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { table: data, file_name: imputation.dataset_name },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleSplitDataset = async (rflow, params) => {
  try {
    let { splitDataset } = rflow.getNode(params.source).data;

    if (!splitDataset) throw new Error("Check Split Dataset Node.");
    let url = "http://127.0.0.1:9000/api/split_dataset/";

    // Provide default values for missing parameters
    const requestBody = {
      target_variable: splitDataset.target_variable,
      stratify: splitDataset.stratify || null,
      test_size: splitDataset.test_size || 0.2,
      random_state: splitDataset.random_state || 42,
      // Ensure shuffle is always a boolean (default to true if not provided)
      shuffle: splitDataset.shuffle === undefined ? true : Boolean(splitDataset.shuffle),
      file: splitDataset.file
    };

    let data = await apiService.matflow.ml.splitDataset(requestBody);

    // Check if the response contains an error
    if (data.error) {
      throw new Error(data.error);
    }

    // Only update nodes if there's no error
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            ...data,
            test_dataset_name: "test_" + splitDataset.testDataName,
            train_dataset_name: "train_" + splitDataset.trainDataName,
            splitted_dataset_name: splitDataset.splittedName,
            whatKind: splitDataset.whatKind,
            target_variable: splitDataset.target_variable,
            table: splitDataset.file,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleTestTrainPrint = async (rflow, params) => {
  let testTrain = rflow.getNode(params.source).data;
  const edgeId = params.sourceHandle;

  const tempNodes = rflow.getNodes().map((val) => {
    if (val.id === params.target)
      return {
        ...val,
        data: {
          ...val.data,
          table: edgeId === "test" ? testTrain.test : testTrain.train,
          file_name:
            edgeId === "test"
              ? testTrain.test_dataset_name
              : testTrain.train_dataset_name,
        },
      };
    return val;
  });
  rflow.setNodes(tempNodes);

  return true;
};

export const handleTestTrainDataset = async (rflow, params) => {
  try {
    let testTrain = rflow.getNode(params.source).data;
    // console.log({ testTrain });
    if (!testTrain) throw new Error("Check Test-Train Dataset Node.");
    if (rflow.getNode(params.target).type === "Hyper-parameter Optimization") {
      if (!testTrain.regressor)
        throw new Error("Check Test-Train Dataset Node.");
    }

    let hyper = {};

    if (ITER.includes(testTrain.regressor))
      hyper["Number of iterations for hyperparameter search"] = 2;
    if (CROSS_VALID.includes(testTrain.regressor))
      hyper["Number of cross-validation folds"] = 2;
    if (RANDOM_STATE.includes(testTrain.regressor))
      hyper["Random state for hyperparameter search"] = 2;

    let model_setting = {};
    if (testTrain.whatKind === "Continuous" && testTrain.regressor) {
      const regressor = testTrain.regressor;
      if (regressor === REGRESSOR[0]) {
        model_setting = {
          ...model_setting,
          "Number of jobs": -1,
          fit_intercept: true,
          "Display Metrices": DISPLAY_METRICES,
        };
      }
      if (regressor === REGRESSOR[1]) {
        model_setting = {
          ...model_setting,
          fit_intercept: true,
          "Display Metrices": DISPLAY_METRICES,
          max_iter: 1000,
          solver: "auto",
          alpha: 1,
          tol: 0,
        };
      }
      if (regressor === REGRESSOR[2]) {
        model_setting = {
          ...model_setting,
          warm_start: true,
          fit_intercept: true,
          "Display Metrices": DISPLAY_METRICES,
          alpha: 1,
          max_iter: 1000,
          tol: 0,
          selection: "cyclic",
        };
      }
      if (regressor === REGRESSOR[3]) {
        model_setting = {
          ...model_setting,
          min_samples_leaf: 1,
          min_samples_split: 2,
          "Display Metrices": DISPLAY_METRICES,
          random_state: 0,
          criterion: "mse",
          none: true,
        };
      }
      if (regressor === REGRESSOR[4]) {
        model_setting = {
          ...model_setting,
          min_samples_leaf: 1,
          min_samples_split: 2,
          "Display Metrices": DISPLAY_METRICES,
          max_features: "sqrt",
          max_depth: 0,
          criterion: "friedman_mse",
        };
      }
      if (regressor === REGRESSOR[5]) {
        model_setting = {
          ...model_setting,
          "Display Metrices": DISPLAY_METRICES,
          C: 1,
          epsilon: 0.1,
          kernel: "linear",
        };
      }
    } else if (testTrain.regressor) {
      const regressor = testTrain.regressor;
      if (regressor === CLASSIFIER[0]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          n_neighbors: 2,
          weights: "uniform",
          metric: "minkowski",
        };
      }
      if (regressor === CLASSIFIER[1]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          C: 1,
          tol: 0.001,
          degree: 3,
          kernel: "linear",
          gamma: "scale",
        };
      }
      if (regressor === CLASSIFIER[2]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          C: 1,
          tol: 0.0001,
          max_iter: 100,
          random_state: 42,
          penalty: "l2",
          solver: "lbfgs",
        };
      }
      if (regressor === CLASSIFIER[3]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          min_samples_split: 2,
          min_samples_leaf: 2,
          random_state: 2,
          criterion: "gini",
          none: true,
        };
      }
      if (regressor === CLASSIFIER[4]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          n_estimators: 100,
          min_samples_split: 2,
          min_samples_leaf: 2,
          random_state: 0,
          criterion: "gini",
          max_depth: "None",
          auto: true,
        };
      }
      if (regressor === CLASSIFIER[5]) {
        model_setting = {
          ...model_setting,
          "Multiclass Average": "micro",
          activation: "relu",
          hidden_layer_sizes: 3,
          max_iter: 1000,
          alpha: 0.0001,
          learning_rate_init: 0.001,
          tol: 0.001,
        };
      }
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: { ...val.data, testTrain, hyper, model_setting },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleHyperParameter = async (rflow, params) => {
  try {
    let { hyper, testTrain, model_setting } = rflow.getNode(params.source).data;

    if (!hyper) throw new Error("Check Hyperparameter Optimization Node.");

    if (!ITER.includes(testTrain.regressor))
      delete hyper["Number of iterations for hyperparameter search"];
    if (!CROSS_VALID.includes(testTrain.regressor))
      delete hyper["Number of cross-validation folds"];
    if (!RANDOM_STATE.includes(testTrain.regressor))
      delete hyper["Random state for hyperparameter search"];

    // console.log({ hyper }, testTrain.regressor);

    if (
      Object.values(hyper).length !==
      ITER.includes(testTrain.regressor) +
        RANDOM_STATE.includes(testTrain.regressor) +
        CROSS_VALID.includes(testTrain.regressor)
    )
      return false;

    // console.log("first");

    const data = await apiService.matflow.ml.hyperparameterOptimization({
      train: testTrain.train,
      test: testTrain.test,
      [testTrain.whatKind === "Continuous" ? "regressor" : "classifier"]:
        testTrain.regressor,
      type:
        testTrain.whatKind === "Continuous" ? "regressor" : "classifier",
      target_var: testTrain.target_variable,
      ...hyper,
    });
    let tmp = data.param;
    if (testTrain.whatKind !== "Continuous") {
      tmp = { ...tmp, "Multiclass Average": "micro" };
    }
    // console.log({ data, hyper });
    // console.log(testTrain);
    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            model_setting: { ...model_setting, ...tmp },
            testTrain,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModel = async (rflow, params) => {
  try {
    let { testTrain, model_setting } = rflow.getNode(params.source).data;

    if (!testTrain || !model_setting) throw new Error("Check Build Model Node");

    const data = await apiService.matflow.ml.buildModel({
      train: testTrain.train,
      test: testTrain.test,
      [testTrain.whatKind === "Continuous" ? "regressor" : "classifier"]:
        testTrain.regressor,
      type: testTrain.whatKind === "Continuous" ? "regressor" : "classifier",
      target_var: testTrain.target_variable,
      ...model_setting,
      file: testTrain.table,
    });

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            testTrain,
            model: {
              name: testTrain.model_name,
              ...data,
            },
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelDeploymentInit = async (rflow, params) => {
  try {
    let { testTrain, model } = rflow.getNode(params.source).data;

    if (!testTrain || !model)
      throw new Error("Check if the model is built successfully");

    const data = await apiService.matflow.deployment.deployData({
      train: testTrain.train,
      target_var: testTrain.target_variable,
    });

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            table: data.dataframe,
            table_init: data.dataframe,
            result_init: data.result,
            result: data.result,
            model,
            train: testTrain.train,
            target_var: testTrain.target_variable,
            model_deploy: model.model_deploy,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelDeployment = async (rflow, params) => {
  try {
    let model_deploy = rflow.getNode(params.source).data;

    if (!model_deploy) throw new Error("Check Model Deployment Node");

    let result = {};
    model_deploy.result.forEach((val) => {
      result = { ...result, [val.col]: val.value };
    });

    const data = await apiService.matflow.deployment.deployResult({
      train: model_deploy.train,
      target_var: model_deploy.target_var,
      result,
      model_deploy: model_deploy.model_deploy,
    });
    // console.log(data);

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            type: "Prediction",
            result: `${model_deploy.target_var}: ${data.pred}`,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelEvaluationInit = async (rflow, params) => {
  try {
    let { model } = rflow.getNode(params.source).data;

    if (!model) throw new Error("Check if the model is built successfully");

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            ...model,
            filtered_column: Object.keys(model.metrics_table),
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelEvaluation = async (rflow, params, type) => {
  // console.log("s");
  try {
    let model = rflow.getNode(params.source).data;

    if (!model) throw new Error("Check if the model is built successfully");

    // console.log(model);

    const table = model.filtered_column.map((val) => {
      return {
        "Column Name": val,
        Value: model.metrics_table[val],
      };
    });

    const file = [{ ...model.metrics_table, name: model.name }];

    let data;

    if (type === "graph") {
      let response = await apiService.matflow.ml.evaluateModel({
        file,
        "Display Type": "Graph",
        "Display Result": model.display_result || "All",
        "Select Orientation": model.orientation || "Vertical",
        Columns:
          model.display_result === "Custom"
            ? model.filtered_column
            : undefined,
      });
      data = typeof response === 'string' ? JSON.parse(response) : response;
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            [type === "table" ? "table" : "graph"]:
              type === "table" ? table : data,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);
    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelPredictionInit = async (rflow, params, type) => {
  // console.log("s");
  try {
    let { model, testTrain } = rflow.getNode(params.source).data;

    if (!model || !testTrain)
      throw new Error("Check if the model is built successfully");

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            ...val.data,
            model,
            testTrain,
            result: "Target Value",
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelPrediction = async (rflow, params) => {
  // console.log("s");
  try {
    let { model, testTrain, result } = rflow.getNode(params.source).data;

    if (!model || !testTrain)
      throw new Error("Check if the model is built successfully");

    if (!result) throw new Error("Check Model Prediction Node");

    let text = "",
      table,
      graph;

    if (model.metrics[result]) {
      text = `${result}: ${model.metrics[result]}`;
      const tempNodes = rflow.getNodes().map((val) => {
        if (val.id === params.target)
          return {
            ...val,
            data: {
              // ...val.data,
              type: result,
              result: text,
            },
          };
        return val;
      });
      rflow.setNodes(tempNodes);
      return true;
    } else {
      const data = await apiService.matflow.ml.predictModel({
        "Target Variable": testTrain.target_variable,
        model: model.metrics_table,
        file: testTrain.table,
        Result: result,
        y_pred: JSON.parse(model.y_pred),
        type:
          testTrain.whatKind === "Continuous" ? "regressor" : "classifier",
        regressor: testTrain.regressor,
      });
      if (typeof data === "string") text = data;
      else {
        if (data.table) {
          table = typeof data.table === 'string' ? JSON.parse(data.table) : data.table;
        }
        if (data.graph) {
          graph = typeof data.graph === 'string' ? JSON.parse(data.graph) : data.graph;
        }
      }
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            // ...val.data,
            table,
            graph,
            type: result,
            result: text,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleModelPredictionText = async (rflow, params) => {
  // console.log("s");
  try {
    let { model, testTrain, result } = rflow.getNode(params.source).data;

    if (!model || !testTrain)
      throw new Error("Check if the model is built successfully");

    if (!result) throw new Error("Check Model Prediction Node");

    let text = "";

    if (model.metrics[result]) {
      text = `${result}: ${model.metrics[result]}`;
    } else if (result === "Classification Report") {
      const data = await apiService.matflow.ml.predictModel({
        "Target Variable": testTrain.target_variable,
        model: model.metrics_table,
        file: testTrain.table,
        Result: result,
        y_pred: JSON.parse(model.y_pred),
        type:
          testTrain.whatKind === "Continuous" ? "regressor" : "classifier",
        regressor: testTrain.regressor,
      });
      if (typeof data === "string") text = data;
    }

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            type: result,
            result: text,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};

export const handleFeatureSelection = async (rflow, params) => {
  try {
    let { feature_selection } = rflow.getNode(params.source).data;

    if (!feature_selection) throw new Error("Check Feature Selection Node");

    const Data = await apiService.matflow.featureEngineering.featureSelection({
      method: feature_selection.method,
      k_fold: parseInt(feature_selection.k_fold),
      target_var: feature_selection.target_var,
      dataset: feature_selection.csvData,
      score_func: feature_selection.score_func,
      best_Kfeature: parseInt(feature_selection.best_Kfeature),
    });
    console.log(Data);

    let graphs = [],
      tables = [];
    if (feature_selection.method === "Best Overall Features") {
      let selectedFeatureData =
        Data.selected_features.custom_feature_data.group.selected_features_data;
      let tempResult1 = [];
      selectedFeatureData.rows.forEach((row) => {
        let tmp = {};
        row.forEach((val, ind) => {
          tmp = { ...tmp, [selectedFeatureData.headers[ind]]: val };
        });
        tempResult1.push(tmp);
      });

      let tempResult = [];
      let droppedFeature =
        Data.selected_features.custom_feature_data.group.dropped_features_data;
      droppedFeature.rows.forEach((row) => {
        let tmp = {};
        row.forEach((val, ind) => {
          tmp = { ...tmp, [droppedFeature.headers[ind]]: val };
        });
        tempResult.push(tmp);
      });

      // For Single Data
      selectedFeatureData =
        Data.selected_features.custom_feature_data.single
          .selected_features_data;
      let tempResult3 = [];
      selectedFeatureData.rows.forEach((row) => {
        let tmp = {};
        row.forEach((val, ind) => {
          tmp = { ...tmp, [selectedFeatureData.headers[ind]]: val };
        });
        tempResult3.push(tmp);
      });

      let tempResult4 = [];
      droppedFeature =
        Data.selected_features.custom_feature_data.single.dropped_features_data;
      droppedFeature.rows.forEach((row) => {
        let tmp = {};
        row.forEach((val, ind) => {
          tmp = { ...tmp, [droppedFeature.headers[ind]]: val };
        });
        tempResult4.push(tmp);
      });

      tables = [
        { heading: "Selected Features: ", table: tempResult1 },
        { heading: "Dropped Features: ", table: tempResult },
        { heading: "Selected Features: ", table: tempResult3 },
        { heading: "Dropped Features: ", table: tempResult4 },
      ];

      let data = Data.selected_features.graph_data;
      if (data) {
        if (data.bar_plot) {
          graphs.push(JSON.parse(data.bar_plot));
        }
        if (data.scatter_plot) {
          graphs.push(JSON.parse(data.scatter_plot));
        }
      }
      data = Data.selected_features.custom_feature_data.single.graph_data;
      graphs.push(data);
    } else if (feature_selection.method === "SelectKBest") {
      let data = Data.selected_features;

      tables.push({
        heading: "Selected Features and Scores: ",
        table: data.selected_features,
      });
      if (data.graph_data && data.graph_data.bar_plot) {
        graphs.push(JSON.parse(data.graph_data.bar_plot));
      }
      if (data.graph_data && data.graph_data.scatter_plot) {
        graphs.push(JSON.parse(data.graph_data.scatter_plot));
      }
    } else if (feature_selection.method === "Mutual Information") {
      let data = Data.selected_features;
      tables.push({
        heading: "Selected Features and Scores:",
        table: data.selected_features,
      });
      if (data.graph_data && data.graph_data.bar_plot) {
        graphs.push(JSON.parse(data.graph_data.bar_plot));
      }
      if (data.graph_data && data.graph_data.scatter_plot) {
        graphs.push(JSON.parse(data.graph_data.scatter_plot));
      }
    }
    // console.log({ tables, graphs });

    const tempNodes = rflow.getNodes().map((val) => {
      if (val.id === params.target)
        return {
          ...val,
          data: {
            method: "Feature Selection",
            tables,
            graphs,
          },
        };
      return val;
    });
    rflow.setNodes(tempNodes);

    return true;
  } catch (error) {
    raiseErrorToast(rflow, params, error.message);
    return false;
  }
};
