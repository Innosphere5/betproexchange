"use client";

import { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Edit2, X, DollarSign } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function MasterUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newType, setNewType] = useState("user");
  const [initialBalance, setInitialBalance] = useState("0");
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

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPassword, setEditPassword] = useState("");

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
          initialBalance: parseFloat(initialBalance)
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setNewUsername("");
        setNewPassword("");
        setInitialBalance("0");
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
          type: tab // cash or credit
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
        alert(data.error || "Failed to delete player");
      }
    } catch (error) {
      console.error("Error removing player:", error);
      alert("Failed to remove player. Check connection.");
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
                    <tr className="bg-[#f39c12] text-white font-bold">
                      <td className="px-3 py-2 border-r border-orange-600">Total</td>
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
                Master - Final Sheet
              </div>
              <div className="flex items-center gap-1 font-normal text-gray-600 text-[11px]">
                <input type="checkbox" id="hideZero" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="w-3 h-3 accent-[#f39c12]" />
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
                            <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase">Bettor</span>
                          </td>
                          <td className={`px-3 py-2 font-bold ${u.walletBalance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {u.walletBalance?.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f39c12] text-white font-bold">
                      <td className="px-3 py-2 border-r border-orange-600">Total</td>
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
              Master - Commission Report
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
                <Filter size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Permanently Delete Player?</h3>
              <p className="text-gray-600 mt-2 text-sm px-4">
                Are you sure you want to remove <span className="font-bold text-red-600">@{userToDelete?.username}</span>? This action will wipe all performance data for this user.
              </p>
            </div>
            <div className="p-6 bg-white flex flex-col gap-3">
              <button
                onClick={handleRemoveUser}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "Purging User..." : "Yes, Delete Player"}
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
      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#f39c12] px-4 py-3 flex justify-between items-center text-white">
              <h3 className="font-bold">Create New Player (Bettor)</h3>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Enter initial balance"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#f39c12]"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#f39c12] hover:bg-yellow-600 text-white font-bold py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Save Player"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal (Pencil) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white">
              <h3 className="font-bold uppercase tracking-tighter italic flex items-center gap-2">
                <Edit2 size={18} /> Edit Player: {selectedUser?.username}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5 font-sans">
              <div className="bg-teal-50 p-3 rounded border border-teal-100 mb-2">
                <p className="text-[11px] text-teal-700 font-bold uppercase tracking-widest">Account Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-black text-gray-800 uppercase">{selectedUser?.status || 'active'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Update Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password (optional)"
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#1abc9c] focus:ring-2 focus:ring-teal-100 transition-all font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Leave blank to keep current password.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1abc9c] hover:bg-teal-700 text-white font-black py-3 rounded-lg shadow-lg shadow-teal-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSaving ? "Saving..." : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Load/Reduce Balance Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 border border-gray-300">
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
                  <p className="text-[12px] font-bold text-gray-700">{activeTab === 'cash' ? 'Credit' : 'Credit limit'}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">{activeTab === 'cash' ? '0 Rs.' : '50,000 Rs.'}</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">{activeTab === 'cash' ? 'Balance' : `${selectedUser?.username} Credit`}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">{activeTab === 'cash' ? `${selectedUser?.walletBalance?.toLocaleString()} Rs.` : '0 Rs.'}</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-[12px] font-bold text-gray-700">{activeTab === 'cash' ? 'Max Withdraw' : `${selectedUser?.username} Available Balance`}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">{activeTab === 'cash' ? `${selectedUser?.walletBalance?.toLocaleString()} Rs.` : '0 Rs.'}</p>
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
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 flex items-center font-bold text-gray-800 text-[13px]">
              <Filter size={16} className="mr-2 text-gray-700" />
              Search-Users
            </div>
            <div className="p-4 flex items-center gap-0 w-full max-w-lg">
              <input 
                type="text" 
                placeholder="Username" 
                className="border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#f39c12] w-64 text-sm"
              />
              <button className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 flex items-center gap-1 text-sm font-semibold">
                <Search size={14} />
                Search
              </button>
            </div>
          </div>

          {/* Main Clients List Panel */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-[#f2f2f2] border-b border-gray-300 px-3 py-2 font-bold text-gray-800 text-[13px]">
              Master - Clients List | Default
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
                  className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 text-sm font-semibold rounded-sm shadow-sm transition-all"
                >
                  New Player
                </button>
                <button className="bg-[#f39c12] hover:bg-orange-600 text-white px-3 py-1.5 text-sm font-semibold rounded-sm flex items-center gap-1">
                  <BookOpen size={16} />
                  Account Ledger
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600 uppercase font-black">
                <span className="flex items-center gap-1"><span className="bg-[#fbbf24] text-white px-1.5 py-0.5 rounded-sm">C</span> Cash / Credit</span>
                <span className="flex items-center gap-1"><span className="bg-[#1abc9c] text-white px-1.5 py-0.5 rounded-sm"><Edit2 size={12} /></span> Edit</span>
                <span className="flex items-center gap-1"><span className="bg-[#3b82f6] text-white px-1.5 py-0.5 rounded-sm">L</span> Ledger</span>
                <span className="flex items-center gap-1"><span className="bg-[#10b981] text-white px-1.5 py-0.5 rounded-sm">A</span> Active</span>
                <span className="flex items-center gap-1"><span className="border text-red-500 border-red-500 bg-white px-1.5 py-0.5 rounded-sm">D</span> InActive</span>
              </div>
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
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Balance</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Client (P/L)</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Share</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Accounts</th>
                    <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Available Balance</th>
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
                        No users found. Click "New Player" to create one.
                      </td>
                    </tr>
                  ) : (
                    users.map((item) => (
                      <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-gray-800 border-r border-gray-200 flex items-center gap-1 whitespace-nowrap">
                          {item.username} 
                          <span className="w-4 h-4 bg-gray-800 text-white rounded-full inline-flex items-center justify-center text-[10px]">i</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 uppercase font-black">{item.role === 'user' ? 'Bettor' : item.role}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{item.walletBalance?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                        <td className="px-4 py-2 text-blue-600 border-r border-gray-200 font-bold">{item.downlineCount || 0}</td>
                        <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold text-[#f39c12]">{item.walletBalance?.toLocaleString()}</td>
                        <td className="px-4 py-2 flex items-center gap-1">
                          {item.role === 'user' && (
                            <button 
                              onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }}
                              className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-90"
                              title="Add/Reduce Cash"
                            >
                              C
                            </button>
                          )}
                          <button 
                            onClick={() => { setSelectedUser(item); setEditPassword(""); setIsEditModalOpen(true); }}
                            className="bg-[#1abc9c] hover:bg-teal-700 text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm"
                            title="Edit Player Info"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }}
                            className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center shadow-sm"
                          >
                            L
                          </button>
                          <button 
                            onClick={() => { setUserToDelete(item); setIsDeleteModalOpen(true); }}
                            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center transition-all active:scale-90"
                            title="Delete Player"
                          >
                            D
                          </button>
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
                        </div>
                      </div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status || 'active'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => { setSelectedUser(item); setActiveTab("cash"); setIsLoadModalOpen(true); }} className="w-full bg-[#fbbf24] text-white py-2 rounded shadow-sm flex items-center justify-center font-black text-xs gap-1">Credit</button>
                      <button onClick={() => { setSelectedUser(item); setEditPassword(""); setIsEditModalOpen(true); }} className="w-full bg-[#1abc9c] text-white py-2 rounded shadow-sm flex items-center justify-center gap-1"><Edit2 size={14} /><span className="text-xs font-bold">Edit</span></button>
                      <button onClick={() => { setSelectedUser(item); fetchUserStatement(item.username); }} className="w-full bg-[#3b82f6] text-white py-2 rounded shadow-sm flex items-center justify-center font-black text-xs gap-1">Ledger</button>
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
      <div className="text-gray-800 text-sm font-medium mt-2 italic">
        Welcome to Exchange.
      </div>
    </div>
  );
}
