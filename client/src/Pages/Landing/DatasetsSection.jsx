import React from "react";

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

const formatDatasetCitation = (article) => {
  const originators = article.originators || "N/A";
  const year = article.publication_date
    ? article.publication_date.split("-")[0]
    : "";
  const title = article.title || "";
  const publication = article.under_publication || "";
  const keywords = article.keywords || "";
  const formatting = article.formatting_metadata || {};

  const fOriginators =
    formatTextWithMetadata(originators, formatting.originators) || originators;
  const fTitle = formatTextWithMetadata(title, formatting.title) || title;

  let c = `${fOriginators}, "${fTitle}"`;
  if (publication) c += `. ${publication}`;
  if (year) c += `, ${year}`;
  c += ".";
  if (keywords) c += ` Keywords: ${keywords}.`;
  return c;
};

const filterAndSortArticles = (articles, searchQuery, sortOption) => {
  if (!articles || !Array.isArray(articles)) return [];

  let filtered = articles;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = articles.filter((article) => {
      const title = (article.title || "").toLowerCase();
      const authors = (article.originators || "").toLowerCase();
      return title.includes(query) || authors.includes(query);
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

function DatasetsSection({ datasets, loadingDatasets, searchQuery, sortOption }) {
  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";

  const getDatasetFileUrl = (article) => {
    return article.file_url
      ? article.file_url.startsWith("http")
        ? article.file_url
        : `${baseUrl}${article.file_url}`
      : null;
  };

  const filteredAndSorted = filterAndSortArticles(
    datasets,
    searchQuery,
    sortOption
  );
  const displayDatasets =
    sortOption === "oldest"
      ? [...filteredAndSorted].reverse()
      : filteredAndSorted;

  return (
    <section
      id="datasets"
      className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-3 scroll-mt-20"
    >
      <div className="text-center mb-2.5">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Datasets
        </h2>
        <span className="block h-1 w-16 rounded-full bg-primary mt-3 mx-auto" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4">
          {loadingDatasets ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : displayDatasets.length > 0 ? (
            <div
              className={`pr-2 ${
                displayDatasets.length > 8
                  ? "max-h-[60vh] overflow-y-auto publications-scrollbar"
                  : ""
              }`}
            >
              <div className="divide-y divide-gray-100">
                {displayDatasets.map((dataset, idx) => {
                  const number =
                    sortOption === "oldest"
                      ? displayDatasets.length - idx
                      : idx + 1;
                  const citation = formatDatasetCitation(dataset);
                  const fileUrl = getDatasetFileUrl(dataset);
                  return (
                    <div
                      key={dataset.id}
                      className="py-3 flex items-start gap-3 group"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                        {number}
                      </span>
                      <div className="flex-1 min-w-0">
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
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
                          title="Download Dataset"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <p className="text-sm text-gray-400">No datasets available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DatasetsSection;
