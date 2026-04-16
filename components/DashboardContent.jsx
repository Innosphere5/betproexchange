"use client";

import { useState, useEffect } from "react";
import { Info, Tv } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import MatchDetail from "./MatchDetail";
import RightPanel from "./RightPanel";

// --- Inline SVGs (Keeping existing ones for Home view) ---
const FootballIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="12 8 14.5 11 13.5 14 10.5 14 9.5 11" fill="currentColor" stroke="none" />
  </svg>
);

const CricketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2.5" />
    <line x1="6" y1="18" x2="8" y2="16" strokeWidth="2.5" />
  </svg>
);

const TennisIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M5.5 5.5C7.5 9 7.5 15 5.5 18.5M18.5 5.5C16.5 9 16.5 15 18.5 18.5" />
  </svg>
);

const HockeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M16 22a3 3 0 0 0 3-3V3h-2v16a1 1 0 0 1-1 1h-4v2h4z" />
    <circle cx="8" cy="20" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export default function DashboardContent() {
  const { currentView, selectedMatch, handleSelectMatch, handleSelectOutcome, betSelection, clearBetSelection } = useDashboard();
  const [cricketMatches, setCricketMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/cricket-matches');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCricketMatches(data);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (currentView === "match") {
    return (
      <div className="flex flex-col lg:flex-row h-full">
         <div className="flex-1 overflow-y-auto no-scrollbar">
            <MatchDetail 
              matchName={selectedMatch} 
              onSelectOutcome={handleSelectOutcome} 
            />
         </div>
         <div className="w-full lg:w-[320px] xl:w-[380px] bg-[#eaedf1] border-l border-gray-300">
            <RightPanel 
              selection={betSelection} 
              clearSelection={clearBetSelection}
              type={betSelection?.type}
            />
         </div>
      </div>
    );
  }

  // --- Data for Home View ---
  const sportTabs = [
    { label: "Cricket", icon: <CricketIcon />, count: cricketMatches.length || 8 },
    { label: "Football", icon: <FootballIcon />, count: 12 },
    { label: "Tennis", icon: <TennisIcon />, count: 5 },
    { label: "Hockey", icon: <HockeyIcon />, count: 2 },
  ];

  const matchRows = [
    {
      id: "cricket-header", sport: "cricket", isHeader: true, label: "Cricket",
      rightCols: ["Matched", "1", "X", "2"]
    },
    ...cricketMatches,
    {
      id: "football-header", sport: "football", isHeader: true, label: "Football",
      rightCols: ["Matched", "1", "X", "2"]
    },
    {
      id: "football-1", sport: "football", isHeader: false,
      label: "English Premier League - Match Odds", volume: "1,200,000",
      hasTv: false, hasInfo: true, isMatched: true
    }
  ];

  return (
    <div className="flex flex-col pb-20 lg:pb-10 font-sans">
      {/* Top Stats Bar */}
      <div className="bg-[#1c3246] px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 border-b-[3px] border-white shadow-sm">
        <div className="text-white text-[13px] font-semibold"><span className="text-gray-400 font-medium mr-1 tracking-wide">Liable:</span>0</div>
        <div className="text-white text-[13px] font-semibold"><span className="text-gray-400 font-medium mr-1 tracking-wide">Active Bets:</span>*</div>
      </div>

      {/* Sport Banners... keeping existing logic but matching design */}
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-2 lg:gap-3 p-2 lg:p-3 bg-white no-scrollbar snap-x scroll-smooth">
         <Banner title="WORLD CASINO VIRTUAL GAMES" img="/banner1.png" color="from-amber-700 to-amber-900" />
         <Banner title="WORLD CASINO ROULETTE" img="/banner2.png" color="from-red-800 to-red-950" />
         <Banner title="AMERICAN ROULLET" img="/banner3.png" color="from-green-800 to-green-950" />
         <Banner title="STAR CASINO UP DOWN" img="/banner4.png" color="from-purple-800 to-purple-950" />
      </div>

      {/* Sport Tabs */}
      <div className="flex bg-[#2a4054] overflow-x-auto select-none no-scrollbar shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] mt-2">
        {sportTabs.map((tab, idx) => {
          const isActive = idx === 0; // "Cricket" is active default
          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center min-w-[70px] lg:min-w-[85px] flex-1 py-1 lg:py-2 relative cursor-pointer transition-colors ${isActive ? 'bg-[#00c766]' : 'hover:bg-[#35526b]'}`}
            >
               <span className={`absolute top-0.5 right-1 lg:right-2 text-[10px] lg:text-xs font-bold leading-none ${isActive ? 'text-white' : 'text-gray-300'}`}>{tab.count}</span>
               <div className={`${isActive ? 'text-white' : 'text-gray-300'} mb-0.5 lg:mb-1 scale-90 lg:scale-100`}>
                 {tab.icon}
               </div>
               <span className={`text-[11px] lg:text-[13px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-gray-200'}`}>{tab.label}</span>
            </div>
          )
        })}
      </div>

      {/* Match List */}
      <div className="bg-[#e2e8f0] flex-1">
        {matchRows.map((row) => (
          <div key={row.id}>
            {row.isHeader ? (
              <div className="flex items-center px-3 py-2 border-b border-gray-300 bg-[#5d7d9a] text-white">
                <div className="w-6 flex justify-center mr-2">
                   {row.sport === 'football' ? <FootballIcon /> : <CricketIcon />}
                </div>
                <div className="font-bold text-[14px] flex-1">{row.label}</div>
                {row.rightCols && (
                  <div className="flex text-xs font-bold w-48 justify-between text-center pr-2 lg:pr-10">
                    <div className="w-16">{row.rightCols[0]}</div>
                    <div className="w-8">{row.rightCols[1]}</div>
                    <div className="w-8">{row.rightCols[2]}</div>
                    <div className="w-8">{row.rightCols[3]}</div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => {
                  if (row.sport === 'cricket' && currentView === "home") {
                    handleSelectMatch(row.label);
                  }
                }}
                className="flex items-center px-3 py-2.5 border-b border-gray-300 bg-white hover:bg-[#f8fafc] cursor-pointer group"
              >
                 <div className="w-6 mr-2 shrink-0"></div>
                 <div className="flex-1 flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] lg:text-[14px] text-gray-800 truncate">{row.label}</span>
                      {row.hasInfo && <Info size={14} className="text-gray-500 shrink-0" />}
                      {row.hasTv && <Tv size={14} className="text-gray-500 shrink-0" />}
                    </div>
                    {row.league && <span className="text-[10px] text-gray-400 font-medium uppercase">{row.league}</span>}
                 </div>
                 <div className="text-xs font-bold text-gray-500 w-48 flex items-center shrink-0 pr-2 lg:pr-10">
                    <div className="w-16 text-center text-[#ff6b00]">{row.volume || "Matched"}</div>
                    <div className="w-8 text-center text-[#1c3246]">{row.odds?.[0]?.price || "1"}</div>
                    <div className="w-8 text-center text-[#1c3246]">{row.odds?.[2]?.price || "-"}</div>
                    <div className="w-8 text-center text-[#1c3246]">{row.odds?.[1]?.price || "2"}</div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Banner({ title, color }) {
    return (
        <div className={`min-w-[240px] flex-1 h-32 rounded shadow-sm overflow-hidden relative bg-gradient-to-br ${color} group cursor-pointer flex flex-col items-center justify-center p-4 text-center`}>
            <div className="z-10 text-white text-[13px] font-black drop-shadow-md tracking-widest uppercase mb-2 leading-tight">
                {title}
            </div>
            <div className="bg-white/20 px-3 py-1 rounded text-[10px] text-white font-bold uppercase tracking-tighter z-10">Play Now</div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
        </div>
    );
}

