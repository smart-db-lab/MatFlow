import React, { useState, useEffect, useRef } from "react";
import { commonApi } from "../services/api/apiService";

/**
 * Floating visitor-count badge — fixed to the bottom-left of the viewport.
 */
export default function VisitorCounter() {
  const [total, setTotal] = useState(null);
  const [showCountries, setShowCountries] = useState(false);
  const popupRef = useRef(null);

  const topCountries = [
    { name: "India", visitors: 1240 },
    { name: "United States", visitors: 980 },
    { name: "Germany", visitors: 640 },
    { name: "United Kingdom", visitors: 520 },
    { name: "Canada", visitors: 470 },
  ];
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await commonApi.visitors.getStats();
        setTotal(data?.total_visitors ?? null);
      } catch {
        // non-critical
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!showCountries) return;

    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowCountries(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowCountries(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showCountries]);

  if (total === null) return null;

  return (
    <div ref={popupRef} className="fixed bottom-4 left-4 z-50">
      {showCountries && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-2.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-900">
              Top 5 Visitor Countries
            </p>
            <span className="text-[9px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
              Demo
            </span>
          </div>
          <div className="space-y-1.5">
            {topCountries.map((country, index) => (
              <div
                key={country.name}
                className="flex items-center justify-between text-[12px] rounded-md border border-gray-200 bg-gray-50 px-2 py-1 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <span className="truncate text-slate-700">
                  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 rounded-full bg-white border border-gray-200 text-[9px] font-semibold text-gray-500">
                    {index + 1}
                  </span>
                  {country.name}
                </span>
                <span className="font-semibold text-gray-700">{country.visitors}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCountries((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-sm hover:bg-white transition-colors"
      >
        <svg
          className="w-3.5 h-3.5 text-primary-btn"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        {total.toLocaleString()} visitors
      </button>
    </div>
  );
}
