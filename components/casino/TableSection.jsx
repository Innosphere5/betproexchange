"use client";

import React, { useEffect, useState } from "react";
import { soundFX } from "../../lib/casinoSoundFX";
import { Trophy, Clock } from "lucide-react";

const PlayingCard = ({ value, suit, hidden, isWinner, isDealing, target, index = 0 }) => {
  const isRed = suit === "♥" || suit === "♦";
  // Alternating split cadence straight out of the top-center card shoe: A1, B1, A2, B2, A3, B3
  const dealDelay = target === "A" ? `${0.1 + index * 0.45}s` : `${0.32 + index * 0.45}s`;

  if (hidden) {
    return (
      <div
        style={{ animationDelay: isDealing ? dealDelay : "0s" }}
        className={`w-[42px] h-[60px] sm:w-[64px] sm:h-[92px] bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-lg sm:rounded-xl shadow-[0_6px_14px_rgba(0,0,0,0.65)] border border-slate-400/40 flex items-center justify-center relative overflow-hidden ${
          isDealing ? (target === "A" ? "split-anim-a" : "split-anim-b") : ""
        }`}
      >
        <div className="absolute inset-1 border border-white/15 rounded-md bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22)_0%,transparent_70%)]" />
        <div className="w-5 h-7 sm:w-7 sm:h-9 rounded border border-white/20 flex items-center justify-center bg-blue-950/60">
          <span className="text-amber-400/80 font-black text-[10px] sm:text-xs">♠</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ animationDelay: `${index * 0.08}s` }}
      className={`flip-reveal w-[42px] h-[60px] sm:w-[64px] sm:h-[92px] bg-gradient-to-b from-white via-slate-50 to-slate-200 rounded-lg sm:rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.75)] border-2 flex flex-col items-center justify-between p-1 sm:p-1.5 relative overflow-hidden transition-all duration-300 ${
        isWinner
          ? "border-amber-400 ring-2 sm:ring-4 ring-amber-400/45 shadow-[0_0_22px_rgba(245,158,11,0.6)] scale-105"
          : "border-slate-300"
      } ${isRed ? "text-rose-600" : "text-slate-900"}`}
    >
      <div className="w-full flex justify-between items-center leading-none">
        <span className="text-[11px] sm:text-sm font-black font-mono tracking-tighter">{value}</span>
        <span className="text-[10px] sm:text-xs">{suit}</span>
      </div>

      <div className="text-base sm:text-2xl leading-none font-black my-auto">{suit}</div>

      <div className="w-full flex justify-between items-center leading-none transform rotate-180">
        <span className="text-[11px] sm:text-sm font-black font-mono tracking-tighter">{value}</span>
        <span className="text-[10px] sm:text-xs">{suit}</span>
      </div>
    </div>
  );
};

export default function TableSection({
  round,
  stakeByChoice = { A: 0, B: 0 },
  isBettingOpen,
}) {
  const status = round?.status || "IDLE";
  const isDealing = status === "DEALING";
  const isClosed = status === "BETTING_CLOSED";
  const showResult = status === "RESULT_DECLARED";
  const winner = round?.result;

  const [revealedA, setRevealedA] = useState([false, false, false]);
  const [revealedB, setRevealedB] = useState([false, false, false]);

  // 5-second progressive suspense reveal (card 1 -> card 2 -> pause -> decisive card 3)
  useEffect(() => {
    if (status === "IDLE" || status === "DEALING" || status === "BETTING_OPEN") {
      setRevealedA([false, false, false]);
      setRevealedB([false, false, false]);
      return;
    }

    if (status === "BETTING_CLOSED") {
      const remSec = Number(round?.timer ?? 5);
      const scale = remSec <= 2 ? 0.35 : 1;
      const t = (ms) => Math.round(ms * scale);

      const timers = [
        setTimeout(() => { setRevealedA([true, false, false]); soundFX.playCardFlip(); }, t(350)),
        setTimeout(() => { setRevealedB([true, false, false]); soundFX.playCardFlip(); }, t(1000)),
        setTimeout(() => { setRevealedA([true, true, false]); soundFX.playCardFlip(); }, t(1850)),
        setTimeout(() => { setRevealedB([true, true, false]); soundFX.playCardFlip(); }, t(2500)),
        setTimeout(() => { setRevealedA([true, true, true]); soundFX.playCardFlip(); }, t(3550)),
        setTimeout(() => { setRevealedB([true, true, true]); soundFX.playCardFlip(); }, t(4350)),
      ];
      return () => timers.forEach(clearTimeout);
    }

    if (status === "RESULT_DECLARED") {
      setRevealedA([true, true, true]);
      setRevealedB([true, true, true]);
    }
  }, [status, round?.roundId]);

  useEffect(() => {
    if (isDealing) {
      const delays = [120, 340, 560, 780, 1020, 1240];
      const timers = delays.map((d) => setTimeout(() => soundFX.playCardFlip(), d));
      return () => timers.forEach(clearTimeout);
    }
  }, [isDealing, round?.roundId]);

  const timer = Math.max(0, round?.timer || 0);
  const maxTimer = Math.max(1, round?.maxTimer || 15);
  const progressPct = Math.min(100, Math.round((timer / maxTimer) * 100));
  const isFinalSeconds = isBettingOpen && timer <= 5;
  const hasAnyBet = stakeByChoice.A > 0 || stakeByChoice.B > 0;

  const phaseMeta = {
    IDLE: { label: "Table Ready", badge: "bg-slate-800 text-slate-300 border-slate-700" },
    DEALING: { label: "Dealing Cards...", badge: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
    BETTING_OPEN: hasAnyBet && isFinalSeconds
      ? { label: "Bet Placed — Cards Reveal Soon", badge: "bg-amber-500/20 text-amber-300 border-amber-500/50" }
      : isFinalSeconds
        ? { label: "Closing Bets Soon!", badge: "bg-rose-500/20 text-rose-300 border-rose-500/60" }
        : { label: "Place Your Bet", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/45" },
    BETTING_CLOSED: { label: "Revealing Cards...", badge: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
    RESULT_DECLARED: {
      label: winner ? `Player ${winner} Wins!` : "Result Declared",
      badge: "bg-amber-500/25 text-amber-200 border-amber-400/70",
    },
  }[status] || { label: "Connecting...", badge: "bg-slate-800 text-slate-300 border-slate-700" };

  return (
    <div className="flex-1 bg-gradient-to-b from-[#081511] via-[#0c271b] to-[#08130e] relative overflow-hidden flex flex-col items-center justify-between py-2.5 sm:py-4 px-2.5 sm:px-5 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)] select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splitToPlayerA {
          0% { transform: translate(85px, -95px) rotate(18deg) scale(0.3); opacity: 0; }
          65% { opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes splitToPlayerB {
          0% { transform: translate(-85px, -95px) rotate(-18deg) scale(0.3); opacity: 0; }
          65% { opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes flipCardFace {
          0% { transform: rotateY(90deg) scale(0.88); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .split-anim-a { animation: splitToPlayerA 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
        .split-anim-b { animation: splitToPlayerB 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
        .flip-reveal { animation: flipCardFace 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
      `}} />

      {/* Authentic Casino Felt Backdrop */}
      <div className="absolute inset-0 opacity-45 bg-[radial-gradient(ellipse_at_center,#14532d_0%,#07111a_82%)] pointer-events-none" />
      <div className="absolute -top-[42%] w-[135%] h-[165%] border-2 border-amber-500/20 rounded-[100%] pointer-events-none" />

      {/* Top Phase & Countdown Bar */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-1.5 mb-2">
        <div className="flex items-center justify-between gap-2">
          <div className={`px-3 py-1 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${phaseMeta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isBettingOpen ? "bg-current animate-ping" : "bg-current"}`} />
            <span>{phaseMeta.label}</span>
          </div>

          {status !== "IDLE" && (
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border font-mono font-black text-xs sm:text-sm ${
                isFinalSeconds
                  ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse"
                  : isBettingOpen
                    ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                    : isClosed
                      ? "bg-amber-950/80 border-amber-500/60 text-amber-300"
                      : "bg-slate-900/90 border-slate-700 text-slate-300"
              }`}
            >
              <Clock size={12} />
              <span>{timer}s</span>
            </div>
          )}
        </div>

        {status !== "IDLE" && (
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-700 ease-linear ${
                isFinalSeconds
                  ? "bg-rose-500"
                  : isBettingOpen
                    ? "bg-emerald-500"
                    : isClosed
                      ? "bg-amber-400"
                      : "bg-sky-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Pure Visual Card Shoe / Deck Stack (no "Computer" text labels — cards animate directly from here to A & B) */}
      <div className="relative z-20 flex flex-col items-center my-1.5 sm:my-2.5">
        <div
          className={`relative w-11 h-14 sm:w-14 sm:h-[76px] transition-all duration-300 ${
            isDealing ? "scale-110 drop-shadow-[0_0_16px_rgba(245,158,11,0.55)]" : "opacity-90"
          }`}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-950 to-slate-900 border border-white/20 shadow-md rotate-6 translate-x-1" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-900 to-slate-950 border border-white/25 shadow-md -rotate-3 -translate-x-0.5" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 border-2 border-amber-400/65 shadow-xl flex flex-col items-center justify-center">
            <div className="w-6 h-8 sm:w-8 sm:h-11 rounded border border-amber-400/35 flex items-center justify-center bg-black/25">
              <span className="text-amber-400 text-xs sm:text-base font-black">♠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Player A vs Player B Card Felt Display */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:gap-6 w-full max-w-4xl my-auto items-stretch">
        {/* PLAYER A */}
        <div
          className={`relative flex flex-col items-center justify-between gap-2 sm:gap-3.5 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
            showResult && winner === "A"
              ? "bg-gradient-to-b from-blue-950/95 to-slate-900 border-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/35"
              : "bg-black/45 backdrop-blur-md border-blue-500/30"
          }`}
        >
          {stakeByChoice.A > 0 && (
            <div className="absolute -top-2.5 right-2 z-30 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-lg border border-white">
              Bet ₹{stakeByChoice.A.toLocaleString("en-IN")}
            </div>
          )}

          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-blue-300 flex items-center gap-1">
              {showResult && winner === "A" && <Trophy size={13} className="text-amber-400" />}
              Player A
            </span>
            <span className="text-[10px] font-mono font-black text-amber-400 bg-black/50 px-1.5 py-0.5 rounded">
              1.98x
            </span>
          </div>

          <div className="relative flex justify-center gap-1 sm:gap-2 my-0.5">
            {[0, 1, 2].map((i) => {
              const cardData = round?.cards?.A?.[i];
              const isRevealed = revealedA[i];
              return (
                <PlayingCard
                  key={`A-${round?.roundId || "0"}-${i}-${isRevealed ? "rev" : "hid"}`}
                  target="A"
                  index={i}
                  suit={cardData?.suit || "♠"}
                  value={cardData?.value || "A"}
                  hidden={!isRevealed}
                  isWinner={showResult && winner === "A"}
                  isDealing={isDealing}
                />
              );
            })}
          </div>

          <div className="min-h-[20px] flex items-center justify-center">
            {showResult && round?.handNames?.A && (
              <span className="text-[9px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider bg-black/75 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                {round.handNames.A}
              </span>
            )}
          </div>
        </div>

        {/* Center VS Badge */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#09131e] border-2 border-amber-500/50 items-center justify-center shadow-2xl pointer-events-none">
          <span className="font-black italic text-xs text-amber-400">VS</span>
        </div>

        {/* PLAYER B */}
        <div
          className={`relative flex flex-col items-center justify-between gap-2 sm:gap-3.5 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
            showResult && winner === "B"
              ? "bg-gradient-to-b from-rose-950/95 to-slate-900 border-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/35"
              : "bg-black/45 backdrop-blur-md border-rose-500/30"
          }`}
        >
          {stakeByChoice.B > 0 && (
            <div className="absolute -top-2.5 right-2 z-30 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-lg border border-white">
              Bet ₹{stakeByChoice.B.toLocaleString("en-IN")}
            </div>
          )}

          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-rose-300 flex items-center gap-1">
              {showResult && winner === "B" && <Trophy size={13} className="text-amber-400" />}
              Player B
            </span>
            <span className="text-[10px] font-mono font-black text-amber-400 bg-black/50 px-1.5 py-0.5 rounded">
              1.98x
            </span>
          </div>

          <div className="relative flex justify-center gap-1 sm:gap-2 my-0.5">
            {[0, 1, 2].map((i) => {
              const cardData = round?.cards?.B?.[i];
              const isRevealed = revealedB[i];
              return (
                <PlayingCard
                  key={`B-${round?.roundId || "0"}-${i}-${isRevealed ? "rev" : "hid"}`}
                  target="B"
                  index={i}
                  suit={cardData?.suit || "♥"}
                  value={cardData?.value || "A"}
                  hidden={!isRevealed}
                  isWinner={showResult && winner === "B"}
                  isDealing={isDealing}
                />
              );
            })}
          </div>

          <div className="min-h-[20px] flex items-center justify-center">
            {showResult && round?.handNames?.B && (
              <span className="text-[9px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider bg-black/75 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                {round.handNames.B}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
