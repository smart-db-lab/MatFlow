import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HiHome } from 'react-icons/hi';
import { Star, Pencil, Trash2, X, Search, FolderOpen, PlusCircle, FlaskConical } from 'lucide-react';
import { setFile } from '../../../Slices/FeatureEngineeringSlice';
import { safeFileSwitchWithCache } from '../../../util/indexDB';
import { commonApi } from '../../../services/api/apiService';
import { isLoggedIn } from '../../../util/adminAuth';
import { isGuestMode } from '../../../util/guestSession';
import DatasetCorrelation from '../../Functions/Dataset/DatasetCorrelation';
import DatasetDisplay from '../../Functions/Dataset/DatasetDisplay';
import DatasetDuplicates from '../../Functions/Dataset/DatasetDuplicates';
import DatasetGroup from '../../Functions/Dataset/DatasetGroup';
import DatasetInformation from '../../Functions/Dataset/DatasetInformation';
import DatasetStatistics from '../../Functions/Dataset/DatasetStatistics';
import UnifiedEDA from '../../Functions/EDA/UnifiedEDA';
import BarPlot from '../../Functions/EDA/BarPlot';
import BoxPlot from '../../Functions/EDA/BoxPlot';
import CustomPlot from '../../Functions/EDA/CustomPlot';
import Histogram from '../../Functions/EDA/Histogram';
import LinePlot from '../../Functions/EDA/LinePlot';
import PiePlot from '../../Functions/EDA/PiePlot';
import RegPlot from '../../Functions/EDA/RegPlot';
import ScatterPlot from '../../Functions/EDA/ScatterPlot';
import ViolinPlot from '../../Functions/EDA/ViolinPlot';
import UnifiedFeatureEngineering from '../../Functions/Feature Engineering/UnifiedFeatureEngineering';
import FinalDataset from '../../Functions/FinalDataset/FinalDataset';
import BuildModel from '../../Functions/Model Building/BuildModel/BuildModel';
import ModelEvaluation from '../../Functions/Model Building/ModelEvaluation/ModelEvaluation';
import ModelPrediction from '../../Functions/Model Building/ModelPrediction/ModelPrediction';
import Models from '../../Functions/Model Building/Models/Models';
import SplitDataset from '../../Functions/Model Building/SplitDataset/SplitDataset';
import ModelBuildingWorkflow from '../../Functions/Model Building/ModelBuildingWorkflow';
import ModelDeployment from '../../Functions/ModelDeployment/ModelDeployment';
import ReverseML from '../../Functions/InvML/ReverseML';
import TimeSeriesAnalysis from '../../Functions/TimeSeriesAnalysis/TimeSeriesAnalysis';
import Imputation from '../../Functions/Feature Engineering/Imputation/Imputation';
import PSO from '../../Functions/InvML/PSO';
import SMILESGeneration from '../../Functions/InvML/SMILESGeneration/SMILESGeneration';
import SMILEStoIUPAC from '../../Functions/InvML/SMILEStoIUPAC/SMILEStoIUPAC';
import SMILESToSyntheticScore from '../../Functions/InvML/SMILESToSAS/SMILESToSyntheticScore';
import SMILESToDFT from '../../Functions/InvML/SMILESToDFT/SMILESToDFT';
import SMILESMolecularStructure from '../../Functions/InvML/SMILESMolecularStructure/SMILESMolecularStructure';
import VennDiagram from '../../Functions/EDA/VennDiagram.jsx';
import FeatureSelection from '../../Functions/InvML/FeatureSelection/FeatureSelection';
import ConfirmDeleteModal from '../../../Components/ConfirmDeleteModal';

const STORAGE_KEY = 'mlflow_projects';
const GUEST_PROJECTS_KEY = 'mlflow_guest_projects';
const PAGE_SIZE = 6;

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

function DashBoardRight({ projectName, projectId, openModal, onModalOpened }) {
  const activeFunction = useSelector((state) => state.sideBar.activeFunction);
  const activeFile = useSelector((state) => state.uploadedFile.activeFile);
  const previousFile = useSelector((state) => state.uploadedFile.previousFile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const render = useSelector((state) => state.uploadedFile.rerender);

  // Project management state
  const guest = isGuestMode();
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState(null);

  const loadProjects = async () => {
    if (guest) {
      try {
        const stored = localStorage.getItem(GUEST_PROJECTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed.map((p) => ({
              ...p,
              createdAt: new Date(p.created_at || p.createdAt || Date.now()).getTime(),
              updatedAt: new Date(p.updated_at || p.updatedAt || p.created_at || p.createdAt || Date.now()).getTime(),
              isFavorite: !!p.is_favorite || !!p.isFavorite,
            })));
            return;
          }
        }
      } catch (_) {}
      setProjects([]);
      return;
    }
    try {
      const data = await commonApi.projects.list();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data.map((p) => ({
          ...p,
          createdAt: new Date(p.created_at || p.createdAt).getTime(),
          updatedAt: new Date(p.updated_at || p.updatedAt || p.created_at || p.createdAt).getTime(),
          isFavorite: !!p.is_favorite || !!p.isFavorite,
        })));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        setProjects([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed.map((p) => ({
              ...p,
              createdAt: p.createdAt || Date.now(),
              updatedAt: p.updatedAt || p.createdAt || Date.now(),
              isFavorite: typeof p.isFavorite === 'boolean' ? p.isFavorite : false,
            })));
          }
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (showProjectsModal) loadProjects();
  }, [showProjectsModal]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      if (bTime !== aTime) return bTime - aTime;
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = sortedProjects;
    if (q) list = list.filter((p) => (p.name && p.name.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q)));
    if (showFavoritesOnly) list = list.filter((p) => p.isFavorite);
    return list;
  }, [sortedProjects, searchQuery, showFavoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const visibleProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);
  const recentProjects = useMemo(() => sortedProjects.slice(0, 5), [sortedProjects]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [guest]);

  const handleCreateProject = async () => {
    if (!formName.trim() || guest) return;
    try {
      const created = await commonApi.projects.create({ name: formName.trim(), description: formDescription.trim() || '' });
      const newProject = {
        ...created,
        createdAt: new Date(created.created_at || Date.now()).getTime(),
        updatedAt: new Date(created.updated_at || created.created_at || Date.now()).getTime(),
        isFavorite: !!created.is_favorite,
      };
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      setFormName('');
      setFormDescription('');
      setEditingId(null);
      setShowCreateModal(false);
      navigate(`/dashboard/${newProject.id}`);
    } catch (_) {}
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formName.trim()) return;
    if (guest) {
      setProjects((prev) => {
        const updated = prev.map((p) => p.id === editingId ? { ...p, name: formName.trim(), description: formDescription.trim() || '', updatedAt: Date.now() } : p);
        localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updated));
        return updated;
      });
      setFormName(''); setFormDescription(''); setEditingId(null);
      return;
    }
    try {
      const updated = await commonApi.projects.update(editingId, { name: formName.trim(), description: formDescription.trim() || '' });
      const updatedProject = {
        ...updated,
        createdAt: new Date(updated.created_at || Date.now()).getTime(),
        updatedAt: new Date(updated.updated_at || updated.created_at || Date.now()).getTime(),
        isFavorite: !!updated.is_favorite,
      };
      setProjects((prev) => {
        const updatedList = prev.map((p) => p.id === editingId ? updatedProject : p);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        return updatedList;
      });
      setFormName(''); setFormDescription(''); setEditingId(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    if (guest) {
      const updated = projects.filter((p) => p.id !== projectToDelete.id);
      setProjects(updated);
      if (updated.length > 0) localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updated));
      else localStorage.removeItem(GUEST_PROJECTS_KEY);
      if (projectId === projectToDelete.id) navigate('/dashboard');
      setShowDeleteModal(false); setProjectToDelete(null);
      return;
    }
    try {
      await commonApi.projects.remove(projectToDelete.id);
      const updated = projects.filter((p) => p.id !== projectToDelete.id);
      setProjects(updated);
      if (updated.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      else localStorage.removeItem(STORAGE_KEY);
      if (projectId === projectToDelete.id) navigate('/dashboard');
      setShowDeleteModal(false); setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const toggleFavorite = async (project, e) => {
    e.stopPropagation();
    const newFav = !project.isFavorite;
    const storageKey = guest ? GUEST_PROJECTS_KEY : STORAGE_KEY;
    setProjects((prev) => {
      const updated = prev.map((p) => p.id === project.id ? { ...p, isFavorite: newFav, updatedAt: Date.now() } : p);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    if (guest) return;
    try { await commonApi.projects.update(project.id, { is_favorite: newFav }); }
    catch (_) {
      setProjects((prev) => {
        const reverted = prev.map((p) => p.id === project.id ? { ...p, isFavorite: !newFav } : p);
        localStorage.setItem(storageKey, JSON.stringify(reverted));
        return reverted;
      });
    }
  };

  const openCreate = () => {
    if (guest) { toast.info('Sign up to create custom projects.', { toastId: 'guest-create' }); return; }
    if (!isLoggedIn()) { navigate('/login'); return; }
    setEditingId(null); setFormName(''); setFormDescription('');
    setShowCreateModal(true);
  };

  const openEdit = (project) => {
    setEditingId(project.id);
    setFormName(project.name || '');
    setFormDescription(project.description || '');
  };

  useEffect(() => {
    if (!openModal) return;
    if (openModal === 'projects') setShowProjectsModal(true);
    else if (openModal === 'create') openCreate();
    else if (openModal === 'sample') { setSampleError(null); setShowSampleModal(true); }
    onModalOpened?.();
  }, [openModal]);

  // Clear csvData immediately when activeFile changes to prevent showing stale data
  useEffect(() => {
    if (previousFile && previousFile !== activeFile) {
      console.log(
        `🔄 File changed from ${previousFile} to ${activeFile}, clearing data`
      );
      setCsvData(undefined);
      setIsLoading(true);
    }
  }, [activeFile, previousFile]);

  useEffect(() => {
    if (activeFile && activeFile.name) {
      const getData = async () => {
        try {
          setIsLoading(true);

          // Use the safer file switching function
          const previousFileName =
            previousFile && previousFile.name ? previousFile.name : null;
          const res = await safeFileSwitchWithCache(
            activeFile.name,
            previousFileName
          );

          setCsvData(res);
          dispatch(setFile(res));
        } catch (error) {
          console.error('Error in safe file switch:', error);
          setCsvData(undefined);
        } finally {
          setIsLoading(false);
        }
      };

      getData();
    } else {
      setCsvData(undefined);
      setIsLoading(false);
    }
  }, [activeFile, dispatch, render, previousFile]);

  const isEditMode = !!editingId;
  const modalTitle = isEditMode ? 'Edit project' : 'Create project';
  const modalPrimaryLabel = isEditMode ? 'Save changes' : 'Create project';
  const modalPrimaryAction = isEditMode ? handleSaveEdit : handleCreateProject;
  const hasCsvRows = Array.isArray(csvData) && csvData.length > 0;
  const showWorkspaceScreen = !isLoading && !projectId;
  const showBlankProjectPanel = !isLoading && Boolean(projectId) && (!activeFile || !activeFunction);

  return (
    <div 
      className="flex-grow h-full overflow-y-auto px-6 bg-white"
    >
      {/* Home bar with integrated breadcrumb */}
      <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 mb-1 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-6 h-6 rounded-full bg-[#0D9488] hover:bg-[#0F766E] flex items-center justify-center transition-colors shrink-0"
          >
            <HiHome className="w-3 h-3 text-white" />
          </button>
          <span
            className={`text-xs font-medium cursor-pointer transition-colors ${(!activeFile && !activeFunction) ? 'text-[#0D9488]' : 'text-gray-700 hover:text-[#0D9488]'}`}
            onClick={() => navigate('/dashboard')}
          >
            Home
          </span>
          {projectName && projectName.trim() && (
            <>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className={`text-xs font-medium ${(!activeFile && !activeFunction) ? 'text-[#0D9488]' : 'text-gray-700'}`}>{projectName}</span>
            </>
          )}
          {activeFunction && (
            <>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-xs font-medium text-[#0D9488]">{activeFunction}</span>
            </>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dataset...</p>
          </div>
        </div>
      )}

      {!isLoading && activeFunction && activeFile && hasCsvRows ? (
        <>
          {csvData &&
            activeFunction &&
            (activeFunction === 'Display' || activeFunction === 'Dataset') && (
              <DatasetDisplay csvData={csvData} />
            )}
          {csvData && activeFunction && activeFunction === 'Information' && (
            <DatasetInformation csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Statistics' && (
            <DatasetStatistics csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Corelation' && (
            <DatasetCorrelation csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Duplicate' && (
            <DatasetDuplicates csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Group' && (
            <DatasetGroup csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'EDA' && (
            <UnifiedEDA csvData={csvData} />
          )}
          {csvData &&
            activeFunction &&
            activeFunction === 'Bar Plot' && (
              <BarPlot csvData={csvData} />
            )}
          {csvData && activeFunction && activeFunction === 'Pie Plot' && (
            <PiePlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Box Plot' && (
            <BoxPlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Histogram' && (
            <Histogram csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Violin Plot' && (
            <ViolinPlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Scatter Plot' && (
            <ScatterPlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Reg Plot' && (
            <RegPlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Line Plot' && (
            <LinePlot csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'Venn Diagram' && (
            <VennDiagram csvData={csvData} />
          )}
          {csvData &&
            activeFunction &&
            (activeFunction === 'Add/Modify' ||
              activeFunction === 'Feature Engineering' ||
              activeFunction === 'Change Dtype' ||
              activeFunction === 'Alter Field Name' ||
              activeFunction === 'Imputation' ||
              activeFunction === 'Encoding' ||
              activeFunction === 'Scaling' ||
              activeFunction === 'Drop Column' ||
              activeFunction === 'Drop Rows' ||
              activeFunction === 'Append Dataset' ||
              activeFunction === 'Merge Dataset' ||
              activeFunction === 'Feature Selection' ||
              activeFunction === 'Cluster' ||
              activeFunction === 'Best Scaler') && (
              <UnifiedFeatureEngineering csvData={csvData} />
            )}
          {csvData &&
            activeFunction &&
            (activeFunction === 'Split Dataset' ||
              activeFunction === 'Model Building' ||
              activeFunction === 'Build Model' ||
              activeFunction === 'Model Evaluation' ||
              activeFunction === 'Model Prediction' ||
              activeFunction === 'Models') && (
              <ModelBuildingWorkflow csvData={csvData} />
            )}
          {csvData &&
            activeFunction &&
            activeFunction === 'Time Series Analysis' && (
              <TimeSeriesAnalysis csvData={csvData} />
            )}
          {csvData && activeFunction && activeFunction === 'ReverseML' && (
            <ReverseML csvData={csvData} />
          )}
          {csvData && activeFunction && activeFunction === 'PSO' && (
            <PSO csvData={csvData} />
          )}{' '}
          {csvData &&
            activeFunction &&
            activeFunction === 'SMILES Generation' && (
              <SMILESGeneration csvData={csvData} />
            )}{' '}
          {csvData &&
            activeFunction &&
            activeFunction === 'SMILES to IUPAC' && (
              <SMILEStoIUPAC csvData={csvData} />
            )}
          {csvData &&
            activeFunction &&
            activeFunction === 'SMILES to Synthetic Score' && (
              <SMILESToSyntheticScore csvData={csvData} />
            )}
                {csvData &&
                  activeFunction &&
                  activeFunction === 'SMILES to DFT' && (
                    <SMILESToDFT csvData={csvData} />
                  )}
          {csvData &&
            activeFunction &&
            activeFunction === 'SMILES Structure' && (
              <SMILESMolecularStructure csvData={csvData} />
            )}
          {csvData &&
            activeFunction &&
            activeFunction === 'Feature Selection' && (
              <FeatureSelection csvData={csvData} />
            )}
          {activeFunction && activeFunction === 'Final Dataset' && (
            <FinalDataset />
          )}
          {csvData &&
            activeFunction &&
            activeFunction === 'Model Deployment' && (
              <ModelDeployment csvData={csvData} />
            )}
        </>
      ) : !isLoading && activeFunction && activeFile && !hasCsvRows ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">
              No data available for the selected file.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please check if the file has rows and try again.
            </p>
          </div>
        </div>
      ) : showWorkspaceScreen ? (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="w-full max-w-md justify-self-center space-y-2">
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#eef9ff] text-[#0D9488] flex items-center justify-center">
                      <PlusCircle size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Create Project</p>
                      <p className="text-xs text-gray-500">Set up a new project from scratch.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowProjectsModal(true)}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#e6f7f4] text-[#0D9488] flex items-center justify-center">
                      <FolderOpen size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Projects</p>
                      <p className="text-xs text-gray-500">Browse and open existing projects.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSampleError(null);
                    setShowSampleModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#0D9488] flex items-center justify-center">
                      <FlaskConical size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Try Sample</p>
                      <p className="text-xs text-gray-500">Start with a ready-to-use sample workflow.</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="w-full max-w-md justify-self-center rounded-lg border border-gray-200 bg-white p-3">
                <h2 className="text-sm font-semibold text-gray-900">Recent Projects</h2>
                {recentProjects.length > 0 ? (
                  <div className="mt-2 divide-y divide-gray-100">
                    {recentProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => navigate(`/dashboard/${project.id}`)}
                        className="w-full text-left py-2 px-1 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-[#0D9488] truncate">{project.name || 'Untitled project'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {project.description || new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No recent projects yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : showBlankProjectPanel ? (
        <div className="h-full w-full bg-white" />
      ) : null}

      {/* Projects list modal */}
      {showProjectsModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowProjectsModal(false); setEditingId(null); setFormName(''); setFormDescription(''); }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[75vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-base font-semibold text-gray-900">
                My Projects
                {projects.length > 0 && <span className="ml-1.5 text-xs font-normal text-gray-400">({projects.length})</span>}
              </h2>
              <button
                type="button"
                onClick={() => { setShowProjectsModal(false); setEditingId(null); }}
                className="w-7 h-7 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all hover:scale-110"
              >
                <X size={14} />
              </button>
            </div>
            {/* Search & filter */}
            <div className="px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:bg-white outline-none transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`w-8 h-8 rounded border flex items-center justify-center transition-all hover:scale-110 ${showFavoritesOnly ? 'border-yellow-300 bg-yellow-50 text-yellow-500' : 'border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300'}`}
                  title={showFavoritesOnly ? 'Show all' : 'Show starred only'}
                >
                  <Star size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            {/* Project list */}
            <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0 border-t border-gray-100">
              {filteredProjects.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400">{projects.length === 0 ? 'No projects yet.' : 'No results found.'}</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {visibleProjects.map((project) => (
                      <div key={project.id}>
                        {editingId === project.id ? (
                          <div className="py-3 space-y-2">
                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none" placeholder="Project name" autoFocus />
                            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none resize-none" placeholder="Description" />
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => { setEditingId(null); setFormName(''); setFormDescription(''); }} className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
                              <button type="button" onClick={handleSaveEdit} disabled={!formName.trim()} className="px-3 py-1 text-xs text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] disabled:opacity-50">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center gap-3 py-3 cursor-pointer transition-colors ${projectId === project.id ? '' : 'hover:bg-gray-50'} -mx-5 px-5`}
                            onClick={() => { setShowProjectsModal(false); navigate(`/dashboard/${project.id}`); }}
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${projectId === project.id ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {(project.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium truncate text-[13px] ${projectId === project.id ? 'text-[#0D9488]' : 'text-gray-900'}`}>{project.name || 'Untitled'}</p>
                              <p className="text-[11px] text-gray-400 truncate">{project.description || new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(project, e)}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 ${project.isFavorite ? 'border-yellow-300 bg-yellow-50 text-yellow-500' : 'border-gray-200 bg-white text-gray-400 hover:text-yellow-500 hover:border-yellow-300'}`}
                                title={project.isFavorite ? 'Unstar' : 'Star'}
                              >
                                <Star size={12} fill={project.isFavorite ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(project)}
                                className="w-6 h-6 rounded border border-[#0D9488]/30 bg-white flex items-center justify-center text-[#0D9488] hover:bg-[#0D9488]/10 transition-all hover:scale-110"
                                title="Edit"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); setShowDeleteModal(true); }}
                                className="w-6 h-6 rounded border border-red-300 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {filteredProjects.length > PAGE_SIZE && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                      <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110">‹</button>
                      <span>{currentPage} / {totalPages}</span>
                      <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all hover:scale-110">›</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create project modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setFormName(''); setFormDescription(''); setEditingId(null); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{modalTitle}</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label htmlFor="create-project-name" className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  id="create-project-name"
                  type="text"
                  placeholder="My project"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="create-project-desc" className="block text-xs font-medium text-gray-500 mb-1">Description <span className="text-gray-300">(optional)</span></label>
                <textarea
                  id="create-project-desc"
                  placeholder="What is this project about?"
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] focus:bg-white outline-none resize-none transition-colors"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowCreateModal(false); setFormName(''); setFormDescription(''); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
              <button type="button" onClick={modalPrimaryAction} disabled={!formName.trim()} className="px-4 py-2 text-sm bg-[#0D9488] text-white rounded-lg font-medium hover:bg-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{modalPrimaryLabel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sample project modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !sampleLoading && setShowSampleModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Try a sample</h2>
              <button type="button" disabled={sampleLoading} onClick={() => setShowSampleModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {sampleError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{sampleError.error || sampleError.message || 'Failed to create sample project.'}</p>}
              {[
                { type: 'classification', label: 'Classification', description: 'Sample dataset for classification tasks.' },
                { type: 'regression', label: 'Regression', description: 'Sample dataset for regression tasks.' },
                { type: 'graph', label: 'Graph', description: 'Sample dataset for graph workflows.' },
              ].map(({ type, label, description }) => (
                <button
                  key={type}
                  type="button"
                  disabled={sampleLoading}
                  onClick={async () => {
                    setSampleError(null);
                    setSampleLoading(true);
                    try {
                      let created;
                      if (guest) {
                        const pid = generateUUID();
                        created = await commonApi.projects.seedGuestSample(pid, type);
                        if (created && created.id) {
                          const guestProject = { ...created, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_favorite: false };
                          const existing = JSON.parse(localStorage.getItem(GUEST_PROJECTS_KEY) || '[]');
                          existing.push(guestProject);
                          localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(existing));
                        }
                      } else {
                        created = await commonApi.projects.createSample(type);
                      }
                      if (created && created.id) {
                        setShowSampleModal(false);
                        setSampleError(null);
                        navigate(`/dashboard/${created.id}`);
                      } else {
                        const msg = created?.detail || created?.error || created?.message;
                        const isAuthErr = typeof msg === 'string' && /auth|credentials|login|unauthorized/i.test(msg);
                        setSampleError(isAuthErr ? { error: 'Please log in to continue.' } : (created || { error: 'Invalid response from server.' }));
                      }
                    } catch (err) {
                      const data = err?.response?.data || err?.data || {};
                      const msg = data.detail || data.error || data.message || err?.message;
                      const isAuthErr = typeof msg === 'string' && /auth|credentials|login|unauthorized/i.test(msg);
                      setSampleError(isAuthErr ? { error: 'Please log in to continue.' } : (data.error ? data : { error: msg || 'Failed to create sample project.' }));
                    } finally {
                      setSampleLoading(false);
                    }
                  }}
                  className="w-full text-left rounded-lg border border-gray-200 bg-white hover:border-[#0D9488]/40 hover:bg-[#f0fdfa] px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs text-white ${type === 'classification' ? 'bg-[#0D9488]' : type === 'regression' ? 'bg-amber-500' : 'bg-violet-500'}`}>{label.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-900">{label}</p>
                    <p className="text-[11px] text-gray-400">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal && Boolean(projectToDelete)}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        itemName={projectToDelete?.name || 'Untitled'}
        itemTypeLabel="project"
      />
    </div>
  );
}

export default DashBoardRight;
