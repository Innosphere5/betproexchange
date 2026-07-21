"use client";

export default function HistoryStrip({ history = [], onVerifyRound }) {
  // Color code multipliers
  const getBadgeClass = (val) => {
    if (val < 2.00) {
      return "bg-[#1a2d42] border-[#294263] text-[#7dd3fc] hover:bg-[#203750]";
    } else if (val < 10.00) {
      return "bg-[#3b1c5c] border-[#55298a] text-[#c084fc] hover:bg-[#482270]";
    } else {
      return "bg-[#4d380f] border-[#785412] text-[#fde047] hover:bg-[#5c4312]";
    }
  };

  return (
    <div className="bg-[#101b26] border border-white/5 px-4 py-2 rounded-2xl flex items-center justify-between shadow-lg w-full">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 pr-4">
        {history.map((round, idx) => {
          // history could be an array of numbers, or objects { roundId, crashPoint, serverSeed, serverSeedHash, nonce }
          const isObj = typeof round === 'object' && round !== null;
          const val = isObj ? round.crashPoint : round;
          
          return (
            <button
              key={idx}
              onClick={() => isObj && onVerifyRound && onVerifyRound(round)}
              className={`px-3 py-1 text-xs font-black tracking-wider rounded-lg border cursor-pointer active:scale-95 transition-all whitespace-nowrap ${getBadgeClass(val)}`}
            >
              {val.toFixed(2)}
            </button>
          );
        })}
        {history.length === 0 && (
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">No history rounds available</span>
        )}
      </div>

      <div className="shrink-0 flex items-center border-l border-white/10 pl-4 gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        HISTORY
      </div>
    </div>
  );
}
