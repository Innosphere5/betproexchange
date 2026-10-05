import { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";
import { SIDE, FANCY, oddsBet, oddsBook, accountSummary, formatUnits } from "../lib/betCalc";

export default function Header({ setIsSidebarOpen, onDashboardClick, selectedMatch }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const [userRole, setUserRole] = useState('user');
  const [totalExposure, setTotalExposure] = useState(0);
  const [totalLiability, setTotalLiability] = useState(0);
  const { walletBalance, creditBalance } = useDashboard();

  const fetchExposure = async () => {
    try {
      const raw = localStorage.getItem("user_session");
      if (!raw) return;
      const session = JSON.parse(raw);
      const res = await fetch(`${getApiUrl()}/api/user/bets`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (res.ok) {
        const bets = await res.json();
        const activeBets = (bets || []).filter(b => b.status === 'pending' || b.status === 'MATCHED');

        // Group bets by market to calculate authentic exchange book exposure
        const marketMap = new Map();
        activeBets.forEach(b => {
          const mType = b.marketType || 'match_odds';
          let mKey = `${b.matchId}_${mType}`;
          if (['fancy', 'figure', 'even_odd'].includes(mType)) {
            const runnerBase = b.runner ? b.runner.split(' - ')[0] : 'default';
            mKey = `${b.matchId}_${mType}_${runnerBase}`;
          }
          if (!marketMap.has(mKey)) marketMap.set(mKey, []);
          marketMap.get(mKey).push(b);
        });

        const exposures = [];
        marketMap.forEach((mBets) => {
          try {
            const outcomes = [...new Set(mBets.map(b => b.runner).filter(Boolean))];
            if (outcomes.length === 1) outcomes.push('OTHER_OUTCOME');

            const calcBets = mBets.map(b => {
              const s = (b.type || 'back').toUpperCase();
              return oddsBet({
                side: s === 'LAY' ? SIDE.LAY : SIDE.BACK,
                selection: b.runner,
                stake: Math.round(Number(b.stake) || 0),
                odds: Number(b.odds) || 2
              });
            });

            const book = oddsBook(calcBets, outcomes);
            if (book.exposure > 0) exposures.push(book.exposure);
          } catch (err) {
            const fallback = mBets.reduce((acc, b) => acc + (Math.round(Number(b.stake)) || 0), 0);
            if (fallback > 0) exposures.push(fallback);
          }
        });

        const total = exposures.reduce((a, b) => a + b, 0);
        setTotalExposure(total);
        setTotalLiability(-total);
      }
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (session.username) setUsername(session.username);
      if (session.role) setUserRole(session.role);
    } catch (e) {}

    fetchExposure();
    const interval = setInterval(fetchExposure, 5000);
    const handleUpdate = () => fetchExposure();
    window.addEventListener('bet-placed', handleUpdate);
    window.addEventListener('wallet-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bet-placed', handleUpdate);
      window.removeEventListener('wallet-updated', handleUpdate);
    };
  }, []);



  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("user_session");
    // Expire the session cookie so Next.js middleware stops it server-side
    document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    window.location.replace("/login");
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
          <div className="flex items-center bg-[#1c3246] px-2 py-1 rounded border border-white/10 shadow-inner gap-2">
            <div className="flex items-center">
              <span className="text-[#00c766] font-bold">B:</span> 
              <span className="ml-1">{walletBalance ? walletBalance.toLocaleString() : "0"}</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center">
              <span className="text-gray-300 font-bold">Exp:</span>
              <span className={`ml-1 font-bold ${totalExposure > 0 ? 'text-[#ff6b81]' : 'text-gray-300'}`}>
                {totalExposure > 0 ? `-${totalExposure.toLocaleString()}` : "0"}
              </span>
            </div>
            <span className="text-white/20">|</span>
            <div className="hidden md:flex items-center">
              <span className="text-gray-400">Csh:</span>
              <span className="ml-1">{(walletBalance - (creditBalance || 0)).toLocaleString()}</span>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-gray-400 ml-1">Crd:</span>
              <span className="ml-1">{(creditBalance || 0).toLocaleString()}</span>
            </div>
            <div className="flex md:hidden items-center text-[10px] text-gray-400">
               ({(creditBalance || 0).toLocaleString()} C)
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center">
              <span className="text-gray-400">L:</span>
              <span className={`ml-1 font-bold ${totalLiability < 0 ? 'text-[#ff6b81]' : 'text-gray-300'}`}>
                {totalLiability < 0 ? formatUnits(totalLiability) : "0"}
              </span>
            </div>
          </div>
          <div className="hidden lg:block text-gray-400">|</div>

          {/* User Dropdown */}
          <div className="relative">
            <div
              className="flex items-center cursor-pointer hover:text-gray-300 group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{username}</span>
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
                  {userRole !== 'user' && (
                    <Link href="/dashboard/profit-loss" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setIsDropdownOpen(false)}>Profit Loss</Link>
                  )}
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
