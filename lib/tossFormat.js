/**
 * Formats a completed toss outcome for the match header strip,
 * matching BPExch format (e.g. "ADELAIDE STRIKERS WOMEN OPT TO BOWL").
 *
 * @param {string|null|undefined} tossWinner
 * @param {string|null|undefined} tossDecision
 * @returns {string|null}
 */
export function formatTossBannerText(tossWinner, tossDecision) {
  if (!tossWinner) return null;
  const cleanWinner = String(tossWinner).trim();
  if (!cleanWinner || cleanWinner.toUpperCase() === 'REFUND') return null;

  const decision = String(tossDecision || '').trim().toLowerCase();
  if (decision === 'bowl' || decision === 'field' || decision === 'bowling' || decision === 'fielding') {
    return `${cleanWinner.toUpperCase()} OPT TO BOWL`;
  }
  if (decision === 'bat' || decision === 'batting') {
    return `${cleanWinner.toUpperCase()} OPT TO BAT`;
  }
  return `${cleanWinner.toUpperCase()} WON THE TOSS`;
}
