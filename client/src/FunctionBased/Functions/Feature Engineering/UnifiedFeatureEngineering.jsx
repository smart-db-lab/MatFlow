import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { setActiveFunction } from "../../../Slices/SideBarSlice";
import { sessionSetString } from "../../../util/sessionProjectStorage";
import FeatureEngineeringSelector from "../../Components/FeatureEngineeringSelector/FeatureEngineeringSelector";
import AddModify from "./AddModify/AddModify";
import AlterFieldName from "./AlterFieldName/AlterFieldName";
import AppendDataset from "./AppendDataset/AppendDataset";
import ChangeDType from "./ChangeDType/ChangeDType";
import Cluster from "./Cluster/Cluster";
import DropColumn from "./DropColumn/DropColumn";
import DropRow from "./DropRow/DropRow";
import Encoding from "./Encoding/Encoding";
import FeatureSelection from "./FeatureSelection/FeatureSelection";
import MergeDataset from "./MergeDataset/MergeDataset";
import Scaling from "./Scaling/Scaling";
import Imputation from "./Imputation/Imputation";
import ScalerEvaluationPage from "../InvML/BestScaler/ScalerEvaluation.jsx";

const FEATURE_ENGINEERING_TYPES = [
    "Add/Modify",
    "Change Dtype",
    "Alter Field Name",
    "Imputation",
    "Encoding",
    "Scaling",
    "Drop Column",
    "Drop Rows",
    "Append Dataset",
    "Merge Dataset",
    "Feature Selection",
    "Cluster",
    "Best Scaler",
];

function UnifiedFeatureEngineering({ csvData }) {
    const { projectId } = useParams();
    const activeFunction = useSelector((state) => state.sideBar.activeFunction);
    const dispatch = useDispatch();
    const [selectedType, setSelectedType] = useState("Add/Modify");

    // Sync selectedType with activeFunction when it's a feature engineering type
    useEffect(() => {
        if (
            activeFunction &&
            FEATURE_ENGINEERING_TYPES.includes(activeFunction)
        ) {
            setSelectedType(activeFunction);
        } else if (
            activeFunction === "Feature Engineering" ||
            activeFunction === "Data Prep" ||
            activeFunction === "Manage Material Properties" ||
            activeFunction === "Materials Feature Engineering" ||
            activeFunction === "Materials Descriptor Generation"
        ) {
            setSelectedType("Add/Modify");
        }
    }, [activeFunction]);

    const handleTypeChange = (type) => {
        setSelectedType(type);
        dispatch(setActiveFunction(type));
        sessionSetString("activeFunction", projectId, type);
    };

    // Render component based on selected type
    const renderComponent = () => {
        switch (selectedType) {
            case "Add/Modify":
                return <AddModify csvData={csvData} />;
            case "Change Dtype":
                return <ChangeDType csvData={csvData} />;
            case "Alter Field Name":
                return <AlterFieldName csvData={csvData} />;
            case "Imputation":
                return <Imputation csvData={csvData} />;
            case "Encoding":
                return <Encoding csvData={csvData} />;
            case "Scaling":
                return <Scaling csvData={csvData} />;
            case "Drop Column":
                return <DropColumn csvData={csvData} />;
            case "Drop Rows":
                return <DropRow csvData={csvData} />;
            case "Append Dataset":
                return <AppendDataset csvData={csvData} />;
            case "Merge Dataset":
                return <MergeDataset csvData={csvData} />;
            case "Feature Selection":
                return <FeatureSelection csvData={csvData} />;
            case "Cluster":
                return <Cluster csvData={csvData} />;
            case "Best Scaler":
                return <ScalerEvaluationPage csvData={csvData} />;
            default:
                return <AddModify csvData={csvData} />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col matflow-unified-input-height">
            <FeatureEngineeringSelector
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
            />

            <div className="flex-1 overflow-y-auto">
                <div className="py-2">{renderComponent()}</div>
            </div>
        </div>
    );
}

export default UnifiedFeatureEngineering;
