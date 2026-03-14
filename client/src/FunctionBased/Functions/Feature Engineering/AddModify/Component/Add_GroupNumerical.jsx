import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function Add_GroupNumerical({
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
      min_value: 0,
      max_value: 0,
      operator: "==",
      value: 0,
      bin_value: 0,
      use_operator: false,
    },
    {
      min_value: 0,
      max_value: 0,
      operator: "==",
      value: 0,
      bin_value: 0,
      use_operator: false,
    },
  ]);
  const [bin_column, setBin_column] = useState("");
  const [show_bin_dict, setShow_bin_dict] = useState(false);
  const dispatch = useDispatch();
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails && type === "node") {
      let data = nodeDetails.data;
      if (
        data &&
        data.addModify &&
        data.addModify.method === "Group Numerical"
      ) {
        data = data.addModify.data;
        if (data.n_group_data.length > 0) setNGroupData(data.n_group_data);
        setBin_column(data.bin_column || "");
        setShow_bin_dict(!!data.show_bin_dict);
        setNGroups(data.n_groups || 2);
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    dispatch(
      setData({
        bin_column,
        show_bin_dict,
        n_groups: nGroups,
        n_group_data: nGroupData,
      })
    );
  }, [bin_column, show_bin_dict, nGroups, nGroupData, dispatch]);

  const handleValueChange = (e, ind, key) => {
    const tempNGroupData = nGroupData.map((val, i) => {
      if (i === ind) return { ...val, [key]: e };
      return val;
    });
    setNGroupData(tempNGroupData);
  };

  return (
    <div>
      <div className={`flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 ${type === "node" && "flex-col"}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full flex-1`}>
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
                      min_value: 0,
                      max_value: 0,
                      operator: "==",
                      value: 0,
                      bin_value: 0,
                      use_operator: false,
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
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Bin Column</p>
            <Autocomplete
              size="small"
              options={columnNames}
              value={bin_column || null}
              onChange={(_, val) => setBin_column(val || "")}
              renderInput={(params) => <TextField {...params} placeholder="Select numeric column" />}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={show_bin_dict}
                onChange={(e) => setShow_bin_dict(e.target.checked)}
              />
            }
            label={<span className="text-sm font-medium">Show Bin Dictionary</span>}
          />
        </div>
      </div>
      <div className="mt-4">
        {nGroupData.map((val, index) => {
          return (
            <div
              key={index}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4`}
            >
              <div
                className={`flex flex-col sm:flex-row w-full gap-4 flex-1`}
              >
                {val.use_operator ? (
                  <>
                    <div className="w-full flex flex-col">
                      <label htmlFor="" className="mb-2 text-sm font-semibold text-gray-800">
                        Operator
                      </label>
                      <FormControl size="small">
                        <Select
                        value={val.operator}
                        onChange={(e) =>
                          handleValueChange(e.target.value, index, "operator")
                        }
                      >
                        <MenuItem value="==">==</MenuItem>
                        <MenuItem value="!=">!=</MenuItem>
                        <MenuItem value="<">{"<"}</MenuItem>
                        <MenuItem value=">">{">"}</MenuItem>
                        <MenuItem value="<=">{"<="}</MenuItem>
                        <MenuItem value=">=">{">="}</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                    <TextField
                      label="Value"
                      type="number"
                      size="small"
                      value={val.value}
                      fullWidth
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "value")
                      }
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Min Value"
                      type="number"
                      size="small"
                      fullWidth
                      value={val.min_value}
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "min_value")
                      }
                    />
                    <TextField
                      label="Max Value"
                      type="number"
                      size="small"
                      fullWidth
                      value={val.max_value}
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "max_value")
                      }
                    />
                  </>
                )}
                <TextField
                  label="Bin Value"
                  type="number"
                  size="small"
                  fullWidth
                  value={val.bin_value}
                  onChange={(e) =>
                    handleValueChange(e.target.value, index, "bin_value")
                  }
                />
              </div>
              <div className="flex-shrink-0">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(val.use_operator)}
                      onChange={(e) =>
                        handleValueChange(e.target.checked, index, "use_operator")
                      }
                    />
                  }
                  label={<span className="text-sm font-medium">Use Operator</span>}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Add_GroupNumerical;
