"use client";

import React, { useEffect, useState } from "react";

export default function TeenPattiTimer({ deadline, duration = 20000 }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || timeLeft <= 0) return null;

  const seconds = Math.ceil(timeLeft / 1000);
  const percentage = (timeLeft / duration) * 100;
  
  // Radial color coding (green -> amber -> red)
  const getStrokeColor = () => {
    if (percentage > 50) return "stroke-emerald-500";
    if (percentage > 25) return "stroke-amber-500";
    return "stroke-rose-600";
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 scale-[1.15]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-[#1e293b]/50 fill-none"
          strokeWidth="3.5"
        />
        {/* Animated Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className={`fill-none transition-all duration-100 ease-linear ${getStrokeColor()}`}
          strokeWidth="3.5"
          strokeDasharray="282.7"
          strokeDashoffset={282.7 - (282.7 * percentage) / 100}
          strokeLinecap="round"
        />
      </svg>
      {/* Centered digits */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black text-white font-mono bg-slate-950/80 px-1.5 py-0.5 rounded-full ring-1 ring-white/10 shadow-lg">
          {seconds}s
        </span>
      </div>
    </div>
  );
}
