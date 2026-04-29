"use client";

import { useState, useEffect } from "react";
import { Filter, Calendar, Layout, List, CheckSquare } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function MasterReports() {
  const [activeReport, setActiveReport] = useState("Daily Report");
  const [hideZero, setHideZero] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ profit: [], loss: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [commissionData, setCommissionData] = useState([]);

  const reportTypes = [
    'Book Detail', 'Book Detail 2', 'Daily PL', 'Daily Report', 'Final Sheet', 'Accounts', 'Commission Report'
  ];

  const getAuthToken = () => {
    const raw = localStorage.getItem("user_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  const fetchFinalSheet = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/final-sheet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFinalSheetData(data);
      }
    } catch (err) {
      console.error("Error fetching final sheet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommissionReport = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/commission-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCommissionData(data);
      }
    } catch (err) {
      console.error("Error fetching commission report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === "Final Sheet") {
      fetchFinalSheet();
    } else if (activeReport === "Commission Report") {
      fetchCommissionReport();
    }
  }, [activeReport]);

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white p-10 text-center border border-gray-300 text-gray-500 rounded-sm animate-pulse">
          Loading report data...
        </div>
      );
    }

    switch (activeReport) {
      case "Daily Report":
        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <Layout size={16} className="mr-2 text-gray-700" />
              Report
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profit Table */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="2" className="px-3 py-4 text-center text-gray-500 font-medium italic">No data available in table</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
                      <td className="px-3 py-2">0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Loss Table */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="2" className="px-3 py-4 text-center text-gray-500 font-medium italic">No data available in table</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#e74c3c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-red-400">Total</td>
                      <td className="px-3 py-2">0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );

      case "Final Sheet":
        const filteredProfit = finalSheetData.profit.filter(u => !hideZero || u.amount !== 0);
        const totalProfit = filteredProfit.reduce((sum, u) => sum + (u.amount || 0), 0);
        const totalLoss = finalSheetData.loss.reduce((sum, u) => sum + (u.amount || 0), 0);

        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              <div className="flex items-center gap-2 mb-1">
                <List size={16} className="text-gray-700" />
                Master - Final Sheet
              </div>
              <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                <input 
                  type="checkbox" 
                  id="hideZero" 
                  checked={hideZero} 
                  onChange={(e) => setHideZero(e.target.checked)} 
                  className="w-3 h-3 accent-[#1abc9c]"
                />
                <label htmlFor="hideZero">Hide Zero Amounts</label>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: Users/Profit */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfit.map((u, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium">
                          {u.name} {u.role && <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase">{u.role}</span>}
                        </td>
                        <td className={`px-3 py-2 font-bold ${u.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {u.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {filteredProfit.length === 0 && (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
                      <td className="px-3 py-2">{totalProfit.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Right Side: Cash/Loss */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalSheetData.loss.map((u, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-100 text-red-500 font-bold">{u.name}</td>
                        <td className="px-3 py-2 text-red-500 font-bold">{u.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {finalSheetData.loss.length === 0 && (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#e74c3c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-red-400">Total</td>
                      <td className="px-3 py-2">{totalLoss.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );

      case "Commission Report":
        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <List size={16} className="mr-2 text-gray-700" />
              Commission Report
            </div>
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600 italic">
                All Commission goes to As per share <br />
                (Auto Commission)
              </div>
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 uppercase tracking-wider">User Name <span className="text-[10px] ml-1">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionData.length > 0 ? commissionData.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium">{c.name}</td>
                        <td className="px-3 py-2 font-bold text-green-600">{c.amount.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr className="border-b border-gray-100">
                        <td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No commission data found for this period</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-black text-sm">
                      <td className="px-3 py-2.5 border-r border-teal-600 uppercase">Total</td>
                      <td className="px-3 py-2.5">
                        {commissionData.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-10 text-center border border-dashed border-gray-300 text-gray-500 rounded-sm italic">
            This report ({activeReport}) is being prepared and will be available soon.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-full pb-10">
      {/* Report Type Selector */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Report Type
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {reportTypes.map(btn => (
            <button 
              key={btn} 
              onClick={() => setActiveReport(btn)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-sm shadow-sm transition-all border ${
                activeReport === btn 
                ? 'bg-[#1abc9c] border-[#1abc9c] text-white' 
                : 'bg-white border-gray-300 text-gray-700 hover:border-[#1abc9c] hover:text-[#1abc9c]'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Report Content */}
      {renderReportContent()}

      <div className="text-gray-500 text-[11px] font-bold mt-4 self-center italic text-center w-full">
        Welcome to Betproexchange Master Portal.
      </div>
    </div>
  );
}
