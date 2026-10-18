"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
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
  const router = useRouter();
  const [runnerPositions, setRunnerPositions] = useState([]);
  const [matchedBets, setMatchedBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
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
        } catch { }
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

  const handleOpenMarket = (market) => {
    const targetId = market.matchId || market.key;
    const mType = market.marketType || "match_odds";
    router.push(`/${role}/current-position/${encodeURIComponent(targetId)}?market=${encodeURIComponent(mType)}`);
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
                        const isNegative = market.amount < 0;
                        const isPositive = market.amount > 0;

                        return (
                          <tr
                            key={market.key}
                            onClick={() => handleOpenMarket(market)}
                            className="border-b border-gray-300 transition-colors hover:bg-gray-50/90 cursor-pointer group"
                          >
                            {/* Left Column: {Match Name} / {Market Name} in Teal Green */}
                            <td className="px-3 py-2.5 border-r border-gray-300 align-middle">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[#20a88a] group-hover:underline font-medium text-xs sm:text-sm leading-snug break-words">
                                    {market.marketTitle}
                                  </span>
                                  {market.isResulted && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-1">
                                        <Trophy size={9} className="text-yellow-300" /> Winner: {market.winner || "Declared"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/${role}/reports?tab=Daily Report`);
                                        }}
                                        className="text-[10px] font-bold text-[#20a88a] hover:underline cursor-pointer"
                                      >
                                        Daily Report →
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/${role}/reports?tab=Final Sheet`);
                                        }}
                                        className="text-[10px] font-bold text-gray-600 hover:underline cursor-pointer"
                                      >
                                        Final Sheet →
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <span className="text-gray-400 group-hover:text-[#20a88a] flex-shrink-0 transition-colors">
                                  <ChevronDown size={14} />
                                </span>
                              </div>
                            </td>

                            {/* Right Column: Amount (Red if negative, Green if positive) */}
                            <td className="px-3 py-2.5 text-right font-bold text-xs sm:text-sm align-middle select-none">
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
