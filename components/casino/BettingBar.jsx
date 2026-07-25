"use client";

export default function BettingBar({ handleBetClick, lock }) {
  return (
    <div className="bg-[#0b121c] h-[110px] lg:h-[95px] flex items-center justify-between px-3 lg:px-6 shrink-0 relative border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] select-none">
       <div className="flex gap-3 lg:gap-5 w-full max-w-4xl mx-auto h-20 lg:h-16">
          
          {/* PLAYER A BET SECTOR */}
          <button 
             onClick={() => handleBetClick('A')}
             disabled={lock}
             className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group/btn border-2
               ${lock 
                 ? 'bg-blue-950/20 border-blue-900/30 text-blue-500/30 grayscale cursor-not-allowed' 
                 : 'bg-gradient-to-r from-[#13273e] via-[#1a3554] to-[#13273e] border-blue-500/40 text-blue-300 hover:border-blue-400 active:scale-[0.98] shadow-[0_0_25px_rgba(59,130,246,0.15)] cursor-pointer'}`}
          >
             <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
             
             <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="font-black text-xs lg:text-sm tracking-[0.25em] uppercase text-white">Player A</span>
             </div>

             <div className="flex items-center gap-1.5">
                <span className="text-xs text-blue-400 font-bold uppercase">Payout</span>
                <span className="text-xl lg:text-2xl font-black font-mono text-amber-400 drop-shadow">3.50x</span>
             </div>

             {!lock && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-blue-500 shadow-[0_0_12px_#3b82f6]"></div>}
          </button>

          {/* PLAYER B BET SECTOR */}
          <button 
             onClick={() => handleBetClick('B')}
             disabled={lock}
             className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group/btn border-2
               ${lock 
                 ? 'bg-rose-950/20 border-rose-900/30 text-rose-500/30 grayscale cursor-not-allowed' 
                 : 'bg-gradient-to-r from-[#381628] via-[#4d1f38] to-[#381628] border-rose-500/40 text-rose-300 hover:border-rose-400 active:scale-[0.98] shadow-[0_0_25px_rgba(244,63,94,0.15)] cursor-pointer'}`}
          >
             <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
             
             <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                <span className="font-black text-xs lg:text-sm tracking-[0.25em] uppercase text-white">Player B</span>
             </div>

             <div className="flex items-center gap-1.5">
                <span className="text-xs text-rose-400 font-bold uppercase">Payout</span>
                <span className="text-xl lg:text-2xl font-black font-mono text-amber-400 drop-shadow">2.50x</span>
             </div>

             {!lock && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-rose-500 shadow-[0_0_12px_#f43f5e]"></div>}
          </button>

       </div>
    </div>
  );
}
