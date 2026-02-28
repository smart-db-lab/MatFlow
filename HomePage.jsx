import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { serviceAdminApi } from "../services/api/apiService";

function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [headerSection, setHeaderSection] = useState(null);
  const [heroImages, setHeroImages] = useState([]);

  // ✅ Toggle sections (hidden until user clicks)
  const [showFeatures, setShowFeatures] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const APP_BASE_URL =
    import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  // ✅ FIX: keep a consistent scroll offset for your fixed navbar
  const NAVBAR_HEIGHT = 70;
  const SCROLL_OFFSET = NAVBAR_HEIGHT + 14;

  // ✅ Hide Navbar RIGHT-side actions on this page only
  useEffect(() => {
    document.documentElement.classList.add("mf-hide-navbar-right");
    return () => {
      document.documentElement.classList.remove("mf-hide-navbar-right");
    };
  }, []);

  useEffect(() => {
    document.title = "Matflow";
    return () => {
      document.title = "MLflow";
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const cleanText = (text) => {
      if (!text || typeof text !== "string") return null;
      let cleaned = text.trim();
      cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");
      cleaned = cleaned.replace(/(http:\/\/localhost:\d+[^\s]*)/gi, "");
      cleaned = cleaned.trim();

      if (
        cleaned &&
        cleaned.length > 0 &&
        cleaned.length < 500 &&
        !cleaned.match(/^https?:\/\//i)
      ) {
        return cleaned;
      }
      return null;
    };

    const loadContent = async () => {
      try {
        const header = await serviceAdminApi.landing.getHeaderSection("matflow");
        if (header && typeof header === "object") {
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
        console.error("Error loading header section:", e);
        setHeaderSection(null);
      }

      try {
        const images = await serviceAdminApi.landing.getHeroImages("matflow");
        setHeroImages(Array.isArray(images) ? images : []);
      } catch (e) {
        console.error("Error loading hero images:", e);
        setHeroImages([]);
      }
    };

    loadContent();

    const handleHeaderUpdate = () => loadContent();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadContent();
    };
    const handleFocus = () => loadContent();

    window.addEventListener("headerSectionUpdated", handleHeaderUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(loadContent, 10000);

    return () => {
      window.removeEventListener("headerSectionUpdated", handleHeaderUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // ✅ Palette (formal + consistent)
  const ACCENT = "#0F766E"; // teal-700
  const ACCENT_DARK = "#115E59"; // teal-800

  const features = useMemo(
    () => [
      {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        ),
        title: "Visual Workflows",
        description: "Build ML pipelines with drag-and-drop simplicity.",
      },
      {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        title: "Fast Training",
        description: "Train models in minutes, not hours.",
      },
      {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
        title: "Secure & Reliable",
        description: "Production-ready handling for your workflows and data.",
      },
      {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        title: "No-Code Interface",
        description: "Build and deploy ML without writing code.",
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
        {
    q: "What is Matflow?",
    a: "Matflow is a comprehensive no-code machine learning platform designed for data scientists, researchers, and analysts. It provides both visual node-based workflows and function-based operations for complete data processing pipelines, from data ingestion to model deployment.",
    },
    {
      q: "Who can use Matflow?",
      a: "Matflow is designed for data scientists, researchers, chemists, material scientists, students, and anyone working with data analysis. No programming knowledge is required - our intuitive interface makes machine learning accessible to everyone.",
    },
    {
      q: "What types of data can I analyze?",
      a: "Matflow supports various data formats including CSV, Excel files, and specialized chemistry datasets with SMILES notation. You can perform exploratory data analysis, feature engineering, machine learning, and chemical property analysis.",
    },
    {
      q: "Do I need to code to use Matflow?",
      a: "No. Matflow provides a visual, node-based workflow builder and function-based operations that let you build complete ML pipelines without writing code. Just drag and connect nodes to create your workflow.",
    },
    {
    q: "Which ML models are supported?",
    a:
      "Matflow supports classification models (K-Nearest Neighbors, SVM, Logistic Regression, Decision Trees, Random Forest, Multilayer Perceptron), regression models (Linear, Ridge, Lasso, Decision Tree, Random Forest, SVR), and advanced models (XGBoost, CatBoost, LightGBM). TensorFlow and PyTorch are available for specialized deep learning tasks.",
  },
  {
    q: "Does Matflow support chemistry and materials workflows?",
    a:
      "Yes. Matflow includes specialized chemistry tools with RDKit for SMILES notation handling, molecular descriptors, chemical property analysis, and materials science datasets. You can perform feature engineering and analysis on chemistry-specific data formats.",
  },
  {
    q: "How do I deploy a trained model?",
    a:
      "Use the Model Deployment node in your workflow. It allows you to deploy trained models by providing input features and getting predictions. The deployment process generates correlation analysis and prediction results.",
  },
  {
    q: "Where are my files stored?",
    a:
      "Uploaded files are stored on the server in the 'uploads/' directory. You can view and download your files through the Datasets section on the homepage or manage them in the dashboard's file tab. Files are organized by folders for better management.",
  },
  {
    q: "What file formats does Matflow support?",
    a:
      "Matflow supports CSV and Excel (.xlsx) files for data analysis. For chemistry workflows, it supports SMILES notation and molecular data formats compatible with RDKit.",
  },
  {
    q: "How do I get started?",
    a:
      "Click 'Get Started' on the homepage to access the dashboard. In the editor, drag an 'Upload File' node to load your data, then connect it to EDA, preprocessing, or model nodes. Use the visual workflow to build your complete ML pipeline.",
  },
  {
    q: "What features does Matflow offer for data preprocessing?",
    a:
      "Matflow provides extensive preprocessing including scaling (Standard, MinMax, Robust), encoding, imputation, feature selection, dropping columns/rows, data type conversion, merging datasets, and more. All available through drag-and-drop nodes.",
  },
  {
    q: "I found a bug or need help — where do I report it?",
    a:
      "You can find our GitHub repository link in the navigation bar. Open an issue there or use the Contact page to send us a message with details about the problem, including steps to reproduce if possible.",
  },
      {
        q: "Do I need to write code to use Matflow?",
        a: "No. You can build workflows visually. Advanced users can still integrate custom steps when needed.",
      },
      {
        q: "How do I start a new workflow?",
        a: "Open the dashboard, create a project, then add steps and connect your data.",
      },
      {
        q: "Can I upload my own datasets?",
        a: "Yes. You can connect files or data sources depending on your configured services.",
      },
      {
        q: "Is my data secure?",
        a: "Matflow supports secure handling patterns. Final security depends on your deployment configuration.",
      },
    ],
    []
  );

  const firstHero = heroImages?.[0]?.hero_image;
  const heroUrl = firstHero
    ? firstHero.startsWith("http")
      ? firstHero
      : `${APP_BASE_URL}${firstHero}`
    : null;

  const titleText = (() => {
    const title = headerSection?.title;
    if (title && typeof title === "string") {
      const trimmed = title.trim();
      if (trimmed && !trimmed.startsWith("http") && trimmed.length < 200) {
        return trimmed;
      }
    }
    return "MATFLOW";
  })();

  const contentText = (() => {
    const content = headerSection?.content;
    if (content && typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed && !trimmed.startsWith("http") && trimmed.length < 500) {
        return trimmed;
      }
    }
    return "The most intuitive platform for machine learning. Design workflows, train models, and deploy solutions—all through a simple, visual interface. Perfect for data scientists, analysts, and teams who want results fast.";
  })();

  const streakA = Math.min(60, scrollY * 0.06);
  const streakB = Math.min(80, scrollY * 0.05);

  const scrollToIdWithOffset = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleExploreFeatures = (e) => {
    e.preventDefault();
    setShowFeatures(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToIdWithOffset("features"));
    });
  };

  const handleShowFAQ = (e) => {
    e.preventDefault();
    setShowFAQ(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToIdWithOffset("faq"));
    });
  };

  const handleHideFeatures = () => {
    setShowFeatures(false);
    window.requestAnimationFrame(() => scrollToIdWithOffset("matflow-top"));
  };

  const handleHideFAQ = () => {
    setShowFAQ(false);
    window.requestAnimationFrame(() => scrollToIdWithOffset("matflow-top"));
  };

  return (
    <div className="relative overflow-hidden bg-slate-50" style={{ ["--mf-accent"]: ACCENT, ["--mf-accent-dark"]: ACCENT_DARK }}>
      {/* Page-scoped CSS */}
      <style>{`
        /* --- Theme tokens --- */
        :root {
          --mf-surface: rgba(255,255,255,.74);
          --mf-border: rgba(148,163,184,.45);
          --mf-shadow: 0 18px 45px rgba(2,6,23,.10);
          --mf-shadow-soft: 0 10px 28px rgba(2,6,23,.08);
          --mf-focus: 0 0 0 4px rgba(15,118,110,.18);
        }

        /* Hide Navbar right actions on this page */
        .mf-hide-navbar-right nav .navbar-right,
        .mf-hide-navbar-right nav .nav-right,
        .mf-hide-navbar-right nav .right,
        .mf-hide-navbar-right nav .right-actions,
        .mf-hide-navbar-right nav .nav-actions,
        .mf-hide-navbar-right nav .nav-links-right,
        .mf-hide-navbar-right nav [data-navbar-right],
        .mf-hide-navbar-right nav [data-nav="right"],
        .mf-hide-navbar-right header nav .navbar-right,
        .mf-hide-navbar-right header nav .nav-right {
          display: none !important;
        }

        .mf-hide-navbar-right nav a[href="/"],
        .mf-hide-navbar-right nav a[href="/faq"],
        .mf-hide-navbar-right nav a[href="/contact"],
        .mf-hide-navbar-right nav a[href="/contacts"],
        .mf-hide-navbar-right nav a[href="/admin-dashboard"],
        .mf-hide-navbar-right nav a[href="/dashboard"],
        .mf-hide-navbar-right nav a[href*="github.com"] {
          display: none !important;
        }

        .mf-hide-navbar-right nav [data-navbar-logout]{
          display: inline-flex !important;
        }

        .mf-hide-navbar-right nav .navbar-right:has([data-navbar-logout]),
        .mf-hide-navbar-right nav .nav-right:has([data-navbar-logout]),
        .mf-hide-navbar-right nav .right-actions:has([data-navbar-logout]),
        .mf-hide-navbar-right nav [data-navbar-right]:has([data-navbar-logout]) {
          display: flex !important;
        }

        /* --- Buttons (formal + consistent) --- */
        .mf-btn-primary{
          background: var(--mf-accent);
          box-shadow: 0 14px 32px rgba(15,118,110,0.22);
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .mf-btn-primary:hover{
          background: var(--mf-accent-dark);
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(15,118,110,0.26);
        }
        .mf-btn-primary:focus{ outline: none; box-shadow: var(--mf-focus), 0 18px 40px rgba(15,118,110,0.24); }

        .mf-btn-ghost{
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
        }
        .mf-btn-ghost:hover{
          transform: translateY(-1px);
          box-shadow: var(--mf-shadow-soft);
        }
        .mf-btn-ghost:focus{ outline: none; box-shadow: var(--mf-focus); }

        /* --- Card surface system --- */
        .mf-surface{
          background: var(--mf-surface);
          border: 1px solid var(--mf-border);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        @keyframes mf_float_slow {
          0%   { transform: translate3d(0,0,0) scale(1); opacity: .52; }
          50%  { transform: translate3d(0,-14px,0) scale(1.03); opacity: .72; }
          100% { transform: translate3d(0,0,0) scale(1); opacity: .52; }
        }
        @keyframes mf_sweep {
          0%   { transform: translate3d(-12%, 0, 0) rotate(8deg); opacity: .10; }
          50%  { transform: translate3d(12%, 0, 0) rotate(8deg); opacity: .18; }
          100% { transform: translate3d(-12%, 0, 0) rotate(8deg); opacity: .10; }
        }
        @keyframes mf_shimmer {
          0%   { opacity: .12; transform: translate3d(0,0,0); }
          50%  { opacity: .20; transform: translate3d(0,-6px,0); }
          100% { opacity: .12; transform: translate3d(0,0,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-anim, .mf-anim * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 -z-10 mf-anim">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />

        <div
          className="absolute -top-24 -left-32 w-[560px] h-[560px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(15,118,110,0.22), transparent 55%)",
            animation: "mf_float_slow 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[12%] -right-40 w-[520px] h-[520px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(30,41,59,0.16), transparent 55%)",
            animation: "mf_float_slow 12s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute -bottom-40 left-[25%] w-[640px] h-[640px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.10), transparent 55%)",
            animation: "mf_float_slow 14s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            transform: `translateY(${scrollY * 0.05}px)`,
            transition: "transform 0.1s ease-out",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 82%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 82%)",
          }}
        />

        <div className="absolute inset-0" style={{ transform: `translateY(${streakA}px)`, transition: "transform 0.1s ease-out" }}>
          <div
            className="absolute -top-20 left-[-20%] w-[140%] h-[220px]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(15,118,110,0.11), rgba(245,158,11,0.07), transparent)",
              filter: "blur(18px)",
              animation: "mf_sweep 14s ease-in-out infinite",
            }}
          />
        </div>

        <div className="absolute inset-0" style={{ transform: `translateY(${streakB}px)`, transition: "transform 0.1s ease-out" }}>
          <div
            className="absolute top-[52%] left-[-22%] w-[144%] h-[200px]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(30,41,59,0.10), rgba(15,118,110,0.08), transparent)",
              filter: "blur(18px)",
              animation: "mf_sweep 18s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />
        </div>

        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 18% 28%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 82% 46%, rgba(255,255,255,0.78) 0 1px, transparent 2px), radial-gradient(circle at 56% 72%, rgba(255,255,255,0.72) 0 1px, transparent 2px)",
            backgroundSize: "420px 420px, 520px 520px, 620px 620px",
            animation: "mf_shimmer 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Page shell */}
      <div
        className="relative flex flex-col"
        style={{
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          paddingTop: `${NAVBAR_HEIGHT}px`,
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 lg:px-12 py-10 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <div id="matflow-top" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} />

            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">
              {/* Left */}
              <div className="flex-1 w-full">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <Link
                    to="/"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full mf-surface shadow-sm group-hover:shadow-md transition-all">
                      ←
                    </span>
                    <span className="underline-offset-4 group-hover:underline">
                      Back to Landing
                    </span>
                  </Link>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <span className="h-[10px] w-[10px] rounded-full" style={{ background: ACCENT }} />
                  <span className="text-xs font-semibold tracking-wide text-slate-700">
                    End-to-end Forward ML workflows for teams
                  </span>
                </div>

                <h1 className="text-[40px] md:text-[54px] lg:text-[66px] font-extrabold text-slate-950 leading-[1.06] tracking-[-0.035em] mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700">
                    {titleText}
                  </span>
                </h1>

                <p className="text-[15px] md:text-[17px] lg:text-[19px] text-slate-700 leading-[1.75] mb-8 max-w-[70ch]">
                  {contentText}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
                  <Link
                    to="/dashboard/<id>"
                    className="mf-btn-primary group inline-flex items-center justify-center gap-2 rounded-xl text-white px-8 py-3.5 font-semibold text-[15px] md:text-base focus:outline-none"
                  >
                    Explore
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>

                  <a
                    href="#features"
                    onClick={handleExploreFeatures}
                    className="mf-btn-ghost inline-flex items-center justify-center gap-2 rounded-xl mf-surface hover:border-slate-300 text-slate-900 px-8 py-3.5 font-semibold text-[15px] md:text-base focus:outline-none"
                  >
                    Explore Features
                    <span className="text-slate-500">↓</span>
                  </a>

                  <a
                    href="#faq"
                    onClick={handleShowFAQ}
                    className="mf-btn-ghost inline-flex items-center justify-center gap-2 rounded-xl mf-surface hover:border-slate-300 text-slate-900 px-8 py-3.5 font-semibold text-[15px] md:text-base focus:outline-none"
                  >
                    FAQ
                    <span className="text-slate-500">?</span>
                  </a>
                </div>
              </div>

              {/* Right */}
              <div className="flex-1 w-full flex items-center justify-center">
                <div className="relative w-full max-w-xl md:max-w-2xl">
                  <div
                    className="absolute -inset-4 rounded-[28px] blur-2xl"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(15,118,110,0.16), rgba(30,41,59,0.10), rgba(245,158,11,0.08))",
                    }}
                  />
                  <div className="relative rounded-[28px] mf-surface shadow-[var(--mf-shadow)] overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200/60 bg-white/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        Matflow • No Code ML
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="rounded-2xl overflow-hidden border border-slate-200/60 bg-white">
                        <img
                          src={heroUrl || "iso-ai.jpg"}
                          alt="Matflow Platform"
                          className="w-full h-auto object-contain"
                          onError={(e) => {
                            e.target.src = "iso-ai.jpg";
                          }}
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-900">
                          Quick start
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Open the dashboard to create a project, connect data, then train and deploy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute -bottom-5 -left-5 w-10 h-10 rounded-full border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            {showFeatures && (
              <div id="features" className="w-full mt-10" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-[16px] md:text-[18px] font-extrabold text-slate-950 tracking-tight">
                      Built for end users
                    </h2>
                    <p className="text-sm text-slate-600">
                      Clear UI, guided actions, and production-ready polish.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleHideFeatures}
                    className="self-start md:self-auto text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
                  >
                    Hide features
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="group relative rounded-2xl mf-surface p-5 shadow-sm hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background:
                            "radial-gradient(600px circle at 20% 0%, rgba(15,118,110,0.10), transparent 45%)",
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200/60 shadow-sm shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(15,118,110,0.14), rgba(30,41,59,0.06))",
                              color: ACCENT_DARK,
                            }}
                          >
                            {feature.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-extrabold text-slate-950">
                              {feature.title}
                            </h3>
                            <p className="text-[13px] md:text-sm text-slate-600 leading-relaxed mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Learn more
                          </span>
                          <span className="text-sm font-extrabold transition-transform duration-300 group-hover:translate-x-1" style={{ color: ACCENT_DARK }}>
                            →
                          </span>
                        </div>

                        <div className="mt-4 h-px w-full bg-slate-200/70 group-hover:bg-slate-200 transition-colors" />
                        <p className="mt-3 text-[11px] text-slate-500">
                          Designed for clarity, consistency, and speed.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {showFAQ && (
              <div id="faq" className="w-full mt-10" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-[16px] md:text-[18px] font-extrabold text-slate-950 tracking-tight">
                      Frequently asked questions
                    </h2>
                    <p className="text-sm text-slate-600">
                      Quick answers to common questions about Matflow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleHideFAQ}
                    className="self-start md:self-auto text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
                  >
                    Hide FAQ
                  </button>
                </div>

                <div className="grid gap-3">
                  {faqs.map((item, idx) => (
                    <details
                      key={idx}
                      className="group rounded-2xl mf-surface p-4 shadow-sm"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between">
                        <span className="text-sm md:text-[15px]">{item.q}</span>
                        <span className="text-slate-500 group-open:rotate-180 transition-transform">
                          ↓
                        </span>
                      </summary>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;