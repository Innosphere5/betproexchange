"use client";

import React, { useState, useEffect } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";

export default function AviatorPlayers() {
  const { liveBets, bets } = useAviatorStore();
  const [activeTab, setActiveTab] = useState("all"); // "all" or "my"
  const [myBetsList, setMyBetsList] = useState([]);

  // Consolidate current user's active bets for "My Bets" view
  useEffect(() => {
    const list = [];
    [1, 2].forEach(slot => {
      const b = bets[slot];
      if (b && b.active) {
        list.push({
          slot,
          stake: b.stake,
          autoCashout: b.autoCashoutMultiplier,
          status: b.status,
          multiplier: b.cashoutMultiplier,
          payout: b.payout
        });
      }
    });
    
    setMyBetsList(prevList => {
      if (JSON.stringify(prevList) !== JSON.stringify(list)) {
        return list;
      }
      return prevList;
    });
  }, [bets]);

  return (
    <div className="bg-[#1b222d] border border-[#2c3746] rounded-2xl flex flex-col h-[350px] shadow-xl overflow-hidden w-full">
      {/* Tabs */}
      <div className="flex border-b border-[#2c3746] bg-[#121820]/50 shrink-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2
            ${activeTab === "all" 
              ? "border-[#1abc9c] text-[#1abc9c] bg-[#1a2332]/50" 
              : "border-transparent text-gray-400 hover:text-white"}`}
        >
          All Bets ({liveBets.length + myBetsList.length})
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2
            ${activeTab === "my" 
              ? "border-[#1abc9c] text-[#1abc9c] bg-[#1a2332]/50" 
              : "border-transparent text-gray-400 hover:text-white"}`}
        >
          My Bets ({myBetsList.length})
        </button>
      </div>

      {/* Players Feed Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {activeTab === "all" ? (
          <div className="space-y-1.5">
            {/* Headers */}
            <div className="grid grid-cols-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold px-2 py-1 border-b border-gray-800">
              <span>User</span>
              <span className="text-right">Bet (USD)</span>
              <span className="text-right">Cashout</span>
            </div>

            {/* List */}
            {liveBets.length === 0 && myBetsList.length === 0 ? (
              <div className="text-center text-xs text-gray-600 italic py-8">
                Waiting for players to place bets...
              </div>
            ) : (
              <>
                {/* User's own active bets first */}
                {myBetsList.map((bet, idx) => (
                  <div
                    key={`my-${idx}`}
                    className="grid grid-cols-3 text-xs bg-[#1abc9c]/10 border border-[#1abc9c]/20 px-2.5 py-2 rounded-xl text-white items-center font-bold"
                  >
                    <span className="text-[#1abc9c] flex items-center gap-1">
                      ⭐ You (Slot {bet.slot})
                    </span>
                    <span className="text-right font-mono">${bet.stake.toFixed(2)}</span>
                    <span className="text-right">
                      {bet.status === 'WON' ? (
                        <span className="text-emerald-400 font-extrabold font-mono">
                          {bet.multiplier?.toFixed(2)}x (+${bet.payout.toFixed(2)})
                        </span>
                      ) : bet.status === 'LOST' ? (
                        <span className="text-rose-500/70 font-semibold">Crashed</span>
                      ) : (
                        <span className="text-gray-500">In-Flight</span>
                      )}
                    </span>
                  </div>
                ))}

                {/* Social Bets */}
                {liveBets.map((bet, idx) => (
                  <div
                    key={`all-${idx}`}
                    className={`grid grid-cols-3 text-xs px-2.5 py-1.5 rounded-xl border items-center transition-all duration-300
                      ${bet.cashed 
                        ? "bg-[#10b981]/5 border-[#10b981]/15 text-[#10b981]" 
                        : "bg-[#121820]/30 border-[#2c3746]/30 text-gray-300"}`}
                  >
                    <span className="font-semibold">{bet.username}</span>
                    <span className="text-right font-mono text-gray-400">${bet.stake.toFixed(0)}</span>
                    <span className="text-right font-bold">
                      {bet.cashed ? (
                        <span className="text-emerald-400 font-mono font-black">
                          {bet.multiplier?.toFixed(2)}x (+${bet.payout.toFixed(0)})
                        </span>
                      ) : (
                        <span className="text-gray-600 font-semibold font-mono">
                          {bet.autoCashoutMultiplier ? `${bet.autoCashoutMultiplier.toFixed(2)}x` : '—'}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold px-2 py-1 border-b border-gray-800">
              <span>Bet Slot</span>
              <span className="text-right">Stake</span>
              <span className="text-right">Status</span>
            </div>

            {myBetsList.length === 0 ? (
              <div className="text-center text-xs text-gray-600 italic py-8">
                You haven't placed any bets in this round.
              </div>
            ) : (
              myBetsList.map((bet, idx) => (
                <div
                  key={`my-tab-${idx}`}
                  className="grid grid-cols-3 text-xs bg-[#121820]/45 border border-[#2c3746] px-2.5 py-2 rounded-xl text-white font-bold items-center"
                >
                  <span className="text-white">Slot {bet.slot}</span>
                  <span className="text-right font-mono text-gray-300">${bet.stake.toFixed(2)}</span>
                  <span className="text-right">
                    {bet.status === 'WON' ? (
                      <span className="text-emerald-400 font-black">
                        Won {bet.multiplier?.toFixed(2)}x (+${bet.payout.toFixed(2)})
                      </span>
                    ) : bet.status === 'LOST' ? (
                      <span className="text-rose-500 font-semibold">Lost</span>
                    ) : (
                      <span className="text-amber-400 animate-pulse">Running</span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
