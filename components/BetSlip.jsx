"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";
import { SIDE, FANCY, oddsBet, fancyBet, slipProfitText, formatUnits } from "../lib/betCalc";

export default function BetSlip({ selection, onClose, type = "back" }) {
  const { fetchWallet } = useDashboard();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [odds, setOdds] = useState(selection?.price || 0);
  const [stake, setStake] = useState("");
  const [profitText, setProfitText] = useState("- / -");

  const updateCalculations = (stkVal, oddsVal) => {
    const s = Math.round(parseFloat(stkVal) || 0);
    const o = parseFloat(oddsVal !== undefined ? oddsVal : odds) || 0;
    if (s <= 0 || o <= 1) {
      setProfitText("- / -");
      return;
    }

    try {
      if (selection?.marketType === 'fancy') {
        const side = type === 'lay' ? FANCY.NO : FANCY.YES;
        const line = Number.isInteger(Number(selection?.line)) ? parseInt(selection.line) : 50;
        const rate = Math.round(o * 100) > 100 ? Math.round(o * 100) : 100;
        const bet = fancyBet({ side, line, rate: Math.min(rate, 200), stake: s });
        setProfitText(slipProfitText(bet));
      } else {
        const side = type === 'lay' ? SIDE.LAY : SIDE.BACK;
        const bet = oddsBet({
          side,
          selection: selection?.runner || 'Selection',
          stake: s,
          odds: o
        });
        setProfitText(slipProfitText(bet));
      }
    } catch (e) {
      setProfitText("- / -");
    }
  };

  const handleStakeChange = (val) => {
    setStake(val);
    if (errorMessage) setErrorMessage(null);
    updateCalculations(val, odds);
  };

  const handleOddsChange = (val) => {
    setOdds(val);
    if (errorMessage) setErrorMessage(null);
    updateCalculations(stake, val);
  };

  const addStake = (val) => {
    const current = parseFloat(stake) || 0;
    const next = (current + val).toString();
    setStake(next);
    if (errorMessage) setErrorMessage(null);
    updateCalculations(next, odds);
  };

  if (!selection) return null;

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!stake || parseFloat(stake) <= 0) {
      setErrorMessage("Please enter a valid stake amount to place your bet.");
      return;
    }

    if (selection?.marketType === 'toss' && parseFloat(stake) > 2000000) {
      setErrorMessage("Maximum stake for Toss Market is 2M.");
      return;
    }

    if (selection?.marketType === 'bookmaker' && parseFloat(stake) > 1000000) {
      setErrorMessage("Maximum stake for Bookmaker Market is 1M.");
      return;
    }

    if (selection?.marketType === 'fancy' && parseFloat(stake) > 2000000) {
      setErrorMessage("Maximum stake for Fancy 2 Market is 2M.");
      return;
    }

    if (selection?.marketType === 'figure' && parseFloat(stake) > 100000) {
      setErrorMessage("Maximum stake for Figure Market is 100K.");
      return;
    }

    if (selection?.marketType === 'even_odd' && parseFloat(stake) > 2000000) {
      setErrorMessage("Maximum stake for Even/Odd Market is 2M.");
      return;
    }

    if (selection?.marketType === 'tied_match' && parseFloat(stake) > 500000) {
      setErrorMessage("Maximum stake for Tied Match Market is 500K.");
      return;
    }

    setIsSubmitting(true);

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
          type: type, // Pass back or lay
          marketType: selection.marketType || 'match_odds'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to place bet");
        setIsSubmitting(false);
        return;
      }

      // Smooth bet execution without popup modal
      fetchWallet(); // update balance on dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-updated'));
        window.dispatchEvent(new CustomEvent('bet-placed', { detail: { matchId: selection.matchId } }));
      }
      setStake("");
      setProfitText("- / -");
      setIsSubmitting(false);
      onClose(); // Cleanly close betslip immediately without showing popup
    } catch (err) {
      setErrorMessage("Connection error reaching server.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-300 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold uppercase tracking-wide">Bet Slip</span>
          {selection?.marketType === 'toss' && (
            <span className="bg-[#00c766] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Toss Market
            </span>
          )}
          {selection?.marketType === 'bookmaker' && (
            <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Bookmaker
            </span>
          )}
        </div>
        <button className="text-[11px] font-bold underline hover:text-gray-300">Edit Bet Sizes</button>
      </div>

      {/* Main Form */}
      <div className={`p-2 ${type === 'back' ? 'bg-[#dcecfd]' : 'bg-[#fbe2e8]'}`}>
        <div className="flex items-center text-[11px] font-bold text-gray-600 mb-1 px-1">
          <div className="flex-1">Bet for</div>
          <div className="w-16 text-center">Odds</div>
          <div className="w-20 text-center">Stake</div>
          <div className="w-24 text-right">Profit</div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 font-bold text-[13px] text-[#1c3246] truncate">{selection.runner}</div>
          <div className="w-16">
            <input
              type="number"
              value={odds}
              onChange={(e) => handleOddsChange(e.target.value)}
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
          <div className="w-24 text-right font-black text-[12px] sm:text-[13px] text-[#1c3246] whitespace-nowrap">
            {profitText}
          </div>
        </div>

        {/* Inline Error Message (no blocking popup) */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-300 text-red-700 text-[12px] font-bold px-2.5 py-1.5 rounded-sm mb-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 ml-2 font-black cursor-pointer text-sm"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Quick Stakes */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[2000, 5000, 10000, 25000].map((val) => (
            <button
              key={val}
              onClick={() => handleStakeChange(val.toString())}
              className="bg-gray-300 hover:bg-gray-400 py-2.5 text-[13px] font-bold text-[#1c3246] rounded-sm transition-colors cursor-pointer"
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
              className="bg-gray-200 hover:bg-gray-300 py-1.5 text-[11px] font-bold text-[#1c3246] rounded-sm transition-colors cursor-pointer"
            >
              + {val.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#f05b64] hover:bg-[#d44d55] text-white font-black py-2 rounded-sm text-[13px] shadow-sm uppercase cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => { setStake(""); setProfitText("- / -"); setErrorMessage(null); }}
            className="flex-1 bg-[#ffb80c] hover:bg-[#e6a60b] text-[#1c3246] font-black py-2 rounded-sm text-[13px] shadow-sm uppercase cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-[#00c766] hover:bg-[#00a857] text-white font-black py-2 rounded-sm text-[13px] shadow-sm uppercase active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Placing..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

