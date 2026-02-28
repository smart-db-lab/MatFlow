import React from "react";
import { useLocation } from "react-router-dom";

function ContactPage() {
  const location = useLocation();
  const isMatflowContext = location.state?.fromMatflow || false;
  
  const pageTitle = isMatflowContext ? "Contact Matflow" : "Contact MLflow";
  const pageDescription = isMatflowContext 
    ? "Have questions about Matflow? We're here to help."
    : "Have questions about MLflow? We're here to help.";

  return (
    <div className="mt-12 relative bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[80%] rounded-full blur-3xl bg-primary-btn/10" />
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="text-center mb-6">
          <h1 className="font-sans font-bold text-3xl mb-2">{pageTitle}</h1>
          <p className="text-gray-600 text-sm">{pageDescription}</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-primary-btn/20">
          <form className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn/40 border border-gray-200 transition-all duration-300"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn/40 border border-gray-200 transition-all duration-300"
            />
            <textarea
              placeholder="Your Message"
              rows="6"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn/40 border border-gray-200 transition-all duration-300 resize-none"
            ></textarea>
            <button
              type="submit"
              className="bg-primary-btn text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-primary-btn-hover shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/40 transition-all duration-300 self-start"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;


