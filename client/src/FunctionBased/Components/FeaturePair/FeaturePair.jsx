import { Checkbox } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import AgGridComponent from "../AgGridComponent/AgGridComponent";
import SingleDropDown from "../SingleDropDown/SingleDropDown";
import { apiService } from "../../../services/api/apiService";

function FeaturePair({ rowData }) {
  let columnNames = Object.keys(rowData[0]);
  columnNames = columnNames.filter((name) => name !== "column_name");
  const [Data, setData] = useState([]);
  const [changedData, setChangedData] = useState();
  const [colDef, setColDef] = useState([]);
  const [drop, setDrop] = useState(false);
  const [absolute, setAbsolute] = useState(false);

  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");

  useEffect(() => {
    const colNames = new Set(columnNames);
    colNames.add("");
    let tempRowData = JSON.parse(JSON.stringify(rowData));
    let newRowData = {};
    for (let i = 0; i < tempRowData.length; i++) {
      const { column_name, ...rest } = tempRowData[i];
      const tempObj = { [columnNames[i]]: rest };
      newRowData = { ...newRowData, ...tempObj };
    }

    if (colNames.has(filter1) && colNames.has(filter2)) {
      if (filter1 || filter2) {
        const fetchData = async () => {
          const response = await apiService.matflow.dataset.getCorrelationFeaturePair({
            file: newRowData,
            gradient: true,
            feature1: filter1,
            feature2: filter2,
            drop: false,
            absol: false,
            high: 0.0,
          });

          let { data } = response;
          data = JSON.parse(data);

          setData(data);
          const tempColDef = Object.keys(data[0]).map((val) => ({
            headerName: val,
            field: val,
            valueGetter: (params) => {
              return params.data[val];
            },
          }));
          setColDef(tempColDef);
          setChangedData(data);
        };

        fetchData();
      }
    }
  }, [filter1, filter2, rowData]);

  const filteredItems1 = columnNames.filter((item) =>
    item.toLowerCase().includes(filter1.toLowerCase())
  );

  const filteredItems2 = columnNames.filter((item) =>
    item.toLowerCase().includes(filter2.toLowerCase())
  );

  useEffect(() => {
    let temp = JSON.parse(JSON.stringify(Data));
    if (drop) {
      temp = temp.filter(
        (val) => parseInt(val["Correlation Coefficient"]) !== 1
      );
    }
    if (absolute) {
      temp = temp.map((val) => {
        return {
          ...val,
          "Correlation Coefficient": Math.abs(
            parseFloat(val["Correlation Coefficient"])
          ),
        };
      });
    }

    setChangedData(temp);
  }, [drop, absolute, Data]);

  return (
    <div>
      <div className="flex text-lg mt-8 items-end gap-8 w-full">
        <div className="flex flex-col gap-1 basis-80">
          <label className="mb-1" htmlFor="correlation-method">
            Feature 1 Filter
          </label>
          <SingleDropDown
            columnNames={filteredItems1}
            onValueChange={setFilter1}
          />
        </div>
        <div className="flex flex-col gap-1 basis-80">
          <label className="mb-1" htmlFor="correlation-method">
            Feature 2 Filter
          </label>
          <SingleDropDown
            columnNames={filteredItems2}
            onValueChange={setFilter2}
          />
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Checkbox color="success" onChange={(e) => setDrop(e.valueOf())}>
            Drop Perfect
          </Checkbox>
          <Checkbox color="success" onChange={(e) => setAbsolute(e.valueOf())}>
            Absolute Value
          </Checkbox>
        </div>
      </div>

      {Data.length > 0 && colDef.length > 0 && (
        <div className="mt-8 h-[600px]">
          <AgGridComponent rowData={changedData} columnDefs={colDef} />
          <div className="mt-8"></div>
        </div>
      )}
    </div>
  );
}

export default FeaturePair;
