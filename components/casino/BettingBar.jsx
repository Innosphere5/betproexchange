"use client";

import { RotateCcw, X, Lock } from "lucide-react";
import { soundFX } from "../../lib/casinoSoundFX";

export default function BettingBar({
  handleBetClick,
  lock,
  roundStatus,
  amount,
  setAmount,
  lastBet = null,
  onRebet,
  isSubmitting = false,
  hasPlacedBet = false,
  placedBet = null,
  inputRef = null,
}) {
  const numericAmount = parseFloat(amount) || 0;
  const isValidStake = numericAmount >= 10;
  const estNetProfit = Math.round(numericAmount * 0.98 * 0.98 * 100) / 100;
  const estReturn = Math.round((numericAmount + estNetProfit) * 100) / 100;
  const isDisabled = lock || isSubmitting || hasPlacedBet;

  const statusText = hasPlacedBet
    ? "Bet Locked"
    : roundStatus === "DEALING"
      ? "Splitting Cards..."
      : roundStatus === "BETTING_CLOSED"
        ? "Revealing..."
        : roundStatus === "RESULT_DECLARED"
          ? "Round Over"
          : roundStatus === "IDLE"
            ? "Tap Ready"
            : "Locked";

  return (
    <div className="bg-[#09101a] border-t border-white/10 px-3 py-3 sm:px-5 sm:py-4 shrink-0 select-none space-y-3">
      {/* Locked Banner once user placed their bet in this round */}
      {hasPlacedBet && placedBet && (
        <div className="max-w-4xl mx-auto px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <Lock size={13} className="text-amber-400 shrink-0" />
            <span>
              Bet Placed: ₹{Number(placedBet.amount || 0).toLocaleString("en-IN")} on{" "}
              <strong className={placedBet.choice === "A" ? "text-blue-300" : "text-rose-300"}>
                Player {placedBet.choice}
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
            Locked This Round
          </span>
        </div>
      )}

      {/* Step 1: Direct Typed Bet Amount Box */}
      <div className="max-w-4xl mx-auto space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="casino-stake-input"
            className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300"
          >
            1. Enter Bet Amount (Min ₹10)
          </label>

          <div className="flex items-center gap-2">
            {isValidStake && !hasPlacedBet && (
              <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400">
                Win ₹{estReturn.toLocaleString("en-IN")}
              </span>
            )}
            {lastBet && !isDisabled && onRebet && (
              <button
                type="button"
                onClick={onRebet}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-amber-500/25 active:scale-95 cursor-pointer"
              >
                <RotateCcw size={10} />
                <span>Rebet ₹{lastBet.amount}</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 font-black font-mono text-base pointer-events-none">
            ₹
          </span>
          <input
            ref={inputRef}
            id="casino-stake-input"
            type="number"
            min="10"
            step="1"
            inputMode="numeric"
            disabled={hasPlacedBet}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Type stake (e.g. 100)"
            className={`w-full h-11 sm:h-12 bg-black/60 border-2 rounded-xl pl-9 pr-12 font-black font-mono text-base sm:text-lg focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              hasPlacedBet
                ? "border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                : "border-slate-700 focus:border-amber-400 text-amber-400"
            }`}
          />
          {amount && !hasPlacedBet && (
            <button
              type="button"
              onClick={() => {
                soundFX.playChipClick();
                setAmount("");
              }}
              aria-label="Clear amount"
              className="absolute right-2.5 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Choose Winner (locked after 1 bet in current round) */}
      <div className="max-w-4xl mx-auto">
        <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
          2. Choose Winner to Place Bet
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={() => handleBetClick("A")}
            disabled={isDisabled}
            className={`min-h-[56px] sm:min-h-[62px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all touch-manipulation ${
              isDisabled
                ? "bg-slate-900/80 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-b from-[#17365a] to-[#0f2238] border-blue-400/75 hover:border-blue-300 text-white shadow-[0_6px_18px_rgba(37,99,235,0.28)] active:scale-[0.98] cursor-pointer"
            }`}
          >
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
              Bet Player A
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 mt-0.5">
              {isDisabled
                ? statusText
                : isValidStake
                  ? `₹${numericAmount.toLocaleString("en-IN")} • 1.98x`
                  : "Enter Amount • 1.98x"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleBetClick("B")}
            disabled={isDisabled}
            className={`min-h-[56px] sm:min-h-[62px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all touch-manipulation ${
              isDisabled
                ? "bg-slate-900/80 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-b from-[#4a182d] to-[#2e0e1c] border-rose-400/75 hover:border-rose-300 text-white shadow-[0_6px_18px_rgba(225,29,72,0.28)] active:scale-[0.98] cursor-pointer"
            }`}
          >
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
              Bet Player B
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 mt-0.5">
              {isDisabled
                ? statusText
                : isValidStake
                  ? `₹${numericAmount.toLocaleString("en-IN")} • 1.98x`
                  : "Enter Amount • 1.98x"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
