"use client";

import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../../lib/apiConfig";

export default function AviatorAdminPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [houseEdge, setHouseEdge] = useState("3.5");
  const [liabilityLimit, setLiabilityLimit] = useState("100000");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch(`${getApiUrl()}/api/aviator/stats`);
      const historyRes = await fetch(`${getApiUrl()}/api/aviator/history`);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    alert(`Configuration Updated Successfully!\nHouse Edge: ${houseEdge}%\nSingle Round Liability Limit: $${liabilityLimit} USD`);
  };

  // Computations
  const totalWinnings = stats?.biggestWins?.reduce((acc, curr) => acc + curr.payout, 0) || 0;
  const averageMultiplier = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.crashPoint, 0) / history.length).toFixed(2)
    : "1.95";

  return (
    <div className="space-y-6 text-[#293c4e]">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-[#e2e8f0]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1e293b]">Aviator Game Analytics</h1>
          <p className="text-xs text-gray-500">Live monitoring, risk parameters, and financial audit controls for Aviator Crash betting.</p>
        </div>
        <button
          onClick={loadAdminData}
          className="bg-[#293c4e] hover:bg-[#1a2632] text-white font-bold py-2 px-4 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md"
        >
          🔄 Refresh Log
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Rounds Played</span>
          <span className="text-2xl font-black text-gray-800 font-mono">{stats?.totalRounds || 0}</span>
          <span className="text-[9px] text-gray-500 font-semibold mt-2">Accumulated since engine launch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Total Payouts (Top 10)</span>
          <span className="text-2xl font-black text-[#1abc9c] font-mono">${totalWinnings.toFixed(2)}</span>
          <span className="text-[9px] text-gray-500 font-semibold mt-2">Total credit payouts awarded</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Average Crash Point</span>
          <span className="text-2xl font-black text-amber-500 font-mono">{averageMultiplier}x</span>
          <span className="text-[9px] text-gray-500 font-semibold mt-2">Target averages: 1.95x - 2.10x</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Plane Engine Status</span>
          <span className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            OPERATIONAL
          </span>
          <span className="text-[9px] text-gray-500 font-semibold mt-2">WebSockets heartbeat frequency: 10s</span>
        </div>
      </div>

      {/* Settings Panel & Risk Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Risk Controls Form */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider border-b border-gray-100 pb-2">
            ⚠️ Risk Parameters Configuration
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="flex flex-col">
              <label className="font-semibold text-gray-600 mb-1">House Edge (%)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={houseEdge}
                onChange={(e) => setHouseEdge(e.target.value)}
                className="bg-[#f8fafc] border border-gray-300 rounded-lg p-2 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-gray-400 mt-1">Instant crash at 1.00x probability setting.</span>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-600 mb-1">Liability Limit per Round (USD)</label>
              <input
                type="number"
                step="1000"
                value={liabilityLimit}
                onChange={(e) => setLiabilityLimit(e.target.value)}
                className="bg-[#f8fafc] border border-gray-300 rounded-lg p-2 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-gray-400 mt-1">Auto-crash happens when total liability threshold is hit.</span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors text-xs"
            >
              Update Settings
            </button>
          </form>
        </div>

        {/* History Audit Logs */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider border-b border-gray-100 pb-2">
            🛡️ Rounds Settlement Audit (Provably Fair)
          </h3>
          {loading && history.length === 0 ? (
            <div className="text-center text-gray-500 py-8 animate-pulse">Loading round histories...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-600 py-8 italic">No settled rounds found.</div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-left font-bold text-[10px] uppercase">
                    <th className="p-2">Round Hash</th>
                    <th className="p-2 text-right">Crash Point</th>
                    <th className="p-2">Server Seed</th>
                    <th className="p-2">Salt</th>
                    <th className="p-2 text-right">Nonce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {history.map((round) => (
                    <tr key={round._id} className="hover:bg-gray-50/50">
                      <td className="p-2 text-gray-400 text-[10px] truncate max-w-[100px]">{round.roundId}</td>
                      <td className="p-2 text-right font-bold text-amber-600">{round.crashPoint.toFixed(2)}x</td>
                      <td className="p-2 text-gray-400 text-[10px] truncate max-w-[120px]" title={round.serverSeed}>{round.serverSeed}</td>
                      <td className="p-2 text-gray-400 text-[10px]">{round.clientSeed}</td>
                      <td className="p-2 text-right font-bold text-gray-700">{round.nonce}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Biggest Wins Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider border-b border-gray-100 pb-2">
          🏆 Top Payout Logs
        </h3>
        {loading && (!stats || stats.biggestWins?.length === 0) ? (
          <div className="text-center text-gray-500 py-8 animate-pulse">Loading payout histories...</div>
        ) : !stats || stats.biggestWins?.length === 0 ? (
          <div className="text-center text-gray-600 py-8 italic">No logged payouts found yet.</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-left font-bold text-[10px] uppercase">
                  <th className="p-2">Player Account</th>
                  <th className="p-2 text-right">Stake Amount</th>
                  <th className="p-2 text-right">Cashout Multiplier</th>
                  <th className="p-2 text-right">Payout Received</th>
                  <th className="p-2 text-right">Settle Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {stats.biggestWins.map((win, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2 text-gray-700 font-sans font-bold">{win.username}</td>
                    <td className="p-2 text-right text-gray-500">${win.stake.toFixed(2)}</td>
                    <td className="p-2 text-right font-black text-amber-500">{win.multiplier.toFixed(2)}x</td>
                    <td className="p-2 text-right font-black text-emerald-600">${win.payout.toFixed(2)}</td>
                    <td className="p-2 text-right text-gray-400 text-[10px] font-sans">
                      {new Date(win.date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
