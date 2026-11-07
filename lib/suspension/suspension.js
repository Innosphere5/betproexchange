// suspension.js — client-safe reference implementation (pure JS, ESM).
// Implements SUSPENSION_ENGINE_CONTEXT.md

export const REASON_PRIORITY = [
  'AWAITING_SETTLEMENT', 'MANUAL', 'NOT_LIVE', 'INNINGS_NOT_ACTIVE', 'VALIDATION_FAILED',
  'FEED_STALE', 'FEED_RECOVERING', 'EVENT_HOLD', 'END_ZONE', 'DECIDED', 'EARLY_END_RISK',
  'EXPOSURE', 'QUOTE_INVALID',
];

export const DEFAULT_CONFIG = {
  staleMs: 15000,
  freshStreakToReopen: 2,
  holdMs: { wicket: 2000, noball: 1500, overEnd: 1000, newInnings: 5000, interruption: 3000, dls: 3000 },
  endZoneBalls: { line: 3, fancy2: 3, evenodd: 3, lastfigure: 3 },
  decidedProb: 0.9,
  pEarlyEndMax: 0.4,
  exposureReopenRatio: 0.8,
  allowEarlyFutureInnings: false,
  noBallVoidText: 'Market voided due to ball outcome / no-ball rules',
};

/** Legal balls left until the market's deciding moment (end of over N of its innings). */
export function ballsToDecision(market, st) {
  if (market.innings > st.innings) return Infinity;
  if (market.innings < st.innings) return 0;
  if (market.type === 'fall_of_wicket' || market.wicketN !== undefined) {
    if (st.wickets >= market.wicketN) return 0;
    return Infinity;
  }
  return Math.max(market.overN * 6 - st.legalBalls, 0);
}

export const isStale = (now, lastUpdateMs, staleMs) => now - lastUpdateMs > staleMs;

export function distStats(samples) {
  const n = samples.length;
  if (!n) return null;
  let max = 0; for (let i = 0; i < n; i++) if (samples[i] > max) max = samples[i];
  const counts = new Array(max + 2).fill(0);
  for (let i = 0; i < n; i++) counts[samples[i]]++;
  const prefix = [0]; for (let i = 0; i <= max + 1; i++) prefix.push(prefix[i] + counts[i]);
  const pLess = (L) => (L <= 0 ? 0 : L >= prefix.length ? 1 : prefix[L] / n);
  const pAtLeast = (L) => 1 - pLess(L);
  let odd = 0; const digit = new Array(10).fill(0);
  for (let r = 0; r <= max; r++) { if (r % 2) odd += counts[r]; digit[r % 10] += counts[r]; }
  return { n, pLess, pAtLeast, pOdd: odd / n, pEven: 1 - odd / n, pDigit: digit.map((c) => c / n) };
}

export function decidedProbability(market, stats, quote) {
  if (!stats) return 0;
  switch (market.type) {
    case 'evenodd': return Math.max(stats.pOdd, stats.pEven);
    case 'lastfigure': return Math.max(...stats.pDigit);
    case 'line':
    case 'fancy2': return quote && Number.isFinite(quote.yesLine) && Number.isFinite(quote.noLine)
      ? Math.max(stats.pAtLeast(quote.yesLine), stats.pLess(quote.noLine)) : 0;
    default: return 0;
  }
}

export function isQuoteValid(market, quote) {
  if (!quote) return false;
  if (market.type === 'fancy2' || market.type === 'line')
    return Number.isFinite(quote.yesLine) && Number.isFinite(quote.noLine) && quote.noLine <= quote.yesLine;
  if (market.type === 'evenodd')
    return [quote.backOdd, quote.layOdd, quote.backEven, quote.layEven].every((x) => Number.isFinite(x) && x >= 1.01);
  if (market.type === 'lastfigure')
    return Array.isArray(quote.odds) && quote.odds.length === 10 && quote.odds.every((x) => Number.isFinite(x) && x >= 1.01);
  return false;
}

export function detectEvents(prev, cur) {
  if (!prev || cur.stateSeq === prev.stateSeq) return [];
  const ev = [];
  if (cur.innings !== prev.innings) ev.push('newInnings');
  if (cur.wickets > prev.wickets && cur.innings === prev.innings) ev.push('wicket');
  if (cur.lastBall && cur.lastBall.extra === 'noball') ev.push('noball');
  if (cur.innings === prev.innings && cur.legalBalls > prev.legalBalls && cur.legalBalls % 6 === 0) ev.push('overEnd');
  if ((cur.status === 'interrupted' || cur.status === 'break') && cur.status !== prev.status) ev.push('interruption');
  if (cur.revisedTarget !== prev.revisedTarget || cur.revisedOvers !== prev.revisedOvers) ev.push('dls');
  return ev;
}

export const initSm = () => ({
  lastSeqSeen: null, freshStreak: 0, wasStale: false, hold: null, exposureLatched: false, awaiting: false,
});

export function step(sm, market, ctx, cfg = DEFAULT_CONFIG) {
  const next = { ...sm };
  const reasons = new Set();
  const { st, now } = ctx;

  const btd = ballsToDecision(market, st);
  if (btd === 0 && (ctx.runsAtOverEndKnown || (market.wicketN !== undefined && st.wickets >= market.wicketN))) {
    next.awaiting = true;
  }
  if (next.awaiting) reasons.add('AWAITING_SETTLEMENT');

  if (ctx.manualHold) reasons.add('MANUAL');
  if (ctx.matchStatus !== 'live') reasons.add('NOT_LIVE');
  if (market.innings > st.innings && !(cfg.allowEarlyFutureInnings && ctx.quote && ctx.stats)) {
    reasons.add('INNINGS_NOT_ACTIVE');
  }
  if (!ctx.validatorOk) reasons.add('VALIDATION_FAILED');

  const stale = isStale(now, ctx.feedLastUpdateMs, cfg.staleMs);
  if (stale) { next.freshStreak = 0; next.wasStale = true; reasons.add('FEED_STALE'); }
  else if (st.stateSeq !== sm.lastSeqSeen) next.freshStreak = sm.freshStreak + 1;
  next.lastSeqSeen = st.stateSeq;
  if (!stale && next.wasStale) {
    if (next.freshStreak >= cfg.freshStreakToReopen) next.wasStale = false; else reasons.add('FEED_RECOVERING');
  }

  const events = detectEvents(ctx.prevSt, st);
  if (events.length) {
    const ms = Math.max(...events.map((e) => cfg.holdMs[e] ?? 0));
    const until = now + ms;
    next.hold = { until: Math.max(until, sm.hold ? sm.hold.until : 0), seq: st.stateSeq };
  }
  if (next.hold) {
    const quoteSeq = ctx.quote ? ctx.quote.stateSeq : -1;
    if (now >= next.hold.until && quoteSeq >= next.hold.seq) next.hold = null; else reasons.add('EVENT_HOLD');
  }

  if (market.innings === st.innings && btd > 0) {
    if (cfg.endZoneBalls && cfg.endZoneBalls[market.type] !== undefined && btd <= cfg.endZoneBalls[market.type]) {
      reasons.add('END_ZONE');
    }
    if (decidedProbability(market, ctx.stats, ctx.quote) >= cfg.decidedProb) reasons.add('DECIDED');
    if ((ctx.pEarlyEnd ?? 0) >= cfg.pEarlyEndMax) reasons.add('EARLY_END_RISK');
  }

  if (ctx.exposureRatio >= 1) next.exposureLatched = true;
  else if (ctx.exposureRatio < cfg.exposureReopenRatio) next.exposureLatched = false;
  if (next.exposureLatched) reasons.add('EXPOSURE');

  if (!isQuoteValid(market, ctx.quote)) reasons.add('QUOTE_INVALID');

  const ordered = REASON_PRIORITY.filter((r) => reasons.has(r));
  return { sm: next, reasons: ordered, status: ordered.length ? 'suspended' : 'open' };
}

export function worstCaseLiability(bets, outcomes, settleFn) {
  let liability = -Infinity, worstOutcome = null;
  for (const o of outcomes) {
    let net = 0; for (const b of bets) net += settleFn(b, o);
    if (net > liability) { liability = net; worstOutcome = o; }
  }
  return { liability: Math.max(liability, 0), worstOutcome };
}
