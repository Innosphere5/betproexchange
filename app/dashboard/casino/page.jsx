"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";

export default function CasinoPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 bg-[#0f172a] text-white">
      {/* Top Banner */}
      <div className="w-full max-w-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-xl p-4 mb-8 shadow-xl text-center">
        <div className="flex items-center justify-center gap-2 font-black text-sm md:text-base tracking-wide uppercase">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Notice: Casino Games Are Currently Under Development</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-[#1e293b]/90 border border-slate-700/80 rounded-2xl p-6 md:p-10 text-center shadow-2xl backdrop-blur">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
          🎰
        </div>

        <span className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
          Maintenance & Upgrade
        </span>

        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3">
          Live Casino Under Development
        </h1>

        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
          Our Live Casino tables are temporarily closed while our engineering team conducts scheduled upgrades to bring you ultra-low latency streaming, new live dealer tables, and an enhanced betting engine.
        </p>

        {/* Highlight Feature Box */}
        <div className="bg-[#0f172a]/80 border border-emerald-500/30 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold text-sm">Cricket Exchange is Fully Active</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                All live international & domestic cricket fixtures, Bookmaker odds, Fancy markets, and live scorecards are running at 100% capacity.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00c766] hover:bg-[#00b050] text-black font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Live Cricket Exchange
          </Link>
        </div>
      </div>
    </div>
  );
}
