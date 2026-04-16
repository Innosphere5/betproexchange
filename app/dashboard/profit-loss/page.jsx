"use client";

import { Calendar, AlignJustify } from "lucide-react";

export default function ProfitLossPage() {
  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Report Filter Section */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Report Filter
        </div>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4 text-[13px]">
          {/* Date Picker 1 */}
          <div className="flex w-full md:w-auto">
            <input 
              type="text" 
              value="04/11/2026 12:00 AM" 
              readOnly 
              className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]"
            />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300">
              <Calendar size={15} />
            </button>
          </div>
          
          <span className="text-gray-500 font-bold">-</span>
          
          {/* Date Picker 2 */}
          <div className="flex w-full md:w-auto">
            <input 
              type="text" 
              value="04/11/2026 11:59 PM" 
              readOnly 
              className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]"
            />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300">
              <Calendar size={15} />
            </button>
          </div>
          
          {/* Submit Button */}
          <button className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-5 py-1.5 rounded-sm shadow-sm w-full md:w-auto">
            Submit
          </button>
        </div>
      </div>

      {/* Sports ProfitLoss Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm min-h-[300px]">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Sports ProfitLoss
        </div>
        <div className="p-4 grid place-items-center h-full">
            {/* Empty block as per screenshot */}
        </div>
      </div>
      
    </div>
  );
}
