"use client";

import { useState } from "react";

export default function BetPanel({ 
   selectedChoice, 
   amount, 
   setAmount, 
   handleSubmitBet, 
   history, 
   isBettingOpen,
   cancelSelection,
   isMobilePopup = false
}) {
  const [use1Click, setUse1Click] = useState(false);

  // Casino stakes pill buttons
  const stakes = [100, 500, 1000, 5000, 10000];

  return (
    <div className="flex flex-col h-full bg-[#0d1621] border-l border-white/5">
      {/* 1-Click Bet Toggle Header */}
      <div className="flex justify-between items-center bg-[#0d1621] p-4 border-b border-white/5 shadow-md">
         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Settings</span>
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-white/40 uppercase">1-Click</span>
            <button 
               onClick={() => setUse1Click(!use1Click)}
               className={`w-9 h-4.5 rounded-full relative transition-all duration-300 ${use1Click ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
            >
               <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${use1Click ? 'left-[20px]' : 'left-[2px]'}`}></div>
            </button>
         </div>
      </div>

      {/* active slip if choice made */}
      <div className={`${isMobilePopup ? 'p-0' : 'p-4'} flex-1`}>
         {selectedChoice ? (
            <div className={`bg-[#1a2c3f] rounded-sm overflow-hidden border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 ${isMobilePopup ? 'rounded-b-xl' : 'rounded-sm'}`}>
               <div className={`p-4 font-black text-[11px] tracking-[0.3em] uppercase flex justify-between items-center text-white
                ${selectedChoice === 'A' ? 'bg-blue-600/20 text-blue-400 border-b border-blue-500/30' : 'bg-pink-600/20 text-pink-400 border-b border-pink-500/30'}`}>
                  <span>{selectedChoice === 'A' ? 'Player A' : 'Player B'}</span>
                  <div className="flex items-center gap-4">
                     <span className="text-white font-mono text-sm">{selectedChoice === 'A' ? '3.50' : '2.50'}x</span>
                     {isMobilePopup && (
                        <button onClick={cancelSelection} className="ml-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                     )}
                  </div>
               </div>
               
               <div className="p-5 flex flex-col gap-4">
                  <div>
                     <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Stake Amount</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</span>
                        <input 
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-black/40 border border-white/10 rounded-sm py-3 pl-8 pr-4 text-white font-black font-mono text-lg focus:outline-none focus:border-yellow-500/50 transition-colors"
                           placeholder="0.00"
                        />
                     </div>
                  </div>
                  
                  {/* Quick Stake grid */}
                  <div className="grid grid-cols-2 gap-2">
                     {stakes.map(val => (
                        <button 
                           key={val} 
                           onClick={() => setAmount(val.toString())} 
                           className="bg-white/5 text-[10px] font-black tracking-widest text-white/60 py-2.5 rounded-sm border border-white/5 hover:bg-white/10 hover:text-white transition-all uppercase"
                        >
                           +{val}
                        </button>
                     ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                     <button onClick={cancelSelection} className="flex-1 bg-transparent border border-white/10 text-white/40 py-3 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/5 hover:text-white">Cancel</button>
                     <button 
                        onClick={handleSubmitBet} 
                        disabled={!isBettingOpen}
                        className={`flex-1 py-3 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg
                          ${isBettingOpen ? 'bg-yellow-600 text-black hover:bg-yellow-500 active:scale-95' : 'bg-gray-800 text-white/20 cursor-not-allowed'}`}
                     >
                        Confirm
                     </button>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-sm bg-white/[0.02] text-center p-6">
               <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mb-4 opacity-20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
               </div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                  Select Player A or B<br/>to place a bet
               </p>
            </div>
         )}
      </div>

      {/* History Area */}
      <div className="mt-auto bg-black/20">
         <div className="px-4 py-3 bg-white/[0.03] border-y border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase italic">Recent Results</span>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Last 18 Rounds</span>
         </div>
         <div className="p-4 grid grid-cols-6 gap-2">
            {history.length > 0 ? history.map((res, i) => (
                <div key={i} className={`w-9 h-9 rounded-sm flex items-center justify-center font-black text-[11px] shadow-lg transition-all duration-500 animate-in zoom-in
                   ${res === 'A' ? 'bg-blue-600/40 text-blue-100 border border-blue-500/50' : 
                     res === 'B' ? 'bg-pink-600/40 text-pink-100 border border-pink-500/50' : 'bg-white/5 border border-white/10'}`}>
                   {res || '?'}
                </div>
            )) : <div className="col-span-6 text-center text-[10px] font-medium text-white/10 py-8 italic tracking-widest">Awaiting rounds...</div>}
         </div>
      </div>
    </div>
  );
}
