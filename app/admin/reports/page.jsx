"use client";

import { Filter, Calendar } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="flex flex-col gap-4 max-w-full min-h-[calc(100vh-120px)] flex-grow">
      {/* Report Type Panel */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Report Type
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <button className="bg-[#1abc9c] border border-[#1abc9c] text-white px-3 py-1.5 text-sm font-medium rounded-sm shadow-sm">
            Book Detail
          </button>
          {['Book Detail 2', 'Daily PL', 'Daily Report', 'Final Sheet', 'Accounts', 'Commission Report'].map(btn => (
            <button key={btn} className="border border-[#1abc9c] text-[#1abc9c] hover:bg-teal-50 px-3 py-1.5 text-sm font-medium rounded-sm">
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Report Filter Panel */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Report Filter
        </div>
        <div className="p-6 flex items-center gap-4 flex-wrap">
          {/* Start Date */}
          <div className="flex items-center">
            <input 
              type="text" 
              defaultValue="04/12/2026  12:00 AM" 
              className="border border-gray-300 border-r-0 px-3 py-1.5 focus:outline-none focus:border-[#1abc9c] w-[200px] text-sm text-gray-700"
            />
            <div className="bg-[#f8f9fa] border border-gray-300 px-3 py-1.5 text-gray-500 rounded-r-sm">
              <Calendar size={16} />
            </div>
          </div>
          
          <span className="font-bold text-gray-600">-</span>
          
          {/* End Date */}
          <div className="flex items-center">
            <input 
              type="text" 
              defaultValue="04/12/2026  11:59 PM" 
              className="border border-gray-300 border-r-0 px-3 py-1.5 focus:outline-none focus:border-[#1abc9c] w-[200px] text-sm text-gray-700"
            />
            <div className="bg-[#f8f9fa] border border-gray-300 px-3 py-1.5 text-gray-500 rounded-r-sm">
              <Calendar size={16} />
            </div>
          </div>

          <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors">
            Submit
          </button>
        </div>
      </div>
      
      {/* Spacer to push welcome text to bottom if needed */}
      <div className="flex-grow"></div>
      
      <div className="text-gray-800 text-sm font-bold mt-auto mb-4 self-center flex items-center justify-center w-full max-w-2xl px-6">
        <span className="mr-auto w-full max-w-[200px] translate-x-[400px]">Welcome to Exchange.</span>
      </div>
    </div>
  );
}
