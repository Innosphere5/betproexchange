"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Shield, DollarSign, CheckSquare, Layers, Lock, AlertCircle, Check } from "lucide-react";
import { getApiUrl, getAuthToken } from "@/lib/apiConfig";

export default function EditClientModal({ isOpen, onClose, user, onUserUpdated, currentRole = "master" }) {
  const [activeTab, setActiveTab] = useState("editUser"); // 'editUser', 'profitLimits'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Left column state (matching Image 1)
  const [clientId, setClientId] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("Bettor");
  const [currency] = useState("Rs.");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bettingAllowed, setBettingAllowed] = useState(true);
  const [canSettlePL, setCanSettlePL] = useState(false);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [commission, setCommission] = useState("2.00");
  const [userDomain] = useState("1 (betproexch.com)");

  // Right column state - Max Bet Sizes (matching Image 1 + Aviator, Aviator X, Teen Patti)
  const [maxBetSizes, setMaxBetSizes] = useState({
    soccer: "1000000.00",
    tennis: "250000.00",
    cricket: "5000000.00",
    fancy: "2000000.00",
    races: "200000.00",
    casino: "50000.00",
    greyhound: "50000.00",
    bookmaker: "2000000.00",
    aviator: "50000.00",
    aviatorX: "50000.00",
    teenpatti: "50000.00"
  });

  // Profit Limits state
  const [profitLimits, setProfitLimits] = useState({
    isEnabled: true,
    maxProfit: "10000000.00",
    cricket: "5000000.00",
    casino: "500000.00",
    aviator: "500000.00",
    aviatorX: "500000.00",
    teenpatti: "500000.00",
    soccer: "2000000.00",
    tennis: "1000000.00",
    fancy: "2000000.00",
    bookmaker: "2000000.00",
    dailyProfitCap: "20000000.00"
  });

  // Parent ceiling limits (for displaying "Max: X")
  const [parentMaxBetCaps, setParentMaxBetCaps] = useState({});
  const [parentProfitCaps, setParentProfitCaps] = useState({});

  // Cascading & security options
  const [applyToChildren, setApplyToChildren] = useState(true);
  const [tpin, setTpin] = useState("");

  const loadUserDetails = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/admin/user-limits/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const u = data.user || user;
        setClientId(u.clientId || (u._id ? u._id.toString().substring(0, 7) : "7547995"));
        setUsername(u.username);
        setUserType(u.role === 'user' ? 'Bettor' : (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Bettor'));
        setIsActive(u.status !== 'inactive');
        setBettingAllowed(u.bettingAllowed !== false);
        setCanSettlePL(Boolean(u.allowSettlement));
        setPhone(u.phone || "");
        setReference(u.reference || "");
        setNotes(u.notes || "");
        setCommission(u.commission !== undefined ? String(u.commission) : "2.00");

        if (u.maxBetSizes) {
          const m = {};
          for (const [k, v] of Object.entries(u.maxBetSizes)) {
            m[k] = (typeof v === 'number') ? v.toFixed(2) : String(v);
          }
          setMaxBetSizes(prev => ({ ...prev, ...m }));
        }

        if (u.profitLimits) {
          const p = {};
          for (const [k, v] of Object.entries(u.profitLimits)) {
            if (typeof v === 'number') p[k] = v.toFixed(2);
            else if (typeof v === 'boolean') p[k] = v;
          }
          setProfitLimits(prev => ({ ...prev, ...p }));
        }

        if (data.parentMaxBetSizes) setParentMaxBetCaps(data.parentMaxBetSizes);
        if (data.parentProfitLimits) setParentProfitCaps(data.parentProfitLimits);
      } else {
        // Fallback to existing user object
        setClientId(user.clientId || (user._id ? user._id.toString().substring(0, 7) : "7547995"));
        setUsername(user.username);
        setUserType(user.role === 'user' ? 'Bettor' : (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Bettor'));
        setIsActive(user.status !== 'inactive');
        setBettingAllowed(user.bettingAllowed !== false);
        setCanSettlePL(Boolean(user.allowSettlement));
      }
    } catch (err) {
      console.error("Error loading user limits:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadUserDetails();
    }
  }, [isOpen, user, loadUserDetails]);

  const handleMaxBetChange = (key, value) => {
    setMaxBetSizes(prev => ({ ...prev, [key]: value }));
  };

  const handleProfitLimitChange = (key, value) => {
    setProfitLimits(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const token = getAuthToken();
      const numericMaxBets = {};
      for (const [k, v] of Object.entries(maxBetSizes)) {
        const parsed = parseFloat(v);
        if (!isNaN(parsed) && parsed >= 0) numericMaxBets[k] = parsed;
      }

      const numericProfitLimits = {
        isEnabled: Boolean(profitLimits.isEnabled)
      };
      for (const [k, v] of Object.entries(profitLimits)) {
        if (k !== 'isEnabled') {
          const parsed = parseFloat(v);
          if (!isNaN(parsed) && parsed >= 0) numericProfitLimits[k] = parsed;
        }
      }

      const payload = {
        targetUsername: username,
        newPassword: password.trim() !== "" ? password : undefined,
        isActive,
        status: isActive ? "active" : "inactive",
        bettingAllowed,
        allowSettlement: canSettlePL,
        phone,
        reference,
        notes,
        commission: parseFloat(commission) || 2.0,
        maxBetSizes: numericMaxBets,
        profitLimits: numericProfitLimits,
        applyToChildren
      };

      const res = await fetch(`${getApiUrl()}/api/admin/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update client");
      }

      setMessage(`Client ${username} updated successfully!${data.downlineUpdated > 0 ? ` Applied limits to ${data.downlineUpdated} child accounts.` : ''}`);
      if (onUserUpdated) onUserUpdated(data.user);
      setPassword("");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update client details");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-2 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-300 my-4 text-gray-800">
        
        {/* Navigation / Action Bar (matching Image 1 top tabs) */}
        <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("editUser")}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
                activeTab === "editUser"
                  ? "bg-[#1abc9c] text-white shadow-sm"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Edit User
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profitLimits")}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
                activeTab === "profitLimits"
                  ? "bg-[#1abc9c] text-white shadow-sm"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Profit Limits
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#1abc9c] text-white rounded-sm opacity-90 hover:opacity-100"
              onClick={() => alert(`Ledger report for ${username} is available in main user table.`)}
            >
              Ledger
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#1abc9c] text-white rounded-sm opacity-90 hover:opacity-100"
              onClick={() => alert(`Bets history for ${username} is available in reports.`)}
            >
              Bets
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#1abc9c] text-white rounded-sm opacity-90 hover:opacity-100"
              onClick={() => alert(`Profit & Loss history for ${username} is available in reports.`)}
            >
              Profit Loss
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#1abc9c] text-white rounded-sm opacity-90 hover:opacity-100"
              onClick={() => alert(`Current position for ${username} is available in Match Exposure.`)}
            >
              Current Position
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800 tracking-wide">{username}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback alert messages */}
        {message && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mx-4 mt-3 text-xs text-emerald-800 flex items-center gap-2">
            <Check size={16} /> {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mt-3 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          {activeTab === "editUser" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN: Edit Client Details (matching Image 1) */}
              <div className="space-y-3.5">
                <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-200">
                  Edit Client - <span className="text-gray-800">{username}</span>
                </h2>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">ID</span>
                  <span className="col-span-2 text-gray-800 font-medium">{clientId}</span>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Username</span>
                  <span className="col-span-2 text-gray-800 font-bold">{username}</span>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Type</span>
                  <span className="col-span-2 text-gray-800 font-medium">{userType}</span>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Currency</span>
                  <span className="col-span-2 text-gray-800 font-medium">{currency}</span>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Password</span>
                  <div className="col-span-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep unchanged"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">IsActive</span>
                  <div className="col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="isActiveClient"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded focus:ring-[#1abc9c] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Betting Allowed</span>
                  <div className="col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="bettingAllowedClient"
                      checked={bettingAllowed}
                      onChange={(e) => setBettingAllowed(e.target.checked)}
                      className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded focus:ring-[#1abc9c] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Can Settle PL</span>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="canSettlePLClient"
                      checked={canSettlePL}
                      onChange={(e) => setCanSettlePL(e.target.checked)}
                      className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded focus:ring-[#1abc9c] cursor-pointer"
                    />
                    <label htmlFor="canSettlePLClient" className="text-gray-600 cursor-pointer">
                      Enable S button
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Phone</span>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">Reference</span>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-start text-xs">
                  <span className="font-semibold text-gray-600 pt-1.5">Notes</span>
                  <div className="col-span-2">
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-start text-xs">
                  <span className="font-semibold text-gray-600 pt-1.5">Commission</span>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="w-full border border-gray-300 bg-gray-100 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Min commission is 2.00 %</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-xs">
                  <span className="font-semibold text-gray-600">UserDomain</span>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={userDomain}
                      readOnly
                      className="w-full border border-gray-200 bg-gray-50 rounded px-2.5 py-1.5 text-xs text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Max Bet Sizes (matching Image 1) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900">Max Bet Sizes</h2>
                  <span className="text-[11px] text-gray-500">Amounts in Rs.</span>
                </div>

                {/* Sports and Games Bet Inputs */}
                {[
                  { key: "soccer", label: "Soccer", defaultCap: 1000000 },
                  { key: "tennis", label: "Tennis", defaultCap: 250000 },
                  { key: "cricket", label: "Cricket", defaultCap: 5000000 },
                  { key: "fancy", label: "Fancy", defaultCap: 2000000 },
                  { key: "races", label: "Races", defaultCap: 200000 },
                  { key: "casino", label: "Casino", defaultCap: 50000 },
                  { key: "greyhound", label: "Greyhound", defaultCap: 50000 },
                  { key: "bookmaker", label: "BookMaker", defaultCap: 2000000 },
                  { key: "aviator", label: "Aviator", defaultCap: 50000 },
                  { key: "aviatorX", label: "Aviator X", defaultCap: 50000 },
                  { key: "teenpatti", label: "Teen Patti", defaultCap: 50000 }
                ].map(({ key, label, defaultCap }) => {
                  const cap = parentMaxBetCaps[key] || defaultCap;
                  return (
                    <div key={key} className="grid grid-cols-3 items-center text-xs">
                      <span className="font-semibold text-gray-700">{label}</span>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="1"
                          value={maxBetSizes[key] || ""}
                          onChange={(e) => handleMaxBetChange(key, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs text-right font-medium focus:outline-none focus:border-[#1abc9c]"
                        />
                        <div className="text-[10px] text-gray-500 text-right mt-0.5">
                          Max: {cap.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Apply to children checkbox */}
                <div className="pt-2 border-t border-gray-200">
                  <label className="flex items-start gap-2 cursor-pointer bg-blue-50/60 p-2 rounded border border-blue-200/60">
                    <input
                      type="checkbox"
                      checked={applyToChildren}
                      onChange={(e) => setApplyToChildren(e.target.checked)}
                      className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded focus:ring-[#1abc9c] mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800">
                        Apply Max Bet Sizes to all child accounts
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Propagates these bet limits to all current and future downline accounts handled by this user.
                      </p>
                    </div>
                  </label>
                </div>

                {/* T-PIN Input (Image 1) */}
                <div className="grid grid-cols-3 items-center text-xs pt-1">
                  <span className="font-semibold text-gray-700">T-PIN</span>
                  <div className="col-span-2">
                    <input
                      type="password"
                      value={tpin}
                      onChange={(e) => setTpin(e.target.value)}
                      placeholder="Enter T-PIN"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>

                {/* Submit button (matching green button on Image 1) */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PROFIT LIMITS VIEW (Requirement 2) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-bold text-gray-900">User Profit Limits</h2>
                  <p className="text-xs text-gray-500">
                    Cap maximum net winnings allowed per bet/round for {username} and downline child accounts.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                  <input
                    type="checkbox"
                    checked={profitLimits.isEnabled}
                    onChange={(e) => handleProfitLimitChange("isEnabled", e.target.checked)}
                    className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800">Profit Limit Active</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Overall Limits</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Max Profit Limit (Per Bet / Round)
                    </label>
                    <input
                      type="number"
                      value={profitLimits.maxProfit || ""}
                      onChange={(e) => handleProfitLimitChange("maxProfit", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-bold text-gray-800"
                    />
                    <span className="text-[11px] text-gray-500">Default: ₹10,000,000</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Daily User Profit Cap
                    </label>
                    <input
                      type="number"
                      value={profitLimits.dailyProfitCap || ""}
                      onChange={(e) => handleProfitLimitChange("dailyProfitCap", e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-bold text-gray-800"
                    />
                    <span className="text-[11px] text-gray-500">Default: ₹20,000,000</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Game-Specific Profit Caps</h3>
                  
                  {[
                    { key: "cricket", label: "Cricket Profit Limit", defaultCap: 5000000 },
                    { key: "casino", label: "Casino Profit Limit", defaultCap: 500000 },
                    { key: "aviator", label: "Aviator Profit Limit", defaultCap: 500000 },
                    { key: "aviatorX", label: "Aviator X Profit Limit", defaultCap: 500000 },
                    { key: "teenpatti", label: "Teen Patti Profit Limit", defaultCap: 500000 },
                    { key: "soccer", label: "Soccer Profit Limit", defaultCap: 2000000 },
                    { key: "tennis", label: "Tennis Profit Limit", defaultCap: 1000000 }
                  ].map(({ key, label, defaultCap }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">{label}</span>
                      <input
                        type="number"
                        value={profitLimits[key] || ""}
                        onChange={(e) => handleProfitLimitChange(key, e.target.value)}
                        className="w-36 border border-gray-300 rounded px-2 py-1 text-xs text-right font-bold text-gray-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer bg-blue-50/60 p-2.5 rounded border border-blue-200/60">
                  <input
                    type="checkbox"
                    checked={applyToChildren}
                    onChange={(e) => setApplyToChildren(e.target.checked)}
                    className="w-4 h-4 text-[#1abc9c] border-gray-300 rounded focus:ring-[#1abc9c] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">
                      Apply Profit Limits to all child accounts
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Cascades these profit limits down to every sub-account handled by {username}.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2.5 px-4 rounded text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving Profit Limits..." : "Save Profit Limits"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

