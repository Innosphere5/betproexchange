"use client";

import React from "react";
import { Coins, Trash2, CheckCircle } from "lucide-react";

export default function TeenPattiOpenBets({
  userBets = [],
  selectedChoice,
  stakeAmount,
  onChangeStake,
  onSubmitBet,
  onCancel,
  isBettingOpen,
  walletBalance
}) {
  const getReadableBetName = (type) => {
    switch (type) {
      case "A_BACK": return "Player A (Back)";
      case "A_LAY": return "Player A (Lay)";
      case "B_BACK": return "Player B (Back)";
      case "B_LAY": return "Player B (Lay)";
      case "A_PAIR_PLUS": return "Player A (Pair Plus)";
      case "B_PAIR_PLUS": return "Player B (Pair Plus)";
      default: return type;
    }
  };

  const handleQuickAdd = (amount) => {
    const current = parseFloat(stakeAmount) || 0;
    onChangeStake((current + amount).toString());
  };

  return (
    <div className="bg-[#121820]/90 backdrop-blur-md border border-slate-700/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 w-full">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-2.5 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest font-black text-slate-400 flex items-center gap-1.5">
          <Coins size={14} className="text-amber-500" />
          Bet Slip
        </h3>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
          Active Bets
        </span>
      </div>

      {/* Placing Bet Form (If user selected a Back/Lay choice) */}
      {selectedChoice && isBettingOpen ? (
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white">
              {getReadableBetName(selectedChoice)}
            </span>
            <span className={`text-[10px] font-mono font-bold bg-opacity-10 px-2 py-0.5 rounded border ${
              selectedChoice.includes("BACK") 
                ? "text-blue-400 bg-blue-500 border-blue-500/20" 
                : selectedChoice.includes("LAY")
                ? "text-rose-400 bg-rose-500 border-rose-500/20"
                : "text-amber-400 bg-amber-500 border-amber-500/20"
            }`}>
              {selectedChoice.includes("BACK") ? "Odds: 1.98" : selectedChoice.includes("LAY") ? "Odds: 1.98" : "Pair Plus"}
            </span>
          </div>

          {/* Stake Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Bet Amount ($)</span>
            <div className="flex bg-[#0a0d14] border border-slate-800 rounded-xl overflow-hidden p-2 items-center shadow-inner">
              <span className="text-slate-500 font-bold text-xs pl-1.5">$</span>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => onChangeStake(e.target.value)}
                placeholder="Min: 10"
                className="w-full bg-transparent border-none text-white text-center font-black text-sm focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Quick Adds */}
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => handleQuickAdd(amt)}
                className="text-[9px] bg-slate-850 hover:bg-slate-800 text-slate-300 font-extrabold py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
              >
                +{amt}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={12} />
              Cancel
            </button>
            <button
              onClick={onSubmitBet}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={12} />
              Place Bet
            </button>
          </div>
        </div>
      ) : selectedChoice && !isBettingOpen ? (
        <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-2xl text-center py-5 animate-in fade-in duration-300">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
            ⚠️ Betting is currently closed
          </span>
        </div>
      ) : null}

      {/* Active Bets List */}
      <div className="space-y-2 select-text max-h-[220px] overflow-y-auto no-scrollbar">
        {userBets.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs font-medium">
            No active bets placed in this round
          </div>
        ) : (
          [...userBets].reverse().map((bet, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 rounded-2xl border select-none transition-all duration-300 ${
                bet.betType.includes('BACK') 
                  ? 'bg-blue-950/15 border-blue-500/20 text-blue-400 shadow-[0_2px_8px_rgba(59,130,246,0.05)]' 
                  : bet.betType.includes('LAY')
                  ? 'bg-rose-950/15 border-rose-500/20 text-rose-400 shadow-[0_2px_8px_rgba(244,63,94,0.05)]'
                  : 'bg-amber-950/15 border-amber-500/20 text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.05)]'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white leading-none mb-1">
                  {getReadableBetName(bet.betType)}
                </span>
                <span className="text-[8px] font-mono text-slate-500 leading-none">
                  Round: {bet.roundId ? bet.roundId.replace('TP-', '') : ''}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black font-mono text-slate-200">
                  ${bet.amount.toFixed(0)}
                </span>
                <span className={`text-[8px] font-mono uppercase font-bold mt-1 px-1.5 py-0.5 rounded ${
                  bet.status === 'WIN' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : bet.status === 'LOSE'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {bet.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
