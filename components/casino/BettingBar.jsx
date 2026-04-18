"use client";

export default function BettingBar({ handleBetClick, lock }) {
  return (
    <div className="bg-[#0b141d] h-[120px] lg:h-[100px] flex items-center justify-between px-4 lg:px-6 shrink-0 relative border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
       {/* Layout for basic Back / Lay grid */}
       <div className="flex gap-3 lg:gap-4 w-full max-w-3xl mx-auto h-20 lg:h-16">
          <button 
             onClick={() => handleBetClick('A')}
             disabled={lock}
             className={`flex-1 rounded-sm flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group/btn
               ${lock ? 'bg-blue-900/10 text-blue-500/20 grayscale' : 'bg-[#1a3a5a] text-blue-400 hover:bg-[#254b73] active:scale-[0.98] shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/30'}`}
          >
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
             <span className="font-black text-xs tracking-[0.3em] uppercase mb-0.5">Player A</span>
             <span className="text-xl font-black font-mono">3.50x</span>
             {!lock && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
          </button>

          <button 
             onClick={() => handleBetClick('B')}
             disabled={lock}
             className={`flex-1 rounded-sm flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group/btn
               ${lock ? 'bg-pink-900/10 text-pink-500/20 grayscale' : 'bg-[#3b1a2e] text-pink-400 hover:bg-[#522541] active:scale-[0.98] shadow-[0_0_20px_rgba(236,72,153,0.1)] border border-pink-500/30'}`}
          >
             <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
             <span className="font-black text-xs tracking-[0.3em] uppercase mb-0.5">Player B</span>
             <span className="text-xl font-black font-mono">2.50x</span>
             {!lock && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>}
          </button>
       </div>
    </div>
  );
}
