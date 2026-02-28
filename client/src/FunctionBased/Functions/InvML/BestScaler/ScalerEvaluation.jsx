/*
   RichScalerPage.jsx  (no file uploads)
   ------------------------------------
   Needs:
     • axios  1.x
     • papaparse 5.x
     • jszip 3.x
*/

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { Modal } from '@nextui-org/react';
import Docs from '../../../../Docs/Docs';
import { apiService } from '../../../../services/api/apiService';

export default function ScalerEvaluationPage({ csvData }) {
  // dataset
  const [rows, setRows] = useState([]);
  const [cols, setCols] = useState([]);
  // ui
  const [target, setTarget] = useState('');
  const [feats, setFeats] = useState([]);
  const [test, setTest] = useState(0.2);
  const [rand, setRand] = useState(42);
  // app state
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  
  // modal state
  const [visible, setVisible] = useState(false);
  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  /* ingest dataset once */
  useEffect(() => {
    if (!csvData) return;
    if (Array.isArray(csvData)) {
      setRows(csvData);
      setCols(Object.keys(csvData[0] || {}));
    } else if (typeof csvData === 'string') {
      const { data } = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      setRows(data);
      setCols(Object.keys(data[0] || {}));
    }
  }, [csvData]);

  /* submit */
  const run = async () => {
    setErr(null);
    if (!rows.length) {
      setErr('No dataset.');
      return;
    }
    if (!target) {
      setErr('Pick target.');
      return;
    }

    setBusy(true);
    try {
      const data = await apiService.matflow.scaler.evaluate({
        dataset: rows,
        target_column: target,
        feature_columns: feats,
        test_size: test,
        random_state: rand,
        return_plot: true,
        return_scaled: true,
        return_csv: true,
      });
      // Guard against error/empty responses (e.g. 401 returning {detail: "..."})
      if (!data || data.detail || !data.best_scaler) {
        throw new Error(data?.detail || 'Unexpected response from server.');
      }
      setRes(data);
    } catch (e) {
      setErr(e?.detail ?? e.response?.data?.detail ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  /* download image function */
  const downloadImage = (base64Data, fileName, format = 'png') => {
    if (!base64Data) return;

    const link = document.createElement('a');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* download all images function */
  const downloadAllImages = async (res) => {
    try {
      const zip = new JSZip();
      const images = [
        { name: 'r2_performance_chart.png', data: res.plots.r2_chart_png },
        { name: 'mse_performance_chart.png', data: res.plots.mse_chart_png },
        { name: 'skew_performance_chart.png', data: res.plots.skew_chart_png },
        { name: 'weighted_rank_chart.png', data: res.plots.weighted_rank_chart_png },
      ];

      let addedCount = 0;
      for (const image of images) {
        if (image.data) {
          zip.file(image.name, image.data, { base64: true });
          addedCount++;
        }
      }

      if (addedCount === 0) {
        alert('No chart images available to download.');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const blob = new Blob([content], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scaler_individual_charts.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error creating zip file. Please try again.');
    }
  };

  /* ui */
  if (!cols.length)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Dataset Available
          </h3>
          <p className="text-gray-500">
            Please upload a dataset to begin scaler evaluation.
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Scaler Evaluation
        </h1>
        <p className="mt-1 text-xs md:text-sm text-gray-600">
          Compare scaling methods using RF, DT, XGBoost, and CatBoost models
          with weighted ranking.
        </p>
      </div>
      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
        {' '}
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-gray-900">
              Target Column
            </label>{' '}
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
            >
              <option value="">Select target column...</option>
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Features Selection */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-gray-900">
              Feature Columns
            </label>
            <select
              multiple
              size={Math.min(6, cols.length)}
              value={feats}
              onChange={(e) =>
                setFeats([...e.target.selectedOptions].map((o) => o.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
            >
              {cols
                .filter((c) => c !== target)
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {/* Parameters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {' '}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-gray-900">
              Test Size:{' '}
              <span className="font-semibold text-gray-600">{test}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={test}
              onChange={(e) => setTest(+e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>0.1</span>
              <span>0.5</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-gray-900">
              Random State
            </label>{' '}
            <input
              type="number"
              value={rand}
              onChange={(e) => setRand(+e.target.value || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
              placeholder="Enter random seed..."
            />
          </div>
        </div>
        {/* Run Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={run}
            disabled={busy || !target}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              busy || !target
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-sm'
            }`}
          >
            {busy ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Evaluating Scalers...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Run Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Error Display */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-3 text-sm">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700">{err}</p>
          </div>
        </div>
      )}{' '}
      {/* Results Section */}
      {res && (
        <div className="space-y-4 md:space-y-6">
          {/* Best Scaler Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              Best Scaler 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Best Scaler
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {res.best_scaler?.name ?? '—'}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-center">
                <div className="text-xs font-semibold text-green-700 mb-1">
                  Top R²
                </div>
                <div className="text-sm font-semibold text-green-900">
                  {res.ranking[0]['R2']?.toFixed(4) ?? '—'}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                <div className="text-xs font-semibold text-red-700 mb-1">
                  Top MSE
                </div>
                <div className="text-sm font-semibold text-red-900">
                  {res.ranking[0]['MSE']?.toFixed(4) ?? '—'}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-center">
                <div className="text-xs font-semibold text-yellow-700 mb-1">
                  Overall Rank
                </div>
                <div className="text-sm font-semibold text-yellow-900">
                  {res.ranking[0].Overall?.toFixed(2) ?? 1}
                </div>
              </div>
            </div>
          </div>{' '}
          {/* Ranking Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10z"
                />
              </svg>
              Scaler Rankings (Mean Model Performance)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(res.ranking[0]).map((k) => (
                      <th
                        key={k}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200"
                      >
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {res.ranking.map((r, idx) => (
                    <tr
                      key={r.Scaler}
                      className={
                        idx === 0
                          ? 'bg-green-50 border-l-4 border-green-400'
                          : 'hover:bg-gray-50'
                      }
                    >
                      {Object.values(r).map((v, i) => (
                        <td
                          key={i}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                        >
                          {typeof v === 'number' ? (
                            <span
                              className={`font-medium ${
                                idx === 0 ? 'text-green-800' : ''
                              }`}
                            >
                              {v.toFixed(4)}
                            </span>
                          ) : (
                            <span
                              className={`font-semibold ${
                                idx === 0 ? 'text-green-800' : ''
                              }`}
                            >
                              {v}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>{' '}
          {/* Dashboard Plot */}
          {res.plots?.overview_png && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Performance Dashboard
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadAllImages(res)}
                    className="flex items-center text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md text-xs md:text-sm transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download All Charts (ZIP)
                  </button>
                  <div className="relative group">
                    <button className="flex items-center text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-xs md:text-sm transition-colors">
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Download Individual
                    </button>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-600 px-3 py-1 mb-1">
                          Individual Charts
                        </div>
                        <button
                          onClick={() =>
                            downloadImage(
                              res.plots.r2_chart_png,
                              'r2_performance_chart.png'
                            )
                          }
                          className="w-full text-left px-3 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          📈 R² Performance Chart
                        </button>
                        <button
                          onClick={() =>
                            downloadImage(
                              res.plots.mse_chart_png,
                              'mse_performance_chart.png'
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          📊 MSE Performance Chart
                        </button>
                        <button
                          onClick={() =>
                            downloadImage(
                              res.plots.skew_chart_png,
                              'skew_performance_chart.png'
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          📉 Skew Performance Chart
                        </button>
                        <button
                          onClick={() =>
                            downloadImage(
                              res.plots.weighted_rank_chart_png,
                              'weighted_rank_chart.png'
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          🏆 Weighted Rank Chart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <img
                  src={`data:image/png;base64,${res.plots.overview_png}`}
                  alt="Performance Dashboard"
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}
          {/* Scaled Preview */}
          {res.scaled_preview && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Scaled Data Preview
              </h3>

              <div className="overflow-x-auto">
                <table
                  className="min-w-full border-collapse bg-white rounded-md overflow-hidden"
                  style={{ minWidth: '1200px' }}
                >
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(res.scaled_preview[0]).map((k) => (
                        <th
                          key={k}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap"
                        >
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {res.scaled_preview.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(r).map((v, j) => (
                          <td
                            key={j}
                            className="px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 font-mono"
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}{' '}
          {/* Downloads */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {res.scaled_dataset_base64 && (
                <a
                  href={`data:text/csv;base64,${res.scaled_dataset_base64}`}
                  download="scaled_dataset.csv"
                  className="flex items-center justify-center px-4 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  Scaled Dataset
                </a>
              )}

              {res.ranking_csv_base64 && (
                <a
                  href={`data:text/csv;base64,${res.ranking_csv_base64}`}
                  download="scaler_ranking.csv"
                  className="flex items-center justify-center px-4 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Scaler Performance Ranking
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Help Button */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
      
      {/* Documentation Modal */}
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
          <Docs section={'bestScaler'} />
        </div>
      </Modal>
    </div>
  );
}
