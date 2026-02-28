import React from 'react';

const DataTable = ({ data, onEdit, editable = true }) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-gray-200 shadow-xs">
      <table className="w-full divide-y divide-gray-200">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {columns.map((column) => (
                <td key={column} className="px-6 py-4 whitespace-nowrap">
                  {editable ? (
                    <input
                      type="text"
                      value={row[column]}
                      onChange={(e) => onEdit(rowIndex, column, e.target.value)}
                      className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-light p-1 rounded text-sm text-gray-800"
                    />
                  ) : (
                    <span className="text-sm text-gray-700">{row[column]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;