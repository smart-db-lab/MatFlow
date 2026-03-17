import React from "react";
import { Outlet } from "react-router-dom";
import ScientistSidebar from "./ScientistSidebar";
import Navbar from "../../FunctionBased/Components/Navbar/Navbar";

/**
 * ScientistLayout wraps purely the /lab/* endpoints
 * It retains the original Navbar globally on top, but introduces a side-nav
 * specifically for the Materials Science workflow pages to keep them decoupled.
 */
function ScientistLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Existing Top Navigation remains accessible for profiles/logout */}
      <Navbar />
      
      {/* Split View for Lab Workflow */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
          {/* New LHS Navigation Sidebar */}
          <ScientistSidebar />
          
          {/* RHS Content Area where Dataset/Forward/Inverse pages render */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6 relative">
             <div className="max-w-7xl mx-auto w-full">
                <Outlet />
             </div>
          </main>
      </div>
    </div>
  );
}

export default ScientistLayout;
