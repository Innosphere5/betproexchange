"use client";

import { useState } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader({ setIsSidebarOpen }) {
  const pathname = usePathname();

  return (
    <header className="relative bg-white border-b border-gray-300 text-gray-700 flex items-center justify-between px-3 lg:px-6 h-12 lg:h-14 font-medium flex-shrink-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-3 h-full">
        <button
          className="lg:hidden p-1 text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Brand / Logo */}
        <div className="text-xl font-extrabold text-[#1abc9c] tracking-tighter">
          BPXCH
        </div>

        {/* Top Nav (hidden on mobile) */}
        <div className="hidden lg:flex items-center h-full ml-4">
          <Link
            href="/admin/dashboard"
            className={`flex items-center h-full px-4 text-sm hover:text-[#1abc9c] hover:border-b-2 hover:border-[#1abc9c] transition-colors ${pathname === '/admin/dashboard' ? 'text-[#1abc9c] border-b-2 border-[#1abc9c]' : 'text-gray-600'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center h-full px-4 text-sm hover:text-[#1abc9c] hover:border-b-2 hover:border-[#1abc9c] transition-colors ${pathname === '/admin/users' ? 'text-[#1abc9c] border-b-2 border-[#1abc9c]' : 'text-gray-600'}`}
          >
            Users
          </Link>
          <Link
            href="/admin/reports"
            className={`flex items-center h-full px-4 text-sm hover:text-[#1abc9c] hover:border-b-2 hover:border-[#1abc9c] transition-colors ${pathname === '/admin/reports' ? 'text-[#1abc9c] border-b-2 border-[#1abc9c]' : 'text-gray-600'}`}
          >
            Reports
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center text-xs lg:text-sm text-gray-600 font-medium">
        <div className="mr-3 text-gray-500">
          <span>Malik50ADN (SuperMaster)</span>
        </div>
        <div className="flex items-center gap-1 font-bold">
          <span className="text-gray-700">B: <span className="font-normal">0</span></span>
          <span className="text-gray-700 ml-1">Exp: <span className="font-normal">0</span></span>
        </div>
      </div>
    </header>
  );
}
