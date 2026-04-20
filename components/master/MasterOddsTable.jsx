"use client";

import { Lock } from "lucide-react";

const OddsCell = ({ price, size, type }) => {
  const bgColor = type === 'back' ? 'bg-[#d1ebff]' : 'bg-[#fce1e6]';
  const hoverColor = type === 'back' ? 'hover:bg-[#bcdbff]' : 'hover:bg-[#f8cfd7]';

  return (
    <div className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${bgColor} ${hoverColor} border-r border-white/50 last:border-r-0 min-h-[44px]`}>
      <span className="text-[15px] font-bold text-[#2e3d51] leading-tight">{price || '-'}</span>
      <span className="text-[10px] text-[#6c757d] leading-tight">{size || '0'}</span>
    </div>
  );
};

export default function MasterOddsTable({ title, runners, lastUpdated, remainingTime }) {
  return (
    <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-200 mb-4">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr,repeat(6,65px)] lg:grid-cols-[1fr,repeat(6,80px)] border-b border-gray-200 bg-white">
        <div className="px-3 py-2 flex flex-col justify-center">
          <span className="text-[12px] font-bold text-gray-800">{lastUpdated}</span>
        </div>
        <div className="col-span-3 bg-[#d1ebff] flex items-center justify-center text-[13px] font-bold text-gray-700 border-r border-white/50">
          Back
        </div>
        <div className="col-span-3 bg-[#fce1e6] flex items-center justify-center text-[13px] font-bold text-gray-700">
          Lay
        </div>
      </div>

      {/* Row with Remaining Time (Optional info in some screens) */}
      {remainingTime && (
        <div className="flex justify-end px-3 py-1 bg-[#f8f9fa] border-b border-gray-200">
          <span className="text-[11px] font-bold text-gray-600">Broker Remaining: <span className="text-gray-900">{remainingTime}</span></span>
        </div>
      )}

      {/* Runner Rows */}
      <div className="divide-y divide-gray-100">
        {runners.map((runner, idx) => (
          <div key={idx} className="grid grid-cols-[1fr,repeat(6,65px)] lg:grid-cols-[1fr,repeat(6,80px)] group">
            <div className="px-3 py-3 flex items-center bg-white group-hover:bg-[#f8f9fa] transition-colors">
              <span className="text-[14px] font-bold text-gray-800">{runner.name}</span>
            </div>
            
            {/* Back Odds */}
            <OddsCell price={runner.back[0].price} size={runner.back[0].size} type="back" />
            <OddsCell price={runner.back[1].price} size={runner.back[1].size} type="back" />
            <OddsCell price={runner.back[2].price} size={runner.back[2].size} type="back" />

            {/* Lay Odds */}
            <OddsCell price={runner.lay[0].price} size={runner.lay[0].size} type="lay" />
            <OddsCell price={runner.lay[1].price} size={runner.lay[1].size} type="lay" />
            <OddsCell price={runner.lay[2].price} size={runner.lay[2].size} type="lay" />
          </div>
        ))}
      </div>
    </div>
  );
}
