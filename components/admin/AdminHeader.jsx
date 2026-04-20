"use client";

import { useState, useEffect } from "react";
import { X, Menu, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getApiUrl } from "../../lib/apiConfig";

export default function AdminHeader({ setIsSidebarOpen }) {
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
          Betproexchange
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
      <div className="flex items-center gap-3 text-xs lg:text-sm text-gray-600 font-medium">
        <div className="mr-1 text-gray-500">
          <span>{typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_session') || '{}').username || 'Admin' : 'Admin'} (Admin)</span>
        </div>
        <div className="flex items-center gap-2 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          <Wallet size={14} className="text-[#1abc9c]" />
          <span className="text-gray-800">
            Balance: <span className="text-[#1abc9c]">{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 ml-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-md border border-red-200 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
