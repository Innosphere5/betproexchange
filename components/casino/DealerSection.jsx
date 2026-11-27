"use client";

import { Volume2, VolumeX, ShieldCheck, HelpCircle, LogOut } from "lucide-react";

export default function DealerSection({
  round,
  isMuted,
  setIsMuted,
  isConnected,
  isReady,
  onLeave,
  onOpenRules,
}) {
  return (
    <div className="relative h-14 sm:h-16 shrink-0 border-b border-amber-500/35 px-3 sm:px-4 flex items-center justify-between gap-2 overflow-hidden select-none bg-[#07110d]">
      {/* Premium Casino Aesthetic Graphic Header Background */}
      <img
        src="/images/casino_gameplay.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-55 scale-105 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050a11]/90 via-[#081a13]/65 to-[#050a11]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none" />

      {/* Left: Connection Dot + Casino Gameplay Title + Round ID + Fair */}
      <div className="relative z-10 flex items-center gap-2 min-w-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${
            isConnected ? "bg-emerald-400 text-emerald-400 animate-pulse" : "bg-amber-400 text-amber-400"
          }`}
        />
        <span className="text-[11px] sm:text-sm font-black italic tracking-wider text-white uppercase truncate drop-shadow">
          Casino <span className="text-amber-400">Gameplay</span>
        </span>
        {round?.roundId && (
          <span className="bg-black/65 backdrop-blur-md border border-amber-400/35 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0">
            #{round.roundId.replace("CAS-", "").slice(-5)}
          </span>
        )}
        <span
          className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-black/55 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded-md shrink-0"
          title={round?.seedHash ? `SHA-256 Seed: ${round.seedHash}` : "Provably fair shuffle"}
        >
          <ShieldCheck size={11} />
          Fair
        </span>
      </div>

      {/* Right: Rules, Audio, Leave */}
      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
        {onOpenRules && (
          <button
            type="button"
            onClick={onOpenRules}
            className="h-7 px-2 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-slate-200 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
            title="How to Play"
          >
            <HelpCircle size={13} className="text-amber-400" />
            <span className="hidden xs:inline">Rules</span>
          </button>
        )}

        {setIsMuted && (
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-7 h-7 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-200 hover:text-white cursor-pointer active:scale-95"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? (
              <VolumeX size={14} className="text-rose-400" />
            ) : (
              <Volume2 size={14} className="text-emerald-400" />
            )}
          </button>
        )}

        {isReady && onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="h-7 px-2.5 rounded-lg bg-rose-950/75 hover:bg-rose-900/90 backdrop-blur-md border border-rose-500/50 text-rose-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <LogOut size={12} />
            <span>Leave</span>
          </button>
        )}
      </div>
    </div>
  );
}
