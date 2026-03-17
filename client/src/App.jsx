import { Route, Routes, Navigate } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import React from "react";
import Layout from "./Layout";
import Dashboard from "./Pages/Dashboard";
import EditorPage from "./Pages/EditorPage";
import HomePage from "./Pages/HomePage";
import LandingPage from "./Pages/LandingPage";
import ContactPage from "./Pages/ContactPage";
import FAQPage from "./Pages/FAQPage";
import Login from "./Pages/Login";
import AdminLogin from "./Pages/AdminLogin";
import TempPage from "./TempPage";

import AdminDashboard from "./Pages/AdminDashboard";
import MatflowAdminDashboard from "./Pages/MatflowAdminDashboard";
import AddArticle from "./Pages/AddArticle";
import ProfileView from "./Pages/ProfileView";
import VerifyEmail from "./Pages/VerifyEmail";
import { AdminRoute, AuthRoute } from "./Components/ProtectedRoute";

// New Scientist Layout & Pages
import ScientistLayout from "./Components/Layout/ScientistLayout";
import DatasetPage from "./Pages/DataLab/DatasetPage";
import ForwardPage from "./Pages/ForwardGen/ForwardPage";
import InversePage from "./Pages/InverseGen/InversePage";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              An error occurred while rendering the component. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-500 overflow-auto max-h-32">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Landing page as main home */}
          <Route index element={<LandingPage />} />
          <Route path="/matflow" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/matflow-admin" element={<AdminRoute><MatflowAdminDashboard /></AdminRoute>} />
          <Route path="/add-article" element={<AdminRoute><AddArticle /></AdminRoute>} />
          <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<AuthRoute><ProfileView standalone /></AuthRoute>} />
        </Route>
        
        <Route path="/dashboard" element={<AuthRoute><Dashboard /></AuthRoute>} />
        <Route path="/dashboard/:projectId" element={<AuthRoute><Dashboard /></AuthRoute>} />
        
        {/* New Lab Interface Routes */}
        <Route path="/lab" element={<AuthRoute><ScientistLayout /></AuthRoute>}>
          <Route index element={<Navigate to="data" replace />} />
          <Route path="data" element={<DatasetPage />} />
          <Route path="forward" element={<ForwardPage />} />
          <Route path="inverse" element={<InversePage />} />
        </Route>

        <Route path="/temp" element={<TempPage />} />
        <Route
          path="/editor"
          element={
            <ReactFlowProvider>
              <EditorPage />
            </ReactFlowProvider>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
