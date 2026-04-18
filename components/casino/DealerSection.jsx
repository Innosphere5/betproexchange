"use client";

import { Play } from "lucide-react";

export default function DealerSection({ round }) {
  return (
    <div className="relative h-[160px] lg:h-[240px] bg-[#0a1017] flex-shrink-0 border-b border-white/5 overflow-hidden group flex items-center justify-center">
      {/* High-End Luxury Casino Table Background - HIDDEN ON MOBILE */}
      <img 
         src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=1200" 
         alt="Luxury Casino" 
         className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-75 transition-transform duration-[15s] group-hover:scale-110 hidden lg:block"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1621] via-transparent to-black/60 backdrop-blur-[0.5px] hidden lg:block"></div>
      
      {/* Live Badge */}
      <div className="absolute top-4 left-4 z-20 bg-red-600 px-3 py-1 rounded-sm shadow-[0_0_15px_rgba(220,38,38,0.7)] flex items-center gap-2 border border-red-400">
         <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Casino</span>
      </div>
      
      <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-yellow-500 text-[10px] font-mono font-bold tracking-[0.1em]">
         ID: {round?.roundId || 'FETCHING...'}
      </div>

      <div className="z-10 flex flex-col items-center">
         <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-2xl mb-4 transition-all hover:scale-105 hover:bg-white/10 ring-8 ring-black/20">
            <Play fill="white" size={24} className="ml-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
         </div>
         <div className="text-center px-4 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
            <h2 className="text-xl font-black italic tracking-[0.25em] text-white flex items-center gap-3">
               <span className="text-yellow-500">SOLITAIRE</span>
               <span className="text-sm font-light tracking-widest text-white/60">A vs B</span>
            </h2>
         </div>
      </div>
    </div>
  );
}
