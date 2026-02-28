import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";

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
            />
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <p className="text-sm font-medium text-gray-700 mb-1.5">Bin Column</p>
            <SingleDropDown
              columnNames={columnNames}
              onValueChange={setBin_column}
              initValue={bin_column}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <Checkbox
            key={`show-bin-dict-${show_bin_dict}`}
            defaultSelected={show_bin_dict}
            color="primary"
            onChange={(e) => setShow_bin_dict(e.valueOf())}
          >
            Show Bin Dict
          </Checkbox>
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
                      <label htmlFor="" className="mb-2 text-sm">
                        Operator
                      </label>
                      <select
                        name=""
                        id=""
                        className="p-2 rounded-lg"
                        value={val.operator}
                        onChange={(e) =>
                          handleValueChange(e.target.value, index, "operator")
                        }
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value="<">{"<"}</option>
                        <option value=">">{">"}</option>
                        <option value="<=">{"<="}</option>
                        <option value=">=">{">="}</option>
                      </select>
                    </div>
                    <Input
                      label="Value"
                      type="number"
                      value={val.value}
                      fullWidth
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "value")
                      }
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Min Value"
                      type="number"
                      fullWidth
                      value={val.min_value}
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "min_value")
                      }
                    />
                    <Input
                      label="Max Value"
                      type="number"
                      fullWidth
                      value={val.max_value}
                      onChange={(e) =>
                        handleValueChange(e.target.value, index, "max_value")
                      }
                    />
                  </>
                )}
                <Input
                  label="Bin Value"
                  type="number"
                  fullWidth
                  value={val.bin_value}
                  onChange={(e) =>
                    handleValueChange(e.target.value, index, "bin_value")
                  }
                />
              </div>
              <div className="flex-shrink-0">
                <Checkbox
                  key={`use-operator-${index}-${val.use_operator}`}
                  size={type === "node" ? "sm" : "md"}
                  color="primary"
                  defaultSelected={val.use_operator}
                  onChange={(e) =>
                    handleValueChange(e.valueOf(), index, "use_operator")
                  }
                >
                  Use Operator
                </Checkbox>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Add_GroupNumerical;
