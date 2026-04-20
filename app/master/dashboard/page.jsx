"use client";

import { Filter, Search } from "lucide-react";

export default function MasterDashboard() {
  const matches = [
    { name: "Chennai Super Kings v Kolkata Knight Riders / Match Odds", amount: "1,361,670" },
    { name: "Mumbai Indians v Punjab Kings / Match Odds", amount: "270,137" },
    { name: "Royal Challengers Bengaluru v Lucknow Super Giants / Match Odds", amount: "33,401" },
    { name: "Sunrisers Hyderabad v Rajasthan Royals / Match Odds", amount: "624,007" },
    { name: "Delhi Capitals v Gujarat Titans / Match Odds", amount: "3,895,776" },
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
              className="border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#f39c12] w-64 text-sm"
            />
            <button className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 flex items-center gap-1 text-sm font-semibold transition-colors">
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
          Broker Sport Highlights
          <button className="bg-[#f39c12] hover:bg-orange-600 text-white text-[11px] px-2 py-0.5 rounded-sm transition-colors font-medium ml-1">
            Refresh
          </button>
        </div>
        {/* Panel Body */}
        <div className="p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#f9f9f9] border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 font-bold text-gray-800 w-[80%]">Cricket</th>
                <th className="px-4 py-2 font-bold text-gray-800 w-[20%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((item, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                >
                  <td className="px-4 py-2.5 text-[#f39c12] font-medium flex items-center gap-2">
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
