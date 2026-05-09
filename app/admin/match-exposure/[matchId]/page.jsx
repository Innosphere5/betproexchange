"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Trophy, Users, ShieldCheck } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function AdminMatchExposurePage() {
  const { matchId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const raw = localStorage.getItem("user_session");
    if (!raw) {
        router.push("/login");
        return;
    }
    const token = JSON.parse(raw).token;

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/match-exposure/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch exposure data");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchData();
    }
  }, [matchId]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={32} className="animate-spin text-[#3498db]" />
          <p className="text-gray-500 font-medium">Calculating Exposure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 flex flex-col items-center gap-3">
        <p>{error}</p>
        <button 
          onClick={() => router.back()}
          className="bg-red-600 text-white px-4 py-1.5 rounded-sm text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isIplGlobal = matchId === 'ipl-global';
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

  const runners = isIplGlobal 
    ? DEFAULT_IPL_TEAMS 
    : Object.keys(data.exposure || {});

  const displayMatchName = isIplGlobal ? "IPL 2024 - Global Exposure" : data.matchName;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border border-gray-300 rounded-sm shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Trophy size={20} className="text-[#f1c40f]" />
              {displayMatchName}
            </h1>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Current Position & Risk Analysis</p>
          </div>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className="bg-[#3498db] hover:bg-[#2980b9] text-white px-3 py-1.5 rounded-sm flex items-center gap-2 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* Market View (Visual Layout) */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-[13px]">
                <Trophy size={16} className="text-[#f1c40f]" />
                Market View
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase">Open</span>
        </div>
        <div className="divide-y divide-gray-100">
            {runners.map((runner) => {
                const amount = isIplGlobal ? 0 : (data.exposure[runner] || 0);
                const isLoss = amount < 0;

                // Calculate total back and lay stakes for this runner
                const totalBackStake = data.matchedBets
                  ?.filter(b => b.runner === runner && b.type === 'back')
                  ?.reduce((sum, b) => sum + b.size, 0) || 0;
                
                const totalLayStake = data.matchedBets
                  ?.filter(b => b.runner === runner && b.type === 'lay')
                  ?.reduce((sum, b) => sum + b.size, 0) || 0;

                const formatStake = (val) => {
                    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
                    return val.toString();
                };

                return (
                    <div key={runner} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-gray-800">{runner}</span>
                            <span className={`text-[14px] font-bold mt-0.5 ${isLoss ? 'text-red-600' : 'text-green-600'}`}>
                                {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            {/* Back Stake Box */}
                            <div className="w-16 h-11 bg-[#e3f2fd] border border-blue-100 flex flex-col items-center justify-center rounded-sm">
                                <span className="text-[14px] font-bold text-blue-700">--</span>
                                <span className="text-[10px] font-bold text-blue-500">{formatStake(totalBackStake)}</span>
                            </div>
                            {/* Lay Stake Box */}
                            <div className="w-16 h-11 bg-[#ffebee] border border-red-100 flex flex-col items-center justify-center rounded-sm">
                                <span className="text-[14px] font-bold text-red-700">--</span>
                                <span className="text-[10px] font-bold text-red-500">{formatStake(totalLayStake)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Action Buttons (from UI) */}
      <div className="flex flex-wrap gap-2">
        <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-1 shadow-sm transition-colors">
            Bet Lock
            <ChevronDown size={14} />
        </button>
        <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 rounded-sm text-sm font-bold shadow-sm transition-colors">
            User Book
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white py-2.5 rounded-sm text-sm font-bold shadow-sm transition-colors">
            Tv
        </button>
        <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white py-2.5 rounded-sm text-sm font-bold shadow-sm transition-colors">
            Score Card
        </button>
      </div>

      {/* Open Bets Section */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden mb-4">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2.5 font-bold text-gray-800 text-[14px]">
          Open Bets (0)
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-white border-b border-gray-200">
              <tr className="bg-gray-50/50">
                <th className="px-3 py-2 font-bold text-black border-r border-gray-100">Runner</th>
                <th className="px-3 py-2 font-bold text-black text-center border-r border-gray-100">Price</th>
                <th className="px-3 py-2 font-bold text-black text-center border-r border-gray-100">Size</th>
                <th className="px-3 py-2 font-bold text-black border-r border-gray-100">Better</th>
                <th className="px-3 py-2 font-bold text-black">Master</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-400 italic">No open bets.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Matched Bets Section */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden mb-4">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center gap-2">
            <div className="font-bold text-gray-800 text-[14px]">
                Matched Bets ({data.matchedBets?.length || 0})
            </div>
            <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm transition-colors">
                Full Bet List
            </button>
        </div>
        <div className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <tr className="bg-gray-50/50">
                <th className="px-3 py-2 font-bold text-black border-r border-gray-100">Runner</th>
                <th className="px-3 py-2 font-bold text-black text-center border-r border-gray-100">Price</th>
                <th className="px-3 py-2 font-bold text-black text-center border-r border-gray-100">Size</th>
                <th className="px-3 py-2 font-bold text-black border-r border-gray-100">Better</th>
                <th className="px-3 py-2 font-bold text-black">Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.matchedBets?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-gray-400 italic">No matched bets found.</td>
                </tr>
              ) : (
                data.matchedBets.map((bet, index) => (
                  <tr 
                    key={bet.id || index} 
                    className={`hover:bg-gray-50 transition-colors ${bet.type === 'back' ? 'bg-[#e3f2fd]/60' : 'bg-[#ffebee]/80'}`}
                  >
                    <td className="px-3 py-2.5 font-bold text-gray-900 leading-tight border-r border-gray-200/50 whitespace-pre-wrap">{bet.runner}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-gray-800 border-r border-gray-200/50">{bet.price}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-gray-800 border-r border-gray-200/50">{bet.size}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-800 border-r border-gray-200/50">{bet.better}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-800">{bet.master}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center py-6 pb-12">
          <p className="text-[13px] font-bold text-gray-800">Welcome to Exchange.</p>
      </div>
    </div>
  );
}

// Helper icons
function ChevronDown({ size }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
}
