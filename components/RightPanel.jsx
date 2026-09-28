"use client";

import { useState, useEffect } from "react";
import { Tv, ChevronDown } from "lucide-react";
import BetSlip from "./BetSlip";
import { getApiUrl } from "../lib/apiConfig";

export default function RightPanel({ selection, clearSelection, type, matchId }) {
  const [matchedBets, setMatchedBets] = useState([]);
  const [openBets, setOpenBets] = useState([]);

  useEffect(() => {
    if (!matchId) return;

    const fetchBets = async () => {
      try {
        const raw = localStorage.getItem("user_session");
        const token = raw ? JSON.parse(raw).token : '';
        const res = await fetch(`${getApiUrl()}/api/matches/${matchId}/bets`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setMatchedBets(data.matchedBets || []);
          setOpenBets(data.openBets || []);
        }
      } catch (err) {}
    };

    fetchBets();
    const interval = setInterval(fetchBets, 4000);
    const handleBetPlaced = () => fetchBets();
    window.addEventListener('bet-placed', handleBetPlaced);
    window.addEventListener('wallet-updated', handleBetPlaced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bet-placed', handleBetPlaced);
      window.removeEventListener('wallet-updated', handleBetPlaced);
    };
  }, [matchId]);

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
      <CollapsibleSection title={`Open Bets (${openBets.length})`}>
        <div className="bg-gray-100 flex items-center px-3 py-2 text-[10px] font-black text-gray-500 border-b border-gray-200 uppercase tracking-tight">
          <div className="flex-[2] truncate">Runner</div>
          <div className="w-12 text-center">Price</div>
          <div className="w-14 text-right">Size</div>
          <div className="w-14 text-center">Better</div>
          <div className="w-14 text-right">Master</div>
        </div>
        {openBets.length === 0 ? (
          <div className="py-4 bg-white text-center text-[11px] text-gray-400 italic">
            No open bets
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto no-scrollbar divide-y divide-gray-100">
            {openBets.map((b, idx) => (
              <div 
                key={idx} 
                className={`flex items-center px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  b.type === 'lay' ? 'bg-[#f8c9d4]/40 hover:bg-[#f8c9d4]/60' : 'bg-[#bbd9f9]/40 hover:bg-[#bbd9f9]/60'
                }`}
              >
                <div className="flex-[2] font-black text-[#1c3246] truncate">{b.runner}</div>
                <div className="w-12 text-center text-gray-800 font-bold">{b.price}</div>
                <div className="w-14 text-right text-gray-800 font-bold">{Number(b.size).toLocaleString()}</div>
                <div className="w-14 text-center text-gray-600 truncate">{b.better}</div>
                <div className="w-14 text-right text-gray-600 truncate">{b.master}</div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Matched Bets Section */}
      <CollapsibleSection title={`Matched Bets (${matchedBets.length})`}>
        <div className="bg-gray-100 flex items-center px-3 py-2 text-[10px] font-black text-gray-500 border-b border-gray-200 uppercase tracking-tight">
          <div className="flex-[2] truncate">Runner</div>
          <div className="w-12 text-center">Price</div>
          <div className="w-14 text-right">Size</div>
          <div className="w-14 text-center">Better</div>
          <div className="w-14 text-right">Master</div>
        </div>
        {matchedBets.length === 0 ? (
          <div className="py-4 bg-white text-center text-[11px] text-gray-400 italic">
            No matched bets
          </div>
        ) : (
          <div className="max-h-[260px] overflow-y-auto no-scrollbar divide-y divide-gray-100">
            {matchedBets.map((b, idx) => (
              <div 
                key={idx} 
                className={`flex items-center px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  b.type === 'lay' ? 'bg-[#f8c9d4]/40 hover:bg-[#f8c9d4]/60' : 'bg-[#bbd9f9]/40 hover:bg-[#bbd9f9]/60'
                }`}
              >
                <div className="flex-[2] font-black text-[#1c3246] truncate">{b.runner}</div>
                <div className="w-12 text-center text-gray-800 font-bold">{b.price}</div>
                <div className="w-14 text-right text-gray-800 font-bold">{Number(b.size).toLocaleString()}</div>
                <div className="w-14 text-center text-gray-600 truncate">{b.better}</div>
                <div className="w-14 text-right text-gray-600 truncate">{b.master}</div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

    </div>
  );
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <div 
        onClick={() => setOpen(!open)}
        className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none"
      >
        <span className="text-[13px] font-bold uppercase tracking-wide">{title}</span>
        <ChevronDown size={14} className={`opacity-80 transition-transform ${open ? '' : '-rotate-90'}`} />
      </div>
      {open && children}
    </div>
  );
}
