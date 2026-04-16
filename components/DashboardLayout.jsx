"use client";

import { useState, createContext, useContext } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

// Create a context for dashboard state
const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("home");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betSelection, setBetSelection] = useState(null);

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setCurrentView("match");
    setIsSidebarOpen(false);
  };

  const handleSelectOutcome = (runner, price, type) => {
    setBetSelection({ runner, price, type });
  };

  const clearBetSelection = () => setBetSelection(null);

  const goToHome = () => {
    setCurrentView("home");
    setSelectedMatch(null);
  };

  return (
    <DashboardContext.Provider value={{ 
      currentView, 
      selectedMatch, 
      betSelection, 
      handleSelectMatch, 
      handleSelectOutcome, 
      clearBetSelection,
      goToHome 
    }}>
      <div className="flex h-screen bg-[#eaedf1] overflow-hidden font-sans text-sm">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          onSelectMatch={handleSelectMatch}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header setIsSidebarOpen={setIsSidebarOpen} onDashboardClick={goToHome} />
          
          {/* Scrollable Core */}
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}

