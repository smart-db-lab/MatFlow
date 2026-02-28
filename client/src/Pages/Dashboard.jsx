import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import DashBoardLeft from "../FunctionBased/Components/DashBoardLeft/DashBoardLeft";
import DashBoardRight from "../FunctionBased/Components/DashBoardRight/DashBoardRight";
import DashBoardTop from "../FunctionBased/Components/DashBoardTop/DashBoardTop";
import Chatbot from "../Components/Chatbot/Chatbot";
import ProfileView from "./ProfileView";
import { setActiveFunction } from "../Slices/SideBarSlice";
import { setActiveFile, setActiveFolderAction } from "../Slices/UploadedFileSlice";
import { commonApi } from "../services/api/apiService";
import { isGuestMode } from "../util/guestSession";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const showProfile = useSelector((state) => state.sideBar.showProfile);
  const [projectName, setProjectName] = useState("");
  const [openModal, setOpenModal] = useState(null);

  useEffect(() => {
    if (!projectId) {
      // Explicitly reset project-bound state on workspace route.
      dispatch(setActiveFunction(""));
      dispatch(setActiveFile(""));
      dispatch(setActiveFolderAction(""));
      setProjectName("");
      return;
    }
    dispatch(setActiveFunction(localStorage.getItem("activeFunction") || ""));
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!projectId) return;

    if (isGuestMode()) {
      try {
        const stored = JSON.parse(localStorage.getItem("mlflow_guest_projects") || "[]");
        const project = stored.find((p) => p.id === projectId);
        setProjectName(project?.name || "");
      } catch (_) {
        setProjectName("");
      }
      return;
    }

    const fetchProject = async () => {
      try {
        const project = await commonApi.projects.get(projectId);
        setProjectName(project?.name || "");
      } catch (_) {
        setProjectName("");
      }
    };
    fetchProject();
  }, [projectId]);

  return (
    <div className="h-screen bg-[#f9fafb]">
      <DashBoardTop />
      <div 
        style={{ 
          height: "calc(100% - 3.91rem)"
        }} 
        className="flex bg-[#f9fafb]"
      >
        {showProfile ? (
          <ProfileView />
        ) : (
          <>
            <DashBoardLeft projectId={projectId} projectName={projectName} onOpenModal={setOpenModal} />
            <DashBoardRight projectName={projectName} projectId={projectId} openModal={openModal} onModalOpened={() => setOpenModal(null)} />
          </>
        )}
      </div>
      <Chatbot />
    </div>
  );
}
