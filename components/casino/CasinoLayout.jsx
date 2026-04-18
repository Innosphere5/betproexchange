"use client";

export default function CasinoLayout({ leftContent, rightContent, header }) {
  return (
    <div className="flex flex-col lg:h-[calc(100vh-64px)] bg-[#0d1621] text-white overflow-hidden font-sans select-none">
      {/* Optional Header for End Game / Info - HIDDEN ON MOBILE */}
      {header && (
        <div className="h-14 border-b border-white/5 bg-[#1b2b3b] hidden lg:flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-sm font-medium tracking-wider text-gray-400">LIVE CASINO</span>
          </div>
          <div>{header}</div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
        {/* Left Main Game Area (70%) */}
        <div className="w-full lg:flex-[7] flex flex-col bg-[#1b2b3b] shadow-2xl border-b lg:border-b-0 lg:border-r border-white/5">
          {leftContent}
        </div>

        {/* Right Panel (30%) */}
        <div className="w-full lg:flex-[3] flex flex-col min-h-[500px] lg:min-h-0 bg-[#0d1621]">
          {rightContent}
        </div>
      </div>
    </div>
  );
}


