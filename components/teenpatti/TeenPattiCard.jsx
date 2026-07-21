"use client";

import React from "react";

export default function TeenPattiCard({ card, faceUp = false, className = "", style = {} }) {
  const getSuitColor = (suit) => {
    return suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800";
  };

  const getSuitBg = (suit) => {
    return suit === "♥" || suit === "♦" ? "text-red-400/15" : "text-slate-500/15";
  };

  const hasCard = !!card;
  const value = card?.value || "";
  const suit = card?.suit || "";
  const textColor = getSuitColor(suit);
  const bgSuitColor = getSuitBg(suit);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .tp-perspective {
          perspective: 1000px;
        }
        .tp-preserve-3d {
          transform-style: preserve-3d;
        }
        .tp-backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}} />
      <div 
        style={style}
        className={`tp-perspective relative w-[42px] h-[60px] xs:w-[48px] xs:h-[68px] sm:w-[60px] sm:h-[84px] select-none ${className}`}
      >
        <div 
          className="relative w-full h-full tp-preserve-3d transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
          style={{
            transform: faceUp && hasCard ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Card Back (Shown when not flipped) */}
          <div className="absolute inset-0 w-full h-full tp-backface-hidden rounded-md sm:rounded-lg bg-gradient-to-br from-red-600 via-red-700 to-red-900 border border-red-500/40 shadow-md flex items-center justify-center overflow-hidden">
            <div className="absolute inset-[2px] sm:inset-[3px] border border-red-400/15 rounded-sm sm:rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-full border border-dashed border-red-400/20 flex items-center justify-center">
                <span className="text-red-400/30 text-xs sm:text-sm font-black">♠</span>
              </div>
            </div>
          </div>

          {/* Card Front (Shown when flipped) */}
          <div 
            className="absolute inset-0 w-full h-full tp-backface-hidden rounded-md sm:rounded-lg bg-white border border-slate-300 shadow-md flex flex-col justify-between p-0.5 sm:p-1.5 overflow-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Top left corner */}
            <div className="flex flex-col items-start leading-none z-10">
              <span className={`text-[10px] xs:text-xs sm:text-sm font-black ${textColor}`}>{value}</span>
              <span className={`text-[8px] xs:text-[10px] sm:text-xs ${textColor} -mt-0.5`}>{suit}</span>
            </div>

            {/* Center large suit watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-2xl xs:text-3xl sm:text-4xl ${bgSuitColor}`}>{suit}</span>
            </div>

            {/* Bottom right corner (inverted) */}
            <div className="flex flex-col items-end leading-none self-end rotate-180 z-10">
              <span className={`text-[10px] xs:text-xs sm:text-sm font-black ${textColor}`}>{value}</span>
              <span className={`text-[8px] xs:text-[10px] sm:text-xs ${textColor} -mt-0.5`}>{suit}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
