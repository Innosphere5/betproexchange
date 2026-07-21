"use client";

import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../lib/apiConfig";

export default function AviatorSettingsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/api/aviator/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1b222d] border border-[#2c3746] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2c3746]">
          <h3 className="text-white font-extrabold tracking-tight uppercase text-sm">
            ✈️ Aviator Rules & Statistics
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1 text-xs text-gray-300">
          {/* Rules Section */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px] text-emerald-400">
              How to Play
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-400">
              <li>Place a bet before the plane takes off. You can place up to two bets simultaneously.</li>
              <li>Once the flight begins, the multiplier increases exponentially starting from 1.00x.</li>
              <li>Cash out at any time to win your stake multiplied by the current flight multiplier.</li>
              <li>If the plane crashes ("flies away") before you cash out, your bet is lost.</li>
              <li>Use <strong>Auto Cashout</strong> to automatically claim winnings at your desired multiplier (e.g. 2.00x).</li>
            </ul>
          </div>

          {/* Limits Section */}
          <div className="space-y-2 bg-[#121820]/50 border border-gray-800 p-3 rounded-xl">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px] text-emerald-400">
              Limits & Settings
            </h4>
            <div className="grid grid-cols-2 gap-2 text-gray-400">
              <div>Minimum Bet: <strong className="text-white font-mono">$10.00 USD</strong></div>
              <div>Maximum Bet: <strong className="text-white font-mono">$100,000 USD</strong></div>
              <div>House Margin: <strong className="text-white font-mono">3.50%</strong></div>
              <div>Growth Rate: <strong className="text-white font-mono">7% / sec</strong></div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px] text-emerald-400">
              Top Wins Leaderboard
            </h4>
            {loading ? (
              <div className="text-center text-gray-500 py-4 animate-pulse">Loading win statistics...</div>
            ) : !stats || stats.biggestWins?.length === 0 ? (
              <div className="text-center text-gray-600 italic py-4">No major payouts registered yet.</div>
            ) : (
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 bg-[#121820] text-gray-500 font-bold p-2 border-b border-gray-800 text-[10px] uppercase">
                  <span>User</span>
                  <span className="text-right">Stake</span>
                  <span className="text-right">Multiplier</span>
                  <span className="text-right">Payout</span>
                </div>
                <div className="divide-y divide-gray-800/50 max-h-[160px] overflow-y-auto">
                  {stats.biggestWins.map((win, index) => (
                    <div key={index} className="grid grid-cols-4 p-2 text-gray-300 font-mono items-center">
                      <span className="font-sans text-gray-400 font-semibold">{win.username}</span>
                      <span className="text-right text-gray-500">${win.stake.toFixed(0)}</span>
                      <span className="text-right text-amber-500 font-bold">{win.multiplier.toFixed(2)}x</span>
                      <span className="text-right text-emerald-400 font-bold">${win.payout.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#121820] px-4 py-3 flex justify-end border-t border-[#2c3746] shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
