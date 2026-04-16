"use client";

import { Filter, Search } from "lucide-react";

export default function AdminDashboard() {
  const matches = [
    { name: "Athletic Bilbao v Villarreal / Match Odds", amount: "1,361,670" },
    { name: "Bologna v Lecce / Match Odds", amount: "270,137" },
    { name: "CA Huracan v Rosario Central / Match Odds", amount: "33,401" },
    { name: "Celta Vigo v Oviedo / Match Odds", amount: "624,007" },
    { name: "Chelsea v Man City / Match Odds", amount: "3,895,776" },
    { name: "Como v Inter / Match Odds", amount: "579,299" },
    { name: "Corinthians v SE Palmeiras / Match Odds", amount: "45,319" },
    { name: "Crystal Palace v Newcastle / Match Odds", amount: "3,193,878", hasDot: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Search Users Panel */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        {/* Panel Header */}
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Search-Users
        </div>
        {/* Panel Body */}
        <div className="p-4">
          <div className="flex items-center gap-0 w-full max-w-lg">
            <input 
              type="text" 
              placeholder="Username" 
              className="border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#1abc9c] w-64 text-sm"
            />
            <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 flex items-center gap-1 text-sm font-semibold transition-colors">
              <Search size={14} />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Sport Highlights Panel */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        {/* Panel Header */}
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-bold text-gray-800 text-[13px]">
          Sport Highlights
          <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[11px] px-2 py-0.5 rounded-sm transition-colors font-medium ml-1">
            Refresh
          </button>
        </div>
        {/* Panel Body */}
        <div className="p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#f9f9f9] border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 font-bold text-gray-800 w-[80%]">Soccer</th>
                <th className="px-4 py-2 font-bold text-gray-800 w-[20%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((item, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                >
                  <td className="px-4 py-2.5 text-[#1abc9c] font-medium flex items-center gap-2">
                    {item.name}
                    {item.hasDot && (
                      <span className="w-3 h-3 bg-green-700 rounded-full inline-block"></span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 font-medium">
                    {item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
