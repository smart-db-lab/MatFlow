import React, { useState, useEffect, useRef } from "react";
import { isAdminLoggedIn, checkAdminStatus, isLoggedIn } from "../util/adminAuth";
import FormattedText from "../components/FormattedText";
import { commonApi } from "../services/api/apiService";

function LandingPage() {
  // State for API data
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  // State for articles
  const [journals, setJournals] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [books, setBooks] = useState([]);
  const [patents, setPatents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [loadingConferences, setLoadingConferences] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingPatents, setLoadingPatents] = useState(true);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [activeArticleTab, setActiveArticleTab] = useState('publications');
  
  // Search and sort states for articles
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("oldest"); // newest, oldest, title-asc, title-desc
  
  // Services state
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Hero images carousel state
  const [heroImages, setHeroImages] = useState([]);
  const [loadingHeroImages, setLoadingHeroImages] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  // Header section state
  const [headerSection, setHeaderSection] = useState(null);
  const [loadingHeaderSection, setLoadingHeaderSection] = useState(true);
  
  // Support logos state
  const [supportLogos, setSupportLogos] = useState([]);
  const [loadingSupportLogos, setLoadingSupportLogos] = useState(true);

  // Refs for parallax elements
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const backgroundRef = useRef(null);

  // Set document title for MLflow landing page
  useEffect(() => {
    document.title = 'MLflow';
    return () => {
      // Reset to default when component unmounts
      document.title = 'MLflow';
    };
  }, []);

  // Fetch journals
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await commonApi.articles.getJournals();
        setJournals(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching journals:', error);
      } finally {
        setLoadingJournals(false);
      }
    };

    fetchJournals();
  }, []);

  // Fetch conferences
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const data = await commonApi.articles.getConferences();
        setConferences(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching conferences:', error);
      } finally {
        setLoadingConferences(false);
      }
    };

    fetchConferences();
  }, []);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await commonApi.articles.getBooks();
        setBooks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

  // Fetch patents
  useEffect(() => {
    const fetchPatents = async () => {
      try {
        const data = await commonApi.articles.getPatents();
        setPatents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching patents:', error);
      } finally {
        setLoadingPatents(false);
      }
    };

    fetchPatents();
  }, []);

  // Fetch datasets (article type)
  useEffect(() => {
    const fetchArticleDatasets = async () => {
      try {
        const data = await commonApi.articles.getDatasets();
        setDatasets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching article datasets:', error);
      } finally {
        setLoadingDatasets(false);
      }
    };

    fetchArticleDatasets();
  }, []);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await commonApi.services.getAll();
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch hero images
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const data = await commonApi.landing.getHeroImages();
        setHeroImages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching hero images:', error);
      } finally {
        setLoadingHeroImages(false);
      }
    };

    fetchHeroImages();
  }, []);

  // Fetch header section
  useEffect(() => {
    const fetchHeaderSection = async () => {
      try {
        const data = await commonApi.landing.getHeaderSection();
        setHeaderSection(data);
      } catch (error) {
        console.error('Error fetching header section:', error);
      } finally {
        setLoadingHeaderSection(false);
      }
    };

    fetchHeaderSection();
  }, []);

  // Fetch support logos
  useEffect(() => {
    const fetchSupportLogos = async () => {
      try {
        const data = await commonApi.landing.getSupportLogos();
        setSupportLogos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching support logos:', error);
      } finally {
        setLoadingSupportLogos(false);
      }
    };

    fetchSupportLogos();
  }, []);

  // Reset carousel index when images change
  useEffect(() => {
    if (heroImages.length > 0) {
      // Reset index if it's out of bounds
      setCurrentHeroIndex((prev) => {
        if (prev >= heroImages.length) {
          return 0;
        }
        return prev;
      });
    } else {
      setCurrentHeroIndex(0);
    }
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isLoggedIn();
      setIsLoggedInState(loggedIn);
      
      if (loggedIn) {
        const adminStatus = await checkAdminStatus();
        const adminLoggedIn = adminStatus || isAdminLoggedIn();
        setIsAdmin(adminLoggedIn);
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);

    // When server is down, apiClient clears tokens and dispatches this event
    const handleServerDown = () => {
      setIsLoggedInState(false);
      setIsAdmin(false);
    };
    window.addEventListener('auth:server-down', handleServerDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth:server-down', handleServerDown);
    };
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle smooth scroll to sections when hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1); // Remove the # symbol
      const validSections = ['services', 'publications', 'datasets'];
      if (validSections.includes(sectionId)) {
        const element = document.getElementById(sectionId);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    }
  }, []);

  // Helper function to get file icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv':
        return '📊';
      case 'xlsx':
      case 'xls':
        return '📈';
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      default:
        return '📁';
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  // Helper function to format publication date (YYYY, YYYY-MM, or YYYY-MM-DD)
  const formatPublicationDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 1) {
      return parts[0]; // Year only
    } else if (parts.length === 2) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = parseInt(parts[1]) - 1;
      return `${monthNames[month]} ${parts[0]}`; // Month Year
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = parseInt(parts[1]) - 1;
      return `${parts[2]} ${monthNames[month]} ${parts[0]}`; // Day Month Year
    }
  };

  // Combine all articles into one array with type labels
  const getAllArticles = () => {
    const allArticles = [
      ...journals.map(j => ({ ...j, articleType: 'Journal' })),
      ...conferences.map(c => ({ ...c, articleType: 'Conference' })),
      ...books.map(b => ({ ...b, articleType: 'Book' })),
      ...patents.map(p => ({ ...p, articleType: 'Patent' })),
      ...datasets.map(d => ({ ...d, articleType: 'Dataset' })),
    ];
    return allArticles;
  };

  const isLoadingArticles = loadingJournals || loadingConferences || loadingBooks || loadingPatents || loadingDatasets;

  // Helper function to convert formatting metadata to HTML
  const formatTextWithMetadata = (text, formatting) => {
    // If no formatting metadata, return plain text
    if (!formatting || !Array.isArray(formatting) || formatting.length === 0) {
      return text || '';
    }
    
    // Build HTML from segments
    const htmlParts = formatting.map((segment, idx) => {
      if (!segment || !segment.text) return '';
      
      let html = segment.text;
      // Apply formatting tags (can have multiple)
      if (segment.bold) html = `<strong>${html}</strong>`;
      if (segment.italic) html = `<em>${html}</em>`;
      if (segment.underline) html = `<u>${html}</u>`;
      
      return html;
    }).filter(part => part.length > 0); // Remove empty parts
    
    const formattedHtml = htmlParts.join('');
    
    // If formatted HTML is empty or doesn't match text length, return original text
    // This handles cases where segments might not match the text exactly
    if (!formattedHtml || formattedHtml.replace(/<[^>]*>/g, '').length !== (text || '').length) {
      return text || '';
    }
    
    return formattedHtml;
  };

  // Helper function to format citation based on article type
  const formatCitationByType = (article, index) => {
    const articleType = article.articleType || '';
    switch (articleType) {
      case 'Journal':
        return formatJournalCitation(article, index);
      case 'Conference':
        return formatConferenceCitation(article, index);
      case 'Book':
        return formatBookCitation(article, index);
      case 'Patent':
        return formatPatentCitation(article, index);
      default:
        return formatJournalCitation(article, index);
    }
  };

  // Helper function to get article type label
  const getArticleTypeLabel = (article) => {
    const articleType = article.articleType || '';
    switch (articleType) {
      case 'Journal':
        return 'Journal';
      case 'Conference':
        return 'Conference Paper';
      case 'Book':
        return 'Book';
      case 'Patent':
        return 'Patent';
      default:
        return 'Publication';
    }
  };

  // Format citation for Journals (IEEE Style)
  const formatJournalCitation = (article, index) => {
    const authors = article.authors || 'N/A';
    const year = article.publication_date ? article.publication_date.split('-')[0] : '';
    const title = article.title || '';
    const journal = article.journal_name || '';
    const formatting = article.formatting_metadata || {};
    
    // Apply formatting if available
    const formattedAuthors = formatTextWithMetadata(authors, formatting.authors) || authors;
    const formattedTitle = formatTextWithMetadata(title, formatting.title) || title;
    const formattedJournal = formatTextWithMetadata(journal, formatting.journal_name) || journal;
    const formattedVolume = article.volume ? (formatTextWithMetadata(article.volume, formatting.volume) || article.volume) : '';
    
    let citation = `<strong>${index}.</strong> ${formattedAuthors}, "${formattedTitle}"`;
    if (journal) citation += `, ${formattedJournal}`;
    if (article.volume) citation += `, vol. ${formattedVolume}`;
    if (article.issue) citation += `, no. ${article.issue}`;
    if (article.pages) {
      const pages = article.pages.includes('-') ? article.pages : article.pages;
      citation += `, pp. ${pages}`;
    }
    if (year) citation += `, ${year}`;
    citation += '.';
    // Add DOI as hyperlink if it exists
    if (article.doi) {
      const doiValue = article.doi.startsWith('http') ? article.doi : article.doi.startsWith('doi:') ? article.doi : `doi:${article.doi}`;
      const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
      citation += ` <a href="${doiUrl}" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">${doiValue}</a>`;
    }
    return citation;
  };

  // Format citation for Conference Papers (IEEE Style)
  const formatConferenceCitation = (article, index) => {
    const authors = article.authors || 'N/A';
    const year = article.publication_date ? article.publication_date.split('-')[0] : '';
    const title = article.title || '';
    const conference = article.conference_name || '';
    const venue = article.venue || '';
    const formatting = article.formatting_metadata || {};
    
    // Apply formatting if available
    const formattedAuthors = formatTextWithMetadata(authors, formatting.authors) || authors;
    const formattedTitle = formatTextWithMetadata(title, formatting.title) || title;
    const formattedConference = formatTextWithMetadata(conference, formatting.conference_name) || conference;
    
    let citation = `<strong>${index}.</strong> ${formattedAuthors}, "${formattedTitle}"`;
    if (conference) {
      citation += `, in Proc. ${formattedConference}`;
      if (venue) citation += `, ${venue}`;
    }
    if (year) citation += `, ${year}`;
    if (article.pages) {
      const pages = article.pages.includes('-') ? article.pages : article.pages;
      citation += `, pp. ${pages}`;
    }
    citation += '.';
    // Add DOI as hyperlink if it exists
    if (article.doi) {
      const doiValue = article.doi.startsWith('http') ? article.doi : article.doi.startsWith('doi:') ? article.doi : `doi:${article.doi}`;
      const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
      citation += ` <a href="${doiUrl}" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">${doiValue}</a>`;
    }
    return citation;
  };

  // Format citation for Books (IEEE Style)
  const formatBookCitation = (article, index) => {
    const authors = article.authors || 'N/A';
    const year = article.publication_date ? article.publication_date.split('-')[0] : '';
    const title = article.title || '';
    const city = article.city || '';
    const publisher = article.publisher || '';
    const edition = article.edition ? `${article.edition} ed.` : '';
    const formatting = article.formatting_metadata || {};
    
    // Apply formatting if available
    const formattedAuthors = formatTextWithMetadata(authors, formatting.authors) || authors;
    const formattedTitle = formatTextWithMetadata(title, formatting.title) || title;
    const formattedPublisher = formatTextWithMetadata(publisher, formatting.publisher) || publisher;
    
    let citation = `<strong>${index}.</strong> ${formattedAuthors}, ${formattedTitle}`;
    if (edition) citation += `, ${edition}`;
    if (city && publisher) citation += `. ${city}: ${formattedPublisher}`;
    else if (publisher) citation += `. ${formattedPublisher}`;
    if (year) citation += `, ${year}`;
    citation += '.';
    // Add DOI as hyperlink if it exists
    if (article.doi) {
      const doiValue = article.doi.startsWith('http') ? article.doi : article.doi.startsWith('doi:') ? article.doi : `doi:${article.doi}`;
      const doiUrl = doiValue.startsWith('http') ? doiValue : `https://doi.org/${doiValue.replace(/^doi:/, '')}`;
      citation += ` <a href="${doiUrl}" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">${doiValue}</a>`;
    }
    return citation;
  };

  // Format citation for Patents (IEEE Style)
  const formatPatentCitation = (article, index) => {
    const inventors = article.inventors || 'N/A';
    const title = article.title || '';
    const patentNumber = article.patent_number || '';
    const office = article.patent_office || 'U.S. Patent';
    const formatting = article.formatting_metadata || {};
    
    // Apply formatting if available
    const formattedInventors = formatTextWithMetadata(inventors, formatting.inventors) || inventors;
    const formattedTitle = formatTextWithMetadata(title, formatting.title) || title;
    
    // Format date
    let dateStr = '';
    if (article.publication_date) {
      const dateParts = article.publication_date.split('-');
      if (dateParts.length === 3) {
        const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const year = dateParts[0];
        dateStr = `${monthNames[month]} ${day}, ${year}`;
      } else if (dateParts.length === 1) {
        dateStr = dateParts[0];
      }
    }
    
    let citation = `<strong>${index}.</strong> ${formattedInventors}, "${formattedTitle}"`;
    if (office && patentNumber) citation += `, ${office} ${patentNumber}`;
    else if (patentNumber) citation += `, ${patentNumber}`;
    if (dateStr) citation += `, ${dateStr}`;
    citation += '.';
    // Add patent link as hyperlink if it exists
    if (article.patent_link) {
      citation += ` <a href="${article.patent_link}" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">View Patent</a>`;
    }
    return citation;
  };

  // Format citation for Datasets (IEEE Style)
  const formatDatasetCitation = (article, index) => {
    const originators = article.originators || 'N/A';
    const year = article.publication_date ? article.publication_date.split('-')[0] : '';
    const title = article.title || '';
    const publication = article.under_publication || '';
    const keywords = article.keywords || '';
    const formatting = article.formatting_metadata || {};
    
    // Apply formatting if available
    const formattedOriginators = formatTextWithMetadata(originators, formatting.originators) || originators;
    const formattedTitle = formatTextWithMetadata(title, formatting.title) || title;
    
    // IEEE format for datasets: Originators, "Title," Publisher/Repository, Year. [Online]. Available: URL
    let citation = `<strong>${index}.</strong> ${formattedOriginators}, "${formattedTitle}"`;
    if (publication) {
      citation += `. ${publication}`;
    }
    if (year) {
      citation += `, ${year}`;
    }
    citation += '.';
    
    // Add keywords if available
    if (keywords) {
      citation += ` Keywords: ${keywords}.`;
    }
    
    // Return citation without download link (will be added separately in UI)
    return citation;
  };
  
  // Helper function to get dataset file URL
  const getDatasetFileUrl = (article) => {
    const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';
    return article.file_url 
      ? (article.file_url.startsWith('http') ? article.file_url : `${baseUrl}${article.file_url}`)
      : null;
  };

  // Parallax transform values
  const heroParallax = scrollY * 0.5;
  const servicesParallax = scrollY * 0.3;
  const backgroundParallax = scrollY * 0.2;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Animated Background Elements */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          transform: `translateY(${backgroundParallax}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-btn/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated gradient mesh */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(scrollY * 0.001) * 10}% ${50 + Math.cos(scrollY * 0.001) * 10}%, rgba(0, 186, 124, 0.1) 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative z-10 mt-12 py-8 flex items-center justify-center px-6"
        style={{
          transform: `translateY(${heroParallax * 0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="w-full lg:max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              {loadingHeaderSection ? (
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold font-titillium mb-3 bg-gradient-to-r from-primary-btn via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                    {headerSection?.title || "Workflow"}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-3xl mx-auto lg:mx-0 font-roboto">
                    {headerSection?.content || "Your comprehensive platform for data science, machine learning, and research tools"}
                  </p>
                </>
              )}
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              </div>
            </div>
            
            {/* Right: Hero Image Carousel */}
            <div className="flex-1 relative">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-primary-btn/20 bg-gradient-to-br from-white to-gray-50/50">
                {loadingHeroImages ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn"></div>
                  </div>
                ) : heroImages.length > 0 ? (
                  <div className="relative w-full h-[300px] overflow-hidden">
                    {heroImages.map((hero, index) => {
                      if (!hero || !hero.id) return null;
                      
                      const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';
                      const imageUrl = hero.hero_image 
                        ? (hero.hero_image.startsWith('http') ? hero.hero_image : `${baseUrl}${hero.hero_image}`)
                        : '/machine-learning.webp';
                      
                      const isActive = index === currentHeroIndex;
                      
                      return (
                        <div
                          key={hero.id || index}
                          className={`absolute inset-0 transition-opacity duration-500 ${
                            isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                          }`}
                          style={{
                            transform: `translateY(${heroParallax * 0.15}px)`,
                            transition: 'transform 0.1s ease-out, opacity 0.5s ease-in-out'
                          }}
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Hero ${index + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = '/machine-learning.webp';
                            }}
                          />
                        </div>
                      );
                    })}
                    
                    {/* Carousel Controls */}
                    {heroImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                          aria-label="Previous image"
                        >
                          <svg className="w-5 h-5 text-primary-btn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                          aria-label="Next image"
                        >
                          <svg className="w-5 h-5 text-primary-btn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Dots indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                          {heroImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentHeroIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentHeroIndex ? 'bg-primary-btn w-6' : 'bg-white/60 hover:bg-white/80'
                              }`}
                              aria-label={`Go to slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <img 
                    src="/machine-learning.webp" 
                    alt="Machine Learning" 
                    className="w-full h-auto max-h-[300px] object-contain"
                    style={{
                      transform: `translateY(${heroParallax * 0.15}px)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        ref={servicesRef}
        id="services"
        className="relative z-10 py-3 px-6"
        style={{
          transform: `translateY(${servicesParallax * 0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="w-full lg:max-w-[1400px] mx-auto">
          <div className="w-full flex justify-center mb-2">
            <h2 className="text-2xl md:text-3xl font-bold font-titillium text-gray-800 text-center">
              Our Services
            </h2>
          </div>

          {loadingServices ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-btn"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {services.map((service) => {
                const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';
                const logoUrl = service.service_logo 
                  ? (service.service_logo.startsWith('http') ? service.service_logo : `${baseUrl}${service.service_logo}`)
                  : null;
                
                return (
                  <a
                    key={service.id}
                    href={service.service_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-white to-gray-50/50 border border-primary-btn/30 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 h-full flex flex-col"
                  >
                    <div className="relative px-5 py-6 text-center flex flex-col h-full">
                      <div className="mb-4 flex justify-center">
                        {logoUrl ? (
                          <div className="w-16 h-16 rounded-lg bg-primary-btn/10 flex items-center justify-center group-hover:bg-primary-btn/20 transition-colors duration-300">
                            <img 
                              src={logoUrl} 
                              alt={service.service_name} 
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-primary-btn"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary-btn/10 flex items-center justify-center group-hover:bg-primary-btn/20 transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary-btn">
                              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold font-titillium text-gray-800 mb-2 group-hover:text-primary-btn transition-colors duration-300">
                        {service.service_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 font-roboto line-clamp-2 flex-grow">
                        {service.service_description}
                      </p>
                      <div className="flex items-center justify-center text-primary-btn font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                        <span>Explore</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No services available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Research and Publication Section */}
      <section id="publications" className="relative z-10 py-2 px-6 scroll-mt-20">
        <div className="w-full lg:max-w-[1400px] mx-auto">
          <div className="w-full flex justify-center mb-2">
            <h2 className="text-2xl md:text-3xl font-bold font-titillium text-gray-800 text-center py-1.5">
              Research and Publications
            </h2>
          </div>
          {/* Articles Section with Tabs */}
          <div className="border border-primary-btn/30 rounded-xl bg-gradient-to-br from-white to-gray-50/50 shadow-md p-3">
            {/* Search and Sort Controls - Compact Design */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3 justify-end">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn/30 focus:border-primary-btn"
                />
                <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn/30 focus:border-primary-btn bg-white w-full sm:w-auto sm:min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveArticleTab('publications')}
                className={`px-4 py-2 font-bold text-sm transition-colors ${
                  activeArticleTab === 'publications'
                    ? 'text-primary-btn border-b-2 border-primary-btn'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                PUBLICATIONS
              </button>
              <button
                onClick={() => setActiveArticleTab('journals')}
                className={`px-4 py-2 font-bold text-sm transition-colors ${
                  activeArticleTab === 'journals'
                    ? 'text-primary-btn border-b-2 border-primary-btn'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                JOURNALS
              </button>
              <button
                onClick={() => setActiveArticleTab('conferences')}
                className={`px-4 py-2 font-bold text-sm transition-colors ${
                  activeArticleTab === 'conferences'
                    ? 'text-primary-btn border-b-2 border-primary-btn'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                CONFERENCE PAPERS
              </button>
              <button
                onClick={() => setActiveArticleTab('patents')}
                className={`px-4 py-2 font-bold text-sm transition-colors ${
                  activeArticleTab === 'patents'
                    ? 'text-primary-btn border-b-2 border-primary-btn'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                PATENTS
              </button>
              <button
                onClick={() => setActiveArticleTab('books')}
                className={`px-4 py-2 font-bold text-sm transition-colors ${
                  activeArticleTab === 'books'
                    ? 'text-primary-btn border-b-2 border-primary-btn'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                BOOKS
              </button>
            </div>

            {/* Tab Content */}
            {isLoadingArticles ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-btn"></div>
              </div>
            ) : (() => {
              // Get current tab's articles and apply filter/sort
              let currentArticles = [];
              let isLoading = false;
              let articleType = '';
              
              if (activeArticleTab === 'journals') {
                currentArticles = journals;
                isLoading = loadingJournals;
                articleType = 'journals';
              } else if (activeArticleTab === 'conferences') {
                currentArticles = conferences;
                isLoading = loadingConferences;
                articleType = 'conferences';
              } else if (activeArticleTab === 'books') {
                currentArticles = books;
                isLoading = loadingBooks;
                articleType = 'books';
              } else if (activeArticleTab === 'patents') {
                currentArticles = patents;
                isLoading = loadingPatents;
                articleType = 'patents';
              } else if (activeArticleTab === 'publications') {
                // Combine only journals, conferences, books, and patents (exclude datasets)
                currentArticles = [
                  ...journals.map(j => ({ ...j, articleType: 'Journal' })),
                  ...conferences.map(c => ({ ...c, articleType: 'Conference' })),
                  ...books.map(b => ({ ...b, articleType: 'Book' })),
                  ...patents.map(p => ({ ...p, articleType: 'Patent' })),
                ];
                isLoading = loadingJournals || loadingConferences || loadingBooks || loadingPatents;
                articleType = 'publications';
              }
              
              const filteredAndSorted = filterAndSortArticles(currentArticles);
              // Reverse the array so oldest is at bottom, newest at top (for default "oldest" sort)
              // But keep numbering: oldest (bottom) = 1, newest (top) = highest number
              const displayArticles = sortOption === "oldest" ? [...filteredAndSorted].reverse() : filteredAndSorted;
              const itemCount = displayArticles.length;
              const shouldScroll = itemCount > 5;
              
              return (
              <div className={shouldScroll ? "max-h-[60vh] overflow-y-auto" : ""} style={shouldScroll ? {
                scrollbarWidth: 'thin',
                scrollbarColor: '#00ba7c rgba(0, 186, 124, 0.1)'
              } : {}}>
                {/* Journals Tab */}
                {activeArticleTab === 'journals' && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
                      </div>
                    ) : displayArticles.length > 0 ? (
                      displayArticles.map((article, index) => {
                        // Numbering: oldest (bottom) = 1, newest (top) = highest number
                        const number = sortOption === "oldest" ? (displayArticles.length - index) : (index + 1);
                        const citation = formatJournalCitation(article, number);
                        return (
                          <div key={article.id} className="text-sm text-gray-800 leading-relaxed">
                            <span dangerouslySetInnerHTML={{ __html: citation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        );
                      })
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No journals found matching your search</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No journals available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Conference Papers Tab */}
                {activeArticleTab === 'conferences' && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
                      </div>
                    ) : displayArticles.length > 0 ? (
                      displayArticles.map((article, index) => {
                        // Numbering: oldest (bottom) = 1, newest (top) = highest number
                        const number = sortOption === "oldest" ? (displayArticles.length - index) : (index + 1);
                        const citation = formatConferenceCitation(article, number);
                        return (
                          <div key={article.id} className="text-sm text-gray-800 leading-relaxed">
                            <span dangerouslySetInnerHTML={{ __html: citation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        );
                      })
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No conference papers found matching your search</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No conference papers available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Books Tab */}
                {activeArticleTab === 'books' && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
                      </div>
                    ) : displayArticles.length > 0 ? (
                      displayArticles.map((article, index) => {
                        // Numbering: oldest (bottom) = 1, newest (top) = highest number
                        const number = sortOption === "oldest" ? (displayArticles.length - index) : (index + 1);
                        const citation = formatBookCitation(article, number);
                        // Replace ISBN only (DOI is already handled in formatBookCitation)
                        // Split by anchor tags to avoid double-wrapping
                        const parts = citation.split(/(<a[^>]*>.*?<\/a>)/g);
                        const citationWithLinks = parts.map(part => {
                          // If part is already an anchor tag, return as is
                          if (part.match(/^<a[^>]*>.*?<\/a>$/)) {
                            return part;
                          }
                          // Otherwise, replace ISBN and URLs
                          return part.replace(/(ISBN:|https?:\/\/[^\s<]+)/g, '<a href="$1" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
                        }).join('');
                        return (
                          <div key={article.id} className="text-sm text-gray-800 leading-relaxed">
                            <span dangerouslySetInnerHTML={{ __html: citationWithLinks.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        );
                      })
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No books found matching your search</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No books available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Patents Tab */}
                {activeArticleTab === 'patents' && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
                      </div>
                    ) : displayArticles.length > 0 ? (
                      displayArticles.map((article, index) => {
                        // Numbering: oldest (bottom) = 1, newest (top) = highest number
                        const number = sortOption === "oldest" ? (displayArticles.length - index) : (index + 1);
                        const citation = formatPatentCitation(article, number);
                        return (
                          <div key={article.id} className="text-sm text-gray-800 leading-relaxed">
                            <span dangerouslySetInnerHTML={{ __html: citation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        );
                      })
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No patents found matching your search</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No patents available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Publications Tab - All articles combined */}
                {activeArticleTab === 'publications' && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
                      </div>
                    ) : displayArticles.length > 0 ? (
                      displayArticles.map((article, index) => {
                        // Numbering: oldest (bottom) = 1, newest (top) = highest number
                        const number = sortOption === "oldest" ? (displayArticles.length - index) : (index + 1);
                        const citation = formatCitationByType(article, number);
                        const typeLabel = getArticleTypeLabel(article);
                        
                        // Insert type in parentheses after the number
                        // Handle both <strong>number.</strong> and <strong>number</strong> formats
                        // Format: Number(Type). rest of citation
                        let formattedCitation = citation.replace(
                          /(<strong>)(\d+)(\.?)(<\/strong>)/,
                          `$1$2(${typeLabel}).$4`
                        );
                        
                        // Handle Book citations with special link formatting
                        if (article.articleType === 'Book') {
                          const parts = formattedCitation.split(/(<a[^>]*>.*?<\/a>)/g);
                          formattedCitation = parts.map(part => {
                            if (part.match(/^<a[^>]*>.*?<\/a>$/)) {
                              return part;
                            }
                            return part.replace(/(ISBN:|https?:\/\/[^\s<]+)/g, '<a href="$1" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
                          }).join('');
                        }
                        
                        return (
                          <div key={`${article.articleType}-${article.id}`} className="text-sm text-gray-800 leading-relaxed">
                            <span dangerouslySetInnerHTML={{ __html: formattedCitation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        );
                      })
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No publications found matching your search</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No publications available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })()}
          </div>

          {/* Datasets Section */}
          <div id="datasets" className="w-full">
            <div className="w-full flex justify-center mb-2 mt-6">
              <h2 className="text-2xl md:text-3xl font-bold font-titillium text-gray-800 text-center">
                Datasets
              </h2>
            </div>
            <div className="mt-3 border border-primary-btn/30 rounded-xl bg-gradient-to-br from-white to-gray-50/50 shadow-md p-3">
            {loadingDatasets ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-btn"></div>
              </div>
            ) : datasets.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#00ba7c rgba(0, 186, 124, 0.1)'
              }}>
                {(() => {
                  const filteredAndSorted = filterAndSortArticles(datasets);
                  // Reverse the array so oldest is at bottom, newest at top (for default "oldest" sort)
                  const displayDatasets = sortOption === "oldest" ? [...filteredAndSorted].reverse() : filteredAndSorted;
                  return displayDatasets.map((dataset, idx) => {
                    // Numbering: oldest (bottom) = 1, newest (top) = highest number
                    const number = sortOption === "oldest" ? (displayDatasets.length - idx) : (idx + 1);
                    const citation = formatDatasetCitation(dataset, number);
                    const fileUrl = getDatasetFileUrl(dataset);
                    return (
                      <div key={dataset.id} className="flex items-start justify-between gap-3 text-sm text-gray-800 leading-relaxed">
                        <span className="flex-1" dangerouslySetInnerHTML={{ __html: citation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        {fileUrl && (
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-primary-btn hover:text-primary-btn/80 transition-colors"
                            title="Download Dataset"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-1">📁</div>
                <p className="text-sm text-gray-600">No datasets available</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="relative z-10 py-8 px-6">
        <div className="w-full lg:max-w-[1400px] mx-auto">
          <div className="w-full flex justify-center mb-2">
            <h2 className="text-2xl md:text-3xl font-bold font-titillium text-gray-800 text-center">
              Support
            </h2>
          </div>
          
          {loadingSupportLogos ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-btn"></div>
            </div>
          ) : supportLogos.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {supportLogos.map((logo) => {
                const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';
                const logoUrl = logo.support_logo 
                  ? (logo.support_logo.startsWith('http') ? logo.support_logo : `${baseUrl}${logo.support_logo}`)
                  : null;
                
                return (
                  <div key={logo.id} className="flex items-center justify-center">
                    <img 
                      src={logoUrl} 
                      alt="Support Logo" 
                      className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {/* Fallback to default logos if no support logos are configured */}
              <div className="flex items-center justify-center">
                <img 
                  src="/python.png" 
                  alt="Python" 
                  className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="flex items-center justify-center">
                <img 
                  src="/pandas.png" 
                  alt="Pandas" 
                  className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="flex items-center justify-center">
                <img 
                  src="/scikit.png" 
                  alt="Scikit-learn" 
                  className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="flex items-center justify-center">
                <img 
                  src="/seaborn.png" 
                  alt="Seaborn" 
                  className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-8 border-t border-primary-btn/30 bg-gradient-to-br from-white to-gray-50/50">
        <div className="w-full lg:max-w-[1400px] mx-auto px-6 py-2">
          <div className="text-center">
            <p className="text-xs md:text-sm font-titillium font-medium text-gray-700">
              © 2025 <span className="font-bold text-gray-900">Workflow</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add CSS for gradient animation */}
      <style>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;


