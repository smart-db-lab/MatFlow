export const PREVIEW_FUNCTIONS = new Set([
    "Display",
    "Dataset",
    "Explore Dataset",
    "Dataset Preview",
]);

export const CHART_PREVIEW_FUNCTION = "Chart Preview";

export const SPLIT_META_FUNCTIONS = new Set(["Split Dataset", "Model Building"]);

export const EDA_META_FUNCTIONS = new Set([
    "EDA",
    "Exploratory Data Analysis",
    "Visual Data Analysis",
    "Bar Plot",
    "Pie Plot",
    "Box Plot",
    "Histogram",
    "Violin Plot",
    "Scatter Plot",
    "Reg Plot",
    "Line Plot",
]);

export const DEPLOYMENT_FUNCTIONS = new Set([
    "Model Deployment",
    "Materials Property Prediction",
]);

export const DATASET_TAG_VALUES = new Set([
    "Dataset Preview",
    "Information",
    "Statistics",
    "Correlation",
    "Duplicate",
    "Group",
]);

export const FUNCTION_LABEL_MAP = {
    "Dataset Preview": "Materials Property Preview",
    Information: "Materials Data Profile",
    Statistics: "Materials Property Summary",
    Correlation: "Structure-Property Analysis",
    Corelation: "Structure-Property Analysis",
    Duplicate: "Duplicate Materials Detection",
    "Exploratory Data Analysis": "Visual Data Analysis",
    EDA: "Visual Data Analysis",
    "Materials Feature Engineering": "Manage Material Properties",
    "Manage Material Properties": "Manage Material Properties",
    "Materials Descriptor Generation": "Manage Material Properties",
    ForwardML: "Generate Predictive Model",
    "Model Building": "Generate Predictive Model",
    "Split Dataset": "Split Dataset Test-Train",
    "Model Prediction": "Evaluate Model Performance",
    Models: "Saved Models",
    "Model Evaluation": "Compare Models",
    "Model Deployment": "Materials Property Prediction",
    ReverseML: "Generate New Materials",
};

export const isPreviewFunction = (activeFunction) =>
    PREVIEW_FUNCTIONS.has(activeFunction);

export const isChartPreviewFunction = (activeFunction) =>
    activeFunction === CHART_PREVIEW_FUNCTION;

export const isSplitMetaFunction = (activeFunction) =>
    SPLIT_META_FUNCTIONS.has(activeFunction);

export const isEdaMetaFunction = (activeFunction) =>
    EDA_META_FUNCTIONS.has(activeFunction);

export const canUseSplitMetaOnly = (activeFunction, activeWorkspaceId) =>
    isSplitMetaFunction(activeFunction) && Boolean(activeWorkspaceId);

export const canUseEdaMetaOnly = (activeFunction, activeWorkspaceId) =>
    isEdaMetaFunction(activeFunction) && Boolean(activeWorkspaceId);

export const shouldSkipFullDataFetch = (activeFunction, activeWorkspaceId) =>
    isPreviewFunction(activeFunction) ||
    isChartPreviewFunction(activeFunction) ||
    canUseSplitMetaOnly(activeFunction, activeWorkspaceId) ||
    canUseEdaMetaOnly(activeFunction, activeWorkspaceId);

export const normalizeDatasetTagValue = (activeFunction) => {
    if (PREVIEW_FUNCTIONS.has(activeFunction)) {
        return "Dataset Preview";
    }
    return activeFunction;
};

export const isDatasetContext = (activeFile, activeFunction) =>
    Boolean(activeFile) &&
    (PREVIEW_FUNCTIONS.has(activeFunction) ||
        activeFunction === "Corelation" ||
        DATASET_TAG_VALUES.has(activeFunction));
