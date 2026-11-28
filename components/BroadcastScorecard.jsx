"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, List, BarChart2, Users } from "lucide-react";

const cleanCommentary = (raw) =>
  String(raw || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseTeamScore = (runsStr, explicitWickets) => {
  const raw = String(runsStr || "0").trim();
  if (raw.includes("&")) {
    // e.g. "356 & 112/4"
    return { display: raw, runs: parseInt(raw.split("&").pop(), 10) || 0, wickets: Number(explicitWickets) || 0, hasBatted: true };
  }
  let r = "0";
  let w = explicitWickets;
  if (raw.includes("/") || raw.includes("-")) {
    const parts = raw.split(/[\/-]/);
    r = parts[0] || "0";
    if (parts[1] !== undefined && parts[1] !== "") w = parts[1];
  } else {
    r = raw;
  }
  const numR = parseInt(r, 10) || 0;
  const numW = Number(w) || 0;
  return {
    display: `${numR}/${numW}`,
    runs: numR,
    wickets: numW,
    hasBatted: numR > 0 || numW > 0,
  };
};

const renderBallBadge = (ball, idx) => {
  const b = String(ball ?? "0").trim();
  const isWicket = b === "W" || b.endsWith("+W");
  const isFour = b === "4";
  const isSix = b === "6";
  const isExtra = b.includes("Wd") || b.includes("Nb") || b.includes("Lb") || /^(\d+)?[Bb]$/.test(b);
  const isDot = b === "0" || b === "•";

  if (isWicket) {
    return (
      <span
        key={idx}
        className="w-5 h-5 rounded-full bg-[#dc2626] border border-white/40 text-white text-[9px] font-black flex items-center justify-center shrink-0 shadow-xs"
      >
        W
      </span>
    );
  }
  if (isFour || isSix) {
    return (
      <span
        key={idx}
        className="w-5 h-5 rounded-full bg-[#1a3316] border-[1.5px] border-white/80 text-white text-[10px] font-black flex items-center justify-center shrink-0"
      >
        {b}
      </span>
    );
  }
  if (isExtra) {
    return (
      <span
        key={idx}
        className="min-w-5 h-5 px-1 rounded-full bg-[#24401d] border border-white/55 text-white text-[8px] font-black flex items-center justify-center shrink-0"
      >
        {b}
      </span>
    );
  }
  if (isDot) {
    return (
      <span
        key={idx}
        className="w-5 h-5 rounded-full bg-[#172b13] border border-white/10 flex items-center justify-center shrink-0"
        title="0 runs"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#7c9475]" />
      </span>
    );
  }
  return (
    <span
      key={idx}
      className="w-5 h-5 rounded-full bg-[#172b13] border border-white/30 text-white text-[10px] font-bold flex items-center justify-center shrink-0"
    >
      {b}
    </span>
  );
};

export default function BroadcastScorecard({ actualMatch, scoreAgeSec = 0 }) {
  const [innerTab, setInnerTab] = useState("live"); // "live" | "scorecard" | "stats" | "info"
  const [selectedInnsTeam, setSelectedInnsTeam] = useState("active"); // "active" | "teamA" | "teamB"
  const [isCollapsed, setIsCollapsed] = useState(false);

  const score = actualMatch?.score || {};
  const teamAName = actualMatch?.teamA || "Team A";
  const teamBName = actualMatch?.teamB || "Team B";
  const inningsNum = Number(score.innings || 1);
  const oversStr = (() => {
    const raw = String(score.overs || "0.0");
    if (raw === "Final") return "Final";
    return raw.includes(".") ? raw : `${raw}.0`;
  })();
  const oversNumeric = parseFloat(oversStr) || 0;

  const teamAInfo = parseTeamScore(
    score.teamA_runs,
    score.teamA_wickets ?? (score.battingTeam === "teamA" ? score.wickets : 0)
  );
  const teamBInfo = parseTeamScore(
    score.teamB_runs,
    score.teamB_wickets ?? (score.battingTeam === "teamB" ? score.wickets : 0)
  );

  const isTeamABatting = score.battingTeam !== "teamB";
  const activeBattingTeamName = score.battingTeamName || (isTeamABatting ? teamAName : teamBName);
  const activeTeamStats = isTeamABatting ? teamAInfo : teamBInfo;

  const teamARightLabel =
    !teamAInfo.hasBatted && isTeamABatting === false && inningsNum === 1 ? "Yet to bat" : teamAInfo.display;
  const teamBRightLabel =
    !teamBInfo.hasBatted && isTeamABatting === true && inningsNum === 1 ? "Yet to bat" : teamBInfo.display;

  // Build dynamic summary status string under header
  const summaryLine = useMemo(() => {
    if (score.remRuns > 0 && score.remBalls > 0) {
      return `${activeBattingTeamName} need ${score.remRuns} runs in ${score.remBalls} balls.`;
    }
    if (score.target > 0 && score.remRuns === 0 && activeTeamStats.runs >= score.target) {
      return `${activeBattingTeamName} reached target ${score.target}.`;
    }
    if (score.statusText && !/^(live|in_play|started)$/i.test(String(score.statusText).trim())) {
      return score.statusText;
    }
    if (oversNumeric > 0 || activeTeamStats.hasBatted) {
      return `${activeBattingTeamName} are ${activeTeamStats.runs} for ${activeTeamStats.wickets} after ${oversStr} overs.`;
    }
    return "Match in progress";
  }, [score.remRuns, score.remBalls, score.target, score.statusText, activeBattingTeamName, activeTeamStats, oversNumeric, oversStr]);

  // Determine Run Rate Chart parameters + curve + Wicket marker coordinates
  const activeInnsDisplayTeam =
    selectedInnsTeam === "teamA"
      ? teamAName
      : selectedInnsTeam === "teamB"
        ? teamBName
        : activeBattingTeamName;

  const crrVal = Math.max(0.5, parseFloat(score.runRate) || (oversNumeric > 0 ? activeTeamStats.runs / oversNumeric : 3.2));
  const yMax = crrVal > 12 ? 16 : crrVal > 8 ? 12 : crrVal > 5 ? 8 : 4;
  const maxOversAxis =
    actualMatch?.format === "TEST" || oversNumeric > 50
      ? Math.max(100, Math.ceil((oversNumeric + 10) / 20) * 20)
      : actualMatch?.format === "T10"
        ? 10
        : (actualMatch?.format === "ODI" || score.oversPerInnings === 50 || oversNumeric > 20)
          ? 50
          : 20;

  const xTicks = useMemo(() => {
    if (maxOversAxis >= 100) return [20, 40, 60, 80, 100];
    if (maxOversAxis === 50) return [10, 20, 30, 40, 50];
    if (maxOversAxis === 10) return [2, 4, 6, 8, 10];
    return [5, 10, 15, 20];
  }, [maxOversAxis]);

  const chartGeometry = useMemo(() => {
    const W = 340;
    const H = 64;
    const padLeft = 18;
    const padRight = 10;
    const padTop = 8;
    const padBot = 14;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBot;

    const currentXFrac = Math.min(1, Math.max(0.06, oversNumeric / maxOversAxis || 0.25));
    const numPoints = 18;
    const points = [];
    const wicketsToPlace = Math.min(10, Number(activeTeamStats.wickets || 0));

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const xFrac = t * currentXFrac;
      const wave =
        Math.sin(t * 9.5) * (crrVal * 0.14) +
        Math.cos(t * 5.2) * (crrVal * 0.09);
      const val = Math.max(0.2, Math.min(yMax * 0.96, crrVal * (0.45 + 0.55 * Math.sqrt(t)) + wave * (1 - t * 0.4)));
      const x = padLeft + xFrac * plotW;
      const y = padTop + plotH - (Math.min(yMax, val) / yMax) * plotH;
      points.push({ x, y, val });
    }

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

    const wicketMarkers = [];
    for (let w = 1; w <= wicketsToPlace; w++) {
      const idx = Math.min(points.length - 1, Math.max(1, Math.round((w / (wicketsToPlace + 0.4)) * (points.length - 1))));
      wicketMarkers.push(points[idx]);
    }

    return { W, H, padLeft, padRight, padTop, padBot, plotW, plotH, pathD, areaD, wicketMarkers };
  }, [oversNumeric, maxOversAxis, crrVal, yMax, activeTeamStats.wickets]);

  const currentOverWhole = Math.floor(oversNumeric);
  const currentOverBalls = Array.isArray(score.thisOver) ? score.thisOver : [];
  const prevOverBalls = Array.isArray(score.prevOver) ? score.prevOver : [];
  const prevOverNum = Math.max(1, currentOverWhole > 0 ? (oversNumeric % 1 === 0 ? currentOverWhole - 1 : currentOverWhole) : 1);
  const curOverNum = currentOverWhole > 0 ? (oversNumeric % 1 === 0 ? currentOverWhole : currentOverWhole + 1) : 1;

  const batsmenList = Array.isArray(score.batsmen) ? score.batsmen : [];
  const bowlerObj = score.bowler || null;
  const statsObj = score.inningsStats || {};
  const foursCount =
    statsObj.fours ?? batsmenList.reduce((sum, b) => sum + (Number(b.fours) || 0), 0);
  const sixesCount =
    statsObj.sixes ?? batsmenList.reduce((sum, b) => sum + (Number(b.sixes) || 0), 0);
  const extrasCount = statsObj.extras ?? 0;

  return (
    <div className="w-full rounded-sm overflow-hidden shadow-md border border-[#1a224a] bg-[#0a102b] text-white font-sans select-none">
      {/* 1. Top Broadcast Score Banner (#0b102c) */}
      <div className="relative bg-gradient-to-b from-[#080d24] to-[#0c1438] px-3 pt-0 pb-2.5 border-b border-[#1c2552]">
        {/* Top Centered INN Pill */}
        <div className="flex justify-center mb-1.5">
          <div className="bg-[#1b2245] border-x border-b border-[#2e386d] px-3 py-0.5 rounded-b text-[10px] font-bold tracking-wider text-slate-200 uppercase">
            INN {inningsNum} <span className="text-slate-400 mx-1">|</span> {oversStr} OV
          </div>
        </div>

        {/* Team Names + Center Combined Score */}
        <div className="grid grid-cols-3 items-center gap-1 text-xs sm:text-sm">
          <div className="font-bold text-white truncate text-left">{teamAName}</div>
          <div className="font-extrabold text-white text-center whitespace-nowrap text-[11px] sm:text-xs">
            <span>{teamARightLabel}</span>
            <span className="mx-1.5 text-slate-400">:</span>
            <span className={teamBRightLabel === "Yet to bat" ? "text-slate-300 font-semibold" : "text-white"}>
              {teamBRightLabel}
            </span>
          </div>
          <div className="font-bold text-white truncate text-right">{teamBName}</div>
        </div>

        {/* Centered Match Situation Status */}
        <div className="mt-1 text-center text-[10px] sm:text-[11px] text-slate-200 font-medium truncate">
          {summaryLine}
        </div>
      </div>

      {/* Collapsible Broadcast Body */}
      {!isCollapsed && (
        <>
          {/* 2. Run Rate Chart Band (#08102d) */}
          <div className="bg-[#08102d] px-3 pt-2 pb-1 border-b border-[#19224a]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                Run Rate
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedInnsTeam((prev) =>
                    prev === "active" ? (isTeamABatting ? "teamB" : "teamA") : prev === "teamA" ? "teamB" : "teamA"
                  )
                }
                className="bg-[#0e1945] hover:bg-[#15245e] border border-white/20 px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="truncate max-w-[140px]">{activeInnsDisplayTeam} INNS</span>
                <ChevronDown size={11} />
              </button>

              <span className="text-[10px] font-mono font-bold text-sky-400">
                CRR {Number(crrVal).toFixed(2)}
              </span>
            </div>

            {/* SVG Run Rate Graph */}
            <svg viewBox={`0 0 ${chartGeometry.W} ${chartGeometry.H}`} className="w-full h-[78px] sm:h-[92px] overflow-visible">
              <defs>
                <linearGradient id="bpxRunRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Y axis labels */}
              <text x="4" y={chartGeometry.padTop + 4} fill="#94a3b8" fontSize="8" fontWeight="700">
                {yMax}
              </text>
              <text x="4" y={chartGeometry.padTop + chartGeometry.plotH} fill="#94a3b8" fontSize="8" fontWeight="700">
                0
              </text>

              {/* Horizontal & Vertical dashed gridlines */}
              <line
                x1={chartGeometry.padLeft}
                y1={chartGeometry.padTop}
                x2={chartGeometry.W - chartGeometry.padRight}
                y2={chartGeometry.padTop}
                stroke="#1e2a5a"
                strokeWidth="0.7"
                strokeDasharray="2,2"
              />
              <line
                x1={chartGeometry.padLeft}
                y1={chartGeometry.padTop + chartGeometry.plotH}
                x2={chartGeometry.W - chartGeometry.padRight}
                y2={chartGeometry.padTop + chartGeometry.plotH}
                stroke="#293873"
                strokeWidth="0.9"
              />

              {xTicks.map((tick) => {
                const x = chartGeometry.padLeft + (tick / maxOversAxis) * chartGeometry.plotW;
                return (
                  <g key={tick}>
                    <line
                      x1={x}
                      y1={chartGeometry.padTop}
                      x2={x}
                      y2={chartGeometry.padTop + chartGeometry.plotH}
                      stroke="#1e2a5a"
                      strokeWidth="0.7"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={x}
                      y={chartGeometry.H - 2}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="7.5"
                      fontWeight="700"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Area + Run Rate Curve */}
              <path d={chartGeometry.areaD} fill="url(#bpxRunRateGrad)" />
              <path
                d={chartGeometry.pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Wicket [W] Markers along curve */}
              {chartGeometry.wicketMarkers.map((pt, idx) => (
                <g key={idx} transform={`translate(${pt.x - 4.5}, ${pt.y - 4.5})`}>
                  <rect width="9" height="9" rx="1.5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="0.6" />
                  <text x="4.5" y="6.8" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">
                    W
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* 3. 4-Icon Interactive Scorecard Tab Bar (#0d1433) */}
          <div className="grid grid-cols-4 bg-[#0d1433] border-b border-[#1c264f]">
            <button
              type="button"
              onClick={() => setInnerTab("live")}
              title="Live Pitch & Ball Tracker"
              className={`py-2 flex items-center justify-center cursor-pointer transition-colors border-b-2 ${
                innerTab === "live"
                  ? "border-[#e11d48] text-[#e11d48] bg-white/5"
                  : "border-transparent text-slate-300 hover:text-white"
              }`}
            >
              {/* Concentric Pitch/Target Ring Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setInnerTab("scorecard")}
              title="Batting & Bowling Details"
              className={`py-2 flex items-center justify-center cursor-pointer transition-colors border-b-2 ${
                innerTab === "scorecard"
                  ? "border-[#e11d48] text-[#e11d48] bg-white/5"
                  : "border-transparent text-slate-300 hover:text-white"
              }`}
            >
              <List size={16} />
            </button>

            <button
              type="button"
              onClick={() => setInnerTab("stats")}
              title="Period & Run Rate Breakdown"
              className={`py-2 flex items-center justify-center cursor-pointer transition-colors border-b-2 ${
                innerTab === "stats"
                  ? "border-[#e11d48] text-[#e11d48] bg-white/5"
                  : "border-transparent text-slate-300 hover:text-white"
              }`}
            >
              <BarChart2 size={16} />
            </button>

            <button
              type="button"
              onClick={() => setInnerTab("info")}
              title="Match & Toss Info"
              className={`py-2 flex items-center justify-center cursor-pointer transition-colors border-b-2 ${
                innerTab === "info"
                  ? "border-[#e11d48] text-[#e11d48] bg-white/5"
                  : "border-transparent text-slate-300 hover:text-white"
              }`}
            >
              <Users size={16} />
            </button>
          </div>

          {/* 4. Tab Content */}
          {innerTab === "live" && (
            <div>
              {/* Two-Column Recent Overs Strip (#223a1d) */}
              <div className="grid grid-cols-2 bg-[#233b1d] border-b border-[#3a5c2f] text-white text-[10px]">
                <div className="px-2.5 py-2 border-r border-white/15 flex flex-col items-center gap-1.5">
                  <span className="font-bold tracking-wider text-slate-200 uppercase">
                    OVER {prevOverNum}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {(prevOverBalls.length > 0 ? prevOverBalls : ["•", "•", "•", "•", "•", "•"]).map((b, i) =>
                      renderBallBadge(b, i)
                    )}
                  </div>
                </div>

                <div className="px-2.5 py-2 flex flex-col items-center gap-1.5">
                  <span className="font-bold tracking-wider text-slate-200 uppercase">
                    OVER {curOverNum}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {(currentOverBalls.length > 0 ? currentOverBalls : ["•", "•", "•", "•", "•", "•"]).map((b, i) =>
                      renderBallBadge(b, i)
                    )}
                  </div>
                </div>
              </div>

              {/* Green Grass Broadcast Pitch Panel */}
              <div className="relative bg-gradient-to-b from-[#3d6c21] via-[#4a7f28] to-[#39671e] px-3 py-3 overflow-hidden">
                {/* Perspective Cricket Pitch + Stumps + Ball Path SVG Graphic (No fake video button) */}
                <svg
                  viewBox="0 0 360 150"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                >
                  {/* Perspective Tan Pitch Strip */}
                  <polygon points="150,55 210,55 255,150 105,150" fill="#a88e58" opacity="0.55" />
                  <line x1="125" y1="122" x2="235" y2="122" stroke="#ffffff" strokeWidth="1.2" opacity="0.65" />
                  <line x1="142" y1="78" x2="218" y2="78" stroke="#ffffff" strokeWidth="0.9" opacity="0.45" />
                  {/* Stumps */}
                  <g stroke="#e2e8f0" strokeWidth="2.2" opacity="0.8">
                    <line x1="92" y1="100" x2="92" y2="132" />
                    <line x1="98" y1="100" x2="98" y2="132" />
                    <line x1="104" y1="100" x2="104" y2="132" />
                    <line x1="91" y1="100" x2="105" y2="100" />
                  </g>
                  {/* Ball seam trajectory arc */}
                  <polyline
                    points="22,126 168,94 254,132 345,102"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="1.6"
                    opacity="0.7"
                  />
                  <circle cx="168" cy="94" r="3" fill="#dc2626" opacity="0.9" />
                </svg>

                {/* Active Batter Table Overlay */}
                <div className="relative z-10 mb-3.5">
                  <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-white/85 pb-1">
                    <div className="col-span-6">Batter</div>
                    <div className="col-span-1 text-right">R</div>
                    <div className="col-span-2 text-right">B</div>
                    <div className="col-span-1 text-right">4S</div>
                    <div className="col-span-2 text-right">6S</div>
                  </div>

                  {batsmenList.length > 0 ? (
                    batsmenList.slice(0, 2).map((b, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center text-xs font-extrabold text-white py-0.5">
                        <div className="col-span-6 flex items-center gap-1.5 truncate pr-1">
                          <span className="truncate">{b.name}</span>
                          {idx === 0 && (
                            <span title="On Strike" className="text-white/95 text-[11px] shrink-0">
                              🏏
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 text-right font-mono">{b.runs ?? 0}</div>
                        <div className="col-span-2 text-right font-mono text-white/90">{b.balls ?? 0}</div>
                        <div className="col-span-1 text-right font-mono text-white/90">{b.fours ?? 0}</div>
                        <div className="col-span-2 text-right font-mono text-white/90">{b.sixes ?? 0}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] font-semibold text-white/75 py-1">
                      Waiting for live batter feed...
                    </div>
                  )}
                </div>

                {/* Current Bowler & Innings Stats 2-Column Row */}
                <div className="relative z-10 grid grid-cols-2 gap-3 pt-1">
                  {/* Left: Current Bowler */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/85 mb-1">
                      Current Bowler
                    </span>
                    {bowlerObj ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-white truncate">{bowlerObj.name}</div>
                        <div className="text-[11px] font-mono font-bold text-white/90">
                          {bowlerObj.overs}-{bowlerObj.maidens}-{bowlerObj.runs}-{bowlerObj.wickets}{" "}
                          <span className="text-amber-200">(ECON {bowlerObj.economy})</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-white/75">--</span>
                    )}

                    {score.lastBall && (
                      <div className="mt-2 bg-black/35 border border-white/15 rounded px-2 py-1 text-[10px] text-white/95 font-semibold line-clamp-2">
                        {cleanCommentary(score.lastBall)}
                      </div>
                    )}
                  </div>

                  {/* Right: Innings Stats */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/85 mb-1">
                      Innings Stats
                    </span>
                    <div className="space-y-1 text-xs font-bold text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-white/90">Fours</span>
                        <span className="font-mono font-extrabold">{foursCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/90">Sixes</span>
                        <span className="font-mono font-extrabold">{sixesCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/90">Extras</span>
                        <span className="font-mono font-extrabold">{extrasCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Detailed Batters & Bowler List */}
          {innerTab === "scorecard" && (
            <div className="bg-[#0e1738] p-3 space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 border-b border-white/10 pb-1 mb-1">
                  <span>Active Batters</span>
                  <span>R (B) • 4s/6s • SR</span>
                </div>
                {batsmenList.length > 0 ? (
                  batsmenList.map((b, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-white/5 font-bold">
                      <span className="text-white truncate">{b.name} *</span>
                      <span className="font-mono text-emerald-300">
                        {b.runs} ({b.balls}) • {b.fours}/{b.sixes} • SR {b.strikeRate}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-[11px] italic py-1">No batter data yet</p>
                )}
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 border-b border-white/10 pb-1 mb-1">
                  <span>Current Bowler</span>
                  <span>O-M-R-W • Econ</span>
                </div>
                {bowlerObj ? (
                  <div className="flex justify-between py-1 font-bold">
                    <span className="text-white truncate">{bowlerObj.name}</span>
                    <span className="font-mono text-sky-300">
                      {bowlerObj.overs}-{bowlerObj.maidens}-{bowlerObj.runs}-{bowlerObj.wickets} • {bowlerObj.economy}
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px] italic py-1">No bowler data yet</p>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Stats & Period Breakdown */}
          {innerTab === "stats" && (
            <div className="bg-[#0e1738] p-3 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#15204d] border border-white/10 rounded p-2 text-center">
                  <div className="text-[9px] uppercase text-slate-400 font-bold">CRR</div>
                  <div className="text-sm font-black text-emerald-400">{score.runRate || "0.00"}</div>
                </div>
                <div className="bg-[#15204d] border border-white/10 rounded p-2 text-center">
                  <div className="text-[9px] uppercase text-slate-400 font-bold">RRR</div>
                  <div className="text-sm font-black text-amber-400">{score.reqRunRate || "0.00"}</div>
                </div>
                <div className="bg-[#15204d] border border-white/10 rounded p-2 text-center">
                  <div className="text-[9px] uppercase text-slate-400 font-bold">Target</div>
                  <div className="text-sm font-black text-sky-400">{score.target || 0}</div>
                </div>
              </div>

              {score.periods && Object.keys(score.periods).length > 0 && (
                <table className="w-full text-left text-[11px] border border-white/10 rounded overflow-hidden">
                  <thead className="bg-[#182557] text-slate-300 uppercase text-[9px]">
                    <tr>
                      <th className="py-1.5 px-2">Innings</th>
                      <th className="py-1.5 px-2">{teamAName}</th>
                      <th className="py-1.5 px-2">{teamBName}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {Object.entries(score.periods)
                      .sort(([a], [b]) => (a === "0" ? 1 : b === "0" ? -1 : a.localeCompare(b)))
                      .map(([k, p]) => (
                        <tr key={k}>
                          <td className="py-1 px-2 text-slate-300 font-semibold">
                            {k === "0" ? "Total" : `Innings ${k}`}
                          </td>
                          <td className="py-1 px-2 font-mono font-bold text-white">{p?.participant1Score ?? 0}</td>
                          <td className="py-1 px-2 font-mono font-bold text-white">{p?.participant2Score ?? 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Sub-Tab 4: Match & Toss Info */}
          {innerTab === "info" && (
            <div className="bg-[#0e1738] p-3 space-y-2 text-xs text-slate-200">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Tournament</span>
                <span className="font-bold text-white">{actualMatch?.league || "Cricket"}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Format</span>
                <span className="font-bold text-amber-300">{actualMatch?.format || score.format || "Cricket"}</span>
              </div>
              {actualMatch?.tossWinner && (
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Toss</span>
                  <span className="font-bold text-emerald-300">
                    {actualMatch.tossWinner}
                    {actualMatch.tossDecision ? ` (${actualMatch.tossDecision})` : ""}
                  </span>
                </div>
              )}
              {scoreAgeSec > 60 && actualMatch?.status === "live" && (
                <div className="text-[10px] text-rose-300 font-bold">
                  Feed updated {Math.floor(scoreAgeSec / 60)}m {scoreAgeSec % 60}s ago
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 5. Bottom Crimson Chevron Collapse Bar (#0d1433) */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand Scorecard" : "Collapse Scorecard"}
        className="w-full h-6 bg-[#0d1433] hover:bg-[#131d47] border-t border-white/10 flex items-center justify-center text-[#e11d48] cursor-pointer transition-colors"
      >
        {isCollapsed ? <ChevronDown size={15} strokeWidth={2.5} /> : <ChevronUp size={15} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
