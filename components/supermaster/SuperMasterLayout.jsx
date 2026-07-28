"use client";

import { useState } from "react";
import SuperMasterHeader from "./SuperMasterHeader";
import SuperMasterSidebar from "./SuperMasterSidebar";

export default function SuperMasterLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eef2f5] font-sans antialiased text-gray-800 select-none">
      <SuperMasterSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <SuperMasterHeader setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}
