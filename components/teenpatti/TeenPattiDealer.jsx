"use client";

import React, { useState, useEffect } from "react";
import TeenPattiCard from "./TeenPattiCard";
import { Sparkles, Trophy } from "lucide-react";

export default function TeenPattiDealer({ round, history }) {
  const { status, timer, cards, handNames } = round;

  // Progressive reveal states
  const [revealedA, setRevealedA] = useState([false, false, false]);
  const [revealedB, setRevealedB] = useState([false, false, false]);
  const [showRankA, setShowRankA] = useState(false);
  const [showRankB, setShowRankB] = useState(false);
  const [winnerHighlight, setWinnerHighlight] = useState(null);

  useEffect(() => {
    if (status !== "RESULT_DECLARED") {
      setRevealedA([false, false, false]);
      setRevealedB([false, false, false]);
      setShowRankA(false);
      setShowRankB(false);
      setWinnerHighlight(null);
      return;
    }

    // Sync immediate reveal if reconnected or page refreshed mid-reveal
    if (timer <= 6) {
      setRevealedA([true, true, true]);
      setRevealedB([true, true, true]);
      setShowRankA(true);
      setShowRankB(true);
      setWinnerHighlight(round.result);
      return;
    }

    // Timeline progressive reveal sequence
    const timeouts = [];

    // Player A progressive reveal
    timeouts.push(setTimeout(() => setRevealedA(r => [true, r[1], r[2]]), 300));
    timeouts.push(setTimeout(() => setRevealedA(r => [r[0], true, r[2]]), 600));
    timeouts.push(setTimeout(() => setRevealedA(r => [r[0], r[1], true]), 900));
    timeouts.push(setTimeout(() => setShowRankA(true), 1300));

    // Player B progressive reveal
    timeouts.push(setTimeout(() => setRevealedB(r => [true, r[1], r[2]]), 1800));
    timeouts.push(setTimeout(() => setRevealedB(r => [r[0], true, r[2]]), 2100));
    timeouts.push(setTimeout(() => setRevealedB(r => [r[0], r[1], true]), 2400));
    timeouts.push(setTimeout(() => setShowRankB(true), 2800));

    // Winner Highlight
    timeouts.push(setTimeout(() => setWinnerHighlight(round.result), 3300));

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [status, round.result, round.roundId, timer]);

  // Show card slots when game is running (any status except LOADING)
  const isGameRunning = status && status !== "LOADING";

  return (
    <div className="relative w-full min-h-[290px] sm:min-h-0 aspect-[4/3] sm:aspect-[16/9] bg-[#0b0e14] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/30 shadow-2xl flex flex-col justify-between select-none">
      
      {/* Dealer Animation Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dealToPlayerA {
          0% {
            transform: translate(100px, -120px) rotate(45deg) scale(0.15);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
        }
        @keyframes dealToPlayerB {
          0% {
            transform: translate(100px, -190px) rotate(45deg) scale(0.15);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
        }
        .deal-anim-a {
          animation: dealToPlayerA 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .deal-anim-b {
          animation: dealToPlayerB 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .glow-winner {
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.45);
          border-color: rgba(234, 179, 8, 0.85) !important;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Casino Live Environment Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-90 filter transition-all duration-700"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(10,14,22,0.4), rgba(13,18,28,0.96)), url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=1200&q=80')` 
        }}
      >
        {/* Semi-circular Luxury Green Casino Felt Table layout */}
        <div className="absolute bottom-0 inset-x-0 h-[52%] bg-gradient-to-t from-[#0b2417] via-[#0f3823] to-[#124a2e]/90 border-t-2 border-amber-500/20 rounded-t-[100px] sm:rounded-t-[140px] flex flex-col items-center justify-start pt-2 sm:pt-3 shadow-[inset_0_4px_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-1.5 opacity-40">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[8px] sm:text-[9px] font-black tracking-[0.25em] sm:tracking-[0.35em] text-amber-500 uppercase leading-none">
              Teen Patti Live
            </span>
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Dealer Card Shoe (Top Right) */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 w-12 h-8 sm:w-16 sm:h-10 bg-slate-950/80 border border-slate-700/40 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
        <div className="w-9 h-5 sm:w-12 sm:h-6 rounded bg-gradient-to-r from-red-800 to-red-650 border border-red-500/20 flex items-center justify-center transform rotate-12">
          <span className="text-[7px] sm:text-[8px] font-black text-white/50 tracking-widest">DECK</span>
        </div>
      </div>

      {/* Header Overlay (Timer + Status Banner) */}
      <div className="absolute top-2.5 inset-x-2.5 sm:top-4 sm:inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        
        {/* State Banner */}
        <div className="flex flex-col gap-1">
          {status === "DEALING" && (
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/35 rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-[8px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest">Splitting Cards...</span>
            </div>
          )}
          {status === "BETTING_OPEN" && (
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/35 rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Betting Open</span>
            </div>
          )}
          {status === "BETTING_CLOSED" && (
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-rose-600/10 border border-rose-600/35 rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              <span className="text-[8px] sm:text-[10px] font-black text-rose-400 uppercase tracking-widest">No More Bets</span>
            </div>
          )}
          {status === "RESULT_DECLARED" && (
            <div className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 border rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)] ${
              winnerHighlight 
                ? "bg-amber-500/10 border-amber-500/35 text-amber-400 animate-pulse" 
                : "bg-sky-500/10 border-sky-500/35 text-sky-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${winnerHighlight ? "bg-amber-500" : "bg-sky-400"}`}></span>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                {winnerHighlight ? `Player ${winnerHighlight} Wins!` : "Revealing Cards"}
              </span>
            </div>
          )}
        </div>

        {/* Circular Countdown Timer */}
        {timer > 0 && (
          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            status === "BETTING_OPEN"
              ? timer <= 5
                ? "border-rose-500 bg-rose-950/70 text-rose-400 animate-bounce scale-110"
                : "border-emerald-500 bg-slate-950/80 text-emerald-400"
              : status === "DEALING"
              ? "border-amber-500 bg-slate-950/80 text-amber-400"
              : "border-slate-600 bg-slate-950/80 text-slate-400"
          }`}>
            <span className="font-mono font-black text-xs sm:text-base">{timer}</span>
          </div>
        )}
      </div>

      {/* Main Dealer Card Spots Area */}
      <div className="absolute inset-x-0 top-[20%] sm:top-[22%] z-20 flex flex-col items-center justify-center px-2">
        
        {isGameRunning ? (
          <div className="flex flex-col space-y-2 sm:space-y-3.5 w-full max-w-[500px]">
            
            {/* Player A Spot */}
            <div 
              className={`flex items-center justify-between bg-slate-950/75 backdrop-blur-md py-1.5 px-2 sm:py-2 sm:px-3.5 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
                winnerHighlight === "A" 
                  ? "glow-winner bg-amber-500/10" 
                  : "border-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-3">
                <span className={`text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  winnerHighlight === "A" 
                    ? "bg-amber-500 text-slate-950" 
                    : "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                }`}>
                  Player A
                </span>
                
                {/* Alternating split card deal animation for Player A: 0.1s, 0.4s, 0.7s */}
                <div className="flex -space-x-2.5 sm:-space-x-3.5">
                  {[0, 1, 2].map((idx) => {
                    const card = cards && cards.A ? cards.A[idx] : null;
                    const dealDelay = `${0.1 + idx * 0.3}s`;
                    return (
                      <TeenPattiCard 
                        key={`A-${idx}`} 
                        card={card} 
                        faceUp={revealedA[idx]}
                        style={{ animationDelay: status === "DEALING" ? dealDelay : "0s" }}
                        className={status === "DEALING" ? "deal-anim-a" : ""} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Hand rank badge */}
              <div className="min-w-[60px] sm:min-w-[80px] text-right">
                {showRankA && handNames && handNames.A && (
                  <span className="text-[8px] sm:text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl shadow uppercase animate-in zoom-in-75 duration-300">
                    {handNames.A}
                  </span>
                )}
              </div>
            </div>

            {/* Player B Spot */}
            <div 
              className={`flex items-center justify-between bg-slate-950/75 backdrop-blur-md py-1.5 px-2 sm:py-2 sm:px-3.5 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
                winnerHighlight === "B" 
                  ? "glow-winner bg-amber-500/10" 
                  : "border-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-3">
                <span className={`text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  winnerHighlight === "B" 
                    ? "bg-amber-500 text-slate-950" 
                    : "bg-rose-600/20 text-rose-400 border border-rose-500/20"
                }`}>
                  Player B
                </span>
                
                {/* Alternating split card deal animation for Player B: 0.25s, 0.55s, 0.85s */}
                <div className="flex -space-x-2.5 sm:-space-x-3.5">
                  {[0, 1, 2].map((idx) => {
                    const card = cards && cards.B ? cards.B[idx] : null;
                    const dealDelay = `${0.25 + idx * 0.3}s`;
                    return (
                      <TeenPattiCard 
                        key={`B-${idx}`} 
                        card={card} 
                        faceUp={revealedB[idx]}
                        style={{ animationDelay: status === "DEALING" ? dealDelay : "0s" }}
                        className={status === "DEALING" ? "deal-anim-b" : ""} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Hand rank badge */}
              <div className="min-w-[60px] sm:min-w-[80px] text-right">
                {showRankB && handNames && handNames.B && (
                  <span className="text-[8px] sm:text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl shadow uppercase animate-in zoom-in-75 duration-300">
                    {handNames.B}
                  </span>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Waiting for next round...
            </span>
          </div>
        )}
      </div>

      {/* History Ribbon + Bottom results bar */}
      <div className="relative w-full bg-[#090d14] border-t border-slate-800/80 p-1.5 sm:p-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pr-2 no-scrollbar">
          {history && history.map((h, i) => (
            <div 
              key={i} 
              className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border font-mono font-black text-[9px] sm:text-xs flex items-center justify-center shadow-md select-none shrink-0 ${
                h === 'A' 
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                  : 'bg-rose-600/10 border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]'
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end shrink-0 pl-2 sm:pl-3 border-l border-slate-800/80">
          <span className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-widest font-black leading-none mb-0.5">Round ID</span>
          <span className="text-[8px] sm:text-[10px] font-bold font-mono text-slate-300 leading-none">
            {round.roundId ? round.roundId.replace('TP-', '') : "------"}
          </span>
        </div>
      </div>
    </div>
  );
}
