import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import DashBoardLeft from "../FunctionBased/Components/DashBoardLeft/DashBoardLeft";
import DashBoardRight from "../FunctionBased/Components/DashBoardRight/DashBoardRight";
import DashBoardTop from "../FunctionBased/Components/DashBoardTop/DashBoardTop";
import Chatbot from "../Components/Chatbot/Chatbot";
import ProfileView from "./ProfileView";
import { setActiveFunction } from "../Slices/SideBarSlice";
import {
    setActiveFile,
    setActiveFolderAction,
} from "../Slices/UploadedFileSlice";
import { clearWorkspaceContext } from "../Slices/workspaceSlice";
import { commonApi } from "../services/api/apiService";
import { isGuestMode } from "../util/guestSession";
import { sessionGetString } from "../util/sessionProjectStorage";

const SIDEBAR_WIDTH_STORAGE_KEY = "matflow_sidebar_width";
const SIDEBAR_DEFAULT_WIDTH = 337;
const SIDEBAR_MIN_WIDTH = SIDEBAR_DEFAULT_WIDTH;
const SIDEBAR_MAX_WIDTH = 620;

export default function Dashboard() {
    const dispatch = useDispatch();
    const { projectId } = useParams();
    const showProfile = useSelector((state) => state.sideBar.showProfile);
    const showLeftSideBar = useSelector(
        (state) => state.sideBar.showLeftSideBar,
    );
    const [projectName, setProjectName] = useState("");
    const [openModal, setOpenModal] = useState(null);
    const layoutRef = useRef(null);
    const isResizingRef = useRef(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return SIDEBAR_DEFAULT_WIDTH;
        return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, parsed));
    });

    const handleResizeStart = (event) => {
        event.preventDefault();
        isResizingRef.current = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
    };

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!isResizingRef.current || !layoutRef.current) return;
            const rect = layoutRef.current.getBoundingClientRect();
            const proposed = event.clientX - rect.left;
            const nextWidth = Math.min(
                SIDEBAR_MAX_WIDTH,
                Math.max(SIDEBAR_MIN_WIDTH, proposed),
            );
            setSidebarWidth(nextWidth);
        };

        const handleMouseUp = () => {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            localStorage.setItem(
                SIDEBAR_WIDTH_STORAGE_KEY,
                String(sidebarWidth),
            );
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [sidebarWidth]);

    useEffect(() => {
        if (!projectId) {
            // Explicitly reset project-bound state on workspace route.
            dispatch(setActiveFunction(""));
            dispatch(setActiveFile(""));
            dispatch(setActiveFolderAction(""));
            dispatch(clearWorkspaceContext());
            setProjectName("");
            return;
        }

        // Project changed: clear workspace context first.
        dispatch(clearWorkspaceContext());

        const storedActiveFileId = sessionGetString("activeFileId", projectId);
        const storedActiveFolder = sessionGetString("activeFolder", projectId);
        const storedActiveFunction = sessionGetString(
            "activeFunction",
            projectId,
        );

        if (storedActiveFileId) {
            dispatch(setActiveFile({ name: storedActiveFileId }));
        } else {
            dispatch(setActiveFile(""));
        }

        if (storedActiveFolder) {
            dispatch(setActiveFolderAction(storedActiveFolder));
        } else {
            dispatch(setActiveFolderAction(""));
        }

        if (storedActiveFunction) {
            dispatch(setActiveFunction(storedActiveFunction));
        } else {
            dispatch(setActiveFunction(""));
        }
    }, [dispatch, projectId]);

    useEffect(() => {
        if (!projectId) return;

        if (isGuestMode()) {
            try {
                const stored = JSON.parse(
                    localStorage.getItem("mlflow_guest_projects") || "[]",
                );
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
    }, [projectId, dispatch]);

    return (
        <div className="h-screen bg-[#f9fafb]">
            <DashBoardTop />
            <div
                ref={layoutRef}
                style={{
                    height: "calc(100% - 3.91rem)",
                }}
                className="flex bg-[#f9fafb]"
            >
                {showProfile ? (
                    <ProfileView />
                ) : (
                    <>
                        <DashBoardLeft
                            projectId={projectId}
                            projectName={projectName}
                            onOpenModal={setOpenModal}
                            sidebarWidth={sidebarWidth}
                        />
                        {showLeftSideBar && (
                            <div
                                role="separator"
                                aria-label="Resize sidebar"
                                aria-orientation="vertical"
                                onMouseDown={handleResizeStart}
                                className="relative w-1 cursor-col-resize bg-transparent hover:bg-[#14B8A6]/20 active:bg-[#14B8A6]/35 transition-colors"
                            >
                                <div className="absolute inset-y-0 left-0 w-px bg-gray-200" />
                            </div>
                        )}
                        <DashBoardRight
                            projectName={projectName}
                            projectId={projectId}
                            openModal={openModal}
                            onModalOpened={() => setOpenModal(null)}
                        />
                    </>
                )}
            </div>
            <Chatbot />
        </div>
    );
}
