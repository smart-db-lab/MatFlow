import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import MultipleDropDown from "../../../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";

function Add_GroupCategorical({
  csvData,
  type = "function",
  nodeId,
  rflow = undefined,
}) {
  const [nGroups, setNGroups] = useState(2);
  const columnNames = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [nGroupData, setNGroupData] = useState([
    {
      group_name: "",
      group_members: [],
      others: false,
    },
    {
      group_name: "",
      group_members: [],
      others: false,
    },
  ]);
  const [groupColumn, setGroupColumn] = useState("");
  const [groupMembers, setGroupMembers] = useState();
  const [sort_value, setSort_value] = useState(true);
  const [show_group, setShow_group] = useState(false);
  const dispatch = useDispatch();
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails  && type === 'node') {
      let data = nodeDetails.data;
      if (
        data &&
        data.addModify &&
        data.addModify.method === "Group Categorical"
      ) {
        data = data.addModify.data;
        if (data.n_group_data.length > 0) setNGroupData(data.n_group_data);
        setGroupColumn(data.group_column || "");
        setNGroups(data.n_groups || 2);
        setSort_value(!!data.sort_value);
        setShow_group(data.show_group || false);
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    dispatch(
      setData({
        n_groups: nGroups,
        group_column: groupColumn,
        n_group_data: nGroupData,
        sort_value,
        show_group,
      })
    );
  }, [nGroups, nGroupData, sort_value, show_group, groupColumn, dispatch]);

  useEffect(() => {
    if (groupColumn) {
      let temp = csvData.map((val) => val[groupColumn].toString());
      let temp1 = new Set(temp);
      temp1 = [...temp1];
      setGroupMembers(temp1);
    }

  }, [groupColumn, csvData]);

  const handleChange = (e, ind) => {
    const temp = nGroupData.map((val, i) => {
      if (i === ind) {
        return { ...val, group_name: e.target.value };
      }
      return val;
    });
    setNGroupData(temp);
  };

  const handleMultipleDropdown = (colName, index = 0) => {
    const temp = nGroupData.map((val, i) => {
      if (i === index) {
        return { ...val, group_members: colName };
      }
      return val;
    });
    setNGroupData(temp);
  };

  const handleOtherChange = (val, ind) => {
    const temp = nGroupData.map((d, i) => {
      if (i === ind) {
        return { ...d, others: val };
      }
      return d;
    });
    setNGroupData(temp);
  };

  return (
    <div className="mt-4">
      <div className={`flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 ${type === "node" && "flex-col"}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center w-full gap-4 flex-1`}>
          <div className="w-full sm:w-auto sm:min-w-[120px]">
            <Input
              label="N Groups"
              value={nGroups}
              onChange={(e) => {
                const val = e.target.value;
                setNGroups(val);
                if (val < nGroupData.length)
                  setNGroupData(nGroupData.slice(0, val));
                else {
                  const temp = JSON.parse(JSON.stringify(nGroupData));
                  while (val - temp.length > 0) {
                    temp.push({
                      group_name: "",
                      group_members: [],
                      others: false,
                    });
                  }
                  setNGroupData(temp);
                }
              }}
              type="number"
            />
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <p className="text-sm font-medium text-gray-700 mb-1.5">Group Column</p>
            <SingleDropDown
              columnNames={columnNames}
              onValueChange={setGroupColumn}
              initValue={groupColumn}
            />
          </div>
        </div>
        <div className={`flex flex-row gap-4 ${type === "node" ? "" : ""}`}>
          <Checkbox
            key={`sort-value-${sort_value}`}
            defaultSelected={sort_value}
            color="primary"
            onChange={(e) => setSort_value(e.valueOf())}
          >
            Sort Value
          </Checkbox>
          <Checkbox
            key={`show-group-${show_group}`}
            color="primary"
            defaultSelected={show_group}
            onChange={(e) => setShow_group(e.valueOf())}
          >
            Show Group
          </Checkbox>
        </div>
      </div>
      <div className="mt-4">
        {nGroupData.map((val, index) => {
          return (
            <div key={index} className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-center">
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Input
                  label="Group Name"
                  fullWidth
                  value={nGroupData[index].group_name}
                  onChange={(e) => handleChange(e, index)}
                />
              </div>
              <div className="flex-grow w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
                <p className="text-sm font-medium text-gray-700 mb-1.5">Group Members</p>
                <MultipleDropDown
                  columnNames={groupMembers || []}
                  setSelectedColumns={handleMultipleDropdown}
                  curInd={index}
                  disabled={nGroupData[index].others}
                  defaultValue={nGroupData[index].group_members}
                />
              </div>
              {index === nGroups - 1 && (
                <div className="flex-shrink-0">
                  <Checkbox
                    key={`others-${index}-${nGroupData[index].others}`}
                    defaultSelected={nGroupData[index].others}
                    size={type === "node" ? "sm" : "md"}
                    color="primary"
                    onChange={(e) => handleOtherChange(e.valueOf(), index)}
                  >
                    Others
                  </Checkbox>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Add_GroupCategorical;
