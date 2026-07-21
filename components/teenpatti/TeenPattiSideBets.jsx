"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function TeenPattiSideBets({ round, onSelectBet, selectedChoice, userBets = [] }) {
  const isLocked = round.status !== "BETTING_OPEN";

  const sideBetsList = [
    { label: "Trio", payout: "1 to 45" },
    { label: "Straight flush", payout: "1 to 35" },
    { label: "Straight", payout: "1 to 6" },
    { label: "Flush", payout: "1 to 4" },
    { label: "Pair", payout: "1 to 1" }
  ];

  // Get total bet placed by the user on a specific side bet type for the current round
  const getBetAmountOnCell = (betType) => {
    return userBets
      .filter(b => b.roundId === round.roundId && b.betType === betType)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  return (
    <div className="bg-[#121820]/90 backdrop-blur-md border border-slate-700/30 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col space-y-3 sm:space-y-4 w-full">
      
      {/* Title */}
      <div className="border-b border-slate-800/80 pb-2">
        <h3 className="text-xs uppercase tracking-widest font-black text-amber-500">
          Pair Plus market payouts
        </h3>
      </div>

      {/* Payout Table */}
      <div className="space-y-1.5 sm:space-y-2 select-text">
        <div className="flex items-center justify-between text-[8px] sm:text-[10px] uppercase font-black text-slate-500 pb-1">
          <span>Hands</span>
          <span>Payout</span>
        </div>
        {sideBetsList.map((bet, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-800/40 text-xs font-bold text-slate-300"
          >
            <span className="text-[11px] sm:text-xs">{bet.label}</span>
            <span className="font-mono text-amber-400 text-[11px] sm:text-xs">{bet.payout}</span>
          </div>
        ))}
      </div>

      {/* Placement row buttons */}
      <div className="flex gap-2 sm:gap-2.5 pt-1 sm:pt-2">
        <button
          onClick={() => !isLocked && onSelectBet("A_PAIR_PLUS")}
          disabled={isLocked}
          className={`relative flex-1 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            isLocked
              ? "bg-slate-900 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-50"
              : selectedChoice === "A_PAIR_PLUS"
              ? "bg-amber-600 border border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-98"
              : getBetAmountOnCell("A_PAIR_PLUS") > 0
              ? "bg-amber-950/30 border border-amber-500 text-amber-300"
              : "bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 cursor-pointer active:scale-98"
          }`}
        >
          {isLocked ? <Lock size={12} className="opacity-40" /> : "Player A Pair+"}

          {/* Placed Bet Indicator */}
          {!isLocked && getBetAmountOnCell("A_PAIR_PLUS") > 0 && (
            <div className="absolute -top-2 -right-1.5 bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400/50 rounded-full h-5 px-1 flex items-center justify-center scale-90 z-10">
              <span className="text-[8px] font-black text-slate-950 font-mono">${getBetAmountOnCell("A_PAIR_PLUS")}</span>
            </div>
          )}
        </button>

        <button
          onClick={() => !isLocked && onSelectBet("B_PAIR_PLUS")}
          disabled={isLocked}
          className={`relative flex-1 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            isLocked
              ? "bg-slate-900 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-50"
              : selectedChoice === "B_PAIR_PLUS"
              ? "bg-amber-600 border border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-98"
              : getBetAmountOnCell("B_PAIR_PLUS") > 0
              ? "bg-amber-950/30 border border-amber-500 text-amber-300"
              : "bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 cursor-pointer active:scale-98"
          }`}
        >
          {isLocked ? <Lock size={12} className="opacity-40" /> : "Player B Pair+"}

          {/* Placed Bet Indicator */}
          {!isLocked && getBetAmountOnCell("B_PAIR_PLUS") > 0 && (
            <div className="absolute -top-2 -right-1.5 bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400/50 rounded-full h-5 px-1 flex items-center justify-center scale-90 z-10">
              <span className="text-[8px] font-black text-slate-950 font-mono">${getBetAmountOnCell("B_PAIR_PLUS")}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
