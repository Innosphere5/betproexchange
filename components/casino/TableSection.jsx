"use client";

import React, { useEffect } from "react";
import { soundFX } from "../../lib/casinoSoundFX";

const PlayingCard = ({ value, suit, hidden, isWinner, isDealing, target, index = 0 }) => {
  const isRed = suit === '♥' || suit === '♦';
  const dealDelay = target === 'A' ? `${0.1 + index * 0.45}s` : `${0.35 + index * 0.45}s`;

  if (hidden) {
    return (
      <div 
        style={{ animationDelay: isDealing ? dealDelay : '0s' }}
        className={`w-[52px] h-[76px] sm:w-[65px] sm:h-[95px] bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-2 border-slate-400/30 flex items-center justify-center relative overflow-hidden group transform hover:-translate-y-1 transition-transform duration-300 ${
          isDealing 
            ? target === 'A' ? 'split-anim-a' : 'split-anim-b'
            : ''
        }`}
      >
        <div className="absolute inset-1 border border-white/10 rounded-lg bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2)_0%,transparent_70%)]"></div>
        <div className="w-6 h-8 sm:w-8 sm:h-10 rounded border border-white/20 flex items-center justify-center bg-blue-900/40">
          <span className="text-amber-400/60 font-black text-xs sm:text-sm">♠</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      style={{ animationDelay: `${index * 0.15}s` }}
      className={`flip-reveal w-[52px] h-[76px] sm:w-[65px] sm:h-[95px] bg-gradient-to-b from-white via-slate-50 to-slate-200 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.7)] border-2 flex flex-col items-center justify-between p-1.5 sm:p-2 relative overflow-hidden transform transition-all duration-500 ${
        isWinner 
          ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-105' 
          : 'border-slate-300'
      } ${isRed ? 'text-rose-600' : 'text-slate-900'}`}
    >
      {/* Specular Card Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none"></div>

      <div className="w-full flex justify-between items-center leading-none">
        <span className="text-xs sm:text-base font-black font-mono tracking-tighter">{value}</span>
        <span className="text-xs sm:text-sm">{suit}</span>
      </div>

      <div className="text-xl sm:text-3xl leading-none font-black my-auto drop-shadow-sm">
        {suit}
      </div>

      <div className="w-full flex justify-between items-center leading-none transform rotate-180">
        <span className="text-xs sm:text-base font-black font-mono tracking-tighter">{value}</span>
        <span className="text-xs sm:text-sm">{suit}</span>
      </div>
    </div>
  );
};

export default function TableSection({ round }) {
  const isDealing = round?.status === 'DEALING';
  const showResult = round?.status === 'RESULT_DECLARED';
  const winner = round?.result;

  useEffect(() => {
    if (isDealing) {
      const delays = [100, 350, 600, 850, 1100, 1350];
      const timers = delays.map(d => setTimeout(() => soundFX.playCardFlip(), d));
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [isDealing, round?.roundId]);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#09111e] via-[#0c1a13] to-[#08120b] relative overflow-hidden flex flex-col items-center justify-start py-4 lg:py-8 px-3 border-b border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] min-h-[280px] select-none">
      
      {/* Keyframe Card Split Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes splitToPlayerA {
          0% {
            transform: translate(140px, -140px) rotate(45deg) scale(0.15);
            opacity: 0;
            filter: blur(4px);
          }
          70% {
            transform: translate(-10px, 10px) rotate(-6deg) scale(1.05);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes splitToPlayerB {
          0% {
            transform: translate(-140px, -140px) rotate(-45deg) scale(0.15);
            opacity: 0;
            filter: blur(4px);
          }
          70% {
            transform: translate(10px, 10px) rotate(6deg) scale(1.05);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes flipCardFace {
          0% {
            transform: rotateY(90deg) scale(0.85);
            opacity: 0;
          }
          100% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }

        .split-anim-a {
          animation: splitToPlayerA 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }

        .split-anim-b {
          animation: splitToPlayerB 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }

        .flip-reveal {
          animation: flipCardFace 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}} />

      {/* Luxury Green Felt Radial Backdrop */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,#14532d_0%,#09111e_85%)]"></div>
      
      {/* Golden Table Arc Borders */}
      <div className="absolute -top-[30%] w-[130%] h-[160%] border-[3px] border-amber-500/20 rounded-[100%] pointer-events-none shadow-[inset_0_0_30px_rgba(245,158,11,0.1)]"></div>
      <div className="absolute -top-[25%] w-[120%] h-[150%] border border-amber-500/10 rounded-[100%] pointer-events-none"></div>

      {/* Central Deck Area (Dealer Shoe Origin) */}
      <div className="relative z-10 flex flex-col items-center mb-3 scale-[0.75] sm:scale-100">
         <div className={`relative w-[55px] h-[80px] opacity-90 transition-all duration-300 ${isDealing ? 'scale-110 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : ''}`}>
            <div className="absolute top-0 left-0 w-full h-full bg-blue-950 rounded-xl border border-white/20 shadow-md rotate-3"></div>
            <div className="absolute top-[-2px] left-[-2px] w-full h-full bg-blue-900 rounded-xl border border-white/20 shadow-md -rotate-2"></div>
            <div className="absolute top-[-4px] left-[-4px] w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl border-2 border-amber-400/50 shadow-xl flex flex-col items-center justify-center">
               <span className="text-amber-400 font-black text-xs tracking-widest">DECK</span>
               {isDealing && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mt-1"></span>}
            </div>
         </div>
      </div>
      
      {/* Cards & Sector Layout */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row justify-around items-center gap-6 max-w-4xl px-2">
         
         {/* PLAYER A SECTOR */}
         <div className={`relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-3xl border-2 transition-all duration-700 w-full max-w-sm lg:w-72 ${
            showResult && winner === 'A'
              ? 'bg-gradient-to-b from-blue-950/80 to-slate-900/90 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.35)] scale-105'
              : 'bg-slate-950/50 backdrop-blur-md border-blue-500/20 shadow-lg'
         }`}>
            {/* Winning Table Spotlight */}
            {showResult && winner === 'A' && (
               <div className="absolute inset-0 bg-amber-400/10 rounded-3xl animate-pulse pointer-events-none"></div>
            )}

            <div className="relative flex gap-2">
               {(round?.cards?.A || [{},{},{}]).map((c, i) => (
                  <PlayingCard 
                    key={`A-${round?.roundId || '0'}-${i}`}
                    target="A"
                    index={i}
                    suit={c.suit || "♠"} 
                    value={c.value || "A"} 
                    hidden={!showResult}
                    isWinner={showResult && winner === 'A'}
                    isDealing={isDealing}
                  />
               ))}
            </div>

            <div className="flex flex-col items-center gap-1">
               <div className={`px-6 py-1.5 rounded-full font-black text-xs tracking-[0.2em] border transition-all ${
                  showResult && winner === 'A'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce'
                    : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
               }`}>
                  PLAYER A
               </div>

               {showResult && round?.handNames?.A && (
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-black/40 px-3 py-0.5 rounded-full border border-amber-400/20 mt-1">
                     {round.handNames.A}
                  </span>
               )}
            </div>
         </div>

         {/* VS EMBLEM */}
         <div className="hidden lg:flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-900/90 border border-amber-500/30 flex items-center justify-center backdrop-blur-md shadow-xl ring-4 ring-black/30">
               <span className="text-xs font-black text-amber-400 italic">VS</span>
            </div>
         </div>

         {/* PLAYER B SECTOR */}
         <div className={`relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-3xl border-2 transition-all duration-700 w-full max-w-sm lg:w-72 ${
            showResult && winner === 'B'
              ? 'bg-gradient-to-b from-rose-950/80 to-slate-900/90 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.35)] scale-105'
              : 'bg-slate-950/50 backdrop-blur-md border-rose-500/20 shadow-lg'
         }`}>
            {/* Winning Table Spotlight */}
            {showResult && winner === 'B' && (
               <div className="absolute inset-0 bg-amber-400/10 rounded-3xl animate-pulse pointer-events-none"></div>
            )}

            <div className="relative flex gap-2">
               {(round?.cards?.B || [{},{},{}]).map((c, i) => (
                  <PlayingCard 
                    key={`B-${round?.roundId || '0'}-${i}`}
                    target="B"
                    index={i}
                    suit={c.suit || "♦"} 
                    value={c.value || "K"} 
                    hidden={!showResult}
                    isWinner={showResult && winner === 'B'}
                    isDealing={isDealing}
                  />
               ))}
            </div>

            <div className="flex flex-col items-center gap-1">
               <div className={`px-6 py-1.5 rounded-full font-black text-xs tracking-[0.2em] border transition-all ${
                  showResult && winner === 'B'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce'
                    : 'bg-rose-600/20 border-rose-500/30 text-rose-400'
               }`}>
                  PLAYER B
               </div>

               {showResult && round?.handNames?.B && (
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-black/40 px-3 py-0.5 rounded-full border border-amber-400/20 mt-1">
                     {round.handNames.B}
                  </span>
               )}
            </div>
         </div>

      </div>

      {/* Desktop HUD State Indicator */}
      {round?.status === 'DEALING' && (
         <div className="mt-6 hidden lg:flex flex-col items-center gap-1.5 animate-in fade-in duration-300">
            <div className="w-11 h-11 rounded-full border-2 border-amber-500/40 bg-slate-950/80 flex items-center justify-center shadow-lg relative animate-pulse">
               <span className="text-base font-black text-amber-400 font-mono">{round.timer}</span>
            </div>
            <span className="text-[10px] font-black text-amber-400 animate-pulse tracking-widest uppercase">Dealing Cards to A & B...</span>
         </div>
      )}

      {round?.status === 'BETTING_OPEN' && (
         <div className="mt-6 hidden lg:flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full border-2 border-emerald-500/40 bg-slate-950/80 flex items-center justify-center shadow-lg relative">
               <span className="text-base font-black text-emerald-400 font-mono">{round.timer}</span>
            </div>
            <span className="text-[10px] font-black text-emerald-400 animate-pulse tracking-widest uppercase">Place Your Bets</span>
         </div>
      )}
      
      {round?.status === 'BETTING_CLOSED' && (
         <div className="mt-6 hidden lg:flex">
            <div className="bg-rose-600/20 border border-rose-500/40 px-5 py-1.5 rounded-full backdrop-blur-md">
               <span className="text-xs font-black text-rose-400 tracking-widest uppercase">No More Bets</span>
            </div>
         </div>
      )}

      {round?.status === 'RESULT_DECLARED' && (
         <div className="mt-6 hidden lg:flex">
            <div className="bg-amber-500/20 border border-amber-500/40 px-5 py-1.5 rounded-full backdrop-blur-md">
               <span className="text-xs font-black text-amber-400 tracking-widest uppercase">
                  Player {winner} Wins!
               </span>
            </div>
         </div>
      )}
    </div>
  );
}
