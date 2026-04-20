"use client";

import { useState } from "react";
import { ChevronDown, Monitor, Layout, ArrowRightLeft } from "lucide-react";

export default function MasterMarketSidebar({ onBetLockClick }) {
  const [activeTab, setActiveTab] = useState('tv');

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={onBetLockClick}
          className="flex-1 bg-[#f39c12] hover:bg-orange-600 text-white py-2 px-3 rounded-sm flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
        >
          Bet Lock <ChevronDown size={14} />
        </button>
        <button className="flex-1 bg-[#f39c12] hover:bg-orange-600 text-white py-2 px-3 rounded-sm flex items-center justify-center text-[13px] font-bold transition-colors">
          User Book
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-sm overflow-hidden border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('tv')}
            className={`flex-1 py-2 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'tv' ? 'bg-[#f39c12] text-white' : 'bg-[#f8f9fa] text-gray-700 hover:bg-[#f1f1f1]'}`}
          >
            <Monitor size={14} /> Tv
          </button>
          <button 
            onClick={() => setActiveTab('score')}
            className={`flex-1 py-2 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'score' ? 'bg-[#f39c12] text-white' : 'bg-[#f8f9fa] text-gray-700 hover:bg-[#f1f1f1]'}`}
          >
            <Layout size={14} /> Score Card
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-0 bg-[#0a111b] aspect-[16/9] flex items-center justify-center border-b border-gray-200 relative overflow-hidden">
          {activeTab === 'tv' ? (
             <div className="flex flex-col items-center justify-center text-gray-400">
                <div className="relative w-full h-full bg-[#0a111b] flex flex-col">
                    <div className="flex-1 p-4 relative">
                        <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
                            <div className="w-full h-[1px] bg-white/10" />
                            <div className="absolute w-20 h-20 rounded-full border border-white/10" />
                        </div>
                        <div className="flex justify-between items-start text-[11px] font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-700 rounded-sm flex items-center justify-center">H</div>
                                <span>Home Team</span>
                            </div>
                            <div className="text-gray-500">LIVE</div>
                            <div className="flex items-center gap-2">
                                <span>Away Team</span>
                                <div className="w-6 h-6 bg-gray-200 text-gray-800 rounded-sm flex items-center justify-center">A</div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          ) : (
            <div className="text-white text-sm">Score Card View</div>
          )}
        </div>
      </div>

      {/* Bets Tables */}
      <div className="flex flex-col gap-3">
        {/* Open Bets */}
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] px-3 py-1.5 border-b border-gray-200 flex justify-between items-center">
            <span className="text-[13px] font-bold text-gray-800">Open Bets (0)</span>
          </div>
          <div className="grid grid-cols-[1.5fr,repeat(4,1fr)] bg-[#f8f9fa] border-b border-gray-200">
            {['Runner', 'Price', 'Size', 'Bettor', 'Broker'].map(h => (
              <div key={h} className="px-2 py-1 text-[11px] font-bold text-gray-600 first:pl-3 last:pr-3 text-center first:text-left">
                {h}
              </div>
            ))}
          </div>
          <div className="min-h-[40px] flex items-center justify-center text-[12px] text-gray-400">
            No open bets
          </div>
        </div>

        {/* Matched Bets */}
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] px-3 py-1.5 border-b border-gray-200 flex justify-between items-center">
            <span className="text-[13px] font-bold text-gray-800">Matched Bets (0)</span>
            <button className="bg-[#f39c12] text-white px-2 py-0.5 rounded-sm text-[10px] font-bold">Full Bet List</button>
          </div>
          <div className="grid grid-cols-[1.5fr,repeat(4,1fr)] bg-[#f8f9fa] border-b border-gray-200">
            {['Runner', 'Price', 'Size', 'Bettor', 'Broker'].map(h => (
              <div key={h} className="px-2 py-1 text-[11px] font-bold text-gray-600 first:pl-3 last:pr-3 text-center first:text-left">
                {h}
              </div>
            ))}
          </div>
          <div className="min-h-[40px] flex items-center justify-center text-[12px] text-gray-400">
            No matched bets
          </div>
        </div>
      </div>
    </div>
  );
}
