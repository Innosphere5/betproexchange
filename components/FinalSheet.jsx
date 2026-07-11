"use client";

import React, { useState, useMemo, useCallback } from "react";
import { List, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Users, Search, ArrowUpDown, ChevronLeft, Eye, X, ArrowLeft, Loader2, Trophy, BarChart3 } from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

export default function FinalSheet({ data, onAccountClick, reportFilters }) {
  const [hideZero, setHideZero] = useState(false);
  const [showParentFor, setShowParentFor] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, admins, masters, bettors
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "username", direction: "ascending" });

  // ── Drill-Down State ──
  const [selectedBettor, setSelectedBettor] = useState(null);
  const [sportwiseData, setSportwiseData] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [betStatementData, setBetStatementData] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  // Build query string from reportFilters
  const buildFilterQuery = useCallback(() => {
    if (!reportFilters) return "";
    const { reportPeriod, selectedDate, selectedMonth, selectedYear, startDate, endDate } = reportFilters;
    let qs = `&reportType=${reportPeriod || 'daily'}`;
    if (reportPeriod === 'daily') qs += `&date=${selectedDate}`;
    else if (reportPeriod === 'monthly') qs += `&month=${selectedMonth}`;
    else if (reportPeriod === 'yearly') qs += `&year=${selectedYear}`;
    else if (reportPeriod === 'range') qs += `&startDate=${startDate}&endDate=${endDate}`;
    return qs;
  }, [reportFilters]);

  // ── Level 1: Fetch Sportwise Report ──
  const fetchSportwise = async (bettorName) => {
    setDrillLoading(true);
    setSelectedBettor(bettorName);
    setSelectedSport(null);
    setMarketData([]);
    setSelectedMarket(null);
    setBetStatementData(null);
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/daily-report-sportwise?bettor=${encodeURIComponent(bettorName)}${buildFilterQuery()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setSportwiseData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Sportwise fetch error:", err);
      setSportwiseData([]);
    } finally {
      setDrillLoading(false);
    }
  };

  // ── Level 2: Fetch Market Details ──
  const fetchMarketDetails = async (sport) => {
    setDrillLoading(true);
    setSelectedSport(sport);
    setSelectedMarket(null);
    setBetStatementData(null);
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/daily-report-market-details?bettor=${encodeURIComponent(selectedBettor)}&category=${encodeURIComponent(sport.category || sport.event)}${buildFilterQuery()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setMarketData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Market details fetch error:", err);
      setMarketData([]);
    } finally {
      setDrillLoading(false);
    }
  };

  // ── Level 3: Fetch Bet Statement ──
  const fetchBetStatement = async (market) => {
    setDrillLoading(true);
    setSelectedMarket(market);
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/daily-report-bet-statement?bettor=${encodeURIComponent(selectedBettor)}&matchId=${encodeURIComponent(market.matchId)}${buildFilterQuery()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setBetStatementData(data);
      }
    } catch (err) {
      console.error("Bet statement fetch error:", err);
      setBetStatementData(null);
    } finally {
      setDrillLoading(false);
    }
  };

  // ── Close Drill-Down ──
  const closeDrillDown = () => {
    setSelectedBettor(null);
    setSportwiseData([]);
    setSelectedSport(null);
    setMarketData([]);
    setSelectedMarket(null);
    setBetStatementData(null);
  };

  if (!data || !data.masterInfo) {
    return (
      <div className="bg-white p-10 text-center border border-gray-300 text-gray-500 rounded-sm">
        No settlement data available.
      </div>
    );
  }

  const {
    viewer,
    greenEntries = [],
    redEntries = [],
    totalGreen = 0,
    totalRed = 0,
    netAmount = 0,
    masterInfo,
    allUsers = []
  } = data;

  const isSuperAdmin = viewer === "SUPERADMIN";

  const filteredGreen = greenEntries.filter(e => !hideZero || e.amount !== 0);
  const filteredRed = redEntries.filter(e => !hideZero || e.amount !== 0);

  // Sorting Handler
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Helper to compute user settlement info
  const usersWithSettlement = useMemo(() => {
    return allUsers.map(user => {
      const greenEntry = greenEntries.find(e => e.accountName === user.username);
      const redEntry = redEntries.find(e => e.accountName === user.username);
      const greenAmt = greenEntry ? greenEntry.amount : 0;
      const redAmt = redEntry ? redEntry.amount : 0;
      const netAmt = greenAmt - redAmt;
      return {
        ...user,
        greenAmt,
        redAmt,
        netAmt
      };
    });
  }, [allUsers, greenEntries, redEntries]);

  // Tab filter and data logic
  const tabData = useMemo(() => {
    let roleFilter = "";
    if (activeTab === "admins") roleFilter = "admin";
    else if (activeTab === "masters") roleFilter = "master";
    else if (activeTab === "bettors") roleFilter = "user";

    if (!roleFilter) return [];

    let list = usersWithSettlement.filter(u => u.role === roleFilter);

    // Apply "Hide Zero" filter
    if (hideZero) {
      list = list.filter(u => u.netAmt !== 0);
    }

    // Apply Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.parentName && u.parentName.toLowerCase().includes(q))
      );
    }

    // Apply Sorting
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "amount") {
          aVal = a.netAmt;
          bVal = b.netAmt;
        }

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === "string") {
          return sortConfig.direction === "ascending"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return sortConfig.direction === "ascending"
            ? aVal - bVal
            : bVal - aVal;
        }
      });
    }

    return list;
  }, [activeTab, usersWithSettlement, hideZero, searchTerm, sortConfig]);

  // Compute stats for active tab
  const stats = useMemo(() => {
    let roleFilter = "";
    if (activeTab === "admins") roleFilter = "admin";
    else if (activeTab === "masters") roleFilter = "master";
    else if (activeTab === "bettors") roleFilter = "user";

    if (!roleFilter) return { totalCount: 0, totalGreen: 0, totalRed: 0, netPosition: 0 };

    const roleUsers = usersWithSettlement.filter(u => u.role === roleFilter);
    let totalCount = roleUsers.length;
    let tGreen = 0;
    let tRed = 0;

    roleUsers.forEach(u => {
      if (u.netAmt > 0) tGreen += u.netAmt;
      else if (u.netAmt < 0) tRed += Math.abs(u.netAmt);
    });

    return {
      totalCount,
      totalGreen: tGreen,
      totalRed: tRed,
      netPosition: tGreen - tRed
    };
  }, [activeTab, usersWithSettlement]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tabData.slice(startIndex, startIndex + itemsPerPage);
  }, [tabData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(tabData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const isDrillOpen = selectedBettor !== null;

  // ── Render the right-side drill-down panel ──
  const renderDrillPanel = () => {
    if (!isDrillOpen) return null;

    return (
      <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
        {/* ═══ Close Button ═══ */}
        <div className="flex items-center justify-between">
          <button
            onClick={closeDrillDown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded transition-colors border border-gray-300"
          >
            <X size={14} />
            Close Drill-Down
          </button>
        </div>

        {/* ═══ Level 1: Sportwise Report ═══ */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
          <div className="bg-[#2c3e50] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-[#1abc9c]" />
              <span className="font-bold text-white text-[12px]">
                {selectedBettor} — Sportwise Report
              </span>
            </div>
            {selectedSport && (
              <button
                onClick={() => {
                  setSelectedSport(null);
                  setMarketData([]);
                  setSelectedMarket(null);
                  setBetStatementData(null);
                }}
                className="text-white/60 hover:text-white text-[10px] font-bold transition-colors"
              >
                ← Back to Sports
              </button>
            )}
          </div>

          {drillLoading && !selectedSport && !selectedMarket ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin text-[#1abc9c]" />
              <span className="text-[12px] font-bold animate-pulse">Loading sportwise data...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sportwiseData.length > 0 ? (
                <>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                        <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Event</th>
                        <th className="px-3 py-2 font-bold text-gray-700 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sportwiseData.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => fetchMarketDetails(row)}
                          className={`cursor-pointer transition-colors border-b border-gray-50 ${selectedSport?.event === row.event
                              ? 'bg-blue-50 border-l-2 border-l-blue-500'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="px-3 py-2.5 border-r border-gray-100 font-medium text-blue-600">
                            <div className="flex items-center gap-1.5">
                              {row.event}
                              <ChevronRight size={12} className="text-gray-300" />
                            </div>
                          </td>
                          <td className={`px-3 py-2.5 text-right font-bold ${row.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#1abc9c] text-white font-bold">
                        <td className="px-3 py-2 border-r border-[#16a085] uppercase text-[10px]">Total</td>
                        <td className="px-3 py-2 text-right">
                          {sportwiseData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 text-[12px] italic">
                  No sportwise data found for this bettor.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ Level 2: Market Reports ═══ */}
        {selectedSport && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#34495e] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={14} className="text-yellow-400" />
                <span className="font-bold text-white text-[12px]">
                  {selectedBettor} / {selectedSport.event} — Markets Reports
                </span>
              </div>
              {selectedMarket && (
                <button
                  onClick={() => {
                    setSelectedMarket(null);
                    setBetStatementData(null);
                  }}
                  className="text-white/60 hover:text-white text-[10px] font-bold transition-colors"
                >
                  ← Back to Markets
                </button>
              )}
            </div>

            {drillLoading && !selectedMarket ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin text-yellow-500" />
                <span className="text-[12px] font-bold animate-pulse">Loading market data...</span>
              </div>
            ) : (
              <div>
                {marketData.length > 0 ? (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                        <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 w-[130px]">Date</th>
                        <th className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200">Event</th>
                        <th className="px-3 py-2 font-bold text-gray-700 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketData.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => fetchBetStatement(row)}
                          className={`cursor-pointer transition-colors border-b border-gray-50 ${selectedMarket?.matchId === row.matchId
                              ? 'bg-yellow-50 border-l-2 border-l-yellow-500'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="px-3 py-2.5 border-r border-gray-100 text-gray-500 text-[10px]">
                            {new Date(row.date).toLocaleString('en-GB', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </td>
                          <td className="px-3 py-2.5 border-r border-gray-100 font-medium text-[#1abc9c]">
                            <div className="flex items-center gap-1.5">
                              {row.event}
                              <ChevronRight size={12} className="text-gray-300" />
                            </div>
                          </td>
                          <td className={`px-3 py-2.5 text-right font-bold ${row.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#1abc9c] text-white font-bold">
                        <td colSpan="2" className="px-3 py-2 border-r border-[#16a085] uppercase text-[10px]">Total</td>
                        <td className="px-3 py-2 text-right">
                          {marketData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 text-[12px] italic">
                    No market data found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ Level 3: Bet Statement ═══ */}
        {selectedMarket && betStatementData && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#1a1a2e] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-yellow-400" />
                <span className="font-bold text-white text-[12px]">
                  Bet Statement — {selectedMarket.event}
                </span>
              </div>
            </div>

            {drillLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin text-purple-500" />
                <span className="text-[12px] font-bold animate-pulse">Loading bet statement...</span>
              </div>
            ) : (
              <div className="p-3">
                {/* Info Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-200">
                    Winner: {betStatementData.winner || 'PENDING'}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${betStatementData.netPL >= 0
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                    Net P/L: {betStatementData.netPL?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    User: {betStatementData.userName}
                  </span>
                </div>

                {/* Bets Table */}
                {betStatementData.bets && betStatementData.bets.length > 0 ? (
                  <div className="border border-gray-200 rounded-sm overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-left">
                          <th className="px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200">Runner</th>
                          <th className="px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200 text-center">Price</th>
                          <th className="px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200 text-center">Size</th>
                          <th className="px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200 text-center">Side</th>
                          <th className="px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200 text-right">P/L</th>
                          <th className="px-2 py-1.5 font-bold text-gray-700 text-right">Placed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {betStatementData.bets.map((bet, idx) => (
                          <tr key={idx} className={`border-b border-gray-50 ${bet.runner === 'Commission' ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-2 py-2 border-r border-gray-100 font-medium text-gray-800">
                              {bet.runner}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-100 text-center text-gray-600">
                              {bet.price}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-100 text-center text-gray-600">
                              {bet.size?.toLocaleString()}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-100 text-center">
                              {bet.side ? (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${bet.side === 'B'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                                  }`}>
                                  {bet.side}
                                </span>
                              ) : '—'}
                            </td>
                            <td className={`px-2 py-2 border-r border-gray-100 text-right font-bold ${bet.pl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {bet.pl?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 text-right text-gray-500 text-[9px]">
                              {bet.placedAt ? new Date(bet.placedAt).toLocaleString('en-GB', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                              }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-[12px] italic">
                    No bets found for this market.
                  </div>
                )}

                {/* Market Start Time */}
                {betStatementData.marketStartTime && (
                  <div className="mt-2 text-[10px] text-gray-500 font-medium">
                    Market Start: {new Date(betStatementData.marketStartTime).toLocaleString('en-GB', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Entry Row: renders a single bettor row (used in both green/red panels) ──
  const renderEntryRow = (entry, i, colorScheme) => {
    const isGreen = colorScheme === 'green';
    const amountColorClass = isGreen ? 'text-green-600' : 'text-red-600';
    const hoverBg = isGreen ? 'hover:bg-green-50/60' : 'hover:bg-red-50/40';
    const roleColor = isGreen ? 'text-green-600' : 'text-red-500';
    const isSelected = selectedBettor === entry.accountName;

    return (
      <div key={i} className={`px-4 py-3.5 ${hoverBg} transition-colors ${isSelected ? (isGreen ? 'bg-green-100/70 ring-1 ring-green-300' : 'bg-red-100/70 ring-1 ring-red-300') : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isGreen && (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Users size={14} className="text-red-500" />
              </div>
            )}
            <div
              className={`flex flex-col group ${entry.parentName ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (entry.parentName) {
                  setShowParentFor(showParentFor === entry.accountName ? null : entry.accountName);
                }
              }}
            >
              <div className="font-bold text-gray-900 text-[13px] group-hover:text-blue-600 transition-colors">
                {entry.accountName}
              </div>
              <div className={`text-[10px] ${roleColor} font-medium mt-0.5 capitalize flex flex-col gap-0.5`}>
                <span>{entry.role === 'user' ? 'Bettor' : entry.role}</span>
                {entry.parentName && (
                  <span className={`text-[10px] text-blue-500 font-bold italic transition-all duration-300 ${showParentFor === entry.accountName
                      ? 'opacity-100 max-h-10'
                      : 'opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-10'
                    }`}>
                    Parent: {entry.parentName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`font-black ${amountColorClass} text-[16px] cursor-pointer hover:underline hover:opacity-80 transition-all`}
              onClick={() => {
                if (reportFilters) {
                  fetchSportwise(entry.accountName);
                }
              }}
              title={reportFilters ? "Click for sportwise drill-down" : ""}
            >
              ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header Info Card ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={16} className="text-[#1abc9c]" />
            <span className="font-bold text-white text-[14px] tracking-wide">
              {viewer} — Final Settlement Sheet
            </span>
          </div>
          <div className="flex items-center gap-1 font-normal text-gray-400 text-[11px]">
            <input
              type="checkbox"
              id="hideZeroFS"
              checked={hideZero}
              onChange={e => {
                setHideZero(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-3 h-3 accent-[#1abc9c]"
            />
            <label htmlFor="hideZeroFS" className="cursor-pointer text-gray-300">Hide Zero</label>
          </div>
        </div>

        {/* Share Distribution Info Bar */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1abc9c] ring-2 ring-[#1abc9c]/30"></div>
            <span className="text-gray-600">
              Me (<span className="font-bold text-gray-800">{masterInfo.masterName}</span>):
            </span>
            <span className="bg-[#1abc9c] text-white font-bold px-2 py-0.5 rounded-full">
              {masterInfo.masterShare}%
            </span>
          </div>
          <ChevronRight size={12} className="text-gray-300" />
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-300/40"></div>
            <span className="text-gray-600">
              Parent (<span className="font-bold text-gray-800">{masterInfo.parentName}</span>):
            </span>
            <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
              {masterInfo.parentShare}%
            </span>
          </div>
          {masterInfo.grandParentName && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-300/40"></div>
                <span className="text-gray-600">
                  Grandparent (<span className="font-bold text-gray-800">{masterInfo.grandParentName}</span>):
                </span>
                <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {masterInfo.superAdminEffectiveShare}%
                </span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
            <span className="text-gray-500">
              Platform Fee: <span className="font-bold text-orange-500">5%</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs for SuperAdmin ── */}
      {isSuperAdmin && (
        <div className="flex flex-wrap border-b border-gray-300 bg-white p-1 rounded shadow-sm gap-2">
          {[
            { id: "overview", label: "Overview", count: null },
            { id: "admins", label: "All Admins", count: allUsers.filter(u => u.role === "admin").length },
            { id: "masters", label: "All Masters", count: allUsers.filter(u => u.role === "master").length },
            { id: "bettors", label: "All Bettors", count: allUsers.filter(u => u.role === "user").length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-4 py-2 text-[12px] font-bold rounded-sm transition-all border ${activeTab === tab.id
                  ? "bg-[#1abc9c] border-[#1abc9c] text-white shadow-sm"
                  : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {tab.label} {tab.count !== null && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-black/10 font-medium">{tab.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Tab Contents ── */}
      {(!isSuperAdmin || activeTab === "overview") ? (
        <>
          {/* ── Main Content Grid: Report + Drill-Down Panel ── */}
          <div className={`grid gap-4 ${isDrillOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {/* ─── Left: Green / Red Panels ─── */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ════════ GREEN PANEL ════════ */}
                {filteredGreen.length > 0 ? (
                  <div className="flex flex-col bg-white border-2 border-green-400 shadow-sm rounded-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-white" />
                        <span className="font-bold text-white text-[13px] uppercase tracking-wider">
                          Green Side — Incoming
                        </span>
                      </div>
                      <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        {filteredGreen.length} entr{filteredGreen.length !== 1 ? 'ies' : 'y'}
                      </span>
                    </div>

                    <div className="flex-1 divide-y divide-green-100">
                      {filteredGreen.map((entry, i) => renderEntryRow(entry, i, 'green'))}
                    </div>

                    <div className="bg-green-600 px-4 py-2.5 flex items-center justify-between mt-auto">
                      <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Green</span>
                      <span className="font-black text-white text-[15px]">
                        ₹{totalGreen.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2 border border-gray-300 rounded-sm bg-gray-50">
                    <AlertCircle size={24} className="text-gray-300" />
                    <span className="text-[12px] italic">No incoming settlements</span>
                  </div>
                )}

                {/* ════════ RED PANEL ════════ */}
                {filteredRed.length > 0 ? (
                  <div className="flex flex-col bg-white border-2 border-red-400 shadow-sm rounded-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-white" />
                        <span className="font-bold text-white text-[13px] uppercase tracking-wider">
                          Red Side — Outgoing
                        </span>
                      </div>
                      <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        {filteredRed.length} entr{filteredRed.length !== 1 ? 'ies' : 'y'}
                      </span>
                    </div>

                    <div className="flex-1 divide-y divide-red-100">
                      {filteredRed.map((entry, i) => renderEntryRow(entry, i, 'red'))}
                    </div>

                    <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between mt-auto">
                      <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Red</span>
                      <span className="font-black text-white text-[15px]">
                        ₹{totalRed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2 border border-gray-300 rounded-sm bg-gray-50">
                    <AlertCircle size={24} className="text-gray-300" />
                    <span className="text-[12px] italic">No outgoing settlements</span>
                  </div>
                )}
              </div>

              {/* ── Summary Bar ── */}
              <div className={`mt-2 p-4 rounded-sm text-white flex justify-between items-center shadow-md ${netAmount >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
                <div>
                  <span className="text-sm uppercase tracking-wider font-bold block">Net Position</span>
                  <span className="text-[11px] opacity-80">(Total Green - Total Red)</span>
                </div>
                <span className="text-2xl font-black">
                  {netAmount >= 0 ? `+₹${netAmount.toLocaleString()}` : `-₹${Math.abs(netAmount).toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* ─── Right: Drill-Down Panels ─── */}
            {isDrillOpen && renderDrillPanel()}
          </div>
        </>
      ) : (
        /* ── Role Tab view ── */
        <div className="flex flex-col gap-4">
          {/* ── Summary Stats Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Accounts</span>
              <span className="text-xl font-black text-gray-800 mt-2">{stats.totalCount}</span>
            </div>
            <div className="bg-white border-l-4 border-green-500 border-t border-r border-b border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-green-600 font-bold uppercase tracking-wider">Total Green (Incoming)</span>
              <span className="text-xl font-black text-green-600 mt-2">
                ₹{stats.totalGreen.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white border-l-4 border-red-500 border-t border-r border-b border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-red-600 font-bold uppercase tracking-wider">Total Red (Outgoing)</span>
              <span className="text-xl font-black text-red-600 mt-2">
                ₹{stats.totalRed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`bg-white border-l-4 ${stats.netPosition >= 0 ? 'border-emerald-500' : 'border-rose-500'} border-t border-r border-b border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm`}>
              <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">Net Role Position</span>
              <span className={`text-xl font-black ${stats.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-2`}>
                {stats.netPosition >= 0 ? "+" : "-"}₹{Math.abs(stats.netPosition).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ── Search Filter ── */}
          <div className="bg-white border border-gray-300 rounded-sm p-4 flex items-center gap-2 shadow-sm">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search username or parent..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-[12px] outline-none hover:border-gray-400 focus:border-[#1abc9c] transition-colors"
              />
            </div>
          </div>

          {/* ── Data Table ── */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#f2f2f2] border-b border-gray-300 text-left text-gray-700 font-bold">
                    <th onClick={() => requestSort("username")} className="px-4 py-3 cursor-pointer hover:bg-gray-200 border-r border-gray-300 select-none">
                      <div className="flex items-center gap-1">
                        Username <ArrowUpDown size={12} className="text-gray-400" />
                      </div>
                    </th>
                    {activeTab !== "admins" && (
                      <th onClick={() => requestSort("parentName")} className="px-4 py-3 cursor-pointer hover:bg-gray-200 border-r border-gray-300 select-none">
                        <div className="flex items-center gap-1">
                          Parent <ArrowUpDown size={12} className="text-gray-400" />
                        </div>
                      </th>
                    )}
                    <th onClick={() => requestSort("share")} className="px-4 py-3 cursor-pointer hover:bg-gray-200 border-r border-gray-300 select-none w-[100px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        Share (%) <ArrowUpDown size={12} className="text-gray-400" />
                      </div>
                    </th>
                    <th onClick={() => requestSort("amount")} className="px-4 py-3 cursor-pointer hover:bg-gray-200 border-r border-gray-300 select-none text-right">
                      <div className="flex items-center justify-end gap-1">
                        Net Amount <ArrowUpDown size={12} className="text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 border-r border-gray-300 text-center w-[120px]">Status</th>
                    {activeTab === "bettors" && onAccountClick && (
                      <th className="px-4 py-3 text-center w-[100px]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((user, idx) => {
                      const statusClass =
                        user.netAmt > 0
                          ? "bg-green-50 text-green-700 border-green-200"
                          : user.netAmt < 0
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-500 border-gray-100";

                      const statusText =
                        user.netAmt > 0
                          ? "Receivable"
                          : user.netAmt < 0
                            ? "Payable"
                            : "No Activity";

                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 border-r border-gray-100 font-bold text-gray-900">{user.username}</td>
                          {activeTab !== "admins" && (
                            <td className="px-4 py-3.5 border-r border-gray-100 text-gray-600 font-medium">{user.parentName || "—"}</td>
                          )}
                          <td className="px-4 py-3.5 border-r border-gray-100 text-center text-gray-600 font-medium">{user.share}%</td>
                          <td className={`px-4 py-3.5 border-r border-gray-100 text-right font-black text-[13px] ${user.netAmt > 0 ? "text-green-600" : user.netAmt < 0 ? "text-red-500" : "text-gray-400"}`}>
                            {user.netAmt !== 0 ? `₹${user.netAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "₹0.00"}
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                          {activeTab === "bettors" && onAccountClick && (
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => onAccountClick(user.username, 'all')}
                                className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider flex items-center gap-1 mx-auto transition-colors"
                              >
                                <Eye size={12} />
                                View
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeTab === "bettors" && onAccountClick ? 6 : 5} className="px-4 py-10 text-center text-gray-400 italic">
                        No accounts found matching current search/filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="bg-[#f2f2f2] border-t border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-600 font-bold">
                  Showing {Math.min(tabData.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(tabData.length, currentPage * itemsPerPage)} of {tabData.length} records
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-in duration-200"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded border ${currentPage === page
                          ? "bg-[#1abc9c] border-[#1abc9c] text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-in duration-200"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
