"use client";

import { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function MasterDashboard() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    const raw = localStorage.getItem("user_session");
    if (!raw) return;
    const token = JSON.parse(raw).token;

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
          <button 
            onClick={fetchStats}
            disabled={isLoading}
            className="bg-[#f39c12] hover:bg-orange-600 text-white text-[11px] px-2 py-0.5 rounded-sm transition-colors font-medium ml-1 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
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
              {isLoading && matches.length === 0 ? (
                <tr>
                   <td colSpan="2" className="px-4 py-8 text-center text-gray-400">Loading matches...</td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                   <td colSpan="2" className="px-4 py-8 text-center text-gray-400">No active matches with bets found</td>
                </tr>
              ) : (
                matches.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                  >
                    <td className="px-4 py-2.5 text-[#f39c12] font-medium flex items-center gap-2">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">
                      {item.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
