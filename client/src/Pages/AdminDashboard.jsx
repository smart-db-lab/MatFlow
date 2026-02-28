import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { isAdminLoggedIn, logout, checkAdminStatus, getAuthHeaders } from "../util/adminAuth";
import { commonApi, serviceAdminApi } from "../services/api/apiService";
import AddArticle from "./AddArticle";
import FormattedText from "../Components/FormattedText";
import ConfirmDeleteModal from "../Components/ConfirmDeleteModal";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CircularProgress,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  InputLabel,
  FormControl,
  Select,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ImageIcon as LucideImageIcon,
  HandHelping,
  FilePlus,
  HelpCircle,
  LogOut,
  Home,
  Pencil,
  Trash2,
  Building2,
  Upload,
} from "lucide-react";
import { styled } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0D9488",
      light: "#5EEAD4",
      dark: "#0F766E",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0F766E",
      light: "#0D9488",
      dark: "#115E59",
    },
    background: {
      default: "#f0f2f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
    error: {
      main: "#ef4444",
    },
    success: {
      main: "#10b981",
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 500, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          backgroundImage: 'none',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: "#0D9488",
          "&:hover": {
            backgroundColor: "#0F766E",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          borderRadius: 3,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
  },
});

const drawerWidth = 260;

const StyledDataGrid = styled(DataGrid)(() => ({
  border: 0,
  fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  fontSize: '0.85rem',
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#f8fafc",
    borderBottom: '1px solid #e8edf3',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#64748b',
  },
  "& .MuiDataGrid-columnHeader": {
    borderRight: 'none',
  },
  "& .MuiDataGrid-cell": {
    borderBottom: '1px solid #f1f5f9',
    borderRight: 'none',
    color: '#334155',
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#f8fafc",
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: '1px solid #e8edf3',
  },
  "& .MuiPaginationItem-root": {
    borderRadius: 8,
  },
}));

function FileUploadField({ id, label, onChange, inputRef, required, helperText }) {
  const [fileName, setFileName] = useState(null);
  const handleClick = () => inputRef?.current?.click();
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
    onChange?.(e);
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      {label && (
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#475569', mb: 1 }}>
          {label}
        </Typography>
      )}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        id={id}
        onChange={handleChange}
        required={required}
        style={{ display: 'none' }}
      />
      <Box
        onClick={handleClick}
        sx={{
          border: '1.5px dashed #cbd5e1',
          borderRadius: '10px',
          px: 2.5,
          py: 2.5,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#f8fafc',
          '&:hover': { borderColor: '#94a3b8' },
        }}
      >
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px', bgcolor: '#e0f2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Upload size={16} color="#0284c7" strokeWidth={2} />
        </Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: fileName ? '#1e293b' : '#64748b', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
          {fileName || 'Click to upload a file'}
        </Typography>
        {helperText && (
          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {helperText}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function AdminDashboard({ serviceKey = "mlflow", title = "Admin Dashboard" }) {
  const navigate = useNavigate();
  const isMlflow = serviceKey === "mlflow";
  const enableArticles = isMlflow;
  const enableServices = isMlflow;
  const enableSupport = isMlflow;
  const enableHeroSection = true;
  const enableFAQ = true;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(
    enableArticles ? "articles" : "hero-section"
  );
  const [activeArticleTab, setActiveArticleTab] = useState(0);
  
  // Search and sort states for articles
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest"); // newest, oldest, title-asc, title-desc

  // Data states
  const [journals, setJournals] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [books, setBooks] = useState([]);
  const [patents, setPatents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [services, setServices] = useState([]);
  const [heroImages, setHeroImages] = useState([]);
  const [headerSection, setHeaderSection] = useState(null);
  const [supportLogos, setSupportLogos] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Loading states
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [loadingConferences, setLoadingConferences] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingPatents, setLoadingPatents] = useState(true);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingHeroImages, setLoadingHeroImages] = useState(true);
  const [loadingHeaderSection, setLoadingHeaderSection] = useState(true);
  const [loadingSupportLogos, setLoadingSupportLogos] = useState(true);
  const [loadingFAQs, setLoadingFAQs] = useState(true);

  // Modal states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddHeroImageModal, setShowAddHeroImageModal] = useState(false);
  const [showHeaderSectionModal, setShowHeaderSectionModal] = useState(false);
  const [showAddSupportLogoModal, setShowAddSupportLogoModal] = useState(false);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingHeroImage, setEditingHeroImage] = useState(null);
  const [editingSupportLogo, setEditingSupportLogo] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingArticleType, setEditingArticleType] = useState(null);
  const [showAddFAQModal, setShowAddFAQModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Check admin authentication (redundant with AdminRoute wrapper, kept as fallback)
  useEffect(() => {
    const checkAuth = async () => {
      const isAdmin = await checkAdminStatus();
      if (!isAdmin && !isAdminLoggedIn()) {
        navigate("/admin?redirect=" + encodeURIComponent("/admin-dashboard"));
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch all data (scoped by enabled sections)
  useEffect(() => {
    if (enableArticles) {
      fetchJournals();
      fetchConferences();
      fetchBooks();
      fetchPatents();
      fetchArticleDatasets();
    }
    if (enableServices) {
      fetchServices();
    }
    if (enableHeroSection) {
      fetchHeroImages();
      fetchHeaderSection();
    }
    if (enableSupport) {
      fetchSupportLogos();
    }
    if (enableFAQ) {
      fetchFAQs();
    }
  }, []);

  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";


  const fetchJournals = async () => {
    try {
      const data = await commonApi.articles.getJournals();
      setJournals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching journals:", error);
    } finally {
      setLoadingJournals(false);
    }
  };

  const fetchConferences = async () => {
    try {
      const data = await commonApi.articles.getConferences();
      setConferences(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching conferences:", error);
    } finally {
      setLoadingConferences(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const data = await commonApi.articles.getBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchPatents = async () => {
    try {
      const data = await commonApi.articles.getPatents();
      setPatents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching patents:", error);
    } finally {
      setLoadingPatents(false);
    }
  };

  const fetchArticleDatasets = async () => {
    try {
      const data = await commonApi.articles.getDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await serviceAdminApi.services.getAll(serviceKey);
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchHeroImages = async () => {
    try {
      const data = await serviceAdminApi.landing.getHeroImages(serviceKey);
      // Ensure all items have required fields
      const sanitizedData = Array.isArray(data) 
        ? data.map((item, index) => ({
            id: item?.id || index,
            hero_image: item?.hero_image || null,
            created_at: item?.created_at || null,
            ...item
          }))
        : [];
      setHeroImages(sanitizedData);
    } catch (error) {
      console.error("Error fetching hero images:", error);
      setHeroImages([]);
    } finally {
      setLoadingHeroImages(false);
    }
  };

  const fetchHeaderSection = async () => {
    try {
      const data = await serviceAdminApi.landing.getHeaderSection(serviceKey);
      // Get the first (most recent) header section
      setHeaderSection(data || null);
    } catch (error) {
      console.error("Error fetching header section:", error);
      setHeaderSection(null);
    } finally {
      setLoadingHeaderSection(false);
    }
  };

  const fetchSupportLogos = async () => {
    try {
      const data = await serviceAdminApi.landing.getSupportLogos(serviceKey);
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.id ?? 0) - (a.id ?? 0))
        : [];
      setSupportLogos(sorted);
    } catch (error) {
      console.error("Error fetching support logos:", error);
      setSupportLogos([]);
    } finally {
      setLoadingSupportLogos(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const data = await serviceAdminApi.faq.getAll(serviceKey);
      setFaqs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs([]);
    } finally {
      setLoadingFAQs(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success(result.message || "Logged out successfully");
      navigate("/");
    }
  };

  // File operations

  // Service operations
  const handleDeleteService = (serviceId, serviceName) => {
    setDeleteTarget({
      title: "Delete service",
      itemName: serviceName,
      onConfirm: async () => {
        try {
          const success = await commonApi.services.delete(serviceId);
          if (success) {
            toast.success("Service deleted!");
            fetchServices();
          }
        } catch (error) {
          toast.error("Error deleting service");
        }
      },
    });
  };

  const handleSaveService = async (serviceData) => {
    try {
      const responseData = editingService
        ? await serviceAdminApi.services.update(editingService.id, serviceData, serviceKey)
        : await serviceAdminApi.services.create(serviceData, serviceKey);

      if (responseData && !responseData.error) {
        toast.success(editingService ? "Service updated!" : "Service added!");
        setShowAddServiceModal(false);
        setEditingService(null);
        fetchServices();
      } else {
        let errorMessage = editingService ? "Failed to update service" : "Failed to add service";
        if (responseData) {
          // Handle backend response format: {success: false, error: {...}}
          if (responseData.error) {
            if (typeof responseData.error === 'object') {
              const firstErrorKey = Object.keys(responseData.error)[0];
              const firstError = responseData.error[firstErrorKey];
              if (Array.isArray(firstError)) {
                errorMessage = `${firstErrorKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                errorMessage = `${firstErrorKey}: ${firstError}`;
              } else {
                errorMessage = JSON.stringify(responseData.error);
              }
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
            const firstErrorKey = Object.keys(responseData)[0];
            const firstError = responseData[firstErrorKey];
            if (Array.isArray(firstError)) {
              errorMessage = `${firstErrorKey}: ${firstError[0]}`;
            } else {
              errorMessage = `${firstErrorKey}: ${firstError}`;
            }
          }
        }
        console.error('Service save error:', responseData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error("Error saving service: " + error.message);
    }
  };

  // Header section operations
  const handleSaveHeaderSection = async (headerData) => {
    try {
      const responseData = headerSection
        ? await serviceAdminApi.landing.updateHeaderSection(headerSection.id, headerData, serviceKey)
        : await serviceAdminApi.landing.createHeaderSection(headerData, serviceKey);

      if (responseData && !responseData.error) {
        toast.success(headerSection ? "Header section updated!" : "Header section added!");
        setShowHeaderSectionModal(false);
        fetchHeaderSection();
        // Dispatch custom event to notify navbar to refresh
        window.dispatchEvent(new Event('headerSectionUpdated'));
      } else {
        let errorMessage = headerSection ? "Failed to update header section" : "Failed to add header section";
        if (responseData) {
          if (responseData.error) {
            if (typeof responseData.error === 'object') {
              const firstErrorKey = Object.keys(responseData.error)[0];
              const firstError = responseData.error[firstErrorKey];
              if (Array.isArray(firstError)) {
                errorMessage = `${firstErrorKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                errorMessage = `${firstErrorKey}: ${firstError}`;
              } else {
                errorMessage = JSON.stringify(responseData.error);
              }
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        }
        console.error('Header section save error:', responseData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving header section:', error);
      toast.error("Error saving header section: " + error.message);
    }
  };

  // Support logo operations
  const handleDeleteSupportLogo = (supportLogoId) => {
    setDeleteTarget({
      title: "Delete support logo",
      itemName: "this support logo",
      onConfirm: async () => {
        try {
          const success = await serviceAdminApi.landing.deleteSupportLogo(supportLogoId, serviceKey);
          if (success) {
            toast.success("Support logo deleted!");
            fetchSupportLogos();
          }
        } catch (error) {
          toast.error("Error deleting support logo");
        }
      },
    });
  };

  const handleSaveSupportLogo = async (supportLogoData) => {
    try {
      const responseData = editingSupportLogo
        ? await serviceAdminApi.landing.updateSupportLogo(editingSupportLogo.id, supportLogoData, serviceKey)
        : await serviceAdminApi.landing.createSupportLogo(supportLogoData, serviceKey);

      if (responseData && !responseData.error) {
        toast.success(editingSupportLogo ? "Support logo updated!" : "Support logo added!");
        setShowAddSupportLogoModal(false);
        setEditingSupportLogo(null);
        fetchSupportLogos();
      } else {
        let errorMessage = editingSupportLogo ? "Failed to update support logo" : "Failed to add support logo";
        if (responseData) {
          if (responseData.error) {
            if (typeof responseData.error === 'object') {
              const firstErrorKey = Object.keys(responseData.error)[0];
              const firstError = responseData.error[firstErrorKey];
              if (Array.isArray(firstError)) {
                errorMessage = `${firstErrorKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                errorMessage = `${firstErrorKey}: ${firstError}`;
              } else {
                errorMessage = JSON.stringify(responseData.error);
              }
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        }
        console.error('Support logo save error:', responseData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving support logo:', error);
      toast.error("Error saving support logo: " + error.message);
    }
  };

  // Hero image operations
  const handleDeleteHeroImage = (heroImageId) => {
    setDeleteTarget({
      title: "Delete hero image",
      itemName: "this hero image",
      onConfirm: async () => {
        try {
          const success = await serviceAdminApi.landing.deleteHeroImage(heroImageId, serviceKey);
          if (success) {
            toast.success("Hero image deleted!");
            fetchHeroImages();
          }
        } catch (error) {
          toast.error("Error deleting hero image");
        }
      },
    });
  };

  const handleSaveHeroImage = async (heroImageData) => {
    try {
      const responseData = editingHeroImage
        ? await serviceAdminApi.landing.updateHeroImage(editingHeroImage.id, heroImageData, serviceKey)
        : await serviceAdminApi.landing.createHeroImage(heroImageData, serviceKey);

      if (responseData && !responseData.error) {
        toast.success(editingHeroImage ? "Hero image updated!" : "Hero image added!");
        setShowAddHeroImageModal(false);
        setEditingHeroImage(null);
        fetchHeroImages();
      } else {
        let errorMessage = editingHeroImage ? "Failed to update hero image" : "Failed to add hero image";
        if (responseData) {
          if (responseData.error) {
            if (typeof responseData.error === 'object') {
              const firstErrorKey = Object.keys(responseData.error)[0];
              const firstError = responseData.error[firstErrorKey];
              if (Array.isArray(firstError)) {
                errorMessage = `${firstErrorKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                errorMessage = `${firstErrorKey}: ${firstError}`;
              } else {
                errorMessage = JSON.stringify(responseData.error);
              }
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        }
        console.error('Hero image save error:', responseData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving hero image:', error);
      toast.error("Error saving hero image: " + error.message);
    }
  };

  // Article operations
  const handleDeleteArticle = (articleType, articleId, title) => {
    setDeleteTarget({
      title: `Delete ${articleType}`,
      itemName: title,
      onConfirm: async () => {
        try {
          const typeMap = {
            "Journals": "Journal",
            "Conferences": "Conference",
            "Books": "Book",
            "Patents": "Patent",
            "Datasets": "Dataset",
            "Journal": "Journal",
            "Conference": "Conference",
            "Book": "Book",
            "Patent": "Patent",
            "Dataset": "Dataset",
          };
          const singularType = typeMap[articleType] || articleType;
          let deleted = false;
          switch (singularType) {
            case "Journal": deleted = await commonApi.articles.deleteJournal(articleId); break;
            case "Conference": deleted = await commonApi.articles.deleteConference(articleId); break;
            case "Book": deleted = await commonApi.articles.deleteBook(articleId); break;
            case "Patent": deleted = await commonApi.articles.deletePatent(articleId); break;
            case "Dataset": deleted = await commonApi.articles.deleteDataset(articleId); break;
            default:
              toast.error(`Unknown article type: ${articleType}`);
              return;
          }
          if (deleted) {
            toast.success(`${singularType} deleted successfully!`);
            fetchJournals();
            fetchConferences();
            fetchBooks();
            fetchPatents();
            fetchArticleDatasets();
          } else {
            toast.error(`Error deleting ${singularType}`);
          }
        } catch (error) {
          console.error("Delete error:", error);
          toast.error(`Error deleting article: ${error.message}`);
        }
      },
    });
  };

  // FAQ operations
  const handleSaveFAQ = async (faqData) => {
    try {
      if (editingFAQ) {
        await serviceAdminApi.faq.update(editingFAQ.id, faqData, serviceKey);
        toast.success("FAQ updated successfully!");
      } else {
        await serviceAdminApi.faq.create(faqData, serviceKey);
        toast.success("FAQ created successfully!");
      }
      setShowAddFAQModal(false);
      setEditingFAQ(null);
      fetchFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error(`Error saving FAQ: ${error.message}`);
    }
  };

  const handleDeleteFAQ = (faqId, question) => {
    setDeleteTarget({
      title: "Delete FAQ",
      itemName: question,
      onConfirm: async () => {
        try {
          const deleted = await serviceAdminApi.faq.delete(faqId, serviceKey);
          if (deleted) {
            toast.success("FAQ deleted successfully!");
            fetchFAQs();
          } else {
            toast.error("Error deleting FAQ");
          }
        } catch (error) {
          console.error("Delete FAQ error:", error);
          toast.error(`Error deleting FAQ: ${error.message}`);
        }
      },
    });
  };

  const handleMoveFAQ = async (faqId, direction) => {
    const sorted = [...faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.id - a.id);
    const currentIndex = sorted.findIndex((f) => f.id === faqId);
    if (currentIndex < 0) return;
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const currentFaq = sorted[currentIndex];
    const swapFaq = sorted[swapIndex];
    try {
      await Promise.all([
        serviceAdminApi.faq.update(currentFaq.id, { order: swapFaq.order ?? 0 }, serviceKey),
        serviceAdminApi.faq.update(swapFaq.id, { order: currentFaq.order ?? 0 }, serviceKey),
      ]);
      fetchFAQs();
    } catch (error) {
      console.error("Error reordering FAQ:", error);
      toast.error("Error reordering FAQ");
    }
  };

  const buildSupportOrderForm = (order) => {
    const formData = new FormData();
    formData.append("order", String(order));
    return formData;
  };

  const handleMoveSupportLogo = async (logoId, direction) => {
    const sorted = [...supportLogos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.id - a.id);
    const currentIndex = sorted.findIndex((s) => s.id === logoId);
    if (currentIndex < 0) return;
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const currentLogo = sorted[currentIndex];
    const swapLogo = sorted[swapIndex];
    try {
      await Promise.all([
        serviceAdminApi.landing.updateSupportLogo(currentLogo.id, buildSupportOrderForm(swapLogo.order ?? 0), serviceKey),
        serviceAdminApi.landing.updateSupportLogo(swapLogo.id, buildSupportOrderForm(currentLogo.order ?? 0), serviceKey),
      ]);
      fetchSupportLogos();
    } catch (error) {
      console.error("Error reordering support logos:", error);
      toast.error("Error reordering support logos");
    }
  };

  const handleSaveArticle = async (articleData, articleType, articleId) => {
    try {
      let apiUrl = "";
      switch (articleType) {
        case "Journal": apiUrl = `${baseUrl}/api/journals/${articleId}/`; break;
        case "Conference": apiUrl = `${baseUrl}/api/conferences/${articleId}/`; break;
        case "Book": apiUrl = `${baseUrl}/api/books/${articleId}/`; break;
        case "Patent": apiUrl = `${baseUrl}/api/patents/${articleId}/`; break;
        case "Dataset": apiUrl = `${baseUrl}/api/datasets/${articleId}/`; break;
      }
      
      // Handle file upload for datasets
      let requestBody;
      let headers = { ...getAuthHeaders() };
      
      if (articleType === "Dataset" && articleData instanceof FormData) {
        requestBody = articleData;
        // Don't set Content-Type header, browser will set it with boundary for FormData
        delete headers["Content-Type"];
      } else {
        requestBody = JSON.stringify(articleData);
        headers["Content-Type"] = "application/json";
      }
      
      console.log("Updating article:", articleType, articleId);
      console.log("Request body:", articleData instanceof FormData ? "FormData" : JSON.stringify(articleData, null, 2));
      if (articleData.formatting_metadata) {
        console.log("Formatting metadata in update request:", JSON.stringify(articleData.formatting_metadata, null, 2));
      }
      
      let responseData = {};
      try {
        switch (articleType) {
          case "Journal": responseData = await commonApi.articles.updateJournal(articleId, articleData); break;
          case "Conference": responseData = await commonApi.articles.updateConference(articleId, articleData); break;
          case "Book": responseData = await commonApi.articles.updateBook(articleId, articleData); break;
          case "Patent": responseData = await commonApi.articles.updatePatent(articleId, articleData); break;
          case "Dataset": responseData = await commonApi.articles.updateDataset(articleId, articleData, articleData instanceof FormData ? articleData : null); break;
        }
      } catch (parseError) {
        console.error('Failed to update article:', parseError);
        throw parseError;
      }

      if (responseData) {
        toast.success(`${articleType} updated!`);
        setShowAddArticleModal(false);
        setEditingArticle(null);
        setEditingArticleType(null);
        fetchJournals();
        fetchConferences();
        fetchBooks();
        fetchPatents();
        fetchArticleDatasets();
      } else {
        let errorMessage = `Failed to update ${articleType.toLowerCase()}`;
        if (responseData) {
          if (responseData.error) {
            if (typeof responseData.error === 'object') {
              const firstErrorKey = Object.keys(responseData.error)[0];
              const firstError = responseData.error[firstErrorKey];
              if (Array.isArray(firstError)) {
                errorMessage = `${firstErrorKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                errorMessage = `${firstErrorKey}: ${firstError}`;
              } else {
                errorMessage = JSON.stringify(responseData.error);
              }
            } else {
              errorMessage = responseData.error;
            }
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        }
        console.error('Article update error:', responseData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(`Error updating ${articleType.toLowerCase()}: ${error.message}`);
    }
  };


  // DataGrid columns for services
  const serviceColumns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "service_logo",
      headerName: "Logo",
      width: 100,
      renderCell: (params) => (
        <Avatar
          src={params.value ? (params.value.startsWith("http") ? params.value : `${baseUrl}${params.value}`) : null}
          sx={{ width: 40, height: 40 }}
        >
          <Building2 size={20} color="#94a3b8" />
        </Avatar>
      ),
    },
    { field: "service_name", headerName: "Service Name", flex: 1, minWidth: 200 },
    { field: "service_description", headerName: "Description", flex: 1, minWidth: 250 },
    { field: "service_url", headerName: "URL", flex: 1, minWidth: 200 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      pinned: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.75 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setEditingService(params.row);
                setShowAddServiceModal(true);
              }}
              sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 30, height: 30 }}
            >
              <Pencil size={14} color="#6366f1" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteService(params.row.id, params.row.service_name)}
              sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 30, height: 30 }}
            >
              <Trash2 size={14} color="#ef4444" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // DataGrid columns for hero images
  const heroImageColumns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "hero_image",
      headerName: "Image",
      flex: 1,
      minWidth: 300,
      renderCell: (params) => {
        try {
          const imageUrl = params.value 
            ? (params.value.startsWith("http") ? params.value : `${baseUrl}${params.value}`)
            : null;
          return (
            <Box sx={{ py: 0.5, display: 'flex', alignItems: 'center' }}>
              <img
                src={imageUrl}
                alt="Hero"
                style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 8, background: '#f1f5f9' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </Box>
          );
        } catch (error) {
          return (
            <Box sx={{ width: 100, height: 56, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LucideImageIcon size={22} color="#94a3b8" />
            </Box>
          );
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      pinned: "right",
      renderCell: (params) => {
        if (!params?.row?.id) return null;
        return (
          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setEditingHeroImage(params.row);
                  setShowAddHeroImageModal(true);
                }}
                sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 30, height: 30 }}
              >
                <Pencil size={14} color="#6366f1" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteHeroImage(params.row.id)}
                sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 30, height: 30 }}
              >
                <Trash2 size={14} color="#ef4444" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // DataGrid columns for support logos
  const supportLogoColumns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "support_logo",
      headerName: "Logo",
      flex: 1,
      minWidth: 300,
      renderCell: (params) => {
        try {
          const logoUrl = params.value 
            ? (params.value.startsWith("http") ? params.value : `${baseUrl}${params.value}`)
            : null;
          return (
            <Box sx={{ py: 0.5, display: 'flex', alignItems: 'center' }}>
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: 80, height: 48, objectFit: 'contain', borderRadius: 8, background: '#f1f5f9', padding: 4 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </Box>
          );
        } catch (error) {
          return (
            <Box sx={{ width: 80, height: 48, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LucideImageIcon size={20} color="#94a3b8" />
            </Box>
          );
        }
      },
    },
    { field: "order", headerName: "Order", width: 90 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      pinned: "right",
      renderCell: (params) => {
        if (!params?.row?.id) return null;
        const sorted = [...supportLogos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.id - a.id);
        const idx = sorted.findIndex((s) => s.id === params.row.id);
        const isFirst = idx === 0;
        const isLast = idx === sorted.length - 1;
        return (
          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Tooltip title="Move Up">
              <span>
                <IconButton size="small" disabled={isFirst} onClick={() => handleMoveSupportLogo(params.row.id, "up")}>
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move Down">
              <span>
                <IconButton size="small" disabled={isLast} onClick={() => handleMoveSupportLogo(params.row.id, "down")}>
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setEditingSupportLogo(params.row);
                  setShowAddSupportLogoModal(true);
                }}
                sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 30, height: 30 }}
              >
                <Pencil size={14} color="#6366f1" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteSupportLogo(params.row.id)}
                sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 30, height: 30 }}
              >
                <Trash2 size={14} color="#ef4444" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const faqColumns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "question",
      headerName: "Question",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "answer",
      headerName: "Answer",
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.value?.length > 100 ? `${params.value.substring(0, 100)}...` : params.value}
        </Box>
      ),
    },
    { field: "order", headerName: "Order", width: 90 },
    {
      field: "is_active",
      headerName: "Active",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => {
        if (!params?.row?.id) return null;
        const sorted = [...faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.id - a.id);
        const idx = sorted.findIndex((f) => f.id === params.row.id);
        const isFirst = idx === 0;
        const isLast = idx === sorted.length - 1;
        return (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Move Up">
              <span>
                <IconButton size="small" disabled={isFirst} onClick={() => handleMoveFAQ(params.row.id, "up")}>
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move Down">
              <span>
                <IconButton size="small" disabled={isLast} onClick={() => handleMoveFAQ(params.row.id, "down")}>
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setEditingFAQ(params.row);
                  setShowAddFAQModal(true);
                }}
                sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 28, height: 28 }}
              >
                <Pencil size={13} color="#6366f1" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteFAQ(params.row.id, params.row.question)}
                sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 28, height: 28 }}
              >
                <Trash2 size={13} color="#ef4444" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // Article columns generator
  const getArticleColumns = (type) => {
    const baseColumns = [
    { field: "id", headerName: "ID", width: 70 },
    { 
      field: "title", 
      headerName: "Title", 
      flex: 1, 
      minWidth: 250,
      renderCell: (params) => {
        const formatting = params.row.formatting_metadata?.title;
        return (
          <FormattedText 
            text={params.value || ""} 
            formatting={formatting}
            className="text-sm"
          />
        );
      }
    },
    { 
      field: type === "Patents" ? "inventors" : type === "Datasets" ? "originators" : "authors", 
      headerName: type === "Patents" ? "Inventors" : type === "Datasets" ? "Originators" : "Authors", 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const formattingKey = type === "Patents" ? "inventors" : type === "Datasets" ? "originators" : "authors";
        const formatting = params.row.formatting_metadata?.[formattingKey];
        return (
          <FormattedText 
            text={params.value || ""} 
            formatting={formatting}
            className="text-sm"
          />
        );
      }
    },
    { field: "publication_date", headerName: "Date", width: 120 },
    ];
    
    // Add DOI column for journals
    if (type === "Journals") {
      baseColumns.push({
        field: "doi",
        headerName: "DOI",
        width: 250,
        renderCell: (params) => {
          if (params.value) {
            const doiValue = params.value.startsWith('http') ? params.value : params.value.startsWith('doi:') ? params.value : `doi:${params.value}`;
            const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
            return (
              <a 
                href={doiUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                {doiValue}
              </a>
            );
          }
          return <span style={{ color: '#999' }}>No DOI</span>;
        },
      });
    }
    
    // Add doi column for conferences
    if (type === "Conferences") {
      baseColumns.push({
        field: "doi",
        headerName: "DOI",
        width: 200,
        renderCell: (params) => {
          if (params.value) {
            const doiValue = params.value.startsWith('http') ? params.value : params.value.startsWith('doi:') ? params.value : `doi:${params.value}`;
            const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
            return (
              <a 
                href={doiUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                {doiValue}
              </a>
            );
          }
          return <span style={{ color: '#999' }}>No DOI</span>;
        },
      });
    }
    
    // Add doi column for books
    if (type === "Books") {
      baseColumns.push({
        field: "doi",
        headerName: "DOI",
        width: 200,
        renderCell: (params) => {
          if (params.value) {
            const doiValue = params.value.startsWith('http') ? params.value : params.value.startsWith('doi:') ? params.value : `doi:${params.value}`;
            const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
            return (
              <a 
                href={doiUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                {doiValue}
              </a>
            );
          }
          return <span style={{ color: '#999' }}>No DOI</span>;
        },
      });
    }
    
    // Add patent_link column for patents
    if (type === "Patents") {
      baseColumns.push({
        field: "patent_link",
        headerName: "Patent Link",
        width: 200,
        renderCell: (params) => {
          if (params.value) {
            return (
              <a 
                href={params.value} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                View Patent
              </a>
            );
          }
          return <span style={{ color: '#999' }}>No link</span>;
        },
      });
    }
    
    baseColumns.push({
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      pinned: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.75 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setEditingArticle(params.row);
                setEditingArticleType(type);
                setShowAddArticleModal(true);
              }}
              sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 30, height: 30 }}
            >
              <Pencil size={14} color="#6366f1" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteArticle(type, params.row.id, params.row.title)}
              sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 30, height: 30 }}
            >
              <Trash2 size={14} color="#ef4444" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    });
    
    return baseColumns;
  };

  const SidebarIcon = ({ icon: Icon, color, bg }) => (
    <Box sx={{
      width: 32, height: 32, borderRadius: '8px', bgcolor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={16} color={color} strokeWidth={2} />
    </Box>
  );

  const drawerItems = [
    ...(enableArticles
      ? [{ text: "Articles", icon: <SidebarIcon icon={FileText} color="#6366f1" bg="#eef2ff" />, section: "articles" }]
      : []),
    ...(enableServices
      ? [{ text: "Services", icon: <SidebarIcon icon={Briefcase} color="#0d9488" bg="#f0fdfa" />, section: "services" }]
      : []),
    ...(enableHeroSection
      ? [{ text: "Hero Section", icon: <SidebarIcon icon={LucideImageIcon} color="#f59e0b" bg="#fffbeb" />, section: "hero-section" }]
      : []),
    ...(enableSupport
      ? [{ text: "Support", icon: <SidebarIcon icon={HandHelping} color="#ec4899" bg="#fdf2f8" />, section: "support" }]
      : []),
    ...(enableArticles
      ? [{ text: "Add Article", icon: <SidebarIcon icon={FilePlus} color="#10b981" bg="#ecfdf5" />, section: "add-article" }]
      : []),
    ...(enableFAQ
      ? [{ text: "FAQ", icon: <SidebarIcon icon={HelpCircle} color="#8b5cf6" bg="#f5f3ff" />, section: "faq" }]
      : []),
  ];

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      bgcolor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ 
        px: 2.5, 
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: '64px',
      }}>
        <Box sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: '#0D9488',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <LayoutDashboard size={18} color="#fff" strokeWidth={2.2} />
        </Box>
        <Typography noWrap sx={{ 
          fontWeight: 700,
          fontSize: '1.125rem',
          color: '#1e293b',
          letterSpacing: '-0.01em',
        }}>
          {serviceKey === "matflow" ? "Matflow" : "MLFlow"}
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, pt: 2, pb: 1 }}>
        <Typography sx={{ 
          fontSize: '0.7rem', 
          fontWeight: 600, 
          color: '#94a3b8', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em',
          px: 1.5,
          mb: 1,
        }}>
          {serviceKey === "matflow" ? "Matflow Management" : "Management"}
        </Typography>
      </Box>
      <List sx={{ 
        px: 1.5,
        py: 0,
        flex: 1,
      }}>
        {drawerItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton 
              selected={activeSection === item.section} 
              onClick={() => setActiveSection(item.section)}
              sx={{
                borderRadius: '10px',
                py: 1,
                px: 1.5,
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  bgcolor: 'rgba(13, 148, 136, 0.08)',
                  color: '#0D9488',
                  '&:hover': {
                    bgcolor: 'rgba(13, 148, 136, 0.12)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#0D9488',
                  },
                },
                '&:hover': {
                  bgcolor: '#f8fafc',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '42px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: activeSection === item.section ? 600 : 450,
                  color: activeSection === item.section ? '#0D9488' : '#475569',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: '#f1f5f9', mx: 2 }} />
      <List sx={{ px: 1.5, py: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              borderRadius: '10px',
              py: 1,
              px: 1.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.06)',
                '& .MuiListItemIcon-root': { color: '#ef4444' },
                '& .MuiListItemText-primary': { color: '#ef4444' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: '42px' }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px', bgcolor: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={16} color="#ef4444" strokeWidth={2} />
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{
                fontSize: '0.85rem',
                fontWeight: 450,
                color: '#475569',
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Helper function to filter and sort articles
  const filterAndSortArticles = (articles) => {
    if (!articles || !Array.isArray(articles)) return [];
    
    // Filter by search query
    let filtered = articles;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = articles.filter(article => {
        const title = (article.title || '').toLowerCase();
        const authors = (article.authors || article.inventors || article.originators || '').toLowerCase();
        const journal = (article.journal_name || article.conference_name || '').toLowerCase();
        return title.includes(query) || authors.includes(query) || journal.includes(query);
      });
    }
    
    // Sort articles
    let sorted = [...filtered];
    switch (sortOption) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.publication_date || '';
          const dateB = b.publication_date || '';
          return dateB.localeCompare(dateA);
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = a.publication_date || '';
          const dateB = b.publication_date || '';
          return dateA.localeCompare(dateB);
        });
        break;
      case 'title-asc':
        sorted.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });
        break;
      case 'title-desc':
        sorted.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleB.localeCompare(titleA);
        });
        break;
      default:
        break;
    }
    
    return sorted;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "articles":
        const articleTabs = ["Journals", "Conferences", "Books", "Patents", "Datasets"];
        const articleData = [journals, conferences, books, patents, datasets];
        const articleLoading = [loadingJournals, loadingConferences, loadingBooks, loadingPatents, loadingDatasets];
        
        // Get current tab's articles and apply filter/sort
        const currentArticles = articleData[activeArticleTab] || [];
        const filteredAndSortedArticles = filterAndSortArticles(currentArticles);

        return (
          <>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: '14px',
                border: '1px solid #e8edf3',
                background: 'white',
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  mb: 2.5,
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                }}
              >
                Articles
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  sx={{ 
                    flexGrow: 1, 
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: '#0D9488' },
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 170,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: '#0D9488' },
                    }
                  }}
                >
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortOption}
                    label="Sort By"
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                    <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Tabs value={activeArticleTab} onChange={(e, v) => setActiveArticleTab(v)} sx={{ mb: 3 }}>
                {articleTabs.map((tab, idx) => (
                  <Tab key={idx} label={tab} />
                ))}
              </Tabs>
              {articleLoading[activeArticleTab] ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <StyledDataGrid
                  rows={filteredAndSortedArticles}
                  columns={getArticleColumns(articleTabs[activeArticleTab])}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  autoHeight
                  disableSelectionOnClick
                />
              )}
            </Paper>
            {showAddArticleModal && (
              <Dialog 
                open={showAddArticleModal} 
                onClose={() => {
                  setShowAddArticleModal(false);
                  setEditingArticle(null);
                  setEditingArticleType(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: {
                    maxHeight: '85vh',
                    overflow: 'auto'
                  }
                }}
              >
                <DialogTitle sx={{ pb: 1, pr: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" component="span">
                    {editingArticle ? "Edit Article" : "Add Article"}
                  </Typography>
                  <IconButton
                    aria-label="close"
                    onClick={() => {
                      setShowAddArticleModal(false);
                      setEditingArticle(null);
                      setEditingArticleType(null);
                    }}
                    sx={{
                      color: (theme) => theme.palette.grey[500],
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                  <AddArticle 
                    key={editingArticleType || 'new'} // Force remount when editingArticleType changes
                    embedded={true} 
                    editingArticle={editingArticle}
                    editingArticleType={editingArticleType}
                    onSave={handleSaveArticle}
                    onSuccess={() => {
                      // Refresh all article lists after successful submission
                      fetchJournals();
                      fetchConferences();
                      fetchBooks();
                      fetchPatents();
                      fetchArticleDatasets();
                    }}
                    onClose={() => {
                      setShowAddArticleModal(false);
                      setEditingArticle(null);
                      setEditingArticleType(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </>
        );

      case "services":
        return (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: '14px',
              border: '1px solid #e8edf3',
              background: 'white',
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                }}
              >
                Services
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingService(null);
                  setShowAddServiceModal(true);
                }}
              >
                Add Service
              </Button>
            </Box>
            {loadingServices ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <StyledDataGrid
                rows={services}
                columns={serviceColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                disableSelectionOnClick
              />
            )}
          </Paper>
        );

      case "hero-section":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header Section Management */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: '14px',
                border: '1px solid #e8edf3',
                background: 'white',
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '1.25rem',
                  }}
                >
                  Hero Section Content
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Pencil size={16} />}
                  onClick={() => setShowHeaderSectionModal(true)}
                >
                  {headerSection ? "Edit" : "Add"} Title & Heading
                </Button>
              </Box>
              {loadingHeaderSection ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : headerSection ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Title:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                    {headerSection.title}
                  </Typography>
                  {headerSection.title_image && (
                    <>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Title Image (Navbar):
                      </Typography>
                      <Box sx={{ mb: 3, textAlign: "center" }}>
                        <img
                          src={headerSection.title_image.startsWith("http") ? headerSection.title_image : `${baseUrl}${headerSection.title_image}`}
                          alt="Title Image"
                          style={{ maxWidth: "100%", maxHeight: "100px", objectFit: "contain" }}
                        />
                      </Box>
                    </>
                  )}
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Heading:
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {headerSection.content}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">No header section configured. Click "Add Title & Heading" to set it up.</Alert>
              )}
            </Paper>

            {/* Hero Images Carousel Management */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: '14px',
                border: '1px solid #e8edf3',
                background: 'white',
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '1.25rem',
                  }}
                >
                  Hero Images Carousel
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingHeroImage(null);
                    setShowAddHeroImageModal(true);
                  }}
                >
                  Add Image
                </Button>
              </Box>
              {loadingHeroImages ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <StyledDataGrid
                  rows={Array.isArray(heroImages) ? heroImages : []}
                  columns={heroImageColumns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  autoHeight
                  rowHeight={72}
                  disableSelectionOnClick
                  getRowId={(row) => row.id || Math.random()}
                />
              )}
            </Paper>
          </Box>
        );

      case "support":
        return (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: '14px',
              border: '1px solid #e8edf3',
              background: 'white',
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                }}
              >
                Support Logos
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingSupportLogo(null);
                  setShowAddSupportLogoModal(true);
                }}
              >
                Add Logo
              </Button>
            </Box>
            {loadingSupportLogos ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <StyledDataGrid
                rows={Array.isArray(supportLogos) ? supportLogos : []}
                columns={supportLogoColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                rowHeight={64}
                disableSelectionOnClick
                getRowId={(row) => row.id || Math.random()}
              />
            )}
          </Paper>
        );

      case "faq":
        return (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: '14px',
              border: '1px solid #e8edf3',
              background: 'white',
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                }}
              >
                FAQ Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingFAQ(null);
                  setShowAddFAQModal(true);
                }}
              >
                Add FAQ
              </Button>
            </Box>
            {loadingFAQs ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <StyledDataGrid
                rows={Array.isArray(faqs) ? faqs : []}
                columns={faqColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                disableSelectionOnClick
                getRowId={(row) => row.id || Math.random()}
              />
            )}
          </Paper>
        );

      case "add-article":
        return (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: '1px solid #e8edf3',
              background: 'white',
              maxWidth: 720,
              mx: 'auto',
            }}
          >
            <AddArticle 
              embedded={true} 
              editingArticle={editingArticle}
              editingArticleType={editingArticleType}
              onSave={handleSaveArticle}
              onClose={() => {
                setShowAddArticleModal(false);
                setEditingArticle(null);
                setEditingArticleType(null);
              }}
            />
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f0f2f8" }}>
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }}>
            <IconButton 
              edge="start" 
              onClick={handleDrawerToggle} 
              sx={{ 
                mr: 1.5, 
                display: { sm: "none" },
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 600,
                fontSize: '1rem',
                color: '#1e293b',
              }}
            >
              {title}
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate(serviceKey === "matflow" ? "/dashboard" : "/")}
              startIcon={<Home size={18} strokeWidth={2} />}
              sx={{ 
                color: '#64748b',
                fontWeight: 500,
                fontSize: '0.85rem',
                borderRadius: '10px',
                px: 2,
                '&:hover': { bgcolor: '#f1f5f9', color: '#0D9488' },
              }}
            >
              Home
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ 
              display: { xs: "block", sm: "none" }, 
              "& .MuiDrawer-paper": { 
                boxSizing: "border-box", 
                width: drawerWidth,
                bgcolor: '#ffffff',
                borderRight: 'none',
                boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
              } 
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{ 
              display: { xs: "none", sm: "block" }, 
              "& .MuiDrawer-paper": { 
                boxSizing: "border-box", 
                width: drawerWidth,
                bgcolor: '#ffffff',
                borderRight: '1px solid #f1f5f9',
              } 
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            width: { sm: `calc(100% - ${drawerWidth}px)` }, 
            mt: '64px', 
            bgcolor: '#f0f2f8',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Container 
            maxWidth="xl"
            disableGutters
            sx={{
              '& > *': {
                animation: 'adminFadeIn 0.25s ease-out',
              },
              '@keyframes adminFadeIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {renderContent()}
          </Container>
        </Box>


        {/* Add/Edit Service Modal */}
        <ServiceModal
          open={showAddServiceModal}
          service={editingService}
          onClose={() => {
            setShowAddServiceModal(false);
            setEditingService(null);
          }}
          onSave={handleSaveService}
        />

        {/* Add/Edit Hero Image Modal */}
        <HeroImageModal
          open={showAddHeroImageModal}
          heroImage={editingHeroImage}
          onClose={() => {
            setShowAddHeroImageModal(false);
            setEditingHeroImage(null);
          }}
          onSave={handleSaveHeroImage}
        />

        {/* Add/Edit Header Section Modal */}
        <HeaderSectionModal
          open={showHeaderSectionModal}
          headerSection={headerSection}
          onClose={() => setShowHeaderSectionModal(false)}
          onSave={handleSaveHeaderSection}
        />

        {/* Add/Edit Support Logo Modal */}
        <SupportLogoModal
          open={showAddSupportLogoModal}
          supportLogo={editingSupportLogo}
          supportLogos={supportLogos}
          onClose={() => {
            setShowAddSupportLogoModal(false);
            setEditingSupportLogo(null);
          }}
          onSave={handleSaveSupportLogo}
        />

        {/* FAQ Modal */}
        <FAQModal
          open={showAddFAQModal}
          faq={editingFAQ}
          faqs={faqs}
          onClose={() => {
            setShowAddFAQModal(false);
            setEditingFAQ(null);
          }}
          onSave={handleSaveFAQ}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteTarget?.onConfirm}
          title={deleteTarget?.title}
          itemName={deleteTarget?.itemName}
        />
      </Box>
    </ThemeProvider>
  );
}

// Support Logo Modal Component
function SupportLogoModal({ open, supportLogo, supportLogos = [], onClose, onSave }) {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(supportLogo?.support_logo || null);
  const [orderValue, setOrderValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (supportLogo) {
      setLogoPreview(supportLogo.support_logo || null);
      setOrderValue(String(supportLogo.order ?? 0));
    } else {
      setLogoPreview(null);
      const maxOrder = supportLogos.length > 0 ? Math.max(...supportLogos.map((s) => s.order ?? 0)) : -1;
      setOrderValue(String(maxOrder + 1));
    }
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [supportLogo, supportLogos, open]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!supportLogo && !logoFile) {
      toast.error("Please select a logo");
      return;
    }
    
    setUploading(true);
    try {
      const formDataToSend = new FormData();
      const fileToUpload = logoFile || fileInputRef.current?.files?.[0];
      if (fileToUpload) {
        formDataToSend.append("support_logo", fileToUpload);
      }
      formDataToSend.append("order", String(parseInt(orderValue, 10) || 0));
      await onSave(formDataToSend);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Error submitting form: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{supportLogo ? "Edit Support Logo" : "Add Support Logo"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FileUploadField
            id="support-logo-input"
            label="Support Logo"
            onChange={handleLogoChange}
            inputRef={fileInputRef}
            required={!supportLogo}
            helperText="PNG, JPG or SVG"
          />
          <TextField
            label="Display Order"
            type="text"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            value={orderValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                setOrderValue(val);
              }
            }}
            fullWidth
            margin="normal"
            helperText="Lower numbers appear first"
          />
          {logoPreview && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <img
                src={logoPreview.startsWith("data:") ? logoPreview : logoPreview.startsWith("http") ? logoPreview : `${baseUrl}${logoPreview}`}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            {uploading ? "Saving..." : supportLogo ? "Update" : "Add"} Logo
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Header Section Modal Component
function HeaderSectionModal({ open, headerSection, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: headerSection?.title || "",
    content: headerSection?.content || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(headerSection?.title_image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (headerSection) {
      setFormData({
        title: headerSection.title || "",
        content: headerSection.content || "",
      });
      setImagePreview(headerSection.title_image || null);
    } else {
      setFormData({ title: "", content: "" });
      setImagePreview(null);
    }
    setRemoveImage(false);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [headerSection, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSaving(true);
    try {
      // If there's a new image file to upload, use FormData; otherwise use JSON
      const fileToUpload = imageFile || fileInputRef.current?.files?.[0];
      
      if (fileToUpload) {
        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("content", formData.content);
        formDataToSend.append("title_image", fileToUpload);
        if (removeImage) {
          formDataToSend.append("remove_title_image", "true");
        }
        await onSave(formDataToSend);
      } else {
        // No new image, just update text fields
        const payload = removeImage
          ? { ...formData, remove_title_image: true }
          : formData;
        await onSave(payload);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Error submitting form: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{headerSection ? "Edit Hero Section" : "Add Hero Section"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ maxLength: 30 }}
            helperText={
              <span style={{ color: formData.title.length >= 25 ? '#d97706' : undefined }}>
                <b>{formData.title.length}</b>/30 characters
              </span>
            }
          />
          <TextField
            fullWidth
            label="Heading / Description"
            name="content"
            value={formData.content}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            required
            inputProps={{ maxLength: 250 }}
            helperText={
              formData.content.length >= 250 ? (
                <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  Limit reached — hero headings are designed to be brief and impactful.
                </span>
              ) : formData.content.length >= 220 ? (
                <span style={{ color: '#d97706', fontSize: '0.8rem' }}>
                  <b>{formData.content.length}</b>/250 — Hero headings work best when kept short and focused.
                </span>
              ) : (
                <span>
                  <b>{formData.content.length}</b>/250 characters
                </span>
              )
            }
          />
          <FileUploadField
            id="title-image-input"
            label="Title Image (for Navbar)"
            onChange={handleImageChange}
            inputRef={fileInputRef}
            helperText="PNG, JPG or SVG — appears in the navbar"
          />
          {headerSection?.title_image && (
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 2 }}>
              <Checkbox
                checked={removeImage}
                onChange={(e) => {
                  setRemoveImage(e.target.checked);
                  if (e.target.checked) {
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    setImageFile(null);
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Remove current navbar image
              </Typography>
            </Box>
          )}
          {imagePreview && !removeImage && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <img
                src={imagePreview.startsWith("data:") ? imagePreview : imagePreview.startsWith("http") ? imagePreview : `${baseUrl}${imagePreview}`}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : headerSection ? "Update" : "Add"} Section
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Hero Image Modal Component
function HeroImageModal({ open, heroImage, onClose, onSave }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(heroImage?.hero_image || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (heroImage) {
      setImagePreview(heroImage.hero_image || null);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [heroImage, open]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!heroImage && !imageFile) {
      toast.error("Please select an image");
      return;
    }
    
    setUploading(true);
    try {
      const formDataToSend = new FormData();
      const fileToUpload = imageFile || fileInputRef.current?.files?.[0];
      if (fileToUpload) {
        formDataToSend.append("hero_image", fileToUpload);
      }
      await onSave(formDataToSend);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Error submitting form: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{heroImage ? "Edit Hero Image" : "Add Hero Image"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FileUploadField
            id="hero-image-input"
            label="Hero Image"
            onChange={handleImageChange}
            inputRef={fileInputRef}
            required={!heroImage}
            helperText="PNG or JPG — displayed on the landing page"
          />
          {imagePreview && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <img
                src={imagePreview.startsWith("data:") ? imagePreview : imagePreview.startsWith("http") ? imagePreview : `${baseUrl}${imagePreview}`}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            {uploading ? "Saving..." : heroImage ? "Update" : "Add"} Image
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}


// Service Modal Component
function ServiceModal({ open, service, onClose, onSave }) {
  const [formData, setFormData] = useState({
    service_name: service?.service_name || "",
    service_description: service?.service_description || "",
    service_url: service?.service_url || "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(service?.service_logo || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (service) {
      setFormData({
        service_name: service.service_name || "",
        service_description: service.service_description || "",
        service_url: service.service_url || "",
      });
      setLogoPreview(service.service_logo || null);
    } else {
      setFormData({ service_name: "", service_description: "", service_url: "" });
      setLogoPreview(null);
    }
    setLogoFile(null);
    // Reset file input when modal opens/closes
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [service, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.service_name || !formData.service_description || !formData.service_url) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const fileFromInput = fileInputRef.current?.files?.[0];
    const hasLogo = logoFile || fileFromInput;
    
    if (!service && !hasLogo) {
      toast.error("Please select a service logo");
      return;
    }
    
    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("service_name", formData.service_name);
      formDataToSend.append("service_description", formData.service_description);
      formDataToSend.append("service_url", formData.service_url);
      
      const fileToUpload = logoFile || fileFromInput;
      if (fileToUpload) {
        formDataToSend.append("service_logo", fileToUpload);
      }
      
      await onSave(formDataToSend);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Error submitting form: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            label="Service Name"
            name="service_name"
            value={formData.service_name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Service Description"
            name="service_description"
            value={formData.service_description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="Service URL"
            name="service_url"
            value={formData.service_url}
            onChange={handleChange}
            margin="normal"
            type="url"
            required
          />
          <FileUploadField
            id="service-logo-input"
            label="Service Logo *"
            onChange={handleLogoChange}
            inputRef={fileInputRef}
            required={!service}
            helperText="PNG, JPG or SVG"
          />
          {logoPreview && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Avatar
                src={logoPreview.startsWith("data:") ? logoPreview : logoPreview.startsWith("http") ? logoPreview : `${baseUrl}${logoPreview}`}
                sx={{ width: 100, height: 100, mx: "auto" }}
              >
                <Building2 size={36} color="#94a3b8" />
              </Avatar>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            {uploading ? "Saving..." : service ? "Update" : "Add"} Service
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// FAQ Modal Component
function FAQModal({ open, faq, faqs = [], onClose, onSave }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [orderValue, setOrderValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question || "");
      setAnswer(faq.answer || "");
      setOrderValue(String(faq.order ?? 0));
      setIsActive(faq.is_active ?? true);
    } else {
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order ?? 0)) : -1;
      setQuestion("");
      setAnswer("");
      setOrderValue(String(maxOrder + 1));
      setIsActive(true);
    }
  }, [faq, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (!trimmedQuestion) {
      toast.warning("Please enter a question before saving");
      return;
    }

    if (!trimmedAnswer) {
      toast.warning("Please enter an answer before saving");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        question: trimmedQuestion,
        answer: trimmedAnswer,
        order: parseInt(orderValue, 10) || 0,
        is_active: isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {faq ? "Edit FAQ" : "Add FAQ"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoFocus
            helperText={<span><b>{question.length}</b> characters</span>}
          />
          <TextField
            label="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            fullWidth
            required
            margin="normal"
            multiline
            minRows={3}
            maxRows={8}
            helperText={<span><b>{answer.length}</b> characters</span>}
          />
          <TextField
            label="Display Order"
            type="text"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            value={orderValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                setOrderValue(val);
              }
            }}
            fullWidth
            margin="normal"
            helperText="Lower numbers appear first"
          />
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <input
              type="checkbox"
              id="faq-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ marginRight: 8, width: 18, height: 18 }}
            />
            <label htmlFor="faq-active" style={{ fontSize: "0.95rem", color: "#374151", cursor: "pointer" }}>
              Active (visible on FAQ page)
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : faq ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AdminDashboard;
