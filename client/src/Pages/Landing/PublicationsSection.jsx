import React, { useState, useRef, useEffect } from "react";

const formatTextWithMetadata = (text, formatting) => {
  if (!formatting || !Array.isArray(formatting) || formatting.length === 0) {
    return text || "";
  }

  const htmlParts = formatting
    .map((segment) => {
      if (!segment || !segment.text) return "";
      let html = segment.text;
      if (segment.bold) html = `<strong>${html}</strong>`;
      if (segment.italic) html = `<em>${html}</em>`;
      if (segment.underline) html = `<u>${html}</u>`;
      return html;
    })
    .filter((part) => part.length > 0);

  const formattedHtml = htmlParts.join("");

  if (
    !formattedHtml ||
    formattedHtml.replace(/<[^>]*>/g, "").length !== (text || "").length
  ) {
    return text || "";
  }

  return formattedHtml;
};

const addDoiLink = (citation, article) => {
  if (!article.doi) return citation;
  const doiValue = article.doi.startsWith("http")
    ? article.doi
    : article.doi.startsWith("doi:")
      ? article.doi
      : `doi:${article.doi}`;
  const doiUrl = doiValue.startsWith("http")
    ? doiValue
    : `https://doi.org/${doiValue.replace(/^doi:/, "")}`;
  return `${citation} <a href="${doiUrl}" class="text-primary hover:text-primary-dark underline" target="_blank" rel="noopener noreferrer">${doiValue}</a>`;
};

const formatJournalCitation = (article) => {
  const authors = article.authors || "N/A";
  const year = article.publication_date
    ? article.publication_date.split("-")[0]
    : "";
  const title = article.title || "";
  const journal = article.journal_name || "";
  const formatting = article.formatting_metadata || {};

  const fAuthors =
    formatTextWithMetadata(authors, formatting.authors) || authors;
  const fTitle = formatTextWithMetadata(title, formatting.title) || title;
  const fJournal =
    formatTextWithMetadata(journal, formatting.journal_name) || journal;
  const fVolume = article.volume
    ? formatTextWithMetadata(article.volume, formatting.volume) ||
      article.volume
    : "";

  let c = `${fAuthors}, "${fTitle}"`;
  if (journal) c += `, ${fJournal}`;
  if (article.volume) c += `, vol. ${fVolume}`;
  if (article.issue) c += `, no. ${article.issue}`;
  if (article.pages) c += `, pp. ${article.pages}`;
  if (year) c += `, ${year}`;
  c += ".";
  return addDoiLink(c, article);
};

const formatConferenceCitation = (article) => {
  const authors = article.authors || "N/A";
  const year = article.publication_date
    ? article.publication_date.split("-")[0]
    : "";
  const title = article.title || "";
  const conference = article.conference_name || "";
  const venue = article.venue || "";
  const formatting = article.formatting_metadata || {};

  const fAuthors =
    formatTextWithMetadata(authors, formatting.authors) || authors;
  const fTitle = formatTextWithMetadata(title, formatting.title) || title;
  const fConf =
    formatTextWithMetadata(conference, formatting.conference_name) || conference;

  let c = `${fAuthors}, "${fTitle}"`;
  if (conference) {
    c += `, in Proc. ${fConf}`;
    if (venue) c += `, ${venue}`;
  }
  if (year) c += `, ${year}`;
  if (article.pages) c += `, pp. ${article.pages}`;
  c += ".";
  return addDoiLink(c, article);
};

const formatBookCitation = (article) => {
  const authors = article.authors || "N/A";
  const year = article.publication_date
    ? article.publication_date.split("-")[0]
    : "";
  const title = article.title || "";
  const city = article.city || "";
  const publisher = article.publisher || "";
  const edition = article.edition ? `${article.edition} ed.` : "";
  const formatting = article.formatting_metadata || {};

  const fAuthors =
    formatTextWithMetadata(authors, formatting.authors) || authors;
  const fTitle = formatTextWithMetadata(title, formatting.title) || title;
  const fPublisher =
    formatTextWithMetadata(publisher, formatting.publisher) || publisher;

  let c = `${fAuthors}, ${fTitle}`;
  if (edition) c += `, ${edition}`;
  if (city && publisher) c += `. ${city}: ${fPublisher}`;
  else if (publisher) c += `. ${fPublisher}`;
  if (year) c += `, ${year}`;
  c += ".";
  return addDoiLink(c, article);
};

const formatPatentCitation = (article) => {
  const inventors = article.inventors || "N/A";
  const title = article.title || "";
  const patentNumber = article.patent_number || "";
  const office = article.patent_office || "U.S. Patent";
  const formatting = article.formatting_metadata || {};

  const fInventors =
    formatTextWithMetadata(inventors, formatting.inventors) || inventors;
  const fTitle = formatTextWithMetadata(title, formatting.title) || title;

  let dateStr = "";
  if (article.publication_date) {
    const parts = article.publication_date.split("-");
    if (parts.length === 3) {
      const monthNames = [
        "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
        "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
      ];
      dateStr = `${monthNames[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
    } else if (parts.length === 1) {
      dateStr = parts[0];
    }
  }

  let c = `${fInventors}, "${fTitle}"`;
  if (office && patentNumber) c += `, ${office} ${patentNumber}`;
  else if (patentNumber) c += `, ${patentNumber}`;
  if (dateStr) c += `, ${dateStr}`;
  c += ".";
  return c;
};

const formatCitationByType = (article) => {
  switch (article.articleType) {
    case "Journal":
      return formatJournalCitation(article);
    case "Conference":
      return formatConferenceCitation(article);
    case "Book":
      return formatBookCitation(article);
    case "Patent":
      return formatPatentCitation(article);
    default:
      return formatJournalCitation(article);
  }
};

const getArticleTypeLabel = (article) => {
  switch (article.articleType) {
    case "Journal":
      return "Journal";
    case "Conference":
      return "Conference Paper";
    case "Book":
      return "Book";
    case "Patent":
      return "Patent";
    default:
      return "Publication";
  }
};

const linkifyBookISBN = (citation) => {
  const parts = citation.split(/(<a[^>]*>.*?<\/a>)/g);
  return parts
    .map((part) => {
      if (part.match(/^<a[^>]*>.*?<\/a>$/)) return part;
      return part.replace(
        /(ISBN:|https?:\/\/[^\s<]+)/g,
        '<a href="$1" class="text-primary hover:text-primary-dark underline" target="_blank" rel="noopener noreferrer">$1</a>'
      );
    })
    .join("");
};

const filterAndSortArticles = (articles, searchQuery, sortOption) => {
  if (!articles || !Array.isArray(articles)) return [];

  let filtered = articles;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = articles.filter((article) => {
      const title = (article.title || "").toLowerCase();
      const authors = (
        article.authors ||
        article.inventors ||
        article.originators ||
        ""
      ).toLowerCase();
      const journal = (
        article.journal_name ||
        article.conference_name ||
        ""
      ).toLowerCase();
      return (
        title.includes(query) ||
        authors.includes(query) ||
        journal.includes(query)
      );
    });
  }

  const sorted = [...filtered];
  switch (sortOption) {
    case "newest":
      sorted.sort((a, b) =>
        (b.publication_date || "").localeCompare(a.publication_date || "")
      );
      break;
    case "oldest":
      sorted.sort((a, b) =>
        (a.publication_date || "").localeCompare(b.publication_date || "")
      );
      break;
    case "title-asc":
      sorted.sort((a, b) =>
        (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase())
      );
      break;
    case "title-desc":
      sorted.sort((a, b) =>
        (b.title || "").toLowerCase().localeCompare((a.title || "").toLowerCase())
      );
      break;
    default:
      break;
  }

  return sorted;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 hover:bg-white text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        {current.label}
        <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-30">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 ${
                value === opt.value
                  ? "bg-primary/5 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { key: "publications", label: "All" },
  { key: "journals", label: "Journals" },
  { key: "conferences", label: "Conferences" },
  { key: "patents", label: "Patents" },
  { key: "books", label: "Books" },
];

function PublicationsSection({
  journals,
  conferences,
  books,
  patents,
  loadingJournals,
  loadingConferences,
  loadingBooks,
  loadingPatents,
  activeArticleTab,
  setActiveArticleTab,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
}) {
  const isLoadingArticles =
    loadingJournals || loadingConferences || loadingBooks || loadingPatents;

  const getTabData = () => {
    switch (activeArticleTab) {
      case "journals":
        return { articles: journals, loading: loadingJournals };
      case "conferences":
        return { articles: conferences, loading: loadingConferences };
      case "books":
        return { articles: books, loading: loadingBooks };
      case "patents":
        return { articles: patents, loading: loadingPatents };
      case "publications":
      default:
        return {
          articles: [
            ...journals.map((j) => ({ ...j, articleType: "Journal" })),
            ...conferences.map((c) => ({ ...c, articleType: "Conference" })),
            ...books.map((b) => ({ ...b, articleType: "Book" })),
            ...patents.map((p) => ({ ...p, articleType: "Patent" })),
          ],
          loading: isLoadingArticles,
        };
    }
  };

  const getCitation = (article) => {
    if (activeArticleTab === "publications") {
      let citation = formatCitationByType(article);
      if (article.articleType === "Book") {
        citation = linkifyBookISBN(citation);
      }
      return citation;
    }

    let citation;
    switch (activeArticleTab) {
      case "journals":
        citation = formatJournalCitation(article);
        break;
      case "conferences":
        citation = formatConferenceCitation(article);
        break;
      case "books":
        citation = linkifyBookISBN(formatBookCitation(article));
        break;
      case "patents":
        citation = formatPatentCitation(article);
        break;
      default:
        citation = formatJournalCitation(article);
    }
    return citation;
  };

  const { articles: currentArticles, loading } = getTabData();
  const filteredAndSorted = filterAndSortArticles(
    currentArticles,
    searchQuery,
    sortOption
  );
  const displayArticles =
    sortOption === "oldest"
      ? [...filteredAndSorted].reverse()
      : filteredAndSorted;

  return (
    <section
      id="publications"
      className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-3 scroll-mt-20"
    >
      <div className="text-center mb-2.5">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Research &amp; Publications
        </h2>
        <span className="block h-1 w-16 rounded-full bg-primary mt-3 mx-auto" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header: Tabs + Controls */}
        <div className="border-b border-gray-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 pt-4 pb-0">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveArticleTab(tab.key)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    activeArticleTab === tab.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pb-3 md:pb-0 mb-3">
              <div className="relative flex-1 md:w-52 md:flex-none">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <SortDropdown value={sortOption} onChange={setSortOption} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-10 h-10 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-400">
                {searchQuery.trim()
                  ? "No results found"
                  : "No publications available"}
              </p>
            </div>
          ) : (
            <div
              className={`pr-2 ${
                displayArticles.length > 8
                  ? "max-h-[60vh] overflow-y-auto publications-scrollbar"
                  : ""
              }`}
            >
              <div className="divide-y divide-gray-100">
                {displayArticles.map((article, index) => {
                  const number =
                    sortOption === "oldest"
                      ? displayArticles.length - index
                      : index + 1;
                  const citation = getCitation(article);
                  const typeLabel =
                    activeArticleTab === "publications"
                      ? getArticleTypeLabel(article)
                      : null;

                  const isPatent =
                    activeArticleTab === "patents" ||
                    article.articleType === "Patent";
                  const patentLink = isPatent ? article.patent_link : null;

                  return (
                    <div
                      key={`${article.articleType || activeArticleTab}-${article.id || index}`}
                      className="py-3 flex items-start gap-3 group"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                        {number}
                      </span>
                      <div className="flex-1 min-w-0">
                        {typeLabel && (
                          <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-primary bg-primary/15 border border-primary/20 px-2 py-0.5 rounded mb-1">
                            {typeLabel}
                          </span>
                        )}
                        <p
                          className="text-[13px] text-gray-700 leading-relaxed [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_strong]:text-gray-900 [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{
                            __html: citation.replace(
                              /\*\*(.*?)\*\*/g,
                              "<strong>$1</strong>"
                            ),
                          }}
                        />
                      </div>
                      {patentLink && (
                        <a
                          href={patentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-400 rounded-md hover:text-primary hover:bg-primary/5 transition-all duration-200 self-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PublicationsSection;
