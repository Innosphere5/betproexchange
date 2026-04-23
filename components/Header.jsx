import { useState } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "./DashboardLayout";

export default function Header({ setIsSidebarOpen, onDashboardClick, selectedMatch }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { walletBalance } = useDashboard();



  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("user_session");
    // Expire the session cookie so Next.js middleware stops it server-side
    document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    window.location.href = "/login";
  };

  return (
    <header className="relative bg-[#2a4054] text-white flex items-center justify-between px-3 lg:px-6 h-12 lg:h-14 font-medium flex-shrink-0 z-[100] shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1 text-white hover:text-gray-300 focus:outline-none"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-[15px]">
          <button
            onClick={onDashboardClick}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          {selectedMatch && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-white font-bold">{selectedMatch}</span>
            </>
          )}
        </div>
        <div className="lg:hidden text-[13px] md:text-[15px] font-semibold">
          Dashboard <span className="font-bold text-[11px] ml-0.5">exch</span>
        </div>
      </div>

      {/* Middle / Right Section */}
      <div className="flex items-center flex-1 justify-end lg:justify-between ml-4">
        {/* Center Welcome - hidden on mobile */}
        <div className="hidden lg:block text-sm font-semibold tracking-wide flex-1 text-center">
          Welcome to BetproExchange
        </div>

        {/* Right Info */}
        <div className="flex items-center text-xs lg:text-sm font-bold tracking-wide gap-1.5 lg:gap-3">
          <div className="flex items-center bg-[#1c3246] px-2 py-1 rounded border border-white/10 shadow-inner">
            <span className="text-[#00c766]">B:</span> 
            <span className="ml-1">{walletBalance ? walletBalance.toLocaleString() : "0"}</span>
            <span className="mx-1 text-white/20">|</span>
            <span className="text-gray-400">L:</span>
            <span className="ml-1">0</span>
          </div>
          <div className="hidden lg:block text-gray-400">|</div>

          {/* User Dropdown */}
          <div className="relative">
            <div
              className="flex items-center cursor-pointer hover:text-gray-300 group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_session') || '{}').username || 'User' : 'User'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-1 opacity-70 group-hover:opacity-100">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>


            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-[120%] mt-1 w-[150px] bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-50 rounded-sm py-1 font-normal text-[13px] text-gray-700">
                  <Link href="/dashboard/statement" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Statement</Link>
                  <Link href="/dashboard/result" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Result</Link>
                  <Link href="/dashboard/profit-loss" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Profit Loss</Link>
                  <Link href="/dashboard/bets" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Bet History</Link>
                  <Link href="/dashboard/profile" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Profile</Link>
                  <div className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-[#dc3545] font-bold border-t border-gray-100" onClick={handleLogout}>Logout</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
