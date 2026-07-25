"use client";

import React, { useState, useEffect, useRef } from "react";
import { Filter, Calendar, Printer, FileSpreadsheet, FileText, Search, ChevronDown, ChevronUp, ArrowUpDown, UserCheck, Layers, CreditCard } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function AccountLedger({ defaultUsername = "" }) {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [downlineUsers, setDownlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(defaultUsername);
  const [activeUsername, setActiveUsername] = useState(defaultUsername);
  const [txType, setTxType] = useState("credit_cash"); // 'credit_cash' (DEFAULT), 'all', 'bets'
  
  // Date states formatted for datetime-local input YYYY-MM-DDTHH:mm
  const getTodayStartStr = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getTodayEndStr = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [startDateStr, setStartDateStr] = useState(getTodayStartStr());
  const [endDateStr, setEndDateStr] = useState(getTodayEndStr());

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination & Filtering & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const printRef = useRef(null);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session");
      if (session) {
        try {
          return JSON.parse(session).token;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const getCurrentSessionUser = () => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session");
      if (session) {
        try {
          return JSON.parse(session).username;
        } catch (e) {
          return "";
        }
      }
    }
    return "";
  };

  // Quick Preset Date Helpers
  const handlePresetDate = (type) => {
    const d = new Date();
    let start, end;

    if (type === "today") {
      start = getTodayStartStr();
      end = getTodayEndStr();
    } else if (type === "yesterday") {
      const yStart = new Date(d.setDate(d.getDate() - 1));
      yStart.setHours(0, 0, 0, 0);
      const yEnd = new Date(yStart);
      yEnd.setHours(23, 59, 59, 999);

      const tzOffsetS = yStart.getTimezoneOffset() * 60000;
      const tzOffsetE = yEnd.getTimezoneOffset() * 60000;
      start = new Date(yStart.getTime() - tzOffsetS).toISOString().slice(0, 16);
      end = new Date(yEnd.getTime() - tzOffsetE).toISOString().slice(0, 16);
    } else if (type === "7days") {
      const startD = new Date(d.setDate(d.getDate() - 7));
      startD.setHours(0, 0, 0, 0);
      const tzOffset = startD.getTimezoneOffset() * 60000;
      start = new Date(startD.getTime() - tzOffset).toISOString().slice(0, 16);
      end = getTodayEndStr();
    }

    setStartDateStr(start);
    setEndDateStr(end);
    setCurrentPage(1);
    fetchLedger(selectedUser, start, end, txType);
  };

  // Fetch Downline Users for dropdown
  const fetchDownlines = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      let res = await fetch(`${getApiUrl()}/api/admin/downline-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        res = await fetch(`${getApiUrl()}/api/user/downline-list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res.ok) {
        const data = await res.json();
        setDownlineUsers(data.users || []);
        if (!selectedUser && data.users && data.users.length > 0) {
          setSelectedUser(data.users[0].username);
          setActiveUsername(data.users[0].username);
        }
      }
    } catch (err) {
      console.error("Error fetching downlines:", err);
    }
  };

  // Fetch Account Ledger Data
  const fetchLedger = async (targetUser, sDate, eDate, currentTxType) => {
    setLoading(true);
    setErrorMsg("");
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const queryUser = targetUser || selectedUser || getCurrentSessionUser();
      const typeFilter = currentTxType || txType;
      
      let url = `${getApiUrl()}/api/admin/account-ledger?targetUsername=${encodeURIComponent(queryUser)}&txType=${typeFilter}`;
      if (sDate) url += `&startDate=${encodeURIComponent(new Date(sDate).toISOString())}`;
      if (eDate) url += `&endDate=${encodeURIComponent(new Date(eDate).toISOString())}`;

      let res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok && res.status === 404) {
        let fallbackUrl = `${getApiUrl()}/api/user/account-ledger?targetUsername=${encodeURIComponent(queryUser)}&txType=${typeFilter}`;
        if (sDate) fallbackUrl += `&startDate=${encodeURIComponent(new Date(sDate).toISOString())}`;
        if (eDate) fallbackUrl += `&endDate=${encodeURIComponent(new Date(eDate).toISOString())}`;
        res = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setLedgerEntries(data.entries || []);
        setActiveUsername(data.username || queryUser);
      } else {
        setErrorMsg(data.error || "Failed to load account ledger");
        setLedgerEntries([]);
      }
    } catch (err) {
      console.error("Account Ledger fetch error:", err);
      setErrorMsg("Network error fetching account ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sessionUser = getCurrentSessionUser();
    if (!selectedUser) {
      setSelectedUser(sessionUser);
      setActiveUsername(sessionUser);
    }
    fetchDownlines();
    fetchLedger(selectedUser || sessionUser, startDateStr, endDateStr, txType);
  }, []);

  const handleSubmitFilter = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchLedger(selectedUser, startDateStr, endDateStr, txType);
  };

  // Client-side search & filtering
  const filteredEntries = ledgerEntries.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const descStr = (item.description || "").toLowerCase();
    const dateStr = (item.date || "").toLowerCase();
    const userStr = (item.username || "").toLowerCase();
    const perfStr = (item.performedBy || "").toLowerCase();
    const amountStr = (item.amount !== undefined ? item.amount.toString() : "");
    const balanceStr = (item.balance !== undefined ? item.balance.toString() : "");
    return descStr.includes(q) || dateStr.includes(q) || userStr.includes(q) || perfStr.includes(q) || amountStr.includes(q) || balanceStr.includes(q);
  });

  // Sorting
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "amount" || sortField === "balance" || sortField === "id") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalEntries = sortedEntries.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedEntries.slice(indexOfFirstEntry, indexOfLastEntry);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!sortedEntries || sortedEntries.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#,Date,Account,Description,Amount,Performed By,Balance\n";

    sortedEntries.forEach((row) => {
      const cleanDesc = `"${(row.description || "").replace(/"/g, '""')}"`;
      csvContent += `${row.id},${row.date},${row.username || ""},${cleanDesc},${row.amount},${row.performedBy || ""},${row.balance}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeUsername}_Credit_Cash_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Window
  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (val) => {
    if (val === undefined || val === null) return "0";
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full min-h-screen bg-[#eef2f5] p-2 md:p-4 text-gray-800 text-sm font-sans">
      {/* 1. REPORT FILTER ACCORDION BAR */}
      <div className="bg-[#ffffff] border border-gray-300 rounded shadow-sm mb-4 overflow-hidden">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full bg-[#34495e] text-white px-4 py-2.5 flex items-center justify-between font-bold text-base tracking-wide hover:bg-[#2c3e50] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <span>Report Filter & Category Selection</span>
          </div>
          {isFilterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isFilterOpen && (
          <form onSubmit={handleSubmitFilter} className="p-4 bg-[#f8f9fa] border-t border-gray-200 space-y-4">
            {/* Top Row: Account & Category Type */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Downline User Selector */}
              <div className="flex items-center gap-2">
                <label className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={14} className="text-[#1abc9c]" /> Target Account:
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-800 text-xs rounded px-3 py-2 font-bold focus:outline-none focus:border-[#1abc9c] shadow-sm min-w-[200px]"
                >
                  <option value="ALL">ALL ACCOUNTS (Summary)</option>
                  {downlineUsers.map((u) => (
                    <option key={u._id || u.username} value={u.username}>
                      {u.username} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={14} className="text-[#00b074]" /> Report Type:
                </label>
                <select
                  value={txType}
                  onChange={(e) => {
                    setTxType(e.target.value);
                    setCurrentPage(1);
                    fetchLedger(selectedUser, startDateStr, endDateStr, e.target.value);
                  }}
                  className="bg-[#e8f8f5] border border-[#1abc9c] text-[#007955] font-extrabold text-xs rounded px-3 py-2 focus:outline-none shadow-sm"
                >
                  <option value="credit_cash">💳 Credit & Cash Transfers Only</option>
                  <option value="all">🌐 All Activity (Transfers + Bets)</option>
                  <option value="bets">🎲 Bets & Game Rounds Only</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Date Inputs + Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-3">
              <span className="font-semibold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                <Calendar size={14} className="text-gray-500" /> Date Range:
              </span>

              {/* Date From */}
              <input
                type="datetime-local"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 text-xs rounded px-3 py-2 font-medium focus:outline-none focus:border-[#00b074] shadow-sm"
              />

              <span className="text-gray-500 font-bold">-</span>

              {/* Date To */}
              <input
                type="datetime-local"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 text-xs rounded px-3 py-2 font-medium focus:outline-none focus:border-[#00b074] shadow-sm"
              />

              {/* Quick Preset Date Buttons */}
              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => handlePresetDate("today")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("yesterday")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded transition-colors"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("7days")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded transition-colors"
                >
                  Last 7 Days
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-[#00b074] hover:bg-[#009663] text-white font-bold text-xs px-6 py-2 rounded shadow transition-colors uppercase tracking-wider ml-auto"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. ACCOUNT TITLE SUBHEAD */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-black text-[#2c3e50] tracking-tight">
          {activeUsername === "ALL" ? "ALL DOWNLINE ACCOUNTS" : activeUsername || "Account"} -{" "}
          <span className="font-semibold text-[#00b074]">
            {txType === "credit_cash"
              ? "Credit & Cash Ledger"
              : txType === "bets"
              ? "Bets History"
              : "Complete Account Ledger"}
          </span>
        </h1>

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
          Showing: {txType === "credit_cash" ? "Credit & Cash Deposits / Withdrawals" : txType === "bets" ? "Bets Only" : "All Entries"}
        </div>
      </div>

      {/* 3. TOOLBAR CONTROLS BAR */}
      <div className="bg-white border border-gray-200 rounded-t shadow-sm p-3 flex flex-wrap items-center justify-between gap-3 border-b-0">
        {/* Left: Entries per page */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-gray-300 text-gray-800 rounded px-2 py-1 focus:outline-none focus:border-[#34495e]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries per page</span>
        </div>

        {/* Center: Print, Excel, PDF Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            className="bg-[#4e5d6c] hover:bg-[#3b4753] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors italic flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-[#4e5d6c] hover:bg-[#3b4753] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors italic flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button
            onClick={handlePrint}
            className="bg-[#4e5d6c] hover:bg-[#3b4753] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors italic flex items-center gap-1.5 shadow-sm"
          >
            <FileText size={13} /> PDF
          </button>
        </div>

        {/* Right: Search Box */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <label>Search:</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter entries..."
              className="bg-white border border-gray-300 text-gray-800 text-xs rounded px-2 py-1 pr-6 focus:outline-none focus:border-[#00b074] min-w-[150px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. LEDGER DATA TABLE (DESKTOP) & CARDS (MOBILE) */}
      <div className="bg-white border border-gray-200 rounded-b shadow-sm overflow-hidden" ref={printRef}>
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-semibold">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#00b074] border-t-transparent mb-2"></div>
            <p>Loading Credit & Cash Ledger...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-red-600 font-semibold bg-red-50 border border-red-200 m-4 rounded">
            {errorMsg}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider">
                    <th
                      onClick={() => handleSort("id")}
                      className="py-3 px-4 text-center cursor-pointer hover:bg-gray-200 transition-colors w-14"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>#</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("date")}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date & Time</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("username")}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Account</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("description")}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Description / Type</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("amount")}
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("balance")}
                      className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Running Balance</span>
                        <ArrowUpDown size={12} className="opacity-40" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 font-medium italic">
                        No credit or cash transactions found for the selected filter & date range.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((row) => {
                      const isNegativeAmount = Number(row.amount) < 0;
                      const isNegativeBalance = Number(row.balance) < 0;

                      return (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-gray-600">{row.id}</td>
                          <td className="py-3 px-4 text-gray-700 font-medium whitespace-nowrap">{row.date}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{row.username || activeUsername}</td>
                          <td className="py-3 px-4 font-semibold text-[#00a65a] hover:underline cursor-pointer">
                            {row.description}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                              isNegativeAmount ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            {formatNumber(row.amount)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                              isNegativeBalance ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {formatNumber(row.balance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-200 bg-[#f4f6f8] p-2 space-y-3">
              {currentEntries.length === 0 ? (
                <div className="p-6 text-center text-gray-500 font-medium bg-white rounded border">
                  No credit or cash transactions found.
                </div>
              ) : (
                currentEntries.map((row) => {
                  const isNegativeAmount = Number(row.amount) < 0;
                  const isNegativeBalance = Number(row.balance) < 0;

                  return (
                    <div
                      key={row.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col gap-2"
                    >
                      {/* Top Row: Index Circle badge + Timestamp + Description */}
                      <div className="flex items-start gap-2 border-b border-gray-100 pb-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {row.id}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                            <span>{row.date}</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold">{row.username}</span>
                          </div>
                          <div className="text-sm font-bold text-[#00a65a] leading-tight mt-1">
                            {row.description}
                          </div>
                        </div>
                      </div>

                      {/* Amount Row */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-gray-700">Amount</span>
                        <span
                          className={`font-black text-sm ${
                            isNegativeAmount ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {formatNumber(row.amount)}
                        </span>
                      </div>

                      {/* Balance Row */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-gray-200">
                        <span className="font-bold text-gray-700">Balance</span>
                        <span
                          className={`font-black text-sm ${
                            isNegativeBalance ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {formatNumber(row.balance)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. FOOTER & PAGINATION */}
            <div className="bg-[#f8f9fa] border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-gray-600 font-semibold">
                Showing {totalEntries === 0 ? 0 : indexOfFirstEntry + 1} to{" "}
                {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 font-bold"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 font-bold"
                >
                  ‹
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showDots = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showDots && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded font-bold transition-colors ${
                            currentPage === page
                              ? "bg-[#00b074] text-white border border-[#00b074] shadow-sm"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 font-bold"
                >
                  ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 font-bold"
                >
                  »
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
