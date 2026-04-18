"use client";

import { useState, useEffect } from "react";
import { Calendar, AlignJustify, Loader2 } from "lucide-react";

export default function BetsPage() {
  const [bets, setBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return `http://${window.location.hostname}:5000`;
    }
    return "http://localhost:5000";
  };

  const fetchBets = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const response = await fetch(`${getApiUrl()}/api/user/bets`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBets(data);
      }
    } catch (err) {
      console.error("Failed to fetch bets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Report Filter Section (Static for now, but UI ready) */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Bets History Filter
        </div>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4 text-[13px]">
          <select className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-32 bg-white">
             <option>All Sports</option>
             <option>Cricket</option>
             <option>Casino</option>
          </select>
          <select className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-32 bg-white">
             <option>All Types</option>
             <option>Back</option>
             <option>Lay</option>
          </select>

          <div className="flex w-full md:w-auto">
            <input type="text" value="04/11/2026 12:00 AM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 text-gray-700 w-full md:w-[160px]" />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600"><Calendar size={15} /></button>
          </div>
          <span className="text-gray-500 font-bold">-</span>
          <div className="flex w-full md:w-auto">
            <input type="text" value="04/18/2026 11:59 PM" readOnly className="border border-gray-300 rounded-l-sm px-3 py-1.5 text-gray-700 w-full md:w-[160px]" />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600"><Calendar size={15} /></button>
          </div>
          <button className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-5 py-1.5 rounded-sm shadow-sm w-full md:w-auto">
            Submit
          </button>
        </div>
      </div>

      {/* Bets History Table */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          My Betting Activity
        </div>
        <div className="p-4">
          
          {/* Table */}
          <div className="overflow-x-auto border border-gray-300 rounded-sm mb-3">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 bg-white">
                  <th className="p-2 w-10 text-center border-r border-gray-200">#</th>
                  <th className="p-2 border-r border-gray-200">Event / Sport</th>
                  <th className="p-2 border-r border-gray-200">Selection</th>
                  <th className="p-2 border-r border-gray-200 text-center">Type</th>
                  <th className="p-2 border-r border-gray-200 text-right pr-4">Odds</th>
                  <th className="p-2 border-r border-gray-200 text-right pr-4">Stake</th>
                  <th className="p-2 border-r border-gray-200 text-right pr-4">Profit/Loss</th>
                  <th className="p-2 border-r border-gray-200 text-center">Status</th>
                  <th className="p-2 text-right pr-4">Placed Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="p-10 text-center text-gray-500">
                       <Loader2 className="animate-spin inline-block mr-2" size={18} />
                       Fetching your bet history...
                    </td>
                  </tr>
                ) : bets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-10 text-center text-gray-500 italic">
                      You haven't placed any bets yet.
                    </td>
                  </tr>
                ) : (
                  bets.map((bet, idx) => {
                    const isWin = bet.status === 'WIN';
                    const isLose = bet.status === 'LOSE';
                    const pl = isWin ? (bet.stake * (bet.odds - 1)) : (isLose ? -bet.stake : 0);
                    
                    return (
                      <tr key={bet._id} className="hover:bg-gray-50 border-b border-gray-200 last:border-0 font-medium text-gray-800">
                        <td className="p-2 border-r border-gray-200 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-200">
                           <div className="flex flex-col">
                              <span className="font-bold text-[#1c3246]">{bet.event}</span>
                              <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{bet.sport}</span>
                           </div>
                        </td>
                        <td className="p-2 border-r border-gray-200 font-semibold">{bet.selection}</td>
                        <td className="p-2 border-r border-gray-200 text-center">
                           <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${bet.type === 'back' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                              {bet.type || 'BACK'}
                           </span>
                        </td>
                        <td className="p-2 border-r border-gray-200 text-right pr-4 font-mono">{bet.odds}</td>
                        <td className="p-2 border-r border-gray-200 text-right pr-4 font-bold">₹{bet.stake.toLocaleString()}</td>
                        <td className={`p-2 border-r border-gray-200 text-right pr-4 font-black ${pl > 0 ? 'text-[#00b050]' : pl < 0 ? 'text-[#dc3545]' : 'text-gray-400'}`}>
                           {pl > 0 ? '+' : ''}{pl.toLocaleString()}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isWin ? 'bg-green-100 text-green-700' : 
                              isLose ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'
                           }`}>
                             {bet.status}
                           </span>
                        </td>
                        <td className="p-2 text-right pr-4 text-gray-600 text-[12px]">
                           {new Date(bet.placed).toLocaleString('en-IN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                              hour12: true
                           })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center text-[12px] text-gray-500 px-1">
             <div>Showing {bets.length} entries</div>
             <div className="italic">Data updated in real-time from secure wallet</div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
