import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { setFile } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import { updateDataInIndexedDB } from "../../../../util/indexDB";
import { UpdateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import { FE_SELECT_MENU_PROPS, FE_SELECT_SX } from "../feUi";

function ChangeDType({ csvData }) {
    const dispatch = useDispatch();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const { projectId } = useParams();

    const [columnNames, setColumnNames] = useState();
    const [data, setdata] = useState([
        {
            column_name: "",
            desired_dtype: "int",
            desired_bit_length: "8",
        },
    ]);
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
        setdata(temp);
    };

    const addMapping = () => {
        const temp = [
            ...data,
            {
                column_name: "",
                desired_dtype: "int",
                desired_bit_length: "8",
            },
        ];
        setdata(temp);
        setNewRowIndex(temp.length - 1);
    };

    const removeMapping = (index) => {
        if (data.length <= 1) return;
        const temp = data.filter((_, i) => i !== index);
        setdata(temp);
    };

    useEffect(() => {
        if (newRowIndex === null) return;
        const row = document.getElementById(`dtype-row-${newRowIndex}`);
        if (row) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const firstControl = document.querySelector(
            `[data-col-select="${newRowIndex}"]`,
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

    const hasEmptyColumns = useMemo(
        () => data.some((row) => !row.column_name || !row.column_name.trim()),
        [data],
    );

    const hasDuplicateColumns = useMemo(
        () => Object.values(columnCounts).some((count) => count > 1),
        [columnCounts],
    );

    const getColumnError = (columnName) => {
        const name = columnName?.trim();
        if (!name) return "Please select a column.";
        if (columnCounts[name] > 1)
            return "This column is selected more than once.";
        return "";
    };

    const isSaveDisabled = hasEmptyColumns || hasDuplicateColumns;

    const handleSave = async () => {
        setSaveAttempted(true);
        if (isSaveDisabled) {
            toast.error(
                hasDuplicateColumns
                    ? "Please remove duplicate column selections before saving."
                    : "Please select a column for every Add Column row.",
                {
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                },
            );
            return;
        }
        try {
            const Data =
                await apiService.matflow.featureEngineering.changeDtype({
                    number_of_columns: data.length,
                    data,
                    file: csvData,
                });

            if (Data?.error) {
                const detail = Data.details?.join("; ") || Data.error;
                toast.error(`Conversion failed: ${detail}`);
                return;
            }

            let fileName = activeCsvFile.name;

            // const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles"));
            // const fileExist = uploadedFiles.filter((val) => val.name === fileName);

            // if (fileExist.length === 0) {
            //   uploadedFiles.push({ name: fileName });
            // }
            // localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));
            await updateDataInIndexedDB(fileName, Data);
            await UpdateFile({
                projectId,
                data: Data,
                filename: fileName.split("/").pop(),
                foldername: activeFolder,
            });

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
                    Change Data Type
                </h2>

                {csvData && columnNames && data.length > 0 && (
                    <>
                        <Grid
                            container
                            spacing={2}
                            alignItems="flex-end"
                            sx={{ mb: 1.5 }}
                        >
                            <Grid item xs={12}>
                                <div className="flex flex-wrap items-center justify-end gap-2">
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
                            </Grid>
                        </Grid>

                        <div className="space-y-2.5">
                            {data.map((val, index) => (
                                <div
                                    id={`dtype-row-${index}`}
                                    key={index}
                                    className="border-b border-gray-100 pb-3 last:border-b-0"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <Typography
                                            sx={{
                                                fontSize: "0.92rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Add Column {index + 1}
                                        </Typography>
                                        <Tooltip
                                            title={
                                                data.length <= 1
                                                    ? "At least one mapping is required"
                                                    : "Remove mapping"
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

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                                Column Name
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
                                                        getColumnError(
                                                            val.column_name,
                                                        ),
                                                    )}
                                                    inputProps={{
                                                        "data-col-select":
                                                            index,
                                                    }}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select column
                                                    </MenuItem>
                                                    {(columnNames || []).map(
                                                        (name) => (
                                                            <MenuItem
                                                                key={name}
                                                                value={name}
                                                            >
                                                                {name}
                                                            </MenuItem>
                                                        ),
                                                    )}
                                                </Select>
                                                {saveAttempted &&
                                                    getColumnError(
                                                        val.column_name,
                                                    ) && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            {getColumnError(
                                                                val.column_name,
                                                            )}
                                                        </p>
                                                    )}
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                                Desired Dtype
                                            </label>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={val.desired_dtype}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e.target.value,
                                                            index,
                                                            "desired_dtype",
                                                        )
                                                    }
                                                    sx={FE_SELECT_SX}
                                                    MenuProps={
                                                        FE_SELECT_MENU_PROPS
                                                    }
                                                >
                                                    <MenuItem value="int">
                                                        int
                                                    </MenuItem>
                                                    <MenuItem value="float">
                                                        float
                                                    </MenuItem>
                                                    <MenuItem value="complex">
                                                        complex
                                                    </MenuItem>
                                                    <MenuItem value="str">
                                                        str
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                                Desired Bit Length
                                            </label>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={
                                                        val.desired_bit_length
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e.target.value,
                                                            index,
                                                            "desired_bit_length",
                                                        )
                                                    }
                                                    sx={FE_SELECT_SX}
                                                    MenuProps={
                                                        FE_SELECT_MENU_PROPS
                                                    }
                                                >
                                                    <MenuItem value="8">
                                                        8
                                                    </MenuItem>
                                                    <MenuItem value="16">
                                                        16
                                                    </MenuItem>
                                                    <MenuItem value="32">
                                                        32
                                                    </MenuItem>
                                                    <MenuItem value="64">
                                                        64
                                                    </MenuItem>
                                                    <MenuItem value="128">
                                                        128
                                                    </MenuItem>
                                                    <MenuItem value="256">
                                                        256
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-4 sticky bottom-0 z-10 border-t border-gray-100 bg-white/95 pt-3">
                    <div className="flex justify-end">
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isSaveDisabled}
                            sx={{
                                backgroundColor: "#0D9488",
                                textTransform: "none",
                                fontWeight: 600,
                                px: 2.5,
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
            <Dialog open={visible} onClose={closeModal} fullWidth maxWidth="md">
                <DialogContent className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
                    <Docs section={"changeDtype"} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ChangeDType;
