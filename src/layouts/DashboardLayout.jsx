import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />}
      <div className="main-area">
        <Navbar onMenu={() => setSidebarOpen((open) => !open)} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default DashboardLayout;
