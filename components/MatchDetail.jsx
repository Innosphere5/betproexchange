import { useState, useEffect } from "react";
import { Info, Tv, Clock, Trophy, Users, ShieldCheck, ChevronDown, CheckCircle2 } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";

export default function MatchDetail({ matchId, onSelectOutcome }) {
  const { cricketMatches } = useDashboard();
  const [exposureData, setExposureData] = useState(null);
  const [tossExposure, setTossExposure] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [prevOdds, setPrevOdds] = useState({});
  const [flash, setFlash] = useState({});
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" or "Toss"
  const [bottomTab, setBottomTab] = useState("scorecard"); // "tv" or "scorecard"
  const [remainingTime, setRemainingTime] = useState("");
  const [keepDisplayOn, setKeepDisplayOn] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        setUserRole(session.role);
      } catch (e) {}
    }
  }, []);

  const isAdmin = ['superadmin', 'admin', 'master'].includes(userRole);

  useEffect(() => {
    const fetchExposure = async () => {
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
        console.error("Failed to fetch exposure:", err);
      }
    };

    fetchExposure();
    const interval = setInterval(fetchExposure, 10000); // 10s refresh for exposure
    return () => clearInterval(interval);
  }, [matchId, isAdmin]);

  const actualMatch = cricketMatches?.find(m => m.matchId === matchId);
  const startTimeObj = actualMatch ? new Date(actualMatch.startTime) : new Date();
  const formattedDate = actualMatch ? startTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";
  const formattedTime = actualMatch ? startTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase() : "";

  // Today check for odds visibility
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const isToday = actualMatch ? (startTimeObj >= todayStart && startTimeObj < todayEnd) : false;
  const isLive = actualMatch ? (actualMatch.status === 'live') : false;

  const showOdds = isLive || isToday || (actualMatch && actualMatch.backOddsA);

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

  const tossRunners = [
    {
      name: `${actualMatch.teamA} To Win The Toss`,
      team: actualMatch.teamA,
      back: actualMatch.tossBackA || 1.98,
      backVol: actualMatch.tossDepthBackA || "98",
      lay: actualMatch.tossLayA || 2.02,
      layVol: actualMatch.tossDepthLayA || "102"
    },
    {
      name: `${actualMatch.teamB} To Win The Toss`,
      team: actualMatch.teamB,
      back: actualMatch.tossBackB || 1.98,
      backVol: actualMatch.tossDepthBackB || "102",
      lay: actualMatch.tossLayB || 2.02,
      layVol: actualMatch.tossDepthLayB || "98"
    }
  ];

  return (
    <div className="flex flex-col bg-[#eaedf1] h-full pb-6 lg:pb-0 font-sans">

      {/* 1. BPEXCH-STYLE HEADER SECTION */}
      <div className="order-1 shrink-0 bg-[#243f55] m-2 rounded-sm overflow-hidden shadow-md">
        <div className="flex items-start justify-between px-4 pt-3.5 pb-2">
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

        {/* BPEXCH ALL / TOSS TABS */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1b3447] border-t border-white/5">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-6 py-1 rounded-full text-[12px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'ALL'
                ? 'bg-[#009866] text-white shadow-sm'
                : 'bg-[#243f55] text-gray-300 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setActiveTab('Toss')}
            className={`px-6 py-1 rounded-full text-[12px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'Toss'
                ? 'bg-[#009866] text-white shadow-sm'
                : 'bg-[#243f55] text-gray-300 hover:text-white'
            }`}
          >
            Toss
          </button>
        </div>
      </div>

      {/* 2. MATCH ODDS MARKET SECTION (Visible on 'ALL' tab, hidden if completed) */}
      {activeTab === 'ALL' && actualMatch.status !== 'completed' && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            {/* Market Header Tab */}
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
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

            {/* Runners List */}
            <div className="relative flex flex-col">
              {actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN' && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                    MARKET SUSPENDED
                  </div>
                </div>
              )}
              {runners.map((runner, ridx) => (
                <div key={ridx} className="flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 flex flex-col justify-center px-3 py-3">
                    <div className="font-bold text-[#1c3246] text-[13px] leading-tight">
                      {runner.name}
                    </div>
                    {isAdmin && exposureData?.exposure && (
                      <div className={`text-[12px] font-black mt-0.5 ${exposureData.exposure[runner.name] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {exposureData.exposure[runner.name]?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
                      </div>
                    )}
                  </div>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TOSS MARKET SECTION (Visible on 'ALL' and 'Toss' tabs, hidden if match completed) */}
      {(activeTab === 'ALL' || activeTab === 'Toss') && actualMatch.status !== 'completed' && (
        <div className="order-2 flex flex-col px-2 mb-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            {/* Market Header Tab */}
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
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
            {isAdmin && !actualMatch.tossWinner && (
              <div className="bg-[#243f55] text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200">
                <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-black">
                  <Trophy size={14} /> Admin Declare Toss Winner:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeclareTossWinner(actualMatch.teamA)}
                    className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm"
                  >
                    {actualMatch.teamA}
                  </button>
                  <button
                    onClick={() => handleDeclareTossWinner(actualMatch.teamB)}
                    className="bg-[#009866] hover:bg-[#007f55] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase shadow-sm"
                  >
                    {actualMatch.teamB}
                  </button>
                  <button
                    onClick={() => handleDeclareTossWinner('REFUND')}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-[11px] font-black uppercase shadow-sm"
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
            ) : (
              /* Runners List */
              <div className="relative flex flex-col">
                {actualMatch.tossMarketStatus && actualMatch.tossMarketStatus !== 'OPEN' && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="bg-[#1c3246] text-white px-6 py-2 rounded-full font-black text-xs tracking-widest shadow-2xl animate-pulse">
                      TOSS MARKET SUSPENDED
                    </div>
                  </div>
                )}
                {tossRunners.map((runner, ridx) => (
                  <div key={ridx} className="flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 flex flex-col justify-center px-3 py-3">
                      <div className="font-bold text-[#1c3246] text-[13px] leading-tight">
                        {runner.name}
                      </div>
                      {isAdmin && tossExposure?.[runner.name] !== undefined && (
                        <div className={`text-[12px] font-black mt-0.5 ${tossExposure[runner.name] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {tossExposure[runner.name]?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
                        </div>
                      )}
                    </div>
                    <div className="flex w-32 shrink-0">
                      <button
                        disabled={actualMatch.tossMarketStatus === 'CLOSED' || runner.back === '-'}
                        onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live', 'toss')}
                        className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all border-r border-white/40 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden bg-[#bbd9f9] hover:bg-[#a5d3f8]"
                      >
                        <span className="text-[15px] font-black leading-none z-10 text-[#1c3246]">{runner.back}</span>
                        <span className="text-[9px] font-bold mt-1 z-10 text-gray-500">{runner.backVol}</span>
                      </button>
                      <button
                        disabled={actualMatch.tossMarketStatus === 'CLOSED' || runner.lay === '-'}
                        onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live', 'toss')}
                        className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden bg-[#f8c9d4] hover:bg-[#f9b6c6]"
                      >
                        <span className="text-[15px] font-black leading-none z-10 text-[#1c3246]">{runner.lay}</span>
                        <span className="text-[9px] font-bold mt-1 z-10 text-gray-500">{runner.layVol}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. BPEXCH TV & SCORE CARD TAB BAR */}
      <div className="order-3 px-2 mt-2">
        <div className="grid grid-cols-2 rounded-sm overflow-hidden shadow-sm">
          <button
            onClick={() => setBottomTab('tv')}
            className={`py-2.5 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${
              bottomTab === 'tv'
                ? 'bg-[#009866] text-white'
                : 'bg-[#007f55] text-white/80 hover:text-white'
            }`}
          >
            Tv
          </button>
          <button
            onClick={() => setBottomTab('scorecard')}
            className={`py-2.5 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${
              bottomTab === 'scorecard'
                ? 'bg-[#009866] text-white'
                : 'bg-[#007f55] text-white/80 hover:text-white'
            }`}
          >
            Score Card
          </button>
        </div>
      </div>

      {/* 5. TV STREAM BOX OR SCORECARD VIEW */}
      {bottomTab === 'tv' ? (
        <div className="order-3 px-2 mt-2">
          <div className="aspect-video bg-black flex items-center justify-center text-white font-serif text-2xl italic rounded-sm shadow-sm">
            Match not live
          </div>
        </div>
      ) : actualMatch?.status === 'completed' ? (
        <div className="order-3 px-2 mt-2 animate-in zoom-in duration-500">
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
        <div className="order-3 px-2 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#f1f4f8] rounded-sm overflow-hidden shadow-sm border border-gray-200">
            <div className="px-4 py-3 bg-white text-[#1c3246]">
              {/* Header: Team Name and Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <h2 className="text-xl font-black text-[#243f55] uppercase tracking-tight">
                    {actualMatch.teamA} v {actualMatch.teamB} - Match Odds
                   </h2>
                   <span className="text-pink-500 font-black text-sm uppercase italic">InPlay</span>
                   <div className="w-5 h-5 bg-[#243f55] rounded-sm flex items-center justify-center">
                     <Info size={12} color="white" strokeWidth={3} />
                   </div>
                </div>
              </div>

              {/* Score Line */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                 <div className="flex items-baseline gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{actualMatch.teamA}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-[#1c3246] tracking-tighter">
                            {actualMatch.score?.teamA_runs?.split('/')[0] || 0}
                            <span className="text-2xl text-gray-300 mx-0.5">/</span>
                            {actualMatch.score?.teamA_runs?.split('/')[1] || 0}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-10 w-[1px] bg-gray-200 mx-2 self-center"></div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overs</span>
                        <span className="text-2xl font-black text-[#243f55]">
                           {actualMatch.score?.overs || "0.0"}
                        </span>
                    </div>
                 </div>

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
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                 <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-gray-400">This Over:</span>
                    <div className="flex gap-1.5">
                       {actualMatch.score?.thisOver && actualMatch.score.thisOver.length > 0 ? (
                         actualMatch.score.thisOver.map((ball, bidx) => (
                           <span key={bidx} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${
                             ball === 'W' ? 'bg-red-500 text-white' : 
                             ['4', '6'].includes(ball) ? 'bg-green-500 text-white' : 'text-gray-700'
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
                    {actualMatch.score?.remRuns > 0 ? (
                      `${actualMatch.score.remRuns} of ${actualMatch.score.remBalls} balls`
                    ) : (
                      "Match in progress"
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="order-3 px-2 mt-2 animate-in fade-in duration-500">
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

      {/* 6. BPEXCH OPEN BETS & MATCHED BETS SECTIONS */}
      <div className="order-4 px-2 mt-3 flex flex-col gap-2">
        <CollapsibleMarketSection title="Open Bets (0)">
          <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-bold text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-1">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-16 text-right">Size</div>
          </div>
          <div className="h-6 bg-white flex items-center justify-center text-[11px] text-gray-400 italic">
            No open bets
          </div>
        </CollapsibleMarketSection>

        <CollapsibleMarketSection title="Matched Bets (0)">
          <div className="bg-gray-100 flex items-center px-3 py-2 text-[11px] font-bold text-gray-500 border-b border-gray-200 uppercase tracking-tight">
            <div className="flex-1">Runner</div>
            <div className="w-16 text-center">Price</div>
            <div className="w-16 text-right">Size</div>
          </div>
          <div className="h-6 bg-white flex items-center justify-center text-[11px] text-gray-400 italic">
            No matched bets
          </div>
        </CollapsibleMarketSection>

        <CollapsibleMarketSection title="Related Events">
          <div className="p-3 bg-white text-[11px] text-gray-400 italic text-center">
            No related events
          </div>
        </CollapsibleMarketSection>
      </div>

      {/* 7. ADMIN ONLY: DETAILED MATCHED BETS TABLE */}
      {isAdmin && (
        <div className="order-5 px-2 mt-4 pb-10">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-9 flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <Users size={14} color="white" strokeWidth={3} />
                <span className="text-[12px] font-black uppercase tracking-wide">
                  Admin Matched Bets ({exposureData?.matchedBets?.length || 0})
                </span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-[12px] text-left border-collapse">
                <thead className="bg-[#f9f9f9] border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider">Runner</th>
                    <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider text-center">Price</th>
                    <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider text-center">Stake</th>
                    <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider">Bettor</th>
                    <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider">Master/Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!exposureData?.matchedBets || exposureData.matchedBets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-8 text-center text-gray-400 italic">No matched bets for this match.</td>
                    </tr>
                  ) : (
                    exposureData.matchedBets.map((bet, bidx) => (
                      <tr 
                        key={bidx} 
                        className={`hover:bg-gray-50 transition-colors ${bet.type === 'back' ? 'bg-[#e3f2fd]/30' : 'bg-[#ffebee]/40'}`}
                      >
                        <td className="px-3 py-2 font-black text-[#243f55]">{bet.runner}</td>
                        <td className="px-3 py-2 font-black text-center text-gray-800">{bet.price}</td>
                        <td className="px-3 py-2 font-black text-center text-gray-800">{bet.size}</td>
                        <td className="px-3 py-2 font-bold text-gray-600">{bet.better}</td>
                        <td className="px-3 py-2 font-bold text-gray-600">{bet.master}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function CollapsibleMarketSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <div 
        onClick={() => setOpen(!open)}
        className="bg-[#243f55] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none"
      >
        <span className="text-[13px] font-bold uppercase tracking-wide">{title}</span>
        <ChevronDown size={14} className={`opacity-80 transition-transform ${open ? '' : '-rotate-90'}`} />
      </div>
      {open && children}
    </div>
  );
}
