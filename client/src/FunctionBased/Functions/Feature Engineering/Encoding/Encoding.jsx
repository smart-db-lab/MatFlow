import { Modal } from "../muiCompat";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { UpdateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
    FE_ACTION_ROW_CLASS,
    FE_CARD_CLASS,
    FE_LABEL_CLASS,
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
    FE_AUTOCOMPLETE_SX,
} from "../feUi";

const Method = ["Ordinal Encoding", "One-Hot Encoding", "Target Encoding"];

function Encoding({
    csvData,
    type = "function",
    onValueChange = undefined,
    initValue = undefined,
}) {
    const allStringColumn = Object.keys(csvData[0]).filter(
        (val) => typeof csvData[0][val] === "string",
    );
    const allNumberColumn = Object.keys(csvData[0]).filter(
        (val) => typeof csvData[0][val] === "number",
    );
    const [stringColumn, setStringColumn] = useState(allStringColumn[0]);
    const [method, setMethod] = useState(Method[0]);
    let temp = csvData.map((val) => val[stringColumn]);
    temp = new Set(temp);
    temp = [...temp];
    const [stringValues, setStringValues] = useState(temp);
    const [data, setData] = useState({});
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const render = useSelector((state) => state.uploadedFile.rerender);
    const { projectId } = useParams();
    const dispatch = useDispatch();

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        if (type === "node" && initValue) {
            setStringColumn(initValue.select_column || allStringColumn[0]);
            setMethod(initValue.method || Method[0]);
            setData(initValue.data || {});
        }
    }, []);

    useEffect(() => {
        if (type === "node") {
            onValueChange({
                select_column: stringColumn,
                method,
                data,
            });
        }
    }, [stringColumn, method, data]);

    const handleSave = async () => {
        try {
            const Data = await apiService.matflow.featureEngineering.encoding({
                select_column: stringColumn,
                method,
                data,
                file: csvData,
            });

            let fileName = activeCsvFile.name;

            // const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles"));
            // const fileExist = uploadedFiles.filter((val) => val.name === fileName);

            // if (fileExist.length === 0) {
            //   uploadedFiles.push({ name: fileName });
            // }
            // localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));

            const temp = await fetchDataFromIndexedDB(fileName);
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
        <>
            <div className="w-full pt-1 pb-3">
                <div className={FE_CARD_CLASS}>
                    <h2 className={FE_SECTION_TITLE_CLASS}>
                        Encoding Settings
                    </h2>

                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                <label className={FE_LABEL_CLASS}>
                                    Select Column
                                </label>
                                <Autocomplete
                                    size="small"
                                    options={allStringColumn}
                                    value={stringColumn || null}
                                    onChange={(_, selected) => {
                                        if (!selected) return;
                                        setStringColumn(selected);
                                        if (method === Method[0]) {
                                            let temp = csvData.map(
                                                (val) => val[selected],
                                            );
                                            temp = new Set(temp);
                                            temp = [...temp];
                                            setStringValues(temp);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select column"
                                        />
                                    )}
                                    sx={FE_AUTOCOMPLETE_SX}
                                />
                            </div>

                            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                <label className={FE_LABEL_CLASS}>
                                    Select Method
                                </label>
                                <Autocomplete
                                    size="small"
                                    options={Method}
                                    value={method || null}
                                    onChange={(_, val) => {
                                        if (!val) return;
                                        setMethod(val);
                                        setData({});
                                        if (val === Method[0]) {
                                            let temp = csvData.map(
                                                (row) => row[stringColumn],
                                            );
                                            temp = new Set(temp);
                                            temp = [...temp];
                                            setStringValues(temp);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select method"
                                        />
                                    )}
                                    sx={FE_AUTOCOMPLETE_SX}
                                />
                            </div>
                        </div>

                        {method === "Ordinal Encoding" && (
                            <div className="pt-3 border-t border-gray-300">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                                    <div className="flex-shrink-0">
                                        <label className={FE_LABEL_CLASS}>
                                            Options
                                        </label>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={Boolean(
                                                            data.start_from_0,
                                                        )}
                                                        onChange={(e) =>
                                                            setData({
                                                                ...data,
                                                                start_from_0:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                    />
                                                }
                                                label={
                                                    <span className="text-sm text-gray-700">
                                                        Start from 0
                                                    </span>
                                                }
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={Boolean(
                                                            data.include_nan,
                                                        )}
                                                        onChange={(e) =>
                                                            setData({
                                                                ...data,
                                                                include_nan:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                    />
                                                }
                                                label={
                                                    <span className="text-sm text-gray-700">
                                                        Include NaN
                                                    </span>
                                                }
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={Boolean(
                                                            data.sort_values,
                                                        )}
                                                        onChange={(e) =>
                                                            setData({
                                                                ...data,
                                                                sort_values:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                    />
                                                }
                                                label={
                                                    <span className="text-sm text-gray-700">
                                                        Sort Values
                                                    </span>
                                                }
                                            />
                                        </div>
                                    </div>
                                    {stringValues && (
                                        <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
                                            <label
                                                className={FE_SUB_LABEL_CLASS}
                                            >
                                                Set Value Order
                                            </label>
                                            <Autocomplete
                                                multiple
                                                size="small"
                                                options={stringValues}
                                                value={
                                                    data.set_value_order || []
                                                }
                                                onChange={(_, val) =>
                                                    setData({
                                                        ...data,
                                                        set_value_order: val,
                                                    })
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Set order"
                                                    />
                                                )}
                                                sx={FE_AUTOCOMPLETE_SX}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {method === "One-Hot Encoding" && (
                            <div className="pt-3 border-t border-gray-200">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={Boolean(data.drop_first)}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    drop_first:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                    }
                                    label={
                                        <span className="text-sm text-gray-700">
                                            Drop First
                                        </span>
                                    }
                                />
                            </div>
                        )}

                        {method === "Target Encoding" && (
                            <div className="pt-3 border-t border-gray-200">
                                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Select Target
                                    </label>
                                    <Autocomplete
                                        size="small"
                                        options={allNumberColumn}
                                        value={data.select_target || null}
                                        onChange={(_, val) =>
                                            setData({
                                                ...data,
                                                select_target: val,
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select target"
                                            />
                                        )}
                                        sx={FE_AUTOCOMPLETE_SX}
                                    />
                                </div>
                            </div>
                        )}

                        {type === "function" && (
                            <div className={FE_ACTION_ROW_CLASS}>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    sx={{
                                        backgroundColor: "#0D9488",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        "&:hover": {
                                            backgroundColor: "#0F766E",
                                        },
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}
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
                    <Docs section={"encoding"} />
                </div>
            </Modal>
        </>
    );
}

export default Encoding;
