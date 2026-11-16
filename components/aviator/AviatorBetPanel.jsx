"use client";

import React, { useState, useEffect } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";
import { useDashboard } from "../DashboardLayout";
import { getApiUrl } from "../../lib/apiConfig";

export default function AviatorBetPanel() {
  const { phase, multiplier, bets, setUserBetPlaced, setUserCashoutSuccess, resetUserBet } = useAviatorStore();
  const { walletBalance, fetchWallet } = useDashboard();
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
      <SingleBetSlot
        slot={1}
        phase={phase}
        currentMultiplier={multiplier}
        betState={bets[1]}
        setUserBetPlaced={setUserBetPlaced}
        setUserCashoutSuccess={setUserCashoutSuccess}
        resetUserBet={resetUserBet}
        walletBalance={walletBalance}
        fetchWallet={fetchWallet}
        setErrorMsg={setErrorMsg}
      />
      <SingleBetSlot
        slot={2}
        phase={phase}
        currentMultiplier={multiplier}
        betState={bets[2]}
        setUserBetPlaced={setUserBetPlaced}
        setUserCashoutSuccess={setUserCashoutSuccess}
        resetUserBet={resetUserBet}
        walletBalance={walletBalance}
        fetchWallet={fetchWallet}
        setErrorMsg={setErrorMsg}
      />
      {errorMsg && (
        <div className="col-span-full bg-red-950/40 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-xs font-semibold text-center animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}

function SingleBetSlot({
  slot,
  phase,
  currentMultiplier,
  betState,
  setUserBetPlaced,
  setUserCashoutSuccess,
  resetUserBet,
  walletBalance,
  fetchWallet,
  setErrorMsg
}) {
  const [stakeInput, setStakeInput] = useState("100");
  const [autoCashoutInput, setAutoCashoutInput] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [queuedBet, setQueuedBet] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          return JSON.parse(session).token;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  // Auto reset loading when bet status or phase changes
  useEffect(() => {
    setIsPlacing(false);
    if (phase !== 'FLYING') {
      setIsCashingOut(false);
    }
  }, [betState.status, phase]);

  // Auto-place queued bet when phase enters BETTING
  useEffect(() => {
    if (phase === 'BETTING' && queuedBet) {
      setQueuedBet(false);
      handlePlaceBet();
    }
  }, [phase]);

  // Client-side auto cashout trigger for resilient execution
  useEffect(() => {
    if (
      phase === 'FLYING' &&
      betState.status === 'PENDING' &&
      betState.autoCashoutMultiplier &&
      currentMultiplier >= parseFloat(betState.autoCashoutMultiplier) &&
      !isCashingOut
    ) {
      handleCashout();
    }
  }, [phase, currentMultiplier, betState.status, betState.autoCashoutMultiplier, isCashingOut]);

  const handlePlaceBet = async () => {
    if (isPlacing) return;
    setErrorMsg("");
    const stake = parseFloat(stakeInput);
    if (isNaN(stake) || stake < 10) {
      setErrorMsg("Minimum bet amount is 10.");
      return;
    }
    if (stake > walletBalance) {
      setErrorMsg("Insufficient wallet balance.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setErrorMsg("You must be logged in to place a bet.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setIsPlacing(true);
      const res = await fetch(`${getApiUrl()}/api/aviator/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          betSlot: slot,
          stake,
          autoCashoutMultiplier: autoCashoutInput ? parseFloat(autoCashoutInput) : null
        }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place bet");
      }

      setUserBetPlaced(slot, stake, autoCashoutInput);
      fetchWallet();
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg("Request timed out. Please try again.");
      } else {
        setErrorMsg(err.message || "Failed to place bet");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsPlacing(false);
    }
  };

  const handleCashout = async () => {
    if (isCashingOut) return;
    setErrorMsg("");
    const token = getAuthToken();
    if (!token) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setIsCashingOut(true);
      const res = await fetch(`${getApiUrl()}/api/aviator/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ betSlot: slot }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) {
        await fetchWallet();
        if (data.error && (data.error.includes("already") || data.error.includes("not found"))) {
          return;
        }
        throw new Error(data.error || "Cashout failed");
      }

      setUserCashoutSuccess(slot, data.multiplier, data.payout);
      await fetchWallet();
    } catch (err) {
      if (!err.message?.includes("Active bet not found") && !err.message?.includes("already")) {
        if (err.name === 'AbortError') {
          setErrorMsg("Cashout timed out. Please verify your balance.");
        } else {
          setErrorMsg(err.message);
        }
      }
      await fetchWallet();
    } finally {
      clearTimeout(timeoutId);
      setIsCashingOut(false);
    }
  };

  const handleQuickAdd = (amount) => {
    const current = parseFloat(stakeInput) || 0;
    setStakeInput((current + amount).toString());
  };

  const handleDivide = () => {
    const current = parseFloat(stakeInput) || 0;
    if (current > 10) {
      setStakeInput(Math.max(10, Math.floor(current / 2)).toString());
    }
  };

  const handleDouble = () => {
    const current = parseFloat(stakeInput) || 0;
    setStakeInput((current * 2).toString());
  };

  // Dynamic button labels and statuses
  const renderActionButton = () => {
    if (betState.status === 'PENDING') {
      if (phase === 'BETTING') {
        return (
          <button
            disabled
            className="w-full bg-[#1b2f27] border border-[#1abc9c]/30 text-[#1abc9c] py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center cursor-not-allowed opacity-80"
          >
            <span>Waiting for round...</span>
            <span className="text-[10px] text-gray-400 normal-case mt-0.5">Bet Slot {slot} Placed</span>
          </button>
        );
      } else if (phase === 'FLYING') {
        const potentialProfit = Math.round(betState.stake * currentMultiplier * 100) / 100;
        return (
          <button
            onClick={handleCashout}
            disabled={isCashingOut}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black py-4 px-6 rounded-xl font-black uppercase tracking-wider text-sm flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse cursor-pointer"
          >
            <span className="text-[11px] font-bold text-black/70">
              {isCashingOut ? "CASHING OUT..." : `CASHOUT SLOT ${slot}`}
            </span>
            <span className="text-xl font-black">{potentialProfit.toFixed(2)} USD</span>
          </button>
        );
      } else {
        return (
          <button
            disabled
            className="w-full bg-red-950/50 border border-red-500/20 text-red-400/50 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm cursor-not-allowed"
          >
            Crashed
          </button>
        );
      }
    }

    if (betState.status === 'WON') {
      return (
        <button
          disabled
          className="w-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center cursor-not-allowed"
        >
          <span className="text-[10px] text-emerald-500/70 font-semibold uppercase">CASHED OUT ({betState.cashoutMultiplier}x)</span>
          <span className="text-base font-extrabold text-emerald-300">+{betState.payout.toFixed(2)} USD</span>
        </button>
      );
    }

    if (betState.status === 'LOST') {
      return (
        <button
          disabled
          className="w-full bg-rose-950/40 border border-rose-500/30 text-rose-400/70 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center cursor-not-allowed"
        >
          <span className="text-[10px] text-rose-500/70 font-semibold uppercase">LOST</span>
          <span className="text-sm font-semibold">-{betState.stake.toFixed(2)} USD</span>
        </button>
      );
    }

    // Default: Place Bet or Queue Bet
    if (phase !== 'BETTING' && phase !== 'IDLE') {
      if (queuedBet) {
        return (
          <button
            onClick={() => setQueuedBet(false)}
            className="w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider text-base transition-all duration-300 flex flex-col items-center justify-center shadow-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            <span>CANCEL QUEUE</span>
            <span className="text-[10px] font-semibold text-red-200 opacity-90 mt-0.5">
              Queued for Next Flight (${stakeInput} USD)
            </span>
          </button>
        );
      } else {
        return (
          <button
            onClick={() => setQueuedBet(true)}
            className="w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider text-base transition-all duration-300 flex flex-col items-center justify-center shadow-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            <span>BET (NEXT ROUND)</span>
            <span className="text-[10px] font-semibold text-blue-200 opacity-90 mt-0.5">
              Queue Bet (${stakeInput} USD)
            </span>
          </button>
        );
      }
    }

    // Active BETTING or IDLE phase
    return (
      <button
        onClick={handlePlaceBet}
        disabled={isPlacing}
        className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider text-base transition-all duration-300 flex flex-col items-center justify-center shadow-lg
          ${isPlacing 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50' 
            : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer'}`}
      >
        {isPlacing ? (
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <>
            <span>BET</span>
            <span className="text-[10px] font-semibold text-emerald-100 opacity-90 mt-0.5">
              {phase === 'BETTING' ? `Place Bet ($${stakeInput} USD)` : `Start Flight ($${stakeInput} USD)`}
            </span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="bg-[#1b222d] border border-[#2c3746] p-4 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
      {/* Top Input Details */}
      <div className="flex gap-4">
        {/* Left Side: Bet Stake */}
        <div className="flex-1 flex flex-col">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">
            Stake Amount (USD)
          </label>
          <div className="flex bg-[#121820] border border-[#2c3746] rounded-xl overflow-hidden p-1 items-center">
            <button
              onClick={handleDivide}
              disabled={betState.status === 'PENDING'}
              className="text-xs font-bold text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ½
            </button>
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
              disabled={betState.status === 'PENDING'}
              className="w-full bg-transparent border-none text-white text-center font-bold text-sm focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={handleDouble}
              disabled={betState.status === 'PENDING'}
              className="text-xs font-bold text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              2x
            </button>
          </div>
          {/* Quick Pre-selects */}
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[100, 500, 2000, 10000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleQuickAdd(amt)}
                disabled={betState.status === 'PENDING'}
                className="text-[10px] bg-[#1a2332] text-gray-300 font-extrabold py-1 px-1 rounded-md border border-[#2c3746]/50 hover:bg-[#253246] hover:text-white transition-colors"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Auto Cashout */}
        <div className="flex-1 flex flex-col">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">
            Auto Cashout
          </label>
          <div className="flex bg-[#121820] border border-[#2c3746] rounded-xl overflow-hidden p-1.5 items-center h-[38px]">
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 2.00x"
              value={autoCashoutInput}
              onChange={(e) => setAutoCashoutInput(e.target.value)}
              disabled={betState.status === 'PENDING'}
              className="w-full bg-transparent border-none text-white text-center font-bold text-sm focus:outline-none focus:ring-0 placeholder:text-gray-600 placeholder:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {autoCashoutInput && (
              <button
                onClick={() => setAutoCashoutInput("")}
                disabled={betState.status === 'PENDING'}
                className="text-gray-500 hover:text-gray-300 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-[9px] text-gray-500 text-center mt-2 italic">
            Leave blank for manual cashout
          </span>
        </div>
      </div>

      {/* Action Button Layer */}
      <div className="w-full">
        {renderActionButton()}
      </div>
    </div>
  );
}
