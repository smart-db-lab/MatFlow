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
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
    FE_ACTION_ROW_CLASS,
    FE_CARD_CLASS,
    FE_LABEL_CLASS,
    FE_SECTION_TITLE_CLASS,
    FE_SELECT_MENU_PROPS,
    FE_SELECT_SX,
    FE_SUB_LABEL_CLASS,
} from "../feUi";

function Scaling({
    csvData,
    type = "function",
    onValueChange = undefined,
    initValue = undefined,
}) {
    const allColumns = Object.keys(csvData[0]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [option, setOption] = useState("Select Columns");
    const [defaultValue, setDefaultValue] = useState("Blank");
    const [method, setMethod] = useState("Min-Max Scaler");
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
            setOption(initValue.options || "Select Columns");
            setMethod(initValue.method || "Min-Max Scaler");
            setDefaultValue(initValue.default_value || "Blank");
            setSelectedColumns(initValue.select_column || []);
        }
    }, []);

    useEffect(() => {
        if (type === "node") {
            onValueChange((prev) => ({
                ...prev,
                options: option,
                method,
                default_value: defaultValue,
                select_column: selectedColumns,
            }));
        }
    }, [option, method, defaultValue, selectedColumns]);

    const handleDefaultValue = (e) => {
        setDefaultValue(e);
        if (e === "Blank") setSelectedColumns([]);
        if (e === "All") setSelectedColumns(Object.keys(csvData[0]));
        if (e === "Numerical")
            setSelectedColumns(
                Object.keys(csvData[0]).filter(
                    (val) => typeof csvData[0][val] === "number",
                ),
            );
        if (e === "Categorical")
            setSelectedColumns(
                Object.keys(csvData[0]).filter(
                    (val) => typeof csvData[0][val] === "string",
                ),
            );
    };

    const handleSave = async () => {
        try {
            const Data = await apiService.matflow.featureEngineering.scaling({
                options: option,
                method,
                default_value: defaultValue,
                select_column: selectedColumns,
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
        <div className="w-full pt-1 pb-3">
            <div className={FE_CARD_CLASS}>
                <h2 className={FE_SECTION_TITLE_CLASS}>Scaling Settings</h2>

                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[250px]">
                            <label className={FE_LABEL_CLASS}>Options</label>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={option}
                                    onChange={(e) => setOption(e.target.value)}
                                    sx={FE_SELECT_SX}
                                    MenuProps={FE_SELECT_MENU_PROPS}
                                >
                                    <MenuItem value="Select Columns">
                                        Select Columns
                                    </MenuItem>
                                    <MenuItem value="Select All Except">
                                        Select All Except
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                            <label className={FE_LABEL_CLASS}>Method</label>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    sx={FE_SELECT_SX}
                                    MenuProps={FE_SELECT_MENU_PROPS}
                                >
                                    <MenuItem value="Min-Max Scaler">
                                        Min-Max Scaler
                                    </MenuItem>
                                    <MenuItem value="Standard Scaler">
                                        Standard Scaler
                                    </MenuItem>
                                    <MenuItem value="Robust Scaler">
                                        Robust Scaler
                                    </MenuItem>
                                    <MenuItem value="MaxAbs Scaler">
                                        MaxAbs Scaler
                                    </MenuItem>
                                    <MenuItem value="Quantile Transformer">
                                        Quantile Transformer
                                    </MenuItem>
                                    <MenuItem value="Power Transformer">
                                        Power Transformer
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                        <div className="flex-shrink-0">
                            <label className={FE_SUB_LABEL_CLASS}>
                                Default Value
                            </label>
                            <RadioGroup
                                row
                                value={defaultValue}
                                onChange={(e) =>
                                    handleDefaultValue(e.target.value)
                                }
                            >
                                <FormControlLabel
                                    value="Blank"
                                    control={<Radio size="small" />}
                                    label="Blank"
                                />
                                <FormControlLabel
                                    value="All"
                                    control={<Radio size="small" />}
                                    label="All"
                                />
                                <FormControlLabel
                                    value="Numerical"
                                    control={<Radio size="small" />}
                                    label="Numerical"
                                />
                                <FormControlLabel
                                    value="Categorical"
                                    control={<Radio size="small" />}
                                    label="Categorical"
                                />
                            </RadioGroup>
                        </div>

                        <div className="flex-1 w-full lg:w-auto lg:min-w-[400px] lg:max-w-[700px]">
                            <label className={FE_SUB_LABEL_CLASS}>
                                {option}
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
                    <Docs section={"scaling"} />
                </div>
            </Modal>
        </div>
    );
}

export default Scaling;
