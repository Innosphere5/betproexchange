"use client";

import React from "react";

export default function TeenPattiChips({ amount, className = "" }) {
  if (amount <= 0) return null;

  // Render stacked chips depending on the size of the bet/pot
  const getChips = () => {
    if (amount >= 5000) return ["bg-amber-500 border-amber-300", "bg-purple-600 border-purple-400", "bg-emerald-600 border-emerald-400"];
    if (amount >= 1000) return ["bg-purple-600 border-purple-400", "bg-emerald-600 border-emerald-400"];
    if (amount >= 500) return ["bg-emerald-600 border-emerald-400", "bg-rose-600 border-rose-400"];
    return ["bg-rose-600 border-rose-400"];
  };

  const chips = getChips();

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Stacked Chips Effect */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {chips.map((chipClass, idx) => (
          <div
            key={idx}
            style={{ transform: `translateY(${-idx * 3}px)` }}
            className={`absolute w-7 h-7 rounded-full border-2 border-dashed shadow-md flex items-center justify-center ${chipClass}`}
          >
            {/* Inner Ring */}
            <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Amount Label */}
      <span className="text-[10px] sm:text-xs font-black text-amber-400 font-mono drop-shadow-md mt-1">
        ${amount.toFixed(0)}
      </span>
    </div>
  );
}
