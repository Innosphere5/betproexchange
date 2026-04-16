"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function BetSlip({ selection, onClose, type = "back" }) {
  const [odds, setOdds] = useState(selection?.price || 0);
  const [stake, setStake] = useState("");
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    if (selection) {
      setOdds(selection.price);
    }
  }, [selection]);

  const calculateProfit = (val) => {
    const s = parseFloat(val) || 0;
    const o = parseFloat(odds) || 0;
    if (type === "back") {
      setProfit(Math.round(s * (o - 1)));
    } else {
      setProfit(Math.round(s)); // Simplified for Lay
    }
  };

  const handleStakeChange = (val) => {
    setStake(val);
    calculateProfit(val);
  };

  const addStake = (val) => {
    const current = parseFloat(stake) || 0;
    const next = current + val;
    setStake(next.toString());
    calculateProfit(next);
  };

  if (!selection) return null;

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-300 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between">
        <span className="text-[14px] font-bold uppercase tracking-wide">Bet Slip</span>
        <button className="text-[11px] font-bold underline hover:text-gray-300">Edit Bet Sizes</button>
      </div>

      {/* Main Form */}
      <div className={`p-2 ${type === 'back' ? 'bg-[#dcecfd]' : 'bg-[#fbe2e8]'}`}>
        <div className="flex items-center text-[11px] font-bold text-gray-600 mb-1 px-1">
          <div className="flex-1">Bet for</div>
          <div className="w-16 text-center">Odds</div>
          <div className="w-20 text-center">Stake</div>
          <div className="w-16 text-right">Profit</div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 font-bold text-[13px] text-[#1c3246] truncate">{selection.runner}</div>
          <div className="w-16">
            <input 
              type="number" 
              value={odds} 
              onChange={(e) => setOdds(e.target.value)}
              className="w-full h-8 text-center border border-gray-300 rounded-sm text-[13px] font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-20">
            <input 
              type="number" 
              value={stake}
              placeholder="0"
              onChange={(e) => handleStakeChange(e.target.value)}
              className="w-full h-8 text-center border border-gray-300 rounded-sm text-[13px] font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-16 text-right font-black text-[13px] text-[#1c3246]">
            {type === 'back' ? profit : `0 / -${profit}`}
          </div>
        </div>

        {/* Quick Stakes */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[2000, 5000, 10000, 25000].map((val) => (
            <button 
              key={val}
              onClick={() => handleStakeChange(val.toString())}
              className="bg-gray-300 hover:bg-gray-400 py-2.5 text-[13px] font-bold text-[#1c3246] rounded-sm transition-colors"
            >
              {val.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Increment Stakes */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[1000, 5000, 10000, 25000].map((val) => (
            <button 
              key={val}
              onClick={() => addStake(val)}
              className="bg-gray-200 hover:bg-gray-300 py-1.5 text-[11px] font-bold text-[#1c3246] rounded-sm transition-colors"
            >
              + {val.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#f05b64] hover:bg-[#d44d55] text-white font-black py-2 rounded-sm text-[13px] shadow-sm uppercase"
          >
            Close
          </button>
          <button 
            onClick={() => {setStake(""); setProfit(0);}}
            className="flex-1 bg-[#ffb80c] hover:bg-[#e6a60b] text-[#1c3246] font-black py-2 rounded-sm text-[13px] shadow-sm uppercase"
          >
            Clear
          </button>
          <button 
            className="flex-1 bg-[#00c766] hover:bg-[#00a857] text-white font-black py-2 rounded-sm text-[13px] shadow-sm uppercase"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
