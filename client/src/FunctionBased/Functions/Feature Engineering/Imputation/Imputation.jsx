import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setSaveAsNew } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
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
    FE_AUTOCOMPLETE_SX,
    FE_TEXTFIELD_SX,
} from "../feUi";

function Imputation({
    csvData,
    type = "function",
    initValue = undefined,
    onValueChange = undefined,
}) {
    const { projectId } = useParams();
    const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
    const [dataset_name, setDatasetName] = useState("");
    const dispatch = useDispatch();
    const [imputationNotExist, setImputationNotExist] = useState(true);
    const [nullVar, setNullVar] = useState([]);
    const [select_column, setSelectColumn] = useState();
    const [group_by, setGroupBy] = useState([]);
    const [strategy, setStrategy] = useState([]);
    const [activeStrategy, setActiveStrategy] = useState();
    const [mode, setMode] = useState("Select Mode");
    const [modeData, setModeData] = useState([]);
    const [optionValue, setOptionValue] = useState();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );
    const [constant, setConstant] = useState();
    const [fill_group, setFillGroup] = useState();
    const render = useSelector((state) => state.uploadedFile.rerender);

    useEffect(() => {
        if (type === "node" && initValue) {
            setGroupBy(initValue.group_by || []);
            setModeData(initValue.modeData || []);

            setConstant(initValue.constant || []);
            setFillGroup(initValue.fill_group);
            setActiveStrategy(initValue.activeStrategy);
            setSelectColumn(initValue.select_column);
            if (typeof csvData[0][initValue.select_column] === "number")
                setStrategy(["mean", "median", "constant"]);
            else setStrategy(["mode", "value"]);
        }
    }, []);

    useEffect(() => {
        if (type === "node") {
            onValueChange({
                group_by,
                modeData,
                activeStrategy,
                constant,
                fill_group,
                select_column,
                strategy,
            });
        }
    }, [
        group_by,
        modeData,
        activeStrategy,
        constant,
        fill_group,
        select_column,
        strategy,
    ]);

    useEffect(() => {
        setImputationNotExist(true);
        setNullVar([]);
        setStrategy(null);
        // setActiveStrategy();

        const fetchData = async () => {
            const data =
                await apiService.matflow.featureEngineering.imputationData1({
                    file: csvData,
                });

            if (
                (!data.null_var || data.null_var.length === 0) &&
                type === "function"
            )
                setImputationNotExist(true);
            else setImputationNotExist(false);
            setNullVar(data.null_var);

            if (select_column) {
                if (typeof csvData[0][select_column] === "number")
                    setStrategy(["mean", "median", "constant"]);
                else setStrategy(["mode", "value"]);
            }
        };
        fetchData();
    }, [csvData, select_column]);

    const handleSave = async () => {
        const response =
            await apiService.matflow.featureEngineering.imputationResult({
                file: csvData,
                Select_columns: select_column,
                strategy:
                    activeStrategy === "mode" ? "constant" : activeStrategy,
                fill_group,
                constant,
            });

        let Data = response.dataset || response;

        let fileName = activeCsvFile.name;

        if (savedAsNewDataset) {
            fileName = dataset_name;
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
            // Clear cache metadata to force fresh fetch from server on next render
            const cacheMetaKey = `dataset_cache_meta:${projectId}:${fileName}`;
            sessionStorage.removeItem(cacheMetaKey);
        }

        toast.success("File saved successfully.");
        dispatch(setReRender(!render));
    };

    async function handleSelectColumn(e) {
        if (typeof csvData[0][e] === "number")
            setStrategy(["mean", "median", "constant"]);
        else setStrategy(["mode", "value"]);
        setSelectColumn(e);

        const data =
            await apiService.matflow.featureEngineering.imputationData2({
                file: csvData,
                Select_columns: e,
            });

        setGroupBy(data.group_by);
        if (data.mode) setModeData(Object.values(data.mode));
    }

    if (imputationNotExist)
        return (
            <div className="w-full pt-1 pb-3">
                <div className={FE_CARD_CLASS}>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800">
                            No missing values were found in this dataset.
                            Imputation is not applicable.
                        </p>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="w-full pt-1 pb-3">
            <div className={FE_CARD_CLASS}>
                <h2 className={FE_SECTION_TITLE_CLASS}>Imputation Settings</h2>

                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                            <label className={FE_LABEL_CLASS}>
                                Select Columns
                            </label>
                            <Autocomplete
                                size="small"
                                options={nullVar || []}
                                value={select_column || null}
                                onChange={(_, e) => handleSelectColumn(e)}
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
                            <label className={FE_LABEL_CLASS}>Strategy</label>
                            <Autocomplete
                                size="small"
                                options={strategy || []}
                                value={activeStrategy || null}
                                onChange={(_, e) => {
                                    setActiveStrategy(e);
                                    setConstant();
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select strategy"
                                    />
                                )}
                                sx={FE_AUTOCOMPLETE_SX}
                            />
                        </div>
                    </div>

                    {activeStrategy && strategy && strategy[0] === "mean" && (
                        <div className="pt-3 border-t border-gray-300">
                            {activeStrategy === "constant" ? (
                                <div className="w-full max-w-md">
                                    <label className={FE_LABEL_CLASS}>
                                        Value
                                    </label>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        inputProps={{ step: 0.01 }}
                                        value={constant || 0}
                                        onChange={(e) =>
                                            setConstant(e.target.value)
                                        }
                                        size="small"
                                        placeholder="Enter value"
                                        sx={FE_TEXTFIELD_SX}
                                    />
                                </div>
                            ) : (
                                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Group By
                                    </label>
                                    <Autocomplete
                                        size="small"
                                        options={group_by || []}
                                        value={fill_group || null}
                                        onChange={(_, val) => setFillGroup(val)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Group by"
                                            />
                                        )}
                                        sx={FE_AUTOCOMPLETE_SX}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeStrategy && strategy && strategy[0] === "mode" && (
                        <div className="pt-3 border-t border-gray-200">
                            {activeStrategy === "value" ? (
                                <div className="w-full max-w-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Value
                                    </label>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        inputProps={{ step: 0.01 }}
                                        value={constant || 0}
                                        onChange={(e) =>
                                            setConstant(e.target.value)
                                        }
                                        size="small"
                                        placeholder="Enter value"
                                        sx={FE_TEXTFIELD_SX}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[250px]">
                                        <label className={FE_SUB_LABEL_CLASS}>
                                            Options
                                        </label>
                                        <Autocomplete
                                            size="small"
                                            options={[
                                                "Select Mode",
                                                "Group Mode",
                                            ]}
                                            value={mode || null}
                                            onChange={(_, e) => {
                                                setMode(e);
                                                setOptionValue("");
                                                setConstant();
                                                setFillGroup();
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select option"
                                                />
                                            )}
                                            sx={FE_AUTOCOMPLETE_SX}
                                        />
                                    </div>
                                    {mode === "Group Mode" && (
                                        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                            <label
                                                className={FE_SUB_LABEL_CLASS}
                                            >
                                                Group By
                                            </label>
                                            <Autocomplete
                                                size="small"
                                                options={group_by || []}
                                                value={optionValue || null}
                                                onChange={(_, val) =>
                                                    setFillGroup(val)
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Group by"
                                                    />
                                                )}
                                                sx={FE_AUTOCOMPLETE_SX}
                                            />
                                        </div>
                                    )}
                                    {mode === "Select Mode" && (
                                        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                            <label
                                                className={FE_SUB_LABEL_CLASS}
                                            >
                                                Mode Value
                                            </label>
                                            <Autocomplete
                                                size="small"
                                                options={modeData || []}
                                                value={optionValue || null}
                                                onChange={(_, val) =>
                                                    setConstant(val)
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Mode value"
                                                    />
                                                )}
                                                sx={FE_AUTOCOMPLETE_SX}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

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
                                                value={dataset_name}
                                                onChange={(e) => {
                                                    setDatasetName(
                                                        e.target.value,
                                                    );
                                                }}
                                                size="small"
                                                placeholder="Enter dataset name"
                                                sx={FE_TEXTFIELD_SX}
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

export default Imputation;
