import { createSlice } from "@reduxjs/toolkit";

const ModelBuildingSlice = createSlice({
  name: "model building",
  initialState: {
    regressor: "",
    target_variable: '',
    type: '',
    hyperparameter: {},
    model_setting: {},
  },
  reducers: {
    setReg: (state, {payload}) => {
        state.regressor = payload
    },
    setHyperparameterData: (state, {payload}) => {
        state.hyperparameter = payload
    },
    setTargetVariable: (state, {payload}) => {
        state.target_variable = payload
    },
    setType: (state, {payload}) => {
        state.type = payload
    },
    setModelSetting: (state, {payload}) => {
        state.model_setting = payload
    }
  },
});

// Action creators are generated for each case reducer function
// export const {} = ModelBuildingSlice.actions;
export const { setReg, setHyperparameterData, setTargetVariable, setType, setModelSetting } = ModelBuildingSlice.actions;

export default ModelBuildingSlice.reducer;
