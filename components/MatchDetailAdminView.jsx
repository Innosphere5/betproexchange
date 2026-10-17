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
  AlertCircle,
  Info,
  Clock
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
  const initialMarket = searchParams.get("market") || "ALL";

  const [matchData, setMatchData] = useState(null);
  const [selectedMarketType, setSelectedMarketType] = useState("ALL");
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

  // ── Real-Time Socket.IO Updates (Odds, Scores, Fancy, Figure, Even/Odd, Bets) ──
  useEffect(() => {
    if (!matchId) return;
    const socket = io(getApiUrl(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    // 1. Live Market Odds Updates
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

    // 5. Fancy Markets Update
    const handleFancyUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          fancyMarkets: data.fancyMarkets ?? prev?.fancyMarkets
        }));
      }
    };

    // 6. Figure Markets Update
    const handleFigureUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          figureMarkets: data.figureMarkets ?? prev?.figureMarkets
        }));
      }
    };

    // 7. Even/Odd Markets Update
    const handleEvenOddUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          evenOddMarkets: data.evenOddMarkets ?? prev?.evenOddMarkets
        }));
      }
    };

    // 8. Tied Match Market Update
    const handleTiedMatchUpdate = (data) => {
      const incomingId = String(data.matchId ?? "");
      if (String(matchId) === incomingId) {
        setMatchData((prev) => ({
          ...(prev || {}),
          tiedMatchMarket: data.tiedMatchMarket ?? prev?.tiedMatchMarket
        }));
      }
    };

    // 9. Match Record Update
    const handleMatchUpdate = (data) => {
      if (String(data.matchId) === String(matchId)) {
        fetchAllData(true);
      }
    };

    // 10. Live Cricket Score Update
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
    socket.on("fancy_market_update", handleFancyUpdate);
    socket.on("figure_market_update", handleFigureUpdate);
    socket.on("even_odd_market_update", handleEvenOddUpdate);
    socket.on("tied_match_market_update", handleTiedMatchUpdate);
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
      socket.off("fancy_market_update", handleFancyUpdate);
      socket.off("figure_market_update", handleFigureUpdate);
      socket.off("even_odd_market_update", handleEvenOddUpdate);
      socket.off("tied_match_market_update", handleTiedMatchUpdate);
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

  const shortA = useMemo(() => teamA.slice(0, 4).toUpperCase(), [teamA]);
  const shortB = useMemo(() => teamB.slice(0, 4).toUpperCase(), [teamB]);

  // Status computation
  const isCompleted = Boolean(
    (matchData?.isCompleted === true ||
      matchData?.status === "completed" ||
      matchData?.status === "resulted") &&
    matchData?.status !== "live"
  );
  const winner = isCompleted ? (matchData?.winner || null) : null;
  const isLive = Boolean(matchData && (matchData.status === "live" || matchData.inplay === true));
  const isSuspended = Boolean(matchData?.marketStatus === "SUSPENDED" || matchData?.isSuspended === true || matchData?.status === "suspended");

  // Volume format helper
  const formatVol = (val, fallback = "100") => {
    if (!val) return fallback;
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return String(num);
  };

  // ── Available Tabs ────────────────────────────────────────────────────────
  const availableTabs = [
    "ALL",
    "Match Odds",
    "Bookmaker",
    "Toss",
    "Score Card",
    "Figure",
    "Fancy",
    "Even-Odd"
  ];

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

    let target = Number(sc.target) || 0;
    if (!target && parsedB.runs > 0 && parsedA.runs > parsedB.runs) {
      target = parsedA.runs + 1;
    } else if (!target && parsedA.runs > 0 && parsedB.runs > parsedA.runs) {
      target = parsedB.runs + 1;
    }

    const isBattingB = sc.battingTeam === 'teamB' || (target > 0 && parsedA.runs >= parsedB.runs && sc.battingTeam !== 'teamA');
    const isBattingA = sc.battingTeam === 'teamA' || (!isBattingB && parsedA.runs > 0);
    const isChasingA = Boolean(target > 0 && isBattingA);
    const rawOvers = String(sc.overs || "0.0");
    const displayOvers = rawOvers === "0.0" ? "0.0" : rawOvers;
    const crr = sc.runRate || sc.crr || "0.00";

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
    }

    return {
      parsedA,
      parsedB,
      isChasingA,
      displayOvers,
      crr,
      rrr,
      target,
      remRuns,
      remBalls,
      thisOverList,
      isBattingA,
      isBattingB,
      periods: sc.periods || null
    };
  }, [matchData?.score]);

  // ── Retrieve Runner Net Exposure Based on Parent Share Logic ─────────────
  const getRunnerExposure = useCallback(
    (runnerName, marketType = null) => {
      if (!runnerName) return 0;
      const norm = runnerName.trim().toLowerCase();

      // 1. Direct from Current Position (Authoritative Parent Share)
      const cpItems = currentPositionList.filter(
        (p) =>
          String(p.matchId) === String(matchId) ||
          (p.matchName && matchName && p.matchName.toLowerCase() === matchName.toLowerCase())
      );

      for (const item of cpItems) {
        if (marketType && item.marketType && item.marketType !== marketType) continue;
        if (item.name && item.name.trim().toLowerCase() === norm) {
          return item.amount != null ? item.amount : 0;
        }
        if (
          item.name &&
          (item.name.toLowerCase().includes(norm) || norm.includes(item.name.toLowerCase()))
        ) {
          return item.amount != null ? item.amount : 0;
        }
      }

      // 2. From exposure endpoints
      const sources = [betsData?.adminExposure, betsData?.exposure, adminExposureData?.exposure];
      const testKeys = [
        runnerName,
        norm,
        `${runnerName}_bm`,
        `${runnerName} To Win The Toss`,
        `tied_${norm}`,
        `digit_${runnerName}`
      ];

      for (const src of sources) {
        if (!src) continue;
        for (const k of testKeys) {
          if (src[k] !== undefined && src[k] !== 0) return src[k];
        }
        for (const [k, v] of Object.entries(src)) {
          if (k.trim().toLowerCase() === norm && v !== 0) return v;
          if (k.trim().toLowerCase() === `${norm}_bm` && v !== 0) return v;
        }
      }

      return 0;
    },
    [currentPositionList, matchId, matchName, betsData, adminExposureData]
  );

  // ── Render Runner Exposure (Bold Green for Profit, Bold Red for Loss) ────
  const renderRunnerExposure = useCallback(
    (runnerName, marketType = null) => {
      const exp = getRunnerExposure(runnerName, marketType);
      if (exp === null || exp === undefined || isNaN(exp)) return null;

      const isNegative = exp < 0;
      const isPositive = exp > 0;
      const formatted = Math.abs(Math.round(exp)).toLocaleString("en-IN");

      return (
        <div
          className={`text-[12px] sm:text-[13px] font-black mt-0.5 tracking-tight ${
            isNegative ? "text-[#dc2626]" : isPositive ? "text-[#009866]" : "text-gray-500"
          }`}
        >
          {isNegative ? `-${formatted}` : isPositive ? `+${formatted}` : "0"}
        </div>
      );
    },
    [getRunnerExposure]
  );

  // ── Render Fancy Exposure ────────────────────────────────────────────────
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

    const yesVal = getExposureVal('yes');
    const noVal = getExposureVal('no');

    if (yesVal !== undefined && noVal !== undefined && (yesVal !== 0 || noVal !== 0)) {
      return (
        <div className="flex flex-col">
          <div className="text-[12px] font-black mt-0.5 flex items-center gap-1.5">
            <span className={yesVal >= 0 ? "text-[#009866]" : "text-[#dc2626]"}>
              {yesVal >= 0 ? `+${Math.round(yesVal).toLocaleString("en-IN")}` : `-${Math.abs(Math.round(yesVal)).toLocaleString("en-IN")}`}
            </span>
            <span className="text-gray-400">/</span>
            <span className={noVal >= 0 ? "text-[#009866]" : "text-[#dc2626]"}>
              {noVal >= 0 ? `+${Math.round(noVal).toLocaleString("en-IN")}` : `-${Math.abs(Math.round(noVal)).toLocaleString("en-IN")}`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">Book</span>
        </div>
      );
    }

    const singleExp = getRunnerExposure(marketName, 'fancy');
    if (singleExp !== 0 && singleExp !== null && singleExp !== undefined) {
      const isNeg = singleExp < 0;
      return (
        <div className="flex flex-col">
          <div className={`text-[12px] font-black mt-0.5 ${isNeg ? "text-[#dc2626]" : "text-[#009866]"}`}>
            {isNeg ? `-${Math.abs(Math.round(singleExp)).toLocaleString("en-IN")}` : `+${Math.round(singleExp).toLocaleString("en-IN")}`}
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">Book</span>
        </div>
      );
    }

    return <span className="text-[11px] font-black text-[#00c766] hover:underline cursor-pointer mt-0.5">Book</span>;
  }, [betsData, adminExposureData, getRunnerExposure]);

  // ── Render Digit Exposure (Figure) ───────────────────────────────────────
  const renderDigitExposure = useCallback((marketName, digit) => {
    const keys = [
      `${marketName} - Digit ${digit}`,
      `${marketName}_${digit}`,
      `digit_${digit}`
    ];
    let exp = 0;
    for (const k of keys) {
      const val = getRunnerExposure(k, 'figure');
      if (val !== 0 && val !== undefined && !isNaN(val)) {
        exp = val;
        break;
      }
    }
    if (exp === 0 || exp === undefined || isNaN(exp)) return null;
    const isNegative = exp < 0;
    const formatted = Math.abs(Math.round(exp)).toLocaleString("en-IN");
    return (
      <div className={`text-[10px] font-black py-0.5 border-t border-gray-200 text-center leading-none tracking-tight ${isNegative ? 'text-[#dc2626] bg-[#fbe2e8]/40' : 'text-[#009866] bg-[#dcecfd]/40'}`}>
        {isNegative ? `-${formatted}` : `+${formatted}`}
      </div>
    );
  }, [getRunnerExposure]);

  // ── Toss & Match Settlement Handlers ─────────────────────────────────────
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

  const handleDeclareTossWinner = async (tossWinner) => {
    if (!window.confirm(`Declare "${tossWinner}" as Toss Winner? This will immediately settle all toss bets across hierarchy.`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/admin/declare-toss-winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matchId, tossWinner })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert(`Toss winner declared: ${tossWinner}`);
        fetchAllData(false);
      } else {
        alert(resData.error || "Failed to declare toss winner");
      }
    } catch (e) {
      alert("Error declaring toss winner");
    }
  };

  const handleBackToPositions = () => {
    router.push(`/${role}/current-position`);
  };

  // Header user info stats
  const totalMarketExposure = useMemo(() => {
    const expA = getRunnerExposure(teamA, 'match_odds');
    const expB = getRunnerExposure(teamB, 'match_odds');
    const worstMo = Math.min(expA, expB);
    return worstMo < 0 ? worstMo : 0;
  }, [getRunnerExposure, teamA, teamB]);

  // Combined real matched & open bets
  const allMatchedBets = useMemo(() => {
    const fromBets = (betsData?.matchedBets || []).map((b) => ({ ...b, id: b.id || b._id }));
    const fromExp = (adminExposureData?.matchedBets || []).map((b) => ({ ...b, id: b.id || b._id }));
    const fromCP = currentPositionBets
      .filter((b) => String(b.matchId) === String(matchId))
      .map((b) => ({ ...b, id: b.id || b._id, parentStake: b.shareAmount || b.parentStake }));

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
    if (isBookmaker) return `${cleanRunner} BM`;
    return bet.runner;
  };

  const displayUsername = userSession?.username || "admin";
  const displayRoleTitle = roleTitle || "Admin";
  const displayBalance = userSession?.balance != null ? Number(userSession.balance).toLocaleString("en-IN") : "0";
  const displayExposure = totalMarketExposure < 0 ? `-${Math.abs(Math.round(totalMarketExposure)).toLocaleString("en-IN")}` : "0";

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
    return "Today";
  }, [matchData?.startTime]);

  // Dynamic Runner Odds for Match Odds
  const runnerOddsA = useMemo(() => ({
    back: matchData?.backOddsA ? Number(matchData.backOddsA).toFixed(2) : "1.98",
    lay: matchData?.layOddsA ? Number(matchData.layOddsA).toFixed(2) : "2.02",
    backVol: formatVol(matchData?.depthBackA, "100"),
    layVol: formatVol(matchData?.depthLayA, "100")
  }), [matchData]);

  const runnerOddsB = useMemo(() => ({
    back: matchData?.backOddsB ? Number(matchData.backOddsB).toFixed(2) : "1.98",
    lay: matchData?.layOddsB ? Number(matchData.layOddsB).toFixed(2) : "2.02",
    backVol: formatVol(matchData?.depthBackB, "100"),
    layVol: formatVol(matchData?.depthLayB, "100")
  }), [matchData]);

  // Bookmaker Odds
  const bmBackOddsA = matchData?.bookmakerBackA || matchData?.backOddsA ? Number(matchData.bookmakerBackA || matchData.backOddsA).toFixed(2) : "-";
  const bmLayOddsA = matchData?.bookmakerLayA || (matchData?.layOddsA ? Number((matchData.layOddsA > (matchData.backOddsA || 0) ? matchData.layOddsA + 0.01 : (matchData.backOddsA || 0) + 0.02).toFixed(2)) : "-");
  const bmBackOddsB = matchData?.bookmakerBackB || (matchData?.backOddsB ? Number((matchData.backOddsB >= 2 ? matchData.backOddsB - 0.02 : matchData.backOddsB).toFixed(2)) : "-");
  const bmLayOddsB = matchData?.bookmakerLayB || (matchData?.layOddsB ? Number((matchData.layOddsB >= 2 ? matchData.layOddsB + 0.02 : matchData.layOddsB + 0.02).toFixed(2)) : "-");
  const isBookmakerSuspended = matchData?.bookmakerMarketStatus === "SUSPENDED" || (!matchData?.bookmakerBackA && !matchData?.backOddsA);

  // Toss Runners
  const tossRunners = [
    {
      name: `${teamA} To Win The Toss`,
      back: matchData?.tossBackA || "1.98",
      backVol: matchData?.tossDepthBackA || "100",
      lay: matchData?.tossLayA || "2.02",
      layVol: matchData?.tossDepthLayA || "100"
    },
    {
      name: `${teamB} To Win The Toss`,
      back: matchData?.tossBackB || "1.98",
      backVol: matchData?.tossDepthBackB || "100",
      lay: matchData?.tossLayB || "2.02",
      layVol: matchData?.tossDepthLayB || "100"
    }
  ];
  const isTossSuspended = matchData?.tossMarketStatus === "SUSPENDED";

  // Figure Markets
  const figureMarkets = matchData?.figureMarkets && matchData.figureMarkets.length > 0
    ? matchData.figureMarkets
    : [
        {
          name: `${teamA.toUpperCase()} 15 OVER TOTAL LAST FIGURE`,
          maxBet: 100000,
          status: 'SUSPENDED',
          digits: Array.from({ length: 10 }, (_, i) => ({ digit: i, odds: 8.85, status: 'SUSPENDED' }))
        }
      ];

  // Fancy Markets
  const fancyMarkets = matchData?.fancyMarkets && matchData.fancyMarkets.length > 0
    ? matchData.fancyMarkets
    : [
        { name: `10 Over Run ${shortA}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `11 Over Run Only ${shortA}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `20 Over Run ${shortA}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `Fall of 1st Wkt ${shortA}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `Fall of 2nd Wkt ${shortA}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `10 Over Run ${shortB}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' },
        { name: `Fall of 1st Wkt ${shortB}`, backPrice: null, backVol: '100', layPrice: null, layVol: '100', status: 'SUSPENDED' }
      ];

  // Even/Odd Markets
  const evenOddMarkets = matchData?.evenOddMarkets && matchData.evenOddMarkets.length > 0
    ? matchData.evenOddMarkets
    : [
        { name: "1st inn 15 Over Run Odd (Kalli)", backPrice: null, backVol: "100", layPrice: null, layVol: "100", status: "SUSPENDED" },
        { name: "1st inn 20 Over Run Odd (Kalli)", backPrice: null, backVol: "100", layPrice: null, layVol: "100", status: "SUSPENDED" }
      ];

  const tiedMatchMarket = matchData?.tiedMatchMarket;

  const isShowAll = selectedMarketType === "ALL";

  return (
    <div className="w-full bg-[#eaedf1] min-h-screen text-gray-800 font-sans antialiased pb-12 select-none">
      <div className="max-w-2xl sm:max-w-3xl mx-auto flex flex-col bg-white shadow-md min-h-screen">
        
        {/* ─── 1. TOP MOBILE/PARENT HEADER ─── */}
        <div className="bg-[#243f55] text-white border-b border-white/10 px-3 py-2 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToPositions}
              className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded text-white text-xs font-bold cursor-pointer transition-colors"
              title="Back to Positions"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white">
              <span className="font-semibold text-white flex items-center gap-0.5 cursor-pointer">
                <span>{displayUsername}</span>
                <span className="text-gray-300 font-normal">({displayRoleTitle})</span>
              </span>

              <span className="text-gray-300 font-mono text-[11px] sm:text-xs">
                • B: <span className="font-bold text-white">{displayBalance}</span>
              </span>

              <span className="font-mono text-[11px] sm:text-xs text-gray-300">
                Exp: <span className="font-bold text-red-400">{displayExposure}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchAllData(false)}
              disabled={isLoading}
              className="p-1.5 text-gray-300 hover:text-white rounded transition-colors cursor-pointer"
              title="Refresh Odds & Bets"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin text-[#00c766]" : ""} />
            </button>
          </div>
        </div>

        {/* ─── MATCH HEADER BANNER ─── */}
        <div className="bg-[#1d3548] text-white px-4 py-2.5 flex items-center justify-between border-b border-white/5">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-[#00c766] font-black uppercase tracking-wider">
              <Clock size={12} strokeWidth={3} className="text-[#00c766]" />
              <span>{isLive ? "LIVE NOW" : "UPCOMING"} | {matchDateFormatted}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
              {matchName}
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-600 text-white animate-pulse' : isCompleted ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
              {isCompleted ? "COMPLETED" : isLive ? "IN PLAY" : "UPCOMING"}
            </span>
          </div>
        </div>

        {/* ─── MARKET SELECTOR TABS (BPExch Style) ─── */}
        <div className="bg-[#142634] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/10 sticky top-[45px] z-20">
          {availableTabs.map((tab) => {
            const isSelected = selectedMarketType === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedMarketType(tab)}
                className={`px-3.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                  isSelected
                    ? "bg-[#00a884] text-white font-extrabold"
                    : "bg-[#253849] hover:bg-[#2f465a] text-gray-300"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ─── 2. MAIN CONTENT AREA (All requested sections accurately rendered) ─── */}
        <div className="p-2 sm:p-3 flex flex-col gap-3 bg-[#eaedf1] flex-1">

          {/* ══════════ SECTION 1: MATCH ODDS MARKET ══════════ */}
          {(isShowAll || selectedMarketType === "Match Odds") && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    MATCH ODDS <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 5M)</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              {/* Runners List with Net Parent Profit/Loss in Bold Green/Red under each Team */}
              <div className="relative flex flex-col divide-y divide-gray-100">
                {isSuspended && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                      MARKET SUSPENDED
                    </div>
                  </div>
                )}

                {/* Team A */}
                <div className="flex items-stretch hover:bg-gray-50 transition-colors">
                  <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{teamA}</span>
                      {isCompleted && winner && (winner.toLowerCase().includes(teamA.toLowerCase()) || teamA.toLowerCase().includes(winner.toLowerCase())) && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1 uppercase">
                          <Trophy size={10} className="text-yellow-300" /> Winner
                        </span>
                      )}
                    </div>
                    {renderRunnerExposure(teamA, 'match_odds')}
                  </div>
                  <div className="flex w-32 shrink-0">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{runnerOddsA.back}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">{runnerOddsA.backVol}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{runnerOddsA.lay}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">{runnerOddsA.layVol}</span>
                    </div>
                  </div>
                </div>

                {/* Team B */}
                <div className="flex items-stretch hover:bg-gray-50 transition-colors">
                  <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{teamB}</span>
                      {isCompleted && winner && (winner.toLowerCase().includes(teamB.toLowerCase()) || teamB.toLowerCase().includes(winner.toLowerCase())) && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1 uppercase">
                          <Trophy size={10} className="text-yellow-300" /> Winner
                        </span>
                      )}
                    </div>
                    {renderRunnerExposure(teamB, 'match_odds')}
                  </div>
                  <div className="flex w-32 shrink-0">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{runnerOddsB.back}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">{runnerOddsB.backVol}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{runnerOddsB.lay}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">{runnerOddsB.layVol}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Declare Match Winner Bar */}
              {!isCompleted && (
                <div className="bg-[#f0f4f8] px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200">
                  <span className="flex items-center gap-1.5 text-xs font-black text-gray-700">
                    <Trophy size={13} className="text-amber-500" /> Settle Match Winner:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeclareWinner(teamA)}
                      className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer shadow-xs"
                    >
                      {teamA}
                    </button>
                    <button
                      onClick={() => handleDeclareWinner(teamB)}
                      className="bg-[#2980b9] hover:bg-[#1f618d] text-white px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer shadow-xs"
                    >
                      {teamB}
                    </button>
                    <button
                      onClick={() => handleDeclareWinner("REFUND")}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer shadow-xs"
                    >
                      Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ SECTION 2: BOOKMAKERS MARKET ══════════ */}
          {(isShowAll || selectedMarketType === "Bookmaker") && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    BOOKMAKER <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 1M)</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              <div className="relative flex flex-col divide-y divide-gray-100">
                {isBookmakerSuspended && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                      MARKET SUSPENDED
                    </div>
                  </div>
                )}

                {/* Team A Bookmaker */}
                <div className="flex items-stretch hover:bg-gray-50 transition-colors">
                  <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                    <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{teamA}</span>
                    {renderRunnerExposure(`${teamA}_bm`, 'bookmaker')}
                  </div>
                  <div className="flex w-32 shrink-0">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{bmBackOddsA}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">100</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{bmLayOddsA}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">100</span>
                    </div>
                  </div>
                </div>

                {/* Team B Bookmaker */}
                <div className="flex items-stretch hover:bg-gray-50 transition-colors">
                  <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                    <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{teamB}</span>
                    {renderRunnerExposure(`${teamB}_bm`, 'bookmaker')}
                  </div>
                  <div className="flex w-32 shrink-0">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{bmBackOddsB}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">100</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                      <span className="text-[15px] font-black leading-none text-[#1c3246]">{bmLayOddsB}</span>
                      <span className="text-[9px] font-bold mt-1 text-gray-500">100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ SECTION 3: TOSS MARKET ══════════ */}
          {(isShowAll || selectedMarketType === "Toss") && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    TOSS MARKET <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              </div>

              {/* Admin Quick Declare Toss Winner Bar */}
              {!matchData?.tossWinner && (
                <div className="bg-[#1b2a38] text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200">
                  <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-black">
                    <Trophy size={14} /> Admin Declare Toss Winner:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeclareTossWinner(teamA)}
                      className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm cursor-pointer"
                    >
                      {teamA}
                    </button>
                    <button
                      onClick={() => handleDeclareTossWinner(teamB)}
                      className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm cursor-pointer"
                    >
                      {teamB}
                    </button>
                    <button
                      onClick={() => handleDeclareTossWinner('REFUND')}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-[11px] font-black uppercase shadow-sm cursor-pointer"
                    >
                      Refund
                    </button>
                  </div>
                </div>
              )}

              {/* Toss Settled Banner */}
              {matchData?.tossWinner ? (
                <div className="bg-[#ecfdf5] border-b border-emerald-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#009866]" />
                    <span className="text-xs font-black text-[#065f46] uppercase">
                      Toss Winner: {matchData.tossWinner}
                    </span>
                  </div>
                  <span className="bg-[#009866] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    Settled
                  </span>
                </div>
              ) : (
                <div className="relative flex flex-col divide-y divide-gray-100">
                  {isTossSuspended && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                        TOSS MARKET SUSPENDED
                      </div>
                    </div>
                  )}
                  {tossRunners.map((runner, ridx) => (
                    <div key={ridx} className="flex items-stretch hover:bg-gray-50 transition-colors">
                      <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                        <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{runner.name}</span>
                        {renderRunnerExposure(runner.name, 'toss')}
                      </div>
                      <div className="flex w-32 shrink-0">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                          <span className="text-[15px] font-black leading-none text-[#1c3246]">{runner.back}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-500">{runner.backVol}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                          <span className="text-[15px] font-black leading-none text-[#1c3246]">{runner.lay}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-500">{runner.layVol}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ SECTION 4: SCORECARD ══════════ */}
          {(isShowAll || selectedMarketType === "Score Card") && (
            <div className="rounded-sm overflow-hidden border border-gray-200 shadow-sm bg-white">
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
                  ) : (
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                      Scheduled
                    </span>
                  )}
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
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  {/* Team A */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider truncate max-w-[110px]">
                        {teamA}
                      </span>
                      {isLive && scoreData.isBattingA && (
                        <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-ping" title="Batting" />
                      )}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                      {scoreData.parsedA.runs}
                      <span className="text-gray-400 text-base font-bold mx-0.5">/</span>
                      {scoreData.parsedA.wickets}
                    </div>
                  </div>

                  {/* Overs */}
                  <div className="flex flex-col items-center px-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Overs</span>
                    <span className="text-sm sm:text-base font-extrabold text-[#79c0ff] font-mono">
                      {scoreData.displayOvers}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      {isLive && scoreData.isBattingB && (
                        <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-ping" title="Batting" />
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

                {/* This Over & Situation */}
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
                    ) : isLive ? (
                      "1st Innings in progress"
                    ) : (
                      "Match Scheduled"
                    )}
                  </div>

                  {/* Official Period Scores Breakdown */}
                  {scoreData.periods && Object.keys(scoreData.periods).length > 0 && (
                    <div className="border-t border-white/10 pt-2.5 mt-2.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Period Breakdown (Official OddsAPI Scores)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border border-white/10 rounded">
                          <thead className="bg-[#112433] text-gray-300 text-[9px] uppercase font-bold">
                            <tr>
                              <th className="py-1 px-2">Innings / Period</th>
                              <th className="py-1 px-2">{teamA}</th>
                              <th className="py-1 px-2">{teamB}</th>
                              <th className="py-1 px-2 text-right">Updated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-white text-[11px]">
                            {Object.entries(scoreData.periods)
                              .sort(([a], [b]) => (a === '0' ? 1 : b === '0' ? -1 : a.localeCompare(b)))
                              .map(([periodKey, pScore]) => (
                                <tr key={periodKey} className={periodKey === '0' ? 'bg-white/5 font-black text-[#79c0ff]' : ''}>
                                  <td className="py-1 px-2 font-sans font-semibold">
                                    {periodKey === '0' ? 'Overall Match (Total)' : `Innings ${periodKey} (Period ${periodKey})`}
                                  </td>
                                  <td className="py-1 px-2 font-black">{pScore?.participant1Score ?? 0}</td>
                                  <td className="py-1 px-2 font-black">{pScore?.participant2Score ?? 0}</td>
                                  <td className="py-1 px-2 text-right text-[9px] text-gray-400 font-sans">
                                    {pScore?.updatedAt ? new Date(pScore.updatedAt).toLocaleTimeString() : '--'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ SECTION 5: FIGURE MARKET (0-9 Digits Grid) ══════════ */}
          {(isShowAll || selectedMarketType === "Figure") && (
            figureMarkets.map((figureMarket, fmIdx) => (
              <div key={fmIdx} className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
                <div className="bg-[#5d7d9a] text-white h-10 flex items-center px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      {figureMarket.name} <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: {figureMarket.maxBet >= 1000000 ? `${(figureMarket.maxBet / 1000000).toFixed(0)}M` : `${(figureMarket.maxBet / 1000).toFixed(0)}K`})</span>
                      <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                    </span>
                  </div>
                </div>

                <div className="relative p-4 bg-white">
                  {figureMarket.status === 'SUSPENDED' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                        SUSPENDED
                      </div>
                    </div>
                  )}

                  {/* Row 1: Digits 0-4 */}
                  <div className="flex justify-center -space-x-[1px] mb-1.5">
                    {(figureMarket.digits || []).filter(d => d.digit >= 0 && d.digit <= 4).map((d) => (
                      <div
                        key={d.digit}
                        className="w-12 sm:w-16 border border-black shadow-xs overflow-hidden flex flex-col"
                      >
                        <div className="h-8 bg-[#bfe2f7] border-b border-black flex items-center justify-center text-[16px] font-black text-black">
                          {d.digit}
                        </div>
                        <div className="h-6 bg-white flex items-center justify-center text-[12px] font-black text-[#1c3246]">
                          {d.odds || 8.85}
                        </div>
                        {renderDigitExposure(figureMarket.name, d.digit)}
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Digits 5-9 */}
                  <div className="flex justify-center -space-x-[1px]">
                    {(figureMarket.digits || []).filter(d => d.digit >= 5 && d.digit <= 9).map((d) => (
                      <div
                        key={d.digit}
                        className="w-12 sm:w-16 border border-black shadow-xs overflow-hidden flex flex-col"
                      >
                        <div className="h-8 bg-[#bfe2f7] border-b border-black flex items-center justify-center text-[16px] font-black text-black">
                          {d.digit}
                        </div>
                        <div className="h-6 bg-white flex items-center justify-center text-[12px] font-black text-[#1c3246]">
                          {d.odds || 8.85}
                        </div>
                        {renderDigitExposure(figureMarket.name, d.digit)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* ══════════ SECTION 6: FANCY 2 MARKETS ══════════ */}
          {(isShowAll || selectedMarketType === "Fancy") && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    FANCY 2 <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                  <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1">LAY</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {fancyMarkets.map((fancy, fIdx) => {
                  const isSuspended = fancy.status === 'SUSPENDED';
                  return (
                    <div key={fIdx} className="relative flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{fancy.name}</span>
                        {renderFancyExposure(fancy.name)}
                      </div>
                      {isSuspended ? (
                        <div className="flex shrink-0 w-28 sm:w-32 items-center justify-center py-2 bg-gray-50/50">
                          <span className="text-[#dc2626] font-black text-[12px] tracking-wider">SUSPENDED</span>
                        </div>
                      ) : (
                        <div className="flex shrink-0">
                          <div className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] border-r border-white/40">
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{fancy.backPrice ?? '-'}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{fancy.backVol || '100'}</span>
                          </div>
                          <div className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4]">
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{fancy.layPrice ?? '-'}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{fancy.layVol || '100'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ SECTION 7: EVEN / ODD MARKET ══════════ */}
          {(isShowAll || selectedMarketType === "Even-Odd") && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    EVEN / ODD <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                  <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1">LAY</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {evenOddMarkets.map((eoMarket, eoIdx) => {
                  const isSuspended = eoMarket.status === 'SUSPENDED';
                  return (
                    <div key={eoIdx} className="relative flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{eoMarket.name}</span>
                        {renderFancyExposure(eoMarket.name)}
                      </div>
                      {isSuspended ? (
                        <div className="flex shrink-0 w-28 sm:w-32 items-center justify-center py-2 bg-gray-50/50">
                          <span className="text-[#dc2626] font-black text-[12px] tracking-wider">SUSPENDED</span>
                        </div>
                      ) : (
                        <div className="flex shrink-0">
                          <div className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] border-r border-white/40">
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{eoMarket.backPrice ?? '-'}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{eoMarket.backVol || '98'}</span>
                          </div>
                          <div className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4]">
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{eoMarket.layPrice ?? '-'}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{eoMarket.layVol || '102'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ SECTION 8: TIED MATCH (OTHERS) ══════════ */}
          {(isShowAll || selectedMarketType === "Others") && tiedMatchMarket && (
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    {tiedMatchMarket.name || 'TIED MATCH'} <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: {tiedMatchMarket.maxBet >= 1000000 ? `${(tiedMatchMarket.maxBet / 1000000).toFixed(0)}M` : `${(tiedMatchMarket.maxBet / 1000).toFixed(0)}K`})</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
                <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                  <div className="w-20 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                  <div className="w-20 text-center bg-[#1c3246] text-white py-1">LAY</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(tiedMatchMarket.runners || []).map((runner, rIdx) => {
                  const backPrice = runner.backOdds?.[0]?.price || '-';
                  const layPrice = runner.layOdds?.[0]?.price || '-';
                  return (
                    <div key={rIdx} className="flex items-stretch hover:bg-gray-50 transition-colors">
                      <div className="flex-1 flex flex-col justify-center px-3 py-2.5">
                        <span className="font-bold text-[#1c3246] text-[13px]">{runner.name}</span>
                        {renderRunnerExposure(`tied_${runner.name.toLowerCase()}`)}
                      </div>
                      <div className="flex w-40 shrink-0">
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#bbd9f9] border-r border-white/40">
                          <span className="text-[14px] font-black text-[#1c3246]">{backPrice}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#f8c9d4]">
                          <span className="text-[14px] font-black text-[#1c3246]">{layPrice}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ ACTION BUTTONS: BET LOCK & USER BOOK ══════════ */}
          <div className="flex gap-2.5 my-1">
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

          {/* Bet Lock Popover */}
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

          {/* User Book Popover */}
          {isUserBookOpen && (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-sm text-xs flex flex-col gap-1.5 text-gray-700 animate-fadeIn">
              <div className="flex items-center justify-between font-bold border-b border-gray-200 pb-1">
                <span>User Book Summary:</span>
                <span className="text-gray-400 font-mono text-[10px]">Total Bets: {allMatchedBets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{teamA}:</span>
                <span className={`font-mono font-bold ${getRunnerExposure(teamA, 'match_odds') < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {Math.round(getRunnerExposure(teamA, 'match_odds')).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{teamB}:</span>
                <span className={`font-mono font-bold ${getRunnerExposure(teamB, 'match_odds') < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {Math.round(getRunnerExposure(teamB, 'match_odds')).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* ══════════ OPEN BETS TABLE ══════════ */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
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
                        <td colSpan={5} className="p-3 text-center text-xs text-gray-400 font-medium">
                          No open bets
                        </td>
                      </tr>
                    ) : (
                      allOpenBets.map((bet, bIdx) => {
                        const isBack = (bet.type || "").toLowerCase() === "back";
                        return (
                          <tr
                            key={bet.id || bIdx}
                            className={isBack ? "bg-[#dcecfd] text-gray-900 border-b border-white/60" : "bg-[#fbe2e8] text-gray-900 border-b border-white/60"}
                          >
                            <td className="px-3 py-1.5 font-bold text-gray-900 text-xs sm:text-[13px] leading-tight text-left">
                              {formatBetRunner(bet)}
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold text-gray-900 text-xs sm:text-[13px]">
                              <div>{bet.price || bet.odds || "--"}</div>
                              {bet.effectiveOdds && bet.effectiveOdds !== (bet.price || bet.odds) && (
                                <span className="block text-[10px] text-emerald-700 font-semibold" title={`Effective rate: ${bet.effectiveOdds}`}>
                                  (Eff: {bet.effectiveOdds})
                                </span>
                              )}
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

          {/* ══════════ MATCHED BETS TABLE ══════════ */}
          <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
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
                className="bg-[#009866] hover:bg-[#008257] active:scale-95 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded shadow-xs transition-all cursor-pointer"
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
                        <td colSpan={5} className="p-3 text-center text-xs text-gray-400 font-medium">
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
                                    className={`text-[9px] font-black px-1 py-0.2 rounded uppercase ${
                                      isBetWon ? "bg-emerald-700 text-white" : "bg-red-700 text-white"
                                    }`}
                                  >
                                    {isBetWon ? "WON" : "LOST"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold text-gray-900 text-xs sm:text-[13px]">
                              <div>{bet.price || bet.odds || "--"}</div>
                              {bet.effectiveOdds && bet.effectiveOdds !== (bet.price || bet.odds) && (
                                <span className="block text-[10px] text-emerald-700 font-semibold" title={`Effective rate: ${bet.effectiveOdds}`}>
                                  (Eff: {bet.effectiveOdds})
                                </span>
                              )}
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
                          return (
                            <tr
                              key={bet.id || idx}
                              className={isBack ? "bg-blue-50/40 hover:bg-blue-50/70" : "bg-red-50/40 hover:bg-red-50/70"}
                            >
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {formatBetRunner(bet)}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-gray-100 text-gray-700 border border-gray-200">
                                  {bet.marketType || "Match Odds"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isBack ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
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
                                ₹{Number(bet.parentStake != null ? bet.parentStake : (bet.size || 0) * ((bet.sharePercent || 10) / 100)).toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {bet.better || bet.userId}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-800">
                                {bet.master || "Direct"}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">
                                {bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
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
