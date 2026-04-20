"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import BetModal from "./BetModal";
import { getApiUrl } from "../lib/apiConfig";

export default function BetSlip({ selection, onClose, type = "back" }) {
  const { fetchWallet } = useDashboard();
  const [modalConfig, setModalConfig] = useState(null);
  const [odds, setOdds] = useState(selection?.price || 0);
  const [stake, setStake] = useState("");
  const [profit, setProfit] = useState(0);

  const calculateProfit = (val) => {
    const s = parseFloat(val) || 0;
    const o = parseFloat(odds) || 0;
    // Standardizing profit calculation as Stake * (Odds - 1) for both types as requested
    setProfit(Math.round(s * (o - 1)));
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

  const handleSubmit = async () => {
    if (!stake || parseFloat(stake) <= 0) {
      setModalConfig({ title: "Invalid Stake", details: "Please enter a valid stake amount to place your bet.", isError: true });
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const res = await fetch(`${getApiUrl()}/api/user/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          matchId: selection.matchId,
          matchName: selection.matchName || "Unknown Match",
          runner: selection.runner,
          stake: parseFloat(stake),
          odds: parseFloat(odds),
          isLive: selection.isLive || false,
          type: type // Pass back or lay
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalConfig({ title: "Bet Failed", details: data.error || "Failed to place bet", isError: true });
        return;
      }

      if (selection.isLive) {
        setModalConfig({ title: "Live Bet Placed!", details: `Runner: ${selection.runner}\nOdds: ${odds}\nStake: ${stake}\n\nYour live bet is matched.` });
      } else {
        setModalConfig({ title: "Advance Bet Scheduled", details: `Runner: ${selection.runner}\nOdds: ${odds}\nStake: ${stake}\n\nYour advance bet is open.` });
      }

      fetchWallet(); // update balance on dashboard
      setStake("");
      setProfit(0);
      // Wait for user to dismiss modal before calling onClose()
    } catch (err) {
      setModalConfig({ title: "Connection Error", details: "Error reaching server.", isError: true });
    }
  };

  const handleCloseModal = () => {
    const wasSuccess = modalConfig && !modalConfig.isError;
    setModalConfig(null);
    if (wasSuccess) {
      onClose(); // Cleanly close betslip only upon acknowledging success
    }
  };

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
            onClick={() => { setStake(""); setProfit(0); }}
            className="flex-1 bg-[#ffb80c] hover:bg-[#e6a60b] text-[#1c3246] font-black py-2 rounded-sm text-[13px] shadow-sm uppercase"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#00c766] hover:bg-[#00a857] text-white font-black py-2 rounded-sm text-[13px] shadow-sm uppercase active:scale-95 transition-transform"
          >
            Submit
          </button>
        </div>
      </div>

      {modalConfig && (
        <BetModal
          title={modalConfig.title}
          details={modalConfig.details}
          isError={modalConfig.isError}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

