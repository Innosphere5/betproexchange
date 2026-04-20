"use client";

import { useState, useEffect } from "react";
import { Calendar, AlignJustify, Loader2 } from "lucide-react";
import { getApiUrl } from "../../../lib/apiConfig";

export default function ResultPage() {
  const [results, setResults] = useState({ cricket: [], casino: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Cricket");

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const response = await fetch(`${getApiUrl()}/api/user/results`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const sports = [
    { label: "Cricket", count: results.cricket.length },
    { label: "Casino", count: results.casino.length },
  ];

  const currentData = activeTab === "Cricket" ? results.cricket : results.casino;

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
              <input type="text" defaultValue="04/07/2026 5:30 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
              <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
            </div>
            <span className="text-gray-500 font-bold">-</span>
            <div className="flex w-full md:w-auto">
              <input type="text" defaultValue="04/12/2026 5:29 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]" />
              <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300"><Calendar size={15} /></button>
            </div>
          </div>

          {/* Sport Tabs */}
          <div className="flex flex-wrap gap-1 mb-5">
            {sports.map((sport, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveTab(sport.label)}
                className={`px-4 py-1.5 font-medium text-white text-[13px] rounded-sm transition-colors ${activeTab === sport.label ? 'bg-[#00b050] hover:bg-[#009e48]' : 'bg-[#6c757d] hover:bg-[#5a6268]'}`}
              >
                {sport.label} ({sport.count})
              </button>
            ))}
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto border border-gray-300 rounded-sm mb-3">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 bg-white">
                  <th className="p-2 w-10 text-center border-r border-gray-200 text-gray-700">#</th>
                  <th className="p-2 border-r border-gray-200 text-gray-700">Event / Match</th>
                  <th className="p-2 border-r border-gray-200 text-gray-700">Selection</th>
                  <th className="p-2 border-r border-gray-200 text-gray-700">Date</th>
                  <th className="p-2 text-gray-700 pr-4">Result</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                       <Loader2 className="animate-spin inline-block mr-2" size={18} />
                       Fetching results...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">No settled bets found in this category.</td>
                  </tr>
                ) : (
                  currentData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200 last:border-0 font-medium text-gray-800">
                      <td className="p-2 border-r border-gray-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-gray-200 font-bold">{activeTab === "Cricket" ? row.matchName : `Casino Round ${row.roundId}`}</td>
                      <td className="p-2 border-r border-gray-200">{activeTab === "Cricket" ? row.runner : row.choice}</td>
                      <td className="p-2 border-r border-gray-200 text-gray-600">
                         {new Date(row.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: true
                         })}
                      </td>
                      <td className={`p-2 font-bold ${row.status === 'WIN' ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                        {row.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
