import { useState, useEffect } from "react";
import { Info, Tv, Clock, Trophy, Users, ShieldCheck } from "lucide-react";
import { useDashboard } from "./DashboardLayout";
import { getApiUrl } from "../lib/apiConfig";

export default function MatchDetail({ matchId, onSelectOutcome }) {
  const { cricketMatches } = useDashboard();
  const [exposureData, setExposureData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [prevOdds, setPrevOdds] = useState({});
  const [flash, setFlash] = useState({});

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
        const res = await fetch(`${getApiUrl()}/api/admin/match-exposure/${matchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setExposureData(data);
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
  const formattedTime = actualMatch ? startTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "";

  // Today check for odds visibility
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const isToday = actualMatch ? (startTimeObj >= todayStart && startTimeObj < todayEnd) : false;
  const isLive = actualMatch ? (actualMatch.status === 'live') : false;

  const showOdds = isLive || isToday || (actualMatch && actualMatch.backOddsA);

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
        setTimeout(() => setFlash({}), 300); // Very quick pulse
      }
      setPrevOdds(currentOdds);
    }
    // We use a fallback to ensure the array length is consistent
  }, [actualMatch?.lastUpdated || "", actualMatch?.backOddsA, actualMatch?.backOddsB, actualMatch?.layOddsA, actualMatch?.layOddsB]);

  if (!actualMatch) return <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Match Data...</div>;

  const matchName = `${actualMatch.teamA} v ${actualMatch.teamB}`;

  const runners = [
    { 
      name: actualMatch.teamA, 
      back: showOdds ? (actualMatch.backOddsA || "N/A") : "N/A", 
      backVol: showOdds ? (actualMatch.depthBackA || "0") : "0", 
      lay: showOdds ? (actualMatch.layOddsA || "N/A") : "N/A", 
      layVol: showOdds ? (actualMatch.depthLayA || "0") : "0",
      flash: { back: flash.backA, lay: flash.layA }
    },
    { 
      name: actualMatch.teamB, 
      back: showOdds ? (actualMatch.backOddsB || "N/A") : "N/A", 
      backVol: showOdds ? (actualMatch.depthBackB || "0") : "0", 
      lay: showOdds ? (actualMatch.layOddsB || "N/A") : "N/A", 
      layVol: showOdds ? (actualMatch.depthLayB || "0") : "0",
      flash: { back: flash.backB, lay: flash.layB }
    }
  ];

  return (
    <div className="flex flex-col bg-[#eaedf1] h-full pb-6 lg:pb-0 font-sans">

      {/* 1. PREMIUM HEADER SECTION */}
      <div className="order-1 shrink-0 bg-[#243f55] m-2 rounded-sm overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] text-[#00c766] font-black uppercase tracking-widest">
              <Clock size={12} strokeWidth={3} />
              <span>{actualMatch.status === 'live' ? 'LIVE NOW' : `Starts at ${formattedTime}`} | {formattedDate} | Winners: 1</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              {matchName}
            </h1>
            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              <span className="bg-white/10 px-1.5 py-0.5 rounded">Keep Display On</span>
              <span className="opacity-50">{actualMatch.league}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-[#00c766] font-black text-2xl italic tracking-tighter leading-none">
                {actualMatch.status === 'completed' ? 'CLOSED' : 'OPEN'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH ODDS MARKET SECTION (Hidden if completed) */}
      {actualMatch.status !== 'completed' && (
        <div className="order-2 flex flex-col px-2">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            {/* Market Header Tab */}
            <div className="bg-[#5d7d9a] text-white h-10 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#00c766] rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider">
                  MATCH ODDS <span className="text-white/60 font-bold ml-1 text-[11px]">(MAX: 5M)</span>
                </span>
              </div>
              <div className="flex items-center gap-6 text-[11px] font-black tracking-widest uppercase">
                <div className="w-14 text-center border-b-2 border-[#bbd9f9]">Back</div>
                <div className="w-14 text-center border-b-2 border-[#f8c9d4]">Lay</div>
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
                      disabled={actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN'}
                      onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live')}
                      className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all border-r border-white/40 disabled:opacity-50 relative overflow-hidden ${runner.flash?.back ? 'bg-[#5d99d6]' : 'bg-[#bbd9f9]'}`}
                    >
                      <span className={`text-[15px] font-black leading-none z-10 transition-colors ${runner.flash?.back ? 'text-white' : 'text-[#1c3246]'}`}>{runner.back}</span>
                      <span className={`text-[9px] font-bold mt-1 z-10 transition-colors ${runner.flash?.back ? 'text-white/80' : 'text-gray-500'}`}>{runner.backVol}</span>
                    </button>
                    <button
                      disabled={actualMatch.marketStatus && actualMatch.marketStatus !== 'OPEN'}
                      onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live')}
                      className={`flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden ${runner.flash?.lay ? 'bg-[#d65d7a]' : 'bg-[#f8c9d4]'}`}
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


      {/* 3. LIVE OR COMPLETED SCORECARD */}
      {actualMatch?.status === 'completed' ? (
        <div className="order-3 mt-auto shrink-0 animate-in zoom-in duration-500">
          <div className="bg-[#0f172a] m-2 rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-500/30">
            <div className="px-5 py-10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white text-center relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>

              <div className="flex flex-col items-center mb-6">
                 <div className="bg-yellow-500 text-black text-[10px] font-black px-4 py-1 rounded-full mb-3 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                   MATCH COMPLETED
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                   {actualMatch.winner === 'TIE' ? "MATCH TIED" : (actualMatch.winner === 'VOID' ? "MATCH VOIDED" : `${actualMatch.winner} WON`)}
                 </h2>
                 <div className="w-12 h-1 bg-yellow-500 rounded-full"></div>
              </div>

              <div className="flex items-center justify-center gap-10 mb-8">
                <div className="flex flex-col items-center">
                  <div className={`text-4xl font-black mb-1 ${actualMatch.winner === actualMatch.teamA ? 'text-white' : 'text-gray-600'}`}>{actualMatch.score?.teamA_runs || "0/0"}</div>
                  <div className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">{actualMatch.teamA}</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-gray-700 font-black text-xl italic opacity-30">VS</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className={`text-4xl font-black mb-1 ${actualMatch.winner === actualMatch.teamB ? 'text-white' : 'text-gray-600'}`}>{actualMatch.score?.teamB_runs || "0/0"}</div>
                  <div className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">{actualMatch.teamB}</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 max-w-sm mx-auto">
                <p className="text-[12px] font-bold text-gray-400 leading-relaxed">
                  The match has concluded and all bets have been settled. Winning amounts have been credited to user wallets.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : actualMatch?.status === 'live' ? (
        <div className="order-3 mt-auto shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#f1f4f8] m-2 rounded-sm overflow-hidden shadow-sm border border-gray-200">
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

              {/* Premium Score Line */}
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
        <div className="order-3 mt-auto shrink-0 animate-in fade-in duration-500">
           <div className="bg-white/60 backdrop-blur-md m-2 rounded-sm p-8 border border-white flex flex-col items-center text-center shadow-inner">
              <div className="w-12 h-12 bg-[#243f55]/10 rounded-full flex items-center justify-center mb-4">
                 <Clock size={24} className="text-[#243f55]" strokeWidth={2.5} />
              </div>
              <h3 className="text-[#1c3246] font-black text-base uppercase tracking-tight mb-1">Match Scheduled</h3>
              <p className="text-gray-500 text-xs font-medium max-w-[200px]">
                Scoreboard will become live once the match starts on {formattedDate} at {formattedTime}
              </p>
           </div>
        </div>
      )}

      {/* 4. ADMIN ONLY: MATCHED BETS TABLE */}
      {isAdmin && (
        <div className="order-4 px-2 mt-4 pb-10">
          <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-[#5d7d9a] text-white h-9 flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <Users size={14} color="white" strokeWidth={3} />
                <span className="text-[12px] font-black uppercase tracking-wide">
                  Matched Bets ({exposureData?.matchedBets?.length || 0})
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
