import { configureStore } from "@reduxjs/toolkit";
import { FeatureEngineeringSlice } from "./Slices/FeatureEngineeringSlice";
import ModelBuilding from "./Slices/ModelBuilding";
import EDASlice from "./Slices/NodeBasedSlices/EDASlice";
import { SideBarSlice } from "./Slices/SideBarSlice";
import { UploadedFileSlice } from "./Slices/UploadedFileSlice";
import FeatureSelectionSlice from "./Slices/FeatureSelectionSlice";
import workspaceReducer from "./Slices/workspaceSlice";

const WATCHED_ACTIONS = new Set([
    "uploadedFile/setActiveFile",
    "uploadedFile/setActiveFolderAction",
    "workspace/setActiveWorkspace",
    "workspace/setActiveFilename",
    "workspace/fetchWorkspaces/fulfilled",
]);

const stateDebugMiddleware = (storeAPI) => (next) => (action) => {
    const result = next(action);

    if (WATCHED_ACTIONS.has(action?.type)) {
        try {
            const state = storeAPI.getState();
            console.groupCollapsed(`🧭 Redux debug: ${action.type}`);
            console.log("Action payload:", action.payload);
            console.log("Workspace context:", {
                activeWorkspaceId: state?.workspace?.activeWorkspaceId,
                activeFilename: state?.workspace?.activeFilename,
                activeFile: state?.uploadedFile?.activeFile,
                activeFolder: state?.uploadedFile?.activeFolder,
            });
            console.log("Full redux state:", state);
            console.groupEnd();
        } catch (error) {
            console.warn("Redux debug logger failed:", error);
        }
    }

    return result;
};

export default configureStore({
    reducer: {
        uploadedFile: UploadedFileSlice.reducer,
        sideBar: SideBarSlice.reducer,
        featureEngineering: FeatureEngineeringSlice.reducer,
        modelBuilding: ModelBuilding,
        EDA: EDASlice,
        featureSelection: FeatureSelectionSlice,
        workspace: workspaceReducer,
    },
//     middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(stateDebugMiddleware),
});
