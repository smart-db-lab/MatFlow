import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
    setColumnName,
    setDatasetName,
    setMethod,
    setOption,
    setSaveAsNew,
    setSelectColumn,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import Add_ExtractText from "./Component/Add_ExtractText";
import Add_GroupCategorical from "./Component/Add_GroupCategorical";
import Add_GroupNumerical from "./Component/Add_GroupNumerical";
import Add_MathOperation from "./Component/Add_MathOperation";
import Add_NewColumn from "./Component/Add_NewColumn";
import Modify_ProgressApply from "./Component/Modify_ProgressApply";
import Modify_ReplaceValue from "./Component/Modify_ReplaceValue";
import {
    CreateFile,
    UpdateFile,
    getNewDatasetFolder,
} from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";

function AddModify({ csvData }) {
    const { projectId } = useParams();
    const [currentOption, setCurrentOption] = useState("Add");
    const [currentMethod, setCurrentMethod] = useState("New Column");
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
    const dispatch = useDispatch();
    const featureData = useSelector((state) => state.featureEngineering);
    const [selectedColumn, setSelectedColumn] = useState("");
    const render = useSelector((state) => state.uploadedFile.rerender);

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        dispatch(setSelectColumn(selectedColumn));
    }, [selectedColumn, dispatch]);

    const handleOptionClicked = (optionValue) => {
        if (!optionValue) return;
        setCurrentOption(optionValue);
        let meth;
        if (optionValue === "Add") {
            setCurrentMethod("New Column");
            meth = "New Column";
        } else {
            setCurrentMethod("Math Operation");
            meth = "Math Operation";
        }
        dispatch(setOption(optionValue));
        dispatch(setMethod(meth));
    };

    const handleInputChange = (e) => {
        dispatch(setColumnName(e.target.value));
    };

    const handleSave = async () => {
        console.log(featureData);
        try {
            const data =
                await apiService.matflow.featureEngineering.featureCreation(
                    featureData,
                );
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
                    data,
                    filename: fileName,
                    foldername: saveFolder,
                });
            } else {
                await updateDataInIndexedDB(fileName, data);
                await UpdateFile({
                    projectId,
                    data,
                    filename: fileName.split("/").pop(),
                    foldername: activeFolder,
                });
            }

            const successMsg = featureData.save_as_new
                ? `New dataset "${fileName}" saved! Find it in the sidebar under the generated_datasets folder to build a model.`
                : `Data ${currentOption === "Add" ? "added" : "modified"} successfully!`;
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
            console.log(error);
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
            <div className="bg-white p-4 mb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Configuration
                    </h2>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={currentOption}
                        onChange={(_, val) => handleOptionClicked(val)}
                        sx={{
                            "& .MuiToggleButton-root": {
                                textTransform: "none",
                                px: 2,
                            },
                            "& .Mui-selected": {
                                backgroundColor: "#0D9488 !important",
                                color: "#fff !important",
                            },
                        }}
                    >
                        <ToggleButton value="Add">Add</ToggleButton>
                        <ToggleButton value="Modify">Modify</ToggleButton>
                    </ToggleButtonGroup>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            {currentOption === "Add"
                                ? "New column name"
                                : "Select Column"}
                        </label>
                        {currentOption === "Add" ? (
                            <TextField
                                fullWidth
                                size="small"
                                onChange={handleInputChange}
                                placeholder="Enter column name"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "8px",
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#0D9488",
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <FormControl fullWidth size="small">
                                <Select
                                    value={selectedColumn || ""}
                                    onChange={(e) =>
                                        setSelectedColumn(e.target.value)
                                    }
                                    displayEmpty
                                    MenuProps={{
                                        anchorOrigin: {
                                            vertical: "bottom",
                                            horizontal: "left",
                                        },
                                        transformOrigin: {
                                            vertical: "top",
                                            horizontal: "left",
                                        },
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 280,
                                                mt: 0.5,
                                                minWidth: 280,
                                            },
                                        },
                                    }}
                                    sx={{
                                        "& .MuiSelect-select": {
                                            py: "9px",
                                            fontSize: "0.875rem",
                                        },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                            { borderColor: "#9ca3af" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                            {
                                                borderColor: "#0D9488",
                                                borderWidth: "2px",
                                            },
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Select column
                                    </MenuItem>
                                    {Object.keys(csvData[0] || {}).map(
                                        (column) => (
                                            <MenuItem
                                                key={column}
                                                value={column}
                                            >
                                                {column}
                                            </MenuItem>
                                        ),
                                    )}
                                </Select>
                            </FormControl>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                            Method
                        </label>
                        <FormControl fullWidth size="small">
                            <Select
                                value={currentMethod}
                                onChange={(e) => {
                                    setCurrentMethod(e.target.value);
                                    dispatch(setMethod(e.target.value));
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { maxHeight: 280, mt: 0.5 },
                                    },
                                }}
                                sx={{
                                    "& .MuiSelect-select": {
                                        py: "9px",
                                        fontSize: "0.875rem",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#d1d5db",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                        { borderColor: "#9ca3af" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: "#0D9488",
                                            borderWidth: "2px",
                                        },
                                }}
                            >
                                {currentOption === "Add" && (
                                    <MenuItem value="New Column">
                                        New Column
                                    </MenuItem>
                                )}
                                <MenuItem value="Math Operation">
                                    Math Operation
                                </MenuItem>
                                <MenuItem value="Extract Text">
                                    Extract Text
                                </MenuItem>
                                <MenuItem value="Group Categorical">
                                    Group Categorical
                                </MenuItem>
                                <MenuItem value="Group Numerical">
                                    Group Numerical
                                </MenuItem>
                                {currentOption === "Modify" && [
                                    <MenuItem
                                        key="replace-values"
                                        value="Replace Values"
                                    >
                                        Replace Values
                                    </MenuItem>,
                                    <MenuItem
                                        key="progress-apply"
                                        value="Progress Apply"
                                    >
                                        Progress Apply
                                    </MenuItem>,
                                ]}
                            </Select>
                        </FormControl>
                    </div>

                    <div className="flex flex-col justify-end">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={savedAsNewDataset}
                                    onChange={(e) => {
                                        setSavedAsNewDataset(e.target.checked);
                                        dispatch(
                                            setSaveAsNew(e.target.checked),
                                        );
                                    }}
                                    sx={{
                                        color: "#9ca3af",
                                        "&.Mui-checked": { color: "#0D9488" },
                                    }}
                                />
                            }
                            label={
                                <span className="text-sm font-medium text-gray-900">
                                    Save as New Dataset
                                </span>
                            }
                            sx={{ marginLeft: 0 }}
                        />
                        {savedAsNewDataset && (
                            <div className="w-full mt-2">
                                <TextField
                                    fullWidth
                                    size="small"
                                    onChange={(e) => {
                                        dispatch(
                                            setDatasetName(e.target.value),
                                        );
                                    }}
                                    placeholder="New dataset name"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            "&.Mui-focused fieldset": {
                                                borderColor: "#0D9488",
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 p-3">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">
                        Method Settings
                    </h2>
                    {csvData && currentMethod === "New Column" && (
                        <Add_NewColumn csvData={csvData} />
                    )}
                    {csvData && currentMethod === "Math Operation" && (
                        <Add_MathOperation
                            csvData={csvData}
                            onSave={handleSave}
                        />
                    )}
                    {csvData && currentMethod === "Extract Text" && (
                        <Add_ExtractText csvData={csvData} />
                    )}
                    {csvData && currentMethod === "Group Categorical" && (
                        <Add_GroupCategorical csvData={csvData} />
                    )}
                    {csvData && currentMethod === "Group Numerical" && (
                        <Add_GroupNumerical csvData={csvData} />
                    )}
                    {csvData && currentMethod === "Replace Values" && (
                        <Modify_ReplaceValue csvData={csvData} />
                    )}
                    {csvData && currentMethod === "Progress Apply" && (
                        <Modify_ProgressApply csvData={csvData} />
                    )}
                </div>

                {currentMethod !== "Math Operation" && (
                    <div className="mt-4 pt-2 flex justify-end">
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

            {/* DOCS */}
            <button
                className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
                onClick={openModal}
            >
                ?
            </button>
            <Dialog open={visible} onClose={closeModal} fullWidth maxWidth="md">
                <DialogContent className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
                    <Docs section={"addModify"} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AddModify;
