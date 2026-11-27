"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function TeenPattiSideBets({ round, onSelectBet, selectedChoice, userBets = [] }) {
  const isLocked = round?.status !== "BETTING_OPEN";

  const sideBetsList = [
    { label: "Trio (Trail)", payout: "1 to 45" },
    { label: "Straight Flush", payout: "1 to 35" },
    { label: "Straight", payout: "1 to 6" },
    { label: "Flush (Color)", payout: "1 to 4" },
    { label: "Pair", payout: "1 to 1" },
  ];

  const getBetAmountOnCell = (betType) => {
    return userBets
      .filter((b) => b.roundId === round?.roundId && b.betType === betType)
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  };

  return (
    <div className="bg-[#121820]/95 backdrop-blur-md border border-slate-700/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col space-y-3 w-full">
      <div className="border-b border-slate-800/80 pb-2 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest font-black text-amber-400">
          Pair Plus Side Bets
        </h3>
        <span className="text-[9px] text-slate-400 font-bold">Any Hand Bonus</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] uppercase font-black text-slate-500 pb-1">
          <span>Hand</span>
          <span>Payout</span>
        </div>
        {sideBetsList.map((bet, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1 border-b border-slate-800/40 text-xs font-bold text-slate-300"
          >
            <span className="text-[11px] sm:text-xs">{bet.label}</span>
            <span className="font-mono text-amber-400 text-[11px] sm:text-xs">{bet.payout}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => !isLocked && onSelectBet("A_PAIR_PLUS")}
          disabled={isLocked}
          className={`relative flex-1 min-h-[44px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border touch-manipulation ${
            isLocked
              ? "bg-slate-900 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50"
              : selectedChoice === "A_PAIR_PLUS"
                ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                : getBetAmountOnCell("A_PAIR_PLUS") > 0
                  ? "bg-amber-950/40 border-amber-500 text-amber-300 cursor-pointer"
                  : "bg-amber-500/10 border-amber-500/35 hover:bg-amber-500/20 text-amber-400 cursor-pointer active:scale-95"
          }`}
        >
          {isLocked ? <Lock size={12} className="opacity-40" /> : "Player A Pair+"}
          {getBetAmountOnCell("A_PAIR_PLUS") > 0 && (
            <div className="absolute -top-2 -right-1 bg-amber-500 border border-white/60 rounded-full h-5 px-1.5 flex items-center justify-center z-10">
              <span className="text-[8px] font-black text-slate-950 font-mono">
                ₹{getBetAmountOnCell("A_PAIR_PLUS")}
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => !isLocked && onSelectBet("B_PAIR_PLUS")}
          disabled={isLocked}
          className={`relative flex-1 min-h-[44px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border touch-manipulation ${
            isLocked
              ? "bg-slate-900 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50"
              : selectedChoice === "B_PAIR_PLUS"
                ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                : getBetAmountOnCell("B_PAIR_PLUS") > 0
                  ? "bg-amber-950/40 border-amber-500 text-amber-300 cursor-pointer"
                  : "bg-amber-500/10 border-amber-500/35 hover:bg-amber-500/20 text-amber-400 cursor-pointer active:scale-95"
          }`}
        >
          {isLocked ? <Lock size={12} className="opacity-40" /> : "Player B Pair+"}
          {getBetAmountOnCell("B_PAIR_PLUS") > 0 && (
            <div className="absolute -top-2 -right-1 bg-amber-500 border border-white/60 rounded-full h-5 px-1.5 flex items-center justify-center z-10">
              <span className="text-[8px] font-black text-slate-950 font-mono">
                ₹{getBetAmountOnCell("B_PAIR_PLUS")}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
