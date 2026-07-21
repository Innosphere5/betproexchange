"use client";

import React from "react";
import { X } from "lucide-react";

export default function TeenPattiHowToPlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  const rankings = [
    { name: "1. Trail / Set / Trio", desc: "Three cards of the same rank. AAA is the highest, 222 is the lowest.", example: "A♠ A♥ A♦" },
    { name: "2. Pure Sequence / Straight Flush", desc: "Three consecutive cards of the same suit. A-2-3 is the lowest, Q-K-A is the highest.", example: "A♥ 2♥ 3♥" },
    { name: "3. Sequence / Run", desc: "Three consecutive cards of mixed suits.", example: "4♠ 5♥ 6♦" },
    { name: "4. Color / Flush", desc: "Three cards of the same suit, not in sequence. High card breaks ties.", example: "A♣ J♣ 5♣" },
    { name: "5. Pair", desc: "Two cards of matching rank. Kicker breaks ties.", example: "K♠ K♦ 5♥" },
    { name: "6. High Card", desc: "None of the above. Ranks compared one by one starting with the highest card.", example: "A♦ J♠ 4♣" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative max-w-xl w-full bg-[#1b2537] border border-slate-700/60 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4 shrink-0">
          <h2 className="text-lg font-bold uppercase tracking-wider text-amber-400">Teen Patti Rules</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 select-text">
          {/* Rules Brief */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase text-white">How To Play</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Teen Patti (Indian Poker) is a 3-card game played with a standard 52-card deck. Before the deal, a <strong>Boot Amount</strong> is collected from all players to start the pot.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              On your turn, you can play <strong>Blind</strong> (without looking at your cards) or <strong>Seen / Chaal</strong> (after seeing them). Seen players must bet <strong>double</strong> the current blind stake to remain in the hand.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Betting rounds continue until either only one player is left (they win the pot) or a <strong>Show</strong> is called when exactly two players remain. The player with the better hand ranking wins the pot!
            </p>
          </div>

          {/* Hand Rankings */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase text-white">Hand Rankings (Highest to Lowest)</h3>
            <div className="space-y-2.5">
              {rankings.map((rank, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-300/90">{rank.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rank.desc}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1 rounded text-rose-400 self-start sm:self-auto tracking-widest">
                    {rank.example}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
