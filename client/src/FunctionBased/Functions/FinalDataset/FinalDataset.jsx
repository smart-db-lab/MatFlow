import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AgGridAutoDataComponent from "../../Components/AgGridComponent/AgGridAutoDataComponent";
import { FetchFileNames } from "../../../util/utils";
import { handleApiError } from "../../../util/util";
import { apiService } from "../../../services/api/apiService";

function FinalDataset() {
  const { projectId } = useParams();
  const [fileNames, setFileNames] = useState([]);
  const [fileData, setFileData] = useState({}); // Stores data for each file
  const [error, setError] = useState(null); // Stores any fetch errors
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    // Fetch the list of files from the backend when the component mounts
    const fetchFileNames = async () => {
      try {
        const files = await FetchFileNames({ projectId });
        setFileNames(files);
      } catch (err) {
        console.error(err);
        handleApiError(err, 'fetching file names');
        setError(err.message);
      }
    };
    fetchFileNames();
  }, []);

  const loadFileData = async (fileIndex) => {
    const filePath = fileNames[fileIndex];
    if (!filePath || fileData[fileIndex]) return;

    try {
      // Split the filePath to get folder and file names
      const pathParts = filePath.split("/");
      const file = pathParts.pop();
      const folder = pathParts.length ? pathParts.join("/") : "";

      // Fetch the file data from the backend
      const data = await apiService.matflow.dataset.readFile(projectId, folder, file);

      // Update fileData state with the fetched data
      setFileData((prevData) => ({
        ...prevData,
        [fileIndex]: data,
      }));
    } catch (err) {
      console.error(err);
      handleApiError(err, `fetching file data for ${filePath}`);
      setError(err.message);
    }
  };

  const handleAccordionToggle = async (index) => {
    const nextIndex = openIndex === index ? null : index;
    setOpenIndex(nextIndex);
    if (nextIndex !== null) {
      await loadFileData(nextIndex);
    }
  };

  return (
    <div className="w-full py-3">
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}
      {fileNames && fileNames.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Final Datasets</h2>
          <div className="space-y-2">
            {fileNames.map((filePath, index) => {
              const isOpen = openIndex === index;
              const fileName = filePath.split("/").pop();
              const folderPath = filePath.includes("/")
                ? filePath.split("/").slice(0, -1).join("/") || "Root"
                : "";

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden transition-colors hover:border-[#0D9488]/30"
                >
                  <button
                    type="button"
                    onClick={() => handleAccordionToggle(index)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{fileName}</h3>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200 px-4 py-3">
                      {folderPath && (
                        <p className="text-xs text-gray-500 mb-3">Path: {folderPath}</p>
                      )}
                      {fileData[index] ? (
                        <div className="w-full">
                          <AgGridAutoDataComponent
                            download={true}
                            rowData={fileData[index]}
                            height="600px"
                            themeVariant="dataset"
                            flatContainer={true}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center min-h-[220px]">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#0D9488] mb-2"></div>
                            <p className="text-sm text-gray-600">Loading data...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalDataset;
