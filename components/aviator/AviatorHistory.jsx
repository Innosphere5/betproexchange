"use client";

import React, { useState } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";
import { getApiUrl } from "../../lib/apiConfig";

export default function AviatorHistory() {
  const { history } = useAviatorStore();
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePillClick = async (idx) => {
    try {
      setLoading(true);
      // Fetch historical rounds list to get seed details
      const res = await fetch(`${getApiUrl()}/api/aviator/history`);
      if (res.ok) {
        const rounds = await res.json();
        // Since history in store is mapped from past rounds (reversed), find match
        // Or simple lookup based on matching crash point or index
        const reversedRounds = [...rounds]; // Sort by index
        if (reversedRounds[idx]) {
          setSelectedRound(reversedRounds[idx]);
        }
      }
    } catch (e) {
      console.error("Failed to load round details:", e);
    } finally {
      setLoading(false);
    }
  };

  const getPillColor = (mult) => {
    if (mult <= 1.20) return "bg-[#1d273a] text-blue-300 border-[#2b3c5a]";
    if (mult <= 2.00) return "bg-[#18392b] text-emerald-400 border-[#265a43]";
    if (mult <= 10.00) return "bg-[#351c4a] text-purple-400 border-[#562d7c]";
    return "bg-[#3e3218] text-amber-400 border-[#6b5528] font-black animate-pulse";
  };

  return (
    <div className="w-full bg-[#1b222d] border border-[#2c3746] p-3 rounded-2xl flex flex-col space-y-2 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
          Recent Multipliers
        </span>
        <span className="text-[9px] text-gray-500 font-semibold italic">
          Click to verify fairness
        </span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {history.length === 0 ? (
          <span className="text-xs text-gray-600 italic">No rounds played yet...</span>
        ) : (
          history.map((mult, idx) => (
            <button
              key={idx}
              onClick={() => handlePillClick(idx)}
              className={`px-3 py-1 text-xs font-bold rounded-full border cursor-pointer hover:brightness-110 active:scale-95 transition-all ${getPillColor(mult)}`}
            >
              {mult.toFixed(2)}x
            </button>
          ))
        )}
      </div>

      {/* Provably Fair Verifier Modal */}
      {selectedRound && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b222d] border border-[#2c3746] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2c3746]">
              <h3 className="text-white font-extrabold tracking-tight uppercase text-sm">
                🛡️ Round Fairness Verification
              </h3>
              <button
                onClick={() => setSelectedRound(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs text-gray-300">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Round Hash:</span>
                <span className="col-span-2 text-white font-mono break-all">{selectedRound.roundId}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Crash Multiplier:</span>
                <span className="col-span-2 text-amber-400 font-extrabold text-sm">{selectedRound.crashPoint?.toFixed(2)}x</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Server Seed (Revealed):</span>
                <span className="col-span-2 text-emerald-400 font-mono break-all">{selectedRound.serverSeed}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Server Seed Hash:</span>
                <span className="col-span-2 text-white font-mono break-all">{selectedRound.serverSeedHash}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Client Salt:</span>
                <span className="col-span-2 text-white font-mono break-all">{selectedRound.clientSeed}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-800">
                <span className="text-gray-500 font-semibold">Nonce:</span>
                <span className="col-span-2 text-white font-mono font-bold">{selectedRound.nonce}</span>
              </div>

              {/* Mathematical Verifier Explanation */}
              <div className="bg-[#121820] border border-[#2c3746] rounded-xl p-3 mt-4 space-y-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                  How to verify:
                </div>
                <p className="leading-relaxed text-[11px] text-gray-400">
                  1. Concatenate the Client Salt and Nonce: <code className="bg-[#1b222d] text-white px-1.5 py-0.5 rounded font-mono font-semibold">{selectedRound.clientSeed}-{selectedRound.nonce}</code>.
                  <br />
                  2. Generate a SHA-256 HMAC of this string using the <code className="bg-[#1b222d] text-emerald-400 px-1.5 py-0.5 rounded font-mono">Server Seed</code> as the secret key.
                  <br />
                  3. The generated hexadecimal string matches the <code className="bg-[#1b222d] text-white px-1.5 py-0.5 rounded font-mono">Server Seed Hash</code>.
                  <br />
                  4. Convert the first 13 characters of the hash to a decimal number. That number determines the multiplier. This calculation is entirely public and cannot be modified by the house.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#121820] px-4 py-3 flex justify-end border-t border-[#2c3746]">
              <button
                onClick={() => setSelectedRound(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
