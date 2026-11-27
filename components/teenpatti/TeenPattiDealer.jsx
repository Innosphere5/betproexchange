"use client";

import React, { useState, useEffect } from "react";
import TeenPattiCard from "./TeenPattiCard";
import { soundFX } from "../../lib/casinoSoundFX";
import { ShieldCheck } from "lucide-react";

export default function TeenPattiDealer({ round, history = [] }) {
  const { status = "IDLE", timer = 0, maxTimer = 10, cards, handNames, seedHash } = round || {};

  const [revealedA, setRevealedA] = useState([false, false, false]);
  const [revealedB, setRevealedB] = useState([false, false, false]);
  const [showRankA, setShowRankA] = useState(false);
  const [showRankB, setShowRankB] = useState(false);
  const [winnerHighlight, setWinnerHighlight] = useState(null);

  useEffect(() => {
    if (status === "IDLE" || status === "DEALING" || status === "BETTING_OPEN") {
      setRevealedA([false, false, false]);
      setRevealedB([false, false, false]);
      setShowRankA(false);
      setShowRankB(false);
      setWinnerHighlight(null);
      return;
    }

    if (status === "BETTING_CLOSED") {
      const timeouts = [
        setTimeout(() => { setRevealedA([true, false, false]); soundFX.playCardFlip(); }, 250),
        setTimeout(() => { setRevealedB([true, false, false]); soundFX.playCardFlip(); }, 750),
        setTimeout(() => { setRevealedA([true, true, false]); soundFX.playCardFlip(); }, 1350),
        setTimeout(() => { setRevealedB([true, true, false]); soundFX.playCardFlip(); }, 1850),
        setTimeout(() => { setRevealedA([true, true, true]); soundFX.playCardFlip(); }, 2450),
        setTimeout(() => { setRevealedB([true, true, true]); soundFX.playCardFlip(); }, 2950),
        setTimeout(() => {
          setShowRankA(true);
          setShowRankB(true);
          soundFX.playChipClick();
        }, 3350),
      ];
      return () => timeouts.forEach(clearTimeout);
    }

    if (status === "RESULT_DECLARED") {
      setRevealedA([true, true, true]);
      setRevealedB([true, true, true]);
      setShowRankA(true);
      setShowRankB(true);
      setWinnerHighlight(round?.result || null);
      soundFX.playWinChime();
    }
  }, [status, round?.result, round?.roundId]);

  useEffect(() => {
    if (status === "DEALING") {
      const delays = [100, 260, 420, 580, 740, 900];
      const timers = delays.map((d) => setTimeout(() => soundFX.playCardFlip(), d));
      return () => timers.forEach(clearTimeout);
    }
  }, [status, round?.roundId]);

  const isGameRunning = Boolean(status && status !== "IDLE" && status !== "LOADING");
  const pct = maxTimer > 0 ? Math.min(100, Math.round((Math.max(0, timer) / maxTimer) * 100)) : 0;

  return (
    <div className="relative w-full bg-[#09111b] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/40 shadow-2xl flex flex-col justify-between select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dealToPlayerA {
          0% { transform: translate(60px, -80px) rotate(30deg) scale(0.2); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes dealToPlayerB {
          0% { transform: translate(60px, -110px) rotate(-30deg) scale(0.2); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        .deal-anim-a { animation: dealToPlayerA 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .deal-anim-b { animation: dealToPlayerB 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .glow-winner {
          box-shadow: 0 0 22px rgba(234, 179, 8, 0.45);
          border-color: rgba(234, 179, 8, 0.9) !important;
        }
      `}} />

      {/* Felt Backdrop (Zero External Image Dependencies) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#0f4c2f_0%,#09131e_75%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#072014] via-[#0b3320]/70 to-transparent border-t border-amber-500/20 rounded-t-[80px] sm:rounded-t-[140px] pointer-events-none" />

      {/* Header Overlay: Phase Status + Countdown Timer */}
      <div className="relative z-20 px-3 pt-3 sm:px-4 sm:pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {status === "IDLE" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-slate-700 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                  Ready to Start
                </span>
              </div>
            )}
            {status === "DEALING" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-lg animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  Splitting Cards...
                </span>
              </div>
            )}
            {status === "BETTING_OPEN" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                  Betting Open
                </span>
              </div>
            )}
            {status === "BETTING_CLOSED" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 border border-rose-500/40 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">
                  No More Bets • Revealing
                </span>
              </div>
            )}
            {status === "RESULT_DECLARED" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-400/60 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  {winnerHighlight ? `Player ${winnerHighlight} Wins!` : "Result Declared"}
                </span>
              </div>
            )}

            {seedHash && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[9px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-slate-800"
                title={`SHA-256 Hash: ${seedHash}`}
              >
                <ShieldCheck size={11} className="text-emerald-400" />#{seedHash.slice(0, 6)}
              </span>
            )}
          </div>

          {/* Countdown Badge */}
          {isGameRunning && (
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 shadow-xl transition-all ${
                status === "BETTING_OPEN"
                  ? timer <= 3
                    ? "border-rose-500 bg-rose-950/80 text-rose-300 scale-105 animate-pulse"
                    : "border-emerald-500 bg-slate-950/80 text-emerald-400"
                  : status === "DEALING"
                    ? "border-amber-500 bg-slate-950/80 text-amber-400"
                    : "border-slate-600 bg-slate-950/80 text-slate-300"
              }`}
            >
              <span className="font-mono font-black text-xs sm:text-sm">{timer}s</span>
            </div>
          )}
        </div>

        {/* Countdown Progress Bar */}
        {isGameRunning && (
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-linear ${
                status === "BETTING_OPEN"
                  ? timer <= 3
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                  : status === "BETTING_CLOSED"
                    ? "bg-amber-400"
                    : "bg-sky-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Card Spots */}
      <div className="relative z-20 px-2.5 py-3 sm:px-5 sm:py-5 flex flex-col items-center justify-center">
        {isGameRunning ? (
          <div className="flex flex-col space-y-2.5 sm:space-y-3.5 w-full max-w-[520px]">
            {/* Player A Spot */}
            <div
              className={`flex items-center justify-between bg-slate-950/80 backdrop-blur-md py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                winnerHighlight === "A" ? "glow-winner bg-amber-500/10" : "border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    winnerHighlight === "A"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  Player A
                </span>

                <div className="flex -space-x-2 sm:-space-x-3">
                  {[0, 1, 2].map((idx) => {
                    const card = cards?.A?.[idx] || null;
                    const dealDelay = `${0.08 + idx * 0.25}s`;
                    return (
                      <TeenPattiCard
                        key={`A-${round?.roundId || "0"}-${idx}`}
                        card={card}
                        faceUp={revealedA[idx]}
                        style={{ animationDelay: status === "DEALING" ? dealDelay : "0s" }}
                        className={status === "DEALING" ? "deal-anim-a" : ""}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="min-w-[68px] sm:min-w-[90px] text-right">
                {showRankA && handNames?.A && (
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg uppercase">
                    {handNames.A}
                  </span>
                )}
              </div>
            </div>

            {/* Player B Spot */}
            <div
              className={`flex items-center justify-between bg-slate-950/80 backdrop-blur-md py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                winnerHighlight === "B" ? "glow-winner bg-amber-500/10" : "border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    winnerHighlight === "B"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-rose-600/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  Player B
                </span>

                <div className="flex -space-x-2 sm:-space-x-3">
                  {[0, 1, 2].map((idx) => {
                    const card = cards?.B?.[idx] || null;
                    const dealDelay = `${0.18 + idx * 0.25}s`;
                    return (
                      <TeenPattiCard
                        key={`B-${round?.roundId || "0"}-${idx}`}
                        card={card}
                        faceUp={revealedB[idx]}
                        style={{ animationDelay: status === "DEALING" ? dealDelay : "0s" }}
                        className={status === "DEALING" ? "deal-anim-b" : ""}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="min-w-[68px] sm:min-w-[90px] text-right">
                {showRankB && handNames?.B && (
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg uppercase">
                    {handNames.B}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Click Ready to Start to begin Teen Patti 20-20
            </span>
          </div>
        )}
      </div>

      {/* Bottom History Bead Bar */}
      <div className="relative w-full bg-[#070b12] border-t border-slate-800/80 px-2.5 py-2 sm:px-3.5 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {history && history.length > 0 ? (
            history.slice(0, 16).map((h, i) => (
              <div
                key={i}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border font-mono font-black text-[10px] sm:text-xs flex items-center justify-center shrink-0 ${
                  h === "A"
                    ? "bg-blue-600/15 border-blue-500/35 text-blue-400"
                    : "bg-rose-600/15 border-rose-500/35 text-rose-400"
                }`}
              >
                {h}
              </div>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 font-semibold italic">No recent rounds yet</span>
          )}
        </div>

        <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-800/80">
          <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Round</span>
          <span className="text-[9px] sm:text-[10px] font-bold font-mono text-slate-300">
            {round?.roundId ? round.roundId.replace("TP-", "#").slice(-7) : "IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
