import { create } from 'zustand';

export const useAviatorStore = create((set, get) => ({
  roundId: '',
  phase: 'INIT', // INIT, BETTING, FLYING, CRASHED
  elapsedMs: 0,
  multiplier: 1.00,
  timer: 0,
  serverSeedHash: '',
  serverSeed: null,
  crashPoint: null,
  history: [],
  liveBets: [],
  
  // Dual bet state
  bets: {
    1: { active: false, stake: 0, autoCashoutMultiplier: '', status: 'NONE', payout: 0, cashoutMultiplier: null },
    2: { active: false, stake: 0, autoCashoutMultiplier: '', status: 'NONE', payout: 0, cashoutMultiplier: null }
  },

  setGameState: (state) => set((prev) => {
    // Merge incoming state with existing state to support partial updates safely
    const merged = { ...prev, ...state };
    
    // Only detect a round change if both the previous and new roundId are valid and different
    const roundChanged = prev.roundId && state.roundId && prev.roundId !== state.roundId;
    
    // Deep copy bets to prevent direct state mutations
    const newBets = {
      1: { ...prev.bets[1] },
      2: { ...prev.bets[2] }
    };
    
    if (roundChanged) {
      // Clear all bet slots for the new round
      [1, 2].forEach(slot => {
        newBets[slot] = {
          active: false,
          stake: 0,
          autoCashoutMultiplier: '',
          status: 'NONE',
          payout: 0,
          cashoutMultiplier: null
        };
      });
    } else if (merged.phase === 'CRASHED') {
      // Mark any still pending bets as lost when round crashes
      // IMPORTANT: Never overwrite a 'WON' status — the cashout_success socket
      // event may arrive before or after the CRASHED state update.
      [1, 2].forEach(slot => {
        if (newBets[slot].status === 'PENDING') {
          newBets[slot].status = 'LOST';
        }
        // If status is already 'WON', leave it untouched
      });
    }

    return {
      ...merged,
      bets: newBets,
      // If round changed, reset live bets
      liveBets: roundChanged ? [] : (state.liveBets || prev.liveBets)
    };
  }),

  // Add a newly placed bet (social players or current user)
  addLiveBet: (bet) => set((prev) => {
    const isBot = bet.userId.includes('***') || !bet.userId.match(/^[a-zA-Z0-9]+$/);
    const formattedBet = {
      username: bet.userId.includes('***') ? bet.userId : (bet.userId.substring(0, 4) + '***'),
      stake: bet.stake,
      autoCashoutMultiplier: bet.autoCashoutMultiplier,
      cashed: false,
      multiplier: null,
      payout: 0
    };
    return {
      liveBets: [formattedBet, ...prev.liveBets].slice(0, 50)
    };
  }),

  // Mark a player as cashed out
  markLiveCashout: (cashout) => set((prev) => {
    const targetUser = cashout.userId.includes('***') ? cashout.userId : (cashout.userId.substring(0, 4) + '***');
    return {
      liveBets: prev.liveBets.map(bet => {
        if (bet.username === targetUser) {
          return {
            ...bet,
            cashed: true,
            multiplier: cashout.multiplier,
            payout: cashout.payout
          };
        }
        return bet;
      })
    };
  }),

  // Set user bet placement state locally
  setUserBetPlaced: (slot, stake, autoCashout) => set((prev) => {
    const newBets = { ...prev.bets };
    newBets[slot] = {
      active: true,
      stake: parseFloat(stake),
      autoCashoutMultiplier: autoCashout ? parseFloat(autoCashout) : '',
      status: 'PENDING',
      payout: 0,
      cashoutMultiplier: null
    };
    return { bets: newBets };
  }),

  // Update user bet cashout success state locally
  setUserCashoutSuccess: (slot, multiplier, payout) => set((prev) => {
    const newBets = { ...prev.bets };
    if (newBets[slot]) {
      newBets[slot] = {
        ...newBets[slot],
        status: 'WON',
        cashoutMultiplier: multiplier,
        payout: payout
      };
    }
    return { bets: newBets };
  }),

  // Cancel/reset a user's bet (e.g. if betting failed or is cancelled before takeoff)
  resetUserBet: (slot) => set((prev) => {
    const newBets = { ...prev.bets };
    newBets[slot] = {
      active: false,
      stake: 0,
      autoCashoutMultiplier: '',
      status: 'NONE',
      payout: 0,
      cashoutMultiplier: null
    };
    return { bets: newBets };
  }),

  // Synchronize bets from reconnect API payload
  syncUserBets: (activeBets) => set((prev) => {
    const newBets = {
      1: { active: false, stake: 0, autoCashoutMultiplier: '', status: 'NONE', payout: 0, cashoutMultiplier: null },
      2: { active: false, stake: 0, autoCashoutMultiplier: '', status: 'NONE', payout: 0, cashoutMultiplier: null }
    };
    
    activeBets.forEach(b => {
      const slot = b.betSlot;
      if (newBets[slot]) {
        newBets[slot] = {
          active: true,
          stake: b.stake,
          autoCashoutMultiplier: b.autoCashoutMultiplier || '',
          status: b.status, // PENDING, WON, LOST
          payout: b.payout || 0,
          cashoutMultiplier: b.cashoutMultiplier || null
        };
      }
    });

    return { bets: newBets };
  })
}));
