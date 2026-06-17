"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Edit2, X, DollarSign, AlertTriangle, Trash2, Calendar, Layout, List } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newType, setNewType] = useState("user");
  const [initialBalance, setInitialBalance] = useState("0");
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

  // Edit User State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editShare, setEditShare] = useState("0");
  const [editPassword, setEditPassword] = useState("");

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  const getAuthToken = () => {
    const raw = localStorage.getItem("user_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  // Fetch users from Backend
  const [activeReportType, setActiveReportType] = useState("Accounts");
  const [hideZero, setHideZero] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [finalSheetData, setFinalSheetData] = useState({ accounts: [] });
  const [dailyReportData, setDailyReportData] = useState({ profit: [], loss: [] });
  const [adminShare, setAdminShare] = useState(85);
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
        setDailyReportData(data);
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
      fetchFinalSheet();
    } else if (activeReportType === "Daily Report") {
      fetchDailyReport();
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReportType, selectedDate, selectedMonth, selectedYear, reportPeriod, startDate, endDate]);

  // Fetch users from Backend
  const fetchUsers = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/downline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.share !== undefined) {
        setAdminShare(data.share);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserProfile();
  }, []);

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
          share: parseFloat(newShare) || 0
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setNewUsername("");
        setNewPassword("");
        setInitialBalance("0");
        setNewShare("0");
        fetchUsers();
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
    const amount = mode === "add" ? depositAmount : withdrawAmount;
    const desc = mode === "add" ? depositDescription : withdrawDescription;

    if (!selectedUser || !amount) return;

    setIsSaving(true);
    const token = getAuthToken();
    const endpoint = mode === "add" ? "/api/admin/load-balance" : "/api/admin/withdraw-balance";

    console.log(`[DEBUG] Balance Update Request:`, {
      endpoint,
      mode,
      target: selectedUser.username,
      amount: parseFloat(amount),
      type: tab
    });

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
          newPassword: editPassword
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
        const filteredDailyProfit = dailyReportData.profit.filter(u => !hideZero || u.amount !== 0);
        const filteredDailyLoss = dailyReportData.loss.filter(u => !hideZero || u.amount !== 0);
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
                          <td 
                            className="px-3 py-2 border-r border-gray-100 text-blue-600 font-medium"
                          >
                            {u.name}
                          </td>
                          <td 
                            className={`px-3 py-2 font-bold cursor-pointer hover:bg-green-50 transition-all duration-200 border-l border-gray-100 ${u.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUser(expandedUser === u.name ? null : u.name);
                            }}
                          >
                            <div className="flex items-center justify-between pointer-events-none">
                              <span>{u.amount.toLocaleString()}</span>
                              <span className={`text-[10px] transition-transform duration-300 ${expandedUser === u.name ? 'rotate-180 text-[#1abc9c]' : 'text-gray-400'}`}>
                                ▼
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedUser === u.name && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="2" className="p-2">
                              <div className="bg-white border border-gray-200 rounded shadow-inner p-2 text-[11px]">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-gray-500">
                                      <th className="text-left py-1">Type</th>
                                      <th className="text-right py-1">P/L</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'cricket')}>
                                      <td className="py-1.5 font-medium">Cricket</td>
                                      <td className={`text-right font-bold ${u.breakdown?.cricket?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.cricket?.net?.toLocaleString() || '0'}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'casino')}>
                                      <td className="py-1.5 font-medium">Casino</td>
                                      <td className={`text-right font-bold ${u.breakdown?.casino?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.casino?.net?.toLocaleString() || '0'}
                                      </td>
                                    </tr>
                                  </tbody>
                                  <tfoot>
                                    <tr className="font-bold bg-gray-50">
                                      <td className="py-1">Total</td>
                                      <td className={`text-right ${u.breakdown?.totalNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.totalNet?.toLocaleString() || '0'}
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
                    {filteredDailyProfit.length === 0 && (
                      <tr><td colSpan="2" className="px-3 py-10 text-center text-gray-400 italic">No data found for this date</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
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
                      <React.Fragment key={`loss-${i}`}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 border-r border-gray-100 text-red-500 font-bold">{u.name}</td>
                          <td 
                            className="px-3 py-2 text-red-500 font-bold cursor-pointer hover:bg-red-50 transition-all duration-200 border-l border-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUser(expandedUser === u.name ? null : u.name);
                            }}
                          >
                            <div className="flex items-center justify-between pointer-events-none">
                              <span>{u.amount.toLocaleString()}</span>
                              <span className={`text-[10px] transition-transform duration-300 ${expandedUser === u.name ? 'rotate-180 text-red-500' : 'text-gray-400'}`}>
                                ▼
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedUser === u.name && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="2" className="p-2">
                              <div className="bg-white border border-gray-200 rounded shadow-inner p-2 text-[11px]">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-gray-500">
                                      <th className="text-left py-1">Type</th>
                                      <th className="text-right py-1">P/L</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'cricket')}>
                                      <td className="py-1.5 font-medium">Cricket</td>
                                      <td className={`text-right font-bold ${u.breakdown?.cricket?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.cricket?.net?.toLocaleString() || '0'}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => fetchDailyReportDetails(u.name, 'casino')}>
                                      <td className="py-1.5 font-medium">Casino</td>
                                      <td className={`text-right font-bold ${u.breakdown?.casino?.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.casino?.net?.toLocaleString() || '0'}
                                      </td>
                                    </tr>
                                  </tbody>
                                  <tfoot>
                                    <tr className="font-bold bg-gray-50">
                                      <td className="py-1">Total</td>
                                      <td className={`text-right ${u.breakdown?.totalNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.breakdown?.totalNet?.toLocaleString() || '0'}
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
            <div className={`mt-2 p-3 rounded-sm text-white font-bold flex justify-between items-center shadow-md ${totalDailyProfit - totalDailyLoss >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
              <span className="text-sm uppercase tracking-wider">Net Total P/L</span>
              <span className="text-xl font-black">{(totalDailyProfit - totalDailyLoss).toLocaleString()}</span>
            </div>
          </div>
        </div>
        );
      case "Final Sheet":
        if (isFinalSheetLoading) {
          return <div className="p-10 text-center text-gray-500 italic bg-white border border-gray-300">Loading Final Sheet...</div>;
        }

        const finalAccounts = finalSheetData.accounts || [];
        const filteredFinalAccounts = finalAccounts.filter(u => (!hideZero || u.net !== 0) && u.role !== 'user');
        
        const positiveAccounts = filteredFinalAccounts.filter(u => u.net >= 0);
        const negativeAccounts = filteredFinalAccounts.filter(u => u.net < 0);
        
        const totalPositiveNet = positiveAccounts.reduce((sum, u) => sum + u.net, 0);
        const totalNegativeNet = negativeAccounts.reduce((sum, u) => sum + u.net, 0);

        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              <div className="flex items-center gap-2 mb-1">
                <Filter size={16} className="text-gray-700" />
                Admin - Final Sheet
              </div>
              <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                <input type="checkbox" id="hideZero" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#1abc9c]" />
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
                        <td className="px-3 py-2 border-r border-gray-100 text-[#1abc9c] font-medium">
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
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
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
                        <td className="px-3 py-2 border-r border-gray-100 text-[#1abc9c] font-medium">
                          {u.name} {u.role && <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase font-bold">{u.role}</span>}
                        </td>
                        <td className="px-3 py-2 font-bold text-red-500">
                          {u.net.toLocaleString()}
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
                      <td className="px-3 py-2">{totalNegativeNet.toLocaleString()}</td>
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
              Admin - Commission Report
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
                    <tr className="bg-[#1abc9c] text-white font-black">
                      <td className="px-3 py-2.5 border-r border-teal-600 uppercase">Total</td>
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
    <div className="flex flex-col gap-4 max-w-full pb-10">
      {/* Premium Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Confirm Deletion</h3>
              <p className="text-gray-600 mt-2 text-sm px-4">
                Are you sure you want to permanently remove <span className="font-bold text-red-600">@{userToDelete?.username}</span>? This action is irreversible and all profile data will be destroyed.
              </p>
            </div>
            <div className="p-6 bg-white flex flex-col gap-3">
              <button
                onClick={handleRemoveUser}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {isSaving ? "Destroying Account..." : "Yes, Purge Account"}
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                disabled={isSaving}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
              >
                Nevermind, Go Back
              </button>
            </div>
            {/* Progress Bar (Simulated) */}
            {isSaving && (
              <div className="w-full h-1 bg-gray-100 overflow-hidden">
                <div className="h-full bg-red-600 animate-progress w-full origin-left" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white">
              <h3 className="font-bold">Create New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
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
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
                >
                  <option value="user">Bettor (User)</option>
                  <option value="master">Master</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Enter initial balance"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
                />
              </div>
              {newType === "master" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Share (%) (0-{adminShare > 0 ? adminShare - 1 : 0})</label>
                  <input
                    type="number"
                    min="0"
                    max={adminShare > 0 ? adminShare - 1 : 0}
                    value={newShare}
                    onChange={(e) => setNewShare(e.target.value)}
                    placeholder="Enter share percentage"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Save User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Load/Reduce Balance Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 mt-10">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-gray-300">
            {/* Tabs */}
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
              {/* Username */}
              <h2 className="text-2xl font-bold text-gray-800">{selectedUser?.username}</h2>

              {/* Summary Boxes */}
              <div className="grid grid-cols-4 gap-0 border border-gray-200 bg-white">
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

              {/* Deposit Section */}
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="bg-[#1abc9c] px-4 py-2 text-white font-bold text-[14px]">
                  Deposit {activeTab === 'cash' ? 'Cash' : 'Credit'} in {selectedUser?.username} account
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-bold text-gray-700">Description</label>
                    <input
                      type="text"
                      value={depositDescription}
                      onChange={(e) => setDepositDescription(e.target.value)}
                      placeholder={`${activeTab === 'cash' ? 'Cash' : 'Credit'} deposit in ${selectedUser?.username}`}
                      className="flex-1 border border-gray-300 px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#1abc9c] text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-bold text-gray-700">Amount</label>
                    <div className="flex-1 flex items-center">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-1.5 text-sm text-gray-600 rounded-l-sm">Rs.</span>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-1.5 rounded-r-sm focus:outline-none focus:border-[#1abc9c] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-start pl-32">
                    <button
                      onClick={(e) => handleBalanceUpdate(e, "add", activeTab)}
                      disabled={isSaving}
                      className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-6 py-2 rounded-sm font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>

              {/* Withdraw Section */}
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="bg-[#e74c3c] px-4 py-2 text-white font-bold text-[14px]">
                  Withdraw {activeTab === 'cash' ? 'cash' : 'Credit'} from {selectedUser?.username} account
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-bold text-gray-700">Description</label>
                    <input
                      type="text"
                      value={withdrawDescription}
                      onChange={(e) => setWithdrawDescription(e.target.value)}
                      placeholder={`${activeTab === 'cash' ? 'Cash' : 'Credit'} withdrawn from ${selectedUser?.username}`}
                      className="flex-1 border border-gray-300 px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#e74c3c] text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-bold text-gray-700">Amount</label>
                    <div className="flex-1 flex items-center">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-1.5 text-sm text-gray-600 rounded-l-sm">Rs.</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-1.5 rounded-r-sm focus:outline-none focus:border-[#e74c3c] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-start pl-32">
                    <button
                      onClick={(e) => handleBalanceUpdate(e, "reduce", activeTab)}
                      disabled={isSaving}
                      className="bg-[#e74c3c] hover:bg-[#c0392b] text-white px-6 py-2 rounded-sm font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsLoadModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-sm font-bold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#3b82f6] px-4 py-3 flex justify-between items-center text-white border-b border-blue-400 font-bold uppercase tracking-tight italic">
              <h3>User Ledger: {selectedUser?.username}</h3>
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
                  className="bg-gray-800 hover:bg-black text-white px-6 py-2 rounded-sm font-bold text-[12px] transition-colors"
                >
                  CLOSE
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white font-bold italic uppercase tracking-tighter">
              <h3>Edit User: {selectedUser?.username}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 font-sans">
              {selectedUser?.role === 'master' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company Share (%)</label>
                  <div className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded font-bold text-gray-500 flex justify-between items-center text-sm">
                    <span>{editShare}%</span>
                    <span className="text-[10px] text-gray-400 font-normal italic">Locked after creation</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 italic">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c]"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-black py-3 rounded-lg shadow-md transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSaving ? "Updating..." : "Update User Account"}
                </button>
              </div>
            </form>
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
              className={`px-3 py-1.5 text-sm font-bold rounded-sm shadow-sm transition-all border ${
                activeReportType === btn 
                ? 'bg-[#1abc9c] border-[#1abc9c] text-white' 
                : 'bg-white border-gray-300 text-[#1abc9c] hover:bg-teal-50'
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
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <Filter size={16} className="mr-2 text-gray-700" />
              Search-Users
            </div>
            <div className="p-4 flex items-center gap-0 w-full max-w-lg">
              <input
                type="text"
                placeholder="Username"
                className="border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#1abc9c] w-64 text-sm"
              />
              <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 flex items-center gap-1 text-sm font-semibold">
                <Search size={14} />
                Search
              </button>
            </div>
          </div>

          {/* Main Clients List Panel */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              Admin - Clients List | Default
            </div>

            {/* Summary Table */}
            <div className="border-b border-gray-200">
              <table className="w-full text-sm font-bold text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2 text-gray-800">Credit</th>
                    <th className="px-4 py-2 text-gray-800">Cash</th>
                    <th className="px-4 py-2 text-gray-800 text-[#1abc9c]">Total</th>
                    <th className="px-4 py-2 text-gray-800">P/L Downline</th>
                    <th className="px-4 py-2 text-gray-800">Users</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-blue-600">{users.reduce((sum, u) => sum + (u.credit || 0), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-800">{users.reduce((sum, u) => sum + ((u.walletBalance || 0) - (u.credit || 0)), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-700 font-bold">{users.reduce((sum, u) => sum + (u.walletBalance || 0), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-600">0</td>
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
                  className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 text-sm font-semibold rounded-sm shadow-sm transition-all"
                >
                  New User
                </button>
                <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 text-sm font-semibold rounded-sm flex items-center gap-1">
                  <BookOpen size={16} />
                  Account Ledger
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600">
                <span className="flex items-center gap-1"><span className="bg-[#fbbf24] text-white px-1.5 py-0.5 rounded-sm">C</span> Cash / Credit</span>
                <span className="flex items-center gap-1"><span className="bg-[#1abc9c] text-white px-1.5 py-0.5 rounded-sm"><Edit2 size={12} /></span> Edit</span>
                <span className="flex items-center gap-1"><span className="bg-[#3b82f6] text-white px-1.5 py-0.5 rounded-sm">L</span> Ledger</span>
                <span className="flex items-center gap-1"><span className="bg-[#10b981] text-white px-1.5 py-0.5 rounded-sm">A</span> Active</span>
                <span className="flex items-center gap-1"><span className="border text-red-500 border-red-500 bg-white px-1.5 py-0.5 rounded-sm">D</span> InActive</span>
              </div>
            </div>

            {/* Search Field right aligned */}
            <div className="px-4 pb-2 flex justify-end items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Search:</span>
              <input type="text" className="border border-gray-300 px-2 py-1 w-48 text-sm focus:outline-none focus:border-[#1abc9c]" />
            </div>

            {/* Main Table (Desktop) */}
            <div className="overflow-x-auto hidden md:block">
              <div className="bg-[#1abc9c] px-4 py-2 flex items-center">
                <div className="bg-[#fbbf24] text-gray-900 text-xs font-bold px-3 py-1.5 rounded-sm cursor-pointer hover:bg-yellow-500 transition-colors">
                  Load Balance
                </div>
              </div>

              <table className="w-full text-sm text-left border-collapse border-b border-gray-200">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Username</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Type</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Credit</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200 text-blue-600">Cash</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Client (P/L)</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Share</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Accounts</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200 text-[#1abc9c]">Total Bal.</th>
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
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-10 text-center text-gray-500 font-medium">
                        No users found. Click "New User" to create one.
                      </td>
                    </tr>
                  ) : (
                    users.map((item) => (
                      <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                        <td className={`px-4 py-2 border-r border-blue-200 font-bold ${item.status === 'inactive' ? 'text-red-500 line-through opacity-50' : (item.role === 'master' ? 'text-orange-500' : 'text-blue-600')}`}>
                          {item.username}
                          {item.status === 'inactive' && <span className="ml-2 text-[8px] bg-red-100 text-red-600 px-1 rounded uppercase">Inactive</span>}
                          <span className="w-4 h-4 bg-gray-800 text-white rounded-full inline-flex items-center justify-center text-[10px] ml-1">i</span>
                        </td>
                        <td className={`px-4 py-2 border-r border-gray-200 font-bold uppercase ${item.role === 'master' ? 'text-orange-500' : 'text-blue-600'}`}>
                          {item.role === 'user' ? 'Bettor' : item.role}
                        </td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{item.credit?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{(item.walletBalance - (item.credit || 0))?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                        <td className="px-4 py-2 text-orange-600 border-r border-gray-200">{item.role === 'master' ? `${item.share || 0}%` : '-'}</td>
                        <td className="px-4 py-2 text-blue-600 border-r border-gray-200 font-bold">{item.downlineCount || 0}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold text-[#1abc9c]">{item.walletBalance?.toLocaleString()}</td>
                        <td className="px-4 py-2 flex items-center gap-1">
                          <button onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }} className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-90" title="Add/Reduce Cash">C</button>
                          <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setEditPassword(""); setIsEditModalOpen(true); }} className="bg-[#1abc9c] hover:bg-[#16a085] text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all hover:scale-110"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center shadow-sm">L</button>
                          <button onClick={() => handleToggleStatus(item.username, item.status)} className={`font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all ${item.status === 'inactive' ? 'bg-gray-400 text-white' : 'bg-[#10b981] text-white hover:bg-green-600'}`} title={item.status === 'inactive' ? 'Set Active' : 'Set InActive'}>A</button>
                          <button onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all" title="Delete Permanently">D</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Table Layout) */}
            <div className="md:hidden overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1abc9c] text-white">
                    <th className="px-3 py-2 text-left font-bold border-r border-[#16a085]">Username</th>
                    <th className="px-3 py-2 text-left font-bold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="2" className="p-10 text-center text-gray-500">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="2" className="p-10 text-center text-gray-500 font-medium">No users found.</td></tr>
                  ) : (
                    users.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200">
                        <td className="p-3 border-r border-gray-200 align-top">
                          <div className={`font-bold text-[15px] mb-2 ${item.status === 'inactive' ? 'text-red-500 line-through opacity-50' : 'text-gray-900'}`}>
                            {item.username}
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
                              Client (P/L) 0
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Share {item.share || 0}
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Exposure 0
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Total Balance {item.walletBalance?.toLocaleString() || 0}
                            </li>
                            <li className="flex items-center gap-2 mt-2">
                              <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                              Options
                              <div className="flex flex-wrap gap-1 ml-1">
                                <button onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }} className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Cash/Credit">C</button>
                                <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setEditPassword(""); setIsEditModalOpen(true); }} className="bg-[#1abc9c] hover:bg-[#16a085] text-white w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Edit"><Edit2 size={13} /></button>
                                <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm" title="Ledger">L</button>
                                <button onClick={() => handleToggleStatus(item.username, item.status)} className={`font-bold w-7 h-7 rounded-sm flex items-center justify-center transition-all shadow-sm ${item.status === 'inactive' ? 'bg-gray-400 text-white' : 'bg-[#10b981] text-white hover:bg-green-600'}`} title={item.status === 'inactive' ? 'Activate' : 'Deactivate'}>A</button>
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

          </div>
        </>
      ) : (
        renderReportUI()
      )}

      {detailsView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-white border-b border-gray-300 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-[#1abc9c] w-1 h-6 rounded-full"></div>
                <h3 className="font-bold text-gray-800 text-[14px]">
                  {detailsView.bettor} / {detailsView.type === 'cricket' ? 'Cricket-Markets Reports' : 'Casino-Markets Reports'}
                </h3>
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
              ) : transactionDetails.length > 0 ? (
                <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-white border-b border-gray-300">
                      <tr>
                        <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-300 w-[140px]">Date</th>
                        <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-300">Event</th>
                        <th className="px-3 py-2 font-bold text-gray-700 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactionDetails.map((tx, idx) => {
                        const netAmount = tx.amount; // Positive = Master Profit
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 text-gray-500 border-r border-gray-100">
                              {new Date(tx.createdAt || tx.timestamp).toLocaleString('en-GB', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit', hour12: true 
                              })}
                            </td>
                            <td className="px-3 py-2 text-[#1abc9c] font-medium border-r border-gray-100">
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
                <div className="text-center py-20 text-gray-400 italic font-bold">No transactions found for this period.</div>
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
    </div>
  );
}
