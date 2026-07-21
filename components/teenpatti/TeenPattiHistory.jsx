"use client";

import React from "react";

export default function TeenPattiHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-[#121a26] border border-slate-700/50 rounded-2xl p-4 flex items-center justify-center h-[70px]">
        <span className="text-slate-500 text-xs font-semibold">No recent rounds</span>
      </div>
    );
  }

  return (
    <div className="bg-[#121a26] border border-slate-700/50 rounded-2xl p-3 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Recent Winners</span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Live Stats</span>
      </div>
      
      {/* Horizontal ribbon of winners */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {history.map((item, idx) => {
          const isBot = item.winnerId?.match(/\d$/); // bots end with numbers in username generator
          const displayName = isBot ? "Bot" : item.winnerId?.substring(0, 4) + "***";
          
          return (
            <div
              key={idx}
              className="bg-[#1b2537] border border-slate-800/80 rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center min-w-[75px] shrink-0 hover:scale-[1.03] transition-all"
            >
              <span className="text-[9px] font-bold text-slate-300 tracking-tight leading-none mb-1">
                {displayName}
              </span>
              <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-sans tracking-wide">
                {item.winnerHand?.name || "High Card"}
              </span>
              <span className="text-[9px] font-bold font-mono text-emerald-400 mt-1">
                +${item.pot}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
