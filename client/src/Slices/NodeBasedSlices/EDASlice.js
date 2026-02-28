import { createSlice } from "@reduxjs/toolkit";

const EDASlice = createSlice({
  name: "EDASlice",
  initialState: {
    nodeId: "",
    plot: "",
    plotOption: {},
  },
  reducers: {
    setPlotRedux: (state, { payload }) => {
      state.plot = payload;
    },
    setPlotOptionRedux: (state, { payload }) => {
      state.plotOption = payload;
    },
    setNodeIdRedux: (state, { payload }) => {
      state.nodeId = payload;
    },
    setPlotOptionInitRedux: (state, { payload }) => {
      let keys = Object.keys(state.plotOption);
      keys = new Set(keys);
      if (!keys.has(payload))
        state.plotOption = { ...state.plotOption, [payload]: {} };
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setPlotRedux,
  setPlotOptionRedux,
  setNodeIdRedux,
  setPlotOptionInitRedux,
} = EDASlice.actions;

export default EDASlice.reducer;
