"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDashboard } from "../../../components/DashboardLayout";
import { useTeenPattiStore } from "../../../lib/useTeenPattiStore";
import { getApiUrl, getAuthToken } from "../../../lib/apiConfig";
import TeenPattiDealer from "../../../components/teenpatti/TeenPattiDealer";
import TeenPattiBettingBoard from "../../../components/teenpatti/TeenPattiBettingBoard";
import TeenPattiSideBets from "../../../components/teenpatti/TeenPattiSideBets";
import TeenPattiOpenBets from "../../../components/teenpatti/TeenPattiOpenBets";
import TeenPattiHowToPlay from "../../../components/teenpatti/TeenPattiHowToPlay";
import { soundFX } from "../../../lib/casinoSoundFX";
import { BookOpen, Volume2, VolumeX } from "lucide-react";

const getSessionUser = () => {
  if (typeof window === "undefined") return "";
  try {
    return JSON.parse(localStorage.getItem("user_session") || "{}").username || "";
  } catch {
    return "";
  }
};

export default function TeenPattiPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();

  const roundId = useTeenPattiStore((s) => s.roundId);
  const status = useTeenPattiStore((s) => s.status);
  const timer = useTeenPattiStore((s) => s.timer);
  const maxTimer = useTeenPattiStore((s) => s.maxTimer);
  const cards = useTeenPattiStore((s) => s.cards);
  const handNames = useTeenPattiStore((s) => s.handNames);
  const result = useTeenPattiStore((s) => s.result);
  const seedHash = useTeenPattiStore((s) => s.seedHash);
  const history = useTeenPattiStore((s) => s.history);
  const userBets = useTeenPattiStore((s) => s.userBets);

  const setGameState = useTeenPattiStore((s) => s.setGameState);
  const pushHistory = useTeenPattiStore((s) => s.pushHistory);
  const addUserBet = useTeenPattiStore((s) => s.addUserBet);
  const syncUserBets = useTeenPattiStore((s) => s.syncUserBets);
  const clearUserBets = useTeenPattiStore((s) => s.clearUserBets);

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [selectedChip, setSelectedChip] = useState("100");
  const [stakeAmount, setStakeAmount] = useState("100");
  const [use1Click, setUse1Click] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [payoutNotification, setPayoutNotification] = useState(null);

  const joinedRef = useRef(false);
  const prevRoundIdRef = useRef(null);

  useEffect(() => {
    soundFX.setMuted(isMuted);
  }, [isMuted]);

  const showToastError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3500);
  }, []);

  const fetchActiveBets = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/teenpatti/active-bets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const bets = await res.json();
        if (Array.isArray(bets)) syncUserBets(bets);
      }
    } catch {}
  }, [syncUserBets]);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/teenpatti/state`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (prevRoundIdRef.current && data.roundId && prevRoundIdRef.current !== data.roundId) {
            clearUserBets();
            setSelectedChoice(null);
          }
          if (data.roundId) prevRoundIdRef.current = data.roundId;
          setGameState(data);
        }
      }
    } catch {}
  }, [setGameState, clearUserBets]);

  useEffect(() => {
    fetchGameState();
    fetchActiveBets();
  }, [fetchGameState, fetchActiveBets]);

  // Socket room listeners ONLY while joined ("Ready to Start")
  useEffect(() => {
    if (!socket || !isJoined) return;

    const userId = getSessionUser();
    if (socket.connected) {
      socket.emit("join_teenpatti");
      socket.emit("teenpatti_ready", { userId });
    }

    const handleConnect = () => {
      if (joinedRef.current) {
        socket.emit("join_teenpatti");
        socket.emit("teenpatti_ready", { userId: getSessionUser() });
      }
    };

    const handleState = (data) => {
      if (!data) return;
      if (prevRoundIdRef.current && data.roundId && prevRoundIdRef.current !== data.roundId) {
        clearUserBets();
        setSelectedChoice(null);
      }
      if (data.roundId) prevRoundIdRef.current = data.roundId;
      setGameState(data);
    };

    const handleRoundStart = (r) => {
      prevRoundIdRef.current = r.roundId;
      clearUserBets();
      setSelectedChoice(null);
      setGameState(r);
      soundFX.playCardFlip();
    };

    const handleClosed = (r) => {
      setGameState({
        status: "BETTING_CLOSED",
        cards: r?.cards,
        timer: r?.timer ?? 4,
        maxTimer: r?.maxTimer ?? 4,
      });
    };

    const handleResult = (r) => {
      setGameState({
        status: "RESULT_DECLARED",
        result: r.result,
        cards: r.cards,
        handNames: r.handNames,
      });
      if (Array.isArray(r.history)) {
        setGameState({ history: r.history });
      } else if (r.result) {
        pushHistory(r.result);
      }
      soundFX.playCardFlip();
    };

    const handlePayout = (data) => {
      fetchWallet();
      if (data.result === "WIN") {
        soundFX.playWinChime();
      } else {
        soundFX.playLossTick();
      }
      setPayoutNotification(data);
      setTimeout(() => setPayoutNotification(null), 4000);
    };

    socket.on("connect", handleConnect);
    socket.on("teenpatti_state", handleState);
    socket.on("teenpatti_round_start", handleRoundStart);
    socket.on("teenpatti_betting_closed", handleClosed);
    socket.on("teenpatti_result_declared", handleResult);
    socket.on("teenpatti_payout", handlePayout);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("teenpatti_state", handleState);
      socket.off("teenpatti_round_start", handleRoundStart);
      socket.off("teenpatti_betting_closed", handleClosed);
      socket.off("teenpatti_result_declared", handleResult);
      socket.off("teenpatti_payout", handlePayout);
    };
  }, [socket, isJoined, setGameState, pushHistory, clearUserBets, fetchWallet]);

  // REST polling fallback ONLY when joined AND socket disconnected
  useEffect(() => {
    if (!isJoined) return;
    const poll = setInterval(() => {
      if (!socket || !socket.connected) {
        fetchGameState();
      }
    }, 1500);
    return () => clearInterval(poll);
  }, [isJoined, socket, fetchGameState]);

  // Leave cleanly on route unmount
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        const userId = getSessionUser();
        const token = getAuthToken();
        if (socket?.connected) {
          socket.emit("leave_teenpatti", { userId });
        }
        if (token) {
          fetch(`${getApiUrl()}/api/teenpatti/leave`, {
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

    joinedRef.current = true;
    setIsJoined(true);
    const userId = getSessionUser();
    const token = getAuthToken();

    if (socket?.connected) {
      socket.emit("join_teenpatti");
      socket.emit("teenpatti_ready", { userId });
    }

    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/teenpatti/ready`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.state) setGameState(data.state);
        }
      } catch {}
    }

    fetchActiveBets();
    setIsStarting(false);
  };

  const handleLeaveTable = async () => {
    soundFX.playChipClick();
    joinedRef.current = false;
    setIsJoined(false);
    setSelectedChoice(null);

    const userId = getSessionUser();
    const token = getAuthToken();
    if (socket?.connected) {
      socket.emit("leave_teenpatti", { userId });
    }
    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/teenpatti/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.state) setGameState(data.state);
        }
      } catch {}
    }
  };

  const executeBet = useCallback(
    async (betType, amountVal) => {
      if (isSubmitting) return;
      const token = getAuthToken();
      if (!token) {
        showToastError("Please log in to place bets");
        return;
      }

      setIsSubmitting(true);
      soundFX.playChipClick();
      try {
        const res = await fetch(`${getApiUrl()}/api/teenpatti/bet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ betType, amount: amountVal }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToastError(data.error || "Bet placement failed");
        } else {
          if (data.bet) addUserBet(data.bet);
          fetchWallet();
          setSelectedChoice(null);
          setPayoutNotification({
            result: "PLACED",
            betType,
            amount: amountVal,
          });
          setTimeout(() => setPayoutNotification(null), 2200);
        }
      } catch {
        showToastError("Network error placing bet");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, addUserBet, fetchWallet, showToastError]
  );

  const handleSelectBetType = (betType) => {
    if (!isJoined || status !== "BETTING_OPEN") return;
    soundFX.playChipClick();
    const chipVal = parseFloat(selectedChip) || 100;
    setStakeAmount(selectedChip);

    if (use1Click) {
      executeBet(betType, chipVal);
    } else {
      setSelectedChoice(betType);
    }
  };

  const handleSubmitBet = async () => {
    if (!selectedChoice) return;
    const amt = parseFloat(stakeAmount);
    if (!amt || isNaN(amt) || amt < 10) {
      showToastError("Minimum stake amount is ₹10");
      return;
    }
    await executeBet(selectedChoice, amt);
  };

  const roundState = {
    roundId,
    status,
    timer,
    maxTimer,
    cards,
    handNames,
    result,
    seedHash,
  };
  const isBettingOpen = isJoined && status === "BETTING_OPEN";

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#070b12] text-white p-2.5 sm:p-4 lg:p-6 flex flex-col gap-3.5 sm:gap-5 font-sans select-none">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d1420] border border-slate-800 rounded-2xl px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              socket?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-amber-400">
            Teen Patti 20-20
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-black text-emerald-400">
            ₹{Number(walletBalance || 0).toLocaleString("en-IN")}
          </div>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
          >
            <BookOpen size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {isJoined && (
            <button
              type="button"
              onClick={handleLeaveTable}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase hover:bg-rose-600/35 cursor-pointer"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-rose-950 border border-rose-500/60 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold z-[120] shadow-2xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {payoutNotification && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[110] px-5 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-2.5 ${
            payoutNotification.result === "WIN"
              ? "bg-emerald-950/95 border-emerald-400 text-emerald-200"
              : payoutNotification.result === "PLACED"
                ? "bg-slate-900/95 border-amber-400 text-amber-200"
                : "bg-rose-950/95 border-rose-500 text-rose-200"
          }`}
        >
          <span className="text-lg">
            {payoutNotification.result === "WIN" ? "🏆" : payoutNotification.result === "PLACED" ? "🪙" : "🃏"}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">
              {payoutNotification.result === "WIN"
                ? "You Won!"
                : payoutNotification.result === "PLACED"
                  ? "Bet Placed"
                  : "Round Settled"}
            </span>
            <span className="text-xs font-mono font-bold">
              {payoutNotification.result === "WIN"
                ? `+₹${Number(payoutNotification.amount || 0).toLocaleString("en-IN")} Credited`
                : `₹${Number(payoutNotification.amount || 0).toLocaleString("en-IN")} (${payoutNotification.betType})`}
            </span>
          </div>
        </div>
      )}

      {/* Main Responsive Table + Betting Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5 items-start">
        <div className="lg:col-span-2 flex flex-col space-y-3.5 sm:space-y-5 w-full">
          <TeenPattiDealer round={roundState} history={history} />
          <TeenPattiBettingBoard
            round={roundState}
            onSelectBet={handleSelectBetType}
            selectedChoice={selectedChoice}
            userBets={userBets}
            selectedChip={selectedChip}
            setSelectedChip={(val) => {
              setSelectedChip(val);
              setStakeAmount(val);
            }}
            use1Click={use1Click}
            setUse1Click={setUse1Click}
          />
        </div>

        <div className="flex flex-col space-y-3.5 sm:space-y-5 w-full">
          <div className="hidden lg:block">
            <TeenPattiOpenBets
              userBets={userBets}
              selectedChoice={selectedChoice}
              stakeAmount={stakeAmount}
              onChangeStake={setStakeAmount}
              onSubmitBet={handleSubmitBet}
              onCancel={() => setSelectedChoice(null)}
              isBettingOpen={isBettingOpen}
              isSubmitting={isSubmitting}
            />
          </div>

          <TeenPattiSideBets
            round={roundState}
            onSelectBet={handleSelectBetType}
            selectedChoice={selectedChoice}
            userBets={userBets}
          />

          {/* Mobile Active Bets List (always visible cleanly below Side Bets on mobile) */}
          <div className="lg:hidden">
            <TeenPattiOpenBets
              userBets={userBets}
              selectedChoice={null}
              stakeAmount={stakeAmount}
              onChangeStake={setStakeAmount}
              onSubmitBet={handleSubmitBet}
              onCancel={() => setSelectedChoice(null)}
              isBettingOpen={isBettingOpen}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        {/* Ready to Start Overlay Gate */}
        {!isJoined && (
          <div className="absolute inset-0 z-40 bg-[#050911]/85 backdrop-blur-md rounded-3xl flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl">
                🃏
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                  Exchange Teen Patti
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Back, Lay & Pair Plus
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Play Player A vs B with <strong className="text-blue-400">Back</strong> & <strong className="text-rose-400">Lay</strong> at 1.98 plus up to <strong className="text-amber-400">45:1 Pair Plus</strong> payouts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReadyToStart}
                disabled={isStarting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-[0.18em] shadow-[0_10px_30px_-5px_rgba(16,185,129,0.55)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
              >
                <span>▶</span>
                <span>{isStarting ? "Starting Table..." : "Ready to Start"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Bet Slip (opens immediately on mobile tap when 1-Click is OFF) */}
      {isJoined && selectedChoice && !use1Click && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3">
          <div className="w-full max-w-md">
            <TeenPattiOpenBets
              userBets={userBets}
              selectedChoice={selectedChoice}
              stakeAmount={stakeAmount}
              onChangeStake={setStakeAmount}
              onSubmitBet={handleSubmitBet}
              onCancel={() => setSelectedChoice(null)}
              isBettingOpen={isBettingOpen}
              isSubmitting={isSubmitting}
              isMobileModal={true}
            />
          </div>
        </div>
      )}

      <TeenPattiHowToPlay isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
