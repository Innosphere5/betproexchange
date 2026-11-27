"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function TeenPattiBettingBoard({
  round,
  onSelectBet,
  selectedChoice,
  userBets = [],
  selectedChip = "100",
  setSelectedChip,
  use1Click = false,
  setUse1Click,
}) {
  const isLocked = round?.status !== "BETTING_OPEN";
  const backOdds = 1.98;
  const layOdds = 1.98;

  const CHIPS = [
    { value: "10", label: "₹10", color: "from-rose-500 to-rose-700 border-rose-400" },
    { value: "50", label: "₹50", color: "from-emerald-500 to-emerald-700 border-emerald-400" },
    { value: "100", label: "₹100", color: "from-blue-500 to-blue-700 border-blue-400" },
    { value: "500", label: "₹500", color: "from-purple-500 to-purple-700 border-purple-400" },
    { value: "1000", label: "₹1K", color: "from-amber-500 to-amber-700 border-amber-300" },
    { value: "5000", label: "₹5K", color: "from-slate-700 to-slate-900 border-slate-400" },
  ];

  const handleBetClick = (betType) => {
    if (isLocked) return;
    onSelectBet(betType);
  };

  const getBetAmountOnCell = (betType) => {
    return userBets
      .filter((b) => b.roundId === round?.roundId && b.betType === betType)
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  };

  const getButtonClass = (betType, baseColor) => {
    const isSelected = selectedChoice === betType;
    const hasBet = getBetAmountOnCell(betType) > 0;

    if (baseColor === "blue") {
      return `relative flex-1 py-2.5 px-2 sm:py-3.5 sm:px-3 rounded-xl sm:rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all min-h-[54px] sm:min-h-[62px] border touch-manipulation ${
        isLocked
          ? "bg-slate-900 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
          : isSelected
            ? "bg-blue-600 border-blue-300 text-white shadow-[0_0_15px_rgba(59,130,246,0.45)]"
            : hasBet
              ? "bg-blue-900/40 border-blue-500 text-blue-200 cursor-pointer"
              : "bg-blue-950/25 border-blue-500/35 hover:bg-blue-900/30 hover:border-blue-400 text-blue-300 cursor-pointer active:scale-95"
      }`;
    }

    return `relative flex-1 py-2.5 px-2 sm:py-3.5 sm:px-3 rounded-xl sm:rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all min-h-[54px] sm:min-h-[62px] border touch-manipulation ${
      isLocked
        ? "bg-slate-900 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
        : isSelected
          ? "bg-rose-600 border-rose-300 text-white shadow-[0_0_15px_rgba(244,63,94,0.45)]"
          : hasBet
            ? "bg-rose-900/40 border-rose-500 text-rose-200 cursor-pointer"
            : "bg-rose-950/25 border-rose-500/35 hover:bg-rose-900/30 hover:border-rose-400 text-rose-300 cursor-pointer active:scale-95"
    }`;
  };

  return (
    <div className="bg-[#121820]/95 backdrop-blur-md border border-slate-700/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl w-full flex flex-col gap-3.5 sm:gap-4">
      {/* Header + 1-Click Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="grid grid-cols-3 gap-2 flex-1 items-center">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">
            Market
          </span>
          <span className="text-center text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-black text-blue-400">
            Back (Win)
          </span>
          <span className="text-center text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-black text-rose-400">
            Lay (Lose)
          </span>
        </div>

        {setUse1Click && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 shrink-0">
            <span className="text-[9px] font-black uppercase text-slate-400">1-Click</span>
            <button
              type="button"
              onClick={() => setUse1Click(!use1Click)}
              className={`w-8 h-4.5 rounded-full relative transition-all cursor-pointer ${
                use1Click ? "bg-emerald-500" : "bg-slate-700"
              }`}
              aria-label="Toggle 1-Click Teen Patti Bet"
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${
                  use1Click ? "left-[16px]" : "left-[2px]"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Player A & Player B Back / Lay Rows */}
      <div className="space-y-2.5 sm:space-y-3.5">
        {/* Player A */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white leading-none">Player A</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider">
              Min ₹10
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleBetClick("A_BACK")}
            disabled={isLocked}
            className={getButtonClass("A_BACK", "blue")}
          >
            {isLocked ? (
              <Lock size={14} className="opacity-40" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-blue-200/80 mb-0.5">
                  Back
                </span>
                <span className="font-black font-mono text-xs sm:text-sm">{backOdds.toFixed(2)}</span>
              </>
            )}
            {getBetAmountOnCell("A_BACK") > 0 && (
              <div className="absolute -top-2 -right-1 bg-blue-500 border border-white/60 rounded-full h-5 px-1.5 shadow flex items-center justify-center z-10">
                <span className="text-[8px] font-black text-white font-mono">
                  ₹{getBetAmountOnCell("A_BACK")}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleBetClick("A_LAY")}
            disabled={isLocked}
            className={getButtonClass("A_LAY", "pink")}
          >
            {isLocked ? (
              <Lock size={14} className="opacity-40" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-rose-200/80 mb-0.5">
                  Lay
                </span>
                <span className="font-black font-mono text-xs sm:text-sm">{layOdds.toFixed(2)}</span>
              </>
            )}
            {getBetAmountOnCell("A_LAY") > 0 && (
              <div className="absolute -top-2 -right-1 bg-rose-500 border border-white/60 rounded-full h-5 px-1.5 shadow flex items-center justify-center z-10">
                <span className="text-[8px] font-black text-white font-mono">
                  ₹{getBetAmountOnCell("A_LAY")}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Player B */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white leading-none">Player B</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider">
              Min ₹10
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleBetClick("B_BACK")}
            disabled={isLocked}
            className={getButtonClass("B_BACK", "blue")}
          >
            {isLocked ? (
              <Lock size={14} className="opacity-40" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-blue-200/80 mb-0.5">
                  Back
                </span>
                <span className="font-black font-mono text-xs sm:text-sm">{backOdds.toFixed(2)}</span>
              </>
            )}
            {getBetAmountOnCell("B_BACK") > 0 && (
              <div className="absolute -top-2 -right-1 bg-blue-500 border border-white/60 rounded-full h-5 px-1.5 shadow flex items-center justify-center z-10">
                <span className="text-[8px] font-black text-white font-mono">
                  ₹{getBetAmountOnCell("B_BACK")}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleBetClick("B_LAY")}
            disabled={isLocked}
            className={getButtonClass("B_LAY", "pink")}
          >
            {isLocked ? (
              <Lock size={14} className="opacity-40" />
            ) : (
              <>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-rose-200/80 mb-0.5">
                  Lay
                </span>
                <span className="font-black font-mono text-xs sm:text-sm">{layOdds.toFixed(2)}</span>
              </>
            )}
            {getBetAmountOnCell("B_LAY") > 0 && (
              <div className="absolute -top-2 -right-1 bg-rose-500 border border-white/60 rounded-full h-5 px-1.5 shadow flex items-center justify-center z-10">
                <span className="text-[8px] font-black text-white font-mono">
                  ₹{getBetAmountOnCell("B_LAY")}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Chip Selector */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Chip Value
          </span>
          <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full">
            Selected: ₹{Number(selectedChip || 100).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 py-0.5">
          {CHIPS.map((chip) => {
            const isChipSelected = selectedChip === chip.value;
            return (
              <button
                type="button"
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={`relative aspect-square max-w-[48px] mx-auto w-full rounded-full border-2 border-dashed flex items-center justify-center font-bold text-white bg-gradient-to-br cursor-pointer transition-all shadow-md touch-manipulation ${
                  chip.color
                } ${
                  isChipSelected
                    ? "scale-105 ring-2 ring-amber-400 border-white shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "opacity-85 hover:opacity-100 active:scale-95"
                }`}
              >
                <span className="font-mono text-[9px] sm:text-[10px] font-black">{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
