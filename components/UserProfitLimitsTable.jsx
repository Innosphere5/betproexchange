"use client";

import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, CheckCircle2, XCircle, Edit3, RefreshCw, AlertTriangle, Check, Layers } from "lucide-react";
import { getApiUrl, getAuthToken } from "@/lib/apiConfig";

export default function UserProfitLimitsTable({ onEditUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Edit form state
  const [editMaxProfit, setEditMaxProfit] = useState("10000000");
  const [editCricket, setEditCricket] = useState("5000000");
  const [editCasino, setEditCasino] = useState("500000");
  const [editAviator, setEditAviator] = useState("500000");
  const [editAviatorX, setEditAviatorX] = useState("500000");
  const [editTeenPatti, setEditTeenPatti] = useState("500000");
  const [editDailyCap, setEditDailyCap] = useState("20000000");
  const [editIsEnabled, setEditIsEnabled] = useState(true);
  const [editApplyToChildren, setEditApplyToChildren] = useState(true);

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/admin/profit-limits-table`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load profit limits table:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUserForEdit(user);
    const pl = user.profitLimits || {};
    setEditMaxProfit(String(pl.maxProfit || 10000000));
    setEditCricket(String(pl.cricket || 5000000));
    setEditCasino(String(pl.casino || 500000));
    setEditAviator(String(pl.aviator || 500000));
    setEditAviatorX(String(pl.aviatorX || 500000));
    setEditTeenPatti(String(pl.teenpatti || 500000));
    setEditDailyCap(String(pl.dailyProfitCap || 20000000));
    setEditIsEnabled(pl.isEnabled !== false);
    setEditApplyToChildren(true);
    setIsEditModalOpen(true);
  };

  const handleSaveLimits = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const payload = {
        targetUsername: selectedUserForEdit.username,
        profitLimits: {
          isEnabled: editIsEnabled,
          maxProfit: parseFloat(editMaxProfit) || 10000000,
          cricket: parseFloat(editCricket) || 5000000,
          casino: parseFloat(editCasino) || 500000,
          aviator: parseFloat(editAviator) || 500000,
          aviatorX: parseFloat(editAviatorX) || 500000,
          teenpatti: parseFloat(editTeenPatti) || 500000,
          dailyProfitCap: parseFloat(editDailyCap) || 20000000
        },
        applyToChildren: editApplyToChildren
      };

      const res = await fetch(`${getApiUrl()}/api/admin/update-profit-limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profit limits");

      setFeedback({ type: "success", text: `Profit limits updated for ${selectedUserForEdit.username}!${data.downlineUpdated > 0 ? ` Cascaded to ${data.downlineUpdated} child accounts.` : ''}` });
      setIsEditModalOpen(false);
      fetchTableData();
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to save profit limits" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = getAuthToken();
      const currentStatus = user.profitLimits?.isEnabled !== false;
      const res = await fetch(`${getApiUrl()}/api/admin/update-profit-limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUsername: user.username,
          profitLimits: {
            ...user.profitLimits,
            isEnabled: !currentStatus
          },
          applyToChildren: true
        })
      });
      if (res.ok) {
        fetchTableData();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded border border-gray-200 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Accounts</span>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{users.length}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Limits Active</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
            {users.filter(u => u.profitLimits?.isEnabled !== false).length}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Default Max Cap</span>
          <p className="text-xl font-extrabold text-blue-600 mt-0.5">₹10,000,000</p>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={fetchTableData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded border border-gray-300 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh Table
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
          {feedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {feedback.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-gray-200">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search user by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#1abc9c]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#1abc9c]"
          >
            <option value="all">All Roles</option>
            <option value="user">Bettors Only</option>
            <option value="master">Masters</option>
            <option value="supermaster">SuperMasters</option>
          </select>
        </div>
      </div>

      {/* PROFIT LIMITS TABLE */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 border-r border-gray-200">Username</th>
                <th className="p-3 border-r border-gray-200">Role</th>
                <th className="p-3 border-r border-gray-200 text-right">Balance</th>
                <th className="p-3 border-r border-gray-200 text-right text-blue-700">Overall Max Profit</th>
                <th className="p-3 border-r border-gray-200 text-right">Cricket</th>
                <th className="p-3 border-r border-gray-200 text-right">Casino</th>
                <th className="p-3 border-r border-gray-200 text-right">Aviator</th>
                <th className="p-3 border-r border-gray-200 text-right">Aviator X</th>
                <th className="p-3 border-r border-gray-200 text-right">Teen Patti</th>
                <th className="p-3 border-r border-gray-200 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-gray-500 font-medium">
                    Loading profit limits...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-gray-500">
                    No child accounts found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const pl = u.profitLimits || {};
                  const isEnabled = pl.isEnabled !== false;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 border-r border-gray-200 font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {u.downlineCount > 0 && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                              {u.downlineCount} sub
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-r border-gray-200 uppercase font-semibold text-[10px] text-gray-600">
                        {u.role === 'user' ? 'Bettor' : u.role}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(u.walletBalance || 0).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-bold text-blue-700">
                        ₹{(pl.maxProfit || 10000000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(pl.cricket || 5000000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(pl.casino || 500000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(pl.aviator || 500000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(pl.aviatorX || 500000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-medium text-gray-800">
                        ₹{(pl.teenpatti || 500000).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            isEnabled
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title="Click to toggle profit limit status"
                        >
                          {isEnabled ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition-colors shadow-sm"
                            title="Edit Profit Limits"
                          >
                            <Edit3 size={11} /> Edit Limit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PROFIT LIMIT MODAL */}
      {isEditModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden border border-gray-300">
            <div className="bg-[#1abc9c] px-4 py-3 flex justify-between items-center text-white font-bold text-sm">
              <span className="flex items-center gap-1.5">
                <ShieldAlert size={16} /> Handle Profit Limit: {selectedUserForEdit.username}
              </span>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLimits} className="p-4 space-y-3.5">
              <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">Enforce Profit Limits</span>
                <input
                  type="checkbox"
                  checked={editIsEnabled}
                  onChange={(e) => setEditIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Overall Max Profit (Per Bet / Round)
                </label>
                <input
                  type="number"
                  value={editMaxProfit}
                  onChange={(e) => setEditMaxProfit(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1abc9c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cricket Limit</label>
                  <input
                    type="number"
                    value={editCricket}
                    onChange={(e) => setEditCricket(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Casino Limit</label>
                  <input
                    type="number"
                    value={editCasino}
                    onChange={(e) => setEditCasino(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Aviator Limit</label>
                  <input
                    type="number"
                    value={editAviator}
                    onChange={(e) => setEditAviator(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Aviator X Limit</label>
                  <input
                    type="number"
                    value={editAviatorX}
                    onChange={(e) => setEditAviatorX(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teen Patti Limit</label>
                  <input
                    type="number"
                    value={editTeenPatti}
                    onChange={(e) => setEditTeenPatti(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Cap</label>
                  <input
                    type="number"
                    value={editDailyCap}
                    onChange={(e) => setEditDailyCap(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-medium text-gray-800"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer bg-blue-50/70 p-2.5 rounded border border-blue-200">
                  <input
                    type="checkbox"
                    checked={editApplyToChildren}
                    onChange={(e) => setEditApplyToChildren(e.target.checked)}
                    className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">
                      Apply to all child accounts
                    </span>
                    <p className="text-[11px] text-gray-500">
                      All sub-accounts handled by {selectedUserForEdit.username} will inherit these profit limits.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold text-xs rounded transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Profit Limits"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

