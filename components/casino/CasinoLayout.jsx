"use client";

export default function CasinoLayout({ leftContent, rightContent }) {
  return (
    <div className="flex flex-col lg:h-[calc(100vh-56px)] bg-[#070d16] text-white font-sans select-none">
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Main Felt Arena (Desktop 70%, Mobile top-to-bottom natural flow) */}
        <div className="w-full lg:flex-[7] flex flex-col bg-[#0a131f] lg:border-r border-white/10 lg:overflow-y-auto no-scrollbar">
          {leftContent}
        </div>

        {/* Desktop Side Panel (Active Slip, Round Bets & Detailed Road) */}
        <div className="hidden lg:flex lg:flex-[3] flex-col bg-[#070b13] lg:overflow-y-auto no-scrollbar">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
