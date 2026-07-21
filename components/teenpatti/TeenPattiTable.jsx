"use client";

import React from "react";
import TeenPattiSeat from "./TeenPattiSeat";
import TeenPattiChips from "./TeenPattiChips";

export default function TeenPattiTable({
  gameState,
  myUserId,
  myCards,
  gameStatus,
  turnDeadline
}) {
  const { players = [], pot = 0, currentTurnIndex, status } = gameState;

  // We want to map seats such that the current user (myUserId) is always at the bottom center (Seat 0).
  const me = players.find(p => p.userId === myUserId);
  const mySeatIndex = me ? me.seatIndex : 0;

  // Standard positions for 6 seats (represented as CSS absolute classes)
  // Ordered from bottom center, clockwise around the oval table
  const seatPositions = [
    "bottom-4 left-1/2 -translate-x-1/2",                       // Seat 0 (Bottom Center)
    "bottom-1/3 left-4 -translate-y-1/2 sm:left-6",             // Seat 1 (Middle Left)
    "top-1/4 left-4 -translate-y-1/2 sm:left-12",               // Seat 2 (Top Left)
    "top-4 left-1/2 -translate-x-1/2",                          // Seat 3 (Top Center)
    "top-1/4 right-4 -translate-y-1/2 sm:right-12",             // Seat 4 (Top Right)
    "bottom-1/3 right-4 -translate-y-1/2 sm:right-6"            // Seat 5 (Middle Right)
  ];

  const getRelativePositionClass = (playerSeatIndex) => {
    // Shift index so my seat is always seatPositions[0]
    const relativeIndex = (playerSeatIndex - mySeatIndex + 6) % 6;
    return seatPositions[relativeIndex] || "hidden";
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-[#0c131d] border border-slate-700/40 rounded-[30px] md:rounded-[40px] shadow-2xl overflow-hidden flex items-center justify-center p-4 select-none">
      
      {/* Felt Table Ring Background */}
      <div className="absolute w-[88%] h-[80%] rounded-[50%] bg-gradient-to-b from-[#115e3b] via-[#064e3b] to-[#022c22] border-[10px] border-emerald-950/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.6)] flex items-center justify-center">
        
        {/* Golden inner line */}
        <div className="absolute w-[96%] h-[94%] rounded-[50%] border-2 border-yellow-500/25 pointer-events-none" />

        {/* Center Pot & Stack display */}
        <div className="absolute flex flex-col items-center justify-center bg-emerald-950/60 border border-emerald-500/20 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-sm z-20">
          <span className="text-[9px] uppercase tracking-[0.25em] font-black text-emerald-400">Total Pot</span>
          <TeenPattiChips amount={pot} className="mt-1.5" />
          
          {/* Status Overlay message */}
          {status === "DEALING" && (
            <span className="text-[9px] font-bold text-yellow-400/90 uppercase tracking-widest mt-1.5 animate-pulse">
              Dealing Cards...
            </span>
          )}
          {status === "BOOT_COLLECTION" && (
            <span className="text-[9px] font-bold text-yellow-400/90 uppercase tracking-widest mt-1.5 animate-pulse">
              Collecting Boot...
            </span>
          )}
          {status === "SHOW" && (
            <span className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-widest mt-1.5 animate-pulse">
              Comparing Hands!
            </span>
          )}
        </div>
      </div>

      {/* Renders Seats clockwise */}
      {players.map((player) => {
        const isCurrentTurn = currentTurnIndex === player.seatIndex && status === "BETTING_ROUND";
        const isMe = player.userId === myUserId;

        return (
          <div
            key={player.userId}
            className={`absolute z-30 transition-all duration-500 ${getRelativePositionClass(player.seatIndex)}`}
          >
            <TeenPattiSeat
              player={player}
              isCurrentTurn={isCurrentTurn}
              isMe={isMe}
              myCards={myCards}
              gameStatus={gameStatus}
              turnDeadline={turnDeadline}
            />
          </div>
        );
      })}
    </div>
  );
}
