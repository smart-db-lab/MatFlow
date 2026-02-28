import React, { useState, useEffect } from "react";
import { isAdminLoggedIn, checkAdminStatus, isLoggedIn, isAuthenticated } from "../util/adminAuth";
import VisitorCounter from "../Components/VisitorCounter";
import { commonApi } from "../services/api/apiService";

import HeroSection from "./Landing/HeroSection";
import ServicesSection from "./Landing/ServicesSection";
import PublicationsSection from "./Landing/PublicationsSection";
import DatasetsSection from "./Landing/DatasetsSection";
import SupportSection from "./Landing/SupportSection";

function LandingPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedInState, setIsLoggedInState] = useState(false);

  // Articles
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
  const [activeArticleTab, setActiveArticleTab] = useState("publications");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("oldest");

  // Services
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Hero
  const [heroImages, setHeroImages] = useState([]);
  const [loadingHeroImages, setLoadingHeroImages] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Header
  const [headerSection, setHeaderSection] = useState(null);
  const [loadingHeaderSection, setLoadingHeaderSection] = useState(true);

  // Support logos
  const [supportLogos, setSupportLogos] = useState([]);
  const [loadingSupportLogos, setLoadingSupportLogos] = useState(true);

  useEffect(() => {
    document.title = "MLflow";
    return () => { document.title = "MLflow"; };
  }, []);

  useEffect(() => { commonApi.articles.getJournals().then(d => setJournals(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingJournals(false)); }, []);
  useEffect(() => { commonApi.articles.getConferences().then(d => setConferences(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingConferences(false)); }, []);
  useEffect(() => { commonApi.articles.getBooks().then(d => setBooks(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingBooks(false)); }, []);
  useEffect(() => { commonApi.articles.getPatents().then(d => setPatents(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingPatents(false)); }, []);
  useEffect(() => { commonApi.articles.getDatasets().then(d => setDatasets(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingDatasets(false)); }, []);
  useEffect(() => { commonApi.services.getAll().then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingServices(false)); }, []);
  useEffect(() => { commonApi.landing.getHeroImages().then(d => setHeroImages(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingHeroImages(false)); }, []);
  useEffect(() => { commonApi.landing.getHeaderSection().then(d => setHeaderSection(d)).catch(() => {}).finally(() => setLoadingHeaderSection(false)); }, []);
  useEffect(() => { commonApi.landing.getSupportLogos().then(d => setSupportLogos(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingSupportLogos(false)); }, []);

  useEffect(() => {
    if (heroImages.length > 0) {
      setCurrentHeroIndex((prev) => (prev >= heroImages.length ? 0 : prev));
    } else {
      setCurrentHeroIndex(0);
    }
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isLoggedIn();
      setIsLoggedInState(loggedIn);
      if (loggedIn) {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus || isAdminLoggedIn());
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);

    const handleServerDown = () => {
      setIsLoggedInState(false);
      setIsAdmin(false);
    };
    window.addEventListener("auth:server-down", handleServerDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("auth:server-down", handleServerDown);
    };
  }, []);

  useEffect(() => {
    const trackVisit = async () => {
      try {
        let visitorId = localStorage.getItem("visitorId");
        if (!visitorId) {
          visitorId =
            "v-" +
            (crypto.randomUUID?.() ||
              "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
              }));
          localStorage.setItem("visitorId", visitorId);
        }
        const visitorType = isAuthenticated() ? "user" : "guest";
        await commonApi.visitors.trackVisit(visitorId, visitorType);
      } catch {
        // non-critical
      }
    };
    trackVisit();
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1);
      if (["services", "publications", "datasets"].includes(sectionId)) {
        const element = document.getElementById(sectionId);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    }
  }, []);

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col" style={{ paddingTop: "70px" }}>
      <style>{`
        @keyframes mf-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mf-hero-enter   { animation: mf-fade-up 0.7s ease-out both; }
        .mf-hero-enter-d1 { animation: mf-fade-up 0.7s ease-out 0.1s both; }
        .mf-hero-enter-d2 { animation: mf-fade-up 0.7s ease-out 0.2s both; }
        .mf-hero-enter-d3 { animation: mf-fade-up 0.7s ease-out 0.35s both; }
        .mf-hero-enter-d4 { animation: mf-fade-up 0.7s ease-out 0.5s both; }
      `}</style>

      <HeroSection
        headerSection={headerSection}
        loadingHeaderSection={loadingHeaderSection}
        heroImages={heroImages}
        loadingHeroImages={loadingHeroImages}
        currentHeroIndex={currentHeroIndex}
        setCurrentHeroIndex={setCurrentHeroIndex}
      />

      <ServicesSection services={services} loadingServices={loadingServices} />

      <PublicationsSection
        journals={journals}
        conferences={conferences}
        books={books}
        patents={patents}
        loadingJournals={loadingJournals}
        loadingConferences={loadingConferences}
        loadingBooks={loadingBooks}
        loadingPatents={loadingPatents}
        activeArticleTab={activeArticleTab}
        setActiveArticleTab={setActiveArticleTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      <DatasetsSection
        datasets={datasets}
        loadingDatasets={loadingDatasets}
        searchQuery={searchQuery}
        sortOption={sortOption}
      />

      <SupportSection
        supportLogos={supportLogos}
        loadingSupportLogos={loadingSupportLogos}
      />

      <VisitorCounter />

      <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="text-sm text-gray-500 text-center">
            &copy; 2026{" "}
            <span className="font-semibold text-gray-900">MLflow</span>. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
