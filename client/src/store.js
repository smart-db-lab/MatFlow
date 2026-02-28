import { configureStore } from "@reduxjs/toolkit";
import { FeatureEngineeringSlice } from "./Slices/FeatureEngineeringSlice";
import ModelBuilding from "./Slices/ModelBuilding";
import EDASlice from "./Slices/NodeBasedSlices/EDASlice";
import { SideBarSlice } from "./Slices/SideBarSlice";
import { UploadedFileSlice } from "./Slices/UploadedFileSlice";
import FeatureSelectionSlice from "./Slices/FeatureSelectionSlice";

export default configureStore({
  reducer: {
    uploadedFile: UploadedFileSlice.reducer,
    sideBar: SideBarSlice.reducer,
    featureEngineering: FeatureEngineeringSlice.reducer,
    modelBuilding: ModelBuilding,
    EDA: EDASlice,
    featureSelection: FeatureSelectionSlice
  },
});
