"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, RefreshCw, Trophy } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

const DEFAULT_IPL_TEAMS = [
  "Chennai Super Kings",
  "Mumbai Indians",
  "Royal Challengers Bengaluru",
  "Kolkata Knight Riders",
  "Rajasthan Royals",
  "Gujarat Titans",
  "Lucknow Super Giants",
  "Delhi Capitals",
  "Punjab Kings",
  "Sunrisers Hyderabad"
];

export default function SuperAdminCurrentPosition() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [matchedBets, setMatchedBets] = useState([]);
  const [openBets, setOpenBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const raw = localStorage.getItem("user_session");
    if (!raw) return;
    const token = JSON.parse(raw).token;

    try {
      // 1. Fetch match-wise stats
      const resStats = await fetch(`${getApiUrl()}/api/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      console.log("DEBUG: Dashboard Stats Response:", dataStats);
      if (resStats.ok) setMatches(dataStats);

      // 2. Fetch global matched bets
      const resBets = await fetch(`${getApiUrl()}/api/admin/global-matched-bets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataBets = await resBets.json();
      if (resBets.ok) setMatchedBets(dataBets);

      // 3. Fetch global open bets
      const resOpen = await fetch(`${getApiUrl()}/api/admin/global-open-bets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataOpen = await resOpen.json();
      if (resOpen.ok) setOpenBets(dataOpen);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Merge API matches into the default IPL teams list
  const displayData = DEFAULT_IPL_TEAMS.map(team => {
    const apiMatch = matches.find(m => m.name === team);
    if (apiMatch) return apiMatch;
    return {
      name: team,
      matchName: "No Match Today",
      amount: 0,
      back: "--",
      lay: "--",
      backStake: "0.0",
      layStake: "0.0"
    };
  });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border border-gray-300 rounded-sm shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[#1abc9c]" />
          <h1 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Current Position</h1>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 rounded-sm flex items-center gap-2 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* Market Highlights */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2.5 flex items-center justify-between font-bold text-gray-800 text-[13px]">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#1abc9c]" />
            Market Highlights
          </div>
          <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-tighter">Live Position</span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white border-b border-gray-200">
              <tr className="bg-gray-50/30">
                <th className="px-4 py-2.5 font-bold text-gray-800">Runner Name</th>
                <th className="px-4 py-2.5 font-bold text-gray-800 text-center w-[80px]">Back</th>
                <th className="px-4 py-2.5 font-bold text-gray-800 text-center w-[80px]">Lay</th>
                <th className="px-4 py-2.5 font-bold text-gray-800 text-right w-[120px]">Net Stake</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="text-gray-900 font-bold text-[15px] leading-tight flex items-center gap-2">
                        {item.name}
                        {item.isResulted && item.amount !== 0 && (
                          <span className={`text-[12px] font-black ${item.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ({item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                        {item.matchName}
                        {item.isResulted && <span className="ml-2 text-[#1abc9c]">[RESULTED]</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center align-top">
                    <div className="bg-[#e3f2fd] border border-blue-100 rounded-sm py-1.5 flex flex-col items-center justify-center min-w-[50px]">
                      <span className="text-[13px] font-black text-blue-700">{item.back || '--'}</span>
                      <span className="text-[9px] font-bold text-blue-500">{item.backStake || '0.0'}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center align-top">
                    <div className="bg-[#ffebee] border border-red-100 rounded-sm py-1.5 flex flex-col items-center justify-center min-w-[50px]">
                      <span className="text-[13px] font-black text-red-700">{item.lay || '--'}</span>
                      <span className="text-[9px] font-bold text-red-500">{item.layStake || '0.0'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-black text-right text-[15px] align-top ${item.isResulted ? (item.amount < 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-700'}`}>
                    {(item.isResulted ? item.amount : item.totalStake)?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Global Tables */}
      <div className="flex flex-col gap-6 mt-6 pb-20">

        {/* Matched Bets */}
        <div className="bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-tight">Matched Bets ({matchedBets.length})</h2>
              <span className="bg-[#1abc9c] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold">Full Bet List</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 font-bold text-gray-700">Runner</th>
                  <th className="px-3 py-2 font-bold text-gray-700 text-center">Price</th>
                  <th className="px-3 py-2 font-bold text-gray-700 text-center">Size</th>
                  <th className="px-3 py-2 font-bold text-gray-700">Better</th>
                  <th className="px-3 py-2 font-bold text-gray-700">Master/Admin</th>
                </tr>
              </thead>
              <tbody>
                {matchedBets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-3 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Matched Bets Found</td>
                  </tr>
                ) : (
                  matchedBets.map((bet, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${bet.type === 'back' ? 'bg-blue-50/20' : 'bg-red-50/20'}`}>
                      <td className="px-3 py-2 font-bold text-gray-800">{bet.runner}</td>
                      <td className="px-3 py-2 text-center font-black">{bet.price}</td>
                      <td className="px-3 py-2 text-center font-black">{bet.size}</td>
                      <td className="px-3 py-2 font-bold opacity-70">{bet.better}</td>
                      <td className="px-3 py-2 font-bold opacity-60">{bet.master}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-[13px] font-bold text-gray-800 uppercase tracking-widest opacity-80">Welcome to Exchange.</p>
        </div>
      </div>
    </div>
  );
}
