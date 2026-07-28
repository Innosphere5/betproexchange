"use client";

import { useState, useEffect } from "react";
import { X, Menu, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getApiUrl } from "../../lib/apiConfig";

export default function SuperMasterHeader({ setIsSidebarOpen }) {
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
        const name = session.username || 'SuperMaster';
        return name;
      } catch (e) { return 'SuperMaster'; }
    }
    return 'SuperMaster';
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
        <div className="text-base lg:text-xl font-extrabold text-gray-800 tracking-tighter flex items-center gap-2">
          {getUsername()}
          <span className="bg-[#8e44ad] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black shadow-sm">SuperMaster</span>
        </div>

        {/* Top Nav (hidden on mobile) */}
        <div className="hidden lg:flex items-center h-full ml-4">
          <Link
            href="/supermaster/dashboard"
            className={`flex items-center h-full px-4 text-sm hover:text-[#8e44ad] hover:border-b-2 hover:border-[#8e44ad] transition-colors ${pathname === '/supermaster/dashboard' ? 'text-[#8e44ad] border-b-2 border-[#8e44ad] font-bold' : 'text-gray-600'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/supermaster/users"
            className={`flex items-center h-full px-4 text-sm hover:text-[#8e44ad] hover:border-b-2 hover:border-[#8e44ad] transition-colors ${pathname === '/supermaster/users' ? 'text-[#8e44ad] border-b-2 border-[#8e44ad] font-bold' : 'text-gray-600'}`}
          >
            Players (Users)
          </Link>
          <Link
            href="/supermaster/account-ledger"
            className={`flex items-center h-full px-4 text-sm hover:text-[#8e44ad] hover:border-b-2 hover:border-[#8e44ad] transition-colors ${pathname === '/supermaster/account-ledger' ? 'text-[#8e44ad] border-b-2 border-[#8e44ad] font-bold' : 'text-gray-600'}`}
          >
            Account Ledger
          </Link>
          <Link
            href="/supermaster/reports"
            className={`flex items-center h-full px-4 text-sm hover:text-[#8e44ad] hover:border-b-2 hover:border-[#8e44ad] transition-colors ${pathname === '/supermaster/reports' ? 'text-[#8e44ad] border-b-2 border-[#8e44ad] font-bold' : 'text-gray-600'}`}
          >
            Reports
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 text-xs lg:text-sm text-gray-600 font-medium">
        {/* Balance Display */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 lg:px-3 py-1.5 rounded-full border border-gray-100">
           <Wallet size={14} className="text-[#8e44ad]" />
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
