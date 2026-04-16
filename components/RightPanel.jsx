"use client";

import { Tv, ChevronDown } from "lucide-react";
import BetSlip from "./BetSlip";

export default function RightPanel({ selection, clearSelection, type }) {
  return (
    <div className="flex flex-col gap-3 p-2 font-sans overflow-y-auto no-scrollbar pb-10">
      {/* TV / Match Video Section */}
      {!selection && (
        <div className="bg-[#243f55] rounded-sm overflow-hidden flex flex-col shadow-sm">
          <div className="bg-[#00c766] h-10 flex items-center justify-center text-white font-black uppercase text-[13px] tracking-wider">
            Tv
          </div>
          <div className="aspect-video bg-black flex items-center justify-center text-white font-serif text-2xl italic">
            Match not live
          </div>
        </div>
      )}

      {/* Bet Slip Integration */}
      {selection && (
        <BetSlip 
          selection={selection} 
          onClose={clearSelection} 
          type={type} 
        />
      )}

      {/* Open Bets Section */}
      <CollapsibleSection title="Open Bets (0)">
         <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-bold text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-1">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-16 text-right">Size</div>
         </div>
         <div className="h-6 bg-white"></div>
      </CollapsibleSection>

      {/* Matched Bets Section */}
      <CollapsibleSection title="Matched Bets (0)">
         <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-bold text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-1">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-16 text-right">Size</div>
         </div>
         <div className="h-6 bg-white"></div>
      </CollapsibleSection>

      {/* Related Events Section */}
      <CollapsibleSection title="Related Events">
         <div className="bg-white p-3 flex flex-col gap-3">
            <EventRow time="Today 19:30" teams="Sunrisers Hyderabad v Rajasthan Royals" />
            <EventRow time="Today 19:30" teams="Peshawar Zalmi v Multan Sultans" />
            <EventRow time="Tomorrow 19:30" teams="Chennai Super Kings v Kolkata Knight Riders" />
         </div>
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({ title, children }) {
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <div className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between cursor-pointer">
        <span className="text-[13px] font-bold uppercase tracking-wide">{title}</span>
        <ChevronDown size={14} className="opacity-70" />
      </div>
      {children}
    </div>
  );
}

function EventRow({ time, teams }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0 group cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded-sm transition-colors">
      <div className="text-[11px] font-bold text-gray-500 w-16 leading-tight flex flex-col items-center">
        <span>{time.split(' ')[0]}</span>
        <span>{time.split(' ')[1]}</span>
      </div>
      <div className="flex-1 text-[13px] font-bold text-[#243f55] group-hover:text-blue-700 leading-tight">
        {teams}
      </div>
    </div>
  );
}
