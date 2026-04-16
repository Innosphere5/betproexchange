"use client";

import { useState } from "react";

export default function AdminBetLock() {
  const [casinoChecked, setCasinoChecked] = useState(true);
  const [cricketChecked, setCricketChecked] = useState(true);

  const casinoItems = [
    "TeenPatti Studio",
    "Royal Casino",
    "Betfair Games",
    "Star Casino",
    "Galaxy Casino",
    "Sports Book",
    "Super Nowa"
  ];

  const cricketItems = [
    "Figure",
    "Fancy",
    "Match Odds",
    "Even / Odd",
    "Toss",
    "Cup Winner"
  ];

  return (
    <div className="flex flex-col gap-4 max-w-full min-h-[calc(100vh-120px)] flex-grow">
      {/* Bet Lock Panel */}
      <div className="bg-white shadow-sm rounded-sm max-w-2xl border border-gray-300">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2.5 font-bold text-gray-800 text-[13px]">
          Allowed Market Types (Malik50ADN)
        </div>
        
        <div className="p-4 lg:p-6 w-full lg:w-1/2">
          {/* Casino Section */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={casinoChecked} 
                onChange={() => setCasinoChecked(!casinoChecked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-[#007bff]"
              />
              <span className="font-bold text-sm text-gray-800">All Casino</span>
            </label>
            
            <div className="flex flex-col gap-2 pl-6">
              {casinoItems.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-[#007bff]"
                  />
                  <span className="text-[13px] text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cricket Section */}
          <div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={cricketChecked} 
                onChange={() => setCricketChecked(!cricketChecked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-[#007bff]"
              />
              <span className="font-bold text-sm text-gray-800">Cricket</span>
            </label>
            
            <div className="flex flex-col gap-2 pl-6">
              {cricketItems.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-[#007bff]"
                  />
                  <span className="text-[13px] text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
