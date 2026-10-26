import { useState, useEffect, useMemo, useCallback } from "react";
import { Info, Tv, Clock, Trophy, Users, ShieldCheck, ChevronDown, CheckCircle2, Lock, X, Volume2, ArrowLeft } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";

export default function MatchDetail({ matchId, onSelectOutcome }) {
  const { cricketMatches, socket, goToHome } = useDashboard();
  const [exposureData, setExposureData] = useState(null);
  const [tossExposure, setTossExposure] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [prevOdds, setPrevOdds] = useState({});
  const [flash, setFlash] = useState({});
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" or "Toss"
  const [bottomTab, setBottomTab] = useState("scorecard"); // "tv" or "scorecard"
  const [remainingTime, setRemainingTime] = useState("");
  const [keepDisplayOn, setKeepDisplayOn] = useState(false);

  // Feature 1 & 2 State: Live Matched Bets & Dynamic Exposure
  const [betsData, setBetsData] = useState({
    matchedBets: [],
    openBets: [],
    exposure: {},
    userExposure: {},
    adminExposure: {}
  });
  const [isFullBetListOpen, setIsFullBetListOpen] = useState(false);
  const [betListFilter, setBetListFilter] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("user_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        setUserRole(session.role);
      } catch (e) {}
    }
  }, []);

  const isAdmin = ['superadmin', 'admin', 'master', 'supermaster'].includes(userRole);

  // Fetch real-time match bets & runner profit/loss exposure for all users (Features 1 & 2)
  const fetchBetsAndExposure = async () => {
    if (!matchId) return;
    try {
      const raw = localStorage.getItem("user_session");
      const token = raw ? JSON.parse(raw).token : '';
      const res = await fetch(`${getApiUrl()}/api/matches/${matchId}/bets`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBetsData(data);
      }
    } catch (err) {
      // Gracefully silent on transient polling disconnects
    }
  };

  useEffect(() => {
    fetchBetsAndExposure();
    const interval = setInterval(fetchBetsAndExposure, 4000);
    const handleRefresh = () => fetchBetsAndExposure();

    window.addEventListener('bet-placed', handleRefresh);
    window.addEventListener('wallet-updated', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bet-placed', handleRefresh);
      window.removeEventListener('wallet-updated', handleRefresh);
    };
  }, [matchId]);

  // Admin exposure fallback
  useEffect(() => {
    const fetchAdminExposure = async () => {
      if (!isAdmin || !matchId) return;
      
      const raw = localStorage.getItem("user_session");
      if (!raw) return;
      const token = JSON.parse(raw).token;

      try {
        const [matchRes, tossRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/admin/match-exposure/${matchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${getApiUrl()}/api/admin/toss-exposure/${matchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (matchRes.ok) {
          const data = await matchRes.json();
          setExposureData(data);
        }
        if (tossRes.ok) {
          const tossData = await tossRes.json();
          setTossExposure(tossData.exposure);
        }
      } catch (err) {
        console.error("Failed to fetch admin exposure:", err);
      }
    };

    fetchAdminExposure();
    const interval = setInterval(fetchAdminExposure, 10000);
    return () => clearInterval(interval);
  }, [matchId, isAdmin]);

  // Helper to retrieve exposure for any runner (Feature 1)
  const getRunnerExposure = (runnerName) => {
    if (!runnerName) return 0;
    const norm = runnerName.trim().toLowerCase();

    // For admin / hierarchy viewers, prioritize admin parent share exposure
    if (isAdmin) {
      const sources = [betsData?.adminExposure, betsData?.exposure, exposureData?.exposure];
      for (const src of sources) {
        if (!src) continue;
        if (src[runnerName] !== undefined && src[runnerName] !== 0) return src[runnerName];
        for (const [k, v] of Object.entries(src)) {
          if (k.trim().toLowerCase() === norm && v !== 0) return v;
        }
      }
      return 0;
    }

    // For regular bettor accounts:
    if (betsData?.userExposure) {
      if (betsData.userExposure[runnerName] !== undefined && betsData.userExposure[runnerName] !== 0) {
        return betsData.userExposure[runnerName];
      }
      for (const [k, v] of Object.entries(betsData.userExposure)) {
        if (k.trim().toLowerCase() === norm && v !== 0) return v;
      }
    }

    if (betsData?.exposure) {
      if (betsData.exposure[runnerName] !== undefined && betsData.exposure[runnerName] !== 0) {
        return betsData.exposure[runnerName];
      }
      for (const [k, v] of Object.entries(betsData.exposure)) {
        if (k.trim().toLowerCase() === norm && v !== 0) return v;
      }
    }

    return 0;
  };

  // Helper to render formatted green/red Profit/Loss under team name (Feature 1, Image 1)
  const renderRunnerExposure = (runnerName) => {
    const exp = getRunnerExposure(runnerName);
    if (exp === 0 || exp === undefined || isNaN(exp)) return null;

    const isNegative = exp < 0;
    const formatted = Math.abs(Math.round(exp)).toLocaleString();

    return (
      <div className={`text-[12px] font-black mt-0.5 tracking-tight ${isNegative ? 'text-[#dc2626]' : 'text-[#009866]'}`}>
        {isNegative ? `-${formatted}` : formatted}
      </div>
    );
  };

  // Helper to render formatted Fancy market Profit/Loss exposure
  const renderFancyExposure = (marketName) => {
    if (!marketName) return null;
    const norm = marketName.trim().toLowerCase();

    // Check if there's dual yes/no exposure (live match)
    const getExposureVal = (subKey) => {
      const target = `${norm}_${subKey}`;
      const sources = [betsData?.exposure, betsData?.userExposure, exposureData?.exposure];
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
              {yesVal >= 0 ? Math.round(yesVal).toLocaleString() : `-${Math.abs(Math.round(yesVal)).toLocaleString()}`}
            </span>
            <span className="text-gray-400">/</span>
            <span className={noVal >= 0 ? "text-[#009866]" : "text-[#dc2626]"}>
              {noVal >= 0 ? Math.round(noVal).toLocaleString() : `-${Math.abs(Math.round(noVal)).toLocaleString()}`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">Full Book</span>
        </div>
      );
    }

    // Check single exposure (e.g. non-live advance stake exposure)
    const singleExp = getRunnerExposure(marketName);
    if (singleExp !== 0 && singleExp !== null && singleExp !== undefined) {
      const isNeg = singleExp < 0;
      return (
        <div className="flex flex-col">
          <div className={`text-[12px] font-black mt-0.5 ${isNeg ? "text-[#dc2626]" : "text-[#009866]"}`}>
            {isNeg ? `-${Math.abs(Math.round(singleExp)).toLocaleString()}` : Math.round(singleExp).toLocaleString()}
          </div>
          <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">Full Book</span>
        </div>
      );
    }

    // No real bet placed on this fancy market -> Render nothing (never show dummy amounts)
    return null;
  };

  // Helper to render formatted Figure market Profit/Loss exposure on each digit
  const renderDigitExposure = (marketName, digit) => {
    const keys = [
      `${marketName} - Digit ${digit}`,
      `${marketName}_${digit}`,
      `digit_${digit}`
    ];
    let exp = 0;
    for (const k of keys) {
      const val = getRunnerExposure(k);
      if (val !== 0 && val !== undefined && !isNaN(val)) {
        exp = val;
        break;
      }
    }
    if (exp === 0 || exp === undefined || isNaN(exp)) return null;
    const isNegative = exp < 0;
    const formatted = Math.abs(Math.round(exp)).toLocaleString();
    return (
      <div className={`text-[10px] font-black py-0.5 border-t border-gray-200 text-center leading-none tracking-tight ${isNegative ? 'text-[#dc2626] bg-[#fbe2e8]/40' : 'text-[#009866] bg-[#dcecfd]/40'}`}>
        {isNegative ? `-${formatted}` : `+${formatted}`}
      </div>
    );
  };

  const [fetchedMatch, setFetchedMatch] = useState(null);

  useEffect(() => {
    if (!matchId) return;
    let isMounted = true;
    const loadMatch = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/matches/${matchId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setFetchedMatch(prev => ({
            ...(prev || {}),
            ...data,
            score: { ...(prev?.score || {}), ...(data.score || {}) }
          }));
        }
      } catch (err) {}
    };
    loadMatch();
    const interval = setInterval(loadMatch, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [matchId]);

  // Real-time WebSocket listeners for instant live market updates (Fancy, Figure, Even-Odd, Tied Match, Live Score)
  useEffect(() => {
    if (!socket || !matchId) return;

    const isSameMatch = (incomingId, currentId) => {
      if (!incomingId || !currentId) return false;
      const a = String(incomingId).trim();
      const b = String(currentId).trim();
      return a === b || a.replace(/^id/, '') === b.replace(/^id/, '');
    };

    const handleFancyUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          fancyMarkets: data.fancyMarkets
        }));
      }
    };

    const handleFigureUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          figureMarkets: data.figureMarkets
        }));
      }
    };

    const handleEvenOddUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          evenOddMarkets: data.evenOddMarkets
        }));
      }
    };

    const handleTiedMatchUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          tiedMatchMarket: data.tiedMatchMarket
        }));
      }
    };

    const handleLiveScore = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          status: data.status || prev?.status || 'live',
          score: {
            ...(prev?.score || {}),
            teamA_runs: data.teamA_runs ?? prev?.score?.teamA_runs,
            teamB_runs: data.teamB_runs ?? prev?.score?.teamB_runs,
            teamA_wickets: data.teamA_wickets ?? prev?.score?.teamA_wickets,
            teamB_wickets: data.teamB_wickets ?? prev?.score?.teamB_wickets,
            overs: data.overs ?? prev?.score?.overs,
            wickets: data.wickets ?? prev?.score?.wickets,
            target: data.target ?? prev?.score?.target,
            runRate: data.runRate ?? prev?.score?.runRate,
            reqRunRate: data.reqRunRate ?? prev?.score?.reqRunRate,
            thisOver: data.thisOver ?? prev?.score?.thisOver,
            remRuns: data.remRuns ?? prev?.score?.remRuns,
            remBalls: data.remBalls ?? prev?.score?.remBalls,
            battingTeam: data.battingTeam ?? prev?.score?.battingTeam,
            battingTeamName: data.battingTeamName ?? prev?.score?.battingTeamName,
            bowlingTeamName: data.bowlingTeamName ?? prev?.score?.bowlingTeamName,
            statusText: data.statusText ?? prev?.score?.statusText,
            batsmen: data.batsmen ?? prev?.score?.batsmen,
            bowler: data.bowler ?? prev?.score?.bowler,
            lastBall: data.lastBall ?? prev?.score?.lastBall,
            periods: data.periods ?? prev?.score?.periods,
            lastUpdated: new Date()
          }
        }));
      }
    };

    const handleMatchUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          ...data,
          status: data.status,
          winner: data.winner,
          isCompleted: data.status === 'completed' || Boolean(data.winner)
        }));
        fetchBetsAndExposure();
      }
    };

    const handleMatchSettled = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          status: 'completed',
          winner: data.winner,
          isCompleted: true
        }));
        fetchBetsAndExposure();
      }
    };

    const handleTossUpdate = (data) => {
      if (isSameMatch(data.matchId, matchId)) {
        setFetchedMatch(prev => ({
          ...(prev || {}),
          tossMarketStatus: data.tossMarketStatus !== undefined ? data.tossMarketStatus : prev?.tossMarketStatus,
          tossWinner: data.tossWinner !== undefined ? data.tossWinner : prev?.tossWinner,
          tossBackA: data.tossBackA !== undefined ? data.tossBackA : prev?.tossBackA,
          tossLayA: data.tossLayA !== undefined ? data.tossLayA : prev?.tossLayA,
          tossBackB: data.tossBackB !== undefined ? data.tossBackB : prev?.tossBackB,
          tossLayB: data.tossLayB !== undefined ? data.tossLayB : prev?.tossLayB,
          tossDepthBackA: data.tossDepthBackA !== undefined ? data.tossDepthBackA : prev?.tossDepthBackA,
          tossDepthLayA: data.tossDepthLayA !== undefined ? data.tossDepthLayA : prev?.tossDepthLayA,
          tossDepthBackB: data.tossDepthBackB !== undefined ? data.tossDepthBackB : prev?.tossDepthBackB,
          tossDepthLayB: data.tossDepthLayB !== undefined ? data.tossDepthLayB : prev?.tossDepthLayB,
        }));
      }
    };

    socket.on('fancy_market_update', handleFancyUpdate);
    socket.on('figure_market_update', handleFigureUpdate);
    socket.on('even_odd_market_update', handleEvenOddUpdate);
    socket.on('tied_match_market_update', handleTiedMatchUpdate);
    socket.on('live_score_update', handleLiveScore);
    socket.on('match_updated', handleMatchUpdate);
    socket.on('match_settled', handleMatchSettled);
    socket.on('toss_odds_update', handleTossUpdate);

    return () => {
      socket.off('fancy_market_update', handleFancyUpdate);
      socket.off('figure_market_update', handleFigureUpdate);
      socket.off('even_odd_market_update', handleEvenOddUpdate);
      socket.off('tied_match_market_update', handleTiedMatchUpdate);
      socket.off('live_score_update', handleLiveScore);
      socket.off('match_updated', handleMatchUpdate);
      socket.off('match_settled', handleMatchSettled);
      socket.off('toss_odds_update', handleTossUpdate);
    };
  }, [socket, matchId]);

  const rawMatch = cricketMatches?.find(m => String(m.matchId) === String(matchId));
  const actualMatch = {
    ...(rawMatch || {}),
    ...(fetchedMatch || {}),
    fancyMarkets: fetchedMatch?.fancyMarkets ?? rawMatch?.fancyMarkets ?? [],
    figureMarkets: fetchedMatch?.figureMarkets ?? rawMatch?.figureMarkets ?? [],
    evenOddMarkets: fetchedMatch?.evenOddMarkets ?? rawMatch?.evenOddMarkets ?? [],
    tiedMatchMarket: fetchedMatch?.tiedMatchMarket ?? rawMatch?.tiedMatchMarket ?? null,
    score: { ...(rawMatch?.score || {}), ...(fetchedMatch?.score || {}) }
  };

  const isCompleted = Boolean(
    actualMatch &&
    actualMatch.status !== 'live' && // A live match is NEVER completed, even if winner has a stale value
    (actualMatch.isCompleted === true ||
      actualMatch.status === 'completed' ||
      actualMatch.status === 'resulted' ||
      Boolean(actualMatch.winner))
  );
  const winner = actualMatch?.winner || null;

  const isRunnerWinner = (runnerName) => {
    if (!isCompleted || !winner || !runnerName) return false;
    const cleanR = runnerName.replace(/\s+bm$/i, '').trim().toLowerCase();
    const cleanW = String(winner).replace(/\s+bm$/i, '').trim().toLowerCase();
    return cleanR === cleanW || cleanR.includes(cleanW) || cleanW.includes(cleanR);
  };

  const startTimeObj = actualMatch ? new Date(actualMatch.startTime) : new Date();
  const formattedDate = actualMatch ? startTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";
  const formattedTime = actualMatch ? startTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase() : "";

  // Today check for odds visibility
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const isToday = actualMatch ? (startTimeObj >= todayStart && startTimeObj < todayEnd) : false;
  const isLive = Boolean(actualMatch && (actualMatch.status === 'live' || actualMatch.inplay === true)) && !isCompleted;
  // In-play markets (Fancy-2, Figure, Even-Odd, Others/Tied) strictly show when match is LIVE
  const showLiveMarkets = isLive;

  const showOdds = !isCompleted && (isLive || isToday || (actualMatch && actualMatch.backOddsA));

  const availableTabs = [
    'ALL',
    'Bookmaker',
    'Toss',
    'Score Card',
    'Figure',
    'Fancy-2',
    'Even-Odd',
    'Others'
  ];

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('ALL');
    }
  }, [availableTabs, activeTab]);

  // Live countdown timer matching screenshot
  useEffect(() => {
    if (!actualMatch?.startTime) return;
    const calculateRemaining = () => {
      const diff = new Date(actualMatch.startTime) - new Date();
      if (diff <= 0) {
        setRemainingTime(actualMatch.status === 'live' ? "In Play" : "00:00:00");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      setRemainingTime(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };
    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [actualMatch?.startTime, actualMatch?.status]);

  // Relative schedule string e.g. "in a day | Sep 27 3:00 pm | Winners: 1"
  let relativeSchedule = "";
  if (actualMatch?.status === 'live') {
    relativeSchedule = "LIVE NOW";
  } else if (actualMatch?.startTime) {
    const diffHours = (new Date(actualMatch.startTime) - new Date()) / (1000 * 60 * 60);
    if (diffHours <= 0) {
      relativeSchedule = "Started";
    } else if (diffHours < 24) {
      relativeSchedule = "Today";
    } else if (diffHours >= 24 && diffHours < 48) {
      relativeSchedule = "in a day";
    } else {
      relativeSchedule = `in ${Math.floor(diffHours / 24)} days`;
    }
  }

  const elapsedFormatted = useMemo(() => {
    if (!actualMatch?.startTime) return "00:00:00";
    try {
      const start = new Date(actualMatch.startTime).getTime();
      const end = actualMatch?.lastUpdated ? new Date(actualMatch.lastUpdated).getTime() : Date.now();
      const diffSec = Math.max(0, Math.floor((end - start) / 1000));
      const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      return `${hours}:${mins}:${secs}`;
    } catch {
      return "00:00:00";
    }
  }, [actualMatch?.startTime, actualMatch?.lastUpdated]);

  useEffect(() => {
    if (actualMatch) {
      const currentOdds = {
        backA: actualMatch.backOddsA,
        layA: actualMatch.layOddsA,
        backB: actualMatch.backOddsB,
        layB: actualMatch.layOddsB,
      };

      const newFlash = {};
      Object.keys(currentOdds).forEach(key => {
        if (prevOdds[key] !== undefined) {
           newFlash[key] = true;
        }
      });

      if (Object.keys(newFlash).length > 0) {
        setFlash(prev => ({ ...prev, ...newFlash }));
        setTimeout(() => setFlash({}), 300);
      }
      setPrevOdds(currentOdds);
    }
  }, [actualMatch?.lastUpdated || "", actualMatch?.backOddsA, actualMatch?.backOddsB, actualMatch?.layOddsA, actualMatch?.layOddsB]);

  const handleDeclareTossWinner = async (winner) => {
    if (!window.confirm(`Declare "${winner}" as Toss Winner? This will immediately settle all toss bets.`)) return;
    try {
      const raw = localStorage.getItem("user_session");
      const token = raw ? JSON.parse(raw).token : '';
      const res = await fetch(`${getApiUrl()}/api/admin/declare-toss-winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ matchId: actualMatch.matchId, tossWinner: winner })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert(`Toss winner declared: ${winner}`);
      } else {
        alert(resData.error || "Failed to declare toss winner");
      }
    } catch (e) {
      alert("Error declaring toss winner");
    }
  };

  if (!actualMatch) return <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Match Data...</div>;

  const matchName = `${actualMatch.teamA} v ${actualMatch.teamB}`;

  const runners = [
    { 
      name: actualMatch.teamA, 
      back: showOdds ? (actualMatch.backOddsA || "-") : "-", 
      backVol: showOdds ? (actualMatch.depthBackA || "0") : "0", 
      lay: showOdds ? (actualMatch.layOddsA || "-") : "-", 
      layVol: showOdds ? (actualMatch.depthLayA || "0") : "0",
      flash: { back: flash.backA, lay: flash.layA }
    },
    { 
      name: actualMatch.teamB, 
      back: showOdds ? (actualMatch.backOddsB || "-") : "-", 
      backVol: showOdds ? (actualMatch.depthBackB || "0") : "0", 
      lay: showOdds ? (actualMatch.layOddsB || "-") : "-", 
      layVol: showOdds ? (actualMatch.depthLayB || "0") : "0",
      flash: { back: flash.backB, lay: flash.layB }
    }
  ];

  // Real cricket logic: if match is live, completed, or toss settled, Toss is closed
  const isMatchLive = actualMatch.status === 'live' || (actualMatch.startTime && new Date() >= new Date(actualMatch.startTime));
  const isTossClosed = isCompleted || isMatchLive || actualMatch.tossMarketStatus === 'CLOSED' || Boolean(actualMatch.tossWinner);

  const tossRunners = [
    {
      name: `${actualMatch.teamA} To Win The Toss`,
      team: actualMatch.teamA,
      back: isTossClosed ? "-" : (actualMatch.tossBackA || 1.98),
      backVol: isTossClosed ? "0" : (actualMatch.tossDepthBackA || "100"),
      lay: isTossClosed ? "-" : (actualMatch.tossLayA || 2.02),
      layVol: isTossClosed ? "0" : (actualMatch.tossDepthLayA || "100")
    },
    {
      name: `${actualMatch.teamB} To Win The Toss`,
      team: actualMatch.teamB,
      back: isTossClosed ? "-" : (actualMatch.tossBackB || 1.98),
      backVol: isTossClosed ? "0" : (actualMatch.tossDepthBackB || "100"),
      lay: isTossClosed ? "-" : (actualMatch.tossLayB || 2.02),
      layVol: isTossClosed ? "0" : (actualMatch.tossDepthLayB || "100")
    }
  ];

  // Calculate dynamic Bookmaker odds (exact BPExch presentation)
  const bmBackOddsA = actualMatch.bookmakerBackA || (showOdds ? actualMatch.backOddsA : null);
  const bmLayOddsA = actualMatch.bookmakerLayA || (showOdds && actualMatch.layOddsA ? Number((actualMatch.layOddsA > (actualMatch.backOddsA || 0) ? actualMatch.layOddsA + 0.01 : (actualMatch.backOddsA || 0) + 0.02).toFixed(2)) : null);
  const bmBackOddsB = actualMatch.bookmakerBackB || (showOdds && actualMatch.backOddsB ? Number((actualMatch.backOddsB >= 2 ? actualMatch.backOddsB - 0.02 : actualMatch.backOddsB).toFixed(2)) : null);
  const bmLayOddsB = actualMatch.bookmakerLayB || (showOdds && actualMatch.layOddsB ? Number((actualMatch.layOddsB >= 2 ? actualMatch.layOddsB + 0.02 : actualMatch.layOddsB + 0.02).toFixed(2)) : null);

  const isBookmakerSuspended = actualMatch.bookmakerMarketStatus === 'SUSPENDED' || (actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN') || (!bmBackOddsA && !bmBackOddsB);

  const bookmakerRunners = [
    {
      name: actualMatch.teamA,
      back: bmBackOddsA || "-",
      backVol: actualMatch.bookmakerDepthBackA || "100",
      lay: bmLayOddsA || "-",
      layVol: actualMatch.bookmakerDepthLayA || "100",
      flash: { back: flash.backA, lay: flash.layA }
    },
    {
      name: actualMatch.teamB,
      back: bmBackOddsB || "-",
      backVol: actualMatch.bookmakerDepthBackB || "100",
      lay: bmLayOddsB || "-",
      layVol: actualMatch.bookmakerDepthLayB || "100",
      flash: { back: flash.backB, lay: flash.layB }
    }
  ];

  return (
    <div className="flex flex-col bg-[#eaedf1] h-full pb-6 lg:pb-0 font-sans">

      {/* 1. BPEXCH-STYLE HEADER SECTION */}
      <div className="order-1 shrink-0 bg-[#243f55] m-2 rounded-sm overflow-hidden shadow-md">
        {/* Top In-App Back Navigation */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/10 bg-[#1d3548]">
          <button
            onClick={goToHome}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white hover:text-[#00c766] rounded text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Back to All Matches"
          >
            <ArrowLeft size={14} />
            <span>Back to Matches</span>
          </button>
          <div className="text-[11px] font-bold text-gray-300 tracking-wide uppercase">
            Cricket Exchange
          </div>
        </div>

        <div className="flex items-start justify-between px-4 pt-3 pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] text-[#00c766] font-black uppercase tracking-wider">
              <Clock size={12} strokeWidth={3} className="text-[#00c766]" />
              <span>{relativeSchedule ? `${relativeSchedule} | ` : ""}{formattedDate} {formattedTime} | Winners: 1</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              {matchName}
            </h1>
            <div className="text-[12px] font-bold text-white tracking-wide">
              Remaining : <span className="font-mono">{remainingTime || "00:00:00"}</span>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-gray-300 font-bold cursor-pointer select-none mt-0.5">
              <input 
                type="checkbox" 
                checked={keepDisplayOn} 
                onChange={(e) => setKeepDisplayOn(e.target.checked)} 
                className="w-3.5 h-3.5 accent-[#00c766] rounded-sm"
              />
              <span>Keep Display On</span>
            </label>
          </div>

          <div className="flex flex-col items-end pt-1">
            <span className="text-[#00c766] font-black text-2xl tracking-tighter uppercase">
              {actualMatch.status === 'completed' ? 'CLOSED' : 'OPEN'}
            </span>
          </div>
        </div>

        {/* BPEXCH ALL / BOOKMAKER / FANCY-2 / FIGURE / EVEN-ODD / OTHERS TABS */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1b3447] border-t border-white/5 overflow-x-auto no-scrollbar">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-[4px] text-[12px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === tab
                  ? 'bg-black text-white shadow-md'
                  : 'bg-[#00a86b] hover:bg-[#00935d] text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* BPEXCH LIVE SCORE & BALL CHALOO STRIP */}
        {showLiveMarkets && (() => {
          const sc = actualMatch?.score || {};
          const isTeamBBatting = sc.battingTeam === 'teamB' || (Number(sc.target) > 0 && !sc.battingTeam);
          const activeTeamName = isTeamBBatting ? (actualMatch.teamB || 'Team B') : (actualMatch.teamA || 'Team A');
          const teamCode = activeTeamName ? (activeTeamName.length <= 4 ? activeTeamName.toUpperCase() : activeTeamName.slice(0, 3).toUpperCase()) : 'BAT';
          const activeRunsStr = isTeamBBatting ? (sc.teamB_runs || '0') : (sc.teamA_runs || '0');
          let runs = '0';
          let wickets = isTeamBBatting ? (sc.teamB_wickets ?? sc.wickets ?? '0') : (sc.teamA_wickets ?? sc.wickets ?? '0');
          if (activeRunsStr) {
            const parts = String(activeRunsStr).split(/[\/-]/);
            runs = parts[0] || '0';
            if (parts[1] !== undefined && parts[1] !== '') wickets = parts[1];
          }
          const overs = sc.overs || '0.0';
          const crr = sc.runRate || sc.crr || '0.00';
          const rrr = sc.reqRunRate || '0.00';
          const target = sc.target || 0;
          const remRuns = sc.remRuns || (target > 0 ? Math.max(0, target - Number(runs)) : 0);
          const remBalls = sc.remBalls || 0;
          const thisOverList = Array.isArray(sc.thisOver) && sc.thisOver.length > 0 ? sc.thisOver : ['0', '1', '0', '1'];
          const thisOverStr = thisOverList.join(' ');

          return (
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#0e1f2c] border-t border-white/10 text-white">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-black text-sm text-white tracking-wide">
                    {teamCode} {runs}/{wickets} ({overs})
                  </span>
                  <span className="text-[11px] font-bold text-gray-300">
                    CRR: <span className="text-[#00e676] font-extrabold">{crr}</span>
                  </span>
                  {Number(target) > 0 && (
                    <span className="text-[11px] font-bold text-gray-300">
                      Target: <span className="text-sky-400 font-extrabold">{target}</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-semibold text-gray-300 flex items-center gap-3 flex-wrap">
                  <span>This Over : <span className="font-mono text-white font-bold">{thisOverStr}</span></span>
                  {Number(remBalls) > 0 && Number(remRuns) > 0 && (
                    <span className="text-emerald-300 font-bold">{remRuns} of {remBalls} balls</span>
                  )}
                  {Number(rrr) > 0 && (
                    <span className="text-amber-400 font-extrabold">RRR: {rrr}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#00e676]">
                <span className="tracking-widest">SINGLE</span>
                <Volume2 size={16} className="text-[#00e676]" />
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2. MATCH ODDS MARKET SECTION */}
      {(activeTab === 'ALL' || activeTab === 'Match Odds') && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            {/* Market Header Tab */}
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 ${isCompleted ? 'bg-purple-600' : 'bg-[#00c766] animate-pulse'} rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-white">
                      <span>{matchName} - Match Odds</span>
                      <span className="text-pink-300 font-extrabold">SUSPENDED</span>
                      <Lock size={13} className="text-white inline" />
                    </span>
                  ) : (
                    <>
                      MATCH ODDS <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 5M)</span>
                      <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                    </>
                  )}
                </span>
              </div>
              {!isCompleted ? (
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              ) : (
                <div className="text-[11px] font-black tracking-widest uppercase text-emerald-200">
                  CLOSED
                </div>
              )}
            </div>

            {/* Completed Match Subheader matching bpexch.org */}
            {isCompleted && (
              <div className="bg-[#f0f2f5] text-[#333333] text-[12px] font-bold px-3 py-1.5 flex items-center justify-between border-b border-gray-200">
                <span>{formattedDate} {formattedTime}</span>
                <span>Elapsed: {elapsedFormatted}</span>
              </div>
            )}

            {/* Runners List with Feature 1: Profit/Loss in Green/Red under each Team */}
            <div className="relative flex flex-col">
              {actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN' && !isCompleted && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                    MARKET SUSPENDED
                  </div>
                </div>
              )}
              {runners.map((runner, ridx) => {
                const isWinner = isRunnerWinner(runner.name);
                return (
                  <div 
                    key={ridx} 
                    className={`flex items-stretch border-b border-gray-100 last:border-0 transition-colors ${
                      isWinner ? 'bg-[#bef264]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex-1 flex flex-col justify-center px-3 py-2.5 ${isWinner ? 'bg-[#bef264]' : ''}`}>
                      <div className="font-bold text-[#1c3246] text-[13px] leading-tight flex items-center gap-1.5">
                        <span>{runner.name}</span>
                      </div>
                      {/* Feature 1: Accurate Profit/Loss in green/red directly under team name */}
                      {renderRunnerExposure(runner.name)}
                    </div>
                    {isCompleted ? (
                      <div className="flex w-32 shrink-0">
                        {/* Completed match: empty pastel boxes matching bpexch.org */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#dcecfd] border-r border-white/40">
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#fbe2e8]">
                        </div>
                      </div>
                    ) : (
                      <div className="flex w-32 shrink-0">
                        <button
                          disabled={(actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN') || runner.back === '-'}
                          onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live', 'match_odds')}
                          className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all border-r border-white/40 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${runner.flash?.back ? 'bg-[#5d99d6]' : 'bg-[#bbd9f9] hover:bg-[#a5d3f8]'}`}
                        >
                          <span className={`text-[15px] font-black leading-none z-10 transition-colors ${runner.flash?.back ? 'text-white' : 'text-[#1c3246]'}`}>{runner.back}</span>
                          <span className={`text-[9px] font-bold mt-1 z-10 transition-colors ${runner.flash?.back ? 'text-white/80' : 'text-gray-500'}`}>{runner.backVol}</span>
                        </button>
                        <button
                          disabled={(actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN') || runner.lay === '-'}
                          onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live', 'match_odds')}
                          className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${runner.flash?.lay ? 'bg-[#d65d7a]' : 'bg-[#f8c9d4] hover:bg-[#f9b6c6]'}`}
                        >
                          <span className={`text-[15px] font-black leading-none z-10 transition-colors ${runner.flash?.lay ? 'text-white' : 'text-[#1c3246]'}`}>{runner.lay}</span>
                          <span className={`text-[9px] font-bold mt-1 z-10 transition-colors ${runner.flash?.lay ? 'text-white/80' : 'text-gray-500'}`}>{runner.layVol}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2.5. BOOKMAKER MARKET SECTION (Image 1 BPExch representation) */}
      {(activeTab === 'ALL' || activeTab === 'Bookmaker') && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            {/* Header */}
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 ${isCompleted ? 'bg-purple-600' : 'bg-[#00c766] animate-pulse'} rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-white">
                      <span>{matchName} - Bookmaker</span>
                      <span className="text-pink-300 font-extrabold">SUSPENDED</span>
                      <Lock size={13} className="text-white inline" />
                    </span>
                  ) : (
                    <>
                      BOOKMAKER <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 1M)</span>
                      <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                    </>
                  )}
                </span>
              </div>
              {!isCompleted ? (
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              ) : (
                <div className="text-[11px] font-black tracking-widest uppercase text-emerald-200">
                  CLOSED
                </div>
              )}
            </div>

            {/* Completed Match Subheader matching bpexch.org */}
            {isCompleted && (
              <div className="bg-[#f0f2f5] text-[#333333] text-[12px] font-bold px-3 py-1.5 flex items-center justify-between border-b border-gray-200">
                <span>{formattedDate} {formattedTime}</span>
                <span>Elapsed: {elapsedFormatted}</span>
              </div>
            )}

            {/* Runners List */}
            <div className="relative flex flex-col">
              {isBookmakerSuspended && !isCompleted && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                    MARKET SUSPENDED
                  </div>
                </div>
              )}
              {bookmakerRunners.map((runner, bidx) => {
                const isWinner = isRunnerWinner(runner.name);
                return (
                  <div 
                    key={bidx} 
                    className={`flex items-stretch border-b border-gray-100 last:border-0 transition-colors ${
                      isWinner ? 'bg-[#bef264]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex-1 flex flex-col justify-center px-3 py-2.5 ${isWinner ? 'bg-[#bef264]' : ''}`}>
                      <div className="font-bold text-[#1c3246] text-[13px] leading-tight flex items-center gap-1.5">
                        <span>{runner.name}</span>
                      </div>
                      {renderRunnerExposure(`${runner.name}_bm`)}
                    </div>
                    {isCompleted ? (
                      <div className="flex w-32 shrink-0">
                        {/* Completed match: empty pastel boxes matching bpexch.org */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#dcecfd] border-r border-white/40">
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#fbe2e8]">
                        </div>
                      </div>
                    ) : (
                      <div className="flex w-32 shrink-0">
                        <button
                          disabled={isBookmakerSuspended || runner.back === '-'}
                          onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live', 'bookmaker')}
                          className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all border-r border-white/40 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${runner.flash?.back ? 'bg-[#5d99d6]' : 'bg-[#bbd9f9] hover:bg-[#a5d3f8]'}`}
                        >
                          <span className={`text-[15px] font-black leading-none z-10 transition-colors ${runner.flash?.back ? 'text-white' : 'text-[#1c3246]'}`}>{runner.back}</span>
                          <span className={`text-[9px] font-bold mt-1 z-10 transition-colors ${runner.flash?.back ? 'text-white/80' : 'text-gray-500'}`}>{runner.backVol}</span>
                        </button>
                        <button
                          disabled={isBookmakerSuspended || runner.lay === '-'}
                          onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live', 'bookmaker')}
                          className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden ${runner.flash?.lay ? 'bg-[#d65d7a]' : 'bg-[#f8c9d4] hover:bg-[#f9b6c6]'}`}
                        >
                          <span className={`text-[15px] font-black leading-none z-10 transition-colors ${runner.flash?.lay ? 'text-white' : 'text-[#1c3246]'}`}>{runner.lay}</span>
                          <span className={`text-[9px] font-bold mt-1 z-10 transition-colors ${runner.flash?.lay ? 'text-white/80' : 'text-gray-500'}`}>{runner.layVol}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. TOSS MARKET SECTION */}
      {(activeTab === 'ALL' || activeTab === 'Toss') && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 ${isTossClosed ? 'bg-purple-600' : 'bg-[#00c766] animate-pulse'} rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  TOSS MARKET <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                  <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                </span>
              </div>
              {!isTossClosed ? (
                <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                  <div className="w-14 text-center border-b-2 border-[#bbd9f9]">BACK</div>
                  <div className="w-14 text-center border-b-2 border-[#f8c9d4]">LAY</div>
                </div>
              ) : (
                <div className="text-[11px] font-black tracking-widest uppercase text-emerald-200">
                  CLOSED
                </div>
              )}
            </div>

            {/* Admin Quick Declare Toss Winner Bar */}
            {isAdmin && !actualMatch.tossWinner && !isCompleted && (
              <div className="bg-[#243f55] text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200">
                <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-black">
                  <Trophy size={14} /> Admin Declare Toss Winner:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeclareTossWinner(actualMatch.teamA)}
                    className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm cursor-pointer"
                  >
                    {actualMatch.teamA}
                  </button>
                  <button
                    onClick={() => handleDeclareTossWinner(actualMatch.teamB)}
                    className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm cursor-pointer"
                  >
                    {actualMatch.teamB}
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

            {/* Toss Result Banner (if already settled) */}
            {actualMatch.tossWinner ? (
              <div className="bg-[#ecfdf5] border-b border-emerald-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-[#009866]" />
                  <span className="text-xs font-black text-[#065f46] uppercase">
                    Toss Winner: {actualMatch.tossWinner}
                  </span>
                </div>
                <span className="bg-[#009866] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  Settled
                </span>
              </div>
            ) : isTossClosed ? (
              <div className="bg-[#f0f2f5] border-b border-gray-200 px-4 py-2.5 flex items-center justify-between text-[#333333] text-[12px] font-bold">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Lock size={13} className="text-gray-500" />
                  <span>TOSS COMPLETED (Match in-play, betting closed)</span>
                </div>
                <span className="bg-gray-200 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Closed
                </span>
              </div>
            ) : null}

            {!actualMatch.tossWinner && (
              <div className="relative flex flex-col">
                {actualMatch.tossMarketStatus === 'SUSPENDED' && !isTossClosed && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                      TOSS MARKET SUSPENDED
                    </div>
                  </div>
                )}
                {tossRunners.map((runner, ridx) => {
                  const isTossWinner = Boolean(actualMatch.tossWinner && runner.team && actualMatch.tossWinner.toLowerCase().includes(runner.team.toLowerCase()));
                  return (
                    <div 
                      key={ridx} 
                      className={`flex items-stretch border-b border-gray-100 last:border-0 transition-colors ${
                        isTossWinner ? 'bg-[#bef264]' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-1 flex flex-col justify-center px-3 py-2.5 ${isTossWinner ? 'bg-[#bef264]' : ''}`}>
                        <div className="font-bold text-[#1c3246] text-[13px] leading-tight flex items-center gap-1.5">
                          <span>{runner.name}</span>
                          {isTossWinner && (
                            <span className="bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-1">
                              <Trophy size={10} className="text-yellow-300" /> Winner
                            </span>
                          )}
                        </div>
                        {renderRunnerExposure(runner.name)}
                      </div>
                      {isTossClosed ? (
                        <div className="flex w-32 shrink-0">
                          <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#dcecfd] border-r border-white/40">
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center py-2 bg-[#fbe2e8]">
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-32 shrink-0">
                          <button
                            disabled={isTossClosed || runner.back === '-'}
                            onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live', 'toss')}
                            className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all border-r border-white/40 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden bg-[#bbd9f9] hover:bg-[#a5d3f8]"
                          >
                            <span className="text-[15px] font-black leading-none z-10 text-[#1c3246]">{runner.back}</span>
                            <span className="text-[9px] font-bold mt-1 z-10 text-gray-500">{runner.backVol}</span>
                          </button>
                          <button
                            disabled={isTossClosed || runner.lay === '-'}
                            onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live', 'toss')}
                            className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden bg-[#f8c9d4] hover:bg-[#f9b6c6]"
                          >
                            <span className="text-[15px] font-black leading-none z-10 text-[#1c3246]">{runner.lay}</span>
                            <span className="text-[9px] font-bold mt-1 z-10 text-gray-500">{runner.layVol}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS: Bet Lock & User Book (Matching Image 1) */}
      <div className="order-2 px-2 mb-2 flex gap-2">
        <button
          onClick={() => alert("Betting locked for this market")}
          className="flex-1 bg-[#00a884] hover:bg-[#009172] active:scale-98 text-white py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
        >
          <span>Bet Lock</span>
          <ChevronDown size={14} />
        </button>
        <button
          onClick={() => setIsFullBetListOpen(true)}
          className="flex-1 bg-[#00a884] hover:bg-[#009172] active:scale-98 text-white py-2 px-3 rounded-sm flex items-center justify-center text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
        >
          User Book
        </button>
      </div>

      {/* 4. BPEXCH TV & SCORE CARD */}
      {(activeTab === 'ALL' || activeTab === 'Score Card') && (
        <div className="order-2 flex flex-col mb-2">
          {/* TV & Score Card Tab Bar */}
          <div className="px-2 mb-2">
            <div className="grid grid-cols-2 rounded-sm overflow-hidden shadow-sm">
              <button
                onClick={() => setBottomTab('tv')}
                className={`py-2.5 text-center text-[13px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  bottomTab === 'tv'
                    ? 'bg-[#009866] text-white'
                    : 'bg-[#007f55] text-white/80 hover:text-white'
                }`}
              >
                Tv
              </button>
              <button
                onClick={() => setBottomTab('scorecard')}
                className={`py-2.5 text-center text-[13px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  bottomTab === 'scorecard'
                    ? 'bg-[#009866] text-white'
                    : 'bg-[#007f55] text-white/80 hover:text-white'
                }`}
              >
                Score Card
              </button>
            </div>
          </div>

          {/* TV Stream Box or Scorecard View */}
          <div className="px-2">
            {bottomTab === 'tv' ? (
              <div className="aspect-video bg-black flex items-center justify-center text-white font-serif text-2xl italic rounded-sm shadow-sm">
                Match not live
              </div>
            ) : actualMatch?.status === 'completed' ? (
              <div className="animate-in zoom-in duration-500">
                <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-500/30">
                  <div className="px-5 py-8 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white text-center relative overflow-hidden">
                    <div className="flex flex-col items-center mb-4">
                       <div className="bg-yellow-500 text-black text-[10px] font-black px-4 py-1 rounded-full mb-3 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                         MATCH COMPLETED
                       </div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">
                         {actualMatch.winner === 'TIE' ? "MATCH TIED" : (actualMatch.winner === 'VOID' ? "MATCH VOIDED" : `${actualMatch.winner} WON`)}
                       </h2>
                       <div className="w-12 h-1 bg-yellow-500 rounded-full"></div>
                    </div>

                    <div className="flex items-center justify-center gap-10 mb-6">
                      <div className="flex flex-col items-center">
                        <div className={`text-3xl font-black mb-1 ${actualMatch.winner === actualMatch.teamA ? 'text-white' : 'text-gray-600'}`}>{actualMatch.score?.teamA_runs || "0/0"}</div>
                        <div className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">{actualMatch.teamA}</div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-gray-700 font-black text-lg italic opacity-30">VS</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className={`text-3xl font-black mb-1 ${actualMatch.winner === actualMatch.teamB ? 'text-white' : 'text-gray-600'}`}>{actualMatch.score?.teamB_runs || "0/0"}</div>
                        <div className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">{actualMatch.teamB}</div>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 max-w-sm mx-auto">
                      <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                        The match has concluded and all bets have been settled. Winning amounts have been credited to user wallets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : actualMatch?.status === 'live' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#f1f4f8] rounded-sm overflow-hidden shadow-sm border border-gray-200">
                  <div className="px-4 py-3 bg-white text-[#1c3246]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                         <h2 className="text-xl font-black text-[#243f55] uppercase tracking-tight">
                          {actualMatch.teamA} v {actualMatch.teamB} - Match Odds
                         </h2>
                         <span className="text-pink-500 font-black text-sm uppercase italic">InPlay</span>
                         {actualMatch.score?.statusText && (
                           <span className="bg-[#243f55] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                             {actualMatch.score.statusText}
                           </span>
                         )}
                         <div className="w-5 h-5 bg-[#243f55] rounded-sm flex items-center justify-center">
                           <Info size={12} color="white" strokeWidth={3} />
                         </div>
                      </div>
                    </div>

                    {/* Score Line */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      {(() => {
                        const parseTeamScore = (runsStr, teamKey) => {
                          const raw = String(runsStr || '0');
                          let r = '0';
                          let w = null;
                          if (raw.includes('/') || raw.includes('-')) {
                            const parts = raw.split(/[\/-]/);
                            r = parts[0] || '0';
                            w = parts[1];
                          } else {
                            r = raw;
                          }
                          if (w === null || w === undefined || w === '') {
                            if (teamKey === 'teamA') {
                              w = actualMatch.score?.teamA_wickets ?? (actualMatch.score?.battingTeam === 'teamA' ? actualMatch.score?.wickets : 0);
                            } else {
                              w = actualMatch.score?.teamB_wickets ?? (actualMatch.score?.battingTeam === 'teamB' ? actualMatch.score?.wickets : 0);
                            }
                          }
                          return { runs: r, wickets: Number(w) || 0 };
                        };

                        const teamAScore = parseTeamScore(actualMatch.score?.teamA_runs, 'teamA');
                        const teamBScore = parseTeamScore(actualMatch.score?.teamB_runs, 'teamB');

                        return (
                          <div className="flex items-baseline gap-3 flex-wrap">
                              <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{actualMatch.teamA}</span>
                                    {actualMatch.score?.battingTeam === 'teamA' && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#00c766] text-white font-extrabold uppercase animate-pulse">Batting</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                      <span className="text-3xl md:text-4xl font-black text-[#1c3246] tracking-tighter">
                                      {teamAScore.runs}
                                      <span className="text-xl md:text-2xl text-gray-300 mx-0.5">/</span>
                                      {teamAScore.wickets}
                                      </span>
                                  </div>
                              </div>

                              <div className="h-10 w-[1px] bg-gray-200 mx-1 self-center"></div>

                              <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{actualMatch.teamB}</span>
                                    {actualMatch.score?.battingTeam === 'teamB' && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#00c766] text-white font-extrabold uppercase animate-pulse">Batting</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                      <span className="text-3xl md:text-4xl font-black text-[#1c3246] tracking-tighter">
                                      {teamBScore.runs}
                                      <span className="text-xl md:text-2xl text-gray-300 mx-0.5">/</span>
                                      {teamBScore.wickets}
                                      </span>
                                  </div>
                              </div>
                              
                              <div className="h-10 w-[1px] bg-gray-200 mx-1 self-center"></div>

                              <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overs</span>
                                  <span className="text-2xl md:text-3xl font-black text-[#243f55]">
                                     {actualMatch.score?.overs || "0.0"}
                                  </span>
                              </div>
                           </div>
                      );
                    })()}

                       {/* Granular Stats Grid */}
                       <div className="grid grid-cols-3 gap-2 flex-1 max-w-xs">
                          <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                             <span className="text-[9px] font-black text-gray-400 uppercase">CRR</span>
                             <span className="text-[14px] font-black text-green-600">{actualMatch.score?.runRate || "0.00"}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                             <span className="text-[9px] font-black text-gray-400 uppercase">RRR</span>
                             <span className="text-[14px] font-black text-orange-600">{actualMatch.score?.reqRunRate || "0.00"}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                             <span className="text-[9px] font-black text-gray-400 uppercase">Target</span>
                             <span className="text-[14px] font-black text-blue-700">{actualMatch.score?.target || 0}</span>
                          </div>
                       </div>
                    </div>

                    {/* This Over and Remaining Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 pt-3 gap-2">
                       <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-bold text-gray-400">This Over:</span>
                          <div className="flex gap-1.5 flex-wrap">
                             {actualMatch.score?.thisOver && actualMatch.score.thisOver.length > 0 ? (
                               actualMatch.score.thisOver.map((ball, bidx) => (
                                 <span key={bidx} className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-black shadow-xs ${
                                   ball === 'W' ? 'bg-red-500 text-white' : 
                                   ['4', '6'].includes(ball) ? 'bg-emerald-600 text-white' :
                                   ball.includes('Wd') || ball.includes('Nb') ? 'bg-amber-500 text-white' :
                                   ball.includes('Lb') || ball.includes('B') ? 'bg-purple-600 text-white' :
                                   ball === '0' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                                   'bg-[#243f55] text-white'
                                 }`}>
                                   {ball}
                                 </span>
                               ))
                             ) : (
                               <span className="text-[10px] text-gray-300 italic font-medium">Waiting...</span>
                             )}
                          </div>
                       </div>

                       <div className="text-[13px] font-black text-green-700">
                          {actualMatch.score?.remRuns > 0 && actualMatch.score?.remBalls > 0 ? (
                            `Need ${actualMatch.score.remRuns} runs in ${actualMatch.score.remBalls} balls`
                          ) : actualMatch.score?.target > 0 ? (
                            "Target achieved"
                          ) : actualMatch.score?.statusText ? (
                            actualMatch.score.statusText
                          ) : (
                            "1st Innings in progress"
                          )}
                       </div>
                    </div>

                    {/* Last Ball Event Tracker */}
                    {actualMatch.score?.lastBall && (
                      <div className="mt-2.5 px-3 py-1.5 bg-[#f8fafc] border border-gray-200 rounded flex items-center gap-2 text-[11px]">
                        <span className="bg-[#243f55] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Last Ball</span>
                        <span className="font-bold text-[#1e293b] truncate">{actualMatch.score.lastBall}</span>
                      </div>
                    )}

                    {/* Live Batsmen & Bowler In-Play Strip */}
                    {( (actualMatch.score?.batsmen && actualMatch.score.batsmen.length > 0) || actualMatch.score?.bowler ) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {actualMatch.score?.batsmen && actualMatch.score.batsmen.length > 0 && (
                          <div className="bg-[#f8fafc] rounded border border-gray-200 p-2">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>Batter</span>
                              <div className="flex gap-3">
                                <span>R(B)</span>
                                <span>4s/6s</span>
                                <span>SR</span>
                              </div>
                            </div>
                            {actualMatch.score.batsmen.map((b, idx) => (
                              <div key={idx} className="flex justify-between items-center py-0.5 font-bold text-[#1e293b]">
                                <span className="truncate max-w-[140px] flex items-center gap-1">
                                  {b.name} <span className="text-emerald-500 font-extrabold">*</span>
                                </span>
                                <div className="flex gap-3 text-right">
                                  <span className="w-10 text-emerald-600 font-extrabold">{b.runs} ({b.balls})</span>
                                  <span className="w-8 text-gray-500">{b.fours}/{b.sixes}</span>
                                  <span className="w-10 text-gray-700">{b.strikeRate}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {actualMatch.score?.bowler && (
                          <div className="bg-[#f8fafc] rounded border border-gray-200 p-2">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>Bowler</span>
                              <div className="flex gap-3">
                                <span>O-M-R-W</span>
                                <span>Econ</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center py-0.5 font-bold text-[#1e293b]">
                              <span className="truncate max-w-[140px]">{actualMatch.score.bowler.name}</span>
                              <div className="flex gap-3 text-right">
                                <span className="text-gray-700">
                                  {actualMatch.score.bowler.overs}-{actualMatch.score.bowler.maidens}-{actualMatch.score.bowler.runs}-{actualMatch.score.bowler.wickets}
                                </span>
                                <span className="w-10 text-blue-700 font-extrabold">{actualMatch.score.bowler.economy}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Official Period Scores Breakdown */}
                    {actualMatch.score?.periods && Object.keys(actualMatch.score.periods).length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Period Breakdown (Official OddsAPI Scores)</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-gray-200 rounded">
                            <thead className="bg-[#1c3246] text-white text-[10px] uppercase font-bold">
                              <tr>
                                <th className="py-1.5 px-3">Period / Innings</th>
                                <th className="py-1.5 px-3">{actualMatch.teamA}</th>
                                <th className="py-1.5 px-3">{actualMatch.teamB}</th>
                                <th className="py-1.5 px-3 text-right">Updated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                              {Object.entries(actualMatch.score.periods)
                                .sort(([a], [b]) => (a === '0' ? 1 : b === '0' ? -1 : a.localeCompare(b)))
                                .map(([periodKey, pScore]) => (
                                  <tr key={periodKey} className={periodKey === '0' ? 'bg-blue-50/50 font-bold' : ''}>
                                    <td className="py-1.5 px-3">
                                      {periodKey === '0' ? 'Overall Match (Total)' : `Innings ${periodKey} (Period ${periodKey})`}
                                    </td>
                                    <td className="py-1.5 px-3 text-[#1c3246] font-black">{pScore?.participant1Score ?? 0}</td>
                                    <td className="py-1.5 px-3 text-[#1c3246] font-black">{pScore?.participant2Score ?? 0}</td>
                                    <td className="py-1.5 px-3 text-right text-[10px] text-gray-400">
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
            ) : (
              <div className="animate-in fade-in duration-500">
                 <div className="bg-white/60 backdrop-blur-md rounded-sm p-6 border border-white flex flex-col items-center text-center shadow-inner">
                    <div className="w-10 h-10 bg-[#243f55]/10 rounded-full flex items-center justify-center mb-2">
                       <Clock size={20} className="text-[#243f55]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[#1c3246] font-black text-sm uppercase tracking-tight mb-1">Match Scheduled</h3>
                    <p className="text-gray-500 text-[11px] font-medium max-w-[240px]">
                      Scoreboard will become live once the match starts on {formattedDate} at {formattedTime}
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. FIGURE MARKET SECTION (0-9 Digit Grid) */}
      {(activeTab === 'ALL' || activeTab === 'Figure') && actualMatch.status !== 'completed' && actualMatch.figureMarkets && actualMatch.figureMarkets.length > 0 && (
        actualMatch.figureMarkets.map((figureMarket, fmIdx) => (
          <div key={fmIdx} className="order-2 flex flex-col px-2 mb-2">
            <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-[#5d7d9a] text-white h-10 flex items-center px-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    {figureMarket.name} <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: {figureMarket.maxBet >= 1000000 ? `${(figureMarket.maxBet / 1000000).toFixed(0)}M` : `${(figureMarket.maxBet / 1000).toFixed(0)}K`})</span>
                    <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                  </span>
                </div>
              </div>

              {/* Digit Grid - 5 per row */}
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
                    <button
                      key={d.digit}
                      disabled={d.status === 'SUSPENDED' || figureMarket.status === 'SUSPENDED'}
                      onClick={() => onSelectOutcome(`${figureMarket.name} - Digit ${d.digit}`, d.odds, 'back', actualMatch.status === 'live', 'figure')}
                      className="w-12 sm:w-14 border border-black cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                    >
                      <div className="h-8 bg-[#bfe2f7] border-b border-black flex items-center justify-center text-[16px] font-black text-black">
                        {d.digit}
                      </div>
                      <div className="h-6 bg-white flex items-center justify-center text-[12px] font-black text-[#1c3246]">
                        {d.odds}
                      </div>
                      {renderDigitExposure(figureMarket.name, d.digit)}
                    </button>
                  ))}
                </div>
                {/* Row 2: Digits 5-9 */}
                <div className="flex justify-center -space-x-[1px]">
                  {(figureMarket.digits || []).filter(d => d.digit >= 5 && d.digit <= 9).map((d) => (
                    <button
                      key={d.digit}
                      disabled={d.status === 'SUSPENDED' || figureMarket.status === 'SUSPENDED'}
                      onClick={() => onSelectOutcome(`${figureMarket.name} - Digit ${d.digit}`, d.odds, 'back', actualMatch.status === 'live', 'figure')}
                      className="w-12 sm:w-14 border border-black cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                    >
                      <div className="h-8 bg-[#bfe2f7] border-b border-black flex items-center justify-center text-[16px] font-black text-black">
                        {d.digit}
                      </div>
                      <div className="h-6 bg-white flex items-center justify-center text-[12px] font-black text-[#1c3246]">
                        {d.odds}
                      </div>
                      {renderDigitExposure(figureMarket.name, d.digit)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* 6. FANCY 2 MARKET SECTION */}
      {(activeTab === 'ALL' || activeTab === 'Fancy-2') && actualMatch.status !== 'completed' && actualMatch.fancyMarkets && actualMatch.fancyMarkets.length > 0 && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  FANCY 2 <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                  <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                </span>
              </div>
              <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">LAY</div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {actualMatch.fancyMarkets.map((fancy, fIdx) => {
                const isSuspended = fancy.status === 'SUSPENDED';
                return (
                  <div key={fIdx} className="relative flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{fancy.name}</span>
                      {renderFancyExposure(fancy.name) || (
                        <span className="text-[11px] font-black text-[#00c766] hover:underline cursor-pointer mt-0.5">Book</span>
                      )}
                    </div>
                    {isSuspended ? (
                      <div className="flex shrink-0 w-28 sm:w-[336px] items-center justify-center py-2 bg-gray-50/50">
                        <span className="text-[#dc2626] font-black text-[12px] tracking-wider">SUSPENDED</span>
                      </div>
                    ) : (
                      <div className="flex shrink-0">
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <button
                          disabled={!fancy.backPrice}
                          onClick={() => onSelectOutcome(fancy.name, fancy.backPrice || 1.95, 'back', actualMatch.status === 'live', 'fancy')}
                          className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] hover:bg-[#a5d3f8] active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <span className="text-[14px] font-black leading-none text-[#1c3246]">{fancy.backPrice ?? '-'}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-600">{fancy.backVol || '100'}</span>
                        </button>
                        <button
                          disabled={!fancy.layPrice}
                          onClick={() => onSelectOutcome(fancy.name, fancy.layPrice || 1.95, 'lay', actualMatch.status === 'live', 'fancy')}
                          className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4] hover:bg-[#f9b6c6] active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <span className="text-[14px] font-black leading-none text-[#1c3246]">{fancy.layPrice ?? '-'}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-600">{fancy.layVol || '100'}</span>
                        </button>
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <div className="hidden sm:block w-12 sm:w-14"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. EVEN / ODD MARKET SECTION */}
      {(activeTab === 'ALL' || activeTab === 'Even-Odd') && actualMatch.status !== 'completed' && actualMatch.evenOddMarkets && actualMatch.evenOddMarkets.length > 0 && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  EVEN / ODD <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: 2M)</span>
                  <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                </span>
              </div>
              <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                <div className="w-14 sm:w-16 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">LAY</div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
                <div className="hidden sm:block w-12 sm:w-14"></div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {actualMatch.evenOddMarkets.map((eoMarket, eoIdx) => {
                const isSuspended = eoMarket.status === 'SUSPENDED';
                return (
                  <div key={eoIdx} className="relative flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <span className="font-bold text-[#1c3246] text-[13px] leading-tight">{eoMarket.name}</span>
                      {renderFancyExposure(eoMarket.name) || (
                        <span className="text-[11px] font-black text-[#00c766] hover:underline cursor-pointer mt-0.5">Book</span>
                      )}
                    </div>
                    {isSuspended ? (
                      <div className="flex shrink-0 w-28 sm:w-[336px] items-center justify-center py-2 bg-gray-50/50">
                        <span className="text-[#dc2626] font-black text-[12px] tracking-wider">SUSPENDED</span>
                      </div>
                    ) : (
                      <div className="flex shrink-0">
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <button
                          disabled={!eoMarket.backPrice}
                          onClick={() => onSelectOutcome(eoMarket.name, eoMarket.backPrice, 'back', actualMatch.status === 'live', 'even_odd')}
                          className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#bbd9f9] hover:bg-[#a5d3f8] active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <span className="text-[14px] font-black leading-none text-[#1c3246]">{eoMarket.backPrice ?? '-'}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-600">{eoMarket.backVol || '98'}</span>
                        </button>
                        <button
                          disabled={!eoMarket.layPrice}
                          onClick={() => onSelectOutcome(eoMarket.name, eoMarket.layPrice, 'lay', actualMatch.status === 'live', 'even_odd')}
                          className="w-14 sm:w-16 flex flex-col items-center justify-center py-1.5 bg-[#f8c9d4] hover:bg-[#f9b6c6] active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <span className="text-[14px] font-black leading-none text-[#1c3246]">{eoMarket.layPrice ?? '-'}</span>
                          <span className="text-[9px] font-bold mt-1 text-gray-600">{eoMarket.layVol || '102'}</span>
                        </button>
                        <div className="hidden sm:block w-12 sm:w-14 border-r border-white/40"></div>
                        <div className="hidden sm:block w-12 sm:w-14"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. TIED MATCH (OTHERS) MARKET SECTION */}
      {(activeTab === 'ALL' || activeTab === 'Others') && actualMatch.status !== 'completed' && actualMatch.tiedMatchMarket && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {actualMatch.tiedMatchMarket.name || 'TIED MATCH'} <span className="text-white/80 font-bold ml-1 text-[11px]">(MaxBet: {actualMatch.tiedMatchMarket.maxBet >= 1000000 ? `${(actualMatch.tiedMatchMarket.maxBet / 1000000).toFixed(0)}M` : `${(actualMatch.tiedMatchMarket.maxBet / 1000).toFixed(0)}K`})</span>
                  <Info size={14} className="text-white/70 ml-1 inline cursor-pointer" />
                </span>
              </div>
              <div className="flex items-center text-[11px] font-black tracking-widest uppercase">
                <div className="w-40 sm:w-44 text-center bg-[#1c3246] text-white py-1 border-r border-white/20">BACK</div>
                <div className="w-40 sm:w-44 text-center bg-[#1c3246] text-white py-1">LAY</div>
              </div>
            </div>

            <div className="relative divide-y divide-gray-100">
              {actualMatch.tiedMatchMarket.status === 'SUSPENDED' && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                    MARKET SUSPENDED
                  </div>
                </div>
              )}
              {(actualMatch.tiedMatchMarket.runners || []).map((runner, rIdx) => {
                const backOdds = runner.backOdds || [];
                const layOdds = runner.layOdds || [];
                
                return (
                  <div key={rIdx} className="flex items-stretch hover:bg-gray-50 transition-colors">
                    <div className="flex-1 flex flex-col justify-center px-3 py-2.5 min-w-[100px]">
                      <span className="font-bold text-[#1c3246] text-[14px]">{runner.name}</span>
                      {renderRunnerExposure(`tied_${runner.name.toLowerCase()}`)}
                    </div>
                    <div className="flex shrink-0">
                      {Array.from({ length: 3 }).map((_, slotIdx) => {
                        const odd = backOdds[2 - slotIdx];
                        const isMain = slotIdx === 2;
                        if (!odd) {
                          return (
                            <div key={`b-empty-${slotIdx}`} className={`w-13 sm:w-14 border-r border-white/40 ${isMain ? 'bg-[#bbd9f9]/40' : 'bg-transparent'}`}></div>
                          );
                        }
                        return (
                          <button
                            key={`back-${slotIdx}`}
                            disabled={actualMatch.tiedMatchMarket.status === 'SUSPENDED'}
                            onClick={() => onSelectOutcome(`${actualMatch.tiedMatchMarket.name} - ${runner.name}`, odd.price, 'back', actualMatch.status === 'live', 'tied_match')}
                            className={`w-13 sm:w-14 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                              isMain ? 'bg-[#72bbef]' : 'bg-[#bbd9f9]'
                            } hover:bg-[#a5d3f8]`}
                          >
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{odd.price}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{odd.volume}</span>
                          </button>
                        );
                      })}
                      {Array.from({ length: 3 }).map((_, slotIdx) => {
                        const odd = layOdds[slotIdx];
                        const isMain = slotIdx === 0;
                        if (!odd) {
                          return (
                            <div key={`l-empty-${slotIdx}`} className="w-13 sm:w-14 border-r border-white/40 bg-transparent"></div>
                          );
                        }
                        return (
                          <button
                            key={`lay-${slotIdx}`}
                            disabled={actualMatch.tiedMatchMarket.status === 'SUSPENDED'}
                            onClick={() => onSelectOutcome(`${actualMatch.tiedMatchMarket.name} - ${runner.name}`, odd.price, 'lay', actualMatch.status === 'live', 'tied_match')}
                            className={`w-13 sm:w-14 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all border-r border-white/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                              isMain ? 'bg-[#f8a9b8]' : 'bg-[#f8c9d4]'
                            } hover:bg-[#f9b6c6]`}
                          >
                            <span className="text-[14px] font-black leading-none text-[#1c3246]">{odd.price}</span>
                            <span className="text-[9px] font-bold mt-1 text-gray-600">{odd.volume}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. FEATURE 2: BPEXCH OPEN BETS & MATCHED BETS SECTIONS (Image 2) */}
      <div className="order-4 px-2 mt-3 flex flex-col gap-2">
        {/* Open Bets */}
        <CollapsibleMarketSection title={`Open Bets (${betsData.openBets?.length || 0})`}>
          <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-black text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-[3]">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-20 text-right">Size</div>
            <div className="w-20 text-center">Better</div>
            <div className="w-20 text-right">Master</div>
          </div>
          {(!betsData.openBets || betsData.openBets.length === 0) ? (
            <div className="py-6 bg-white flex items-center justify-center text-[12px] text-gray-400 italic">
              No open bets
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white">
              {betsData.openBets.map((b, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center px-3 py-2 text-[12px] font-semibold transition-colors ${
                    b.type === 'lay' ? 'bg-[#f8c9d4]/40 hover:bg-[#f8c9d4]/60' : 'bg-[#bbd9f9]/40 hover:bg-[#bbd9f9]/60'
                  }`}
                >
                  <div className="flex-[3] font-bold text-[#1c3246] truncate">{b.runner}</div>
                  <div className="w-16 text-center text-gray-800 font-bold">{b.price}</div>
                  <div className="w-20 text-right text-gray-800 font-bold">{Number(b.size).toLocaleString()}</div>
                  <div className="w-20 text-center text-gray-700 truncate">{b.better}</div>
                  <div className="w-20 text-right text-gray-700 truncate">{b.master}</div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleMarketSection>

        {/* Matched Bets with [Full Bet List] Button matching Image 2 */}
        <CollapsibleMarketSection 
          title={`Matched Bets (${betsData.matchedBets?.length || 0})`}
          rightAction={
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullBetListOpen(true);
              }}
              className="bg-[#009866] hover:bg-[#007f55] text-white text-[11px] font-black uppercase px-3 py-1 rounded shadow-sm transition-all active:scale-95"
            >
              Full Bet List
            </button>
          }
        >
          <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-black text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-[3]">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-20 text-right">Size</div>
            <div className="w-20 text-center">Better</div>
            <div className="w-20 text-right">Master</div>
          </div>
          {(!betsData.matchedBets || betsData.matchedBets.length === 0) ? (
            <div className="py-6 bg-white flex items-center justify-center text-[12px] text-gray-400 italic">
              No matched bets
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white">
              {betsData.matchedBets.map((b, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center px-3 py-2 text-[12px] font-semibold transition-colors ${
                    b.type === 'lay' ? 'bg-[#f8c9d4]/40 hover:bg-[#f8c9d4]/60' : 'bg-[#bbd9f9]/40 hover:bg-[#bbd9f9]/60'
                  }`}
                >
                  <div className="flex-[3] font-bold text-[#1c3246] truncate">{b.runner}</div>
                  <div className="w-16 text-center text-gray-800 font-bold">{b.price}</div>
                  <div className="w-20 text-right text-gray-800 font-bold">{Number(b.size).toLocaleString()}</div>
                  <div className="w-20 text-center text-gray-700 truncate">{b.better}</div>
                  <div className="w-20 text-right text-gray-700 truncate">{b.master}</div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleMarketSection>

        {/* Related Events */}
        <CollapsibleMarketSection title="Related Events">
          <div className="p-3 bg-white text-[11px] text-gray-400 italic text-center">
            No related events
          </div>
        </CollapsibleMarketSection>
      </div>

      {/* FOOTER: "Welcome to Exchange." matching Image 2 */}
      <div className="order-5 mt-6 border-t border-gray-200 pt-4 pb-12 px-3 text-center lg:text-left">
        <p className="text-[12px] font-bold text-gray-700 tracking-tight">Welcome to Exchange.</p>
      </div>

      {/* 8. FULL BET LIST MODAL */}
      {isFullBetListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-sm shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-300">
            {/* Modal Header */}
            <div className="bg-[#243f55] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black uppercase tracking-wider">
                  Matched Bets List ({betsData.matchedBets?.length || 0})
                </span>
              </div>
              <button 
                onClick={() => setIsFullBetListOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter bar */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
              <input
                type="text"
                value={betListFilter}
                onChange={(e) => setBetListFilter(e.target.value)}
                placeholder="Search by runner, better, or master..."
                className="flex-1 bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#009866]"
              />
              <span className="text-xs text-gray-500 font-bold">
                Showing {betsData.matchedBets.filter(b => 
                  !betListFilter || 
                  b.runner?.toLowerCase().includes(betListFilter.toLowerCase()) || 
                  b.better?.toLowerCase().includes(betListFilter.toLowerCase()) || 
                  b.master?.toLowerCase().includes(betListFilter.toLowerCase())
                ).length} of {betsData.matchedBets?.length || 0}
              </span>
            </div>

            {/* Modal Table Content */}
            <div className="overflow-x-auto flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-black uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5">Runner</th>
                    <th className="px-3 py-2.5 text-center">Type</th>
                    <th className="px-3 py-2.5 text-center">Price</th>
                    <th className="px-3 py-2.5 text-right">Size</th>
                    <th className="px-3 py-2.5 text-center">Better</th>
                    <th className="px-3 py-2.5 text-center">Master</th>
                    <th className="px-3 py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {betsData.matchedBets
                    .filter(b => 
                      !betListFilter || 
                      b.runner?.toLowerCase().includes(betListFilter.toLowerCase()) || 
                      b.better?.toLowerCase().includes(betListFilter.toLowerCase()) || 
                      b.master?.toLowerCase().includes(betListFilter.toLowerCase())
                    )
                    .map((b, idx) => (
                      <tr 
                        key={idx}
                        className={`transition-colors ${
                          b.type === 'lay' ? 'bg-[#f8c9d4]/30 hover:bg-[#f8c9d4]/50' : 'bg-[#bbd9f9]/30 hover:bg-[#bbd9f9]/50'
                        }`}
                      >
                        <td className="px-3 py-2 font-bold text-[#1c3246]">{b.runner}</td>
                        <td className="px-3 py-2 text-center uppercase font-black">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${b.type === 'lay' ? 'bg-[#d65d7a] text-white' : 'bg-[#5d99d6] text-white'}`}>
                            {b.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-gray-800">{b.price}</td>
                        <td className="px-3 py-2 text-right font-black text-gray-900">{Number(b.size).toLocaleString()}</td>
                        <td className="px-3 py-2 text-center font-bold text-gray-700">{b.better}</td>
                        <td className="px-3 py-2 text-center font-bold text-gray-700">{b.master}</td>
                        <td className="px-3 py-2 text-right text-gray-500 font-mono text-[10px]">
                          {b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsFullBetListOpen(false)}
                className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-black px-4 py-1.5 rounded uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function CollapsibleMarketSection({ title, rightAction, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <div 
        onClick={() => setOpen(!open)}
        className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none"
      >
        <span className="text-[13px] font-bold uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          {rightAction}
          <ChevronDown size={14} className={`opacity-80 transition-transform ${open ? '' : '-rotate-90'}`} />
        </div>
      </div>
      {open && children}
    </div>
  );
}
