import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import AgGridComponent from '../../Components/AgGridComponent/AgGridComponent';
import { clearIndexedDB } from '../../../util/indexDB';

const DatasetInformation = ({ csvData }) => {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const previousFile = useSelector((state) => state.uploadedFile.previousFile);
  const [isDataCleared, setIsDataCleared] = useState(false);
  const datasetName = useMemo(() => {
    const rawName = String(activeCsvFile?.name || "").split("/").pop();
    return rawName || "Selected Dataset";
  }, [activeCsvFile]);

  // Clear cache when file changes
  useEffect(() => {
    const clearCacheForFileChange = async () => {
      if (previousFile && previousFile !== activeCsvFile && activeCsvFile) {
        try {
          await clearIndexedDB(previousFile);
          console.log(`✅ Cache cleared for previous file: ${previousFile}`);
          setIsDataCleared(true);
          // Reset after a brief moment
          setTimeout(() => setIsDataCleared(false), 1000);
        } catch (error) {
          console.warn(`⚠️ Failed to clear cache for ${previousFile}:`, error);
        }
      }
    };

    clearCacheForFileChange();
  }, [activeCsvFile, previousFile]);

  // Force component re-render when active file changes
  useEffect(() => {
    if (activeCsvFile) {
      console.log(`📊 Loading information for: ${activeCsvFile}`);
    }
  }, [activeCsvFile]);

  const handleClearCache = async () => {
    if (activeCsvFile) {
      try {
        await clearIndexedDB(activeCsvFile);
        console.log(`🧹 Manual cache clear for: ${activeCsvFile}`);
        setIsDataCleared(true);
        setTimeout(() => setIsDataCleared(false), 2000);
        // Force page reload to show fresh data
        window.location.reload();
      } catch (error) {
        console.error(`❌ Failed to clear cache manually:`, error);
      }
    }
  };

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-base font-semibold text-gray-900">
          Materials Data Profile - {datasetName}
          {isDataCleared && (
            <span className="ml-2 text-xs text-green-600">
              ✅ Cache cleared
            </span>
          )}
        </h2>
      </div>
      {csvData && csvData.length > 0 && (
        <MyAgGridComponent rowData={csvData} key={activeCsvFile} />
      )}
    </div>
  );
};

const PROFILE_HEADER_LABELS = {
  column: 'Property name',
  uniqueValues: 'Number of Unique Values',
  nonNullCount: 'No of NonNull Values',
  nullPercentage: 'Null Percentage (℅)',
  dtype: 'Data Type',
};

const MyAgGridComponent = ({ rowData }) => {
  const [rangeIndex, setRangeIndex] = useState('');
  const [totalColumns, setTotalColumns] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    if (rowData && rowData.length > 0) {
      const startRowIndex = 0; // Start index assumed to be 1
      const endRowIndex = rowData.length;
      setRangeIndex(`${startRowIndex} - ${endRowIndex}`);

      const columnsCount = Object.keys(rowData[0]).length;
      setTotalColumns(columnsCount);

      // Calculate memory usage assuming each character takes 2 bytes
      const memoryUsageBytes = JSON.stringify(rowData).length * 2;
      const memoryUsageKB = Math.round(memoryUsageBytes / 1024); // Convert to kilobytes
      setMemoryUsage(memoryUsageKB);
    }
  }, [rowData]);

  const data = useMemo(() => {
    const columns = Object.keys(rowData[0] || {});
    const columnInfo = [];

    columns.forEach((column) => {
      const uniqueValues = new Set();
      let nonNullCount = 0;

      if (column !== 'id') {
        rowData.forEach((row) => {
          const value = row[column];
          if (value !== undefined && value !== null) {
            uniqueValues.add(value);
            nonNullCount++;
          }
        });

        const nullCount = rowData.length - nonNullCount;
        const nullPercentage = (nullCount / rowData.length) * 100;
        const dtype = typeof rowData[0][column];

        columnInfo.push({
          column,
          uniqueValues: uniqueValues.size,
          nonNullCount,
          nullPercentage,
          dtype,
        });
      }
    });

    return columnInfo;
  }, [rowData]);

  const columnDefs = useMemo(() => {
    const columns = Object.keys(data[0] || {});
    return columns.map((column) => ({
      headerName: PROFILE_HEADER_LABELS[column] || column,
      field: column,
      filter: true,
      filterParams: {
        suppressAndOrCondition: true, // Optional: Suppress 'and'/'or' filter conditions
        newRowsAction: 'keep', // Optional: Preserve filter when new rows are loaded
      },
      sortable: true,
      flex: 1,
    }));
  }, [data]);

  return (
    <div className="w-full">
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <span className="font-medium text-gray-700">Range Index:</span>{" "}
          <span className="text-gray-600">{rangeIndex}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <span className="font-medium text-gray-700">Total Columns:</span>{" "}
          <span className="text-gray-600">{totalColumns}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <span className="font-medium text-gray-700">Memory Usage:</span>{" "}
          <span className="text-gray-600">{memoryUsage}+ KB</span>
        </div>
      </div>
      <div className="w-full rounded-xl border border-gray-200 bg-white p-2">
        {columnDefs && data && (
          <AgGridComponent rowData={data} columnDefs={columnDefs} />
        )}
      </div>
    </div>
  );
};

export default DatasetInformation;
