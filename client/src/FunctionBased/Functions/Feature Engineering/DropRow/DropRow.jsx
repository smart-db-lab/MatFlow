import React, { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    setDatasetName,
    setSaveAsNew,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import {
    CreateFile,
    UpdateFile,
    getNewDatasetFolder,
} from "../../../../util/utils";
import { apiService } from "../../../../services/api/apiService";
import {
    FE_ACTION_ROW_CLASS,
    FE_CARD_CLASS,
    FE_LABEL_CLASS,
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../feUi";

function DropRow({
    csvData,
    type = "function",
    onValueChange = undefined,
    initValue = undefined,
}) {
    const { projectId } = useParams();
    const [defaultValue, setDefaultValue] = useState("With Null");
    const allColumns =
        csvData && csvData.length > 0 ? Object.keys(csvData[0]) : [];
    const [selectedColumns, setSelectedColumns] = useState();
    const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
    const dispatch = useDispatch();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const featureData = useSelector((state) => state.featureEngineering);
    const render = useSelector((state) => state.uploadedFile.rerender);

    // Early return if no data is available
    if (!csvData || csvData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Dataset Available
                    </h3>
                    <p className="text-gray-500">
                        Please upload a dataset to use the Drop Row feature.
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (initValue) {
            setDefaultValue(initValue.default_value);
            setSelectedColumns(initValue.select_columns);
        }
    }, []);

    useEffect(() => {
        if (type === "node") {
            onValueChange({
                default_value: defaultValue,
                select_columns: selectedColumns,
            });
        }
    }, [type, defaultValue, selectedColumns]);

    const handleSave = async () => {
        try {
            const Data = await apiService.matflow.featureEngineering.dropRows({
                default_value: defaultValue,
                select_columns: selectedColumns,
                file: csvData,
            });

            let fileName = activeCsvFile.name;

            if (featureData.save_as_new) {
                fileName = featureData.dataset_name;
                const saveFolder = getNewDatasetFolder(
                    activeFolder,
                    "generated_datasets",
                    activeCsvFile?.name,
                );
                await CreateFile({
                    projectId,
                    data: Data,
                    filename: fileName,
                    foldername: saveFolder,
                });
            } else {
                await updateDataInIndexedDB(fileName, Data);
                await UpdateFile({
                    projectId,
                    data: Data,
                    filename: fileName.split("/").pop(),
                    foldername: activeFolder,
                });
            }

            const successMsg = featureData.save_as_new
                ? `New dataset "${fileName}" saved! Find it in the sidebar under the generated_datasets folder to build a model.`
                : `Data updated successfully!`;
            toast.success(successMsg, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            dispatch(setReRender(!render));
        } catch (error) {
            toast.error("Something went wrong. Please try again", {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <div className="w-full pt-1 pb-3">
            <div className={FE_CARD_CLASS}>
                <h2 className={FE_SECTION_TITLE_CLASS}>Drop Row Settings</h2>

                <div className="space-y-3">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                        <div className="flex-shrink-0">
                            <label className={FE_SUB_LABEL_CLASS}>
                                Default Value
                            </label>
                            <RadioGroup
                                row
                                value={defaultValue}
                                onChange={(e) =>
                                    setDefaultValue(e.target.value)
                                }
                            >
                                <FormControlLabel
                                    value="With Null"
                                    control={<Radio size="small" />}
                                    label="With Null"
                                />
                            </RadioGroup>
                        </div>

                        <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
                            <label className={FE_SUB_LABEL_CLASS}>
                                Select Columns
                            </label>
                            <Autocomplete
                                multiple
                                size="small"
                                options={allColumns}
                                value={selectedColumns || []}
                                onChange={(_, val) => setSelectedColumns(val)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select columns"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {type === "function" && (
                        <div className={FE_ACTION_ROW_CLASS}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={savedAsNewDataset}
                                                onChange={(e) => {
                                                    setSavedAsNewDataset(
                                                        e.target.checked,
                                                    );
                                                    dispatch(
                                                        setSaveAsNew(
                                                            e.target.checked,
                                                        ),
                                                    );
                                                }}
                                            />
                                        }
                                        label={
                                            <span className="text-sm text-gray-700">
                                                Save as New Dataset
                                            </span>
                                        }
                                    />
                                    {savedAsNewDataset && (
                                        <div className="w-48">
                                            <TextField
                                                label="New Dataset Name"
                                                fullWidth
                                                size="small"
                                                onChange={(e) => {
                                                    dispatch(
                                                        setDatasetName(
                                                            e.target.value,
                                                        ),
                                                    );
                                                }}
                                                placeholder="Enter dataset name"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                sx={{
                                    backgroundColor: "#0D9488",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    "&:hover": { backgroundColor: "#0F766E" },
                                }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DropRow;
