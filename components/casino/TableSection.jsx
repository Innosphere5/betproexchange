"use client";

const PlayingCard = ({ value, suit, hidden }) => {
  if (hidden) {
    return (
      <div className="w-[50px] h-[70px] bg-[repeating-linear-gradient(45deg,#1e3a8a,#1e3a8a_5px,#1e40af_5px,#1e40af_10px)] rounded shadow-xl border border-white/20"></div>
    );
  }
  
  const isRed = suit === '♥' || suit === '♦';
  return (
    <div className={`w-[50px] h-[70px] bg-white rounded shadow-xl border border-gray-300 flex flex-col items-center justify-center p-1 ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-2xl leading-none">{suit}</span>
    </div>
  );
};

export default function TableSection({ round }) {
  const isClosed = round?.status === 'BETTING_CLOSED' || round?.status === 'RESULT_DECLARED';
  const showResult = round?.status === 'RESULT_DECLARED';
  
  return (
    <div className="flex-1 bg-[#0f1b2b] relative overflow-hidden flex flex-col items-center justify-start py-2 lg:py-10 px-4 border-b border-[#2a3f54] shadow-inner">
      {/* Casino Table Felt Grid / Arch */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_#1a4a2b_0%,_#0a1a2a_100%)]"></div>
      
      {/* Decorative Table Lines */}
      <div className="absolute top-[-20%] w-[120%] h-[150%] border-4 border-yellow-600/10 rounded-[100%] pointer-events-none"></div>

      {/* Central Deck Area */}
      <div className="relative z-10 flex flex-col items-center mb-2 lg:mb-8 scale-[0.6] lg:scale-100">
         <div className="relative w-[60px] h-[85px] mb-2 scale-90 opacity-80">
            <div className="absolute top-0 left-0 w-full h-full bg-[#1e40af] rounded-sm border border-white/20 shadow-lg rotate-1"></div>
            <div className="absolute top-[-2px] left-[-1px] w-full h-full bg-[#1e40af] rounded-sm border border-white/20 shadow-lg rotate-[-1deg]"></div>
            <div className="absolute top-[-4px] left-[-2px] w-full h-full bg-[#1e40af] rounded-sm border border-white/20 shadow-lg"></div>
         </div>
      </div>
      
      {/* Content Area */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row justify-around items-center gap-4 lg:gap-4 max-w-4xl px-2">
         {/* Player A */}
         <div className="flex flex-col items-center gap-4 lg:gap-6 group">
            <div className="relative flex gap-1 lg:gap-2">
               <div className={`absolute -inset-4 bg-blue-500/10 rounded-full blur-2xl transition-opacity duration-1000 ${showResult && round?.result === 'A' ? 'opacity-100' : 'opacity-0'}`}></div>
               {(round?.cards?.A || [{},{},{}]).map((c, i) => (
                  <PlayingCard 
                    key={i}
                    suit={c.suit || "♠"} 
                    value={c.value || "A"} 
                    hidden={!showResult} 
                  />
               ))}
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className={`relative px-8 lg:px-10 py-2 rounded-sm bg-black/40 backdrop-blur-md text-white font-black text-[10px] lg:text-xs tracking-[0.2em] border-2 transition-all duration-700 ${showResult && round?.result === 'A' ? 'border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' : 'border-blue-500/30 text-white/60'}`}>
                  PLAYER A
                  {showResult && round?.result === 'A' && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] px-2 py-0.5 rounded-full font-black animate-bounce shadow-lg whitespace-nowrap">
                        WINNER
                     </div>
                  )}
               </div>
               {showResult && (
                  <span className="text-[9px] font-black text-blue-400/80 uppercase tracking-widest">{round?.handNames?.A}</span>
               )}
            </div>
         </div>

         {/* VS Indicator - Hidden on mobile if needed, or kept small */}
         <div className="hidden lg:flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
               <span className="text-[10px] font-black text-white/30 italic">VS</span>
            </div>
         </div>

         {/* Player B */}
         <div className="flex flex-col items-center gap-4 lg:gap-6 group">
            <div className="relative flex gap-1 lg:gap-2">
               <div className={`absolute -inset-4 bg-pink-500/10 rounded-full blur-2xl transition-opacity duration-1000 ${showResult && round?.result === 'B' ? 'opacity-100' : 'opacity-0'}`}></div>
               {(round?.cards?.B || [{},{},{}]).map((c, i) => (
                  <PlayingCard 
                    key={i}
                    suit={c.suit || "♦"} 
                    value={c.value || "K"} 
                    hidden={!showResult} 
                  />
               ))}
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className={`relative px-8 lg:px-10 py-2 rounded-sm bg-black/40 backdrop-blur-md text-white font-black text-[10px] lg:text-xs tracking-[0.2em] border-2 transition-all duration-700 ${showResult && round?.result === 'B' ? 'border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' : 'border-pink-500/30 text-white/60'}`}>
                  PLAYER B
                  {showResult && round?.result === 'B' && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] px-2 py-0.5 rounded-full font-black animate-bounce shadow-lg whitespace-nowrap">
                        WINNER
                     </div>
                  )}
               </div>
               {showResult && (
                  <span className="text-[9px] font-black text-pink-400/80 uppercase tracking-widest">{round?.handNames?.B}</span>
               )}
            </div>
         </div>
      </div>

      {/* Timer / Status Overlay - HIDDEN ON MOBILE (MOVE TO HEADER) */}
      {round?.status === 'BETTING_OPEN' && (
         <div className="mt-8 lg:mt-12 hidden lg:flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-yellow-500 transition-all duration-1000" style={{ strokeDasharray: '126', strokeDashoffset: `${126 * (1 - round.timer / 20)}` }} />
               </svg>
               <span className="text-xl font-black text-white font-mono">{round.timer}</span>
            </div>
            <span className="text-[10px] font-bold text-yellow-500 animate-pulse tracking-widest uppercase">Accepting Bets</span>
         </div>
      )}
      
      {round?.status === 'BETTING_CLOSED' && (
         <div className="mt-8 lg:mt-12 hidden lg:flex">
            <div className="bg-red-600/20 border border-red-500/50 px-6 py-2 rounded-full backdrop-blur-md">
               <span className="text-xs font-black text-red-500 tracking-[0.3em] uppercase">Betting Closed</span>
            </div>
         </div>
      )}
    </div>
  );
}
