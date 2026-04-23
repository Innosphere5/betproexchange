"use client";

import { useState, useEffect } from "react";
import { X, Menu, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getApiUrl } from "../../lib/apiConfig";

export default function MasterHeader({ setIsSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          return JSON.parse(session).token;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const fetchWallet = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/user/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    }
  };

  useEffect(() => {
    fetchWallet();
    // Poll every 30 seconds for balance updates
    const interval = setInterval(fetchWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    window.location.href = "/login";
  };

  const getUsername = () => {
    if (typeof window !== 'undefined') {
      try {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        const name = session.username || 'Master';
        return name?.toLowerCase() === 'adnan' ? 'Admin' : name;
      } catch (e) { return 'Master'; }
    }
    return 'Master';
  };

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
        <div className="text-base lg:text-xl font-extrabold text-[#f39c12] tracking-tighter">
          MASTER_PANEL
        </div>

        {/* Top Nav (hidden on mobile) */}
        <div className="hidden lg:flex items-center h-full ml-4">
          <Link
            href="/master/dashboard"
            className={`flex items-center h-full px-4 text-sm hover:text-[#f39c12] hover:border-b-2 hover:border-[#f39c12] transition-colors ${pathname === '/master/dashboard' ? 'text-[#f39c12] border-b-2 border-[#f39c12]' : 'text-gray-600'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/master/users"
            className={`flex items-center h-full px-4 text-sm hover:text-[#f39c12] hover:border-b-2 hover:border-[#f39c12] transition-colors ${pathname === '/master/users' ? 'text-[#f39c12] border-b-2 border-[#f39c12]' : 'text-gray-600'}`}
          >
            Players (Users)
          </Link>
          <Link
            href="/master/reports"
            className={`flex items-center h-full px-4 text-sm hover:text-[#f39c12] hover:border-b-2 hover:border-[#f39c12] transition-colors ${pathname === '/master/reports' ? 'text-[#f39c12] border-b-2 border-[#f39c12]' : 'text-gray-600'}`}
          >
            Reports
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 text-xs lg:text-sm text-gray-600 font-medium">
        <div className="mr-1 text-gray-500 hidden sm:block">
          <span className="font-bold text-gray-700">{getUsername()}</span>
        </div>
        
        {/* Balance Display */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 lg:px-3 py-1.5 rounded-full border border-gray-100">
           <Wallet size={14} className="text-[#f39c12]" />
           <span className="font-bold text-gray-800">{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 ml-1 lg:ml-2 px-2 lg:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] lg:text-xs rounded-full shadow-md shadow-red-100 transition-all active:scale-95"
        >
          <LogOut size={14} strokeWidth={3} />
          <span className="hidden xs:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
