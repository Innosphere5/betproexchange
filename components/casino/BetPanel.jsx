"use client";

import { useState } from "react";
import { soundFX } from "../../lib/casinoSoundFX";

export default function BetPanel({ 
   selectedChoice, 
   amount, 
   setAmount, 
   handleSubmitBet, 
   history, 
   isBettingOpen,
   cancelSelection,
   isMobilePopup = false,
   selectedChip = "100",
   setSelectedChip
}) {
  const [use1Click, setUse1Click] = useState(false);

  // Casino chip denominations
  const chips = [
     { val: 10, label: "$10", bg: "from-blue-600 to-blue-800 border-blue-400" },
     { val: 50, label: "$50", bg: "from-purple-600 to-purple-800 border-purple-400" },
     { val: 100, label: "$100", bg: "from-emerald-600 to-emerald-800 border-emerald-400" },
     { val: 500, label: "$500", bg: "from-slate-800 to-slate-950 border-slate-400" },
     { val: 1000, label: "$1k", bg: "from-amber-500 to-amber-700 border-amber-300" },
     { val: 5000, label: "$5k", bg: "from-rose-600 to-rose-900 border-rose-400" },
  ];

  const handleChipSelect = (chipVal) => {
     soundFX.playChipClick();
     setSelectedChip(chipVal.toString());
     setAmount(chipVal.toString());
  };

  const handleAddAmount = (addVal) => {
     soundFX.playChipClick();
     const current = parseFloat(amount) || 0;
     setAmount((current + addVal).toString());
  };

  const handleDoubleAmount = () => {
     soundFX.playChipClick();
     const current = parseFloat(amount) || 0;
     setAmount((current * 2).toString());
  };

  const handleClear = () => {
     soundFX.playChipClick();
     setAmount("");
  };

  const oddsMultiplier = selectedChoice === 'A' ? 3.50 : selectedChoice === 'B' ? 2.50 : 1.0;
  const numericAmount = parseFloat(amount) || 0;
  const potentialPayout = (numericAmount * oddsMultiplier).toFixed(2);
  const potentialProfit = (numericAmount * (oddsMultiplier - 1)).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-[#080d15] border-l border-slate-800 select-none">
      
      {/* Settings & 1-Click Header */}
      <div className="flex justify-between items-center bg-[#0d1522] p-3.5 border-b border-slate-800 shadow-md">
         <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            Betting Controls
         </span>
         
         <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">1-Click Bet</span>
            <button 
               onClick={() => { soundFX.playChipClick(); setUse1Click(!use1Click); }}
               className={`w-8 h-4.5 rounded-full relative transition-all duration-300 ${use1Click ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}
            >
               <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${use1Click ? 'left-[16px]' : 'left-[2px]'}`}></div>
            </button>
         </div>
      </div>

      {/* 3D Casino Chips Rack */}
      <div className="p-3 bg-[#0a111a] border-b border-slate-800">
         <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Select Casino Chip</span>
         <div className="grid grid-cols-6 gap-1.5">
            {chips.map(chip => (
               <button 
                  key={chip.val}
                  onClick={() => handleChipSelect(chip.val)}
                  className={`relative aspect-square rounded-full bg-gradient-to-b ${chip.bg} border-2 flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${
                     selectedChip === chip.val.toString() ? 'ring-4 ring-amber-400 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'opacity-85 hover:opacity-100'
                  }`}
               >
                  <div className="absolute inset-0.5 border border-dashed border-white/40 rounded-full pointer-events-none"></div>
                  <span className="text-[9px] font-black text-white font-mono drop-shadow">{chip.label}</span>
               </button>
            ))}
         </div>
      </div>

      {/* Active Bet Slip */}
      <div className={`${isMobilePopup ? 'p-0' : 'p-3.5'} flex-1`}>
         {selectedChoice ? (
            <div className={`bg-[#0e1826] rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300`}>
               
               {/* Selection Title Bar */}
               <div className={`p-3.5 font-black text-xs tracking-[0.25em] uppercase flex justify-between items-center text-white border-b ${
                  selectedChoice === 'A' 
                    ? 'bg-gradient-to-r from-blue-900/60 to-slate-900 border-blue-500/40 text-blue-300' 
                    : 'bg-gradient-to-r from-rose-900/60 to-slate-900 border-rose-500/40 text-rose-300'
               }`}>
                  <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${selectedChoice === 'A' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                     <span>{selectedChoice === 'A' ? 'Player A' : 'Player B'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-amber-400 font-mono text-sm drop-shadow">{oddsMultiplier.toFixed(2)}x</span>
                     {isMobilePopup && (
                        <button onClick={cancelSelection} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                           ✕
                        </button>
                     )}
                  </div>
               </div>
               
               <div className="p-4 flex flex-col gap-3.5">
                  <div>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stake Amount</label>
                        <button onClick={handleClear} className="text-[9px] font-bold text-rose-400 uppercase hover:underline">Clear</button>
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">$</span>
                        <input 
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-black/50 border border-slate-700 rounded-xl py-2.5 pl-8 pr-4 text-amber-400 font-black font-mono text-lg focus:outline-none focus:border-amber-400 transition-colors"
                           placeholder="0.00"
                        />
                     </div>
                  </div>
                  
                  {/* Quick Stake Modifiers */}
                  <div className="grid grid-cols-4 gap-1.5">
                     <button onClick={() => handleAddAmount(100)} className="bg-slate-800/80 text-[9px] font-black text-slate-200 py-2 rounded-lg border border-slate-700 hover:bg-slate-700">+100</button>
                     <button onClick={() => handleAddAmount(500)} className="bg-slate-800/80 text-[9px] font-black text-slate-200 py-2 rounded-lg border border-slate-700 hover:bg-slate-700">+500</button>
                     <button onClick={() => handleAddAmount(1000)} className="bg-slate-800/80 text-[9px] font-black text-slate-200 py-2 rounded-lg border border-slate-700 hover:bg-slate-700">+1K</button>
                     <button onClick={handleDoubleAmount} className="bg-amber-500/20 text-[9px] font-black text-amber-400 py-2 rounded-lg border border-amber-500/40 hover:bg-amber-500/30">2X</button>
                  </div>

                  {/* Payout Calculation Card */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Est. Profit</span>
                        <span className="font-mono font-black text-emerald-400">+${potentialProfit}</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Payout</span>
                        <span className="font-mono font-black text-amber-400">${potentialPayout}</span>
                     </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                     <button onClick={cancelSelection} className="flex-1 bg-slate-800/60 border border-slate-700 text-slate-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800">Cancel</button>
                     <button 
                        onClick={handleSubmitBet} 
                        disabled={!isBettingOpen}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl
                          ${isBettingOpen ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 active:scale-95 cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                     >
                        Confirm Bet
                     </button>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-[180px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30 text-center p-4">
               <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center mb-3 text-slate-500">
                  ♦
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  Select Player A or B<br/>to place your bet
               </p>
            </div>
         )}
      </div>

      {/* History Ribbon */}
      <div className="mt-auto bg-[#070c14] border-t border-slate-800">
         <div className="px-3.5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex justify-between items-center">
            <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Recent Results</span>
            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest font-mono">Live Sync</span>
         </div>
         <div className="p-3 grid grid-cols-6 gap-2">
            {history.length > 0 ? history.map((res, i) => (
                <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md transition-all duration-300
                   ${res === 'A' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : 
                     res === 'B' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                   {res || '?'}
                </div>
            )) : <div className="col-span-6 text-center text-[10px] font-medium text-slate-600 py-6 italic">Awaiting rounds...</div>}
         </div>
      </div>
    </div>
  );
}
