import { useState, useEffect } from "react";
import { X, Menu, LogOut, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";
import { SIDE, FANCY, oddsBet, oddsBook, accountSummary, formatUnits } from "../lib/betCalc";

export default function Header({ setIsSidebarOpen, onDashboardClick, selectedMatch, currentView, onBack }) {
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
    <header className="relative bg-[#2a4054] text-white flex items-center justify-between px-2.5 sm:px-4 lg:px-6 h-12 lg:h-14 font-medium flex-shrink-0 z-[100] shadow-[0_2px_4px_rgba(0,0,0,0.1)] gap-2">
      {/* Left section */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {currentView === "match" ? (
          <button
            className="flex items-center gap-1.5 bg-[#1c3246] hover:bg-[#152737] text-white hover:text-[#00c766] px-2.5 py-1 rounded text-xs font-bold transition-all active:scale-95 border border-white/10 shadow-sm cursor-pointer"
            onClick={onBack || onDashboardClick}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : (
          <button
            className="lg:hidden p-1 text-white hover:text-gray-300 focus:outline-none cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
            title="Menu"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Desktop Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-[15px]">
          <button
            onClick={onDashboardClick}
            className="text-gray-300 hover:text-white transition-colors cursor-pointer font-bold"
          >
            Dashboard
          </button>
          {selectedMatch && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-white font-bold truncate max-w-[200px] xl:max-w-none">{selectedMatch}</span>
            </>
          )}
        </div>

        {/* Mobile Title (clean, no exch) */}
        <div className="lg:hidden text-[13px] sm:text-[14px] font-bold flex items-center">
          {currentView === "match" && selectedMatch ? (
            <span className="text-white font-bold truncate max-w-[120px] sm:max-w-[200px]" title={selectedMatch}>
              {selectedMatch}
            </span>
          ) : (
            <button onClick={onDashboardClick} className="text-left font-bold text-white hover:text-gray-200 cursor-pointer">
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Middle / Right Section */}
      <div className="flex items-center flex-1 justify-end lg:justify-between ml-1 sm:ml-4">
        {/* Center Welcome - hidden on mobile */}
        <div className="hidden lg:block text-sm font-semibold tracking-wide flex-1 text-center text-gray-200">
          Welcome to BetproExchange
        </div>

        {/* Right Info: Balance + User */}
        <div className="flex items-center text-xs lg:text-sm font-bold tracking-wide gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
          {/* Balance Pill */}
          <div className="flex items-center bg-[#1c3246] px-2 py-1 rounded border border-white/10 shadow-inner gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-bold shrink-0">
            <div className="flex items-center">
              <span className="text-[#00c766] font-bold">B:</span> 
              <span className="ml-1 text-white">{walletBalance ? walletBalance.toLocaleString() : "0"}</span>
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
              <span className="ml-1 text-white">{(walletBalance - (creditBalance || 0)).toLocaleString()}</span>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-gray-400 ml-1">Crd:</span>
              <span className="ml-1 text-white">{(creditBalance || 0).toLocaleString()}</span>
            </div>
            {creditBalance > 0 && (
              <div className="flex md:hidden items-center text-[10px] text-gray-400">
                ({creditBalance.toLocaleString()} C)
              </div>
            )}
            <div className="flex items-center">
              <span className="text-gray-400">L:</span>
              <span className={`ml-1 font-bold ${totalLiability < 0 ? 'text-[#ff6b81]' : 'text-gray-300'}`}>
                {totalLiability < 0 ? formatUnits(totalLiability) : "0"}
              </span>
            </div>
          </div>

          <div className="hidden lg:block text-gray-400">|</div>

          {/* User Profile Button with Arrow Icon -> Opens Logout */}
          <div className="relative">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all cursor-pointer active:scale-95 text-xs font-bold shrink-0 ${
                isDropdownOpen 
                  ? 'bg-[#152a3a] border-[#00c766] text-white shadow-inner' 
                  : 'bg-[#1c3246] hover:bg-[#152737] border-white/10 hover:border-white/20 text-white'
              }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title={username}
            >
              <span className="truncate max-w-[65px] sm:max-w-[100px]">{username}</span>
              <ChevronDown 
                size={13} 
                strokeWidth={2.5} 
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#00c766]' : 'text-gray-300'}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-[160px] bg-white border border-gray-200 shadow-2xl z-50 rounded-lg py-1 font-medium text-[13px] text-gray-700 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-gray-100 bg-gray-50/80 rounded-t-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Account</p>
                    <p className="text-xs font-bold text-gray-800 truncate">{username}</p>
                  </div>
                  <Link href="/dashboard/statement" className="block px-3.5 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium" onClick={() => setIsDropdownOpen(false)}>Statement</Link>
                  <Link href="/dashboard/result" className="block px-3.5 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium" onClick={() => setIsDropdownOpen(false)}>Result</Link>
                  {userRole !== 'user' && (
                    <Link href="/dashboard/profit-loss" className="block px-3.5 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium" onClick={() => setIsDropdownOpen(false)}>Profit Loss</Link>
                  )}
                  <Link href="/dashboard/bets" className="block px-3.5 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium" onClick={() => setIsDropdownOpen(false)}>Bet History</Link>
                  <Link href="/dashboard/profile" className="block px-3.5 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium" onClick={() => setIsDropdownOpen(false)}>Profile</Link>
                  
                  {/* Prominent Red Logout Row */}
                  <div className="pt-1 mt-1 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={14} strokeWidth={2.5} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
