"use client";

import React from "react";
import TeenPattiCard from "./TeenPattiCard";
import TeenPattiTimer from "./TeenPattiTimer";

export default function TeenPattiSeat({ player, isCurrentTurn, isMe, myCards, gameStatus, turnDeadline }) {
  const { userId, isSeen, isFolded, isAllIn, totalBet, status, seatIndex } = player;

  // Mask user name
  const isBot = player.isBot;
  const displayName = isBot ? userId.replace(/\d+$/, "") : userId.substring(0, 4) + "***";

  // Determine status color
  const getStatusBadge = () => {
    if (isFolded) return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">Folded</span>;
    if (status === "WINNER") return <span className="bg-emerald-500 text-slate-950 border border-emerald-300 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow animate-bounce">Winner</span>;
    if (status === "LOSER") return <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">Loser</span>;
    if (isAllIn) return <span className="bg-amber-500 text-slate-950 border border-amber-300 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">All-In</span>;
    if (isSeen) return <span className="bg-sky-500 text-slate-950 border border-sky-300 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">Seen</span>;
    return <span className="bg-amber-600/80 text-white border border-amber-500/50 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">Blind</span>;
  };

  // Determine card fan layout
  const renderCards = () => {
    if (isFolded) return null;

    // Show cards if:
    // 1. It's the current player (isMe) AND they are Seen (isSeen)
    // 2. The game is in SHOW or SETTLEMENT or HAND_COMPLETE phase (everyone's cards revealed)
    const showCardsFaceUp = (isMe && isSeen && myCards && myCards.length > 0) ||
      (player.hand && player.hand.length > 0 && (gameStatus === "SHOW" || gameStatus === "SETTLEMENT" || gameStatus === "HAND_COMPLETE"));

    const cardList = showCardsFaceUp ? (isMe ? myCards : player.hand) : [null, null, null];

    return (
      <div className="flex -space-x-8 sm:-space-x-10 mt-1 select-none">
        {cardList.map((card, idx) => {
          // Subtle rotate fan angles
          const rotateAngle = idx === 0 ? "-rotate-[12deg] -translate-x-1" : idx === 2 ? "rotate-[12deg] translate-x-1" : "-translate-y-1.5";
          return (
            <TeenPattiCard
              key={idx}
              card={card}
              faceUp={showCardsFaceUp}
              className={`scale-75 sm:scale-90 origin-bottom shadow-xl transition-all duration-300 ${rotateAngle}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`relative flex flex-col items-center p-2 rounded-2xl w-[125px] sm:w-[155px] transition-all duration-300 ${
      isCurrentTurn ? "bg-slate-900/60 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "bg-slate-950/20 border border-transparent"
    } ${isFolded ? "opacity-60" : ""}`}>
      
      {/* Radial Timer overlay around current player avatar */}
      {isCurrentTurn && !isFolded && (
        <TeenPattiTimer deadline={turnDeadline} duration={20000} />
      )}

      {/* Avatar Box */}
      <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 z-10 ${
        isCurrentTurn ? "border-yellow-400 bg-gradient-to-tr from-amber-600 to-yellow-500" : isMe ? "border-sky-500 bg-slate-800" : "border-slate-700 bg-slate-900"
      }`}>
        <span className="text-sm sm:text-base leading-none">
          {isMe ? "😎" : isBot ? "🤖" : "👤"}
        </span>
      </div>

      {/* Details Box */}
      <div className="flex flex-col items-center mt-1.5 text-center z-10">
        <span className="text-[10px] sm:text-xs font-black text-slate-100 tracking-tight leading-none">
          {displayName}
        </span>
        <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-extrabold mt-0.5">
          Bet: ${totalBet}
        </span>
        <div className="mt-1 flex items-center gap-1.5">
          {getStatusBadge()}
        </div>
      </div>

      {/* Dealt Cards Frame */}
      <div className="relative mt-2 flex justify-center w-full min-h-[60px] sm:min-h-[75px]">
        {renderCards()}
      </div>
    </div>
  );
}
