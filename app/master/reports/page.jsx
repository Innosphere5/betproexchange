"use client";

import React, { useState, useEffect } from "react";
import { Filter, Calendar, Layout, List, CheckSquare, X, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Users } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function MasterReports() {
  const [activeReport, setActiveReport] = useState("Daily Report");
  const [hideZero, setHideZero] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ accounts: [] });
  const [dailyReportData, setDailyReportData] = useState({ accounts: [] });
  const [showParentFor, setShowParentFor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commissionData, setCommissionData] = useState([]);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [detailsView, setDetailsView] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

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

  const fetchDailyReport = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      let url = `${getApiUrl()}/api/admin/daily-report?reportType=${reportPeriod}`;
      if (reportPeriod === 'daily') url += `&date=${selectedDate}`;
      else if (reportPeriod === 'monthly') url += `&month=${selectedMonth}`;
      else if (reportPeriod === 'yearly') url += `&year=${selectedYear}`;
      else if (reportPeriod === 'range') url += `&startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDailyReportData(data);
      }
    } catch (err) {
      console.error("Error fetching daily report:", err);
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

  const fetchDailyReportDetails = async (bettor, type = 'all') => {
    setIsDetailsLoading(true);
    const token = getAuthToken();
    try {
      let url = `${getApiUrl()}/api/admin/daily-report-details?bettor=${bettor}&type=${type}&reportType=${reportPeriod}`;
      if (reportPeriod === 'daily') url += `&date=${selectedDate}`;
      else if (reportPeriod === 'monthly') url += `&month=${selectedMonth}`;
      else if (reportPeriod === 'yearly') url += `&year=${selectedYear}`;
      else if (reportPeriod === 'range') url += `&startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactionDetails(data);
        setDetailsView({ bettor, type });
      }
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === "Final Sheet") {
      fetchFinalSheet();
    } else if (activeReport === "Commission Report") {
      fetchCommissionReport();
    } else if (activeReport === "Daily Report") {
      fetchDailyReport();
    }
  }, [activeReport, selectedDate, selectedMonth, selectedYear, reportPeriod, startDate, endDate]);

  const renderReportUI = () => {
    if (isLoading) {
      return (
        <div className="bg-white p-10 text-center border border-gray-300 text-gray-500 rounded-sm animate-pulse">
          Loading report data...
        </div>
      );
    }

    switch (activeReport) {
      case "Daily Report":
        const dailyAccounts = dailyReportData?.accounts || [];
        const filteredDailyAccounts = dailyAccounts.filter(u => !hideZero || u.green !== 0 || u.red !== 0 || u.net !== 0);
        const totalDailyGreen = filteredDailyAccounts.reduce((sum, u) => sum + (u.green || 0), 0);
        const totalDailyRed = filteredDailyAccounts.reduce((sum, u) => sum + (u.red || 0), 0);
        const totalDailyNet = filteredDailyAccounts.reduce((sum, u) => sum + (u.net || 0), 0);

        return (
          <div className="flex flex-col gap-4">
            {/* Report Filter Section */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
              <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center gap-2">
                <Filter size={16} className="text-gray-700" />
                Report Filter
              </div>
              <div className="p-4 flex flex-wrap items-center gap-4">
                {/* Period Selector Buttons */}
                <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                  {['daily', 'monthly', 'yearly', 'range'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors border-r last:border-r-0 ${
                        reportPeriod === p ? 'bg-[#1abc9c] text-white border-[#1abc9c]' : 'hover:bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {reportPeriod === 'daily' && (
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1abc9c]"
                    />
                  )}
                  {reportPeriod === 'monthly' && (
                    <input 
                      type="month" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1abc9c]"
                    />
                  )}
                  {reportPeriod === 'yearly' && (
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1abc9c]"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                  {reportPeriod === 'range' && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1abc9c]"
                      />
                      <span className="text-gray-400 text-[12px]">-</span>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1abc9c]"
                      />
                    </div>
                  )}
                </div>

                <button 
                  onClick={fetchDailyReport}
                  className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[12px] font-bold px-4 py-1 rounded shadow-sm transition-colors"
                >
                  Submit
                </button>

                <div className="flex items-center gap-1 ml-auto font-normal text-gray-600 text-[11px]">
                  <input 
                    type="checkbox" 
                    id="hideZeroDaily" 
                    checked={hideZero} 
                    onChange={(e) => setHideZero(e.target.checked)} 
                    className="w-3 h-3 accent-[#1abc9c]"
                  />
                  <label htmlFor="hideZeroDaily" className="cursor-pointer">Hide Zero</label>
                </div>
              </div>
            </div>

            {/* Report Table Section */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
              <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout size={16} className="text-gray-700" />
                  Report
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Parent</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Green (Received)</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Red (Paid)</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Net</th>
                      <th className="px-3 py-2 font-bold text-gray-700 text-right">My Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDailyAccounts.map((u, i) => (
                      <React.Fragment key={`daily-${i}`}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td 
                            className="px-3 py-2 border-r border-gray-100 cursor-pointer text-blue-600 font-medium hover:underline"
                            onClick={() => setShowParentFor(showParentFor === u.name ? null : u.name)}
                          >
                            <div className="flex flex-col">
                              <span>{u.name}</span>
                              {u.parent && u.parent !== 'None' && u.parent !== 'Legacy' && showParentFor === u.name && (
                                <span className="text-[10px] text-blue-500 font-bold italic">
                                  Parent: {u.parent}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                            {u.parent && u.parent !== 'None' && u.parent !== 'Legacy' ? u.parent : '-'}
                          </td>
                          <td 
                            className="px-3 py-2 border-r border-gray-100 text-right font-bold text-green-600 cursor-pointer hover:bg-green-50"
                            onClick={() => setExpandedUser(expandedUser === u.name ? null : u.name)}
                          >
                            {u.green.toLocaleString()}
                          </td>
                          <td 
                            className="px-3 py-2 border-r border-gray-100 text-right font-bold text-red-500 cursor-pointer hover:bg-red-50"
                            onClick={() => setExpandedUser(expandedUser === u.name ? null : u.name)}
                          >
                            {u.red.toLocaleString()}
                          </td>
                          <td 
                            className={`px-3 py-2 border-r border-gray-100 text-right font-bold cursor-pointer hover:bg-gray-50 ${u.net >= 0 ? 'text-green-600' : 'text-red-500'}`}
                            onClick={() => setExpandedUser(expandedUser === u.name ? null : u.name)}
                          >
                            <span>{u.net >= 0 ? `+${u.net.toLocaleString()}` : u.net.toLocaleString()}</span>
                          </td>
                          <td 
                            className={`px-3 py-2 text-right font-bold cursor-pointer hover:bg-gray-50 ${u.myProfit >= 0 ? 'text-[#1abc9c]' : 'text-red-500'}`}
                            onClick={() => setExpandedUser(expandedUser === u.name ? null : u.name)}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>{u.myProfit >= 0 ? `+${u.myProfit?.toLocaleString()}` : u.myProfit?.toLocaleString()}</span>
                              <span className={`text-[10px] transition-transform duration-300 ${expandedUser === u.name ? 'rotate-180 text-[#1abc9c]' : 'text-gray-400'}`}>
                                ▼
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedUser === u.name && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="6" className="p-2">
                              <div className="bg-white border border-gray-200 rounded shadow-inner p-2 text-[11px]">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-gray-500">
                                      <th className="py-1">Type</th>
                                      <th className="text-right py-1">Green</th>
                                      <th className="text-right py-1">Red</th>
                                      <th className="text-right py-1">Net</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'cricket')}>
                                      <td className="py-1.5 font-medium text-blue-600 hover:underline">Cricket</td>
                                      <td className="text-right font-bold text-green-600">{u.breakdown?.cricket?.green.toLocaleString()}</td>
                                      <td className="text-right font-bold text-red-500">{u.breakdown?.cricket?.red.toLocaleString()}</td>
                                      <td className={`text-right font-bold ${u.breakdown?.cricket?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.cricket?.net >= 0 ? `+${u.breakdown?.cricket?.net.toLocaleString()}` : u.breakdown?.cricket?.net.toLocaleString()}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'casino')}>
                                      <td className="py-1.5 font-medium text-blue-600 hover:underline">Casino</td>
                                      <td className="text-right font-bold text-green-600">{u.breakdown?.casino?.green.toLocaleString()}</td>
                                      <td className="text-right font-bold text-red-500">{u.breakdown?.casino?.red.toLocaleString()}</td>
                                      <td className={`text-right font-bold ${u.breakdown?.casino?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.casino?.net >= 0 ? `+${u.breakdown?.casino?.net.toLocaleString()}` : u.breakdown?.casino?.net.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tbody>
                                  <tfoot>
                                    <tr className="font-bold bg-gray-50">
                                      <td className="py-1">Total</td>
                                      <td className="text-right text-green-600">{u.green.toLocaleString()}</td>
                                      <td className="text-right text-red-500">{u.red.toLocaleString()}</td>
                                      <td className={`text-right ${u.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.net >= 0 ? `+${u.net.toLocaleString()}` : u.net.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                                <div className="text-[9px] text-gray-400 mt-1 italic text-center">Click on Cricket or Casino for full history</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredDailyAccounts.length === 0 && (
                      <tr><td colSpan="6" className="px-3 py-10 text-center text-gray-400 italic">No data found for this date</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td colSpan="2" className="px-3 py-2 border-r border-teal-600">Total</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalDailyGreen.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalDailyRed.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalDailyNet >= 0 ? `+${totalDailyNet.toLocaleString()}` : totalDailyNet.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{filteredDailyAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0) >= 0 ? `+${filteredDailyAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0).toLocaleString()}` : filteredDailyAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className={`mt-2 p-3 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalDailyNet >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
              <span className="text-sm uppercase tracking-wider">Net Total P/L</span>
              <span className="text-xl font-black">{totalDailyNet >= 0 ? `+${totalDailyNet.toLocaleString()}` : totalDailyNet.toLocaleString()}</span>
            </div>
          </div>
        );

      case "Final Sheet":
        const finalAccounts       = finalSheetData?.accounts   || [];
        const masterInfo          = finalSheetData?.masterInfo || null;
        const isMasterEnriched    = !!masterInfo && masterInfo.masterShare > 0;

        const filteredFinalAccounts = finalAccounts.filter(u =>
          u.role === 'user' && (!hideZero || u.green !== 0 || u.red !== 0)
        );

        // Bettors grouped by whether they won or lost overall
        const fsBettorWins   = filteredFinalAccounts.filter(a => a.green > 0);
        const fsBettorLosses = filteredFinalAccounts.filter(a => a.red   > 0);

        // Aggregate totals
        const fsTotalGreenPayout     = fsBettorWins.reduce((s, a) => s + (isMasterEnriched ? (a.netBettorGreen ?? a.green) : a.green), 0);
        const fsTotalRedCollection   = fsBettorLosses.reduce((s, a) => s + (isMasterEnriched ? (a.netBettorRed   ?? a.red)  : a.red),  0);
        const fsTotalParentGreen     = fsBettorWins.reduce((s, a) => s + (a.parentPortionGreen || 0), 0);
        const fsTotalMasterGreen     = fsBettorWins.reduce((s, a) => s + (a.masterPortionGreen ?? a.green), 0);
        const fsTotalAdminGreen      = fsBettorWins.reduce((s, a) => s + (a.adminPortionGreen || 0), 0);
        const fsTotalSuperAdminGreen = fsBettorWins.reduce((s, a) => s + (a.superAdminPortionGreen || 0), 0);
        const fsTotalPlatformFees    = fsBettorWins.reduce((s, a) => s + (a.platformFeeGreen || 0), 0)
                                     + fsBettorLosses.reduce((s, a) => s + (a.platformFeeRed || 0), 0);
        const fsMasterNetPL          = filteredFinalAccounts.reduce((s, a) => s + (a.myProfit ?? a.net ?? 0), 0);

        // ── NON-MASTER / FALLBACK: simple table ──
        if (!isMasterEnriched) {
          const totalFinalGreen = filteredFinalAccounts.reduce((sum, u) => sum + (u.green || 0), 0);
          const totalFinalRed   = filteredFinalAccounts.reduce((sum, u) => sum + (u.red   || 0), 0);
          const totalFinalNet   = filteredFinalAccounts.reduce((sum, u) => sum + (u.net   || 0), 0);
          return (
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
              <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center justify-between">
                <div className="flex items-center gap-2"><List size={16} className="text-gray-700" /> Final Sheet</div>
                <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                  <input type="checkbox" id="hideZeroFSFallback" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#1abc9c]" />
                  <label htmlFor="hideZeroFSFallback">Hide Zero</label>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-[12px] border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Downline</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Green</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Red</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Net</th>
                      <th className="px-3 py-2 font-bold text-gray-700 text-right text-[#1abc9c]">My Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinalAccounts.map((u, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium">{u.name}</td>
                        <td className="px-3 py-2 border-r border-gray-100 text-right font-bold text-green-600">{u.green.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r border-gray-100 text-right font-bold text-red-500">{u.red.toLocaleString()}</td>
                        <td className={`px-3 py-2 border-r border-gray-100 text-right font-bold ${u.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{u.net >= 0 ? `+${u.net.toLocaleString()}` : u.net.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right font-bold ${u.myProfit >= 0 ? 'text-[#1abc9c]' : 'text-red-500'}`}>{u.myProfit >= 0 ? `+${u.myProfit?.toLocaleString()}` : u.myProfit?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredFinalAccounts.length === 0 && (<tr><td colSpan="5" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>)}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalGreen.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalRed.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalNet >= 0 ? `+${totalFinalNet.toLocaleString()}` : totalFinalNet.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{filteredFinalAccounts.reduce((s, u) => s + (u.myProfit || 0), 0) >= 0 ? `+${filteredFinalAccounts.reduce((s, u) => s + (u.myProfit || 0), 0).toLocaleString()}` : filteredFinalAccounts.reduce((s, u) => s + (u.myProfit || 0), 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className={`mt-2 p-3 m-4 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalFinalNet >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
                <span className="text-sm uppercase tracking-wider">Net Total P/L</span>
                <span className="text-xl font-black">{totalFinalNet >= 0 ? `+${totalFinalNet.toLocaleString()}` : totalFinalNet.toLocaleString()}</span>
              </div>
            </div>
          );
        }

        // ── MASTER ENRICHED VIEW ──────────────────────────────────────
        return (
          <div className="flex flex-col gap-4">

            {/* ── Header Info Card ── */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
              <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List size={16} className="text-[#1abc9c]" />
                  <span className="font-bold text-white text-[14px] tracking-wide">Master — Final Settlement Sheet</span>
                </div>
                <div className="flex items-center gap-1 font-normal text-gray-400 text-[11px]">
                  <input type="checkbox" id="hideZeroMasterFS" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#1abc9c]" />
                  <label htmlFor="hideZeroMasterFS" className="cursor-pointer text-gray-300">Hide Zero</label>
                </div>
              </div>

              {/* Share Distribution Info Bar */}
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1abc9c] ring-2 ring-[#1abc9c]/30"></div>
                  <span className="text-gray-600">Me (<span className="font-bold text-gray-800">{masterInfo.masterName}</span>):</span>
                  <span className="bg-[#1abc9c] text-white font-bold px-2 py-0.5 rounded-full">{masterInfo.masterShare}%</span>
                </div>
                <ChevronRight size={12} className="text-gray-300" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-300/40"></div>
                  <span className="text-gray-600">Admin (<span className="font-bold text-gray-800">{masterInfo.parentName}</span>):</span>
                  <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">{masterInfo.parentShare}%</span>
                </div>
                {masterInfo.superAdminEffectiveShare > 0 && (
                  <>
                    <ChevronRight size={12} className="text-gray-300" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-300/40"></div>
                      <span className="text-gray-600">SuperAdmin (<span className="font-bold text-gray-800">{masterInfo.grandParentName}</span>):</span>
                      <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">{masterInfo.superAdminEffectiveShare}%</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                  <span className="text-gray-500">Platform Fee: <span className="font-bold text-orange-500">5%</span></span>
                </div>
              </div>
            </div>

            {/* ── Two-Panel Green / Red Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* ════════ GREEN PANEL ════════ */}
              <div className="flex flex-col bg-white border-2 border-green-400 shadow-sm rounded-sm overflow-hidden">
                {/* Green Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-white" />
                    <span className="font-bold text-white text-[13px] uppercase tracking-wider">Green Side — Bettor Wins</span>
                  </div>
                  <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {fsBettorWins.length} bettor{fsBettorWins.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Green Rows */}
                <div className="flex-1 divide-y divide-green-100">
                  {fsBettorWins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                      <AlertCircle size={24} className="text-gray-300" />
                      <span className="text-[12px] italic">No winning bettors recorded</span>
                    </div>
                  ) : (
                    fsBettorWins.map((a, i) => {
                      const fullPayout   = a.netBettorGreen ?? a.green;
                      const grossWin     = a.grossGreen     || a.green;
                      const platformFee  = a.platformFeeGreen || 0;
                      return (
                        <div key={i} className="px-4 py-3.5 hover:bg-green-50/60 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900 text-[13px]">{a.name}</div>
                              <div className="text-[10px] text-green-600 font-medium mt-0.5">Bettor · Won</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-green-600 text-[16px]">
                                ₹{fullPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {platformFee > 0 && (
                                <div className="text-[10px] text-orange-500 font-medium">
                                  Fee deducted: ₹{platformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          </div>
                          {platformFee > 0 && (
                            <div className="mt-2 pt-2 border-t border-green-100 flex items-center justify-between text-[10px] text-gray-400">
                              <span>Gross win: ₹{grossWin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Net after 5% fee</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Green Footer */}
                <div className="bg-green-600 px-4 py-2.5 flex items-center justify-between mt-auto">
                  <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Paid Out</span>
                  <span className="font-black text-white text-[15px]">
                    ₹{fsTotalGreenPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* ════════ RED PANEL ════════ */}
              <div className="flex flex-col bg-white border-2 border-red-400 shadow-sm rounded-sm overflow-hidden">
                {/* Red Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-white" />
                    <span className="font-bold text-white text-[13px] uppercase tracking-wider">Red Side — Settlement</span>
                  </div>
                  <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Distribution</span>
                </div>

                <div className="flex-1 divide-y divide-red-100">

                  {/* Section A — Bettor Win Distribution (how liability is split upward) */}
                  {fsBettorWins.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-red-50 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Win Liability Split</span>
                      </div>
                      {fsBettorWins.map((a, i) => {
                        const fullPayout       = a.netBettorGreen     ?? a.green;
                        const masterPortion    = a.masterPortionGreen ?? a.green;
                        const parentPortion    = a.parentPortionGreen || 0;
                        const adminPortion     = a.adminPortionGreen  || 0;
                        const saAdminPortion   = a.superAdminPortionGreen || 0;
                        return (
                          <div key={i} className="px-4 py-3 hover:bg-red-50/40 transition-colors">
                            {/* Bettor reference line */}
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                              <span className="text-[10px] text-gray-500">
                                <span className="font-bold text-gray-800">{a.name}</span> won
                                {' '}₹{fullPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {/* Admin row */}
                              {adminPortion > 0 && (
                                <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center">
                                      <Users size={11} className="text-white" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-800 text-[12px]">{masterInfo.parentName}</div>
                                      <div className="text-[10px] text-gray-400">Admin · {masterInfo.parentShare}% share</div>
                                    </div>
                                  </div>
                                  <span className="font-black text-red-600 text-[13px]">
                                    ₹{adminPortion.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              {/* SuperAdmin row */}
                              {saAdminPortion > 0 && (
                                <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                      <Users size={11} className="text-white" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-800 text-[12px]">{masterInfo.grandParentName}</div>
                                      <div className="text-[10px] text-gray-400">SuperAdmin · {masterInfo.superAdminEffectiveShare}% share</div>
                                    </div>
                                  </div>
                                  <span className="font-black text-purple-600 text-[13px]">
                                    ₹{saAdminPortion.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              {/* Master's own absorbed portion */}
                              <div className="flex items-center justify-between bg-[#1abc9c]/10 border border-[#1abc9c]/25 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#1abc9c] flex items-center justify-center">
                                    <Users size={11} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-800 text-[12px]">{masterInfo.masterName} <span className="text-[10px] text-[#1abc9c]">(Me)</span></div>
                                    <div className="text-[10px] text-gray-400">Master · {masterInfo.masterShare}% absorbed</div>
                                  </div>
                                </div>
                                <span className="font-black text-[#1abc9c] text-[13px]">
                                  ₹{masterPortion.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Section B — Bettor losses (master collected) */}
                  {fsBettorLosses.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-orange-50 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Master Collected (Bettor Losses)</span>
                      </div>
                      {fsBettorLosses.map((a, i) => {
                        const collected     = a.netBettorRed    ?? a.red;
                        const masterCollect = a.masterPortionRed ?? a.red;
                        const parentReceive = a.parentPortionRed  || 0;
                        return (
                          <div key={i} className="px-4 py-3 hover:bg-orange-50/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-gray-900 text-[12px]">{a.name}</div>
                                <div className="text-[10px] text-orange-500 font-medium">Bettor · Lost — collected</div>
                              </div>
                              <span className="font-black text-orange-600 text-[14px]">
                                +₹{collected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {(masterCollect > 0 || parentReceive > 0) && (
                              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                                <span>My portion: ₹{masterCollect.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                <span>→ Passed up: ₹{parentReceive.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {filteredFinalAccounts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                      <AlertCircle size={24} className="text-gray-300" />
                      <span className="text-[12px] italic">No settlement data found</span>
                    </div>
                  )}
                </div>

                {/* Red Footer */}
                <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between mt-auto">
                  <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Distributed</span>
                  <span className="font-black text-white text-[15px]">
                    ₹{(fsTotalAdminGreen + fsTotalSuperAdminGreen + fsTotalMasterGreen).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Three-Box Summary ── */}
            {filteredFinalAccounts.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 text-center">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Upward to Admin</div>
                  <div className="font-black text-red-600 text-[16px]">
                    ₹{(fsTotalAdminGreen + fsTotalSuperAdminGreen).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{masterInfo.parentName} + {masterInfo.grandParentName}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 text-center">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 font-bold">My Absorbed ({masterInfo.masterShare}%)</div>
                  <div className="font-black text-[#1abc9c] text-[16px]">
                    ₹{fsTotalMasterGreen.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Master's own share</div>
                </div>
                <div className={`rounded-sm shadow-sm p-3 text-center border-2 ${ fsMasterNetPL >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 font-bold">My Net P/L</div>
                  <div className={`font-black text-[16px] ${fsMasterNetPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fsMasterNetPL >= 0 ? '+' : ''}₹{Math.abs(fsMasterNetPL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{fsMasterNetPL >= 0 ? 'Profit' : 'Loss'}</div>
                </div>
              </div>
            )}

            {/* ── Net P/L Banner ── */}
            <div className={`p-4 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${ fsMasterNetPL >= 0 ? 'bg-gradient-to-r from-green-700 to-green-500' : 'bg-gradient-to-r from-red-700 to-red-500'}`}>
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-wider">Master Net Total P/L</span>
                <span className="text-[11px] opacity-75 font-normal mt-0.5">
                  Platform fees collected: ₹{fsTotalPlatformFees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-2xl font-black">
                {fsMasterNetPL >= 0 ? '+' : ''}₹{Math.abs(fsMasterNetPL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
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
      {renderReportUI()}

      {/* Level 2 Drill Down: Transaction Details Modal */}
      {detailsView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-300 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#1abc9c] w-1 h-6 rounded-full"></div>
              <div>
                <h3 className="font-bold text-gray-800 text-[14px]">
                  {detailsView.bettor} / {detailsView.type === 'cricket' ? 'Cricket-Markets Reports' : 'Casino-Markets Reports'}
                </h3>
              </div>
            </div>
            <button onClick={() => setDetailsView(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isDetailsLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                  <div className="w-8 h-8 border-4 border-[#1abc9c] border-t-transparent rounded-full animate-spin"></div>
                  <p className="animate-pulse">Fetching transaction records...</p>
                </div>
              ) : (
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-gray-300">
                    <tr>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-300 w-[140px]">Date</th>
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-300">Event</th>
                      <th className="px-3 py-2 font-bold text-gray-700 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactionDetails.length > 0 ? transactionDetails.map((tx, idx) => {
                      const netAmount = tx.amount;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-gray-500 border-r border-gray-100">
                            {new Date(tx.createdAt || tx.timestamp).toLocaleString('en-GB', { 
                              day: '2-digit', month: '2-digit', year: 'numeric', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            })}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100 font-medium text-[#1abc9c]">
                            {tx.matchName ? (
                              `${tx.matchName}${tx.selection ? ` (${tx.selection})` : ''}`
                            ) : (
                              (tx.event || tx.description || '').split('|')[0].trim().includes('Share from') 
                              ? ((tx.event || tx.description || '').includes('Casino') ? 'Casino Game' : 'Cricket Match')
                              : (tx.event || tx.description || '').split('|')[0].trim()
                            )}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {netAmount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-20 text-center text-gray-400 italic">
                          No records found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td colSpan="2" className="px-3 py-2 border-r border-[#16a085] uppercase text-[10px]">Total</td>
                      <td className="px-3 py-2 text-right">
                        {transactionDetails.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setDetailsView(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg transition-all active:scale-95 text-xs uppercase tracking-widest">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-gray-500 text-[11px] font-bold mt-4 self-center italic text-center w-full">
        Welcome to Betproexchange Master Portal.
      </div>
    </div>
  );
}
