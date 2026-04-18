"use client";

import { useState, useEffect } from "react";
import { Info, Tv, Clock } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import MatchDetail from "./MatchDetail";
import RightPanel from "./RightPanel";

// --- Inline SVGs ---
const CricketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2.5" />
    <line x1="6" y1="18" x2="8" y2="16" strokeWidth="2.5" />
  </svg>
);

export default function DashboardContent() {
  const { currentView, selectedMatchId, handleSelectMatch, handleSelectOutcome, betSelection, clearBetSelection, cricketMatches } = useDashboard();

  if (currentView === "match") {
    return (
      <div className="flex flex-col lg:flex-row lg:h-full lg:overflow-hidden">
        <div className="lg:flex-1 lg:overflow-y-auto no-scrollbar">
          <MatchDetail
            matchId={selectedMatchId}
            onSelectOutcome={handleSelectOutcome}
          />
        </div>
        <div className="w-full lg:w-[320px] xl:w-[380px] bg-[#eaedf1] lg:border-l border-gray-300 lg:overflow-y-auto no-scrollbar lg:pb-0">
          <RightPanel
            selection={betSelection}
            clearSelection={clearBetSelection}
            type={betSelection?.type}
          />
        </div>
      </div>
    );
  }

  const matchRows = [
    {
      id: "cricket-header", sport: "cricket", isHeader: true, label: "Cricket",
      rightCols: ["Matched", "1", "X", "2"]
    },
    ...cricketMatches
  ];

  return (
    <div className="flex flex-col pb-20 lg:pb-10 font-sans">

      {/* 🚀 PREMIUM BETTING BANNERS (HORIZONTAL SQUARE LAYOUT) */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 p-2 md:p-4 bg-[#eaedf1]">
        {/* Cricket Hero */}
        <div className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden shadow-lg group cursor-pointer border-2 border-transparent hover:border-[#00c766] transition-all">
          <img src="/images/cricket_banner.png" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" alt="Cricket Betting" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div className="absolute bottom-2 left-2 md:bottom-4 md:left-5">
            <div className="bg-[#00c766] text-black text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded mb-1 md:mb-2 inline-block uppercase tracking-widest">Sports</div>
            <h2 className="text-white text-base md:text-2xl font-black italic tracking-tighter leading-none">CRICKET</h2>
          </div>
        </div>

        {/* Casino Hero */}
        <div className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden shadow-lg group cursor-pointer border-2 border-transparent hover:border-yellow-500 transition-all">
          <img src="/images/casino_banner.png" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" alt="Casino" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div className="absolute bottom-2 left-2 md:bottom-4 md:left-5">
            <div className="bg-yellow-500 text-black text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded mb-1 md:mb-2 inline-block uppercase tracking-widest font-sans">Live</div>
            <h2 className="text-white text-base md:text-2xl font-black italic tracking-tighter leading-none uppercase">CASINO</h2>
          </div>
        </div>
      </div>

      <div className="bg-[#1c3246] px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 border-b-[3px] border-white shadow-sm">
        <div className="text-white text-[13px] font-semibold"><span className="text-gray-400 font-medium mr-1 tracking-wide">Liable:</span>0</div>
        <div className="text-white text-[13px] font-semibold"><span className="text-gray-400 font-medium mr-1 tracking-wide">Active Bets:</span>*</div>
      </div>

      {/* Match List */}
      <div className="bg-[#e2e8f0] flex-1">
        {matchRows.map((row) => (
          <div key={row.matchId || row.id}>
            {row.isHeader ? (
              <div className="flex items-center px-3 py-2 border-b border-gray-300 bg-[#5d7d9a] text-white">
                <div className="w-6 flex justify-center mr-2">
                  <CricketIcon />
                </div>
                <div className="font-bold text-[14px] flex-1">{row.label || row.league}</div>
                {row.rightCols && (
                  <div className="flex text-xs font-bold w-48 justify-between text-center pr-2 lg:pr-10">
                    <div className="w-16">{row.rightCols[0]}</div>
                    <div className="w-8">{row.rightCols[1]}</div>
                    <div className="w-8">{row.rightCols[2]}</div>
                    <div className="w-8">{row.rightCols[3]}</div>
                  </div>
                )}
              </div>
            ) : row.status === 'live' ? (
              <div
                onClick={() => handleSelectMatch(row.matchId)}
                className="mx-3 my-3 bg-[#1e293b] rounded-xl overflow-hidden shadow-lg border border-gray-700 cursor-pointer hover:border-green-500 transition-all group"
              >
                <div className="bg-[#0f172a] px-4 py-1.5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.league}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-red-500 uppercase">LIVE</span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-bold text-base mb-1">{row.teamA}</div>
                    <div className="text-2xl font-black text-white">{row.score?.home || "0/0"}</div>
                  </div>

                  <div className="px-6 flex flex-col items-center">
                    <div className="text-gray-500 font-bold text-sm italic">VS</div>
                  </div>

                  <div className="flex-1 text-right">
                    <div className="text-white font-bold text-base mb-1">{row.teamB}</div>
                    <div className="text-2xl font-black text-green-400">{row.score?.away || "0/0"}</div>
                  </div>
                </div>

                <div className="bg-[#0f172a]/50 px-4 py-2 flex justify-between items-center border-t border-gray-800">
                  <span className="text-[10px] text-gray-400 italic">Updated: {new Date(row.lastUpdated).toLocaleTimeString()}</span>
                  <div className="flex gap-4">
                    <Info size={14} className="text-gray-500" />
                    <Tv size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold text-blue-400 group-hover:underline">VIEW ODDS</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleSelectMatch(row.matchId)}
                className="flex items-center px-4 py-3 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer group transition-colors"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#eb5d08]/5 text-[#eb5d08] border border-[#eb5d08]/20 rounded text-[9px] font-black uppercase tracking-tighter shrink-0">
                        <Clock size={10} strokeWidth={3} />
                        {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {row.league && <span className="text-[9px] text-gray-400 font-bold uppercase truncate opacity-70 tracking-tight">{row.league}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] md:text-[15px] text-[#1c3246] truncate leading-tight">
                        {row.label || `${row.teamA} v ${row.teamB}`}
                      </span>
                      <div className="flex gap-2 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Info size={12} className="text-gray-400" />
                        <Tv size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Odds - Hidden on small mobile if needed, but keeping unified for now */}
                <div className="flex items-center w-36 lg:w-48 shrink-0">
                  <div className="flex-1 text-center font-black text-[12px] text-[#ff6b00] opacity-80">{row.volume || "Matched"}</div>
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-sm bg-gray-50 border border-gray-100 flex items-center justify-center text-[#1c3246] text-[11px] font-bold">-</div>
                    <div className="w-8 h-8 rounded-sm bg-gray-50 border border-gray-100 flex items-center justify-center text-[#1c3246] text-[11px] font-bold">-</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
