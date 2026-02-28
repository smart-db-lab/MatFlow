import { createSlice } from "@reduxjs/toolkit";

export const FeatureEngineeringSlice = createSlice({
  name: "feature engineering",
  initialState: {
    option: "Add    ",
    select_column: "",
    column_name: "",
    add_to_pipeline: true,
    method: "New Column",
    data: {},
    save_as_new: false,
    dataset_name: "",
    file: [],
  },
  reducers: {
    setOption: (state, { payload }) => {
      state.option = payload;
    },
    setColumnName: (state, { payload }) => {
      state.column_name = payload;
    },
    setMethod: (state, { payload }) => {
      state.method = payload;
    },
    setData: (state, { payload }) => {
      state.data = payload;
    },
    setAddToPipeline: (state, { payload }) => {
      state.add_to_pipeline = payload;
    },
    setSaveAsNew: (state, { payload }) => {
      state.save_as_new = payload;
    },
    setDatasetName: (state, { payload }) => {
      state.dataset_name = payload;
    },
    setFile: (state, { payload }) => {
      state.file = payload;
    },
    setSelectColumn: (state, { payload }) => {
      state.select_column = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setOption,
  setColumnName,
  setMethod,
  setData,
  setAddToPipeline,
  setSaveAsNew,
  setDatasetName,
  setFile,
  setSelectColumn,
} = FeatureEngineeringSlice.actions;

export default FeatureEngineeringSlice.reducer;
