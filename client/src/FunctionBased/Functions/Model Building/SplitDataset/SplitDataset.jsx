import styled from '@emotion/styled';
import { Slider, Stack } from '@mui/material';
import { Input, Modal } from '@nextui-org/react';
import SafeCheckbox from '../../../../Components/SafeCheckbox';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAuthHeaders } from '../../../../util/adminAuth';
import { setReRender } from '../../../../Slices/UploadedFileSlice';
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from '../../../../util/indexDB';
import SingleDropDown from '../../../Components/SingleDropDown/SingleDropDown';
import { CreateFile } from '../../../../util/utils';
import Docs from '../../../../Docs/Docs';
import { apiService } from '../../../../services/api/apiService';

function SplitDataset({
  csvData,
  type = 'function',
  initValue = undefined,
  onValueChange = undefined,
}) {
  const columnNames = Object.keys(csvData[0]);
  const [target_variable, setTargetVariable] = useState('');
  const [stratify, setStratify] = useState('');
  const [whatKind, setWhatKind] = useState('');
  const [trainDataName, setTrainDataName] = useState('');
  const [testDataName, setTestDataName] = useState('');
  const [splittedName, setSplittedName] = useState('');
  const [test_size, setTestSize] = useState(0.5);
  const [shuffle, setShuffle] = useState(false);
  const [random_state, setRandomState] = useState(1);
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const render = useSelector((state) => state.uploadedFile.rerender);
  let activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (type === 'node' && initValue) {
      // console.log(initValue);
      setTargetVariable(initValue.target_variable || '');
      setStratify(initValue.stratify || '');
      setTestSize(initValue.test_size || 0.5);
      setRandomState(initValue.random_state || 1);
      setShuffle(!!initValue.shuffle);
      setTestDataName(initValue.testDataName);
      setTrainDataName(initValue.trainDataName);
      setSplittedName(initValue.splittedName);
      if (initValue.target_variable) {
        const temp =
          typeof csvData[0][initValue.target_variable] === 'number'
            ? 'Continuous'
            : 'Categorical';
        setWhatKind(temp);
      }
    }
  }, []);

  useEffect(() => {
    if (type === 'node') {
      onValueChange({
        ...initValue,
        target_variable,
        stratify,
        test_size,
        random_state,
        shuffle,
        file: csvData,
        testDataName,
        trainDataName,
        splittedName,
        whatKind,
      });
    }
  }, [
    target_variable,
    stratify,
    test_size,
    random_state,
    shuffle,
    testDataName,
    trainDataName,
    splittedName,
    whatKind,
  ]);

  const handleTargetVariableChange = (e) => {
    setTargetVariable(e);
    let file_name = activeCsvFile.name.split('/').pop();
    if (type === 'node') file_name = initValue.file_name;
    const temp =
      typeof csvData[0][e] === 'number' ? 'Continuous' : 'Categorical';
    setWhatKind(temp);
    const fn = file_name.split('.')[0];
    setTestDataName(
      fn + '_' + Object.keys(csvData[0]).filter((val) => val === e)[0]
    );
    setTrainDataName(
      fn + '_' + Object.keys(csvData[0]).filter((val) => val === e)[0]
    );
    setSplittedName(
      fn + '_' + Object.keys(csvData[0]).filter((val) => val === e)[0]
    );
  };

  // useEffect(() => {
  //   let file_name = activeCsvFile.name;
  //   if (type === "node") file_name = initValue.file_name;
  //   if (target_variable) {
  //     const temp =
  //       typeof csvData[0][target_variable] === "number"
  //         ? "Continuous"
  //         : "Categorical";
  //     setWhatKind(temp);
  //     setTestDataName(
  //       file_name +
  //         "_" +
  //         Object.keys(csvData[0]).filter((val) => val === target_variable)[0]
  //     );
  //     setTrainDataName(
  //       file_name +
  //         "_" +
  //         Object.keys(csvData[0]).filter((val) => val === target_variable)[0]
  //     );
  //     setSplittedName(
  //       file_name +
  //         "_" +
  //         Object.keys(csvData[0]).filter((val) => val === target_variable)[0]
  //     );
  //   }
  // }, [target_variable, csvData, activeCsvFile]);

  const handleSave = async () => {
    try {
      if (!trainDataName || !testDataName)
        throw new Error('Dataset name field cannot be empty');

      if (stratify && stratify !== '-' && !shuffle) {
        throw new Error(
          'Stratified sampling requires shuffle=true. Please enable shuffling.'
        );
      }

      const data = await apiService.matflow.ml.splitDataset({
        target_variable,
        stratify,
        test_size,
        random_state,
        shuffle,
        file: csvData,
      });

      // Handle response - check if it's an error
      if (data.error) {
        let userMessage = data.error || 'Server error occurred';
        const errorMsg = (data.error || '').toLowerCase();
        
        if (errorMsg.includes('least populated class in y has only 1 member')) {
          userMessage =
            'Stratification error: Your selected stratify column contains values that appear only once in the dataset. Choose a different column or disable stratification.';
        } else if (
          errorMsg.includes(
            'Stratified train/test split is not implemented for shuffle=False'
          )
        ) {
          userMessage =
            'Stratification requires shuffle=true. Please enable the shuffle option to use stratification.';
        } else if (errorMsg.includes('error during train_test_split')) {
          userMessage = data.error.replace(
            'Error during train_test_split: ',
            ''
          );
        }

        throw new Error(userMessage);
      }

      // Process the data if needed
      let processedData = data;
      if (typeof data === 'string') {
        processedData = JSON.parse(data.replace(/\bNaN\b/g, 'null'));
      } else {
        // Convert NaN to null if present
        const dataStr = JSON.stringify(data).replace(/\bNaN\b/g, 'null');
        processedData = JSON.parse(dataStr);
      }
      
      const finalData = processedData;

      const tempTrainName = 'train_' + trainDataName;
      const tempTestName = 'test_' + testDataName;

      if (!projectId) {
        toast.error('Project context missing. Cannot save split files.');
        return;
      }

      await CreateFile({
        projectId,
        data: finalData.test,
        filename: tempTestName,
        foldername: activeFolder || '',
      });

      await CreateFile({
        projectId,
        data: finalData.train,
        filename: tempTrainName,
        foldername: activeFolder || '',
      });

      const datasetName = await fetchDataFromIndexedDB('splitted_dataset');

      datasetName.forEach((val) => {
        if (Object.keys(val)[0] === splittedName)
          throw new Error('Dataset Name already exist.');
      });

      await updateDataInIndexedDB('splitted_dataset', [
        ...datasetName,
        {
          [splittedName]: [
            whatKind,
            tempTrainName,
            tempTestName,
            target_variable,
            activeCsvFile.name,
            activeFolder,
          ],
        },
      ]);

      dispatch(setReRender(!render));
      toast.success('Dataset Splitted Successfully!', {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Emit event to trigger stage completion and auto-redirect
      window.dispatchEvent(new CustomEvent('stageComplete', {
        detail: { stage: 'split' }
      }));
    } catch (error) {
      toast.error(JSON.stringify(error.message), {
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
    <div className="mt-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="flex items-center gap-1 min-h-[20px] text-sm font-medium text-gray-700 mb-1.5 whitespace-nowrap">
            <span>Target Variable</span>
            {whatKind && (
              <span className="font-semibold text-[#0D9488] text-xs">
                ({whatKind})
              </span>
            )}
          </label>
          <SingleDropDown
            columnNames={columnNames}
            onValueChange={handleTargetVariableChange}
            initValue={target_variable}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Stratify
          </label>
          <SingleDropDown
            columnNames={['-', ...columnNames]}
            onValueChange={setStratify}
            initValue={stratify}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Test Size
          </label>
          <Input
            required
            label=""
            size="md"
            bordered
            type="number"
            step={0.01}
            value={test_size}
            onChange={(e) => setTestSize(e.target.value)}
            className="w-full"
            aria-label="Test size (fraction of dataset for test set)"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Random State
          </label>
          <Stack
            spacing={2}
            direction="row"
            sx={{ mb: 1 }}
            alignItems="center"
          >
            <span className="text-xs text-gray-600 w-6">0</span>
            <PrettoSlider
              aria-label="Random State Slider"
              min={0}
              max={1000}
              step={1}
              value={random_state}
              onChange={(e) => setRandomState(e.target.value)}
              valueLabelDisplay="on"
            />
            <span className="text-xs text-gray-600 w-12">1000</span>
          </Stack>
        </div>
        <div className="md:col-span-2 flex items-end">
          <SafeCheckbox
            size={type === 'node' ? 'sm' : 'md'}
            isSelected={shuffle}
            onChange={(e) => setShuffle(e.valueOf())}
            aria-label="Shuffle dataset before split"
          >
            <span className="text-sm font-medium text-gray-700">Shuffle</span>
          </SafeCheckbox>
        </div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${type === 'node' && 'flex-col'}`}>
        <div className="pl-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Train Data Name
          </label>
          <Input
            required
            label=""
            bordered
            size="md"
            placeholder="train_"
            value={trainDataName}
            onChange={(e) => setTrainDataName(e.target.value)}
            className="w-full"
            aria-label="Train data filename"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Test Data Name
          </label>
          <Input
            required
            label=""
            bordered
            size="md"
            placeholder="test_"
            value={testDataName}
            onChange={(e) => setTestDataName(e.target.value)}
            className="w-full"
            aria-label="Test data filename"
          />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Splitted Dataset Name
            </label>
            <Input
              required
              label=""
              bordered
              size="md"
              value={splittedName}
              onChange={(e) => setSplittedName(e.target.value)}
              className="w-full"
              aria-label="Splitted dataset name"
            />
          </div>
          {type === 'function' && (
            <button
              className="px-6 py-2 text-sm font-medium rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors whitespace-nowrap"
              onClick={handleSave}
            >
              Submit
            </button>
          )}
        </div>
      </div>

      {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-[#0D9488] hover:bg-[#0F766E] text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg transition-all flex items-center justify-center"
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
          <Docs section={'splitDataset'} />
        </div>
      </Modal>
    </div>
  );
}

export default SplitDataset;

const PrettoSlider = styled(Slider)({
  color: '#0D9488',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 22,
    width: 22,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: '#0D9488',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(90deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -0%) rotate(135deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(-135deg)',
    },
  },
});
