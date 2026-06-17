"use client";

import React, { useState, useEffect } from "react";
import { Filter, Calendar, Layout, List, CheckSquare, X } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState("Daily Report");
  const [hideZero, setHideZero] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ accounts: [] });
  const [dailyReportData, setDailyReportData] = useState({ accounts: [] });
  const [showParentFor, setShowParentFor] = useState(null); // Track clicked user to keep parent visible
  const [isLoading, setIsLoading] = useState(false);
  const [commissionData, setCommissionData] = useState([]);
  const [reportPeriod, setReportPeriod] = useState("daily"); // daily, monthly, yearly, range
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedUser, setExpandedUser] = useState(null); // For level 1 drill down (Cricket/Casino summary)
  const [detailsView, setDetailsView] = useState(null); // For level 2 drill down (Transaction history) { bettor, type }
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
        const finalAccounts = finalSheetData?.accounts || [];
        const filteredFinalAccounts = finalAccounts.filter(u => !hideZero || u.green !== 0 || u.red !== 0 || u.net !== 0);
        const totalFinalGreen = filteredFinalAccounts.reduce((sum, u) => sum + (u.green || 0), 0);
        const totalFinalRed = filteredFinalAccounts.reduce((sum, u) => sum + (u.red || 0), 0);
        const totalFinalNet = filteredFinalAccounts.reduce((sum, u) => sum + (u.net || 0), 0);

        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              <div className="flex items-center gap-2 mb-1">
                <List size={16} className="text-gray-700" />
                Admin - Final Sheet
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
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-[12px] border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Downline</th>
                    <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Downline Owes You (Green)</th>
                    <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">You Owe Downline (Red)</th>
                    <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 text-right">Settlement Net</th>
                    <th className="px-3 py-2 font-bold text-gray-700 text-right text-[#1abc9c]">My Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinalAccounts.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium">
                        {u.name}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right font-bold text-green-600">
                        {u.green.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right font-bold text-red-500">
                        {u.red.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 border-r border-gray-100 text-right font-bold ${u.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {u.net >= 0 ? `+${u.net.toLocaleString()}` : u.net.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 text-right font-bold ${u.myProfit >= 0 ? 'text-[#1abc9c]' : 'text-red-500'}`}>
                        {u.myProfit >= 0 ? `+${u.myProfit?.toLocaleString()}` : u.myProfit?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredFinalAccounts.length === 0 && (
                    <tr><td colSpan="4" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1abc9c] text-white font-bold">
                    <td className="px-3 py-2 border-r border-teal-600">Total</td>
                    <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalGreen.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalRed.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right border-r border-teal-600">{totalFinalNet >= 0 ? `+${totalFinalNet.toLocaleString()}` : totalFinalNet.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{filteredFinalAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0) >= 0 ? `+${filteredFinalAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0).toLocaleString()}` : filteredFinalAccounts.reduce((sum, u) => sum + (u.myProfit || 0), 0).toLocaleString()}</td>
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
                      const netAmount = tx.amount; // Positive = Master Profit
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
        Welcome to Betproexchange Admin Portal.
      </div>
    </div>
  );
}
