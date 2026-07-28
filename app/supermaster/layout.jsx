"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuperMasterSidebar from "../../components/supermaster/SuperMasterSidebar";
import SuperMasterHeader from "../../components/supermaster/SuperMasterHeader";

export default function SuperMasterLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("user_session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    try {
      const session = JSON.parse(raw);
      if (session?.role !== "supermaster") {
        router.replace("/dashboard");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#eaedf1] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-[#eaedf1] overflow-hidden font-sans text-sm min-h-screen border-t-4 border-purple-600">
      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SuperMasterSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SuperMasterHeader setIsSidebarOpen={setIsSidebarOpen} />

        {/* Scrollable Core */}
        <main className="flex-1 overflow-y-auto w-full p-2 lg:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
