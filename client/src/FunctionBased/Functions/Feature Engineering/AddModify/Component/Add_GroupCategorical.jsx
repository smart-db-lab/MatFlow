import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

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
            <TextField
              label="Group Count"
              value={nGroups}
              onChange={(e) => {
                const val = Number(e.target.value || 0);
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
              size="small"
              inputProps={{ step: 1, min: 1 }}
            />
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Group Column</p>
            <Autocomplete
              size="small"
              options={columnNames}
              value={groupColumn || null}
              onChange={(_, val) => setGroupColumn(val || "")}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select numeric column" />
              )}
            />
          </div>
        </div>
        <div className={`flex flex-row gap-4 ${type === "node" ? "" : ""}`}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={sort_value}
                onChange={(e) => setSort_value(e.target.checked)}
              />
            }
            label={<span className="text-sm font-medium">Sort Value</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={show_group}
                onChange={(e) => setShow_group(e.target.checked)}
              />
            }
            label={<span className="text-sm font-medium">Show Group</span>}
          />
        </div>
      </div>
      <div className="mt-4">
        {nGroupData.map((val, index) => {
          return (
            <div key={index} className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-center">
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <TextField
                  label={`Group ${index + 1} Name`}
                  size="small"
                  fullWidth
                  value={nGroupData[index].group_name}
                  onChange={(e) => handleChange(e, index)}
                />
              </div>
              <div className="flex-grow w-full sm:w-auto sm:min-w-[400px] sm:max-w-[700px]">
                <p className="text-sm font-semibold text-gray-800 mb-1.5">Group Members</p>
                <Autocomplete
                  multiple
                  size="small"
                  options={groupMembers || []}
                  disabled={nGroupData[index].others}
                  value={nGroupData[index].group_members || []}
                  onChange={(_, selected) => handleMultipleDropdown(selected, index)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select group members" />
                  )}
                />
              </div>
              {index === nGroups - 1 && (
                <div className="flex-shrink-0">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(nGroupData[index].others)}
                        onChange={(e) => handleOtherChange(e.target.checked, index)}
                      />
                    }
                    label={<span className="text-sm font-medium">Others</span>}
                  />
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
