import React from "react";
import AdminDashboard from "./AdminDashboard";

/**
 * Thin wrapper around the shared AdminDashboard that scopes
 * all content operations to the `matflow` service_key.
 *
 * The underlying AdminDashboard still uses commonApi (mlflowApi)
 * but we pass a serviceKey prop so it can call serviceAdminApi
 * under the hood for Matflow-specific content.
 */

function MatflowAdminDashboard() {
  return <AdminDashboard serviceKey="matflow" title="Dashboard" />;
}

export default MatflowAdminDashboard;


