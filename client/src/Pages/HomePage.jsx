import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { serviceAdminApi } from "../services/api/apiService";
import { mlflowApi } from "../services/api/mlflowApi";

function HomePage() {
  const [headerSection, setHeaderSection] = useState(null);
  const [heroImages, setHeroImages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqLoaded, setFaqLoaded] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    document.title = 'Matflow';
    return () => { document.title = 'MLflow'; };
  }, []);

  useEffect(() => {
    const cleanText = (text) => {
      if (!text || typeof text !== 'string') return null;
      let cleaned = text.trim();
      cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
      cleaned = cleaned.replace(/(http:\/\/localhost:\d+[^\s]*)/gi, '');
      cleaned = cleaned.trim();
      if (cleaned && cleaned.length > 0 && cleaned.length < 500 && !cleaned.match(/^https?:\/\//i)) {
        return cleaned;
      }
      return null;
    };

    const loadContent = async () => {
      try {
        const header = await serviceAdminApi.landing.getHeaderSection("matflow");
        if (header && typeof header === 'object') {
          const cleanedHeader = {
            ...header,
            title: cleanText(header.title),
            content: cleanText(header.content),
          };
          if (cleanedHeader.title || cleanedHeader.content) {
            setHeaderSection(cleanedHeader);
          } else {
            setHeaderSection(null);
          }
        } else {
          setHeaderSection(null);
        }
      } catch (e) {
        console.error('Error loading header section:', e);
        setHeaderSection(null);
      }
      try {
        const images = await serviceAdminApi.landing.getHeroImages("matflow");
        setHeroImages(Array.isArray(images) ? images : []);
      } catch (e) {
        console.error('Error loading hero images:', e);
        setHeroImages([]);
      }
    };

    loadContent();

    const handleHeaderUpdate = () => loadContent();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadContent();
    };
    const handleFocus = () => loadContent();

    window.addEventListener('headerSectionUpdated', handleHeaderUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(loadContent, 10000);

    return () => {
      window.removeEventListener('headerSectionUpdated', handleHeaderUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const loadFaqs = async () => {
    if (faqLoaded) return;
    setFaqLoading(true);
    try {
      const data = await mlflowApi.faq.getAll("matflow");
      const activeFaqs = (Array.isArray(data) ? data : [])
        .filter((faq) => faq.is_active)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFaqs(activeFaqs);
      setFaqLoaded(true);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs([]);
    } finally {
      setFaqLoading(false);
    }
  };

  const NAVBAR_HEIGHT = 70;
  const SCROLL_OFFSET = NAVBAR_HEIGHT + 14;

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleToggleFaq = () => {
    const next = !showFaq;
    setShowFaq(next);
    if (next && !faqLoaded) loadFaqs();
    if (next) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId("faq")));
    }
  };

  const handleToggleFeatures = () => {
    const next = !showFeatures;
    setShowFeatures(next);
    if (next) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId("features")));
    }
  };

  const getTitle = () => {
    const title = headerSection?.title;
    if (title && typeof title === 'string') {
      const trimmed = title.trim();
      if (trimmed && !trimmed.startsWith('http') && trimmed.length < 200) return trimmed;
    }
    return "MATFLOW";
  };

  const getDescription = () => {
    const content = headerSection?.content;
    if (content && typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed && !trimmed.startsWith('http') && trimmed.length < 500) return trimmed;
    }
    return "The most intuitive platform for machine learning. Design workflows, train models, and deploy solutions\u2014all through a simple, visual interface. Perfect for data scientists, analysts, and teams who want results fast.";
  };

  const heroImageSrc = heroImages.length > 0 && heroImages[0]?.hero_image
    ? heroImages[0].hero_image
    : "iso-ai.jpg";

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Visual Workflows",
      description: "Build ML pipelines with drag-and-drop simplicity",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Fast Training",
      description: "Train models in minutes, not hours",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your data",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "No-Code Interface",
      description: "Create ML models without writing a single line of code",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col" style={{ paddingTop: '70px' }}>
      <style>{`
        @keyframes mf-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mf-hero-enter { animation: mf-fade-up 0.7s ease-out both; }
        .mf-hero-enter-d1 { animation: mf-fade-up 0.7s ease-out 0.1s both; }
        .mf-hero-enter-d2 { animation: mf-fade-up 0.7s ease-out 0.2s both; }
        .mf-hero-enter-d3 { animation: mf-fade-up 0.7s ease-out 0.35s both; }
        .mf-hero-enter-d4 { animation: mf-fade-up 0.7s ease-out 0.5s both; }
      `}</style>
      {/* Hero section — fills remaining viewport so footer stays visible */}
      <section className="flex-1 flex flex-col justify-center max-w-[1400px] mx-auto px-6 lg:px-12 py-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left — text content */}
          <div className="flex-1 flex flex-col gap-5">
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors w-fit"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span className="underline-offset-4 group-hover:underline">
                Back to Landing
              </span>
            </Link>

            <p className="mf-hero-enter text-sm font-medium text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              End-to-end ML workflows for teams
            </p>

            <h1 className="mf-hero-enter-d1 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary">
              {getTitle()}
              <span className="block h-1 w-16 rounded-full bg-primary mt-3" />
            </h1>

            <p className="mf-hero-enter-d2 text-lg text-gray-600 leading-relaxed max-w-xl">
              {getDescription()}
            </p>

            {/* CTA buttons */}
            <div className="mf-hero-enter-d3 flex flex-wrap items-center gap-3 mt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <button
                onClick={handleToggleFeatures}
                className={`inline-flex items-center gap-2 border px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  showFeatures
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Explore Features
                <svg className={`w-4 h-4 transition-transform duration-200 ${showFeatures ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={handleToggleFaq}
                className={`inline-flex items-center gap-2 border px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  showFaq
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                FAQ
                <svg className={`w-4 h-4 transition-transform duration-200 ${showFaq ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right — hero image in macOS-style frame */}
          <div className="flex-1 flex items-center justify-center mf-hero-enter-d4">
            <div className="w-full max-w-xl">
              <div className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden w-full">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Matflow &middot; No Code ML</span>
                </div>
                <div className="bg-illustration-bg p-4">
                  <img
                    src={heroImageSrc}
                    alt="Matflow Platform"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <p className="text-xs font-semibold text-gray-900">Quick start</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Open the dashboard to create a project, connect data, then train and deploy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards — toggled by Explore Features button */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFeatures ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <section id="features" className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-10" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}>
          <div className="mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Built for end users
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Clear UI, guided actions, and production-ready polish.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 border border-gray-200 shadow-soft hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAQ section — toggled by FAQ button */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFaq ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <section id="faq" className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-12" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-5 text-center">
            Frequently Asked Questions
          </h2>
          {faqLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-gray-500 py-6">No FAQs available at the moment.</p>
          ) : (
            <div className="w-full rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group"
                >
                  <summary className="font-semibold cursor-pointer px-4 py-3.5 bg-slate-100 hover:bg-slate-200 transition-colors duration-200 list-none flex items-center justify-between w-full">
                    <span className="text-[15px] font-semibold text-slate-800">
                      <span className="text-primary mr-1.5">Q.</span>{faq.question}
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-500 shrink-0 ml-4 group-open:rotate-180 transition-transform duration-200"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="bg-white px-4 py-3.5">
                    <p className="text-[14px] font-normal text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-200">
                      <span className="text-primary font-medium mr-1.5">A.</span>{faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            &copy; 2026 Matflow. All rights reserved.
          </p>
          <button
            onClick={() => setShowTerms(true)}
            className="text-sm text-gray-500 hover:text-primary transition-colors duration-200 underline underline-offset-2"
          >
            Terms &amp; Conditions
          </button>
        </div>
      </footer>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Terms and Conditions</h2>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1 text-[15px] text-gray-600 leading-[1.8] space-y-4">
              <p>
                Welcome to Matflow! These terms and conditions outline the rules and regulations for the use of our website.
              </p>
              <p>
                By accessing this website, we assume you accept these terms and conditions. Do not continue to use Matflow if you do not agree to all of the terms and conditions stated on this page.
              </p>

              <h3 className="font-semibold text-gray-900 text-base pt-2">License</h3>
              <p>
                Unless otherwise stated, Matflow and/or its licensors own the intellectual property rights for all material on Matflow. All intellectual property rights are reserved. You may access this from Matflow for your own personal use subjected to restrictions set in these terms and conditions.
              </p>
              <p>You must not:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 text-gray-600">
                <li>Republish material from Matflow</li>
                <li>Sell, rent or sub-license material from Matflow</li>
                <li>Reproduce, duplicate or copy material from Matflow</li>
                <li>Redistribute content from Matflow</li>
              </ul>

              <h3 className="font-semibold text-gray-900 text-base pt-2">User Content</h3>
              <p>
                In these terms and conditions, &ldquo;your user content&rdquo; means material (including without limitation text, images, audio material, video material, and audio-visual material) that you submit to this website, for whatever purpose.
              </p>
              <p>
                You grant to Matflow a worldwide, irrevocable, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your user content in any existing or future media. You also grant to Matflow the right to sub-license these rights, and the right to bring an action for infringement of these rights.
              </p>

              <h3 className="font-semibold text-gray-900 text-base pt-2">Disclaimer</h3>
              <p>
                To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our website and the use of this website. Nothing in this disclaimer will limit or exclude any liability for fraud or fraudulent misrepresentation.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTerms(false)}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
