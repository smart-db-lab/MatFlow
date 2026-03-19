import React from "react";

function DataPreviewTable({ columns, csvData, title }) {
    return (
        <div className="mb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-lg font-semibold mb-2 flex-shrink-0">{title}</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                <div
                    className="overflow-x-auto overflow-y-auto flex-1"
                    style={{ maxHeight: "calc(90vh - 300px)" }}
                >
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {csvData.slice(0, 100).map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50">
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {row[col] !== null &&
                                            row[col] !== undefined
                                                ? String(row[col])
                                                : ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {csvData.length > 100 && (
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                        Showing first 100 rows of {csvData.length} total rows
                    </div>
                )}
            </div>
        </div>
    );
}

export default DataPreviewTable;
