"use client";

import { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/apiConfig";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/superadmin/users?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/superadmin/users");
    }
  };

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
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Search-Users
        </div>
        <form onSubmit={handleSearch} className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/30 focus:border-[#1abc9c] transition-all bg-white shadow-xs"
              />
            </div>
            <button type="submit" className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 flex items-center justify-center gap-1.5 text-sm font-bold rounded-md shadow-xs transition-all active:scale-95 cursor-pointer">
              <Search size={15} />
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-bold text-gray-800 text-[13px]">
          Sport Highlights (Global)
          <button 
            onClick={fetchStats}
            disabled={isLoading}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[11px] px-2 py-0.5 rounded-sm transition-colors font-medium ml-1 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
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
                    <td className="px-4 py-2.5 text-[#1abc9c] font-medium flex items-center gap-2">
                      <Link 
                        href={`/superadmin/match-exposure/${item.matchId}`}
                        className="hover:underline cursor-pointer"
                      >
                        {item.name}
                      </Link>
                      {item.hasDot && (
                        <span className="w-3 h-3 bg-green-700 rounded-full inline-block"></span>
                      )}
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
