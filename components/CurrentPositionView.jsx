"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Trophy,
  Clock,
  ShieldCheck,
  User,
  Layers
} from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "@/lib/apiConfig";

export default function CurrentPositionView({ 
  role = "admin", 
  roleTitle = "Admin",
  themeColor = "#20a88a" 
}) {
  const [runnerPositions, setRunnerPositions] = useState([]);
  const [matchedBets, setMatchedBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedMarketKey, setExpandedMarketKey] = useState(null);
  const [userSession, setUserSession] = useState(null);

  const getAuthToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user_session");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.token;
    } catch {
      return null;
    }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resPos, resBets] = await Promise.all([
        fetch(`${getApiUrl()}/api/admin/current-position`, { headers }),
        fetch(`${getApiUrl()}/api/admin/current-position-bets`, { headers })
      ]);

      if (resPos.ok) {
        const dataPos = await resPos.json();
        setRunnerPositions(Array.isArray(dataPos) ? dataPos : []);
      }
      if (resBets.ok) {
        const dataBets = await resBets.json();
        setMatchedBets(Array.isArray(dataBets) ? dataBets : []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[CurrentPosition] Fetch error:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [getAuthToken]);

  // Load session from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("user_session");
      if (raw) {
        try {
          setUserSession(JSON.parse(raw));
        } catch {}
      }
    }
  }, []);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Socket.IO real-time event listener for live updates
  useEffect(() => {
    const socket = io(getApiUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    socket.on("bet_placed", () => fetchData(true));
    socket.on("bet_settled", () => fetchData(true));
    socket.on("match_settled", () => fetchData(true));
    socket.on("wallet_updated", () => fetchData(true));
    socket.on("match_updated", () => fetchData(true));

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  // Group runner positions into unique markets
  // Matches layout: {Match Name} / {Market Name}
  const groupedMarkets = useMemo(() => {
    const map = new Map();

    runnerPositions.forEach(item => {
      const mType = item.marketType || "match_odds";
      const key = `${item.matchId || item.matchName}_${mType}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          sport: item.sport || "Cricket",
          matchId: item.matchId,
          matchName: item.matchName || item.name,
          marketType: mType,
          marketTitle: item.marketTitle || `${item.matchName || "Match"} / Match Odds`,
          marketAmount: item.marketAmount != null ? item.marketAmount : null,
          status: item.status || (item.isResulted ? "completed" : "live"),
          isResulted: Boolean(item.isResulted),
          winner: item.winner || null,
          runners: []
        });
      }

      map.get(key).runners.push(item);
    });

    // Calculate final market amount for each market if not directly provided
    const markets = Array.from(map.values()).map(m => {
      let finalAmount = m.marketAmount;
      if (finalAmount == null) {
        const amounts = m.runners.map(r => r.amount || 0);
        if (amounts.length > 0) {
          finalAmount = Math.min(...amounts);
        } else {
          finalAmount = 0;
        }
      }
      return {
        ...m,
        amount: Math.round(finalAmount)
      };
    });

    return markets;
  }, [runnerPositions]);

  // Group markets by sport (e.g. Cricket)
  const sportsGrouped = useMemo(() => {
    const sportsMap = new Map();
    groupedMarkets.forEach(m => {
      const sportName = m.sport || "Cricket";
      if (!sportsMap.has(sportName)) {
        sportsMap.set(sportName, []);
      }
      sportsMap.get(sportName).push(m);
    });

    // Ensure Cricket is always present as a group if markets exist or by default
    if (sportsMap.size === 0) {
      sportsMap.set("Cricket", []);
    }

    return sportsMap;
  }, [groupedMarkets]);

  const toggleExpandMarket = (key) => {
    setExpandedMarketKey(prev => prev === key ? null : key);
  };

  const formatAmountDisplay = (amount) => {
    if (amount == null || isNaN(amount)) return "0";
    const num = Math.round(amount);
    if (num === 0) return "0";
    if (num < 0) {
      return `-${Math.abs(num).toLocaleString("en-IN")}`;
    }
    return `+${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="w-full font-sans antialiased bg-[#eaedf1] min-h-screen p-2 md:p-4 text-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">

        {/* ─── Main Market Position Card ─── */}
        <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
          
          {/* ─── Card Header Bar ─── */}
          <div className="bg-[#f8f9fa] border-b border-gray-300 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-gray-800 tracking-tight">
                Market Position
              </h1>
              {lastUpdated && (
                <span className="hidden sm:inline-block text-[11px] text-gray-400 font-mono">
                  • {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Button - Exactly matches uploaded layout */}
              <button
                id="market-position-refresh-btn"
                onClick={() => fetchData(false)}
                disabled={isLoading}
                className="bg-[#20a88a] hover:bg-[#1ca082] active:scale-95 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ─── Card Content: Market Position Tables by Sport ─── */}
          <div className="p-2 md:p-3 bg-white">
            {Array.from(sportsGrouped.entries()).map(([sportName, markets]) => (
              <div 
                key={sportName} 
                className="border border-gray-300 rounded-xs overflow-hidden mb-3 bg-white"
              >
                <table className="w-full text-left border-collapse table-fixed">
                  {/* Table Header: Column 1 = Sport Name (e.g. Cricket), Column 2 = Amount */}
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-gray-300 text-gray-800">
                      <th className="px-3 py-2 text-xs md:text-sm font-bold border-r border-gray-300 w-auto">
                        {sportName}
                      </th>
                      <th className="px-3 py-2 text-xs md:text-sm font-bold text-right w-[110px] sm:w-[140px] md:w-[160px]">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {markets.length === 0 ? (
                      <tr>
                        <td 
                          colSpan={2} 
                          className="px-4 py-8 text-center text-gray-400 text-xs font-medium"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <AlertCircle size={20} className="text-gray-300" />
                            <span>No active market positions</span>
                            <span className="text-[11px] text-gray-400">
                              Positions will appear when downline bettors place bets on live cricket markets.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      markets.map((market) => {
                        const isExpanded = expandedMarketKey === market.key;
                        const isNegative = market.amount < 0;
                        const isPositive = market.amount > 0;
                        const marketBets = matchedBets.filter(b => b.matchId === market.matchId);

                        return (
                          <Fragment key={market.key}>
                            {/* Main Market Row */}
                            <tr 
                              className={`border-b border-gray-300 transition-colors ${
                                isExpanded ? "bg-[#f0f9f6]" : "hover:bg-gray-50/80"
                              }`}
                            >
                              {/* Left Column: {Match Name} / {Market Name} in Teal Green */}
                              <td 
                                onClick={() => toggleExpandMarket(market.key)}
                                className="px-3 py-2.5 border-r border-gray-300 align-middle cursor-pointer group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[#20a88a] group-hover:underline font-medium text-xs sm:text-sm leading-snug break-words">
                                    {market.marketTitle}
                                  </span>
                                  <span className="text-gray-400 group-hover:text-[#20a88a] flex-shrink-0">
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </span>
                                </div>
                              </td>

                              {/* Right Column: Amount (Red if negative, Green if positive) */}
                              <td 
                                onClick={() => toggleExpandMarket(market.key)}
                                className="px-3 py-2.5 text-right font-bold text-xs sm:text-sm align-middle cursor-pointer select-none"
                              >
                                <span
                                  className={
                                    isNegative 
                                      ? "text-[#dc2626]" 
                                      : isPositive 
                                      ? "text-[#16a34a]" 
                                      : "text-gray-700"
                                  }
                                >
                                  {formatAmountDisplay(market.amount)}
                                </span>
                              </td>
                            </tr>

                            {/* ─── Expandable Drill-Down Panel ─── */}
                            {isExpanded && (
                              <tr className="bg-gray-50/70 border-b border-gray-300">
                                <td colSpan={2} className="p-3">
                                  <div className="flex flex-col gap-3">
                                    
                                    {/* 1. Runner Book Position Table */}
                                    <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs">
                                      <div className="bg-gray-100/90 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                          <Layers size={13} className="text-[#20a88a]" />
                                          <span>Runner Position Breakdown</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-500">
                                          Worst Case Liability:{" "}
                                          <strong className={isNegative ? "text-red-600" : "text-emerald-600"}>
                                            {formatAmountDisplay(market.amount)}
                                          </strong>
                                        </span>
                                      </div>

                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                          <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                            <tr>
                                              <th className="px-3 py-1.5">Runner</th>
                                              <th className="px-2 py-1.5 text-center w-[80px]">Back Odds</th>
                                              <th className="px-2 py-1.5 text-center w-[80px]">Lay Odds</th>
                                              <th className="px-3 py-1.5 text-right w-[110px]">Downline Stake</th>
                                              <th className="px-2 py-1.5 text-center w-[75px]">Share %</th>
                                              <th className="px-3 py-1.5 text-right w-[120px]">Net P/L Position</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {market.runners.map((runner, rIdx) => {
                                              const rAmount = runner.amount || 0;
                                              const rPos = rAmount > 0;
                                              const rNeg = rAmount < 0;

                                              return (
                                                <tr key={rIdx} className="hover:bg-blue-50/20">
                                                  <td className="px-3 py-2 font-bold text-gray-800">
                                                    {runner.name}
                                                  </td>
                                                  <td className="px-2 py-2 text-center text-blue-700 font-bold">
                                                    {runner.back || "--"}
                                                  </td>
                                                  <td className="px-2 py-2 text-center text-red-700 font-bold">
                                                    {runner.lay || "--"}
                                                  </td>
                                                  <td className="px-3 py-2 text-right font-medium text-gray-700">
                                                    ₹{(runner.totalStake || 0).toLocaleString("en-IN")}
                                                  </td>
                                                  <td className="px-2 py-2 text-center">
                                                    <span className="bg-gray-100 text-gray-700 font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                                      {runner.parentShare != null ? `${runner.parentShare}%` : "--"}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2 text-right font-bold">
                                                    <span 
                                                      className={
                                                        rNeg 
                                                          ? "text-[#dc2626]" 
                                                          : rPos 
                                                          ? "text-[#16a34a]" 
                                                          : "text-gray-600"
                                                      }
                                                    >
                                                      {formatAmountDisplay(rAmount)}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* 2. Matched Bets for this specific Market */}
                                    <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-2xs">
                                      <div className="bg-gray-100/90 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                          <ShieldCheck size={13} className="text-blue-600" />
                                          <span>Matched Bets ({marketBets.length})</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500">
                                          Downline orders on this match
                                        </span>
                                      </div>

                                      {marketBets.length === 0 ? (
                                        <div className="p-3 text-center text-gray-400 text-xs">
                                          No individual bet records found for this fixture.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto max-h-56">
                                          <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0">
                                              <tr>
                                                <th className="px-3 py-1.5">Runner</th>
                                                <th className="px-2 py-1.5 text-center w-[65px]">Type</th>
                                                <th className="px-2 py-1.5 text-center w-[65px]">Odds</th>
                                                <th className="px-3 py-1.5 text-right w-[95px]">Stake</th>
                                                <th className="px-2 py-1.5 text-center w-[70px]">Share %</th>
                                                <th className="px-3 py-1.5 text-right w-[95px]">My Stake</th>
                                                <th className="px-3 py-1.5">Bettor</th>
                                                <th className="px-3 py-1.5 text-right w-[90px]">Time</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {marketBets.map((bet, bIdx) => {
                                                const isBack = (bet.type || "").toLowerCase() === "back";
                                                return (
                                                  <tr 
                                                    key={bet.id || bIdx}
                                                    className={isBack ? "bg-blue-50/20" : "bg-red-50/20"}
                                                  >
                                                    <td className="px-3 py-1.5 font-bold text-gray-800">
                                                      {bet.runner}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                      <span 
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                          isBack 
                                                            ? "bg-blue-100 text-blue-700 border border-blue-200" 
                                                            : "bg-red-100 text-red-700 border border-red-200"
                                                        }`}
                                                      >
                                                        {bet.type}
                                                      </span>
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center font-bold text-gray-800">
                                                      {bet.price}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-medium text-gray-800">
                                                      ₹{Number(bet.size || 0).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center font-medium text-gray-600">
                                                      {bet.sharePercent != null ? `${bet.sharePercent}%` : "--"}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-blue-700">
                                                      ₹{Number(bet.shareAmount || 0).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-gray-700 font-medium">
                                                      {bet.better}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-gray-400 font-mono text-[10px]">
                                                      {bet.createdAt 
                                                        ? new Date(bet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                                        : "--"}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
