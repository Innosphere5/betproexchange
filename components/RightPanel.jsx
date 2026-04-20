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

      {/* Bet Slip Integration - Desktop Only in Side Panel */}
      {selection && (
        <div className="hidden lg:block">
          <BetSlip
            selection={selection}
            onClose={clearSelection}
            type={type}
          />
        </div>
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
