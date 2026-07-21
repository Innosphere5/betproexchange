"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function TeenPattiBettingBoard({
  round,
  onSelectBet,
  selectedChoice,
  userBets = [],
  selectedChip = "10",
  setSelectedChip
}) {
  const isLocked = round.status !== "BETTING_OPEN";
  const backOdds = 1.98;
  const layOdds = 1.98;

  const CHIPS = [
    { value: "10", color: "from-rose-500 to-rose-700 shadow-rose-500/20 border-rose-400" },
    { value: "50", color: "from-emerald-500 to-emerald-700 shadow-emerald-500/20 border-emerald-400" },
    { value: "100", color: "from-blue-500 to-blue-700 shadow-blue-500/20 border-blue-400" },
    { value: "500", color: "from-purple-500 to-purple-700 shadow-purple-500/20 border-purple-400" },
    { value: "1000", color: "from-amber-500 to-amber-700 shadow-amber-500/20 border-amber-400" },
    { value: "5000", color: "from-slate-700 to-slate-900 shadow-slate-500/20 border-slate-500" }
  ];

  const handleBetClick = (betType) => {
    if (isLocked) return;
    onSelectBet(betType);
  };

  // Get total bet placed by the user on a specific bet type for the current round
  const getBetAmountOnCell = (betType) => {
    return userBets
      .filter(b => b.roundId === round.roundId && b.betType === betType)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getButtonClass = (betType, baseColor) => {
    const isSelected = selectedChoice === betType;
    const hasBet = getBetAmountOnCell(betType) > 0;

    if (baseColor === "blue") {
      return `relative flex-1 py-2.5 px-1.5 sm:py-4 sm:px-3 rounded-xl sm:rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all min-h-[54px] sm:min-h-[64px] border ${
        isLocked
          ? "bg-slate-900 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
          : isSelected
          ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-98"
          : hasBet
          ? "bg-blue-900/40 border-blue-500 text-blue-300 cursor-pointer shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]"
          : "bg-blue-950/15 border-blue-500/30 hover:bg-blue-900/20 hover:border-blue-400 text-blue-400 cursor-pointer active:scale-98"
      }`;
    } else {
      return `relative flex-1 py-2.5 px-1.5 sm:py-4 sm:px-3 rounded-xl sm:rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all min-h-[54px] sm:min-h-[64px] border ${
        isLocked
          ? "bg-slate-900 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
          : isSelected
          ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-98"
          : hasBet
          ? "bg-rose-900/40 border-rose-500 text-rose-300 cursor-pointer shadow-[inset_0_0_10px_rgba(244,63,94,0.15)]"
          : "bg-rose-950/15 border-rose-500/30 hover:bg-rose-900/20 hover:border-rose-400 text-rose-400 cursor-pointer active:scale-98"
      }`;
    }
  };

  return (
    <div className="bg-[#121820]/90 backdrop-blur-md border border-slate-700/30 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl w-full flex flex-col gap-3.5 sm:gap-5">
      
      {/* Table Headers */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 border-b border-slate-800/80 pb-2 items-center">
        <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black text-slate-500">Market</span>
        <span className="text-center text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black text-blue-400">Back</span>
        <span className="text-center text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black text-rose-400">Lay</span>
      </div>

      {/* Grid Rows */}
      <div className="space-y-3 sm:space-y-4">
        
        {/* Player A Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white leading-none">Player A</span>
            <span className="text-[7px] sm:text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider leading-none">Min 10 | Max 30k</span>
          </div>

          {/* Player A BACK */}
          <button
            onClick={() => handleBetClick("A_BACK")}
            disabled={isLocked}
            className={getButtonClass("A_BACK", "blue")}
          >
            {isLocked ? (
              <Lock size={12} className="opacity-40 sm:w-3.5 sm:h-3.5" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-blue-300/80 mb-0.5 leading-none">Back</span>
                <span className="font-black leading-none font-mono text-xs sm:text-sm">{backOdds.toFixed(2)}</span>
              </>
            )}

            {/* Chip placed badge */}
            {!isLocked && getBetAmountOnCell("A_BACK") > 0 && (
              <div className="absolute -top-2 -right-1 sm:-top-2.5 sm:-right-2 bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/50 rounded-full h-5 sm:h-6 px-1 sm:px-1.5 shadow-md flex items-center justify-center z-10">
                <span className="text-[7px] sm:text-[8px] font-black text-white font-mono">${getBetAmountOnCell("A_BACK")}</span>
              </div>
            )}
          </button>

          {/* Player A LAY */}
          <button
            onClick={() => handleBetClick("A_LAY")}
            disabled={isLocked}
            className={getButtonClass("A_LAY", "pink")}
          >
            {isLocked ? (
              <Lock size={12} className="opacity-40 sm:w-3.5 sm:h-3.5" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-rose-300/80 mb-0.5 leading-none">Lay</span>
                <span className="font-black leading-none font-mono text-xs sm:text-sm">{layOdds.toFixed(2)}</span>
              </>
            )}

            {/* Chip placed badge */}
            {!isLocked && getBetAmountOnCell("A_LAY") > 0 && (
              <div className="absolute -top-2 -right-1 sm:-top-2.5 sm:-right-2 bg-gradient-to-br from-rose-500 to-red-600 border border-rose-400/50 rounded-full h-5 sm:h-6 px-1 sm:px-1.5 shadow-md flex items-center justify-center z-10">
                <span className="text-[7px] sm:text-[8px] font-black text-white font-mono">${getBetAmountOnCell("A_LAY")}</span>
              </div>
            )}
          </button>
        </div>

        {/* Player B Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white leading-none">Player B</span>
            <span className="text-[7px] sm:text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider leading-none">Min 10 | Max 30k</span>
          </div>

          {/* Player B BACK */}
          <button
            onClick={() => handleBetClick("B_BACK")}
            disabled={isLocked}
            className={getButtonClass("B_BACK", "blue")}
          >
            {isLocked ? (
              <Lock size={12} className="opacity-40 sm:w-3.5 sm:h-3.5" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-blue-300/80 mb-0.5 leading-none">Back</span>
                <span className="font-black leading-none font-mono text-xs sm:text-sm">{backOdds.toFixed(2)}</span>
              </>
            )}

            {/* Chip placed badge */}
            {!isLocked && getBetAmountOnCell("B_BACK") > 0 && (
              <div className="absolute -top-2 -right-1 sm:-top-2.5 sm:-right-2 bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/50 rounded-full h-5 sm:h-6 px-1 sm:px-1.5 shadow-md flex items-center justify-center z-10">
                <span className="text-[7px] sm:text-[8px] font-black text-white font-mono">${getBetAmountOnCell("B_BACK")}</span>
              </div>
            )}
          </button>

          {/* Player B LAY */}
          <button
            onClick={() => handleBetClick("B_LAY")}
            disabled={isLocked}
            className={getButtonClass("B_LAY", "pink")}
          >
            {isLocked ? (
              <Lock size={12} className="opacity-40 sm:w-3.5 sm:h-3.5" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-rose-300/80 mb-0.5 leading-none">Lay</span>
                <span className="font-black leading-none font-mono text-xs sm:text-sm">{layOdds.toFixed(2)}</span>
              </>
            )}

            {/* Chip placed badge */}
            {!isLocked && getBetAmountOnCell("B_LAY") > 0 && (
              <div className="absolute -top-2 -right-1 sm:-top-2.5 sm:-right-2 bg-gradient-to-br from-rose-500 to-red-600 border border-rose-400/50 rounded-full h-5 sm:h-6 px-1 sm:px-1.5 shadow-md flex items-center justify-center z-10">
                <span className="text-[7px] sm:text-[8px] font-black text-white font-mono">${getBetAmountOnCell("B_LAY")}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Chip Selector Bar */}
      <div className="border-t border-slate-800/80 pt-3 sm:pt-4 flex flex-col gap-2.5 sm:gap-3.5 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-500 tracking-wider">Chip Value</span>
          {selectedChip && (
            <span className="text-[8px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full">
              Selected: ${selectedChip}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-1 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
          {CHIPS.map((chip) => {
            const isChipSelected = selectedChip === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={`relative w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full border-2 border-dashed flex items-center justify-center font-bold text-xs text-white bg-gradient-to-br cursor-pointer select-none transition-all duration-300 shadow-md ${
                  chip.color
                } ${
                  isChipSelected
                    ? "scale-110 -translate-y-0.5 border-white shadow-[0_0_12px_rgba(255,255,255,0.4)] rotate-6"
                    : "hover:scale-105 active:scale-95 opacity-85 hover:opacity-100"
                }`}
              >
                {/* Chip Inner Pattern */}
                <div className="absolute inset-[2px] sm:inset-[3px] rounded-full border border-white/25 flex items-center justify-center">
                  <span className="font-mono text-[8px] sm:text-[10px] font-black drop-shadow-md">{chip.value}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
