import React from "react";
import { Link } from "react-router-dom";

function ServicesSection({ services, loadingServices }) {
  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:9000";
  const appBasePath =
    (import.meta.env.VITE_APP_BASE_PATH || "/").replace(/\/+$/, "") || "/";

  const normalizeInternalPath = (path = "/") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (appBasePath === "/") {
      return normalizedPath;
    }

    if (normalizedPath === appBasePath) {
      return "/";
    }

    if (normalizedPath.startsWith(`${appBasePath}/`)) {
      const stripped = normalizedPath.slice(appBasePath.length);
      return stripped || "/";
    }

    return normalizedPath;
  };

  const isInternalUrl = (url) => {
    if (!url) return false;
    if (url.startsWith("/")) return true;
    try {
      return new URL(url).origin === window.location.origin;
    } catch {
      return false;
    }
  };

  const toInternalPath = (url) => {
    if (url.startsWith("/")) {
      return normalizeInternalPath(url);
    }
    try {
      const parsedUrl = new URL(url);
      const path = normalizeInternalPath(parsedUrl.pathname);
      return `${path}${parsedUrl.search || ""}${parsedUrl.hash || ""}`;
    } catch {
      return url;
    }
  };

  const cardContent = (service, logoUrl) => (
    <div className="px-5 py-6 text-center flex flex-col h-full">
      <div className="mb-4 flex justify-center">
        {logoUrl ? (
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-200">
            <img
              src={logoUrl}
              alt={service.service_name}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-primary"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
              }}
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary">
              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
        {service.service_name}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-grow">
        {service.service_description}
      </p>
      <div className="flex items-center justify-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
        <span>Explore</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  const cardClass = "group bg-white rounded-xl border border-gray-200 hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-[calc(50%-12px)] lg:w-[280px] flex flex-col";

  return (
    <section id="services" className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-3 scroll-mt-20">
      <div className="text-center mb-2.5">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Our Services
        </h2>
        <span className="block h-1 w-16 rounded-full bg-primary mt-3 mx-auto" />
      </div>

      {loadingServices ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      ) : services.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
          {services.map((service) => {
            const logoUrl = service.service_logo
              ? service.service_logo.startsWith("http")
                ? service.service_logo
                : `${baseUrl}${service.service_logo}`
              : null;

            if (isInternalUrl(service.service_url)) {
              return (
                <Link key={service.id} to={toInternalPath(service.service_url)} className={cardClass}>
                  {cardContent(service, logoUrl)}
                </Link>
              );
            }

            return (
              <a key={service.id} href={service.service_url} className={cardClass}>
                {cardContent(service, logoUrl)}
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No services available at the moment</p>
        </div>
      )}
    </section>
  );
}

export default ServicesSection;
