import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import {
    CreateFile,
    ReadFile,
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

function AppendDataset({ csvData }) {
    const { projectId } = useParams();
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
    const [loading, setLoading] = useState(false);
    const [lessThanTwo, setLessThanTwo] = useState(true);
    const [availableDatasets, setAvailableDatasets] = useState();
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [anotherCsvData, setAnotherCsvData] = useState();
    const [new_dataset_name, setNewDatasetName] = useState("");
    const render = useSelector((state) => state.uploadedFile.rerender);
    const dispatch = useDispatch();
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );

    useEffect(() => {
        // Fetch the list of files from the backend when the component mounts
        const fetchFileNames = async () => {
            try {
                const data =
                    await apiService.matflow.dataset.getAllFiles(projectId);
                const files = getAllFiles(data);
                setAvailableDatasets(files);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load files.");
                // setError(err.message);
            }
        };

        fetchFileNames();
    }, []);

    const getAllFiles = (structure, parentPath = "") => {
        let files = [];
        for (const key in structure) {
            if (key === "files") {
                files = files.concat(
                    structure[key].map((file) =>
                        parentPath ? `${parentPath}/${file}` : file,
                    ),
                );
            } else {
                const subFiles = getAllFiles(
                    structure[key],
                    parentPath ? `${parentPath}/${key}` : key,
                );
                files = files.concat(subFiles);
            }
        }
        return files;
    };

    const handleChange = async (val) => {
        if (!val) return;
        const splittedFolder = val.split("/");
        const foldername = splittedFolder
            .slice(0, splittedFolder.length - 1)
            .join("/");

        const data = await ReadFile({
            projectId,
            foldername,
            filename: splittedFolder[splittedFolder.length - 1],
        });
        setAnotherCsvData(data);
    };

    const handleSave = async () => {
        try {
            let Data =
                await apiService.matflow.featureEngineering.appendDataset({
                    file: csvData,
                    file2: anotherCsvData,
                });
            if (typeof Data === "string") {
                Data = JSON.parse(Data);
            }
            let fileName = new_dataset_name;

            await CreateFile({
                projectId,
                data: Data,
                filename: fileName,
                foldername: getNewDatasetFolder(
                    activeFolder,
                    "generated_datasets",
                    activeCsvFile?.name,
                ),
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
                <h2 className={FE_SECTION_TITLE_CLASS}>Append Dataset</h2>

                <div className="space-y-3">
                    <div className="w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
                        <label className={FE_SUB_LABEL_CLASS}>
                            Select Dataset to Append
                        </label>
                        <Autocomplete
                            size="small"
                            options={availableDatasets || []}
                            value={selectedDataset}
                            onChange={(_, val) => {
                                setSelectedDataset(val);
                                handleChange(val);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select dataset"
                                />
                            )}
                        />
                    </div>

                    {anotherCsvData && (
                        <div className={FE_ACTION_ROW_CLASS}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                    <label className={FE_LABEL_CLASS}>
                                        New Dataset Name
                                    </label>
                                    <TextField
                                        fullWidth
                                        value={new_dataset_name}
                                        onChange={(e) =>
                                            setNewDatasetName(e.target.value)
                                        }
                                        size="small"
                                        placeholder="Enter dataset name"
                                    />
                                </div>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    sx={{
                                        backgroundColor: "#0D9488",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        minHeight: 40,
                                        "&:hover": {
                                            backgroundColor: "#0F766E",
                                        },
                                    }}
                                >
                                    Append Datasets
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AppendDataset;
