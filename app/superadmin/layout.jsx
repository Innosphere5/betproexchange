"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminHeader from "../../components/superadmin/SuperAdminHeader";

export default function SuperAdminLayout({ children }) {
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
      if (session?.role !== "superadmin") {
        router.replace("/dashboard");
        return;
      }
      setIsAuthorized(true);
    } catch (e) {
      router.replace("/login");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#eaedf1] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-[#eaedf1] overflow-hidden font-sans text-sm min-h-screen">
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SuperAdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SuperAdminHeader setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto w-full p-2 lg:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
