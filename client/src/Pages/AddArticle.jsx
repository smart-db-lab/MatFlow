import React, { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
    isAdminLoggedIn,
    checkAdminStatus,
    getAuthHeaders,
} from "../util/adminAuth";
import {
    journalSchema,
    conferenceSchema,
    bookSchema,
    patentSchema,
    datasetSchema,
    formatPublicationDate,
} from "../schemas/articleSchemas";
import { commonApi } from "../services/api/apiService";
import { setActiveWorkspace } from "../Slices/workspaceSlice";
import RichTextInput from "../Components/RichTextInput";
import {
    TextField,
    MenuItem,
    Button,
    Tabs,
    Tab,
    Box,
    Typography,
    CircularProgress,
} from "@mui/material";
import { Check, Upload } from "lucide-react";

function AddArticle({
    embedded = false,
    editingArticle = null,
    editingArticleType = null,
    onSave = null,
    onClose = null,
    onSuccess = null,
}) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Compute the correct tab based on editingArticleType
    const getCorrectTab = () => {
        if (editingArticleType) {
            // Normalize to singular form
            const normalizedType = editingArticleType.endsWith("s")
                ? editingArticleType.slice(0, -1)
                : editingArticleType;

            const tabMap = {
                Journal: "journal",
                Conference: "conference",
                Book: "book",
                Patent: "patent",
                Dataset: "dataset",
            };
            return tabMap[normalizedType] || "journal";
        }
        return "journal";
    };

    // Initialize activeTab - use the computed value directly
    const [activeTab, setActiveTab] = useState(() => getCorrectTab());
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Validation errors state
    const [validationErrors, setValidationErrors] = useState({});

    // Formatting metadata state for each form
    const [journalFormatting, setJournalFormatting] = useState({});
    const [conferenceFormatting, setConferenceFormatting] = useState({});
    const [bookFormatting, setBookFormatting] = useState({});
    const [patentFormatting, setPatentFormatting] = useState({});
    const [datasetFormatting, setDatasetFormatting] = useState({});

    // Determine if we're in edit mode
    const isEditMode = !!editingArticle;

    // Form state for each tab
    const [journalForm, setJournalForm] = useState({
        title: "",
        authors: "",
        year: "",
        month: "",
        day: "",
        journalName: "",
        volume: "",
        issue: "",
        pages: "",
        issn: "",
        publisher: "",
        doi: "",
    });

    const [conferenceForm, setConferenceForm] = useState({
        title: "",
        authors: "",
        year: "",
        month: "",
        day: "",
        conferenceName: "",
        venue: "",
        isbn: "",
        pages: "",
        publisher: "",
        doi: "",
    });

    const [bookForm, setBookForm] = useState({
        title: "",
        authors: "",
        year: "",
        month: "",
        day: "",
        pages: "",
        isbn: "",
        publisher: "",
        doi: "",
    });

    const [patentForm, setPatentForm] = useState({
        title: "",
        inventors: "",
        year: "",
        month: "",
        day: "",
        patentOffice: "",
        patentNumber: "",
        applicationNumber: "",
        patentLink: "",
    });

    const [datasetForm, setDatasetForm] = useState({
        title: "",
        originators: "",
        year: "",
        month: "",
        day: "",
        underPublication: "",
        keywords: "",
        file: null,
    });

    // Generate year options (current year back to 1900)
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - 1899 },
        (_, i) => currentYear - i,
    );

    // Generate month options
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Generate day options (1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    // Check admin authentication on mount (skip if embedded, dashboard handles it)
    useEffect(() => {
        if (embedded) {
            setCheckingAuth(false);
            return;
        }
        const checkAuth = async () => {
            const isAdmin = await checkAdminStatus();
            if (!isAdmin && !isAdminLoggedIn()) {
                navigate("/login");
            } else {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, [navigate, embedded]);

    // Parse publication date into year, month, day
    const parsePublicationDate = (dateString) => {
        if (!dateString) return { year: "", month: "", day: "" };
        const parts = dateString.split("-");
        return {
            year: parts[0] || "",
            month: parts[1] || "",
            day: parts[2] || "",
        };
    };

    // Set active tab synchronously when editingArticleType changes (before paint)
    // This MUST run before the first paint to prevent showing the wrong tab
    useLayoutEffect(() => {
        const correctTab = getCorrectTab();
        setActiveTab(correctTab);
    }, [editingArticleType]); // Always update when editingArticleType changes

    // Initialize forms when editing
    useEffect(() => {
        if (isEditMode && editingArticle && editingArticleType) {
            const dateParts = parsePublicationDate(
                editingArticle.publication_date,
            );

            // Normalize editingArticleType to singular form (handle both "Book" and "Books")
            const normalizedType = editingArticleType.endsWith("s")
                ? editingArticleType.slice(0, -1)
                : editingArticleType;

            // Map backend field names to form field names
            if (normalizedType === "Journal") {
                setJournalForm({
                    title: editingArticle.title || "",
                    authors: editingArticle.authors || "",
                    year: dateParts.year,
                    month: dateParts.month,
                    day: dateParts.day,
                    journalName: editingArticle.journal_name || "",
                    volume: editingArticle.volume || "",
                    issue: editingArticle.issue || "",
                    pages: editingArticle.pages || "",
                    issn: editingArticle.issn || "",
                    publisher: editingArticle.publisher || "",
                    doi: editingArticle.doi || "",
                });
                // Load formatting metadata if available
                if (editingArticle.formatting_metadata) {
                    const metadata = editingArticle.formatting_metadata;
                    setJournalFormatting({
                        title: metadata.title || null,
                        authors: metadata.authors || null,
                        journalName: metadata.journal_name || null,
                        publisher: metadata.publisher || null,
                        volume: metadata.volume || null,
                    });
                }
            } else if (normalizedType === "Conference") {
                setConferenceForm({
                    title: editingArticle.title || "",
                    authors: editingArticle.authors || "",
                    year: dateParts.year,
                    month: dateParts.month,
                    day: dateParts.day,
                    conferenceName: editingArticle.conference_name || "",
                    venue: editingArticle.venue || "",
                    isbn: editingArticle.isbn || "",
                    pages: editingArticle.pages || "",
                    publisher: editingArticle.publisher || "",
                    doi: editingArticle.doi || "",
                });
                // Load formatting metadata if available
                if (editingArticle.formatting_metadata) {
                    const metadata = editingArticle.formatting_metadata;
                    setConferenceFormatting({
                        title: metadata.title || null,
                        authors: metadata.authors || null,
                        conferenceName: metadata.conference_name || null,
                        publisher: metadata.publisher || null,
                    });
                }
            } else if (normalizedType === "Book") {
                setBookForm({
                    title: editingArticle.title || "",
                    authors: editingArticle.authors || "",
                    year: dateParts.year,
                    month: dateParts.month,
                    day: dateParts.day,
                    pages: editingArticle.pages || "",
                    isbn: editingArticle.isbn || "",
                    publisher: editingArticle.publisher || "",
                    doi: editingArticle.doi || "",
                });
                // Load formatting metadata if available
                if (editingArticle.formatting_metadata) {
                    const metadata = editingArticle.formatting_metadata;
                    setBookFormatting({
                        title: metadata.title || null,
                        authors: metadata.authors || null,
                        publisher: metadata.publisher || null,
                    });
                }
            } else if (normalizedType === "Patent") {
                setPatentForm({
                    title: editingArticle.title || "",
                    inventors: editingArticle.inventors || "",
                    year: dateParts.year,
                    month: dateParts.month,
                    day: dateParts.day,
                    patentOffice: editingArticle.patent_office || "",
                    patentNumber: editingArticle.patent_number || "",
                    applicationNumber: editingArticle.application_number || "",
                    patentLink: editingArticle.patent_link || "",
                });
                // Load formatting metadata if available
                if (editingArticle.formatting_metadata) {
                    const metadata = editingArticle.formatting_metadata;
                    setPatentFormatting({
                        title: metadata.title || null,
                        inventors: metadata.inventors || null,
                    });
                }
            } else if (normalizedType === "Dataset") {
                setDatasetForm({
                    title: editingArticle.title || "",
                    originators: editingArticle.originators || "",
                    year: dateParts.year,
                    month: dateParts.month,
                    day: dateParts.day,
                    underPublication: editingArticle.under_publication || "",
                    keywords: editingArticle.keywords || "",
                    file: null, // File will be handled separately if editing
                });
                // Load formatting metadata if available
                if (editingArticle.formatting_metadata) {
                    const metadata = editingArticle.formatting_metadata;
                    setDatasetFormatting({
                        title: metadata.title || null,
                        originators: metadata.originators || null,
                    });
                }
            }
        }
    }, [isEditMode, editingArticle, editingArticleType]);

    // Handle input change for each form - clear validation errors when user types
    const handleJournalChange = (e) => {
        setJournalForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        // Clear validation error for this field
        if (validationErrors[e.target.name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    const handleConferenceChange = (e) => {
        setConferenceForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (validationErrors[e.target.name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    const handleBookChange = (e) => {
        setBookForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (validationErrors[e.target.name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    const handlePatentChange = (e) => {
        setPatentForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (validationErrors[e.target.name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    // Formatting change handlers - memoized to prevent infinite loops
    const handleJournalFormattingChange = React.useCallback(
        (fieldName, segments) => {
            // Ensure segments is always an array
            const validSegments = Array.isArray(segments) ? segments : [];
            setJournalFormatting((prev) => {
                // Only update if actually changed
                if (
                    JSON.stringify(prev[fieldName]) ===
                    JSON.stringify(validSegments)
                ) {
                    return prev; // Return same object to prevent re-render
                }
                return {
                    ...prev,
                    [fieldName]: validSegments,
                };
            });
        },
        [],
    );

    const handleConferenceFormattingChange = React.useCallback(
        (fieldName, segments) => {
            // Ensure segments is always an array
            const validSegments = Array.isArray(segments) ? segments : [];
            setConferenceFormatting((prev) => {
                if (
                    JSON.stringify(prev[fieldName]) ===
                    JSON.stringify(validSegments)
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    [fieldName]: validSegments,
                };
            });
        },
        [],
    );

    const handleBookFormattingChange = React.useCallback(
        (fieldName, segments) => {
            // Ensure segments is always an array
            const validSegments = Array.isArray(segments) ? segments : [];
            setBookFormatting((prev) => {
                if (
                    JSON.stringify(prev[fieldName]) ===
                    JSON.stringify(validSegments)
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    [fieldName]: validSegments,
                };
            });
        },
        [],
    );

    const handlePatentFormattingChange = React.useCallback(
        (fieldName, segments) => {
            const validSegments = Array.isArray(segments) ? segments : [];
            setPatentFormatting((prev) => {
                if (
                    JSON.stringify(prev[fieldName]) ===
                    JSON.stringify(validSegments)
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    [fieldName]: validSegments,
                };
            });
        },
        [],
    );

    const handleDatasetFormattingChange = React.useCallback(
        (fieldName, segments) => {
            const validSegments = Array.isArray(segments) ? segments : [];
            setDatasetFormatting((prev) => {
                if (
                    JSON.stringify(prev[fieldName]) ===
                    JSON.stringify(validSegments)
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    [fieldName]: validSegments,
                };
            });
        },
        [],
    );

    const handleDatasetChange = (e) => {
        if (e.target.type === "file") {
            const file =
                e.target.files && e.target.files.length > 0
                    ? e.target.files[0]
                    : null;
            if (file) {
                console.log(
                    "File selected:",
                    file.name,
                    file.type,
                    file.size,
                    "Is File:",
                    file instanceof File,
                );
            }
            setDatasetForm((prev) => ({
                ...prev,
                file: file,
            }));
        } else {
            setDatasetForm((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
            }));
        }
        if (validationErrors[e.target.name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    // Handle form submission with Zod validation
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setValidationErrors({});

        let formData = {};
        let articleType = "";
        let schema = null;

        switch (activeTab) {
            case "journal":
                formData = journalForm;
                articleType = "Journal";
                schema = journalSchema;
                break;
            case "conference":
                formData = conferenceForm;
                articleType = "Conference";
                schema = conferenceSchema;
                break;
            case "book":
                formData = bookForm;
                articleType = "Book";
                schema = bookSchema;
                break;
            case "patent":
                formData = patentForm;
                articleType = "Patent";
                schema = patentSchema;
                break;
            case "dataset":
                formData = datasetForm;
                articleType = "Dataset";
                schema = datasetSchema;
                break;
        }

        // Validate with Zod
        try {
            schema.parse(formData);
        } catch (error) {
            if (error.errors) {
                const errors = {};
                error.errors.forEach((err) => {
                    const field = err.path[0];
                    errors[field] = err.message;
                });
                setValidationErrors(errors);

                // Show first error in toast
                const firstError = error.errors[0];
                toast.error(
                    `${firstError.path.join(".")}: ${firstError.message}`,
                );
            } else {
                toast.error(
                    "Validation failed. Please check all required fields.",
                );
            }
            setLoading(false);
            return;
        }

        // Format publication date (YYYY, YYYY-MM, or YYYY-MM-DD)
        const publicationDate = formatPublicationDate(
            formData.year,
            formData.month,
            formData.day,
        );

        // Helper function to handle optional fields - omit if empty, otherwise trim
        const handleOptionalField = (value) => {
            if (!value || !value.trim()) {
                return undefined; // Omit from payload if empty
            }
            return value.trim();
        };

        // Map form data to backend API format
        // Use full API URL, default to localhost:8000 if not set
        const baseUrl =
            import.meta.env.VITE_APP_API_URL || "http://localhost:8000";
        let apiData = {};
        let apiEndpoint = "";

        switch (activeTab) {
            case "journal": {
                apiEndpoint = `${baseUrl}/api/journals/`;
                apiData = {
                    title: formData.title.trim(),
                    journal_name: formData.journalName.trim(),
                };
                if (formData.authors?.trim())
                    apiData.authors = formData.authors.trim();
                if (publicationDate) apiData.publication_date = publicationDate;
                if (formData.publisher?.trim())
                    apiData.publisher = formData.publisher.trim();
                if (formData.pages?.trim())
                    apiData.pages = formData.pages.trim();
                if (formData.volume?.trim())
                    apiData.volume = formData.volume.trim();
                if (formData.issue?.trim())
                    apiData.issue = formData.issue.trim();
                if (formData.issn?.trim()) apiData.issn = formData.issn.trim();
                if (formData.doi?.trim()) apiData.doi = formData.doi.trim();
                // Add formatting metadata
                const formattingMeta = {};
                // Check if segments exist and have at least one segment with text
                const hasValidSegments = (segments) => {
                    return (
                        Array.isArray(segments) &&
                        segments.length > 0 &&
                        segments.some((s) => s.text && s.text.trim().length > 0)
                    );
                };
                if (hasValidSegments(journalFormatting.title))
                    formattingMeta.title = journalFormatting.title;
                if (hasValidSegments(journalFormatting.authors))
                    formattingMeta.authors = journalFormatting.authors;
                if (hasValidSegments(journalFormatting.journalName))
                    formattingMeta.journal_name = journalFormatting.journalName;
                if (hasValidSegments(journalFormatting.publisher))
                    formattingMeta.publisher = journalFormatting.publisher;
                if (hasValidSegments(journalFormatting.volume))
                    formattingMeta.volume = journalFormatting.volume;
                if (Object.keys(formattingMeta).length > 0) {
                    apiData.formatting_metadata = formattingMeta;
                    console.log(
                        "Journal formatting metadata being saved:",
                        JSON.stringify(formattingMeta, null, 2),
                    );
                } else {
                    console.log("No journal formatting metadata to save");
                }
                break;
            }
            case "conference": {
                apiEndpoint = `${baseUrl}/api/conferences/`;
                apiData = {
                    title: formData.title.trim(),
                    conference_name: formData.conferenceName.trim(),
                };
                if (formData.authors?.trim())
                    apiData.authors = formData.authors.trim();
                if (publicationDate) apiData.publication_date = publicationDate;
                if (formData.venue?.trim())
                    apiData.venue = formData.venue.trim();
                if (formData.publisher?.trim())
                    apiData.publisher = formData.publisher.trim();
                if (formData.pages?.trim())
                    apiData.pages = formData.pages.trim();
                if (formData.isbn?.trim()) apiData.isbn = formData.isbn.trim();
                if (formData.doi?.trim()) apiData.doi = formData.doi.trim();
                // Add formatting metadata
                const formattingMeta = {};
                // Check if segments exist and have at least one segment with text
                const hasValidSegments = (segments) => {
                    return (
                        Array.isArray(segments) &&
                        segments.length > 0 &&
                        segments.some((s) => s.text && s.text.trim().length > 0)
                    );
                };
                if (hasValidSegments(conferenceFormatting.title))
                    formattingMeta.title = conferenceFormatting.title;
                if (hasValidSegments(conferenceFormatting.authors))
                    formattingMeta.authors = conferenceFormatting.authors;
                if (hasValidSegments(conferenceFormatting.conferenceName))
                    formattingMeta.conference_name =
                        conferenceFormatting.conferenceName;
                if (hasValidSegments(conferenceFormatting.publisher))
                    formattingMeta.publisher = conferenceFormatting.publisher;
                if (Object.keys(formattingMeta).length > 0)
                    apiData.formatting_metadata = formattingMeta;
                break;
            }
            case "book": {
                apiEndpoint = `${baseUrl}/api/books/`;
                apiData = {
                    title: formData.title.trim(),
                    authors: formData.authors.trim(),
                };
                if (publicationDate) apiData.publication_date = publicationDate;
                if (formData.pages?.trim())
                    apiData.pages = formData.pages.trim();
                if (formData.isbn?.trim()) apiData.isbn = formData.isbn.trim();
                if (formData.publisher?.trim())
                    apiData.publisher = formData.publisher.trim();
                if (formData.doi?.trim()) apiData.doi = formData.doi.trim();
                // Add formatting metadata
                const formattingMeta = {};
                // Check if segments exist and have at least one segment with text
                const hasValidSegments = (segments) => {
                    return (
                        Array.isArray(segments) &&
                        segments.length > 0 &&
                        segments.some((s) => s.text && s.text.trim().length > 0)
                    );
                };
                if (hasValidSegments(bookFormatting.title))
                    formattingMeta.title = bookFormatting.title;
                if (hasValidSegments(bookFormatting.authors))
                    formattingMeta.authors = bookFormatting.authors;
                if (hasValidSegments(bookFormatting.publisher))
                    formattingMeta.publisher = bookFormatting.publisher;
                if (Object.keys(formattingMeta).length > 0)
                    apiData.formatting_metadata = formattingMeta;
                break;
            }
            case "patent": {
                apiEndpoint = `${baseUrl}/api/patents/`;
                apiData = {
                    title: formData.title.trim(),
                };
                if (formData.inventors?.trim())
                    apiData.inventors = formData.inventors.trim();
                if (publicationDate) apiData.publication_date = publicationDate;
                if (formData.patentOffice?.trim())
                    apiData.patent_office = formData.patentOffice.trim();
                if (formData.patentNumber?.trim())
                    apiData.patent_number = formData.patentNumber.trim();
                if (formData.applicationNumber?.trim())
                    apiData.application_number =
                        formData.applicationNumber.trim();
                if (formData.patentLink?.trim())
                    apiData.patent_link = formData.patentLink.trim();
                // Add formatting metadata
                const formattingMeta = {};
                if (patentFormatting.title && patentFormatting.title.length > 0)
                    formattingMeta.title = patentFormatting.title;
                if (
                    patentFormatting.inventors &&
                    patentFormatting.inventors.length > 0
                )
                    formattingMeta.inventors = patentFormatting.inventors;
                if (Object.keys(formattingMeta).length > 0)
                    apiData.formatting_metadata = formattingMeta;
                break;
            }
            case "dataset": {
                apiEndpoint = `${baseUrl}/api/datasets/`;
                apiData = {
                    title: formData.title.trim(),
                };
                if (formData.originators?.trim())
                    apiData.originators = formData.originators.trim();
                if (publicationDate) apiData.publication_date = publicationDate;
                if (formData.underPublication?.trim())
                    apiData.under_publication =
                        formData.underPublication.trim();
                if (formData.keywords?.trim())
                    apiData.keywords = formData.keywords.trim();
                // Add formatting metadata
                const formattingMeta = {};
                if (
                    datasetFormatting.title &&
                    datasetFormatting.title.length > 0
                )
                    formattingMeta.title = datasetFormatting.title;
                if (
                    datasetFormatting.originators &&
                    datasetFormatting.originators.length > 0
                )
                    formattingMeta.originators = datasetFormatting.originators;
                if (Object.keys(formattingMeta).length > 0)
                    apiData.formatting_metadata = formattingMeta;
                // File will be handled separately in FormData if present
                break;
            }
        }

        // Make API call or use onSave callback for editing
        try {
            if (isEditMode && onSave && editingArticle) {
                // Use the onSave callback provided by parent (AdminDashboard)
                // For datasets with file upload, pass file separately
                if (activeTab === "dataset" && datasetForm.file) {
                    const formData = new FormData();
                    Object.keys(apiData).forEach((key) => {
                        // Stringify objects/arrays (like formatting_metadata) for FormData
                        if (
                            typeof apiData[key] === "object" &&
                            apiData[key] !== null
                        ) {
                            formData.append(key, JSON.stringify(apiData[key]));
                        } else {
                            formData.append(key, apiData[key]);
                        }
                    });
                    formData.append("file", datasetForm.file);
                    await onSave(formData, articleType, editingArticle.id);
                } else {
                    await onSave(apiData, articleType, editingArticle.id);
                }
                setLoading(false);
                return;
            }

            // Handle file upload for datasets
            let requestBody;
            let headers = { ...getAuthHeaders() };

            if (activeTab === "dataset" && datasetForm.file) {
                // Use FormData for file upload
                const formData = new FormData();
                Object.keys(apiData).forEach((key) => {
                    if (
                        apiData[key] !== null &&
                        apiData[key] !== undefined &&
                        apiData[key] !== ""
                    ) {
                        // Stringify objects/arrays (like formatting_metadata) for FormData
                        if (
                            typeof apiData[key] === "object" &&
                            apiData[key] !== null
                        ) {
                            formData.append(key, JSON.stringify(apiData[key]));
                        } else {
                            formData.append(key, apiData[key]);
                        }
                    }
                });
                // Ensure file is a File object, not a string
                if (datasetForm.file instanceof File) {
                    console.log(
                        "Appending file to FormData:",
                        datasetForm.file.name,
                        datasetForm.file.type,
                        datasetForm.file.size,
                    );
                    formData.append(
                        "file",
                        datasetForm.file,
                        datasetForm.file.name,
                    );

                    // Debug: Log FormData contents
                    console.log("FormData entries:");
                    for (let pair of formData.entries()) {
                        console.log(
                            pair[0],
                            pair[1] instanceof File
                                ? `File: ${pair[1].name}`
                                : pair[1],
                        );
                    }
                } else {
                    console.error(
                        "File is not a File object:",
                        typeof datasetForm.file,
                        datasetForm.file,
                    );
                    toast.error("Invalid file. Please select a file again.");
                    setLoading(false);
                    return;
                }
                requestBody = formData;
                // Don't set Content-Type header, browser will set it with boundary for FormData
                // Remove Content-Type from headers if it exists
                const { "Content-Type": _, ...restHeaders } = headers;
                headers = restHeaders;
            } else {
                // Use JSON for other requests
                requestBody = JSON.stringify(apiData);
                headers["Content-Type"] = "application/json";
            }

            console.log(
                "Sending payload to",
                apiEndpoint,
                activeTab === "dataset" && datasetForm.file
                    ? "(with file)"
                    : ":",
                activeTab === "dataset" && datasetForm.file
                    ? "FormData"
                    : JSON.stringify(apiData, null, 2),
            );
            if (apiData.formatting_metadata) {
                console.log(
                    "Formatting metadata in payload:",
                    JSON.stringify(apiData.formatting_metadata, null, 2),
                );
            }
            let responseData = {};
            switch (activeTab) {
                case "journal":
                    responseData =
                        await commonApi.articles.createJournal(apiData);
                    break;
                case "conference":
                    responseData =
                        await commonApi.articles.createConference(apiData);
                    break;
                case "book":
                    responseData = await commonApi.articles.createBook(apiData);
                    break;
                case "patent":
                    responseData =
                        await commonApi.articles.createPatent(apiData);
                    break;
                case "dataset":
                    responseData = await commonApi.articles.createDataset(
                        activeTab === "dataset" && datasetForm.file
                            ? requestBody
                            : apiData,
                        activeTab === "dataset" && datasetForm.file
                            ? datasetForm.file
                            : null,
                    );
                    break;
            }

            // Check if response follows BaseViewSet format or has errors
            if (responseData && responseData.error) {
                // Handle API errors
                let errorMessage = `Failed to submit ${articleType.toLowerCase()}`;
                if (responseData.success === false && responseData.error) {
                    const errorObj = responseData.error;
                    if (typeof errorObj === "object") {
                        // Validation errors object
                        const firstErrorKey = Object.keys(errorObj)[0];
                        const firstError = errorObj[firstErrorKey];
                        if (Array.isArray(firstError)) {
                            errorMessage = `${firstErrorKey}: ${firstError[0]}`;
                        } else if (typeof firstError === "string") {
                            errorMessage = `${firstErrorKey}: ${firstError}`;
                        } else {
                            errorMessage = JSON.stringify(errorObj);
                        }
                    } else if (typeof errorObj === "string") {
                        errorMessage = errorObj;
                    }
                } else if (responseData.error) {
                    errorMessage =
                        typeof responseData.error === "string"
                            ? responseData.error
                            : JSON.stringify(responseData.error);
                } else if (responseData.detail) {
                    errorMessage = responseData.detail;
                } else if (
                    typeof responseData === "object" &&
                    !responseData.success
                ) {
                    // Validation errors (direct object)
                    const firstErrorKey = Object.keys(responseData)[0];
                    const firstError = responseData[firstErrorKey];
                    if (Array.isArray(firstError)) {
                        errorMessage = `${firstErrorKey}: ${firstError[0]}`;
                    } else {
                        errorMessage = `${firstErrorKey}: ${firstError}`;
                    }
                }
                console.error("Submission error:", responseData);
                toast.error(errorMessage);
                setLoading(false);
                return;
            }

            // Success case
            if (responseData && (responseData.success || responseData.data)) {
                toast.success(`${articleType} submitted successfully!`);
            } else {
                toast.success(`${articleType} submitted successfully!`);
            }

            // Call onSuccess callback if provided (to refresh lists)
            if (onSuccess) {
                onSuccess();
            }

            // Call onClose if provided (for modal mode)
            if (onClose) {
                onClose();
            }

            // Reset form
            setTimeout(() => {
                if (activeTab === "journal") {
                    setJournalForm({
                        title: "",
                        authors: "",
                        year: "",
                        month: "",
                        day: "",
                        journalName: "",
                        volume: "",
                        issue: "",
                        pages: "",
                        issn: "",
                        publisher: "",
                        doi: "",
                    });
                } else if (activeTab === "conference") {
                    setConferenceForm({
                        title: "",
                        authors: "",
                        year: "",
                        month: "",
                        day: "",
                        conferenceName: "",
                        venue: "",
                        isbn: "",
                        pages: "",
                        publisher: "",
                        doi: "",
                    });
                } else if (activeTab === "book") {
                    setBookForm({
                        title: "",
                        authors: "",
                        year: "",
                        month: "",
                        day: "",
                        pages: "",
                        isbn: "",
                        publisher: "",
                        doi: "",
                    });
                } else if (activeTab === "patent") {
                    setPatentForm({
                        title: "",
                        inventors: "",
                        year: "",
                        month: "",
                        day: "",
                        patentOffice: "",
                        patentNumber: "",
                        applicationNumber: "",
                        patentLink: "",
                    });
                } else if (activeTab === "dataset") {
                    setDatasetForm({
                        title: "",
                        originators: "",
                        year: "",
                        month: "",
                        day: "",
                        underPublication: "",
                        keywords: "",
                    });
                }
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error submitting article:", error);
            toast.error(
                `Error submitting ${articleType.toLowerCase()}: ${error.message}`,
            );
            setLoading(false);
        }
    };

    const fieldSize = embedded ? "small" : "medium";
    const selectMenuProps = { PaperProps: { sx: { maxHeight: 250 } } };

    const renderDateInputs = (form, handleChange) => {
        const showMonth = form.year !== "";
        const showDay = form.month !== "";

        return (
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                    width: "100%",
                }}
            >
                <TextField
                    select
                    fullWidth
                    label="Publication Date - Year"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    margin="normal"
                    size={fieldSize}
                    SelectProps={{ MenuProps: selectMenuProps }}
                >
                    <MenuItem value="">Select Year</MenuItem>
                    {years.map((year) => (
                        <MenuItem key={year} value={String(year)}>
                            {year}
                        </MenuItem>
                    ))}
                </TextField>
                {showMonth && (
                    <TextField
                        select
                        fullWidth
                        label="Month (Optional)"
                        name="month"
                        value={form.month}
                        onChange={handleChange}
                        margin="normal"
                        size={fieldSize}
                        SelectProps={{ MenuProps: selectMenuProps }}
                    >
                        <MenuItem value="">Select Month</MenuItem>
                        {months.map((month) => (
                            <MenuItem key={month} value={String(month)}>
                                {month}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
                {showDay && (
                    <TextField
                        select
                        fullWidth
                        label="Day (Optional)"
                        name="day"
                        value={form.day}
                        onChange={handleChange}
                        margin="normal"
                        size={fieldSize}
                        SelectProps={{ MenuProps: selectMenuProps }}
                    >
                        <MenuItem value="">Select Day</MenuItem>
                        {days.map((day) => (
                            <MenuItem key={day} value={String(day)}>
                                {day}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            </Box>
        );
    };

    const renderInput = (
        id,
        name,
        value,
        onChange,
        label,
        required = false,
        placeholder = "",
        type = "text",
        error = null,
    ) => {
        const hasError = error !== null && error !== undefined;
        return (
            <TextField
                fullWidth
                id={id}
                name={name}
                label={label}
                value={value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                required={required}
                error={hasError}
                helperText={hasError ? error : undefined}
                margin="normal"
                size={fieldSize}
            />
        );
    };

    const renderRichTextInput = (
        id,
        name,
        value,
        onChange,
        onFormattingChange,
        label,
        required = false,
        placeholder = "",
        error = null,
        isAuthorField = false,
        formattingMetadata = null,
    ) => {
        const hasError = error !== null && error !== undefined;
        const mode = isAuthorField ? "author" : "full";
        return (
            <Box sx={{ width: "100%", mt: 2, mb: 1 }}>
                <Typography
                    component="label"
                    sx={{
                        fontSize: "0.75rem",
                        fontWeight: 400,
                        color: hasError ? "error.main" : "text.secondary",
                        mb: 0.5,
                        display: "block",
                    }}
                >
                    {label}{" "}
                    {required && <span style={{ color: "#ef4444" }}>*</span>}
                </Typography>
                <RichTextInput
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFormattingChange={onFormattingChange}
                    placeholder={placeholder}
                    isAuthorField={isAuthorField}
                    mode={mode}
                    formattingMetadata={formattingMetadata}
                    className={`w-full py-2 px-3 rounded-md outline-none border ${hasError ? "border-red-500" : "border-gray-300"} bg-white hover:border-gray-900 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors text-sm`}
                />
                {hasError && (
                    <Typography
                        sx={{
                            fontSize: "0.75rem",
                            color: "error.main",
                            mt: 0.5,
                            ml: 1.75,
                        }}
                    >
                        {error}
                    </Typography>
                )}
            </Box>
        );
    };

    // Render form fields based on active tab
    const renderForm = () => {
        switch (activeTab) {
            case "journal":
                return (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        {renderRichTextInput(
                            "title",
                            "title",
                            journalForm.title,
                            handleJournalChange,
                            handleJournalFormattingChange,
                            "Title",
                            true,
                            "Enter article title",
                            validationErrors.title,
                            false,
                            journalFormatting.title,
                        )}

                        {renderRichTextInput(
                            "authors",
                            "authors",
                            journalForm.authors,
                            handleJournalChange,
                            handleJournalFormattingChange,
                            "Authors",
                            false,
                            "Enter authors",
                            validationErrors.authors,
                            true,
                            journalFormatting.authors,
                        )}

                        {renderDateInputs(journalForm, handleJournalChange)}
                        {validationErrors.year && (
                            <p className="text-red-400 text-xs mt-0.5">
                                {validationErrors.year}
                            </p>
                        )}

                        {renderRichTextInput(
                            "journalName",
                            "journalName",
                            journalForm.journalName,
                            handleJournalChange,
                            handleJournalFormattingChange,
                            "Journal Name",
                            true,
                            "Enter journal name",
                            validationErrors.journalName,
                            false,
                            journalFormatting.journalName,
                        )}

                        <div
                            className={`flex flex-col sm:flex-row ${embedded ? "gap-2" : "gap-3"} w-full`}
                        >
                            <div className="flex-1">
                                {renderRichTextInput(
                                    "volume",
                                    "volume",
                                    journalForm.volume,
                                    handleJournalChange,
                                    handleJournalFormattingChange,
                                    "Volume",
                                    false,
                                    "Enter volume",
                                    validationErrors.volume,
                                    false,
                                    journalFormatting.volume,
                                )}
                            </div>
                            <div className="flex-1">
                                {renderInput(
                                    "issue",
                                    "issue",
                                    journalForm.issue,
                                    handleJournalChange,
                                    "Issue",
                                    false,
                                    "Enter issue",
                                    "text",
                                    validationErrors.issue,
                                )}
                            </div>
                        </div>

                        <div
                            className={`flex flex-col sm:flex-row ${embedded ? "gap-2" : "gap-3"} w-full`}
                        >
                            <div className="flex-1">
                                {renderInput(
                                    "pages",
                                    "pages",
                                    journalForm.pages,
                                    handleJournalChange,
                                    "Pages",
                                    false,
                                    "e.g., 10 - 18",
                                    "text",
                                    validationErrors.pages,
                                )}
                            </div>
                            <div className="flex-1">
                                {renderInput(
                                    "issn",
                                    "issn",
                                    journalForm.issn,
                                    handleJournalChange,
                                    "ISSN",
                                    false,
                                    "Enter ISSN",
                                    "text",
                                    validationErrors.issn,
                                )}
                            </div>
                        </div>

                        {renderRichTextInput(
                            "publisher",
                            "publisher",
                            journalForm.publisher,
                            handleJournalChange,
                            handleJournalFormattingChange,
                            "Publisher",
                            false,
                            "Enter publisher",
                            validationErrors.publisher,
                            false,
                            journalFormatting.publisher,
                        )}

                        {renderInput(
                            "doi",
                            "doi",
                            journalForm.doi,
                            handleJournalChange,
                            "DOI",
                            false,
                            "e.g., 10.1016/j.neucom.2025.131862 or doi:10.1016/j.neucom.2025.131862",
                            "text",
                            validationErrors.doi,
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Check size={18} />
                                )
                            }
                            size={embedded ? "medium" : "large"}
                            sx={{
                                mt: embedded ? 2 : 3,
                                borderRadius: "10px",
                                py: 1.2,
                            }}
                        >
                            {loading
                                ? "Submitting..."
                                : isEditMode
                                  ? "Update"
                                  : "Submit"}
                        </Button>
                    </form>
                );

            case "conference":
                return (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        {renderRichTextInput(
                            "title",
                            "title",
                            conferenceForm.title,
                            handleConferenceChange,
                            handleConferenceFormattingChange,
                            "Title",
                            true,
                            "Enter article title",
                            validationErrors.title,
                            false,
                            conferenceFormatting.title,
                        )}

                        {renderRichTextInput(
                            "authors",
                            "authors",
                            conferenceForm.authors,
                            handleConferenceChange,
                            handleConferenceFormattingChange,
                            "Authors",
                            false,
                            "Enter authors",
                            validationErrors.authors,
                            true,
                            conferenceFormatting.authors,
                        )}

                        {renderDateInputs(
                            conferenceForm,
                            handleConferenceChange,
                        )}
                        {validationErrors.year && (
                            <p className="text-red-400 text-xs mt-0.5">
                                {validationErrors.year}
                            </p>
                        )}

                        {renderRichTextInput(
                            "conferenceName",
                            "conferenceName",
                            conferenceForm.conferenceName,
                            handleConferenceChange,
                            handleConferenceFormattingChange,
                            "Conference Name",
                            true,
                            "Enter conference name",
                            validationErrors.conferenceName,
                            false,
                            conferenceFormatting.conferenceName,
                        )}

                        {renderInput(
                            "venue",
                            "venue",
                            conferenceForm.venue,
                            handleConferenceChange,
                            "Venue",
                            false,
                            "Enter venue",
                            "text",
                            validationErrors.venue,
                        )}

                        <div
                            className={`flex flex-col sm:flex-row ${embedded ? "gap-2" : "gap-3"} w-full`}
                        >
                            <div className="flex-1">
                                {renderInput(
                                    "pages",
                                    "pages",
                                    conferenceForm.pages,
                                    handleConferenceChange,
                                    "Pages",
                                    false,
                                    "e.g., 10 - 18",
                                    "text",
                                    validationErrors.pages,
                                )}
                            </div>
                            <div className="flex-1">
                                {renderInput(
                                    "isbn",
                                    "isbn",
                                    conferenceForm.isbn,
                                    handleConferenceChange,
                                    "ISBN",
                                    false,
                                    "Enter ISBN",
                                    "text",
                                    validationErrors.isbn,
                                )}
                            </div>
                        </div>

                        {renderRichTextInput(
                            "publisher",
                            "publisher",
                            conferenceForm.publisher,
                            handleConferenceChange,
                            handleConferenceFormattingChange,
                            "Publisher",
                            false,
                            "Enter publisher",
                            validationErrors.publisher,
                            false,
                            conferenceFormatting.publisher,
                        )}

                        {renderInput(
                            "doi",
                            "doi",
                            conferenceForm.doi,
                            handleConferenceChange,
                            "DOI",
                            false,
                            "10.1109/...",
                            "text",
                            validationErrors.doi,
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Check size={18} />
                                )
                            }
                            size={embedded ? "medium" : "large"}
                            sx={{
                                mt: embedded ? 2 : 3,
                                borderRadius: "10px",
                                py: 1.2,
                            }}
                        >
                            {loading
                                ? "Submitting..."
                                : isEditMode
                                  ? "Update"
                                  : "Submit"}
                        </Button>
                    </form>
                );

            case "book":
                return (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        {renderRichTextInput(
                            "title",
                            "title",
                            bookForm.title,
                            handleBookChange,
                            handleBookFormattingChange,
                            "Title",
                            true,
                            "Enter book title",
                            validationErrors.title,
                            false,
                            bookFormatting.title,
                        )}

                        {renderRichTextInput(
                            "authors",
                            "authors",
                            bookForm.authors,
                            handleBookChange,
                            handleBookFormattingChange,
                            "Authors",
                            true,
                            "Enter authors",
                            validationErrors.authors,
                            true,
                            bookFormatting.authors,
                        )}

                        {renderDateInputs(bookForm, handleBookChange)}
                        {validationErrors.year && (
                            <p className="text-red-400 text-xs mt-0.5">
                                {validationErrors.year}
                            </p>
                        )}

                        <div
                            className={`flex flex-col sm:flex-row ${embedded ? "gap-2" : "gap-3"} w-full`}
                        >
                            <div className="flex-1">
                                {renderInput(
                                    "pages",
                                    "pages",
                                    bookForm.pages,
                                    handleBookChange,
                                    "Pages",
                                    false,
                                    "e.g., 10 - 18",
                                    "text",
                                    validationErrors.pages,
                                )}
                            </div>
                            <div className="flex-1">
                                {renderInput(
                                    "isbn",
                                    "isbn",
                                    bookForm.isbn,
                                    handleBookChange,
                                    "ISBN",
                                    false,
                                    "Enter ISBN",
                                    "text",
                                    validationErrors.isbn,
                                )}
                            </div>
                        </div>

                        {renderRichTextInput(
                            "publisher",
                            "publisher",
                            bookForm.publisher,
                            handleBookChange,
                            handleBookFormattingChange,
                            "Publisher",
                            false,
                            "Enter publisher",
                            validationErrors.publisher,
                            false,
                            bookFormatting.publisher,
                        )}

                        {renderInput(
                            "doi",
                            "doi",
                            bookForm.doi,
                            handleBookChange,
                            "DOI",
                            false,
                            "e.g., 10.1007/978-3-031-77392-1_16",
                            "text",
                            validationErrors.doi,
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Check size={18} />
                                )
                            }
                            size={embedded ? "medium" : "large"}
                            sx={{
                                mt: embedded ? 2 : 3,
                                borderRadius: "10px",
                                py: 1.2,
                            }}
                        >
                            {loading
                                ? "Submitting..."
                                : isEditMode
                                  ? "Update"
                                  : "Submit"}
                        </Button>
                    </form>
                );

            case "patent":
                return (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        {renderRichTextInput(
                            "title",
                            "title",
                            patentForm.title,
                            handlePatentChange,
                            handlePatentFormattingChange,
                            "Title",
                            true,
                            "Enter patent title",
                            validationErrors.title,
                            false,
                            patentFormatting.title,
                        )}

                        {renderRichTextInput(
                            "inventors",
                            "inventors",
                            patentForm.inventors,
                            handlePatentChange,
                            handlePatentFormattingChange,
                            "Inventors",
                            false,
                            "Enter inventors",
                            validationErrors.inventors,
                            true,
                            patentFormatting.inventors,
                        )}

                        {renderDateInputs(patentForm, handlePatentChange)}
                        {validationErrors.year && (
                            <p className="text-red-400 text-xs mt-0.5">
                                {validationErrors.year}
                            </p>
                        )}

                        {renderInput(
                            "patentOffice",
                            "patentOffice",
                            patentForm.patentOffice,
                            handlePatentChange,
                            "Patent Office",
                            false,
                            "Enter patent office",
                            "text",
                            validationErrors.patentOffice,
                        )}

                        {renderInput(
                            "patentNumber",
                            "patentNumber",
                            patentForm.patentNumber,
                            handlePatentChange,
                            "Patent Number",
                            false,
                            "Enter patent number",
                            "text",
                            validationErrors.patentNumber,
                        )}

                        {renderInput(
                            "applicationNumber",
                            "applicationNumber",
                            patentForm.applicationNumber,
                            handlePatentChange,
                            "Application Number",
                            false,
                            "Enter application number",
                            "text",
                            validationErrors.applicationNumber,
                        )}

                        {renderInput(
                            "patentLink",
                            "patentLink",
                            patentForm.patentLink,
                            handlePatentChange,
                            "Patent Link",
                            false,
                            "https://patents.google.com/... or https://patents.uspto.gov/...",
                            "url",
                            validationErrors.patentLink,
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Check size={18} />
                                )
                            }
                            size={embedded ? "medium" : "large"}
                            sx={{
                                mt: embedded ? 2 : 3,
                                borderRadius: "10px",
                                py: 1.2,
                            }}
                        >
                            {loading
                                ? "Submitting..."
                                : isEditMode
                                  ? "Update"
                                  : "Submit"}
                        </Button>
                    </form>
                );

            case "dataset":
                return (
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col"
                        encType="multipart/form-data"
                    >
                        {renderRichTextInput(
                            "title",
                            "title",
                            datasetForm.title,
                            handleDatasetChange,
                            handleDatasetFormattingChange,
                            "Title",
                            true,
                            "Enter dataset title",
                            validationErrors.title,
                            false,
                            datasetFormatting.title,
                        )}

                        {renderRichTextInput(
                            "originators",
                            "originators",
                            datasetForm.originators,
                            handleDatasetChange,
                            handleDatasetFormattingChange,
                            "Originators",
                            false,
                            "Enter originators",
                            validationErrors.originators,
                            true,
                            datasetFormatting.originators,
                        )}

                        {renderDateInputs(datasetForm, handleDatasetChange)}
                        {validationErrors.year && (
                            <p className="text-red-400 text-xs mt-0.5">
                                {validationErrors.year}
                            </p>
                        )}

                        {renderInput(
                            "underPublication",
                            "underPublication",
                            datasetForm.underPublication,
                            handleDatasetChange,
                            "Under Publication",
                            false,
                            "Enter publication information",
                            "text",
                            validationErrors.underPublication,
                        )}

                        {renderInput(
                            "keywords",
                            "keywords",
                            datasetForm.keywords,
                            handleDatasetChange,
                            "Keywords",
                            false,
                            "Enter keywords separated by commas",
                            "text",
                            validationErrors.keywords,
                        )}

                        <Box sx={{ mt: 2, mb: 1, width: "100%" }}>
                            <Typography
                                sx={{
                                    fontSize: "0.75rem",
                                    color: "text.secondary",
                                    mb: 1,
                                }}
                            >
                                Dataset File (Optional)
                            </Typography>
                            <input
                                type="file"
                                id="dataset-file"
                                name="file"
                                onChange={(e) => {
                                    const file =
                                        e.target.files &&
                                        e.target.files.length > 0
                                            ? e.target.files[0]
                                            : null;
                                    setDatasetForm((prev) => ({
                                        ...prev,
                                        file: file || null,
                                    }));
                                }}
                                accept="*/*"
                                style={{ display: "none" }}
                            />
                            <Box
                                onClick={() =>
                                    document
                                        .getElementById("dataset-file")
                                        ?.click()
                                }
                                sx={{
                                    border: "1.5px dashed",
                                    borderColor: datasetForm.file
                                        ? "#99f6e4"
                                        : "#cbd5e1",
                                    borderRadius: "10px",
                                    px: 3,
                                    py: 2.5,
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.75,
                                    bgcolor: datasetForm.file
                                        ? "#f0fdfa"
                                        : "#f8fafc",
                                    transition: "border-color 0.2s",
                                    "&:hover": { borderColor: "#94a3b8" },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "10px",
                                        bgcolor: datasetForm.file
                                            ? "#ccfbf1"
                                            : "#e0f2fe",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Upload
                                        size={16}
                                        color={
                                            datasetForm.file
                                                ? "#0D9488"
                                                : "#0284c7"
                                        }
                                        strokeWidth={2}
                                    />
                                </Box>
                                <Typography
                                    sx={{
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        color: datasetForm.file
                                            ? "#115e59"
                                            : "#64748b",
                                    }}
                                >
                                    {datasetForm.file
                                        ? datasetForm.file.name
                                        : "Click to upload a file"}
                                </Typography>
                            </Box>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Check size={18} />
                                )
                            }
                            size={embedded ? "medium" : "large"}
                            sx={{
                                mt: embedded ? 2 : 3,
                                borderRadius: "10px",
                                py: 1.2,
                            }}
                        >
                            {loading
                                ? "Submitting..."
                                : isEditMode
                                  ? "Update"
                                  : "Submit"}
                        </Button>
                    </form>
                );

            default:
                return null;
        }
    };

    if (checkingAuth && !embedded) {
        return (
            <Box
                sx={{
                    bgcolor: "#f0f2f8",
                    minHeight: "100vh",
                    pt: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress size={32} />
            </Box>
        );
    }

    const tabItems = ["journal", "conference", "book", "patent", "dataset"];

    const handleTabChange = (_event, newValue) => {
        const tab = tabItems[newValue];
        if (isEditMode && editingArticleType) {
            const tabMap = {
                Journal: "journal",
                Conference: "conference",
                Book: "book",
                Patent: "patent",
                Dataset: "dataset",
            };
            if (tab === tabMap[editingArticleType]) setActiveTab(tab);
        } else {
            setActiveTab(tab);
        }
    };

    const isTabDisabled = (tab) => {
        if (!isEditMode || !editingArticleType) return false;
        const tabMap = {
            Journal: "journal",
            Conference: "conference",
            Book: "book",
            Patent: "patent",
            Dataset: "dataset",
        };
        return tab !== tabMap[editingArticleType];
    };

    if (embedded) {
        return (
            <Box>
                <Tabs
                    value={tabItems.indexOf(activeTab)}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 40,
                        mb: 2,
                        "& .MuiTab-root": {
                            minHeight: 40,
                            py: 1,
                            textTransform: "capitalize",
                            fontSize: "0.85rem",
                        },
                    }}
                >
                    {tabItems.map((tab) => (
                        <Tab
                            key={tab}
                            label={tab}
                            disabled={isTabDisabled(tab)}
                        />
                    ))}
                </Tabs>
                <Box>{renderForm()}</Box>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: "#f0f2f8", minHeight: "100vh", pt: "70px" }}>
            <Box sx={{ maxWidth: 720, mx: "auto", py: 5, px: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        color="text.primary"
                    >
                        {isEditMode
                            ? "Edit Article / Dataset"
                            : "Add Article / Dataset"}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Fill in the details below to submit.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        bgcolor: "white",
                        border: "1px solid #e8edf3",
                        borderRadius: "14px",
                        p: 3,
                    }}
                >
                    <Tabs
                        value={tabItems.indexOf(activeTab)}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            mb: 1,
                            "& .MuiTab-root": {
                                textTransform: "capitalize",
                                fontSize: "0.875rem",
                            },
                        }}
                    >
                        {tabItems.map((tab) => (
                            <Tab
                                key={tab}
                                label={tab}
                                disabled={isTabDisabled(tab)}
                            />
                        ))}
                    </Tabs>
                    <Box>{renderForm()}</Box>
                </Box>
            </Box>
        </Box>
    );
}

export default AddArticle;
