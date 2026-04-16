"use client";

import { Calendar, AlignJustify } from "lucide-react";

export default function BetsPage() {
  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Report Filter Section */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Bets History
        </div>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4 text-[13px]">
          {/* Dropdowns */}
          <select className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-32 bg-white">
             <option>All</option>
             <option>Back</option>
             <option>Lay</option>
          </select>
          <select className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-32 bg-white">
             <option>Active</option>
             <option>Settled</option>
          </select>

          {/* Date Picker 1 */}
          <div className="flex w-full md:w-auto">
            <input type="text" value="04/11/2026 12:00 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
          </div>
          
          <span className="text-gray-500 font-bold">-</span>
          
          {/* Date Picker 2 */}
          <div className="flex w-full md:w-auto">
            <input type="text" value="04/11/2026 11:59 PM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
          </div>
          
          {/* Submit Button */}
          <button className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-5 py-1.5 rounded-sm shadow-sm w-full md:w-auto">
            Submit
          </button>
        </div>
      </div>

      {/* Bets History Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Bets History
        </div>
        <div className="p-4">
          
          <div className="mb-4">
            <button className="text-[#00b050] font-semibold text-[13px] hover:underline">Star Casino</button>
          </div>

          {/* Controls row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 text-[13px] text-gray-700">
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span>Show</span>
              <select className="border border-gray-300 rounded-sm px-2 py-1 focus:outline-none">
                <option>10</option>
                <option>25</option>
                <option>50</option>
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
                  <th className="p-2 w-10 text-center border-r border-gray-200"># <span className="text-[10px] text-gray-300 ml-1">▲▼</span></th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Event <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Runner <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Price <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Amount <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Position <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2 border-r border-gray-200">
                     <div className="flex justify-between items-center">Placed <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                  <th className="p-2">
                     <div className="flex justify-between items-center">Updated <span className="text-[10px] text-gray-300 ml-1">▲▼</span></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                 <tr>
                    <td colSpan={8} className="p-3 text-center bg-[#f8fafc] text-gray-600 font-medium">
                      No data available in table
                    </td>
                 </tr>
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[13px] text-gray-600">
            <div>Showing 0 to 0 of 0 entries</div>
            <div className="flex rounded-sm overflow-hidden border border-gray-300 select-none">
              <button disabled className="px-3 py-1.5 border-r border-gray-300 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button disabled className="px-3 py-1.5 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
