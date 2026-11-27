import { create } from 'zustand';

export const useTeenPattiStore = create((set) => ({
  roundId: '',
  status: 'IDLE',
  timer: 0,
  maxTimer: 10,
  cards: null,
  handNames: null,
  result: 'PENDING',
  seedHash: null,
  serverSeed: null,
  history: [],
  userBets: [],

  setGameState: (state) => set((prev) => ({
    ...prev,
    ...state
  })),

  pushHistory: (result) => set((prev) => ({
    history: [result, ...(prev.history || [])].slice(0, 24)
  })),

  syncUserBets: (bets) => set({ userBets: bets }),

  addUserBet: (bet) => set((prev) => ({
    userBets: [bet, ...prev.userBets]
  })),

  clearUserBets: () => set({ userBets: [] }),

  resetStore: () => set({
    roundId: '',
    status: 'IDLE',
    timer: 0,
    maxTimer: 10,
    cards: null,
    handNames: null,
    result: 'PENDING',
    seedHash: null,
    serverSeed: null,
    history: [],
    userBets: []
  })
}));
