"use client";

import { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Edit2, X, DollarSign, AlertTriangle, Trash2 } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function SuperAdminUsers() {
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

  const [activeReportType, setActiveReportType] = useState("Accounts");
  const [hideZero, setHideZero] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReportData = async () => {
    if (activeReportType !== "Commission Report") return;
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
  };

  useEffect(() => {
    if (activeReportType === "Commission Report") {
      fetchReportData();
    }
  }, [activeReportType]);

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

  useEffect(() => {
    fetchUsers();
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
          newPassword: editPassword,
          share: parseFloat(editShare) || 0
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
        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <Filter size={16} className="mr-2 text-gray-700" />
              Report
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name</th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan="2" className="px-3 py-4 text-center text-gray-500 font-medium italic">No data available in table</td></tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1abc9c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-teal-600">Total</td>
                      <td className="px-3 py-2">0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Name</th>
                      <th className="px-3 py-2 font-bold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan="2" className="px-3 py-4 text-center text-gray-500 font-medium italic">No data available in table</td></tr>
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
        const filteredProfitUsers = users.filter(u => (!hideZero || u.walletBalance !== 0));
        const totalProfit = filteredProfitUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
        
        return (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              <div className="flex items-center gap-2 mb-1">
                <Filter size={16} className="text-gray-700" />
                SuperAdmin - Final Sheet
              </div>
              <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                <input type="checkbox" id="hideZero" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#1abc9c]" />
                <label htmlFor="hideZero">Hide Zero Amounts</label>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left font-bold text-gray-700">
                      <th className="px-3 py-2 border-r">Name</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfitUsers.length === 0 ? (
                      <tr><td colSpan="2" className="px-3 py-4 text-center text-gray-400 italic">No data available</td></tr>
                    ) : (
                      filteredProfitUsers.map((u, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 border-r text-blue-600 font-medium">
                            {u.username} 
                            <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase">{u.role === 'user' ? 'Bettor' : u.role}</span>
                          </td>
                          <td className={`px-3 py-2 font-bold ${u.walletBalance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {u.walletBalance?.toLocaleString()}
                          </td>
                        </tr>
                      ))
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
              <div className="border border-gray-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left font-bold text-gray-700">
                      <th className="px-3 py-2 border-r">Name</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 border-r text-green-600 font-bold">Cash</td>
                      <td className="px-3 py-2 text-red-500 font-bold">-{totalProfit.toLocaleString()}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#e74c3c] text-white font-bold">
                      <td className="px-3 py-2 border-r border-red-400">Total</td>
                      <td className="px-3 py-2">-{totalProfit.toLocaleString()}</td>
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
              SuperAdmin - Commission Report
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
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Confirm Deletion</h3>
              <p className="text-gray-600 mt-2 text-sm px-4">
                Are you sure you want to permanently remove <span className="font-bold text-red-600">@{userToDelete?.username}</span>? This action is irreversible.
              </p>
            </div>
            <div className="p-6 bg-white flex flex-col gap-3">
              <button
                onClick={handleRemoveUser}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {isSaving ? "Deleting..." : "Yes, Delete Account"}
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                disabled={isSaving}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Downline Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white">
              <h3 className="font-bold">Create New Downline</h3>
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
                  <option value="admin">Admin</option>
                  <option value="master">Master</option>
                  <option value="user">User (Bettor)</option>
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
              {(newType === "master" || newType === "admin") && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Share (%) (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
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

      {/* Load Balance Modal */}
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
                  <p className="text-[12px] font-bold text-gray-700">Credit limit</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">100,000,000</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">Balance</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">{selectedUser?.walletBalance?.toLocaleString()}</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">Available</p>
                  <p className="text-[13px] font-bold text-[#1abc9c] mt-1">{selectedUser?.walletBalance?.toLocaleString()}</p>
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-bold text-gray-700">Accounts</p>
                  <p className="text-[13px] font-bold text-blue-600 mt-1">{selectedUser?.downlineCount || 0}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                <div className="bg-[#1abc9c] px-4 py-2 text-white font-bold text-[14px] flex justify-between items-center">
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
                        className="w-full border border-gray-300 px-3 py-2 rounded-r-sm focus:outline-none focus:border-[#1abc9c] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-start pl-24">
                    <button onClick={(e) => handleBalanceUpdate(e, "add", activeTab)} className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-8 py-2 rounded-sm font-bold text-sm shadow-sm">Submit</button>
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
                <button onClick={() => setIsLoadModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-sm font-bold text-sm transition-all">Cancel</button>
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
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white font-bold uppercase tracking-tighter">
              <h3>Edit User: {selectedUser?.username}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {(selectedUser?.role === 'master' || selectedUser?.role === 'admin') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company Share (%) (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editShare}
                    onChange={(e) => setEditShare(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#1abc9c] font-bold"
                  />
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
                <button type="submit" disabled={isSaving} className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-black py-3 rounded-lg shadow-md transition-all disabled:opacity-50 uppercase tracking-widest">
                  {isSaving ? "Updating..." : "Update User"}
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
              SuperAdmin - Clients List | Default
            </div>

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
                    <td className="px-4 py-3 text-green-700">0</td>
                    <td className="px-4 py-3 text-green-700">0</td>
                    <td className="px-4 py-3 text-green-700">0</td>
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
                  + New Downline
                </button>
                <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-3 py-1.5 text-sm font-semibold rounded-sm flex items-center gap-1">
                  <BookOpen size={16} />
                  Account Ledger
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-500 uppercase">
                <span className="flex items-center gap-1"><span className="bg-[#fbbf24] text-white px-1.5 py-0.5 rounded-sm">C</span> Cash / Credit</span>
                <span className="flex items-center gap-1"><span className="bg-[#1abc9c] text-white px-1.5 py-0.5 rounded-sm"><Edit2 size={12} /></span> Edit</span>
                <span className="flex items-center gap-1"><span className="bg-[#3b82f6] text-white px-1.5 py-0.5 rounded-sm">L</span> Ledger</span>
                <span className="flex items-center gap-1"><span className="bg-[#10b981] text-white px-1.5 py-0.5 rounded-sm">A</span> Active</span>
                <span className="flex items-center gap-1"><span className="bg-gray-400 text-white px-1.5 py-0.5 rounded-sm text-[8px] flex items-center justify-center">D</span> InActive</span>
              </div>
            </div>

            {/* Main Table (Desktop) */}
            <div className="overflow-x-auto hidden md:block">
              <div className="bg-[#1abc9c] px-4 py-2 flex items-center">
                <div className="bg-[#fbbf24] text-gray-900 text-xs font-bold px-3 py-1.5 rounded-sm cursor-pointer hover:bg-yellow-500 transition-colors">
                  Load Balance
                </div>
              </div>

              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2.5 font-bold border-r">Username</th>
                    <th className="px-4 py-2.5 font-bold border-r">Type</th>
                    <th className="px-4 py-2.5 font-bold border-r">Credit</th>
                    <th className="px-4 py-2.5 font-bold border-r">Balance</th>
                    <th className="px-4 py-2.5 font-bold border-r">Client (P/L)</th>
                    <th className="px-4 py-2.5 font-bold border-r">Share</th>
                    <th className="px-4 py-2.5 font-bold border-r">Accounts</th>
                    <th className="px-4 py-2.5 font-bold border-r">Avail. Bal.</th>
                    <th className="px-4 py-2.5 font-bold">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="9" className="p-10 text-center text-gray-500">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="9" className="p-10 text-center text-gray-500 font-medium">No users found.</td></tr>
                  ) : (
                    users.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                        <td className={`px-4 py-2 border-r font-bold ${item.status === 'inactive' ? 'text-red-500' : 'text-blue-600'}`}>
                          {item.username} <span className="text-[10px] bg-gray-800 text-white w-4 h-4 rounded-full inline-flex items-center justify-center ml-1">i</span>
                        </td>
                        <td className="px-4 py-2 border-r uppercase font-bold text-gray-600">{item.role === 'user' ? 'Bettor' : item.role}</td>
                        <td className="px-4 py-2 border-r">-</td>
                        <td className="px-4 py-2 border-r font-bold">{item.walletBalance?.toLocaleString()}</td>
                        <td className="px-4 py-2 border-r">-</td>
                        <td className="px-4 py-2 border-r font-bold text-orange-600">{(item.role === 'master' || item.role === 'admin') ? `${item.share}%` : '-'}</td>
                        <td className="px-4 py-2 border-r font-bold text-blue-600">{item.downlineCount || 0}</td>
                        <td className="px-4 py-2 border-r font-bold text-[#1abc9c]">{item.walletBalance?.toLocaleString()}</td>
                        <td className="px-4 py-2 flex gap-1">
                          <button onClick={() => { setSelectedUser(item); setIsLoadModalOpen(true); }} className="bg-[#fbbf24] text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center font-bold hover:brightness-95 active:scale-95 transition-all">C</button>
                          <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setIsEditModalOpen(true); }} className="bg-[#1abc9c] text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center hover:brightness-95 active:scale-95 transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center shadow-sm">L</button>
                          <button onClick={() => handleToggleStatus(item.username, item.status)} className={`p-1 rounded-sm w-7 h-7 flex items-center justify-center font-bold text-white transition-all hover:brightness-95 active:scale-95 ${item.status === 'inactive' ? 'bg-gray-400' : 'bg-[#10b981]'}`}>A</button>
                          <button onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }} className="border border-red-500 text-red-500 p-1 rounded-sm w-7 h-7 flex items-center justify-center font-bold hover:bg-red-50 active:scale-95 transition-all">D</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards Layout) */}
            <div className="md:hidden flex flex-col divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-10 text-center text-gray-500">Loading...</div>
              ) : users.length === 0 ? (
                <div className="p-10 text-center text-gray-500 font-medium">No users found.</div>
              ) : (
                users.map((item) => (
                  <div key={item._id} className="p-4 flex flex-col gap-3 bg-white hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className={`font-bold text-base ${item.status === 'inactive' ? 'text-red-500' : 'text-blue-600'}`}>
                          {item.username}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center text-[11px]">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase font-black text-gray-600 border border-gray-200">{item.role === 'user' ? 'Bettor' : item.role}</span>
                          <span className="font-bold text-gray-800">Bal: {item.walletBalance?.toLocaleString()}</span>
                          <span className="font-bold text-blue-600 border-l border-gray-300 pl-2">Acc: {item.downlineCount || 0}</span>
                          {(item.role === 'master' || item.role === 'admin') && (
                            <span className="text-orange-600 font-bold">Share: {item.share}%</span>
                          )}
                        </div>
                      </div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => { setSelectedUser(item); setIsLoadModalOpen(true); }} className="w-full bg-[#fbbf24] text-white py-2 rounded shadow-sm flex items-center justify-center font-black text-xs gap-1">Credit</button>
                      <button onClick={() => { setSelectedUser(item); setEditShare(item.share || "0"); setIsEditModalOpen(true); }} className="w-full bg-[#1abc9c] text-white py-2 rounded shadow-sm flex items-center justify-center gap-1"><Edit2 size={14} /><span className="text-xs font-bold">Edit</span></button>
                      <button onClick={() => handleToggleStatus(item.username, item.status)} className={`w-full py-2 rounded shadow-sm flex items-center justify-center font-black text-xs gap-1 text-white ${item.status === 'inactive' ? 'bg-gray-400' : 'bg-[#10b981]'}`}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }} className="w-full bg-white border border-red-500 text-red-500 py-2 rounded shadow-sm flex items-center justify-center font-black text-xs">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        renderReportUI()
      )}

      <div className="text-gray-800 text-xs font-medium mt-2 italic">
        Welcome to Betproexchange SuperAdmin Portal.
      </div>
    </div>
  );
}
