"use client";

import { Calendar, AlignJustify } from "lucide-react";

export default function ResultPage() {
  const sports = [
    { label: "Cricket", active: true },
    { label: "Football", active: false },
    { label: "Tennis", active: false },
    { label: "Hockey", active: false },
  ];

  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Market Results Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Market Results
        </div>
        <div className="p-4">
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-[13px] mb-4">
            <div className="flex w-full md:w-auto">
              <input type="text" value="04/07/2026 5:30 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
              <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
            </div>
            <span className="text-gray-500 font-bold">-</span>
            <div className="flex w-full md:w-auto">
              <input type="text" value="04/12/2026 5:29 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
              <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
            </div>
          </div>

          {/* Sport Tabs */}
          <div className="flex flex-wrap gap-1 mb-5">
            {sports.map((sport, idx) => (
              <button 
                key={idx}
                className={`px-4 py-1.5 font-medium text-white text-[13px] rounded-sm transition-colors ${sport.active ? 'bg-[#00b050] hover:bg-[#009e48]' : 'bg-[#6c757d] hover:bg-[#5a6268]'}`}
              >
                {sport.label}
              </button>
            ))}
          </div>
          
          {/* Controls row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 text-[13px] text-gray-700">
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span>Show</span>
              <select className="border border-gray-300 rounded-sm px-2 py-1 focus:outline-none">
                <option>50</option>
                <option>100</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              <span className="font-semibold">Search:</span>
              <input type="text" className="border border-gray-300 rounded-sm px-2 py-1 focus:outline-none border-gray-400 w-full md:w-auto" />
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto border border-gray-300 rounded-sm mb-3">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 bg-white">
                  <th className="p-2 w-10 text-center border-r border-gray-200"><span className="text-[10px] text-gray-300 mr-1">▲▼</span></th>
                  <th className="p-2 border-r border-gray-200">
                    <div className="flex items-center justify-between">Match name <span className="text-[10px] text-gray-300">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                    <div className="flex items-center justify-between">Market Name <span className="text-[10px] text-gray-300">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                    <div className="flex items-center justify-between">Date <span className="text-[10px] text-[#00b050]">▼</span></div>
                  </th>
                  <th className="p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, match: "3:32 PM Newcastle 11th Apr", market: "To Be Placed", date: "4/11/2026 3:39:00 PM", result: "5. Port Station, 1. Dunkerque" },
                  { id: 2, match: "3:32 PM Newcastle 11th Apr", market: "2m4f Nov Hrd", date: "4/11/2026 3:39:00 PM", result: "1. Dunkerque" },
                  { id: 3, match: "3:00 PM Aintree 11th Apr", market: "To Be Placed", date: "4/11/2026 3:33:00 PM", result: "1. I Am Maximus, 33. Johnnywho, 13. Iroko, 28. Jordans" },
                  { id: 4, match: "3:25 PM Yarmouth 11th Apr", market: "1m Nov Stks", date: "4/11/2026 3:31:00 PM", result: "3. Generic" },
                  { id: 5, match: "3:25 PM Yarmouth 11th Apr", market: "To Be Placed", date: "4/11/2026 3:30:00 PM", result: "3. Generic, 5. My Mate Roger, 6. Thunderhoof" },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-200 last:border-0 font-medium text-gray-800">
                    <td className="p-2 border-r border-gray-200 text-center">{row.id}</td>
                    <td className="p-2 border-r border-gray-200">{row.match}</td>
                    <td className="p-2 border-r border-gray-200">{row.market}</td>
                    <td className="p-2 border-r border-gray-200">{row.date}</td>
                    <td className="p-2 truncate max-w-xs xl:max-w-md">{row.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
