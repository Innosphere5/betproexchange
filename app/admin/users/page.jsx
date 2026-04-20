"use client";

import { useState, useEffect } from "react";
import { Filter, Search, BookOpen, Edit2, X, DollarSign } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  // Load Balance Modal State
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadAmount, setLoadAmount] = useState("");

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

  const handleLoadBalance = async (e) => {
    e.preventDefault();
    if (!selectedUser || !loadAmount) return;

    setIsSaving(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/load-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          targetUsername: selectedUser.username, 
          amount: parseFloat(loadAmount)
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsLoadModalOpen(false);
        setLoadAmount("");
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.error || "Failed to load balance");
      }
    } catch (error) {
      console.error("Error loading balance:", error);
      alert("Failed to load balance. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#fbbf24] px-4 py-3 flex justify-between items-center text-gray-900">
              <h3 className="font-bold">Load Balance: {selectedUser?.username}</h3>
              <button onClick={() => setIsLoadModalOpen(false)} className="hover:bg-black/10 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLoadBalance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount to Add</label>
                <input
                  type="number"
                  required
                  value={loadAmount}
                  onChange={(e) => setLoadAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#fbbf24]"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#fbbf24] hover:bg-yellow-500 text-gray-900 font-bold py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Updating..." : "Add Balance"}
              </button>
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
          {['Book Detail', 'Book Detail 2', 'Daily PL', 'Daily Report', 'Final Sheet'].map(btn => (
            <button key={btn} className="border border-[#1abc9c] text-[#1abc9c] hover:bg-teal-50 px-3 py-1.5 text-sm font-medium rounded-sm">
              {btn}
            </button>
          ))}
          <button className="bg-[#1abc9c] border border-[#1abc9c] text-white px-3 py-1.5 text-sm font-medium rounded-sm shadow-sm">
            Accounts
          </button>
          <button className="border border-[#1abc9c] text-[#1abc9c] hover:bg-teal-50 px-3 py-1.5 text-sm font-medium rounded-sm">
            Commission Report
          </button>
        </div>
      </div>

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
          Malik50ADN - Clients List | Default
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

        {/* Main Table */}
        <div className="overflow-x-auto">
          {/* Green Load Balance Bar */}
          <div className="bg-[#1abc9c] px-4 py-2 flex items-center">
            <div className="bg-[#fbbf24] text-gray-900 text-xs font-bold px-3 py-1.5 rounded-sm">
              Load Balance
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
                <th className="px-4 py-2.5 font-bold text-gray-800 border-r border-gray-200">Exposure</th>
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
                    No users found. Click "New User" to create one.
                  </td>
                </tr>
              ) : (
                users.map((item, index) => (
                  <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold text-gray-800 border-r border-gray-200 flex items-center gap-1 whitespace-nowrap">
                      {item.username} 
                      <span className="w-4 h-4 bg-gray-800 text-white rounded-full inline-flex items-center justify-center text-[10px]">i</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200 uppercase">{item.role}</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold">{item.walletBalance?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200">-</td>
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200 font-bold text-[#1abc9c]">{item.walletBalance?.toLocaleString()}</td>
                    <td className="px-4 py-2 flex items-center gap-1">
                      <button 
                        onClick={() => { setSelectedUser(item); setIsLoadModalOpen(true); }}
                        className="bg-[#fbbf24] hover:bg-yellow-500 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center"
                      >
                        C
                      </button>
                      <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center"><Edit2 size={14} /></button>
                      <button className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center">L</button>
                      <button className="border border-red-500 text-red-500 hover:bg-red-50 font-bold p-1 rounded-sm w-7 h-7 flex items-center justify-center">D</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && users.length > 0 && (
            <div className="p-4 text-sm text-gray-600 border-b border-gray-200">
              Showing 1 to {users.length} of {users.length} entries
            </div>
          )}
        </div>
      </div>
      <div className="text-gray-800 text-sm font-medium mt-2">
        Welcome to Exchange.
      </div>
    </div>
  );
}
