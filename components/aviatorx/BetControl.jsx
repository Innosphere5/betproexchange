"use client";

import { useState, useEffect } from "react";

export default function BetControl({
  slot,
  phase,
  currentMultiplier,
  activeBet, // From server
  onPlaceBet,
  onCashout,
  walletBalance
}) {
  const [stake, setStake] = useState(100);
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [isAutoCashout, setIsAutoCashout] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState("2.00");
  const [queuedBet, setQueuedBet] = useState(false); // Bet queued for next round
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Auto reset loading states cleanly when bet status or game phase changes
  useEffect(() => {
    setIsPlacingBet(false);
    if (phase !== 'FLYING') {
      setIsCashingOut(false);
    }
  }, [activeBet?.status, phase]);

  // Auto-bet placing logic when phase changes to BETTING
  useEffect(() => {
    if (phase === 'BETTING') {
      if (queuedBet || isAutoBet) {
        setQueuedBet(false);
        handlePlaceBet();
      }
    }
  }, [phase]);

  const handlePlaceBet = async () => {
    if (isPlacingBet) return;
    setIsPlacingBet(true);
    setErrorMsg("");
    try {
      const autoCashoutMult = isAutoCashout ? parseFloat(autoCashoutValue) : null;
      await onPlaceBet(slot, stake, autoCashoutMult);
    } catch (err) {
      setErrorMsg(err.message || "Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleCashout = async () => {
    if (isCashingOut || activeBet?.status !== 'PENDING') return;
    setIsCashingOut(true);
    setErrorMsg("");
    try {
      await onCashout(slot);
    } catch (err) {
      if (!err.message?.includes("Active bet not found") && !err.message?.includes("already")) {
        console.warn("AviatorX cashout warning:", err.message);
        setErrorMsg(err.message);
      }
    } finally {
      setIsCashingOut(false);
    }
  };

  // Adjust stake helpers
  const multiplyStake = (factor) => {
    setStake(prev => {
      const next = Math.round(prev * factor);
      return Math.max(10, next);
    });
  };

  const setStakePreset = (val) => {
    setStake(val);
  };

  // Current real-time payout calculation
  const betStake = (activeBet && typeof activeBet.stake === 'number') ? activeBet.stake : stake;
  const showPayout = activeBet && activeBet.status === 'PENDING'
    ? (betStake * currentMultiplier).toFixed(2)
    : "0.00";

  // Determine button state
  let buttonText = "BET";
  let buttonClass = "bg-[#28a745] hover:bg-[#218838] text-white";
  let onClickAction = handlePlaceBet;
  let disabled = false;
  let showSpinner = false;

  if (activeBet) {
    if (activeBet.status === 'PENDING') {
      if (phase === 'BETTING') {
        buttonText = "BET PLACED";
        buttonClass = "bg-[#f59e0b] text-black font-black cursor-not-allowed";
        onClickAction = null;
        disabled = true;
      } else if (phase === 'FLYING') {
        if (isCashingOut) {
          buttonText = `CASHING OUT...\n${showPayout} INR`;
          buttonClass = "bg-[#d97706] text-white font-extrabold opacity-80 cursor-wait";
          onClickAction = null;
          disabled = true;
          showSpinner = true;
        } else {
          buttonText = `CASHOUT\n${showPayout} INR`;
          buttonClass = "bg-[#d97706] hover:bg-[#b45309] text-white font-extrabold shadow-[0_0_20px_rgba(217,119,6,0.5)] animate-pulse";
          onClickAction = handleCashout;
          disabled = false;
        }
      }
    } else if (activeBet.status === 'WON') {
      const multText = typeof activeBet.cashoutMultiplier === 'number' ? `${activeBet.cashoutMultiplier.toFixed(2)}x` : 'WON';
      buttonText = `CASHED OUT\n@ ${multText}`;
      buttonClass = "bg-[#10b981] text-white font-black cursor-not-allowed";
      onClickAction = null;
      disabled = true;
    } else if (activeBet.status === 'LOST') {
      buttonText = "LOST";
      buttonClass = "bg-red-800/40 text-red-300 cursor-not-allowed border border-red-800/50";
      onClickAction = null;
      disabled = true;
    }
  } else {
    // No active bet
    if (phase !== 'BETTING' && phase !== 'IDLE') {
      if (queuedBet) {
        buttonText = "CANCEL QUEUE";
        buttonClass = "bg-red-600 hover:bg-red-700 text-white font-bold";
        onClickAction = () => setQueuedBet(false);
      } else {
        buttonText = "BET (NEXT ROUND)";
        buttonClass = "bg-blue-600 hover:bg-blue-700 text-white font-semibold";
        onClickAction = () => setQueuedBet(true);
      }
    } else {
      // BETTING or IDLE phase: place bet immediately for this round
      if (isPlacingBet) {
        buttonText = "PLACING...";
        buttonClass = "bg-[#28a745]/70 text-white font-black cursor-wait";
        onClickAction = null;
        disabled = true;
        showSpinner = true;
      } else {
        buttonText = "BET";
        buttonClass = "bg-[#28a745] hover:bg-[#218838] text-white font-black";
        onClickAction = handlePlaceBet;
      }
    }
  }

  return (
    <div className="bg-[#101b26] border border-white/5 p-4 rounded-2xl flex flex-col space-y-4 shadow-xl">
      {/* Auto-Bet & Auto-Cashout Toggles */}
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-b border-white/5 pb-2">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAutoBet}
            onChange={(e) => setIsAutoBet(e.target.checked)}
            className="rounded border-white/10 bg-[#0d1621] text-rose-500 focus:ring-rose-500/30 w-3.5 h-3.5"
          />
          AUTO BET
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAutoCashout}
            onChange={(e) => setIsAutoCashout(e.target.checked)}
            className="rounded border-white/10 bg-[#0d1621] text-rose-500 focus:ring-rose-500/30 w-3.5 h-3.5"
          />
          AUTO CASHOUT
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Side: Inputs */}
        <div className="flex flex-col space-y-3">
          {/* Stake Input */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500">Amount</span>
            <div className="flex items-center bg-[#0d1621] border border-white/10 rounded-xl px-2 py-1.5">
              <button
                onClick={() => multiplyStake(0.5)}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white bg-white/5 rounded-lg active:scale-90 transition-transform"
              >
                ½
              </button>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(10, parseInt(e.target.value) || 10))}
                className="flex-1 bg-transparent text-center font-bold text-sm text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => multiplyStake(2)}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white bg-white/5 rounded-lg active:scale-90 transition-transform"
              >
                2x
              </button>
            </div>
          </div>

          {/* Quick presets grid */}
          <div className="grid grid-cols-4 gap-1">
            {[100, 200, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => setStakePreset(preset)}
                className={`py-1.5 rounded-lg text-[9px] font-black text-center border transition-all ${
                  stake === preset
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                    : "bg-[#0d1621] border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Auto-Cashout Multiplier Input */}
          {isAutoCashout && (
            <div className="flex flex-col space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500">Cashout At</span>
              <div className="flex items-center bg-[#0d1621] border border-white/10 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={autoCashoutValue}
                  onChange={(e) => setAutoCashoutValue(e.target.value)}
                  placeholder="2.00"
                  className="w-full bg-transparent text-center font-bold text-sm text-white focus:outline-none"
                />
                <span className="text-[10px] font-bold text-gray-500 ml-1">x</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Giant Bet/Cashout Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={onClickAction}
            disabled={disabled}
            className={`w-full h-full min-h-[90px] rounded-2xl flex flex-col items-center justify-center text-center text-sm font-black uppercase tracking-wider active:scale-95 transition-all duration-150 shadow-lg whitespace-pre-line ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${buttonClass}`}
          >
            {showSpinner ? (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs font-black">{buttonText}</span>
              </div>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>
      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/40 text-rose-300 px-3 py-1.5 rounded-xl text-[11px] font-bold text-center">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
