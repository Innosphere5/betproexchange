"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getApiUrl, getAuthToken } from "@/lib/apiConfig";
import { useDashboard } from "../../../components/DashboardLayout";
import CasinoLayout from "../../../components/casino/CasinoLayout";
import DealerSection from "../../../components/casino/DealerSection";
import TableSection from "../../../components/casino/TableSection";
import BettingBar from "../../../components/casino/BettingBar";
import BetPanel from "../../../components/casino/BetPanel";
import TeenPattiHowToPlay from "../../../components/teenpatti/TeenPattiHowToPlay";
import { soundFX } from "../../../lib/casinoSoundFX";
import { ChevronDown, ChevronUp } from "lucide-react";

const getSessionUsername = () => {
  if (typeof window === "undefined") return "";
  try {
    return JSON.parse(localStorage.getItem("user_session") || "{}").username || "";
  } catch {
    return "";
  }
};

export default function CasinoPage() {
  const { socket, fetchWallet } = useDashboard();
  const [round, setRound] = useState({
    roundId: null,
    status: "IDLE",
    timer: 0,
    maxTimer: 0,
    result: null,
    cards: null,
    handNames: null,
    seedHash: null,
  });
  const [amount, setAmount] = useState("100");
  const [history, setHistory] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeBets, setActiveBets] = useState([]);
  const [lastBet, setLastBet] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMobileBets, setShowMobileBets] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const readyRef = useRef(false);
  const prevRoundIdRef = useRef(null);
  const amountInputRef = useRef(null);

  useEffect(() => {
    soundFX.setMuted(isMuted);
  }, [isMuted]);

  const showError = useCallback((msg) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 3500);
  }, []);

  const fetchActiveBets = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/casino/active-bets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const bets = await res.json();
        if (Array.isArray(bets)) setActiveBets(bets);
      }
    } catch {}
  }, []);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/casino/state`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (prevRoundIdRef.current && data.roundId && prevRoundIdRef.current !== data.roundId) {
            setActiveBets([]);
          }
          if (data.roundId) prevRoundIdRef.current = data.roundId;
          setRound((prev) => ({ ...prev, ...data }));
          if (Array.isArray(data.history)) {
            setHistory(data.history);
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchGameState();
    fetchActiveBets();
  }, [fetchGameState, fetchActiveBets]);

  useEffect(() => {
    if (!socket || !isReady) return;

    const userId = getSessionUsername();
    if (socket.connected) {
      socket.emit("join_casino");
      socket.emit("casino_ready", { userId });
    }

    const handleConnect = () => {
      if (readyRef.current) {
        socket.emit("join_casino");
        socket.emit("casino_ready", { userId: getSessionUsername() });
      }
    };

    const syncState = (state) => {
      if (!state) return;
      if (prevRoundIdRef.current && state.roundId && prevRoundIdRef.current !== state.roundId) {
        setActiveBets([]);
      }
      if (state.roundId) prevRoundIdRef.current = state.roundId;
      setRound(state);
      if (Array.isArray(state.history)) setHistory(state.history);
    };

    const onStart = (r) => {
      prevRoundIdRef.current = r.roundId;
      setRound(r);
      setActiveBets([]);
      soundFX.playCardFlip();
    };

    const onClose = (r) => {
      setRound((prev) => ({
        ...prev,
        status: "BETTING_CLOSED",
        cards: r?.cards || prev.cards,
        timer: r?.timer ?? prev.timer,
        maxTimer: r?.maxTimer ?? prev.maxTimer,
      }));
    };

    const onResult = (r) => {
      setRound((prev) => ({
        ...prev,
        status: "RESULT_DECLARED",
        result: r.result,
        cards: r.cards,
        handNames: r.handNames,
        serverSeed: r.serverSeed,
      }));
      if (Array.isArray(r.history)) {
        setHistory(r.history);
      } else if (r.result) {
        setHistory((prev) => [r.result, ...prev].slice(0, 24));
      }
      soundFX.playCardFlip();
    };

    const onPayout = (data) => {
      // Settle quietly to wallet in Header — no win/lose popup banner at header
      fetchWallet();
      if (data.result === "WIN") {
        soundFX.playWinChime();
      } else {
        soundFX.playLossTick();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("casino_state", syncState);
    socket.on("casino_round_start", onStart);
    socket.on("casino_betting_closed", onClose);
    socket.on("casino_result_declared", onResult);
    socket.on("casino_wallet_payout", onPayout);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("casino_state", syncState);
      socket.off("casino_round_start", onStart);
      socket.off("casino_betting_closed", onClose);
      socket.off("casino_result_declared", onResult);
      socket.off("casino_wallet_payout", onPayout);
    };
  }, [socket, isReady, fetchWallet]);

  useEffect(() => {
    if (!isReady) return;
    const pollId = setInterval(() => {
      if (!socket || !socket.connected) {
        fetchGameState();
      }
    }, 1500);
    return () => clearInterval(pollId);
  }, [isReady, socket, fetchGameState]);

  useEffect(() => {
    return () => {
      if (readyRef.current) {
        const userId = getSessionUsername();
        const token = getAuthToken();
        if (socket?.connected) {
          socket.emit("leave_casino", { userId });
        }
        if (token) {
          fetch(`${getApiUrl()}/api/casino/leave`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            keepalive: true,
          }).catch(() => {});
        }
      }
    };
  }, [socket]);

  const handleReadyToStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    soundFX.init();
    soundFX.playChipClick();

    const userId = getSessionUsername();
    const token = getAuthToken();
    readyRef.current = true;
    setIsReady(true);

    if (socket?.connected) {
      socket.emit("join_casino");
      socket.emit("casino_ready", { userId });
    }

    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/casino/ready`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.state) {
            setRound(data.state);
            if (Array.isArray(data.state.history)) setHistory(data.state.history);
          }
        }
      } catch {}
    }

    fetchActiveBets();
    setIsStarting(false);
  };

  const handleLeaveTable = async () => {
    soundFX.playChipClick();
    readyRef.current = false;
    setIsReady(false);

    const userId = getSessionUsername();
    const token = getAuthToken();

    if (socket?.connected) {
      socket.emit("leave_casino", { userId });
    }

    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/casino/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.state) setRound(data.state);
        }
      } catch {}
    }
  };

  const executeBet = useCallback(
    async (choice, betVal) => {
      if (isSubmitting) return;
      const token = getAuthToken();
      if (!token) {
        showError("Please log in to place a bet");
        return;
      }

      setIsSubmitting(true);
      soundFX.playChipClick();
      try {
        const res = await fetch(`${getApiUrl()}/api/casino/bet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ choice, amount: betVal }),
        });
        const data = await res.json();
        if (!res.ok) {
          showError(data.error || "Failed to place bet");
        } else {
          if (data.bet) {
            setActiveBets((prev) => [data.bet, ...prev]);
          }
          if (typeof data.timer === "number") {
            setRound((prev) => ({ ...prev, timer: data.timer }));
          }
          setLastBet({ choice, amount: betVal });
          fetchWallet();
        }
      } catch {
        showError("Network error while placing bet");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, fetchWallet, showError]
  );

  const handleBetClick = (choice) => {
    if (!isReady || round?.status !== "BETTING_OPEN" || activeBets.length > 0) return;
    const betVal = parseFloat(amount);
    if (!amount || isNaN(betVal) || betVal < 10) {
      showError("Type a valid bet amount (Minimum ₹10)");
      amountInputRef.current?.focus();
      return;
    }
    executeBet(choice, betVal);
  };

  const hasPlacedBet = activeBets.length > 0;
  const placedBet = activeBets[0] || null;

  const stakeByChoice = useMemo(() => {
    return activeBets.reduce(
      (acc, b) => {
        if (b.choice === "A") acc.A += Number(b.amount) || 0;
        if (b.choice === "B") acc.B += Number(b.amount) || 0;
        return acc;
      },
      { A: 0, B: 0 }
    );
  }, [activeBets]);

  const isBettingOpen = isReady && round?.status === "BETTING_OPEN";

  return (
    <div className="relative w-full min-h-full bg-[#070d16] text-white font-sans select-none">
      {/* Error Toast */}
      {errorBanner && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[120] bg-rose-950 border border-rose-500/60 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl">
          ⚠️ {errorBanner}
        </div>
      )}

      <CasinoLayout
        leftContent={
          <div className="relative flex flex-col flex-1">
            {/* Single Compact Top Utility Strip */}
            <DealerSection
              round={round}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              isConnected={Boolean(socket?.connected)}
              isReady={isReady}
              onLeave={handleLeaveTable}
              onOpenRules={() => setShowRules(true)}
            />

            {/* Main Felt Table */}
            <TableSection
              round={round}
              stakeByChoice={stakeByChoice}
              isBettingOpen={isBettingOpen}
            />

            {/* Typed Stake Box + Bet Player A / Bet Player B */}
            <BettingBar
              handleBetClick={handleBetClick}
              lock={!isBettingOpen}
              roundStatus={round?.status}
              amount={amount}
              setAmount={setAmount}
              lastBet={lastBet}
              onRebet={() => lastBet && executeBet(lastBet.choice, lastBet.amount)}
              isSubmitting={isSubmitting}
              hasPlacedBet={hasPlacedBet}
              placedBet={placedBet}
              inputRef={amountInputRef}
            />

            {/* Mobile Compact Results Bead Strip + Expandable My Bets */}
            <div className="lg:hidden bg-[#060b12] border-t border-white/10 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] font-black uppercase text-slate-500 mr-1 shrink-0">
                    Results:
                  </span>
                  {history.length > 0 ? (
                    history.slice(0, 10).map((r, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center shrink-0 border ${
                          r === "A"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/35"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/35"
                        }`}
                      >
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-600">—</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileBets(!showMobileBets)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 shrink-0"
                >
                  <span>My Bets ({activeBets.length})</span>
                  {showMobileBets ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {showMobileBets && (
                <div className="bg-[#0c1420] border border-slate-800 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto">
                  {activeBets.length > 0 ? (
                    activeBets.map((b, idx) => (
                      <div
                        key={b._id || idx}
                        className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/70 text-[11px]"
                      >
                        <span className={`font-black ${b.choice === "A" ? "text-blue-400" : "text-rose-400"}`}>
                          Player {b.choice} @ {Number(b.odds || 1.98).toFixed(2)}
                        </span>
                        <span className="font-mono font-bold text-white">
                          ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-1">
                      No bets in current round
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ready to Start Gate Overlay ("Casino Gameplay" with real casino table artwork) */}
            {!isReady && (
              <div className="absolute inset-0 z-40 bg-[#050911]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
                <div className="w-full max-w-md bg-[#0b1322] border border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_0_55px_rgba(245,158,11,0.25)]">
                  {/* Real Casino Table Hero Artwork */}
                  <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-[#071510]">
                    <img
                      src="/images/casino_gameplay.jpg"
                      alt="Casino Gameplay Table"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Table Ready
                    </div>
                  </div>

                  {/* Body & Ready CTA */}
                  <div className="p-5 sm:p-6 pt-3 text-center space-y-4">
                    <div className="space-y-1.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic">
                        Casino Gameplay
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        3-card live table • 15s betting window • 5s suspense reveal at <strong className="text-amber-400">1.98x</strong> odds
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleReadyToStart}
                      disabled={isStarting}
                      className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-[0.18em] shadow-[0_10px_30px_-5px_rgba(16,185,129,0.55)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <span>▶</span>
                      <span>{isStarting ? "Starting Table..." : "Ready to Start"}</span>
                    </button>

                    {history.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Recent:</span>
                        {history.slice(0, 8).map((r, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center border ${
                              r === "A"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        }
        rightContent={
          <BetPanel
            amount={amount}
            history={history}
            activeBets={activeBets}
          />
        }
      />

      <TeenPattiHowToPlay isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
