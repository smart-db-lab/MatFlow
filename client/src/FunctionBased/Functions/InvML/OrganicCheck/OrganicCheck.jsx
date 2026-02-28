import React, { useState, useEffect } from "react";
import { Loading } from "@nextui-org/react";
import { isLoggedIn } from "../../../../util/adminAuth";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { apiService } from "../../../../services/api/apiService";
import TextInput from "../../Components/TextInput/TextInput"; // Assume you have one
import { saveAs } from "file-saver";

function OrganicCheck({ csvData }) {
  const [smilesCol, setSmilesCol] = useState("");
  const [categoryCol, setCategoryCol] = useState("category");
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);

  const [checkedData, setCheckedData] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [mismatchCount, setMismatchCount] = useState(0);
  const [mismatchPreview, setMismatchPreview] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (csvData.length > 0) {
      const cols = Object.keys(csvData[0]);
      if (cols.includes("SMILES")) setSmilesCol("SMILES");
    }
  }, [csvData]);

  const handleCheck = async () => {
    if (!isLoggedIn()) {
      setError('Please log in to check organic molecules.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiService.matflow.chemistry.organicCheck({
        df: csvData,
        smiles_col: smilesCol,
        category_col: categoryCol,
        overwrite,
      });

      if (data.error) {
        throw new Error(data.error || "Check failed");
      }
      setCheckedData(data.df);
      setCategoryCounts(data.category_counts);
      setMismatchCount(data.mismatch_count);
      setMismatchPreview(data.mismatch_preview);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const csv = [
      Object.keys(checkedData[0]).join(","),
      ...checkedData.map((row) =>
        Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "df_with_category.csv");
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">✅ Organic / Inorganic Checker</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SingleDropDown
          label="SMILES Column"
          columnNames={Object.keys(csvData[0] || {})}
          defaultValue={smilesCol}
          onValueChange={setSmilesCol}
        />
        <TextInput
          label="Category Column"
          value={categoryCol}
          onChange={(e) => setCategoryCol(e.target.value)}
        />
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={() => setOverwrite(!overwrite)}
            />
            <span>Overwrite Existing</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          className="px-6 py-2 bg-primary text-white rounded shadow"
          onClick={handleCheck}
          disabled={loading}
        >
          Run Check
        </button>
      </div>

      {loading && (
        <div className="mt-8">
          <Loading size="lg" color="success">Checking molecules...</Loading>
        </div>
      )}

      {error && <div className="text-red-600 mt-4">{error}</div>}

      {checkedData.length > 0 && (
        <>
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Category Counts</h3>
            <ul className="list-disc ml-6">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <li key={cat}>
                  {cat}: {count}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Mismatch Report</h3>
            <p>{mismatchCount} rows disagree with the stored label.</p>
            {mismatchPreview.length > 0 && (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      {Object.keys(mismatchPreview[0]).map((key) => (
                        <th key={key} className="border px-2 py-1">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mismatchPreview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="border px-2 py-1">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded shadow"
              onClick={handleDownload}
            >
              Download Annotated CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OrganicCheck;
