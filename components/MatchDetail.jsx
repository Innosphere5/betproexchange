"use client";

import { Info, Tv, Clock } from "lucide-react";
import { useDashboard } from "./DashboardLayout";

export default function MatchDetail({ matchId, onSelectOutcome }) {
  const { cricketMatches } = useDashboard();

  const actualMatch = cricketMatches?.find(m => m.matchId === matchId);
  if (!actualMatch) return <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Match Data...</div>;

  const matchName = `${actualMatch.teamA} v ${actualMatch.teamB}`;
  const startTimeObj = new Date(actualMatch.startTime);
  const formattedDate = startTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = startTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const runners = [
    { name: actualMatch.teamA, back: 1.61, backVol: "1.3M", lay: 1.62, layVol: "913.1K" },
    { name: actualMatch.teamB, back: 2.6, backVol: "927.7K", lay: 2.62, layVol: "14.4K" }
  ];

  return (
    <div className="flex flex-col bg-[#eaedf1] h-full pb-6 lg:pb-0">

      {/* 1. PREMIUM HEADER SECTION */}
      <div className="order-1 shrink-0 bg-[#243f55] m-2 rounded-sm overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] text-[#00c766] font-black uppercase tracking-widest">
              <Clock size={12} strokeWidth={3} />
              <span>In 4 Hours | {formattedDate} {formattedTime} | Winners: 1</span>
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
            <span className="text-[#00c766] font-black text-2xl italic tracking-tighter leading-none">OPEN</span>
          </div>
        </div>
      </div>

      {/* 2. MATCH ODDS MARKET SECTION */}
      <div className="order-2 flex flex-col px-2">
        <div className="bg-white rounded-sm shadow-sm border border-gray-300 overflow-hidden">
          {/* Market Header Tab */}
          <div className="bg-[#5d7d9a] text-white h-9 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#00c766] rounded-sm flex items-center justify-center shrink-0">
                <Info size={12} color="white" strokeWidth={3} />
              </div>
              <span className="text-[12px] font-black uppercase tracking-wide">
                MATCH ODDS <span className="text-white/60 font-medium ml-1">(Max: 5M)</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-black tracking-widest uppercase">
              <div className="w-14 text-center">Back</div>
              <div className="w-14 text-center">Lay</div>
            </div>
          </div>

          {/* Runners List */}
          <div className="flex flex-col">
            {runners.map((runner, ridx) => (
              <div key={ridx} className="flex items-stretch border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex-1 flex items-center px-3 py-3 font-bold text-[#1c3246] text-[13px]">
                  {runner.name}
                </div>
                <div className="flex w-32 shrink-0">
                  <button
                    onClick={() => onSelectOutcome(runner.name, runner.back, 'back', actualMatch.status === 'live')}
                    className="flex-1 bg-[#bbd9f9] flex flex-col items-center justify-center py-2 active:scale-95 transition-transform border-r border-white/40"
                  >
                    <span className="text-[15px] font-black text-[#1c3246] leading-none">{runner.back}</span>
                    <span className="text-[9px] font-bold text-gray-500 mt-1">{runner.backVol}</span>
                  </button>
                  <button
                    onClick={() => onSelectOutcome(runner.name, runner.lay, 'lay', actualMatch.status === 'live')}
                    className="flex-1 bg-[#f8c9d4] flex flex-col items-center justify-center py-2 active:scale-95 transition-transform"
                  >
                    <span className="text-[15px] font-black text-[#1c3246] leading-none">{runner.lay}</span>
                    <span className="text-[9px] font-bold text-gray-500 mt-1">{runner.layVol}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
      ) : actualMatch?.status === 'live' && (
        <div className="order-3 mt-auto shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-black m-2 rounded-md overflow-hidden shadow-lg border border-gray-800">
            <div className="px-5 py-6 bg-gradient-to-b from-[#111] to-black text-white relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#00c766] to-transparent opacity-50"></div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-black uppercase flex items-center gap-1 animate-pulse tracking-widest shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-white">{matchName}</h2>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="text-3xl font-black text-white tabular-nums">{actualMatch.score?.teamA_runs ?? "0/0"}</div>
                    <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{actualMatch.teamA}</div>
                  </div>
                  <div className="flex flex-col items-center bg-white/10 px-3 py-1 rounded-sm">
                    <div className="text-lg font-black text-[#00c766]">{actualMatch.score?.overs || "0.0"}</div>
                    <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">OVERS</div>
                  </div>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="text-3xl font-black text-[#00c766] tabular-nums">{actualMatch.score?.teamB_runs ?? "0/0"}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{actualMatch.teamB}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
