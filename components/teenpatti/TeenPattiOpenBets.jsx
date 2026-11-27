"use client";

import React from "react";
import { Coins, Trash2, CheckCircle, X } from "lucide-react";

export default function TeenPattiOpenBets({
  userBets = [],
  selectedChoice,
  stakeAmount,
  onChangeStake,
  onSubmitBet,
  onCancel,
  isBettingOpen,
  isSubmitting = false,
  isMobileModal = false,
}) {
  const getReadableBetName = (type) => {
    switch (type) {
      case "A_BACK": return "Player A (Back)";
      case "A_LAY": return "Player A (Lay)";
      case "B_BACK": return "Player B (Back)";
      case "B_LAY": return "Player B (Lay)";
      case "A_PAIR_PLUS": return "Player A (Pair+)";
      case "B_PAIR_PLUS": return "Player B (Pair+)";
      default: return type;
    }
  };

  const handleQuickAdd = (amount) => {
    const current = parseFloat(stakeAmount) || 0;
    onChangeStake((current + amount).toString());
  };

  const isLay = selectedChoice === "A_LAY" || selectedChoice === "B_LAY";
  const isPairPlus = Boolean(selectedChoice?.includes("PAIR_PLUS"));
  const stake = parseFloat(stakeAmount) || 0;
  const riskRequired = isLay ? Math.round(stake * 0.98 * 100) / 100 : stake;
  const estProfit = isLay
    ? Math.round(stake * 0.98 * 100) / 100
    : isPairPlus
      ? Math.round(stake * 1 * 0.98 * 100) / 100 // minimum Pair return 1:1
      : Math.round(stake * 0.98 * 0.98 * 100) / 100;

  return (
    <div className="bg-[#121820]/95 backdrop-blur-md border border-slate-700/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3.5 w-full">
      <div className="border-b border-slate-800/80 pb-2.5 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest font-black text-slate-300 flex items-center gap-1.5">
          <Coins size={14} className="text-amber-400" />
          Bet Slip
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Active: {userBets.length}
          </span>
          {isMobileModal && (
            <button
              type="button"
              onClick={onCancel}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {selectedChoice && isBettingOpen ? (
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white">{getReadableBetName(selectedChoice)}</span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                selectedChoice.includes("BACK")
                  ? "text-blue-300 bg-blue-500/15 border-blue-500/30"
                  : selectedChoice.includes("LAY")
                    ? "text-rose-300 bg-rose-500/15 border-rose-500/30"
                    : "text-amber-300 bg-amber-500/15 border-amber-500/30"
              }`}
            >
              {isPairPlus ? "Pair Plus" : "Odds: 1.98"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
              {isLay ? "Lay Stake Amount (₹)" : "Stake Amount (₹)"}
            </span>
            <div className="flex bg-[#0a0d14] border border-slate-700 rounded-xl overflow-hidden px-3 py-2 items-center">
              <span className="text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={stakeAmount}
                onChange={(e) => onChangeStake(e.target.value)}
                placeholder="Min 10"
                className="w-full bg-transparent border-none text-amber-400 text-center font-black text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => handleQuickAdd(amt)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold py-2 rounded-lg border border-slate-700 cursor-pointer"
              >
                +{amt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-[11px]">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-slate-400">
                {isLay ? "Liability" : "Wallet Debit"}
              </span>
              <span className="font-mono font-black text-rose-300">
                ₹{riskRequired.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase font-bold text-slate-400">
                {isPairPlus ? "Min Net Profit (Pair)" : "Est. Net Profit"}
              </span>
              <span className="font-mono font-black text-emerald-400">
                +₹{estProfit.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1"
            >
              <Trash2 size={12} />
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmitBet}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <CheckCircle size={12} />
              {isSubmitting ? "Placing..." : "Place Bet"}
            </button>
          </div>
        </div>
      ) : selectedChoice && !isBettingOpen ? (
        <div className="bg-rose-950/25 border border-rose-900/40 p-3.5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
            Betting is currently closed
          </span>
        </div>
      ) : null}

      {/* Active Round Bets List */}
      {!isMobileModal && (
        <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
          {userBets.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              No active bets placed in this round
            </div>
          ) : (
            [...userBets].map((bet, idx) => (
              <div
                key={bet._id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  bet.betType.includes("BACK")
                    ? "bg-blue-950/20 border-blue-500/25 text-blue-300"
                    : bet.betType.includes("LAY")
                      ? "bg-rose-950/20 border-rose-500/25 text-rose-300"
                      : "bg-amber-950/20 border-amber-500/25 text-amber-300"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white leading-tight">
                    {getReadableBetName(bet.betType)}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    {bet.roundId ? bet.roundId.replace("TP-", "#").slice(-7) : ""}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black font-mono text-slate-100">
                    ₹{Number(bet.amount || 0).toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`text-[8px] font-mono uppercase font-bold mt-0.5 px-1.5 py-0.5 rounded ${
                      bet.status === "WIN"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : bet.status === "LOSE"
                          ? "bg-rose-500/15 text-rose-400"
                          : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {bet.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
