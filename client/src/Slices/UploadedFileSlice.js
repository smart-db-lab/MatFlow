import { createSlice } from '@reduxjs/toolkit';
import { clearIndexedDB } from '../util/indexDB';

export const UploadedFileSlice = createSlice({
  name: 'uploadedFile',
  initialState: {
    activeFile: '',
    rerender: false,
    activeFolder: '',
    previousFile: '',
  },
  reducers: {
    setActiveFile: (state, { payload }) => {
      // Store previous file for cache clearing
      state.previousFile = state.activeFile;
      state.activeFile = payload;

      // Note: Cache clearing is now handled in the component level
      // to avoid race conditions with data fetching
      console.log(`🔄 Active file changed: ${state.previousFile} → ${payload}`);
    },
    setReRender: (state, { payload }) => {
      state.rerender = payload;
    },
    setActiveFolderAction: (state, { payload }) => {
      state.activeFolder = payload;
    },
    clearAllCache: (state) => {
      // Action to manually clear all cache
      if (state.activeFile) {
        clearIndexedDB(state.activeFile)
          .then(() => {
            console.log(`Cache cleared for active file: ${state.activeFile}`);
          })
          .catch((error) => {
            console.warn(
              `Failed to clear cache for ${state.activeFile}:`,
              error
            );
          });
      }
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setActiveFile,
  setReRender,
  setActiveFolderAction,
  clearAllCache,
} = UploadedFileSlice.actions;

export default UploadedFileSlice.reducer;
