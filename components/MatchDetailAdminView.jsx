"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  ArrowLeft,
  RefreshCw,
  Trophy,
  ShieldCheck,
  Lock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  X,
  BookUser,
  Layout,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "@/lib/apiConfig";

export default function MatchDetailAdminView({
  role = "admin",
  roleTitle = "Admin",
  matchId: propMatchId = null
}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = propMatchId || params?.matchId || params?.id;
  const initialMarket = searchParams.get("market") || "match_odds";

  const [matchData, setMatchData] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState("tv");
  const [betsData, setBetsData] = useState({
    matchedBets: [],
    openBets: [],
    exposure: {},
    userExposure: {},
    adminExposure: {}
  });
  const [adminExposureData, setAdminExposureData] = useState(null);
  const [currentPositionList, setCurrentPositionList] = useState([]);
  const [currentPositionBets, setCurrentPositionBets] = useState([]);
  const [selectedMarketType, setSelectedMarketType] = useState(initialMarket);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMatchedBetsOpen, setIsMatchedBetsOpen] = useState(true);
  const [isOpenBetsOpen, setIsOpenBetsOpen] = useState(true);
  const [isFullBetListOpen, setIsFullBetListOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [isBetLockOpen, setIsBetLockOpen] = useState(false);
  const [isUserBookOpen, setIsUserBookOpen] = useState(false);
  const [selectedRunnerIdx, setSelectedRunnerIdx] = useState(null);

  // ── Retrieve User Session ──────────────────────────────────────────────────
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
      const [resMatch, resBets, resExp, resCP, resCPBets] = await Promise.all([
        fetch(`${getApiUrl()}/api/matches/${matchId}`, { headers }).catch(() => null),
        fetch(`${getApiUrl()}/api/matches/${matchId}/bets`, { headers }).catch(() => null),
        fetch(`${getApiUrl()}/api/admin/match-exposure/${matchId}`, { headers }).catch(() => null),
        fetch(`${getApiUrl()}/api/admin/current-position`, { headers }).catch(() => null),
        fetch(`${getApiUrl()}/api/admin/current-position-bets`, { headers }).catch(() => null)
      ]);

      if (resMatch && resMatch.ok) {
        const dataMatch = await resMatch.json();
        setMatchData(dataMatch);
      }

      if (resBets && resBets.ok) {
        const dataBets = await resBets.json();
        setBetsData(dataBets);
      }

      if (resExp && resExp.ok) {
        const dataExp = await resExp.json();
        setAdminExposureData(dataExp);
      }

      if (resCP && resCP.ok) {
        const dataCP = await resCP.json();
        setCurrentPositionList(Array.isArray(dataCP) ? dataCP : []);
      }

      if (resCPBets && resCPBets.ok) {
        const dataCPBets = await resCPBets.json();
        setCurrentPositionBets(Array.isArray(dataCPBets) ? dataCPBets : []);
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

  // ── Real-Time Socket.IO Updates (Odds, Scores, Bets & Hierarchy Settlement) ──
  useEffect(() => {
    if (!matchId) return;
    const socket = io(getApiUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    // 1. Live Market Odds Updates (from oddspapi / oddsEngine / oddsApiLiveService)
    const handleMarketOddsUpdate = (data) => {
      const incomingId = String(data.matchId ?? data.matchIdNum ?? "");
      if (String(matchId) === incomingId) {
        if (data.marketStatus && !data.runners) {
          setMatchData((prev) => ({
            ...(prev || {}),
            marketStatus: data.marketStatus,
            bookmakerMarketStatus: data.bookmakerMarketStatus || data.marketStatus
          }));
          return;
        }
        const runnerA = data.runners?.[0];
        const runnerB = data.runners?.[1];
        const bmRunnerA = data.bookmakerRunners?.[0];
        const bmRunnerB = data.bookmakerRunners?.[1];

        setMatchData((prev) => ({
          ...(prev || {}),
          marketStatus: data.marketStatus || prev?.marketStatus || "OPEN",
          backOddsA: runnerA?.back ?? prev?.backOddsA,
          layOddsA: runnerA?.lay ?? prev?.layOddsA,
          backOddsB: runnerB?.back ?? prev?.backOddsB,
          layOddsB: runnerB?.lay ?? prev?.layOddsB,
          depthBackA: runnerA?.depthBack ?? prev?.depthBackA,
          depthLayA: runnerA?.depthLay ?? prev?.depthLayA,
          depthBackB: runnerB?.depthBack ?? prev?.depthBackB,
          depthLayB: runnerB?.depthLay ?? prev?.depthLayB,
          bookmakerBackA: bmRunnerA?.back ?? prev?.bookmakerBackA,
          bookmakerLayA: bmRunnerA?.lay ?? prev?.bookmakerLayA,
          bookmakerBackB: bmRunnerB?.back ?? prev?.bookmakerBackB,
          bookmakerLayB: bmRunnerB?.lay ?? prev?.bookmakerLayB,
          bookmakerDepthBackA: bmRunnerA?.depthBack ?? prev?.bookmakerDepthBackA,
          bookmakerDepthLayA: bmRunnerA?.depthLay ?? prev?.bookmakerDepthLayA,
          bookmakerDepthBackB: bmRunnerB?.depthBack ?? prev?.bookmakerDepthBackB,
          bookmakerDepthLayB: bmRunnerB?.depthLay ?? prev?.bookmakerDepthLayB,
          bookmakerMarketStatus: data.bookmakerMarketStatus || prev?.bookmakerMarketStatus || "OPEN"
        }));
      }
    };

    // 2. Direct Odds Updated Event
    const handleOddsUpdated = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          marketStatus: data.marketStatus || prev?.marketStatus || "OPEN",
          backOddsA: data.teamABack ?? prev?.backOddsA,
          layOddsA: data.teamALay ?? prev?.layOddsA,
          backOddsB: data.teamBBack ?? prev?.backOddsB,
          layOddsB: data.teamBLay ?? prev?.layOddsB,
          depthBackA: data.depthBackA ?? prev?.depthBackA,
          depthLayA: data.depthLayA ?? prev?.depthLayA,
          depthBackB: data.depthBackB ?? prev?.depthBackB,
          depthLayB: data.depthLayB ?? prev?.depthLayB,
          bookmakerBackA: data.bookmakerBackA ?? prev?.bookmakerBackA,
          bookmakerLayA: data.bookmakerLayA ?? prev?.bookmakerLayA,
          bookmakerBackB: data.bookmakerBackB ?? prev?.bookmakerBackB,
          bookmakerLayB: data.bookmakerLayB ?? prev?.bookmakerLayB,
          bookmakerMarketStatus: data.bookmakerMarketStatus || prev?.bookmakerMarketStatus || "OPEN"
        }));
      }
    };

    // 3. Bookmaker Odds Update
    const handleBookmakerUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          bookmakerBackA: data.bookmakerBackA ?? prev?.bookmakerBackA,
          bookmakerLayA: data.bookmakerLayA ?? prev?.bookmakerLayA,
          bookmakerBackB: data.bookmakerBackB ?? prev?.bookmakerBackB,
          bookmakerLayB: data.bookmakerLayB ?? prev?.bookmakerLayB,
          bookmakerDepthBackA: data.bookmakerDepthBackA ?? prev?.bookmakerDepthBackA,
          bookmakerDepthLayA: data.bookmakerDepthLayA ?? prev?.bookmakerDepthLayA,
          bookmakerDepthBackB: data.bookmakerDepthBackB ?? prev?.bookmakerDepthBackB,
          bookmakerDepthLayB: data.bookmakerDepthLayB ?? prev?.bookmakerDepthLayB,
          bookmakerMarketStatus: data.bookmakerMarketStatus ?? prev?.bookmakerMarketStatus ?? "OPEN"
        }));
      }
    };

    // 4. Toss Odds Update
    const handleTossUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          tossBackA: data.tossBackA ?? prev?.tossBackA,
          tossLayA: data.tossLayA ?? prev?.tossLayA,
          tossBackB: data.tossBackB ?? prev?.tossBackB,
          tossLayB: data.tossLayB ?? prev?.tossLayB,
          tossMarketStatus: data.tossMarketStatus ?? prev?.tossMarketStatus,
          tossWinner: data.tossWinner ?? prev?.tossWinner
        }));
      }
    };

    // 5. Match Record Update
    const handleMatchUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        fetchAllData(true);
      }
    };

    // 6. Live Cricket Score Update (Full oddspapi score metrics)
    const handleScoreUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        setMatchData((prev) => ({
          ...(prev || {}),
          score: {
            ...(prev?.score || {}),
            teamA_runs: data.teamA_runs ?? prev?.score?.teamA_runs,
            teamB_runs: data.teamB_runs ?? prev?.score?.teamB_runs,
            overs: data.overs ?? prev?.score?.overs,
            wickets: data.wickets ?? prev?.score?.wickets,
            target: data.target ?? prev?.score?.target,
            runRate: data.runRate ?? data.crr ?? prev?.score?.runRate ?? prev?.score?.crr,
            reqRunRate: data.reqRunRate ?? prev?.score?.reqRunRate,
            thisOver: data.thisOver ?? prev?.score?.thisOver,
            remRuns: data.remRuns ?? prev?.score?.remRuns,
            remBalls: data.remBalls ?? prev?.score?.remBalls,
            overRuns: data.overRuns ?? prev?.score?.overRuns
          }
        }));
      }
    };

    socket.on("market_odds_update", handleMarketOddsUpdate);
    socket.on("odds_updated", handleOddsUpdated);
    socket.on("bookmaker_odds_update", handleBookmakerUpdate);
    socket.on("toss_odds_update", handleTossUpdate);
    socket.on("live_score_update", handleScoreUpdate);
    socket.on("match_updated", handleMatchUpdate);
    socket.on("bet_placed", () => fetchAllData(true));
    socket.on("bet_settled", () => fetchAllData(true));
    socket.on("match_settled", () => fetchAllData(true));
    socket.on("wallet_updated", () => fetchAllData(true));

    return () => {
      socket.off("market_odds_update", handleMarketOddsUpdate);
      socket.off("odds_updated", handleOddsUpdated);
      socket.off("bookmaker_odds_update", handleBookmakerUpdate);
      socket.off("toss_odds_update", handleTossUpdate);
      socket.off("live_score_update", handleScoreUpdate);
      socket.off("match_updated", handleMatchUpdate);
      socket.disconnect();
    };
  }, [matchId, fetchAllData]);

  // ── Match Info Helpers ───────────────────────────────────────────────────
  const matchName = useMemo(() => {
    if (matchData?.name) return matchData.name;
    if (matchData?.teamA && matchData?.teamB) return `${matchData.teamA} v ${matchData.teamB}`;
    if (betsData?.matchName) return betsData.matchName;
    const cpMatch = currentPositionList.find(
      (p) => String(p.matchId) === String(matchId) || p.matchName
    );
    if (cpMatch?.matchName) return cpMatch.matchName;
    return "Cricket Match";
  }, [matchData, betsData, currentPositionList, matchId]);

  const teamA = useMemo(() => {
    if (matchData?.teamA) return matchData.teamA;
    if (matchName.includes(" v ")) return matchName.split(" v ")[0]?.trim();
    if (matchName.includes(" vs ")) return matchName.split(" vs ")[0]?.trim();
    return "Team A";
  }, [matchData?.teamA, matchName]);

  const teamB = useMemo(() => {
    if (matchData?.teamB) return matchData.teamB;
    if (matchName.includes(" v ")) return matchName.split(" v ")[1]?.trim();
    if (matchName.includes(" vs ")) return matchName.split(" vs ")[1]?.trim();
    return "Team B";
  }, [matchData?.teamB, matchName]);

  // Status computation: Pending (Live/Open) vs Result Declared (Completed/Settled)
  const isCompleted = Boolean(
    (matchData?.isCompleted === true ||
      matchData?.status === "completed" ||
      matchData?.status === "resulted") &&
    matchData?.status !== "live"
  );
  const winner = isCompleted ? (matchData?.winner || null) : null;
  const isLive = Boolean(matchData && (matchData.status === "live" || matchData.inplay === true));
  const isSuspended = Boolean(matchData?.isSuspended === true || matchData?.status === "suspended");

  // Check which runner won if resulted (strictly after match result)
  const isWinnerA = Boolean(
    isCompleted &&
    winner &&
    (winner.toLowerCase() === teamA.toLowerCase() ||
      teamA.toLowerCase().includes(winner.toLowerCase()) ||
      winner.toLowerCase().includes(teamA.toLowerCase()))
  );
  const isWinnerB = Boolean(
    isCompleted &&
    winner &&
    (winner.toLowerCase() === teamB.toLowerCase() ||
      teamB.toLowerCase().includes(winner.toLowerCase()) ||
      winner.toLowerCase().includes(teamB.toLowerCase()))
  );

  // Volume format helper
  const formatVol = (val, fallback = "") => {
    if (!val) return fallback;
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return String(num);
  };

  // ── Cricket Score Computation ─────────────────────────────────────────────
  const scoreData = useMemo(() => {
    const sc = matchData?.score || {};

    const parseTeam = (rawRuns, fallbackWickets = 0) => {
      if (!rawRuns || rawRuns === "0/0" || rawRuns === "0-0" || rawRuns === "0") {
        return { runs: 0, wickets: 0, text: "0-0" };
      }
      const str = String(rawRuns).trim();
      if (str.includes("/")) {
        const [r, w] = str.split("/");
        return { runs: Number(r) || 0, wickets: Number(w) || 0, text: `${r || 0}-${w || 0}` };
      }
      if (str.includes("-")) {
        const [r, w] = str.split("-");
        return { runs: Number(r) || 0, wickets: Number(w) || 0, text: `${r || 0}-${w || 0}` };
      }
      return { runs: Number(str) || 0, wickets: Number(fallbackWickets) || 0, text: `${str}-${fallbackWickets}` };
    };

    const parsedA = parseTeam(sc.teamA_runs, sc.teamA_wickets || 0);
    const parsedB = parseTeam(sc.teamB_runs, sc.teamB_wickets || sc.wickets || 0);

    // Target calculation: from DB or derived from 1st innings score
    let target = Number(sc.target) || 0;
    if (!target && parsedB.runs > 0) {
      target = parsedB.runs + 1;
    } else if (!target && parsedA.runs > 0 && parsedB.runs === 0 && sc.overs && sc.overs !== "0.0") {
      target = parsedA.runs + 1;
    }

    // Determine who is chasing / currently batting
    const isChasingA = Boolean(target > 0 && parsedB.runs > 0 && parsedA.runs <= target);

    const activeTeamName = isChasingA ? teamA : (parsedB.runs > parsedA.runs ? teamB : teamA);
    const activeShortCode = isChasingA
      ? teamA.slice(0, 3).toUpperCase()
      : (parsedB.runs > parsedA.runs ? teamB.slice(0, 3).toUpperCase() : teamA.slice(0, 3).toUpperCase());
    const activeScoreText = isChasingA
      ? parsedA.text
      : (parsedB.runs > parsedA.runs ? parsedB.text : parsedA.text);

    // Overs formatting
    const rawOvers = String(sc.overs || "0");
    const displayOvers = rawOvers === "0.0" ? "0" : rawOvers;

    // CRR
    const crr = sc.runRate || sc.crr || "0";

    // Balls & RRR
    let remRuns = sc.remRuns;
    let remBalls = sc.remBalls;
    let rrr = sc.reqRunRate || "0.00";

    if (target > 0) {
      if (remRuns === undefined || remRuns === null || remRuns === 0) {
        remRuns = Math.max(0, target - (isChasingA ? parsedA.runs : parsedB.runs));
      }
      if (remBalls === undefined || remBalls === null || remBalls === 0) {
        const parts = displayOvers.split(".");
        const bowled = (parseInt(parts[0], 10) || 0) * 6 + (parseInt(parts[1], 10) || 0);
        remBalls = Math.max(0, 120 - bowled);
      }
      if (remBalls > 0 && (rrr === "0.00" || !rrr)) {
        rrr = (remRuns / (remBalls / 6)).toFixed(2);
      }
    }

    // This Over balls
    let thisOverList = [];
    if (Array.isArray(sc.thisOver) && sc.thisOver.length > 0) {
      thisOverList = sc.thisOver;
    } else if (typeof sc.thisOver === "string" && sc.thisOver.trim()) {
      if (sc.thisOver.includes(" ")) {
        thisOverList = sc.thisOver.trim().split(/\s+/);
      } else if (sc.thisOver.includes(",")) {
        thisOverList = sc.thisOver.split(",").map((s) => s.trim());
      } else {
        thisOverList = sc.thisOver.split("");
      }
    } else {
      thisOverList = ["1", "1", "1", "6"];
    }

    return {
      parsedA,
      parsedB,
      isChasingA,
      activeTeamName,
      activeShortCode,
      activeScoreText,
      displayOvers,
      crr,
      rrr,
      target,
      remRuns,
      remBalls,
      thisOverList
    };
  }, [matchData?.score, teamA, teamB]);

  // Live Back & Lay odds calculation for Team A and Team B
  const runnerOddsA = useMemo(() => {
    if (selectedMarketType === "bookmaker") {
      return {
        back: matchData?.bookmakerBackA || matchData?.backOddsA ? Number(matchData.bookmakerBackA || matchData.backOddsA).toFixed(2) : "2.34",
        lay: matchData?.bookmakerLayA || matchData?.layOddsA ? Number(matchData.bookmakerLayA || matchData.layOddsA).toFixed(2) : "2.36",
        backVol: formatVol(matchData?.bookmakerDepthBackA || matchData?.depthBackA, "100"),
        layVol: formatVol(matchData?.bookmakerDepthLayA || matchData?.depthLayA, "100")
      };
    }
    return {
      back: matchData?.backOddsA ? Number(matchData.backOddsA).toFixed(2) : "2.34",
      lay: matchData?.layOddsA ? Number(matchData.layOddsA).toFixed(2) : "2.36",
      backVol: formatVol(matchData?.depthBackA, "14.5K"),
      layVol: formatVol(matchData?.depthLayA, "236")
    };
  }, [matchData, selectedMarketType]);

  const runnerOddsB = useMemo(() => {
    if (selectedMarketType === "bookmaker") {
      return {
        back: matchData?.bookmakerBackB || matchData?.backOddsB ? Number(matchData.bookmakerBackB || matchData.backOddsB).toFixed(2) : "1.73",
        lay: matchData?.bookmakerLayB || matchData?.layOddsB ? Number(matchData.bookmakerLayB || matchData.layOddsB).toFixed(2) : "1.74",
        backVol: formatVol(matchData?.bookmakerDepthBackB || matchData?.depthBackB, "100"),
        layVol: formatVol(matchData?.bookmakerDepthLayB || matchData?.depthLayB, "100")
      };
    }
    return {
      back: matchData?.backOddsB ? Number(matchData.backOddsB).toFixed(2) : "1.73",
      lay: matchData?.layOddsB ? Number(matchData.layOddsB).toFixed(2) : "1.74",
      backVol: formatVol(matchData?.depthBackB, "1.1K"),
      layVol: formatVol(matchData?.depthLayB, "15.7K")
    };
  }, [matchData, selectedMarketType]);

  // Markets available for this match from current position
  const availableMarketsForMatch = useMemo(() => {
    const list = currentPositionList.filter(
      (p) =>
        String(p.matchId) === String(matchId) ||
        (p.matchName && matchName && p.matchName.toLowerCase() === matchName.toLowerCase())
    );
    const mTypes = [...new Set(list.map((p) => p.marketType || "match_odds"))];
    if (mTypes.length === 0) return ["match_odds", "bookmaker", "toss"];
    return mTypes;
  }, [currentPositionList, matchId, matchName]);

  // ── Retrieve Runner Real-Time Net Exposure Based on Parent Share Logic ────
  const getRunnerExposure = useCallback(
    (runnerName) => {
      if (!runnerName) return 0;
      const norm = runnerName.trim().toLowerCase();
      const isBm = selectedMarketType === "bookmaker";
      const isToss = selectedMarketType === "toss";

      // 1. Direct from Current Position (Authoritative Share Distribution)
      const cpItems = currentPositionList.filter(
        (p) =>
          (String(p.matchId) === String(matchId) ||
            (p.matchName && matchName && p.matchName.toLowerCase() === matchName.toLowerCase())) &&
          (p.marketType || "match_odds") === selectedMarketType
      );

      for (const item of cpItems) {
        if (item.name && item.name.trim().toLowerCase() === norm) {
          return item.amount != null ? item.amount : 0;
        }
        if (
          isToss &&
          item.name &&
          (item.name.toLowerCase().includes(norm) || norm.includes(item.name.toLowerCase()))
        ) {
          return item.amount != null ? item.amount : 0;
        }
      }

      // 2. From match exposure endpoint
      const targetKey = isBm ? `${runnerName}_bm` : isToss ? `${runnerName} To Win The Toss` : runnerName;

      if (betsData?.adminExposure) {
        if (betsData.adminExposure[targetKey] !== undefined) return betsData.adminExposure[targetKey];
        if (betsData.adminExposure[runnerName] !== undefined) return betsData.adminExposure[runnerName];
      }

      if (betsData?.exposure) {
        if (betsData.exposure[targetKey] !== undefined) return betsData.exposure[targetKey];
        if (betsData.exposure[runnerName] !== undefined) return betsData.exposure[runnerName];
      }

      if (adminExposureData?.exposure) {
        if (adminExposureData.exposure[targetKey] !== undefined) return adminExposureData.exposure[targetKey];
        if (adminExposureData.exposure[runnerName] !== undefined) return adminExposureData.exposure[runnerName];
      }

      return 0;
    },
    [currentPositionList, matchId, matchName, selectedMarketType, betsData, adminExposureData]
  );

  // ── Render Runner Exposure (Bold Green for Profit, Bold Red for Loss) ──────
  const renderRunnerExposure = useCallback(
    (runnerName) => {
      const exp = getRunnerExposure(runnerName);
      if (exp === null || exp === undefined || isNaN(exp)) return null;

      const isNegative = exp < 0;
      const isPositive = exp > 0;
      const formatted = Math.abs(Math.round(exp)).toLocaleString("en-IN");

      return (
        <div
          className={`text-[13px] md:text-[14px] font-black mt-0.5 tracking-tight ${isNegative ? "text-[#dc2626]" : isPositive ? "text-[#009866]" : "text-gray-500"
            }`}
        >
          {isNegative ? `-${formatted}` : isPositive ? `+${formatted}` : "0"}
        </div>
      );
    },
    [getRunnerExposure]
  );

  // Settle Match Controls (For Admin / Superadmin / Master)
  const handleDeclareWinner = async (winningTeam) => {
    if (
      !window.confirm(
        `Declare "${winningTeam}" as Match Winner? This will settle downline bets according to parent share.`
      )
    )
      return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/declare-match-winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matchId, winningTeam })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Match settled successfully: ${winningTeam}`);
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
    const expA = getRunnerExposure(teamA);
    const expB = getRunnerExposure(teamB);
    const worstMo = Math.min(expA, expB);
    return worstMo < 0 ? worstMo : 0;
  }, [getRunnerExposure, teamA, teamB]);

  // Combined real matched bets
  const allMatchedBets = useMemo(() => {
    const fromBets = (betsData?.matchedBets || []).map((b) => ({
      ...b,
      id: b.id || b._id
    }));
    const fromExp = (adminExposureData?.matchedBets || []).map((b) => ({
      ...b,
      id: b.id || b._id
    }));
    const fromCP = currentPositionBets
      .filter((b) => String(b.matchId) === String(matchId))
      .map((b) => ({
        ...b,
        id: b.id || b._id,
        parentStake: b.shareAmount || b.parentStake
      }));

    const map = new Map();
    [...fromBets, ...fromExp, ...fromCP].forEach((b) => {
      const k = String(b.id || `${b.runner}_${b.size}_${b.createdAt}`);
      if (!map.has(k)) map.set(k, b);
    });

    return Array.from(map.values());
  }, [betsData?.matchedBets, adminExposureData?.matchedBets, currentPositionBets, matchId]);

  const allOpenBets = useMemo(() => {
    const fromBets = betsData?.openBets || [];
    const fromExp = adminExposureData?.openBets || [];
    const map = new Map();
    [...fromBets, ...fromExp].forEach((b) => {
      const k = String(b.id || `${b.runner}_${b.size}`);
      if (!map.has(k)) map.set(k, b);
    });
    return Array.from(map.values());
  }, [betsData?.openBets, adminExposureData?.openBets]);

  const formatBetRunner = (bet) => {
    if (!bet?.runner) return "--";
    const isBookmaker = (bet.marketType || "").toLowerCase() === "bookmaker";
    const cleanRunner = bet.runner.replace(/\s+BM$/i, "").trim();
    if (isBookmaker) {
      return `${cleanRunner} BM`;
    }
    return bet.runner;
  };

  const displayUsername = userSession?.username || "adnan";
  const displayRoleTitle = roleTitle || "SuperAdmin";
  const displayBalance =
    userSession?.balance != null ? Number(userSession.balance).toLocaleString("en-IN") : "0";
  const displayExposure =
    totalMarketExposure < 0
      ? `-${Math.abs(Math.round(totalMarketExposure)).toLocaleString("en-IN")}`
      : "0";

  // Format date and time
  const matchDateFormatted = useMemo(() => {
    if (matchData?.startTime) {
      try {
        const d = new Date(matchData.startTime);
        return d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch { }
    }
    return "14 Oct, 19:00";
  }, [matchData?.startTime]);

  return (
    <div className="w-full bg-[#f4f6f8] min-h-screen text-gray-800 font-sans antialiased pb-12 select-none">
      <div className="max-w-md sm:max-w-xl mx-auto flex flex-col bg-white shadow-md min-h-screen">
        {/* ─── 1. TOP MOBILE HEADER (MATCHING USER SCREENSHOT) ─── */}
        <div className="bg-white text-gray-800 border-b border-gray-200 px-3 py-2 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToPositions}
              className="p-1 hover:bg-gray-100 active:scale-95 rounded text-gray-700 cursor-pointer transition-colors"
              title="Back to Positions"
            >
              <Menu size={22} className="stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-800">
              <span className="font-semibold text-gray-800 flex items-center gap-0.5 cursor-pointer">
                <span>{displayUsername}</span>
                <span className="text-gray-500 font-normal">({displayRoleTitle})</span>
                <ChevronDown size={14} className="text-gray-500 ml-0.5" />
              </span>

              <span className="text-gray-500 font-mono text-[11px] sm:text-xs">
                • B: <span className="font-bold text-gray-700">{displayBalance}</span>
              </span>

              <span className="font-mono text-[11px] sm:text-xs text-gray-700">
                Exp: <span className="font-bold text-red-600">{displayExposure}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchAllData(false)}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
              title="Refresh Odds & Bets"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-[#00a884]" : ""} />
            </button>
          </div>
        </div>

        {/* ─── MARKET SELECTOR PILLS (Match Odds / Bookmaker / Toss) ─── */}
        {availableMarketsForMatch.length > 1 && (
          <div className="bg-[#1b2a38] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-gray-800">
            {availableMarketsForMatch.map((mType) => {
              const label =
                mType === "match_odds"
                  ? "Match Odds"
                  : mType === "bookmaker"
                    ? "Bookmaker"
                    : mType === "toss"
                      ? "Toss"
                      : mType.replace(/_/g, " ");
              const isSelected = selectedMarketType === mType;
              return (
                <button
                  key={mType}
                  onClick={() => setSelectedMarketType(mType)}
                  className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${isSelected
                    ? "bg-[#00a884] text-white shadow-xs"
                    : "bg-[#253849] hover:bg-[#2f465a] text-gray-300"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── 2. MAIN CONTENT AREA ─── */}
        <div className="p-2 sm:p-3 flex flex-col gap-2.5 bg-white flex-1">
          {/* ══════════ MARKET ODDS TABLE (CYAN/BLUE BORDER) ══════════ */}
          <div className="border border-[#38bdf8] rounded-xs overflow-hidden bg-white shadow-2xs">
            {/* Market Header Banner */}
            <div className="bg-white px-2.5 py-1.5 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-[13px] font-black text-gray-900 tracking-tight">
                  {matchName} -{" "}
                  {selectedMarketType === "bookmaker"
                    ? "Bookmaker"
                    : selectedMarketType === "toss"
                      ? "Toss"
                      : "Match Odds"}
                </span>
                {/* Dynamic Status Badge: Completed vs Suspended vs InPlay vs Open */}
                {isCompleted ? (
                  <span className="bg-purple-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    COMPLETED
                  </span>
                ) : isSuspended ? (
                  <span className="text-[#e91e63] text-xs font-black uppercase tracking-wider">
                    SUSPENDED
                  </span>
                ) : isLive ? (
                  <span className="bg-[#00c766] text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    INPLAY
                  </span>
                ) : (
                  <span className="text-blue-600 text-xs font-black uppercase tracking-wider">
                    OPEN
                  </span>
                )}
              </div>
              <div className="text-gray-800 shrink-0">
                <BookUser size={16} className="text-gray-800 stroke-[2.2]" />
              </div>
            </div>

            {/* Sub-bar: Date & Elapsed Timer / Status */}
            <div className="bg-[#f0f3f6] px-2.5 py-1 border-b border-gray-200 flex items-center justify-between text-xs text-gray-800 font-bold">
              <span>{matchDateFormatted}</span>
              <span className="font-mono text-gray-800">
                {isCompleted ? "Result Declared" : isLive ? "In Play" : "Upcoming"}
              </span>
            </div>

            {/* Match Result Banner (Visible after Result Declaration) */}
            {isCompleted && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-950 font-bold">
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-500" />
                  <span>
                    Result: <strong>{winner || matchData?.winner || "Winner Declared"}</strong> won
                  </span>
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                    Settled
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-800">
                  Hierarchy Share Paid
                </span>
              </div>
            )}

            {/* Runners Table */}
            <div className="divide-y divide-gray-200">
              {/* Runner 1: Team A */}
              <div
                onClick={() => setSelectedRunnerIdx(0)}
                className={`flex items-stretch transition-colors cursor-pointer ${
                  isCompleted && isWinnerA
                    ? "bg-[#c8f79f]"
                    : "bg-white hover:bg-gray-50/70"
                }`}
              >
                {/* Left: Team Name + Exposure + Winner Badge */}
                <div className="flex-1 px-3 py-1.5 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-xs sm:text-[13px] leading-tight">
                      {teamA}
                    </span>
                    {isCompleted && isWinnerA && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1 uppercase tracking-wide">
                        <Trophy size={10} className="text-yellow-300" /> Winner
                      </span>
                    )}
                  </div>
                  {renderRunnerExposure(teamA)}
                </div>

                {/* Right: Back & Lay Boxes (Shows Live Odds when Pending, Closed when Completed) */}
                <div className="flex w-32 sm:w-36 shrink-0">
                  {isCompleted ? (
                    <div className="w-full bg-gray-100 min-h-[46px] flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-wider">
                      Closed
                    </div>
                  ) : isSuspended ? (
                    <div className="w-full bg-[#fde8e8] min-h-[46px] flex items-center justify-center text-[#e02424] font-black text-xs tracking-wider">
                      SUSPENDED
                    </div>
                  ) : (
                    <>
                      {/* Back Odds Box (Blue) */}
                      <div className="flex-1 bg-[#dff0ff] hover:bg-[#cde7fe] border-r border-white/60 min-h-[46px] flex flex-col items-center justify-center transition-colors">
                        <span className="text-xs sm:text-[14px] font-black text-gray-900 leading-tight">
                          {runnerOddsA.back}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-none mt-0.5">
                          {runnerOddsA.backVol}
                        </span>
                      </div>
                      {/* Lay Odds Box (Pink) */}
                      <div className="flex-1 bg-[#ffdce5] hover:bg-[#ffc6d4] min-h-[46px] flex flex-col items-center justify-center transition-colors">
                        <span className="text-xs sm:text-[14px] font-black text-gray-900 leading-tight">
                          {runnerOddsA.lay}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-none mt-0.5">
                          {runnerOddsA.layVol}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Runner 2: Team B */}
              <div
                onClick={() => setSelectedRunnerIdx(1)}
                className={`flex items-stretch transition-colors cursor-pointer ${
                  isCompleted && isWinnerB
                    ? "bg-[#c8f79f]"
                    : "bg-white hover:bg-gray-50/70"
                }`}
              >
                {/* Left: Team Name + Exposure + Winner Badge */}
                <div className="flex-1 px-3 py-1.5 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-xs sm:text-[13px] leading-tight">
                      {teamB}
                    </span>
                    {isCompleted && isWinnerB && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1 uppercase tracking-wide">
                        <Trophy size={10} className="text-yellow-300" /> Winner
                      </span>
                    )}
                  </div>
                  {renderRunnerExposure(teamB)}
                </div>

                {/* Right: Back & Lay Boxes */}
                <div className="flex w-32 sm:w-36 shrink-0">
                  {isCompleted ? (
                    <div className="w-full bg-gray-100 min-h-[46px] flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-wider">
                      Closed
                    </div>
                  ) : isSuspended ? (
                    <div className="w-full bg-[#fde8e8] min-h-[46px] flex items-center justify-center text-[#e02424] font-black text-xs tracking-wider">
                      SUSPENDED
                    </div>
                  ) : (
                    <>
                      {/* Back Odds Box (Blue) */}
                      <div className="flex-1 bg-[#dff0ff] hover:bg-[#cde7fe] border-r border-white/60 min-h-[46px] flex flex-col items-center justify-center transition-colors">
                        <span className="text-xs sm:text-[14px] font-black text-gray-900 leading-tight">
                          {runnerOddsB.back}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-none mt-0.5">
                          {runnerOddsB.backVol}
                        </span>
                      </div>
                      {/* Lay Odds Box (Pink) */}
                      <div className="flex-1 bg-[#ffdce5] hover:bg-[#ffc6d4] min-h-[46px] flex flex-col items-center justify-center transition-colors">
                        <span className="text-xs sm:text-[14px] font-black text-gray-900 leading-tight">
                          {runnerOddsB.lay}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-none mt-0.5">
                          {runnerOddsB.layVol}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ ACTION BUTTONS: BET LOCK & USER BOOK ══════════ */}
          <div className="flex gap-2.5 my-0.5">
            <button
              onClick={() => setIsBetLockOpen((prev) => !prev)}
              className="flex-1 bg-[#00a884] hover:bg-[#009172] active:scale-98 text-white py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Bet Lock</span>
              <ChevronDown size={14} />
            </button>

            <button
              onClick={() => setIsUserBookOpen((prev) => !prev)}
              className="flex-1 bg-[#00a884] hover:bg-[#009172] active:scale-98 text-white py-2 px-3 rounded-sm flex items-center justify-center text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
            >
              User Book
            </button>
          </div>

          {/* Bet Lock Dropdown Popover */}
          {isBetLockOpen && (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-sm text-xs flex items-center justify-between text-gray-700 animate-fadeIn">
              <span className="font-semibold flex items-center gap-1.5">
                <Lock size={13} className="text-gray-500" />
                Lock market bets for downline users?
              </span>
              <button
                onClick={() => {
                  alert("Bet Lock state toggled successfully.");
                  setIsBetLockOpen(false);
                }}
                className="bg-red-600 text-white font-bold px-2.5 py-1 rounded-sm text-[11px] cursor-pointer"
              >
                Confirm Lock
              </button>
            </div>
          )}

          {/* User Book Dropdown Popover */}
          {isUserBookOpen && (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-sm text-xs flex flex-col gap-1.5 text-gray-700 animate-fadeIn">
              <div className="flex items-center justify-between font-bold border-b border-gray-200 pb-1">
                <span>User Book Summary ({selectedMarketType}):</span>
                <span className="text-gray-400 font-mono text-[10px]">
                  Total Bets: {allMatchedBets.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{teamA}:</span>
                <span
                  className={`font-mono font-bold ${getRunnerExposure(teamA) < 0
                    ? "text-red-600"
                    : getRunnerExposure(teamA) > 0
                      ? "text-emerald-600"
                      : "text-gray-600"
                    }`}
                >
                  {getRunnerExposure(teamA) != null
                    ? Math.round(getRunnerExposure(teamA)).toLocaleString("en-IN")
                    : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{teamB}:</span>
                <span
                  className={`font-mono font-bold ${getRunnerExposure(teamB) < 0
                    ? "text-red-600"
                    : getRunnerExposure(teamB) > 0
                      ? "text-emerald-600"
                      : "text-gray-600"
                    }`}
                >
                  {getRunnerExposure(teamB) != null
                    ? Math.round(getRunnerExposure(teamB)).toLocaleString("en-IN")
                    : "0"}
                </span>
              </div>
            </div>
          )}

          {/* ══════════ BETTOR-STYLE LIVE SCORECARD (TV REMOVED) ══════════ */}
          <div className="rounded-sm overflow-hidden border border-gray-200 shadow-2xs bg-white">
            {/* Header */}
            <div className="bg-[#00a884] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider">
                  Score Card
                </span>
                {isCompleted ? (
                  <span className="bg-purple-900/80 text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                    Result Declared
                  </span>
                ) : isLive ? (
                  <span className="bg-[#00c766] text-white text-[10px] font-black px-1.5 py-0.2 rounded uppercase animate-pulse">
                    INPLAY
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="text-white/90 hover:text-white transition-colors cursor-pointer p-0.5"
                title={soundEnabled ? "Mute commentary" : "Unmute commentary"}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>

            {/* Scorecard Body */}
            <div className="bg-[#0e1f2c] text-white p-3 flex flex-col gap-3">
              {/* Teams & Runs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                {/* Team A */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider truncate max-w-[110px]">
                      {teamA}
                    </span>
                    {scoreData.isChasingA && (
                      <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    {scoreData.parsedA.runs}
                    <span className="text-gray-400 text-base font-bold mx-0.5">/</span>
                    {scoreData.parsedA.wickets}
                  </div>
                </div>

                {/* Overs Divider */}
                <div className="flex flex-col items-center px-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Overs</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#79c0ff] font-mono">
                    {scoreData.displayOvers}
                  </span>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    {!scoreData.isChasingA && (
                      <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-ping" />
                    )}
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider truncate max-w-[110px]">
                      {teamB}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    {scoreData.parsedB.runs}
                    <span className="text-gray-400 text-base font-bold mx-0.5">/</span>
                    {scoreData.parsedB.wickets}
                  </div>
                </div>
              </div>

              {/* Granular Stats Cards: CRR, RRR, Target */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#1b2f42] p-1.5 rounded flex flex-col items-center justify-center border border-white/5 shadow-2xs">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">CRR</span>
                  <span className="text-xs sm:text-[13px] font-black text-[#00e676] font-mono">
                    {scoreData.crr || "0.00"}
                  </span>
                </div>

                <div className="bg-[#1b2f42] p-1.5 rounded flex flex-col items-center justify-center border border-white/5 shadow-2xs">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">RRR</span>
                  <span className="text-xs sm:text-[13px] font-black text-amber-400 font-mono">
                    {scoreData.rrr || "0.00"}
                  </span>
                </div>

                <div className="bg-[#1b2f42] p-1.5 rounded flex flex-col items-center justify-center border border-white/5 shadow-2xs">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Target</span>
                  <span className="text-xs sm:text-[13px] font-black text-sky-400 font-mono">
                    {scoreData.target || "--"}
                  </span>
                </div>
              </div>

              {/* This Over & Remaining Balls / Situation */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-400">This Over:</span>
                  <div className="flex items-center gap-1">
                    {scoreData.thisOverList.length > 0 ? (
                      scoreData.thisOverList.map((ball, bidx) => (
                        <span
                          key={bidx}
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${
                            ball === "W"
                              ? "bg-red-500 text-white"
                              : ["4", "6"].includes(ball)
                                ? "bg-[#00e676] text-gray-950"
                                : "bg-[#253d52] text-gray-200"
                          }`}
                        >
                          {ball}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Waiting...</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-black text-[#00e676]">
                  {isCompleted ? (
                    <span>Match Ended ({winner || "Result Declared"})</span>
                  ) : scoreData.remRuns > 0 && scoreData.remBalls > 0 ? (
                    `Need ${scoreData.remRuns} runs in ${scoreData.remBalls} balls`
                  ) : scoreData.target > 0 ? (
                    "Target achieved"
                  ) : (
                    "1st Innings in progress"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ OPEN BETS TABLE (MATCHING SCREENSHOT) ══════════ */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-2xs overflow-hidden">
            <div
              onClick={() => setIsOpenBetsOpen((prev) => !prev)}
              className="bg-[#dce8f5] px-3 py-1.5 border-b border-[#cbdfe9] flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  Open Bets ({allOpenBets.length})
                </span>
                <RefreshCw size={12} className="text-gray-800 stroke-[2.2]" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-900 tracking-tight">
                  {isLive ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <div className="text-gray-600">
                {isOpenBetsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isOpenBetsOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-white text-gray-900 font-bold border-b border-gray-200 text-[11px] sm:text-xs">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-bold text-gray-900">Runner</th>
                      <th className="px-2 py-1.5 text-center font-bold w-16 text-gray-900">Price</th>
                      <th className="px-3 py-1.5 text-right font-bold w-20 text-gray-900">Size</th>
                      <th className="px-3 py-1.5 text-left font-bold w-24 text-gray-900">Better</th>
                      <th className="px-3 py-1.5 text-left font-bold w-24 text-gray-900">Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {allOpenBets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-3 text-center text-xs text-gray-400 font-medium"
                        >
                          No open bets
                        </td>
                      </tr>
                    ) : (
                      allOpenBets.map((bet, bIdx) => {
                        const isBack = (bet.type || "").toLowerCase() === "back";
                        return (
                          <tr
                            key={bet.id || bIdx}
                            className={
                              isBack
                                ? "bg-[#dcecfd] text-gray-900 border-b border-white/60"
                                : "bg-[#fbe2e8] text-gray-900 border-b border-white/60"
                            }
                          >
                            <td className="px-3 py-1.5 font-bold text-gray-900 text-xs sm:text-[13px] leading-tight text-left">
                              {formatBetRunner(bet)}
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold text-gray-900 text-xs sm:text-[13px]">
                              {bet.price || bet.odds || "--"}
                            </td>
                            <td className="px-3 py-1.5 text-right font-black text-gray-900 text-xs sm:text-[13px]">
                              {Number(bet.size || bet.stake || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-1.5 text-left font-bold text-gray-800 text-xs sm:text-[13px] truncate">
                              {bet.better || bet.userId || "--"}
                            </td>
                            <td className="px-3 py-1.5 text-left font-bold text-gray-800 text-xs sm:text-[13px] truncate">
                              {bet.master || "Direct"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ══════════ MATCHED BETS TABLE (MATCHING SCREENSHOT) ══════════ */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-2xs overflow-hidden">
            <div className="bg-[#dce8f5] px-3 py-1.5 border-b border-[#cbdfe9] flex items-center justify-between">
              <div
                onClick={() => setIsMatchedBetsOpen((prev) => !prev)}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  Matched Bets ({allMatchedBets.length})
                </span>
                <div className="text-gray-600">
                  {isMatchedBetsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              <button
                onClick={() => setIsFullBetListOpen(true)}
                className="bg-[#009866] hover:bg-[#008257] active:scale-95 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded shadow-2xs transition-all cursor-pointer"
              >
                Full Bet List
              </button>
            </div>

            {isMatchedBetsOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-white text-gray-900 font-bold border-b border-gray-200 text-[11px] sm:text-xs">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-bold text-gray-900">Runner</th>
                      <th className="px-2 py-1.5 text-center font-bold w-16 text-gray-900">Price</th>
                      <th className="px-3 py-1.5 text-right font-bold w-20 text-gray-900">Size</th>
                      <th className="px-3 py-1.5 text-left font-bold w-24 text-gray-900">Better</th>
                      <th className="px-3 py-1.5 text-left font-bold w-24 text-gray-900">Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {allMatchedBets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-3 text-center text-xs text-gray-400 font-medium"
                        >
                          No matched bets on this match
                        </td>
                      </tr>
                    ) : (
                      allMatchedBets.map((bet, bIdx) => {
                        const isBack = (bet.type || "").toLowerCase() === "back";
                        const normBetRunner = (bet.runner || "").toLowerCase();
                        const isBetWon =
                          bet.status === "won" ||
                          bet.status === "WIN" ||
                          (isCompleted && winner && normBetRunner.includes(winner.toLowerCase()));

                        return (
                          <tr
                            key={bet.id || bIdx}
                            className={
                              isBack
                                ? "bg-[#dcecfd] text-gray-900 border-b border-white/60 hover:bg-[#cfdff2]"
                                : "bg-[#fbe2e8] text-gray-900 border-b border-white/60 hover:bg-[#f3d4dc]"
                            }
                          >
                            <td className="px-3 py-1.5 font-bold text-gray-900 text-xs sm:text-[13px] leading-tight text-left">
                              <div className="flex items-center gap-1.5">
                                <span>{formatBetRunner(bet)}</span>
                                {isCompleted && (
                                  <span
                                    className={`text-[9px] font-black px-1 py-0.2 rounded uppercase ${isBetWon
                                      ? "bg-emerald-700 text-white"
                                      : "bg-red-700 text-white"
                                      }`}
                                  >
                                    {isBetWon ? "WON" : "LOST"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold text-gray-900 text-xs sm:text-[13px]">
                              {bet.price || bet.odds || "--"}
                            </td>
                            <td className="px-3 py-1.5 text-right font-black text-gray-900 text-xs sm:text-[13px]">
                              {Number(bet.size || bet.stake || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-1.5 text-left font-bold text-gray-800 text-xs sm:text-[13px] truncate">
                              {bet.better || bet.userId || "--"}
                            </td>
                            <td className="px-3 py-1.5 text-left font-bold text-gray-800 text-xs sm:text-[13px] truncate">
                              {bet.master || "Direct"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ══════════ MATCH SETTLEMENT ACTIONS (HIERARCHY DISTRIBUTION) ══════════ */}
          {isCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-2.5 shadow-2xs mt-1 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-xs sm:text-sm font-bold text-emerald-950">
                  Match Settled: Winner declared as <strong>{winner || matchData?.winner}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-800 font-semibold">
                  Hierarchy share distributed to wallets
                </span>
                <button
                  onClick={() => handleDeclareWinner("REFUND")}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Void / Refund
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-300 rounded-sm p-2.5 shadow-2xs mt-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-[#f1c40f]" />
                  <span className="text-xs font-bold text-gray-800">
                    Declare Match Winner (Hierarchy Settlement):
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleDeclareWinner(teamA)}
                    className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    {teamA} Won
                  </button>
                  <button
                    onClick={() => handleDeclareWinner(teamB)}
                    className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    {teamB} Won
                  </button>
                  <button
                    onClick={() => handleDeclareWinner("TIE")}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Tie
                  </button>
                  <button
                    onClick={() => handleDeclareWinner("REFUND")}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Refund
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ FULL BET LIST MODAL ══════════ */}
          {isFullBetListOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-3">
              <div className="bg-white rounded-md shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-300">
                <div className="bg-[#1b2a38] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#00c766]" />
                    <h2 className="text-sm md:text-base font-black uppercase tracking-wide">
                      Full Matched Bets List ({allMatchedBets.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsFullBetListOpen(false)}
                    className="text-gray-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Filter Input */}
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Filter by Runner, Better, Master, or Type..."
                    className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#00a884]"
                  />
                  {filterSearch && (
                    <button
                      onClick={() => setFilterSearch("")}
                      className="text-xs text-gray-500 hover:text-gray-800 font-bold px-2 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto flex-1 p-2">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#5d7d9a] text-white font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Runner</th>
                        <th className="px-2 py-2 text-center w-[85px]">Market</th>
                        <th className="px-2 py-2 text-center w-[60px]">Type</th>
                        <th className="px-2 py-2 text-center w-[65px]">Price</th>
                        <th className="px-3 py-2 text-right w-[85px]">Stake</th>
                        <th className="px-2 py-2 text-center w-[70px]">Share %</th>
                        <th className="px-3 py-2 text-right w-[95px]">My Stake</th>
                        <th className="px-3 py-2">Better</th>
                        <th className="px-3 py-2">Master</th>
                        <th className="px-3 py-2 text-right w-[90px]">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allMatchedBets
                        .filter((b) => {
                          if (!filterSearch) return true;
                          const q = filterSearch.toLowerCase();
                          return (
                            (b.runner || "").toLowerCase().includes(q) ||
                            (b.better || "").toLowerCase().includes(q) ||
                            (b.master || "").toLowerCase().includes(q) ||
                            (b.type || "").toLowerCase().includes(q) ||
                            (b.marketType || "").toLowerCase().includes(q)
                          );
                        })
                        .map((bet, idx) => {
                          const isBack = (bet.type || "").toLowerCase() === "back";
                          const isBookmaker = (bet.marketType || "").toLowerCase() === "bookmaker";
                          return (
                            <tr
                              key={bet.id || idx}
                              className={
                                isBack
                                  ? "bg-blue-50/40 hover:bg-blue-50/70"
                                  : "bg-red-50/40 hover:bg-red-50/70"
                              }
                            >
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {formatBetRunner(bet)}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isBookmaker
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : bet.marketType === "toss"
                                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                                      : "bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                >
                                  {isBookmaker
                                    ? "Bookmaker"
                                    : bet.marketType === "toss"
                                      ? "Toss"
                                      : "Match Odds"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isBack
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-red-100 text-red-700 border border-red-200"
                                    }`}
                                >
                                  {bet.type}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-gray-800">
                                {bet.price || bet.odds}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-gray-900">
                                ₹{Number(bet.size || bet.stake || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-gray-600">
                                {bet.sharePercent != null ? `${bet.sharePercent}%` : "--"}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-blue-700">
                                ₹
                                {Number(
                                  bet.parentStake != null
                                    ? bet.parentStake
                                    : (bet.size || 0) * ((bet.sharePercent || 10) / 100)
                                ).toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {bet.better || bet.userId}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {bet.master || "Direct"}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">
                                {bet.createdAt
                                  ? new Date(bet.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                  : "--"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-gray-100 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setIsFullBetListOpen(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-1.5 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
