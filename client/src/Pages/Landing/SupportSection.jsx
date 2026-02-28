import React from "react";

function SupportSection({ supportLogos, loadingSupportLogos }) {
  const baseUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:8000";
  const orderedSupportLogos = [...(Array.isArray(supportLogos) ? supportLogos : [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.id ?? 0) - (a.id ?? 0)
  );

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-3">
      <div className="text-center mb-2.5">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Support
        </h2>
        <span className="block h-1 w-16 rounded-full bg-primary mt-3 mx-auto" />
      </div>

      {loadingSupportLogos ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : orderedSupportLogos.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {orderedSupportLogos.map((logo) => {
            const logoUrl = logo.support_logo
              ? logo.support_logo.startsWith("http")
                ? logo.support_logo
                : `${baseUrl}${logo.support_logo}`
              : null;

            return (
              <div key={logo.id} className="flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Support Logo"
                  className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            { src: "/python.png", alt: "Python" },
            { src: "/pandas.png", alt: "Pandas" },
            { src: "/scikit.png", alt: "Scikit-learn" },
            { src: "/seaborn.png", alt: "Seaborn" },
          ].map((item) => (
            <div key={item.alt} className="flex items-center justify-center">
              <img
                src={item.src}
                alt={item.alt}
                className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SupportSection;
