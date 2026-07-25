"use client";

import React, { useState, useEffect } from "react";
import { Filter, Calendar, Layout, List, CheckSquare, X, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Users } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";
import FinalSheet from "@/components/FinalSheet";
import AccountLedger from "@/components/AccountLedger";

export default function MasterReports() {
  const [activeReport, setActiveReport] = useState("Daily Report");
  const [hideZero, setHideZero] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ accounts: [] });
  const [dailyReportData, setDailyReportData] = useState({ accounts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [commissionData, setCommissionData] = useState([]);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const reportTypes = [
    'Book Detail', 'Book Detail 2', 'Daily PL', 'Daily Report', 'Final Sheet', 'Accounts', 'Account Ledger', 'Commission Report'
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
      let url = `${getApiUrl()}/api/admin/final-sheet?reportType=${reportPeriod}`;
      if (reportPeriod === 'daily') url += `&date=${selectedDate}`;
      else if (reportPeriod === 'monthly') url += `&month=${selectedMonth}`;
      else if (reportPeriod === 'yearly') url += `&year=${selectedYear}`;
      else if (reportPeriod === 'range') url += `&startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(url, {
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

  useEffect(() => {
    if (activeReport === "Final Sheet") {
      setReportPeriod("all");
      fetchFinalSheet();
    } else if (activeReport === "Commission Report") {
      fetchCommissionReport();
    } else if (activeReport === "Daily Report") {
      setReportPeriod("daily");
      fetchDailyReport();
    }
  }, [activeReport, selectedDate, selectedMonth, selectedYear, reportPeriod, startDate, endDate]);

  // Report filters object to pass to FinalSheet for drill-down
  const reportFiltersObj = {
    reportPeriod,
    selectedDate,
    selectedMonth,
    selectedYear,
    startDate,
    endDate
  };

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
                  {['all', 'daily', 'monthly', 'yearly', 'range'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors border-r last:border-r-0 ${
                        reportPeriod === p ? 'bg-[#f39c12] text-white border-[#f39c12]' : 'hover:bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {p === 'all' ? 'All Time' : p}
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
              </div>
            </div>

            {/* Green/Red Two-Panel Daily Report using FinalSheet */}
            <FinalSheet data={dailyReportData} title="Daily Report" reportFilters={reportFiltersObj} />
          </div>
        );

      case "Final Sheet":
        return <FinalSheet data={finalSheetData} reportFilters={reportFiltersObj} />;

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

      case "Accounts":
      case "Account Ledger":
        return <AccountLedger />;

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

      <div className="text-gray-500 text-[11px] font-bold mt-4 self-center italic text-center w-full">
        Welcome to Betproexchange Master Portal.
      </div>
    </div>
  );
}
