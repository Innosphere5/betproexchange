"use client";

import { useState, useEffect } from "react";
import { Calendar, AlignJustify, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { getApiUrl } from "../../../lib/apiConfig";

export default function ProfitLossPage() {
  const [plData, setPlData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPL = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const response = await fetch(`${getApiUrl()}/api/user/profit-loss`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlData(data);
      }
    } catch (err) {
      console.error("Failed to fetch P&L:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPL();
  }, []);

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
              defaultValue="04/11/2026 12:00 AM" 
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
              defaultValue="04/11/2026 11:59 PM" 
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
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Sports ProfitLoss Summary
        </div>
        <div className="p-4">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="animate-spin text-gray-400" size={32} />
               <p className="text-gray-500">Calculating your profit and loss...</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total P&L Card */}
                <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Net P/L</div>
                  <div className={`text-2xl font-black flex items-center gap-2 ${plData?.totalPL >= 0 ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                    {plData?.totalPL >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    {plData?.totalPL?.toLocaleString()}
                  </div>
                </div>

                {/* Cricket Card */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase mb-1">Cricket P/L</div>
                   <div className={`text-xl font-bold ${plData?.cricketPL >= 0 ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                    {plData?.cricketPL?.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{plData?.details?.cricketCount} bets placed</div>
                </div>

                {/* Casino Card */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase mb-1">Casino P/L</div>
                   <div className={`text-xl font-bold ${plData?.casinoPL >= 0 ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                    {plData?.casinoPL?.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{plData?.details?.casinoCount} rounds played</div>
                </div>
             </div>
           )}
        </div>
      </div>
      
    </div>
  );
}
