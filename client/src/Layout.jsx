import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./FunctionBased/Components/Navbar/Navbar";

const ADMIN_PATHS = ["/admin-dashboard", "/matflow-admin"];

function Layout() {
  const location = useLocation();
  const isAdminDashboard = ADMIN_PATHS.includes(location.pathname);

  return (
    <>
      {!isAdminDashboard && <Navbar />}
      <Outlet />
    </>
  );
}

export default Layout;
