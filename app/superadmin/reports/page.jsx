"use client";

import React, { useState, useEffect } from "react";
import { Filter, Calendar, Layout, List, CheckSquare, Search, X } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function SuperAdminReports() {
  const [activeReport, setActiveReport] = useState("Daily Report");
  const [hideZero, setHideZero] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ profit: [], loss: [] });
  const [dailyReportData, setDailyReportData] = useState({ profit: [], loss: [] });
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

  const handleClearReport = async () => {
    const periodLabel = reportPeriod === 'daily' ? selectedDate : reportPeriod === 'monthly' ? selectedMonth : selectedYear;
    if (!window.confirm(`Are you sure you want to clear all report data for ${periodLabel}? This cannot be undone.`)) return;

    setIsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/clear-daily-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          month: selectedMonth,
          year: selectedYear,
          reportType: reportPeriod
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchDailyReport();
      } else {
        alert(data.error || "Failed to clear data");
      }
    } catch (err) {
      console.error("Error clearing report:", err);
      alert("Error clearing report data");
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
        const filteredDailyProfit = dailyReportData.profit.filter(u => !hideZero || u.amount !== 0);
        const filteredDailyLoss = dailyReportData.loss.filter(u => !hideZero || u.amount !== 0);
        const totalDailyProfit = filteredDailyProfit.reduce((sum, u) => sum + (u.amount || 0), 0);
        const totalDailyLoss = filteredDailyLoss.reduce((sum, u) => sum + (u.amount || 0), 0);

        return (
          <div className="flex flex-col gap-4">
            {/* 1. Report Type Selector - Matches bpexch tabs */}
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
                    className={`px-3 py-1.5 text-[12px] font-bold rounded-sm shadow-sm transition-all border ${activeReport === btn
                        ? 'bg-[#1abc9c] border-[#1abc9c] text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-[#1abc9c] hover:text-[#1abc9c]'
                      }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Report Filter - Horizontal Bar */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
              <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center gap-2">
                <Filter size={16} className="text-gray-700" />
                Report Filter
              </div>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                  {['daily', 'monthly', 'yearly', 'range'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors border-r last:border-r-0 ${reportPeriod === p ? 'bg-[#1abc9c] text-white border-[#1abc9c]' : 'hover:bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {reportPeriod === 'daily' && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none" />}
                  {reportPeriod === 'monthly' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none" />}
                  {reportPeriod === 'yearly' && (
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px]">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                  {reportPeriod === 'range' && (
                    <div className="flex items-center gap-2">
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px]" />
                      <span className="text-gray-400">-</span>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px]" />
                    </div>
                  )}
                </div>
                <button onClick={fetchDailyReport} className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[12px] font-bold px-4 py-1 rounded shadow-sm">Submit</button>
                <div className="flex items-center gap-1 ml-auto text-gray-600 text-[11px]">
                  <input type="checkbox" id="hideZeroB" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="accent-[#1abc9c]" />
                  <label htmlFor="hideZeroB" className="cursor-pointer">Hide Zero</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Side: Main Report Card */}
              <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col h-fit">
                <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center justify-between">
                  <div className="flex items-center gap-2 uppercase tracking-tight"><Layout size={16} /> Report</div>
                  <button onClick={handleClearReport} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Clear Data</button>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  {/* Profit Table */}
                  <div className="border border-gray-300">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-white border-b border-gray-300 text-left">
                          <th className="px-2 py-1.5 font-bold border-r border-gray-300">Name <span className="text-[9px] ml-1 text-blue-400">▲▼</span></th>
                          <th className="px-2 py-1.5 font-bold">Amount <span className="text-[9px] ml-1 text-gray-400">▲▼</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDailyProfit.map((u, i) => (
                          <tr key={i} className={`border-b border-gray-100 cursor-pointer hover:bg-gray-100 ${expandedUser === u.name ? 'bg-blue-50' : ''}`} onClick={() => { setExpandedUser(u.name); fetchDailyReportDetails(u.name); }}>
                            <td className="px-2 py-1.5 border-r border-gray-100 text-blue-600 font-medium">{u.name}</td>
                            <td className="px-2 py-1.5 text-green-600 font-bold">{u.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1abc9c] text-white font-bold">
                          <td className="px-2 py-1.5 border-r border-[#16a085]">Total</td>
                          <td className="px-2 py-1.5">{totalDailyProfit.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Loss Table */}
                  <div className="border border-gray-300">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-white border-b border-gray-300 text-left">
                          <th className="px-2 py-1.5 font-bold border-r border-gray-300">Name <span className="text-[9px] ml-1 text-blue-400">▲▼</span></th>
                          <th className="px-2 py-1.5 font-bold">Amount <span className="text-[9px] ml-1 text-gray-400">▲▼</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDailyLoss.map((u, i) => (
                          <tr key={i} className={`border-b border-gray-100 cursor-pointer hover:bg-gray-100 ${expandedUser === u.name ? 'bg-red-50' : ''}`} onClick={() => { setExpandedUser(u.name); fetchDailyReportDetails(u.name); }}>
                            <td className="px-2 py-1.5 border-r border-gray-100 text-blue-600 font-medium">{u.name}</td>
                            <td className="px-2 py-1.5 text-red-500 font-bold">{u.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#e74c3c] text-white font-bold">
                          <td className="px-2 py-1.5 border-r border-[#c0392b]">Total</td>
                          <td className="px-2 py-1.5">{totalDailyLoss.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Detail Sections */}
              <div className="flex flex-col gap-4">
                {expandedUser ? (
                  <>
                    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
                      <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center gap-2">
                        <Layout size={16} /> {expandedUser} - Sportwise Report
                      </div>
                      <div className="p-3">
                        <table className="w-full text-[12px] border border-gray-300">
                          <thead>
                            <tr className="bg-white border-b border-gray-300 text-left">
                              <th className="px-3 py-1.5 font-bold border-r border-gray-300">Event</th>
                              <th className="px-3 py-1.5 font-bold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const userObj = [...dailyReportData.profit, ...dailyReportData.loss].find(u => u.name === expandedUser);
                              return (
                                <>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-3 py-1.5 border-r border-gray-100 text-green-600 font-medium">Cricket</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-gray-700">{userObj?.breakdown?.cricket?.net?.toLocaleString() || '0'}</td>
                                  </tr>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-3 py-1.5 border-r border-gray-100 text-green-600 font-medium text-opacity-80">Casino</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-gray-700">{userObj?.breakdown?.casino?.net?.toLocaleString() || '0'}</td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                          <tfoot>
                            <tr className="bg-[#1abc9c] text-white font-bold">
                              <td className="px-3 py-1.5 border-r border-[#16a085] uppercase">Total</td>
                              <td className="px-3 py-1.5 text-right">
                                {(() => {
                                  const userObj = [...dailyReportData.profit, ...dailyReportData.loss].find(u => u.name === expandedUser);
                                  return (userObj?.breakdown?.totalNet || 0).toLocaleString();
                                })()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
                      <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center gap-2">
                        <Layout size={16} /> {expandedUser} / Cricket-Markets Reports
                      </div>
                      <div className="p-3">
                        <table className="w-full text-[11px] border border-gray-300">
                          <thead>
                            <tr className="bg-white border-b border-gray-300 text-left">
                              <th className="px-2 py-1.5 font-bold border-r border-gray-300">Date</th>
                              <th className="px-2 py-1.5 font-bold border-r border-gray-300">Event</th>
                              <th className="px-2 py-1.5 font-bold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isDetailsLoading ? (
                              <tr><td colSpan="3" className="py-10 text-center text-gray-400">Loading...</td></tr>
                            ) : transactionDetails.map((t, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-2 py-1.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">
                                  {new Date(t.timestamp || t.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-2 py-1.5 border-r border-gray-100 text-blue-600 font-medium">
                                  {t.event || t.description} {t.selection ? `(${t.selection})` : ''}
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold text-gray-700">{Math.abs(t.amount).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 rounded text-gray-400 italic text-sm">
                    Select a user to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "Final Sheet":
  const filteredProfit = finalSheetData.profit.filter(u => (!hideZero || u.amount !== 0) && u.role !== 'user');
  const filteredLoss = finalSheetData.loss.filter(u => u.role !== 'user');
  const totalProfit = filteredProfit.reduce((sum, u) => sum + (u.amount || 0), 0);
  const totalLoss = filteredLoss.reduce((sum, u) => sum + (u.amount || 0), 0);

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
      <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
        <div className="flex items-center gap-2 mb-1">
          <List size={16} className="text-gray-700" />
          SuperAdmin - Final Sheet
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
                    {u.name}
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
            {filteredLoss.map((u, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 border-r border-gray-100 text-red-500 font-bold">{u.name}</td>
                  <td className="px-3 py-2 text-red-500 font-bold">{u.amount.toLocaleString()}</td>
                </tr>
              ))}
              {filteredLoss.length === 0 && (
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
      <div className={`p-3 m-4 mt-0 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalProfit - totalLoss >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
        <span className="text-sm uppercase tracking-wider">Net Total P/L</span>
        <span className="text-xl font-black">{(totalProfit - totalLoss).toLocaleString()}</span>
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
            <div className={`p-3 m-4 mt-0 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalDailyProfit - totalDailyLoss >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
              <span className="text-sm uppercase tracking-wider">Net Total P/L</span>
              <span className="text-xl font-black">{(totalDailyProfit - totalDailyLoss).toLocaleString()}</span>
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
            className={`px-3 py-1.5 text-[12px] font-bold rounded-sm shadow-sm transition-all border ${activeReport === btn
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

    <div className="text-gray-500 text-[11px] font-bold mt-4 self-center italic">
      Welcome to Betproexchange SuperAdmin Portal.
    </div>

    {/* Transaction Details Modal */}
    {detailsView && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
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

          <div className="flex-1 overflow-y-auto p-6">
            {isDetailsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-blue-600 animate-pulse">
                <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold uppercase text-xs tracking-widest">Fetching details...</p>
              </div>
            ) : transactionDetails.length > 0 ? (
              <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-300 text-left text-gray-700 font-bold">
                      <th className="px-3 py-2 border-r border-gray-300 w-[140px]">Date</th>
                      <th className="px-3 py-2 border-r border-gray-300">Event</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionDetails.map((t, idx) => {
                      const netAmount = t.amount; // Positive = Master Profit
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 border-r border-gray-100 text-gray-500">
                            {new Date(t.timestamp || t.createdAt).toLocaleString('en-GB', { 
                              day: '2-digit', month: '2-digit', year: 'numeric', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            })}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100 font-medium text-[#1abc9c]">
                            {t.matchName ? (
                              `${t.matchName}${t.selection ? ` (${t.selection})` : ''}`
                            ) : (
                              (t.event || t.description || '').split('|')[0].trim().includes('Share from') 
                              ? ((t.event || t.description || '').includes('Casino') ? 'Casino Game' : 'Cricket Match')
                              : (t.event || t.description || '').split('|')[0].trim()
                            )}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {netAmount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
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
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-gray-300 mb-3 flex justify-center"><Search size={48} /></div>
                <p className="text-gray-500 font-bold italic">No detailed transactions found for this period.</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
            <button
              onClick={() => setDetailsView(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
