import { create } from 'zustand';

export const useTeenPattiStore = create((set, get) => ({
  roundId: '',
  status: 'LOADING',
  timer: 0,
  cards: null,
  handNames: null,
  result: 'PENDING',
  history: [],
  userBets: [],

  setGameState: (state) => set({
    ...state
  }),

  pushHistory: (result) => set((prev) => ({
    history: [...prev.history, result].slice(-15)
  })),

  syncUserBets: (bets) => set({ userBets: bets }),

  addUserBet: (bet) => set((prev) => ({
    userBets: [...prev.userBets, bet]
  })),

  clearUserBets: () => set({ userBets: [] }),

  resetStore: () => set({
    roundId: '',
    status: 'LOADING',
    timer: 0,
    cards: null,
    handNames: null,
    result: 'PENDING',
    history: [],
    userBets: []
  })
}));
