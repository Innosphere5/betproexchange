"use client";

import { Play, Volume2, VolumeX, ShieldCheck } from "lucide-react";

export default function DealerSection({ round, isMuted, setIsMuted }) {
  return (
    <div className="relative h-[150px] lg:h-[220px] bg-[#070b12] flex-shrink-0 border-b border-slate-800 overflow-hidden group flex items-center justify-center select-none">
      {/* High-End Luxury Casino Table Background - Desktop & Mobile */}
      <div 
         className="absolute inset-0 bg-cover bg-center brightness-75 transition-transform duration-[12s] group-hover:scale-105"
         style={{
            backgroundImage: `linear-gradient(to bottom, rgba(7,11,18,0.5), rgba(7,11,18,0.92)), url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=1200')`
         }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Live Broadcast Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
         <div className="bg-rose-600/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-[0_0_12px_rgba(225,29,72,0.6)] flex items-center gap-1.5 border border-rose-400/40">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Live Casino HD</span>
         </div>
         <div className="hidden sm:flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-[9px] font-bold text-slate-300">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Verified Provably Fair</span>
         </div>
      </div>
      
      {/* Round ID Badge & Card Shoe (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
         {setIsMuted && (
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
             title={isMuted ? "Unmute" : "Mute"}
           >
             {isMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-emerald-400" />}
           </button>
         )}

         <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-md border border-amber-500/30 text-amber-400 text-[10px] font-mono font-black tracking-widest shadow-md">
            ID: {round?.roundId || 'CONNECTING...'}
         </div>
      </div>

      {/* Center Table Branding & Play Emblem */}
      <div className="z-10 flex flex-col items-center">
         <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-2 transition-all hover:scale-105 group-hover:border-amber-400 ring-4 ring-black/40">
            <Play fill="#f59e0b" size={22} className="ml-1 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
         </div>
         
         <div className="text-center px-4 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <h2 className="text-sm lg:text-base font-black italic tracking-[0.2em] text-white flex items-center gap-2">
               <span className="text-amber-400 drop-shadow">SOLITAIRE</span>
               <span className="text-xs font-bold tracking-widest text-slate-400">7 UP DOWN</span>
            </h2>
         </div>
      </div>

      {/* Decorative Golden Arch Bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>
    </div>
  );
}
