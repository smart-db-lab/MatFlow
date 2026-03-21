import React from "react";

function HeroSection({
  headerSection,
  loadingHeaderSection,
  heroImages,
  loadingHeroImages,
  currentHeroIndex,
  setCurrentHeroIndex,
}) {
  const baseUrl = import.meta.env.VITE_APP_API_URL || "";

  const carouselContent = () => {
    if (loadingHeroImages) {
      return (
        <div className="w-full h-[280px] md:h-[340px] lg:h-[380px] bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (heroImages.length > 0) {
      return (
        <div className="relative w-full h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden bg-gray-100">
          {heroImages.map((hero, index) => {
            if (!hero || !hero.id) return null;
            const imageUrl = hero.hero_image
              ? hero.hero_image.startsWith("http")
                ? hero.hero_image
                : `${baseUrl}${hero.hero_image}`
              : "/machine-learning.webp";
            const isActive = index === currentHeroIndex;
            return (
              <div
                key={hero.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              >
                <img
                  src={imageUrl}
                  alt={`Hero ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "/machine-learning.webp"; }}
                />
              </div>
            );
          })}
          {heroImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-all duration-200 hover:scale-105"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-all duration-200 hover:scale-105"
                aria-label="Next image"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentHeroIndex(index)}
                    className={`rounded-full transition-all duration-300 ${index === currentHeroIndex ? "bg-primary w-6 h-2" : "bg-white/70 hover:bg-white w-2 h-2"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <img
        src="/machine-learning.webp"
        alt="Machine Learning"
        className="w-full h-[280px] md:h-[340px] lg:h-[380px] object-cover"
      />
    );
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-4 lg:py-5">
      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
        {/* Text */}
        <div className="w-full lg:w-[55%] shrink-0 flex flex-col gap-5 text-center lg:text-left">
          {loadingHeaderSection ? (
            <div className="flex items-center justify-center lg:justify-start">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <p className="mf-hero-enter text-sm font-medium text-primary flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Data science, ML & research platform
              </p>

              <h1 className="mf-hero-enter-d1 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-dark to-primary">
                  {headerSection?.title || "MLflow"}
                </span>
                <span className="block h-1 w-16 rounded-full bg-primary mt-3 mx-auto lg:mx-0" />
              </h1>

              <p className="mf-hero-enter-d2 text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {headerSection?.content ||
                  "Your comprehensive platform for data science, machine learning, and research tools"}
              </p>
            </>
          )}
        </div>

        {/* Carousel */}
        <div className="mf-hero-enter-d3 w-full lg:w-[45%]">
          <div className="rounded-2xl overflow-hidden">
            {carouselContent()}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
