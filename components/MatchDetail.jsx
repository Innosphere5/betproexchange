"use client";

import { Info, Tv, ChevronDown } from "lucide-react";

export default function MatchDetail({ matchName, onSelectOutcome }) {
  // Mock data for runners based on the screenshot
  const runners = [
    { name: "Rajasthan Royals", back: [3.95, 4, 4.1], lay: [4.4, 4.5, 4.6], backVol: ["29.5K", "114.9K", "34.9K"], layVol: ["51.0K", "26.7K", "300.0K"] },
    { name: "Mumbai Indians", back: [6, 6.2, 6.4], lay: [6.6, 6.8, 7], backVol: ["64.7K", "461.6K", "421.0K"], layVol: ["1.1M", "459.5K", "439.7K"] },
    { name: "Punjab Kings", back: [5.6, 5.7, 5.8], lay: [5.9, 6, 6.2], backVol: ["50.2K", "71.9K", "20.9K"], layVol: ["444.8K", "81.4K", "25.8K"] },
    { name: "Royal Challengers Bengaluru", back: [4.6, 4.7, 4.8], lay: [4.9, 5, 5.3], backVol: ["152.5K", "56.8K", "11.4K"], layVol: ["132.6K", "84.9K", "18.4K"] },
    { name: "Lucknow Super Giants", back: [24, 25, 26], lay: [27, 28, 29], backVol: ["7.4K", "9.7K", "9.7K"], layVol: ["154.6K", "344.9K", "101.9K"] },
    { name: "Gujarat Titans", back: [13.5, 14, 14.5], lay: [15, 15.5, 16], backVol: ["1.2M", "744.0K", "49.7K"], layVol: ["6.9K", "368.9K", "18.1K"] },
    { name: "Delhi Capitals", back: [14.5, 15, 15.5], lay: [16, 16.5, 17], backVol: ["3.1K", "15.1K", "54.2K"], layVol: ["182.8K", "21.9K", "1.0M"] },
    { name: "Chennai Super Kings", back: [17.5, 18, 20], lay: [25, 26, 27], backVol: ["3.7K", "2.2K", "19.3K"], layVol: ["25.7K", "55.4K", "3.7K"] },
    { name: "Sunrisers Hyderabad", back: [32, 40, 44], lay: [55, 60, 65], backVol: ["9.8K", "8.5K", "5.5K"], layVol: ["704", "4.9K", "1.5K"] },
    { name: "Kolkata Knight Riders", back: [95, 100, 110], lay: [120, 140, 150], backVol: ["1.5K", "4.4K", "1.5K"], layVol: ["3.1K", "6.1K", "1.5K"] },
  ];

  return (
    <div className="flex flex-col bg-[#eaedf1] min-h-screen">
      {/* Match Header Card */}
      <div className="bg-[#243f55] m-2 rounded-sm overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-[#243f55] text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#00c766] rounded-md flex items-center justify-center">
                <CricketIconWhite />
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[11px] text-gray-300">
                  <span className="flex items-center gap-1"><Info size={12} /> in a month</span>
                  <span>| May 26 6:30 pm | Winners: 1</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">{matchName || "Indian Premier League"}</h1>
                <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Remaining : 30:17:55</div>
             </div>
          </div>
          <div className="text-[#00c766] font-black text-2xl italic tracking-tighter">OPEN</div>
        </div>
      </div>

      {/* WINNER Market Section */}
      <div className="mx-2 bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-stretch bg-[#243f55] text-white h-10">
          <div className="flex-1 flex items-center px-4 gap-2">
            <div className="w-4 h-4 bg-[#00c766] flex items-center justify-center rounded-sm">
               <Info size={10} color="white" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wide">WINNER (MaxBet: 5M)</span>
            <Info size={14} className="opacity-70" />
          </div>
          
          <div className="flex w-[360px] lg:w-[480px]">
            <div className="flex-1 flex items-center justify-center text-[12px] font-black tracking-widest bg-[#243f55] border-l border-white/10 uppercase">BACK</div>
            <div className="flex-1 flex items-center justify-center text-[12px] font-black tracking-widest bg-[#243f55] border-l border-white/10 uppercase">LAY</div>
          </div>
        </div>

        {/* Runners List */}
        <div className="flex flex-col">
          {runners.map((runner, idx) => (
            <div key={idx} className="flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <div className="flex-1 flex items-center px-4 py-3">
                <span className="text-[14px] font-bold text-[#1c3246]">{runner.name}</span>
              </div>

              {/* Odds Grid */}
              <div className="flex w-[360px] lg:w-[480px]">
                {/* BACK Section */}
                <div className="flex flex-1">
                  <PriceCell 
                    price={runner.back[0]} 
                    vol={runner.backVol[0]} 
                    type="back" 
                    intensity="low" 
                    onClick={() => onSelectOutcome(runner.name, runner.back[0], 'back')}
                  />
                  <PriceCell 
                    price={runner.back[1]} 
                    vol={runner.backVol[1]} 
                    type="back" 
                    intensity="mid" 
                    onClick={() => onSelectOutcome(runner.name, runner.back[1], 'back')}
                  />
                  <PriceCell 
                    price={runner.back[2]} 
                    vol={runner.backVol[2]} 
                    type="back" 
                    intensity="high" 
                    onClick={() => onSelectOutcome(runner.name, runner.back[2], 'back')}
                  />
                </div>
                {/* LAY Section */}
                <div className="flex flex-1">
                  <PriceCell 
                    price={runner.lay[0]} 
                    vol={runner.layVol[0]} 
                    type="lay" 
                    intensity="high" 
                    onClick={() => onSelectOutcome(runner.name, runner.lay[0], 'lay')}
                  />
                  <PriceCell 
                    price={runner.lay[1]} 
                    vol={runner.layVol[1]} 
                    type="lay" 
                    intensity="mid" 
                    onClick={() => onSelectOutcome(runner.name, runner.lay[1], 'lay')}
                  />
                  <PriceCell 
                    price={runner.lay[2]} 
                    vol={runner.layVol[2]} 
                    type="lay" 
                    intensity="low" 
                    onClick={() => onSelectOutcome(runner.name, runner.lay[2], 'lay')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriceCell({ price, vol, type, intensity, onClick }) {
  const isBack = type === 'back';
  
  // Color mapping based on screenshot
  const backColors = {
    low: "bg-[#dcecfd]",
    mid: "bg-[#bbd9f9]",
    high: "bg-[#72bbef]",
  };
  
  const layColors = {
    high: "bg-[#faa9ba]",
    mid: "bg-[#f8c9d4]",
    low: "bg-[#fbe2e8]",
  };

  const bgColor = isBack ? backColors[intensity] : layColors[intensity];

  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-1.5 border-l border-white/40 cursor-pointer active:scale-95 transition-transform ${bgColor}`}
    >
      <span className="text-[15px] font-black text-[#1c3246] leading-none">{price}</span>
      <span className="text-[10px] font-bold text-gray-600 mt-0.5">{vol}</span>
    </button>
  );
}

const CricketIconWhite = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2.5" />
      <line x1="6" y1="18" x2="8" y2="16" strokeWidth="2.5" />
    </svg>
);
