import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mlflowApi } from "../services/api/mlflowApi";

function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isMatflow = location.state?.fromMatflow === true;
  const serviceKey = isMatflow ? "matflow" : "mlflow";

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const data = await mlflowApi.faq.getAll(serviceKey);
        const activeFaqs = (Array.isArray(data) ? data : [])
          .filter((faq) => faq.is_active)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFaqs(activeFaqs);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, [serviceKey]);

  return (
    <div className="bg-[#f8fafc] min-h-screen" style={{ paddingTop: '70px' }}>
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-primary flex items-center justify-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            Help Center
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Find quick answers about {isMatflow ? "Matflow" : "MLFlow"}.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-white border border-gray-200 rounded-xl hover:border-primary/40 transition-all duration-200"
              >
                <summary className="font-semibold cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200 list-none flex items-center justify-between w-full">
                  <span className="text-sm text-gray-900">{faq.question}</span>
                  <svg
                    className="w-4 h-4 text-primary shrink-0 ml-4 group-open:rotate-180 transition-transform duration-200"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FAQPage;
