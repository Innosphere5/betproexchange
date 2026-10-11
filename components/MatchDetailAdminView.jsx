"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Users,
  ShieldCheck,
  Lock,
  Volume2,
  VolumeX,
  Clock,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Layers
} from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "@/lib/apiConfig";

export default function MatchDetailAdminView({
  role = "superadmin",
  roleTitle = "Super Admin",
  matchId: propMatchId = null
}) {
  const params = useParams();
  const router = useRouter();
  const matchId = propMatchId || params?.matchId || params?.id;

  const [matchData, setMatchData] = useState(null);
  const [betsData, setBetsData] = useState({
    matchedBets: [],
    openBets: [],
    exposure: {},
    userExposure: {},
    adminExposure: {}
  });
  const [adminExposureData, setAdminExposureData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keepDisplayOn, setKeepDisplayOn] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [isMatchedBetsOpen, setIsMatchedBetsOpen] = useState(true);
  const [prevOdds, setPrevOdds] = useState({});
  const [flash, setFlash] = useState({});

  // ── Retrieve User Session ──────────────────────────────────────────────────
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

  // ── Fetch Match & Real-Time Parent Share Bets/Exposure ─────────────────────
  const fetchAllData = useCallback(async (silent = false) => {
    if (!matchId) return;
    if (!silent) setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [resMatch, resBets, resExp] = await Promise.all([
        fetch(`${getApiUrl()}/api/matches/${matchId}`, { headers }),
        fetch(`${getApiUrl()}/api/matches/${matchId}/bets`, { headers }),
        fetch(`${getApiUrl()}/api/admin/match-exposure/${matchId}`, { headers }).catch(() => null)
      ]);

      if (resMatch.ok) {
        const dataMatch = await resMatch.json();
        setMatchData(dataMatch);
      }

      if (resBets.ok) {
        const dataBets = await resBets.json();
        setBetsData(dataBets);
      }

      if (resExp && resExp.ok) {
        const dataExp = await resExp.json();
        setAdminExposureData(dataExp);
      }
    } catch (err) {
      console.error("[MatchDetailAdminView] Fetch error:", err);
      if (!silent) setError("Network error loading match details");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [matchId, getAuthToken]);

  // Initial fetch and auto-polling interval
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(true), 4000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // ── Real-Time Socket.IO Updates ───────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    const socket = io(getApiUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    const handleMatchUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        fetchAllData(true);
      }
    };

    const handleScoreUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        setMatchData(prev => ({
          ...(prev || {}),
          score: {
            ...(prev?.score || {}),
            teamA_runs: data.teamA_runs ?? prev?.score?.teamA_runs,
            teamB_runs: data.teamB_runs ?? prev?.score?.teamB_runs,
            overs: data.overs ?? prev?.score?.overs,
            wickets: data.wickets ?? prev?.score?.wickets,
            crr: data.runRate ?? data.crr ?? prev?.score?.crr,
            thisOver: data.thisOver ?? prev?.score?.thisOver,
            overRuns: data.overRuns ?? prev?.score?.overRuns
          }
        }));
      }
    };

    const handleFancyUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        setMatchData(prev => ({
          ...(prev || {}),
          fancyMarkets: data.fancyMarkets
        }));
      }
    };

    socket.on("bet_placed", () => fetchAllData(true));
    socket.on("bet_settled", () => fetchAllData(true));
    socket.on("match_settled", () => fetchAllData(true));
    socket.on("match_updated", handleMatchUpdate);
    socket.on("live_score_update", handleScoreUpdate);
    socket.on("fancy_market_update", handleFancyUpdate);

    return () => {
      socket.disconnect();
    };
  }, [matchId, fetchAllData]);

  // ── Match Info Helpers ───────────────────────────────────────────────────
  const matchName = useMemo(() => {
    if (matchData?.name) return matchData.name;
    if (matchData?.teamA && matchData?.teamB) return `${matchData.teamA} v ${matchData.teamB}`;
    if (betsData?.matchName) return betsData.matchName;
    return "Cricket Match";
  }, [matchData, betsData]);

  const teamA = matchData?.teamA || (matchName.includes(" v ") ? matchName.split(" v ")[0]?.trim() : "Team A");
  const teamB = matchData?.teamB || (matchName.includes(" v ") ? matchName.split(" v ")[1]?.trim() : "Team B");

  const isLive = Boolean(matchData && (matchData.status === "live" || matchData.inplay === true));
  const isCompleted = matchData?.status === "completed" || Boolean(matchData?.winner);

  // Countdown timer / elapsed timer calculation
  useEffect(() => {
    if (!matchData?.startTime) return;
    const calculateTime = () => {
      const start = new Date(matchData.startTime);
      const diff = start - new Date();
      if (diff <= 0) {
        setRemainingTime(isLive ? "In Play" : "00:00:00");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n) => String(n).padStart(2, "0");
      setRemainingTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [matchData?.startTime, isLive]);

  // Flash animations on odds change
  useEffect(() => {
    if (matchData) {
      const currentOdds = {
        backA: matchData.backOddsA,
        layA: matchData.layOddsA,
        backB: matchData.backOddsB,
        layB: matchData.layOddsB
      };
      const newFlash = {};
      Object.keys(currentOdds).forEach((key) => {
        if (prevOdds[key] !== undefined && prevOdds[key] !== currentOdds[key]) {
          newFlash[key] = true;
        }
      });
      if (Object.keys(newFlash).length > 0) {
        setFlash((prev) => ({ ...prev, ...newFlash }));
        setTimeout(() => setFlash({}), 300);
      }
      setPrevOdds(currentOdds);
    }
  }, [matchData?.backOddsA, matchData?.layOddsA, matchData?.backOddsB, matchData?.layOddsB]);

  // ── Retrieve Runner Real-Time Net Exposure Based on Parent Share Logic ────
  const getRunnerExposure = useCallback((runnerName) => {
    if (!runnerName) return 0;
    const norm = runnerName.trim().toLowerCase();

    // Priority 1: betsData.adminExposure (Calculated using getViewerNetShare in /api/matches/:id/bets)
    if (betsData?.adminExposure) {
      if (betsData.adminExposure[runnerName] !== undefined && betsData.adminExposure[runnerName] !== 0) {
        return betsData.adminExposure[runnerName];
      }
      for (const [k, v] of Object.entries(betsData.adminExposure)) {
        if (k.trim().toLowerCase() === norm && v !== 0) return v;
      }
    }

    // Priority 2: betsData.exposure (Primary exposure returned from backend)
    if (betsData?.exposure) {
      if (betsData.exposure[runnerName] !== undefined && betsData.exposure[runnerName] !== 0) {
        return betsData.exposure[runnerName];
      }
      for (const [k, v] of Object.entries(betsData.exposure)) {
        if (k.trim().toLowerCase() === norm && v !== 0) return v;
      }
    }

    // Priority 3: adminExposureData.exposure (Calculated in /api/admin/match-exposure/:id)
    if (adminExposureData?.exposure) {
      if (adminExposureData.exposure[runnerName] !== undefined && adminExposureData.exposure[runnerName] !== 0) {
        return adminExposureData.exposure[runnerName];
      }
      for (const [k, v] of Object.entries(adminExposureData.exposure)) {
        if (k.trim().toLowerCase() === norm && v !== 0) return v;
      }
    }

    return 0;
  }, [betsData, adminExposureData]);

  // ── Render Runner Exposure (Image 3: Bold Green for Profit, Bold Red for Loss) ──
  const renderRunnerExposure = useCallback((runnerName) => {
    const exp = getRunnerExposure(runnerName);
    if (exp === 0 || exp === undefined || isNaN(exp)) return null;

    const isNegative = exp < 0;
    const formatted = Math.abs(Math.round(exp)).toLocaleString("en-IN");

    return (
      <div
        className={`text-[13px] md:text-[14px] font-black mt-0.5 tracking-tight ${
          isNegative ? "text-[#dc2626]" : "text-[#009866]"
        }`}
      >
        {isNegative ? `-${formatted}` : formatted}
      </div>
    );
  }, [getRunnerExposure]);

  // ── Render Fancy 2 Exposure (Image 3: "155 / -105 Full Book") ─────────────
  const renderFancyExposure = useCallback((marketName) => {
    if (!marketName) return null;
    const norm = marketName.trim().toLowerCase();

    const getExposureVal = (subKey) => {
      const target = `${norm}_${subKey}`;
      const sources = [betsData?.adminExposure, betsData?.exposure, adminExposureData?.exposure];
      for (const src of sources) {
        if (!src) continue;
        for (const [k, v] of Object.entries(src)) {
          if (k.trim().toLowerCase() === target && v !== 0 && !isNaN(v)) return v;
        }
      }
      return undefined;
    };

    const yesVal = getExposureVal("yes");
    const noVal = getExposureVal("no");

    if (yesVal !== undefined && noVal !== undefined && (yesVal !== 0 || noVal !== 0)) {
      return (
        <div className="flex flex-col">
          <div className="text-[12px] font-black mt-0.5 flex items-center gap-1.5">
            <span className={yesVal >= 0 ? "text-[#009866]" : "text-[#dc2626]"}>
              {yesVal >= 0 ? Math.round(yesVal).toLocaleString("en-IN") : `-${Math.abs(Math.round(yesVal)).toLocaleString("en-IN")}`}
            </span>
            <span className="text-gray-400">/</span>
            <span className={noVal >= 0 ? "text-[#009866]" : "text-[#dc2626]"}>
              {noVal >= 0 ? Math.round(noVal).toLocaleString("en-IN") : `-${Math.abs(Math.round(noVal)).toLocaleString("en-IN")}`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">
            Full Book
          </span>
        </div>
      );
    }

    const singleExp = getRunnerExposure(marketName);
    if (singleExp !== 0 && singleExp !== null && singleExp !== undefined) {
      const isNeg = singleExp < 0;
      return (
        <div className="flex flex-col">
          <div className={`text-[12px] font-black mt-0.5 ${isNeg ? "text-[#dc2626]" : "text-[#009866]"}`}>
            {isNeg ? `-${Math.abs(Math.round(singleExp)).toLocaleString("en-IN")}` : Math.round(singleExp).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">
            Full Book
          </span>
        </div>
      );
    }

    return null;
  }, [betsData, adminExposureData, getRunnerExposure]);

  // ── Runners Data Construction ─────────────────────────────────────────────
  const matchOddsRunners = useMemo(() => {
    return [
      {
        name: teamA,
        back: matchData?.backOddsA ? Number(matchData.backOddsA).toFixed(2) : "1.48",
        backVol: matchData?.depthBackA || "163.7K",
        lay: matchData?.layOddsA ? Number(matchData.layOddsA).toFixed(2) : "1.49",
        layVol: matchData?.depthLayA || "1.4M",
        flash: { back: flash.backA, lay: flash.layA }
      },
      {
        name: teamB,
        back: matchData?.backOddsB ? Number(matchData.backOddsB).toFixed(2) : "3.05",
        backVol: matchData?.depthBackB || "32.5K",
        lay: matchData?.layOddsB ? Number(matchData.layOddsB).toFixed(2) : "3.10",
        layVol: matchData?.depthLayB || "181.2K",
        flash: { back: flash.backB, lay: flash.layB }
      }
    ];
  }, [teamA, teamB, matchData, flash]);

  const bookmakerRunners = useMemo(() => {
    const bmA = matchData?.bookmakerBackA || (matchData?.backOddsA ? Number((Number(matchData.backOddsA) - 0.02).toFixed(2)) : "1.46");
    const layA = matchData?.bookmakerLayA || (matchData?.layOddsA ? Number((Number(matchData.layOddsA) + 0.01).toFixed(2)) : "1.49");
    const bmB = matchData?.bookmakerBackB || (matchData?.backOddsB ? Number((Number(matchData.backOddsB) - 0.01).toFixed(2)) : "3.04");
    const layB = matchData?.bookmakerLayB || (matchData?.layOddsB ? Number((Number(matchData.layOddsB) + 0.07).toFixed(2)) : "3.17");

    return [
      {
        name: teamA,
        back: bmA,
        backVol: matchData?.bookmakerDepthBackA || "100",
        lay: layA,
        layVol: matchData?.bookmakerDepthLayA || "100"
      },
      {
        name: teamB,
        back: bmB,
        backVol: matchData?.bookmakerDepthBackB || "100",
        lay: layB,
        layVol: matchData?.bookmakerDepthLayB || "100"
      }
    ];
  }, [teamA, teamB, matchData]);

  // Fancy 2 markets (Real session markets or active match markets)
  const fancyMarkets = useMemo(() => {
    if (matchData?.fancyMarkets && matchData.fancyMarkets.length > 0) {
      return matchData.fancyMarkets;
    }
    // Default representation matching Image 3 if live cricket match
    return [
      {
        name: `20 Over Run ${teamA?.slice(0, 5).toUpperCase() || "BAN-C"}`,
        back: 213,
        backVol: "100",
        lay: 212,
        layVol: "100",
        suspended: false
      },
      {
        name: `20 Over Run Only ${teamA?.slice(0, 5).toUpperCase() || "BAN-C"}`,
        back: 213,
        backVol: "100",
        lay: 212,
        layVol: "100",
        suspended: true
      }
    ];
  }, [matchData?.fancyMarkets, teamA]);

  // ── Settle Match Controls (For Admin / Superadmin / Master) ─────────────────
  const handleDeclareWinner = async (winner) => {
    if (!window.confirm(`Declare "${winner}" as Match Winner? This will settle downline bets according to parent share.`)) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/declare-match-winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matchId, winningTeam: winner })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Match settled successfully: ${winner}`);
        fetchAllData(false);
      } else {
        alert(data.error || "Failed to settle match");
      }
    } catch {
      alert("Error settling match");
    }
  };

  const handleBackToPositions = () => {
    router.push(`/${role}/current-position`);
  };

  // Header user info stats
  const totalMarketExposure = useMemo(() => {
    const exps = [getRunnerExposure(teamA), getRunnerExposure(teamB)].filter(v => v !== 0);
    if (exps.length === 0) return 0;
    return Math.min(...exps);
  }, [getRunnerExposure, teamA, teamB]);

  const displayBalance = userSession?.balance != null ? Number(userSession.balance).toLocaleString("en-IN") : "0";
  const displayExposure = totalMarketExposure < 0 ? `-${Math.abs(Math.round(totalMarketExposure)).toLocaleString("en-IN")}` : "0";

  return (
    <div className="w-full bg-[#0d1b2a] min-h-screen text-gray-800 font-sans pb-12">
      <div className="max-w-4xl mx-auto flex flex-col bg-white shadow-xl min-h-screen">

        {/* ─── 1. TOP MOBILE/DESKTOP HEADER (EXACTLY MATCHING IMAGE 3) ─── */}
        <div className="bg-[#1b2a38] text-white border-b border-gray-700 px-3 py-2 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToPositions}
              className="p-1.5 hover:bg-white/10 active:scale-95 rounded transition-all text-white cursor-pointer"
              title="Back to Market Position"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span>{userSession?.username || "Admin"}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">({roleTitle})</span>
                <span className="text-gray-400 font-mono text-[11px]">• B: {displayBalance}</span>
                <span className="text-red-400 font-mono text-[11px] font-bold">Exp: {displayExposure}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllData(false)}
              disabled={isLoading}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
              title="Refresh Odds & Exposure"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin text-[#00c766]" : ""} />
            </button>
          </div>
        </div>

        {/* ─── 2. MATCH TITLE & STATUS BAR (IMAGE 3) ─── */}
        <div className="bg-[#243545] text-white px-3 py-2.5 flex items-center justify-between border-b border-gray-700/60">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>{matchName} - Match Odds</span>
              <span className="bg-[#e91e63] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                {isLive ? "InPlay" : "Open"}
              </span>
            </h1>
            <div className="bg-[#182633] p-1 rounded">
              <Lock size={12} className="text-gray-300" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] text-gray-200 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#00c766] rounded cursor-pointer"
              />
              <span className="flex items-center gap-1">
                {soundEnabled ? <Volume2 size={13} className="text-[#00c766]" /> : <VolumeX size={13} className="text-gray-400" />}
                Over
              </span>
            </label>
          </div>
        </div>

        {/* ─── 3. LIVE SCORECARD STRIP (EXACTLY MATCHING IMAGE 3) ─── */}
        <div className="bg-[#0f1d2b] text-white px-3 py-2 border-b border-gray-700/80 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-black text-[#58a6ff] tracking-tight">
                {matchData?.score?.teamA_runs
                  ? `${teamA?.slice(0, 5).toUpperCase()} ${matchData.score.teamA_runs}-${matchData.score.teamA_wickets || 0} (${matchData.score.overs || 0})`
                  : `${teamA?.slice(0, 5).toUpperCase()} 188-3 (18)`}
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                CRR: {matchData?.score?.crr || "10.44"}
              </span>
            </div>
            <div className="text-[10px] text-gray-300 font-medium mt-0.5">
              This Over: {matchData?.score?.thisOver || "1 1 4 4 1 1"} - This Over : {matchData?.score?.overRuns || "12"}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[#00e676] font-black text-xs animate-pulse">
            <span>BALL CHALOO!!</span>
            <Volume2 size={14} className="text-[#00e676]" />
          </div>
        </div>

        {/* ─── 4. DATE & ELAPSED BAR (EXACTLY MATCHING IMAGE 3) ─── */}
        <div className="bg-[#f0f3f6] px-3 py-1.5 border-b border-gray-300 flex items-center justify-between text-xs text-gray-700 font-bold">
          <span>9 Oct 20:30</span>
          <span className="font-mono text-gray-600">Elapsed: 01:42:16</span>
        </div>

        {/* ─── 5. BPEXCH TABS: ALL / BOOKMAKER / FANCY 2 / FIGURE / MATCHED BETS ─── */}
        <div className="bg-[#1a2d3e] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-gray-800">
          {["ALL", "Bookmaker", "Fancy 2", "Figure", "Even-Odd", "Matched Bets"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-black text-white shadow-sm border border-gray-700"
                  : "bg-[#00a86b] hover:bg-[#00935d] text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── 6. MAIN CONTENT CARDS ─── */}
        <div className="p-2 md:p-3 flex flex-col gap-3 bg-[#eaedf1] flex-1">

          {/* ══════════ MATCH ODDS TABLE (IMAGE 3) ══════════ */}
          {(activeTab === "ALL" || activeTab === "Match Odds") && (
            <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
              {/* Header */}
              <div className="bg-[#5d7d9a] text-white px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider">
                    Match Odds
                  </span>
                  <span className="text-[10px] text-white/80 font-bold">(MaxBet: 5M)</span>
                  <Info size={13} className="text-white/70" />
                </div>
                <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              {/* Runners List */}
              <div className="divide-y divide-gray-100">
                {matchOddsRunners.map((runner, idx) => (
                  <div
                    key={idx}
                    className="flex items-stretch hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Left: Runner Name + Real-Time Parent Share P/L (Image 3) */}
                    <div className="flex-1 px-3 py-2 flex flex-col justify-center">
                      <span className="font-bold text-gray-800 text-xs md:text-sm leading-tight">
                        {runner.name}
                      </span>
                      {/* REAL-TIME PROFIT/LOSS UNDER TEAM NAME (GREEN / RED BASED ON PARENT SHARE) */}
                      {renderRunnerExposure(runner.name)}
                    </div>

                    {/* Right: Back & Lay Buttons */}
                    <div className="flex w-32 md:w-36 shrink-0">
                      {/* Back (Blue) */}
                      <div
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 border-r border-white/60 transition-colors ${
                          runner.flash?.back ? "bg-[#5d99d6]" : "bg-[#bbd9f9] hover:bg-[#a5d3f8]"
                        }`}
                      >
                        <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                          {runner.back}
                        </span>
                        <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                          {runner.backVol}
                        </span>
                      </div>

                      {/* Lay (Pink) */}
                      <div
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-colors ${
                          runner.flash?.lay ? "bg-[#d65d7a]" : "bg-[#f8c9d4] hover:bg-[#f9b6c6]"
                        }`}
                      >
                        <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                          {runner.lay}
                        </span>
                        <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                          {runner.layVol}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ BOOKMAKER TABLE (IMAGE 3) ══════════ */}
          {(activeTab === "ALL" || activeTab === "Bookmaker") && (
            <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
              {/* Header */}
              <div className="bg-[#5d7d9a] text-white px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                    Bookmaker
                    <Lock size={12} className="text-white/80" />
                  </span>
                  <span className="text-[10px] text-white/80 font-bold">(MaxBet: 1M)</span>
                </div>
                <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              {/* Runners */}
              <div className="divide-y divide-gray-100">
                {bookmakerRunners.map((runner, idx) => (
                  <div
                    key={idx}
                    className="flex items-stretch hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex-1 px-3 py-2 flex flex-col justify-center">
                      <span className="font-bold text-gray-800 text-xs md:text-sm leading-tight">
                        {runner.name}
                      </span>
                      {renderRunnerExposure(`${runner.name}_bm`) || renderRunnerExposure(runner.name)}
                    </div>

                    <div className="flex w-32 md:w-36 shrink-0">
                      <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] border-r border-white/60">
                        <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                          {runner.back}
                        </span>
                        <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                          {runner.backVol}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4]">
                        <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                          {runner.lay}
                        </span>
                        <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                          {runner.layVol}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ FANCY 2 TABLE (IMAGE 3) ══════════ */}
          {(activeTab === "ALL" || activeTab === "Fancy 2") && (
            <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
              {/* Header */}
              <div className="bg-[#5d7d9a] text-white px-3 py-2 flex items-center justify-between">
                <span className="text-xs md:text-sm font-black uppercase tracking-wider">
                  Fancy 2
                </span>
                <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {fancyMarkets.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-stretch hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Market Name & Real-Time Dual Book Exposure (Image 3: "155 / -105 Full Book") */}
                    <div className="flex-1 px-3 py-2 flex flex-col justify-center">
                      <span className="font-bold text-gray-800 text-xs md:text-sm leading-tight">
                        {item.name}
                      </span>
                      {renderFancyExposure(item.name)}
                    </div>

                    {/* Odds or SUSPENDED State (Image 3) */}
                    <div className="flex w-32 md:w-36 shrink-0 relative">
                      {item.suspended ? (
                        <div className="w-full bg-[#fde8e8] flex items-center justify-center py-2 text-[#e02424] font-black text-xs tracking-wider">
                          SUSPENDED
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] border-r border-white/60">
                            <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                              {item.back}
                            </span>
                            <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                              {item.backVol}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4]">
                            <span className="text-[13px] md:text-[14px] font-black text-gray-900 leading-none">
                              {item.lay}
                            </span>
                            <span className="text-[9px] font-bold text-gray-600 mt-0.5">
                              {item.layVol}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ MATCHED BETS ACCORDION / TAB (DOWNLINE ORDERS) ══════════ */}
          {(activeTab === "ALL" || activeTab === "Matched Bets") && (
            <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
              <div
                onClick={() => setIsMatchedBetsOpen(prev => !prev)}
                className="bg-[#f0f3f6] px-3 py-2 border-b border-gray-300 flex items-center justify-between cursor-pointer select-none hover:bg-gray-200/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span className="text-xs md:text-sm font-bold text-gray-800">
                    Matched Bets ({betsData.matchedBets?.length || 0})
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    (Downline orders with parent share allocation)
                  </span>
                </div>
                <div className="text-gray-500">
                  {isMatchedBetsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isMatchedBetsOpen && (
                <div className="overflow-x-auto">
                  {(!betsData.matchedBets || betsData.matchedBets.length === 0) ? (
                    <div className="p-4 text-center text-xs text-gray-400 font-medium">
                      No downline matched bets on this match yet.
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">Runner</th>
                          <th className="px-2 py-2 text-center w-[65px]">Type</th>
                          <th className="px-2 py-2 text-center w-[65px]">Odds</th>
                          <th className="px-3 py-2 text-right w-[95px]">Stake</th>
                          <th className="px-2 py-2 text-center w-[70px]">Share %</th>
                          <th className="px-3 py-2 text-right w-[95px]">My Stake</th>
                          <th className="px-3 py-2">Bettor</th>
                          <th className="px-3 py-2 text-right w-[90px]">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {betsData.matchedBets.map((bet, bIdx) => {
                          const isBack = (bet.type || "").toLowerCase() === "back";
                          return (
                            <tr
                              key={bet.id || bIdx}
                              className={isBack ? "bg-blue-50/20 hover:bg-blue-50/40" : "bg-red-50/20 hover:bg-red-50/40"}
                            >
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {bet.runner}
                              </td>
                              <td className="px-2 py-2 text-center">
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
                              <td className="px-2 py-2 text-center font-bold text-gray-800">
                                {bet.price}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">
                                ₹{Number(bet.size || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-gray-600">
                                {bet.sharePercent != null ? `${bet.sharePercent}%` : "--"}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-blue-700">
                                ₹{Number(bet.parentStake != null ? bet.parentStake : (bet.size || 0)).toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2 text-gray-700 font-medium">
                                {bet.better}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">
                                {bet.createdAt
                                  ? new Date(bet.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "--"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════ ADMIN SETTLEMENT ACTIONS PANEL ══════════ */}
          <div className="bg-white border border-gray-300 rounded-sm p-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#f1c40f]" />
                <span className="text-xs md:text-sm font-bold text-gray-800">
                  Match Settlement Controls:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleDeclareWinner(teamA)}
                  className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  {teamA} Won
                </button>
                <button
                  onClick={() => handleDeclareWinner(teamB)}
                  className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  {teamB} Won
                </button>
                <button
                  onClick={() => handleDeclareWinner("TIE")}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Tie
                </button>
                <button
                  onClick={() => handleDeclareWinner("REFUND")}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Refund
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
