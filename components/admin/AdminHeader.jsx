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
  const [adminExposure, setAdminExposure] = useState(0);
  const [username, setUsername] = useState('Admin');

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
      const [walletRes, betsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/user/wallet`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${getApiUrl()}/api/admin/global-matched-bets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletBalance(data.balance);
      } else if (walletRes.status === 401) {
        router.replace('/login');
      }

      if (betsRes && betsRes.ok) {
        const bets = await betsRes.json();
        const totalExp = (bets || []).reduce((acc, b) => acc + (b.size || b.stake || 0), 0);
        setAdminExposure(-totalExp);
      }
    } catch (err) {
      console.warn("Wallet fetch failed. Backend server might be offline or URL is incorrect.");
    }
  };

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (session.username) setUsername(session.username);
    } catch (e) {}

    fetchWallet();
    // Poll every 30 seconds for balance updates
    const interval = setInterval(fetchWallet, 30000);

    const handleWalletUpdated = () => {
      fetchWallet();
    };
    window.addEventListener('wallet-updated', handleWalletUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('wallet-updated', handleWalletUpdated);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    window.location.replace("/login");
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
          {username}
          <span className="bg-[#1abc9c] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black shadow-sm">Admin</span>
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
            href="/admin/account-ledger"
            className={`flex items-center h-full px-4 text-sm hover:text-[#1abc9c] hover:border-b-2 hover:border-[#1abc9c] transition-colors ${pathname === '/admin/account-ledger' ? 'text-[#1abc9c] border-b-2 border-[#1abc9c]' : 'text-gray-600'}`}
          >
            Account Ledger
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
        <div className="flex items-center gap-2 font-bold bg-gray-50 px-2 lg:px-3 py-1 rounded-full border border-gray-100">
          <Wallet size={14} className="text-[#1abc9c]" />
          <span className="text-gray-800">
            <span className="text-gray-500 font-bold">B:</span>{" "}
            <span className="text-[#1abc9c] font-black">{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-800">
            <span className="text-gray-500 font-bold">Exp:</span>{" "}
            <span className={`font-black ${adminExposure < 0 ? 'text-[#dc2626]' : 'text-gray-700'}`}>
              {adminExposure !== 0 ? (adminExposure < 0 ? `-${Math.abs(adminExposure).toLocaleString()}` : adminExposure.toLocaleString()) : "0"}
            </span>
          </span>
        </div>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 ml-1 lg:ml-2 px-2 lg:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] lg:text-xs rounded-full shadow-md shadow-red-100 transition-all active:scale-95 cursor-pointer shrink-0"
          title="Logout"
        >
          <LogOut size={14} strokeWidth={3} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
