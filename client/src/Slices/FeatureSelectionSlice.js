import { createSlice } from "@reduxjs/toolkit";

const FeatureSelectionSlice = createSlice({
  name: "Feature Selection",
  initialState: {
    method: "",
    target_variable: "",
    data_type: "",
  },
  reducers: {
    setMethodFeatureSelection: (state, { payload }) => {
      state.method = payload;
    },
    setFeatureSelection: (state, { payload }) => {
      state.target_variable = payload.target_variable;
      state.data_type = payload.data_type;
    },
  },
});

// Action creators are generated for each case reducer function
// export const {} = FeatureSelectionSlice.actions;
export const { setMethodFeatureSelection, setFeatureSelection } =
  FeatureSelectionSlice.actions;

export default FeatureSelectionSlice.reducer;
