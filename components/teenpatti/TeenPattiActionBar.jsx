"use client";

import React from "react";

export default function TeenPattiActionBar({
  player,
  isMyTurn,
  currentStake,
  status,
  sideShowRequester,
  sideShowTarget,
  activePlayersCount,
  onAction,
  loading
}) {
  if (!player) return null;

  if (player.isFolded) {
    return (
      <div className="bg-[#121820]/95 border border-[#2c3746] p-4 rounded-2xl flex items-center justify-center w-full min-h-[70px] shadow-xl">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          ❌ Folded — Waiting for round to complete...
        </span>
      </div>
    );
  }

  // Handle Side Show response state
  if (status === "SIDE_SHOW_PENDING") {
    if (sideShowTarget === player.userId) {
      return (
        <div className="bg-[#121820]/95 border border-[#2c3746] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 w-full shadow-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Side Show Request</span>
            <span className="text-xs font-bold text-amber-400 mt-0.5">
              {sideShowRequester} wants to compare hands with you.
            </span>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onAction("ACCEPT_SIDE_SHOW")}
              disabled={loading}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Accept
            </button>
            <button
              onClick={() => onAction("DECLINE_SIDE_SHOW")}
              disabled={loading}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Decline
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-[#121820]/95 border border-[#2c3746] p-4 rounded-2xl flex items-center justify-center w-full min-h-[70px] shadow-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            ⏳ Waiting for Side Show response...
          </span>
        </div>
      );
    }
  }

  // Not player turn
  if (!isMyTurn) {
    return (
      <div className="bg-[#121820]/95 border border-[#2c3746] p-4 rounded-2xl flex items-center justify-center w-full min-h-[70px] shadow-xl">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          ⏳ Waiting for your turn...
        </span>
      </div>
    );
  }

  // Normal betting round actions
  const isSeen = player.isSeen;
  const blindBetCost = currentStake;
  const chaalBetCost = currentStake * 2;
  const showBetCost = isSeen ? chaalBetCost : blindBetCost;

  return (
    <div className="bg-[#121820]/95 border border-[#2c3746] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between w-full shadow-2xl">
      
      {/* Turn info labels */}
      <div className="flex flex-row md:flex-col gap-6 md:gap-1 text-left self-start md:self-auto w-full md:w-auto border-b md:border-none border-slate-700/40 pb-2 md:pb-0">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Your Status</span>
          <span className={`text-xs font-bold mt-0.5 ${isSeen ? "text-sky-400" : "text-amber-500"}`}>
            {isSeen ? "Seen Player" : "Blind Player"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Min Bet Cost</span>
          <span className="text-xs font-black text-emerald-400 font-mono mt-0.5">
            ${isSeen ? chaalBetCost : blindBetCost}
          </span>
        </div>
      </div>

      {/* Dynamic Action Buttons */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
        {/* SEE CARDS (Only if Blind) */}
        {!isSeen && (
          <button
            onClick={() => onAction("SEE_CARDS")}
            disabled={loading}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            See Cards
          </button>
        )}

        {/* PLAY BLIND / CHAAL */}
        {isSeen ? (
          <button
            onClick={() => onAction("CHAAL")}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Chaal (${chaalBetCost})
          </button>
        ) : (
          <button
            onClick={() => onAction("PLAY_BLIND")}
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Play Blind (${blindBetCost})
          </button>
        )}

        {/* SIDE SHOW (Seen players only, needs > 2 players active) */}
        {isSeen && activePlayersCount > 2 && (
          <button
            onClick={() => onAction("REQUEST_SIDE_SHOW")}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Side Show (${chaalBetCost})
          </button>
        )}

        {/* SHOW (Only when exactly 2 players remain) */}
        {activePlayersCount === 2 && (
          <button
            onClick={() => onAction("CALL_SHOW")}
            disabled={loading}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Show (${showBetCost})
          </button>
        )}

        {/* FOLD (Always available on turn) */}
        <button
          onClick={() => onAction("FOLD")}
          disabled={loading}
          className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 sm:px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          Fold
        </button>
      </div>
    </div>
  );
}
