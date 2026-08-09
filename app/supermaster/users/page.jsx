"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Edit2, X, DollarSign, Calendar, Layout, List } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuperMasterUsers() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newType, setNewType] = useState("master");
  const [initialBalance, setInitialBalance] = useState("0");
  const [newBalanceType, setNewBalanceType] = useState("cash");
  const [newShare, setNewShare] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  // Load Balance Modal State
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cash"); // "cash" or "credit"
  const [selectedUser, setSelectedUser] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");

  // Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Settle Account Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleDescription, setSettleDescription] = useState("P/L to Cash transfer");
  const [isSettling, setIsSettling] = useState(false);

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(settleAmount);
    if (!selectedUser || !settleAmount || isNaN(val) || val === 0) {
      alert("Please enter a valid non-zero settlement amount");
      return;
    }
    setIsSettling(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/settle-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUsername: selectedUser.username,
          amount: parseFloat(settleAmount),
          description: settleDescription || "P/L to Cash transfer"
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Account settled successfully!");
        setIsSettleModalOpen(false);
        setSettleAmount("");
        setSelectedUser(null);
        fetchUsers();
        window.dispatchEvent(new Event('wallet-updated'));
      } else {
        alert(data.error || "Failed to settle account");
      }
    } catch (err) {
      console.error("Settle Account Error:", err);
      alert("An error occurred while settling account");
    } finally {
      setIsSettling(false);
    }
  };

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editShare, setEditShare] = useState("0");

  const [activeReportType, setActiveReportType] = useState("Accounts");
  const [hideZero, setHideZero] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ accounts: [] });
  const [dailyReportData, setDailyReportData] = useState({ profit: [], loss: [] });
  const [isFinalSheetLoading, setIsFinalSheetLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPeriod, setReportPeriod] = useState("daily"); // daily, monthly, yearly, range
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [detailsView, setDetailsView] = useState(null); // { bettor, type }
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const fetchFinalSheet = async () => {
    setIsFinalSheetLoading(true);
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
        const accounts = [];
        if (data.greenEntries) {
          data.greenEntries.forEach(e => {
            accounts.push({ name: e.accountName, net: e.amount, role: e.role });
          });
        }
        if (data.redEntries) {
          data.redEntries.forEach(e => {
            accounts.push({ name: e.accountName, net: -e.amount, role: e.role });
          });
        }
        setFinalSheetData({ ...data, accounts });
      }
    } catch (err) {
      console.error("Error fetching final sheet:", err);
    } finally {
      setIsFinalSheetLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    setReportLoading(true);
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
        const profit = (data.greenEntries || []).map(e => ({ name: e.accountName, amount: e.amount, role: e.role, parent: e.parentName || 'None', breakdown: e.breakdown }));
        const loss = (data.redEntries || []).map(e => ({ name: e.accountName, amount: e.amount, role: e.role, parent: e.parentName || 'None', breakdown: e.breakdown }));
        setDailyReportData({ ...data, profit, loss });
      }
    } catch (err) {
      console.error("Error fetching daily report:", err);
    } finally {
      setReportLoading(false);
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

  const fetchReportData = async () => {
    if (activeReportType === "Commission Report") {
      setReportLoading(true);
      const token = getAuthToken();
      try {
        const res = await fetch(`${getApiUrl()}/api/admin/commission-report`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setReportData(data);
        }
      } catch (err) {
        console.error("Report Fetch Error:", err);
      } finally {
        setReportLoading(false);
      }
    } else if (activeReportType === "Final Sheet") {
      if (reportPeriod !== "all") setReportPeriod("all");
      fetchFinalSheet();
    } else if (activeReportType === "Daily Report" || activeReportType === "Daily PL") {
      fetchDailyReport();
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReportType, selectedDate, selectedMonth, selectedYear, reportPeriod, startDate, endDate]);

  const getAuthToken = () => {
    const raw = localStorage.getItem("user_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentParentInfo, setCurrentParentInfo] = useState(null);

  const fetchUsers = async (targetUsername = null) => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      let url = `${getApiUrl()}/api/admin/downline`;
      if (targetUsername) {
        url += `?username=${encodeURIComponent(targetUsername)}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) {
          setUsers(data);
          setBreadcrumbs([]);
          setCurrentParentInfo(null);
        } else {
          setUsers(data.users || []);
          setBreadcrumbs(data.breadcrumbs || []);
          setCurrentParentInfo(data.parentInfo || null);
        }
      } else if (res.status === 401 || data.error === 'User not found' || data.error === 'Token is not valid') {
        console.warn("Session invalid or user not found. Redirecting to login...");
        localStorage.removeItem("user_session");
        document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
        window.location.replace("/login");
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const query = searchParams ? searchParams.get("search") : null;
    if (query) {
      setSearchQuery(query);
      fetchUsers(query);
    } else {
      fetchUsers();
    }
  }, [searchParams]);

  const handleSearchSubmit = (overrideQuery) => {
    const queryToUse = typeof overrideQuery === "string" ? overrideQuery : searchQuery;
    const trimmed = queryToUse.trim();
    setShowSuggestions(false);
    if (trimmed) {
      fetchUsers(trimmed);
    } else {
      fetchUsers();
    }
    setTimeout(() => {
      document.getElementById("clients-list-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const matchingSuggestions = users.filter(u =>
    searchQuery.trim() && u.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const displayUsers = users.filter(u => 
    !searchQuery.trim() || u.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setIsSaving(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newType,
          initialBalance: parseFloat(initialBalance),
          balanceType: newBalanceType,
          share: parseFloat(newShare) || 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setNewUsername("");
        setNewPassword("");
        setInitialBalance("0");
        setNewBalanceType("cash");
        setNewShare("0");
        fetchUsers();
        window.dispatchEvent(new Event('wallet-updated'));
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBalanceUpdate = async (e, mode, tab) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amount = mode === "add" ? depositAmount : withdrawAmount;
    const desc = mode === "add" ? depositDescription : withdrawDescription;

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSaving(true);
    const token = getAuthToken();
    if (!token) return;

    const endpoint = mode === "add" ? "/api/admin/load-balance" : "/api/admin/withdraw-balance";

    try {
      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUsername: selectedUser.username,
          amount: parseFloat(amount),
          description: desc,
          type: tab
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsLoadModalOpen(false);
        setDepositAmount("");
        setWithdrawAmount("");
        setDepositDescription("");
        setWithdrawDescription("");
        setSelectedUser(null);
        fetchUsers();
        window.dispatchEvent(new Event('wallet-updated'));
      } else {
        alert(data.error || `Failed to ${mode} balance`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing balance:`, error);
      alert(`Failed to ${mode} balance. Check connection.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete) return;

    setIsSaving(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/remove-user/${userToDelete.username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUsername: selectedUser.username,
          password: editPassword || undefined,
          share: editShare ? parseFloat(editShare) : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditPassword("");
        setEditShare("0");
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUserStatement = async (username) => {
    setIsLedgerLoading(true);
    setLedgerTransactions([]);
    setIsLedgerModalOpen(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/user-statement/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLedgerTransactions(data);
      } else {
        alert(data.error || "Failed to fetch ledger");
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const handleToggleStatus = async (username, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUsername: username, status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle status");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling status");
    }
  };

  const renderReportUI = () => {
    switch (activeReportType) {
      case "Daily Report":
      case "Daily PL":
        const filteredDailyProfit = (dailyReportData.profit || []).filter(u => !hideZero || u.amount !== 0);
        const filteredDailyLoss = (dailyReportData.loss || []).filter(u => !hideZero || u.amount !== 0);
        const totalDailyProfit = filteredDailyProfit.reduce((sum, u) => sum + (u.amount || 0), 0);
        const totalDailyLoss = filteredDailyLoss.reduce((sum, u) => sum + (u.amount || 0), 0);

        return (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Report Filter Section */}
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
                      className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors border-r last:border-r-0 ${reportPeriod === p ? 'bg-[#f39c12] text-white border-[#f39c12]' : 'hover:bg-gray-100 text-gray-600 border-gray-300'
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
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#f39c12]"
                    />
                  )}
                  {reportPeriod === 'monthly' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#f39c12]"
                    />
                  )}
                  {reportPeriod === 'yearly' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#f39c12]"
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
                        className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#f39c12]"
                      />
                      <span className="text-gray-400 text-[12px]">-</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#f39c12]"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchDailyReport}
                  className="bg-[#f39c12] hover:bg-orange-600 text-white text-[12px] font-bold px-4 py-1 rounded shadow-sm transition-colors"
                >
                  Submit
                </button>

                <div className="flex items-center gap-1 ml-auto font-normal text-gray-600 text-[11px]">
                  <input
                    type="checkbox"
                    id="hideZeroDaily"
                    checked={hideZero}
                    onChange={(e) => setHideZero(e.target.checked)}
                    className="w-3 h-3 accent-[#f39c12]"
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profit Table */}
                <div className="border border-gray-200">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left font-bold text-gray-700">
                        <th className="px-3 py-2 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                        <th className="px-3 py-2">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDailyProfit.map((u, i) => (
                        <React.Fragment key={`profit-${i}`}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium">{u.name}</td>
                            <td
                              className={`px-3 py-2 font-bold cursor-pointer hover:bg-green-50 transition-all duration-200 border-l border-gray-100 ${u.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedUser(expandedUser === u.name ? null : u.name);
                              }}
                            >
                              <div className="flex items-center justify-between pointer-events-none">
                                <span>{u.amount.toLocaleString()}</span>
                                <span className={`text-[10px] transition-transform duration-300 ${expandedUser === u.name ? 'rotate-180 text-[#f39c12]' : 'text-gray-400'}`}>
                                  ▼
                                </span>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                      {filteredDailyProfit.length === 0 && (
                        <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found for this date</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f39c12] text-white font-bold">
                        <td className="px-3 py-2 border-r border-orange-600">Total</td>
                        <td className="px-3 py-2">{totalDailyProfit.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Loss Table */}
                <div className="border border-gray-200">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left font-bold text-gray-700">
                        <th className="px-3 py-2 border-r border-gray-200">Name <span className="text-[10px] ml-1">▲▼</span></th>
                        <th className="px-3 py-2">Amount <span className="text-[10px] ml-1">▲▼</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDailyLoss.map((u, i) => (
                        <tr key={`loss-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 border-r border-gray-100 text-red-500 font-bold">{u.name}</td>
                          <td className="px-3 py-2 text-red-500 font-bold">
                            {u.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {filteredDailyLoss.length === 0 && (
                        <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found for this date</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#e74c3c] text-white font-bold">
                        <td className="px-3 py-2 border-r border-red-400">Total</td>
                        <td className="px-3 py-2">{totalDailyLoss.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className={`mt-2 p-3 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalDailyLoss - totalDailyProfit >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
              <span className="text-sm uppercase tracking-wider">SuperMaster Net Total P/L</span>
              <span className="text-xl font-black">{(totalDailyLoss - totalDailyProfit).toLocaleString()}</span>
            </div>
          </div>
        );
      case "Final Sheet":
        if (isFinalSheetLoading) {
          return <div className="p-10 text-center text-gray-500 italic bg-white border border-gray-300">Loading Final Sheet...</div>;
        }

        const finalAccounts = finalSheetData.accounts || [];
        const filteredFinalAccounts = finalAccounts.filter(u => (!hideZero || u.net !== 0));

        const positiveAccounts = filteredFinalAccounts.filter(u => u.net >= 0);
        const negativeAccounts = filteredFinalAccounts.filter(u => u.net < 0);

        const totalPositiveNet = positiveAccounts.reduce((sum, u) => sum + u.net, 0);
        const totalNegativeNet = negativeAccounts.reduce((sum, u) => sum + u.net, 0);

        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              <div className="flex items-center gap-2 mb-1">
                <Filter size={16} className="text-gray-700" />
                SuperMaster - Final Sheet
              </div>
              <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                <input type="checkbox" id="hideZero" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#f39c12]" />
                <label htmlFor="hideZero">Hide Zero Amounts</label>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Net Table */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px] border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1 text-blue-500">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1 text-blue-500">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positiveAccounts.map((u, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-100 text-[#f39c12] font-medium">
                          {u.name} {u.role && <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase font-bold">{u.role}</span>}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-700">
                          {u.net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {positiveAccounts.length === 0 && (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f39c12] text-white font-bold">
                      <td className="px-3 py-2 border-r border-orange-600">Total</td>
                      <td className="px-3 py-2">{totalPositiveNet.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Negative Net Table */}
              <div className="border border-gray-200">
                <table className="w-full text-[12px] border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name <span className="text-[10px] ml-1 text-blue-500">▲▼</span></th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount <span className="text-[10px] ml-1 text-blue-500">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {negativeAccounts.map((u, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-100 text-red-600 font-medium">
                          {u.name} {u.role && <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase font-bold">{u.role}</span>}
                        </td>
                        <td className="px-3 py-2 font-bold text-red-500">
                          {Math.abs(u.net).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {negativeAccounts.length === 0 && (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f25c54] text-white font-bold">
                      <td className="px-3 py-2 border-r border-[#e04a43]">Total</td>
                      <td className="px-3 py-2">{Math.abs(totalNegativeNet).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      case "Commission Report":
        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <Filter size={16} className="mr-2 text-gray-700" />
              SuperMaster - Commission Report
            </div>
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600 italic">All Commission goes to As per share (Auto Commission)</div>
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-700 font-bold">
                      <th className="px-3 py-2 border-r">User Name</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && reportData.length > 0 ? (
                      reportData.map((c, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 border-r text-blue-600 font-medium">{c.name}</td>
                          <td className={`px-3 py-2 font-bold ${c.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {c.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No commission data found for this period</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f39c12] text-white font-black">
                      <td className="px-3 py-2.5 border-r border-orange-600 uppercase">Total</td>
                      <td className="px-3 py-2.5">
                        {reportData ? reportData.reduce((sum, c) => sum + c.amount, 0).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-300">
            <div className="bg-[#f39c12] px-4 py-3 flex justify-between items-center text-white font-bold">
              <h3>Add New Downline</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                >
                  <option value="master">Master</option>
                  <option value="user">User (Bettor)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Balance Type</label>
                <select
                  value={newBalanceType}
                  onChange={(e) => setNewBalanceType(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12] font-bold text-gray-700 mb-2"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Enter initial balance"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                />
              </div>
              {newType === "master" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Master Share (%) (0-{(currentParentInfo && currentParentInfo.share !== undefined) ? currentParentInfo.share : 85})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={(currentParentInfo && currentParentInfo.share !== undefined) ? currentParentInfo.share : 85}
                    value={newShare}
                    onChange={(e) => setNewShare(e.target.value)}
                    placeholder="Enter share percentage"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#f39c12] hover:bg-orange-600 text-white font-bold py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Save User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <span className="font-bold text-red-600">{userToDelete?.username}</span>? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveUser}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-300">
            <div className="bg-[#f39c12] px-4 py-3 flex justify-between items-center text-white font-bold">
              <h3>Edit User: {selectedUser.username}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                />
              </div>
              {selectedUser.role === 'master' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Share (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="85"
                    value={editShare}
                    onChange={(e) => setEditShare(e.target.value)}
                    placeholder="Enter share percentage"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#f39c12] hover:bg-orange-600 text-white font-bold py-2.5 rounded shadow-sm"
              >
                {isSaving ? "Updating..." : "Update User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Load/Reduce Balance Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 mt-10">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-gray-300">
            <div className="flex bg-white border-b border-gray-200">
              <button
                onClick={() => { setActiveTab("cash"); setDepositAmount(""); setWithdrawAmount(""); setDepositDescription(""); setWithdrawDescription(""); }}
                className={`flex-1 py-3 text-[14px] font-bold transition-all ${activeTab === 'cash' ? 'bg-[#007bff] text-white' : 'bg-white text-[#28a745] hover:bg-gray-50'}`}
              >
                Cash
              </button>
              <button
                onClick={() => { setActiveTab("credit"); setDepositAmount(""); setWithdrawAmount(""); setDepositDescription(""); setWithdrawDescription(""); }}
                className={`flex-1 py-3 text-[14px] font-bold transition-all ${activeTab === 'credit' ? 'bg-[#007bff] text-white' : 'bg-white text-[#28a745] hover:bg-gray-50'}`}
              >
                Credit
              </button>
            </div>

            <div className="p-4 bg-[#f8f9fa] space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedUser?.username}</h2>

              <div className="grid grid-cols-4 gap-0 border border-gray-200 bg-white text-center">
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">Total Balance</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">
                    {(selectedUser?.walletBalance || 0).toLocaleString()} Rs.
                  </p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">{activeTab === 'cash' ? 'Cash Balance' : 'Credit Balance'}</p>
                  <p className="text-[13px] font-bold text-blue-600 mt-1">
                    {activeTab === 'cash'
                      ? `${((selectedUser?.walletBalance || 0) - (selectedUser?.credit || 0)).toLocaleString()} Rs.`
                      : `${selectedUser?.credit?.toLocaleString() || 0} Rs.`}
                  </p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">{activeTab === 'cash' ? 'Credit Balance' : 'Cash Balance'}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">
                    {activeTab === 'cash'
                      ? `${selectedUser?.credit?.toLocaleString() || 0} Rs.`
                      : `${((selectedUser?.walletBalance || 0) - (selectedUser?.credit || 0)).toLocaleString()} Rs.`}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-bold text-gray-700">Accounts</p>
                  <p className="text-[13px] font-bold text-blue-600 mt-1">{selectedUser?.downlineCount || 0}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="bg-[#f39c12] px-4 py-2 text-white font-bold text-[14px] flex justify-between items-center">
                  <span>Deposit {activeTab} in {selectedUser?.username} account</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center">
                    <label className="w-24 text-sm font-bold text-gray-600">Amount</label>
                    <div className="flex-1 flex items-center">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 text-sm text-gray-500 rounded-l-sm">Rs.</span>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-r-sm focus:outline-none focus:border-[#f39c12] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-start pl-24">
                    <button onClick={(e) => handleBalanceUpdate(e, "add", activeTab)} className="bg-[#f39c12] hover:bg-orange-600 text-white px-8 py-2 rounded-sm font-bold text-sm shadow-sm">Submit</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="bg-[#e74c3c] px-4 py-2 text-white font-bold text-[14px] flex justify-between items-center">
                  <span>Withdraw {activeTab} from {selectedUser?.username} account</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center">
                    <label className="w-24 text-sm font-bold text-gray-600">Amount</label>
                    <div className="flex-1 flex items-center">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 text-sm text-gray-500 rounded-l-sm">Rs.</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-r-sm focus:outline-none focus:border-[#e74c3c] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-start pl-24">
                    <button onClick={(e) => handleBalanceUpdate(e, "reduce", activeTab)} className="bg-[#e74c3c] hover:bg-[#c0392b] text-white px-8 py-2 rounded-sm font-bold text-sm shadow-sm">Submit</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setIsLoadModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-sm font-bold text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Account Modal */}
      {isSettleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-300">
            <div className="bg-[#f87171] px-4 py-3 flex justify-between items-center text-white font-bold">
              <h3>Settle Account: {selectedUser.username}</h3>
              <button onClick={() => setIsSettleModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSettleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Current Client P/L</label>
                <div className={`text-base font-black ${(selectedUser.clientPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(selectedUser.clientPL || 0).toLocaleString()} Rs.
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Share P/L (Available Balance)</label>
                <div className={`text-base font-black ${(selectedUser.sharePL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(selectedUser.sharePL || 0).toLocaleString()} Rs.
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Settlement Amount</label>
                <input
                  type="number"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="Enter amount to settle"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={settleDescription}
                  onChange={(e) => setSettleDescription(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSettling}
                className="w-full bg-[#f87171] hover:bg-red-500 text-white font-bold py-2.5 rounded shadow-sm"
              >
                {isSettling ? "Settling..." : "Confirm Settlement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#3b82f6] px-4 py-3 flex justify-between items-center text-white border-b border-blue-400 font-bold uppercase italic">
              <h3>Balance Report & Ledger: {selectedUser?.username}</h3>
              <button onClick={() => setIsLedgerModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 shadow-sm font-bold text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-200">Date/Time</th>
                    <th className="px-4 py-2 border-b border-gray-200">Type</th>
                    <th className="px-4 py-2 border-b border-gray-200 text-right">Amount</th>
                    <th className="px-4 py-2 border-b border-gray-200">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {isLedgerLoading ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">Loading history...</td></tr>
                  ) : ledgerTransactions.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
                  ) : (
                    ledgerTransactions.map((tx, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-[12px] text-gray-600">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-bold uppercase text-[11px] text-gray-600">
                          {tx.type}
                        </td>
                        <td className={`px-4 py-2.5 font-extrabold text-right ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-[12px]">
                          {tx.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="bg-gray-800 hover:bg-black text-white px-6 py-2 rounded-sm font-bold text-[12px]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Type Panel */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
          <Filter size={16} className="mr-2 text-gray-700" />
          Report Type
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {['Book Detail', 'Book Detail 2', 'Daily PL', 'Daily Report', 'Final Sheet', 'Accounts', 'Commission Report'].map(btn => (
            <button
              key={btn}
              onClick={() => setActiveReportType(btn)}
              className={`px-3 py-1.5 text-sm font-bold rounded-sm shadow-sm transition-all border ${activeReportType === btn
                ? 'bg-[#f39c12] border-[#f39c12] text-white'
                : 'bg-white border-gray-300 text-[#f39c12] hover:bg-orange-50'
                }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {activeReportType === "Accounts" ? (
        <>
          {/* Search Users Panel */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center justify-between font-bold text-gray-800 text-[13px]">
              <div className="flex items-center">
                <Filter size={16} className="mr-2 text-gray-700" />
                Search-Users
              </div>
              {searchQuery && (
                <span className="text-[11px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Filtered: "{searchQuery}"
                </span>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/30 focus:border-[#f39c12] transition-all bg-white shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        fetchUsers();
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100 z-10"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Live Suggestions Dropdown */}
                  {showSuggestions && searchQuery.trim() && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100">
                      {matchingSuggestions.length > 0 ? (
                        matchingSuggestions.map(u => (
                          <div
                            key={u._id || u.username}
                            onClick={() => {
                              setSearchQuery(u.username);
                              handleSearchSubmit(u.username);
                            }}
                            className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-amber-100 text-[#f39c12] font-bold text-xs flex items-center justify-center uppercase">
                                {u.username[0]}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                                  <span>{u.username}</span>
                                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold border border-gray-200">
                                    {u.role === 'user' ? 'Bettor' : u.role}
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  Credit: ₹{(u.credit || 0).toLocaleString()} | Balance: ₹{Math.max(0, (u.walletBalance || 0) - (u.credit || 0)).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] bg-[#f39c12] text-white px-2 py-1 rounded font-semibold group-hover:bg-orange-600 transition-colors">
                              View →
                            </span>
                          </div>
                        ))
                      ) : (
                        <div 
                          onClick={() => handleSearchSubmit()}
                          className="p-3 text-center text-xs text-gray-500 hover:text-gray-700 cursor-pointer italic hover:bg-gray-50"
                        >
                          No local match. Click to search downline tree for "{searchQuery}" →
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSearchSubmit()}
                    className="flex-1 sm:flex-none bg-[#f39c12] hover:bg-orange-600 text-white px-4 py-2 flex items-center justify-center gap-1.5 text-sm font-bold rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Search size={15} />
                    <span>Search</span>
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        fetchUsers();
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 text-sm font-semibold rounded-md transition-all active:scale-95 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Clients List Panel */}
          <div id="clients-list-panel" className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col scroll-mt-4">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px] flex items-center justify-between">
              <span>
                {currentParentInfo ? `${currentParentInfo.role.toUpperCase()} (${currentParentInfo.username}) - Clients List` : 'SUPERMASTER - Clients List | Default'}
              </span>
              {breadcrumbs && breadcrumbs.length > 1 && (
                <button
                  onClick={() => fetchUsers(breadcrumbs[breadcrumbs.length - 2].username)}
                  className="bg-[#f39c12] hover:bg-orange-600 text-white text-[11px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 shadow-sm"
                >
                  ← Up Level
                </button>
              )}
            </div>

            {/* Breadcrumbs Trail */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Hierarchy:</span>
                {breadcrumbs.map((b, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={b._id || b.username}>
                      {idx > 0 && <span className="text-gray-300 font-bold">/</span>}
                      {isLast ? (
                        <span className="text-[#f39c12] font-bold underline bg-orange-50 px-2 py-0.5 rounded">
                          {b.username} ({b.role === 'user' ? 'Bettor' : b.role})
                        </span>
                      ) : (
                        <button
                          onClick={() => fetchUsers(b.username)}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs"
                        >
                          {b.username} ({b.role === 'user' ? 'Bettor' : b.role})
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Summary Table */}
            <div className="border-b border-gray-200">
              <table className="w-full text-sm font-bold text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2 text-gray-800">Credit Remaining</th>
                    <th className="px-4 py-2 text-gray-800">Cash</th>
                    <th className="px-4 py-2 text-gray-800">P/L Downline</th>
                    <th className="px-4 py-2 text-gray-800">Users</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-blue-600">{((currentParentInfo?.credit || 0) - users.reduce((sum, u) => sum + (u.credit || 0), 0)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-800">{((currentParentInfo?.walletBalance || 0) - (currentParentInfo?.credit || 0)).toLocaleString()}</td>
                    <td className={`px-4 py-3 font-bold ${(currentParentInfo?.clientPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(currentParentInfo?.clientPL || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-800">{users.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 text-sm font-semibold rounded-sm shadow-sm transition-all"
                >
                  New Player
                </button>
                <Link href="/supermaster/account-ledger" className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 text-sm font-semibold rounded-sm flex items-center gap-1">
                  <BookOpen size={16} />
                  Account Ledger
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600 uppercase font-black">
                <span className="flex items-center gap-1"><span className="bg-[#fbbf24] text-white px-1.5 py-0.5 rounded-sm">C</span> Cash / Credit</span>
                <span className="flex items-center gap-1"><span className="bg-[#1abc9c] text-white px-1.5 py-0.5 rounded-sm"><Edit2 size={12} /></span> Edit</span>
                <span className="flex items-center gap-1"><span className="bg-[#3b82f6] text-white px-1.5 py-0.5 rounded-sm">L</span> Ledger</span>
                <span className="flex items-center gap-1"><span className="bg-[#10b981] text-white px-1.5 py-0.5 rounded-sm">A</span> Active</span>
                <span className="flex items-center gap-1"><span className="border text-red-500 border-red-500 bg-white px-1.5 py-0.5 rounded-sm">D</span> InActive</span>
                <span className="flex items-center gap-1"><span className="bg-[#f87171] text-white px-1.5 py-0.5 rounded-sm font-bold">S</span> Settle Account</span>
              </div>
            </div>

            {/* Mobile View (Table Layout) */}
            <div className="md:hidden overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f39c12] text-white">
                    <th className="px-3 py-2 text-left font-bold border-r border-orange-600">Username</th>
                    <th className="px-3 py-2 text-left font-bold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="2" className="p-10 text-center text-gray-500">Loading...</td></tr>
                  ) : displayUsers.length === 0 ? (
                    <tr><td colSpan="2" className="p-10 text-center text-gray-500 font-medium">No users found.</td></tr>
                  ) : (
                    displayUsers.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200">
                        <td className="p-3 border-r border-gray-200 align-top">
                          <div className={`font-bold text-[15px] mb-2 flex items-center flex-wrap gap-1 ${item.status === 'inactive' ? 'text-red-500 line-through opacity-50' : 'text-gray-900'}`}>
                            {item.role !== 'user' ? (
                              <button
                                onClick={() => fetchUsers(item.username)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-left inline-flex items-center gap-1"
                              >
                                <span>{item.username}</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">
                                  ↳ Clients ({item.downlineCount || 0})
                                </span>
                              </button>
                            ) : (
                              <span>{item.username}</span>
                            )}
                            <span
                              onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }}
                              className="w-4 h-4 bg-gray-800 hover:bg-blue-600 text-white rounded-full inline-flex items-center justify-center text-[10px] ml-1.5 cursor-pointer transition-colors no-underline"
                              title="View Balance Report"
                            >
                              i
                            </span>
                          </div>
                          <ul className="space-y-1.5 text-gray-700 text-[13px] font-medium">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Type {item.role === 'user' ? 'Bettor' : item.role}
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Cash {((item.walletBalance || 0) - (item.credit || 0)).toLocaleString()}
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Client (P/L){" "}
                              <span className={`font-bold ${(item.clientPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(item.clientPL || 0) >= 0 ? `+${(item.clientPL || 0).toLocaleString()}` : (item.clientPL || 0).toLocaleString()}
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Share {item.share || 0}%
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Exposure 0
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Available Balance{" "}
                              {item.role === 'user' ? (
                                <span>{(item.walletBalance || 0).toLocaleString()}</span>
                              ) : (
                                <span className={`font-bold ${(item.sharePL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(item.sharePL || 0).toLocaleString()}
                                </span>
                              )}
                            </li>
                            <li className="flex items-center gap-2 mt-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Options
                              <div className="flex flex-wrap gap-1 ml-1">
                                <button onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }} className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Cash/Credit">C</button>
                                <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setEditPassword(""); setIsEditModalOpen(true); }} className="bg-[#1abc9c] hover:bg-[#16a085] text-white w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Edit"><Edit2 size={13} /></button>
                                <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Ledger">L</button>
                                <button onClick={() => handleToggleStatus(item.username, item.status)} className={`font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm ${item.status === 'inactive' ? 'bg-gray-400 text-white' : 'bg-[#10b981] text-white'}`} title="Toggle Status">A</button>
                                <button onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }} className="border border-red-500 text-red-500 font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm hover:bg-red-500 hover:text-white" title="Delete">D</button>
                                {item.role !== 'user' && (
                                  <button onClick={() => { setSelectedUser(item); setSettleAmount(""); setSettleDescription("P/L to Cash transfer"); setIsSettleModalOpen(true); }} className="bg-[#f87171] hover:bg-red-500 text-white font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Settle P/L Account">S</button>
                                )}
                              </div>
                            </li>
                          </ul>
                        </td>
                        <td className="p-3 align-top text-gray-800 font-bold text-[15px] text-right">
                          {item.credit?.toLocaleString() || '0'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Main Table (Desktop) */}
            <div className="overflow-x-auto hidden md:block">
              <div className="bg-[#f39c12] px-4 py-2 flex items-center">
                <div className="bg-[#fbbf24] text-gray-900 text-xs font-bold px-3 py-1.5 rounded-sm">
                  Load Player Balance
                </div>
              </div>

              <table className="w-full text-sm text-left border-collapse border-b border-gray-200">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Username</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Type</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Credit</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200 text-blue-600">Balance</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Client (P/L)</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Share</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Exposure</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200 text-[#f39c12]">Available Balance</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-10 text-center text-gray-500 font-medium">
                        Loading users...
                      </td>
                    </tr>
                  ) : displayUsers.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-10 text-center text-gray-500 font-medium">
                        No users found. Click "New Player" to create one.
                      </td>
                    </tr>
                  ) : (
                    displayUsers.map((item) => (
                      <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-gray-800 border-r border-gray-200 flex items-center gap-1 whitespace-nowrap">
                          {item.role !== 'user' ? (
                            <button
                              onClick={() => fetchUsers(item.username)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-left inline-flex items-center gap-1 transition-colors group"
                              title={`Click to view ${item.username}'s client accounts`}
                            >
                              <span>{item.username}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white px-1.5 py-0.5 rounded transition-colors border border-blue-200">
                                ↳ Clients ({item.downlineCount || 0})
                              </span>
                            </button>
                          ) : (
                            <span>{item.username}</span>
                          )}
                          <span
                            onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }}
                            className="w-4 h-4 bg-gray-800 hover:bg-blue-600 text-white rounded-full inline-flex items-center justify-center text-[10px] cursor-pointer transition-colors shadow-sm"
                            title="View Balance Report"
                          >
                            i
                          </span>
                        </td>
                        <td className="px-4 py-2 border-r border-gray-200 font-bold uppercase text-gray-600">{item.role === 'user' ? 'Bettor' : item.role}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{item.credit?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{Math.max(0, (item.walletBalance || 0) - (item.credit || 0)).toLocaleString()}</td>
                        <td className="px-4 py-2 border-r border-gray-200">
                          <span className={`font-bold ${(item.clientPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(item.clientPL || 0) >= 0 ? `+${(item.clientPL || 0).toLocaleString()}` : (item.clientPL || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-orange-600 border-r border-gray-200 font-bold">{(item.role === 'master' || item.role === 'supermaster') ? `${item.share || 0}%` : '-'}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">-</td>
                        <td className="px-4 py-2 border-r border-gray-200 font-bold">
                          {item.role === 'user' ? (
                            <span className="text-gray-700">{(item.walletBalance || 0).toLocaleString()}</span>
                          ) : (
                            <span className={`font-bold ${(item.sharePL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(item.sharePL || 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 flex items-center gap-1">
                          <button onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }} className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-90" title="Add/Reduce Cash">C</button>
                          <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setEditPassword(""); setIsEditModalOpen(true); }} className="bg-[#1abc9c] hover:bg-[#16a085] text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all hover:scale-110"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center shadow-sm">L</button>
                          <button onClick={() => handleToggleStatus(item.username, item.status)} className={`font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all ${item.status === 'inactive' ? 'bg-gray-400 text-white' : 'bg-[#10b981] text-white hover:bg-green-600'}`} title={item.status === 'inactive' ? 'Set Active' : 'Set InActive'}>A</button>
                          <button onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all" title="Delete Permanently">D</button>
                          {item.role !== 'user' && (
                            <button onClick={() => { setSelectedUser(item); setSettleAmount(""); setSettleDescription("P/L to Cash transfer"); setIsSettleModalOpen(true); }} className="bg-[#f87171] hover:bg-red-500 text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center font-bold shadow-sm transition-all active:scale-95" title="Settle P/L Account">S</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        renderReportUI()
      )}

      {/* Settle P/L Account Modal */}
      {isSettleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#f8f9fa] border-b border-gray-200 px-5 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Settle P/L Account</h3>
              <button
                onClick={() => { setIsSettleModalOpen(false); setSelectedUser(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSettleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Settlement Amount
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1abc9c] focus:border-transparent text-sm font-medium"
                  required
                />
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{selectedUser.role === 'user' ? 'Current Client P/L:' : 'Available Balance (Share P/L):'}</span>
                    {selectedUser.role === 'user' ? (
                      <span className={(selectedUser.clientPL || 0) >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {(selectedUser.clientPL || 0) >= 0 ? `+${(selectedUser.clientPL || 0).toLocaleString()} (Green)` : `${(selectedUser.clientPL || 0).toLocaleString()} (Red)`}
                      </span>
                    ) : (
                      <span className={(selectedUser.sharePL || 0) >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {(selectedUser.sharePL || 0) >= 0 ? `+${(selectedUser.sharePL || 0).toLocaleString()} (Green)` : `${(selectedUser.sharePL || 0).toLocaleString()} (Red)`}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 italic">
                    {selectedUser.role === 'user'
                      ? 'Entering an amount automatically clears Green or Red Client P/L towards 0.00.'
                      : 'Entering an amount automatically settles the Agent\'s Available Balance (Share P/L) towards 0.00.'
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={settleDescription}
                  onChange={(e) => setSettleDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1abc9c] focus:border-transparent text-sm font-medium"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSettling}
                  className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-6 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSettling ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
