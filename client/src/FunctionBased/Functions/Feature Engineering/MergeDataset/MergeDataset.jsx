import { Modal } from "../muiCompat";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
    CreateFile,
    ReadFile,
    getNewDatasetFolder,
} from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";
import { apiService } from "../../../../services/api/apiService";
import {
    FE_ACTION_ROW_CLASS,
    FE_CARD_CLASS,
    FE_LABEL_CLASS,
    FE_SECTION_TITLE_CLASS,
    FE_SUB_LABEL_CLASS,
} from "../feUi";

const HOW = ["left", "right", "outer", "inner", "cross"];

function MergeDataset({ csvData }) {
    const { projectId } = useParams();
    const leftDataframe = Object.keys(csvData[0]);
    const [rightDataframe, setRightDataframe] = useState([]);
    const [anotherCsvData, setAnotherCsvData] = useState();
    const [new_dataset_name, setNewDatasetName] = useState("");
    const [how, setHow] = useState();
    const [leftDataframeValue, setLeftDataframeValue] = useState();
    const [rightDataframeValue, setRightDataframeValue] = useState();
    const [secondDatasetName, setSecondDatasetName] = useState("");
    const dispatch = useDispatch();
    const render = useSelector((state) => state.uploadedFile.rerender);
    const [fileNames, setFileNames] = useState([]);
    const activeFolder = useSelector(
        (state) => state.uploadedFile.activeFolder,
    );

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        // Fetch the list of files from the backend when the component mounts
        const fetchFileNames = async () => {
            try {
                const data =
                    await apiService.matflow.dataset.getAllFiles(projectId);
                const files = getAllFiles(data);
                setFileNames(files);
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

    const handleSave = async () => {
        try {
            const response =
                await apiService.matflow.featureEngineering.mergeDataset({
                    how,
                    left_dataframe: leftDataframeValue,
                    right_dataframe: rightDataframeValue,
                    file: csvData,
                    file2: anotherCsvData,
                });
            let Data =
                typeof response === "string" ? JSON.parse(response) : response;

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

            setAnotherCsvData();
            setRightDataframe([]);
            setRightDataframeValue();
            setSecondDatasetName("");
        } catch (error) {
            toast.error("Operation failed.");
        }
    };

    const handleDatasetMerge = async (val) => {
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

        setRightDataframe(Object.keys(data[0]));
        setAnotherCsvData(data);
        setSecondDatasetName(val);
    };

    return (
        <div className="w-full pt-1 pb-3">
            <div className={FE_CARD_CLASS}>
                <h2 className={FE_SECTION_TITLE_CLASS}>Merge Dataset</h2>

                <div className="space-y-3">
                    <div className="w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
                        <label className={FE_SUB_LABEL_CLASS}>
                            Select Dataset to Merge
                        </label>
                        <Autocomplete
                            size="small"
                            options={fileNames}
                            value={secondDatasetName || null}
                            onChange={(_, val) => handleDatasetMerge(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select dataset"
                                />
                            )}
                        />
                    </div>

                    {secondDatasetName && (
                        <div className="pt-3 border-t border-gray-200 space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px]">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Join Type
                                    </label>
                                    <Autocomplete
                                        size="small"
                                        options={HOW}
                                        value={how || null}
                                        onChange={(_, val) => setHow(val)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select join type"
                                            />
                                        )}
                                    />
                                </div>

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
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Left Key Column
                                    </label>
                                    <Autocomplete
                                        size="small"
                                        options={leftDataframe}
                                        value={leftDataframeValue || null}
                                        onChange={(_, val) =>
                                            setLeftDataframeValue(val)
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select left key"
                                            />
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                                    <label className={FE_SUB_LABEL_CLASS}>
                                        Right Key Column
                                    </label>
                                    <Autocomplete
                                        size="small"
                                        options={rightDataframe}
                                        value={rightDataframeValue || null}
                                        onChange={(_, val) =>
                                            setRightDataframeValue(val)
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select right key"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

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
                                    Merge Datasets
                                </Button>
                            </div>
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
                    <Docs section={"mergeDataset"} />
                </div>
            </Modal>
        </div>
    );
}

export default MergeDataset;
