import { Modal } from "../muiCompat";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
    setDatasetName,
    setFile,
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
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import {
    FE_CARD_CLASS,
    FE_LABEL_CLASS,
    FE_SELECT_MENU_PROPS,
    FE_SELECT_SX,
    FE_TEXTFIELD_SX,
} from "../feUi";

function AlterFieldName({ csvData }) {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const [data, setData] = useState([{ column_name: "", new_field_name: "" }]);
    const [columnNames, setColumnNames] = useState();
    const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );

    const featureData = useSelector((state) => state.featureEngineering);
    const render = useSelector((state) => state.uploadedFile.rerender);

    const [visible, setVisible] = useState(false);
    const [saveAttempted, setSaveAttempted] = useState(false);
    const [newRowIndex, setNewRowIndex] = useState(null);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name) {
            const getData = async () => {
                setColumnNames(Object.keys(csvData[0]));
                dispatch(setFile(csvData));
            };

            getData();
        }
    }, [activeCsvFile, dispatch, csvData]);

    const handleChange = (val, index, key) => {
        const temp = data.map((d, ind) => {
            if (ind === index) return { ...d, [key]: val };
            return d;
        });
        setData(temp);
    };

    const addMapping = () => {
        const temp = [...data, { column_name: "", new_field_name: "" }];
        setData(temp);
        setNewRowIndex(temp.length - 1);
    };

    const removeMapping = (index) => {
        if (data.length <= 1) return;
        setData(data.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (newRowIndex === null) return;
        const row = document.getElementById(`alter-row-${newRowIndex}`);
        if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstControl = document.querySelector(
            `[data-alter-col-select="${newRowIndex}"]`,
        );
        if (firstControl && typeof firstControl.focus === "function") {
            firstControl.focus();
        }
        setNewRowIndex(null);
    }, [newRowIndex]);

    const columnCounts = useMemo(() => {
        const counts = {};
        data.forEach((row) => {
            const name = row.column_name?.trim();
            if (name) counts[name] = (counts[name] || 0) + 1;
        });
        return counts;
    }, [data]);

    const hasEmptyColumn = useMemo(
        () => data.some((row) => !row.column_name || !row.column_name.trim()),
        [data],
    );

    const hasEmptyNewField = useMemo(
        () =>
            data.some(
                (row) => !row.new_field_name || !row.new_field_name.trim(),
            ),
        [data],
    );

    const hasDuplicateColumn = useMemo(
        () => Object.values(columnCounts).some((count) => count > 1),
        [columnCounts],
    );

    const isSaveDisabled =
        hasEmptyColumn || hasEmptyNewField || hasDuplicateColumn;

    const handleSave = async () => {
        setSaveAttempted(true);
        if (isSaveDisabled) {
            toast.error(
                hasDuplicateColumn
                    ? "Please remove duplicate current column selections."
                    : "Please complete all Current Column and New Field Name values.",
            );
            return;
        }
        try {
            const Data =
                await apiService.matflow.featureEngineering.alterFieldName({
                    number_of_columns: data.length,
                    data,
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

            toast.success("File saved successfully.");
            dispatch(setReRender(!render));
        } catch (error) {
            toast.error("Operation failed.");
        }
    };

    return (
        <div className="w-full pt-1 pb-3">
            <div className="bg-white p-4 mb-3">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                    Alter Field Name
                </h2>
                {csvData && columnNames && data.length > 0 && (
                    <>
                        <div className="mb-1.5 flex justify-end">
                            <Button
                                variant="outlined"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={addMapping}
                                sx={{
                                    textTransform: "none",
                                    color: "#0D9488",
                                    borderColor: "#0D9488",
                                    "&:hover": {
                                        borderColor: "#0F766E",
                                        backgroundColor: "#F0FDFA",
                                    },
                                }}
                            >
                                Add Column
                            </Button>
                        </div>
                        <div className="space-y-2.5">
                            {data.map((val, index) => (
                                <div
                                    id={`alter-row-${index}`}
                                    key={index}
                                    className="border-b border-gray-100 pb-3 last:border-b-0"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[0.92rem] font-semibold text-gray-900">
                                            Add Column {index + 1}
                                        </p>
                                        <Tooltip
                                            title={
                                                data.length <= 1
                                                    ? "At least one row is required"
                                                    : "Remove row"
                                            }
                                        >
                                            <span>
                                                <Button
                                                    size="small"
                                                    startIcon={
                                                        <RemoveCircleOutlineIcon fontSize="small" />
                                                    }
                                                    onClick={() =>
                                                        removeMapping(index)
                                                    }
                                                    disabled={data.length <= 1}
                                                    sx={{
                                                        color: "#DC2626",
                                                        textTransform: "none",
                                                        fontWeight: 600,
                                                        minWidth: "auto",
                                                        px: 1,
                                                        "&:hover": {
                                                            backgroundColor:
                                                                "#FEE2E2",
                                                        },
                                                        "&.Mui-disabled": {
                                                            color: "#FCA5A5",
                                                        },
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className={FE_LABEL_CLASS}>
                                                Current Column
                                            </label>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={
                                                        val.column_name || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e.target.value,
                                                            index,
                                                            "column_name",
                                                        )
                                                    }
                                                    sx={FE_SELECT_SX}
                                                    MenuProps={
                                                        FE_SELECT_MENU_PROPS
                                                    }
                                                    displayEmpty
                                                    error={Boolean(
                                                        saveAttempted &&
                                                        (!val.column_name ||
                                                            columnCounts[
                                                                val.column_name
                                                            ] > 1),
                                                    )}
                                                    inputProps={{
                                                        "data-alter-col-select":
                                                            index,
                                                    }}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select column
                                                    </MenuItem>
                                                    {columnNames.map((col) => (
                                                        <MenuItem
                                                            key={col}
                                                            value={col}
                                                        >
                                                            {col}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            {saveAttempted &&
                                                !val.column_name && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        Please select a current
                                                        column.
                                                    </p>
                                                )}
                                            {saveAttempted &&
                                                val.column_name &&
                                                columnCounts[val.column_name] >
                                                    1 && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        This column is selected
                                                        more than once.
                                                    </p>
                                                )}
                                        </div>
                                        <div>
                                            <label className={FE_LABEL_CLASS}>
                                                New Field Name
                                            </label>
                                            <TextField
                                                fullWidth
                                                placeholder="Enter new name"
                                                value={val.new_field_name}
                                                onChange={(e) =>
                                                    handleChange(
                                                        e.target.value,
                                                        index,
                                                        "new_field_name",
                                                    )
                                                }
                                                size="small"
                                                error={Boolean(
                                                    saveAttempted &&
                                                    !val.new_field_name?.trim(),
                                                )}
                                                sx={FE_TEXTFIELD_SX}
                                            />
                                            {saveAttempted &&
                                                !val.new_field_name?.trim() && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        Please enter a new field
                                                        name.
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className={FE_CARD_CLASS}>
                <div className="mt-1 sticky bottom-0 z-10 border-t border-gray-100 bg-white/95 pt-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                                setSaveAsNew(e.target.checked),
                                            );
                                        }}
                                    />
                                }
                                label={
                                    <span className="text-sm font-medium text-gray-900">
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
                                                setDatasetName(e.target.value),
                                            );
                                        }}
                                        placeholder="Enter dataset name"
                                        sx={FE_TEXTFIELD_SX}
                                    />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isSaveDisabled}
                            sx={{
                                backgroundColor: "#0D9488",
                                textTransform: "none",
                                fontWeight: 600,
                                "&.Mui-disabled": {
                                    backgroundColor: "#99d5cf",
                                    color: "#ffffff",
                                },
                                "&:hover": { backgroundColor: "#0F766E" },
                            }}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* DOCS */}
            <button
                className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
                onClick={openModal}
            >
                ?
            </button>
            <Modal
                open={visible}
                onClose={closeModal}
                aria-labelledby="help-modal"
                aria-describedby="help-modal-description"
                width="800px"
                scroll
                closeButton
            >
                <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
                    <Docs section={"alterFieldName"} />
                </div>
            </Modal>
        </div>
    );
}

export default AlterFieldName;
