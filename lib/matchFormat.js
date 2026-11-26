/**
 * Shared Cricket Match Format Classification
 *
 * - TEST / First-Class / 4-day / 5-day matches -> Show "The Draw" in Match Odds & Bookmaker
 * - T10 / T20 / ODI matches -> Do NOT show "The Draw"; use "TIED MATCH" in footer
 */

export function getMatchFormatClient(match) {
  const str = [
    match?.league,
    match?.tournament?.tournamentName,
    match?.tournament?.name,
    match?.name,
    match?.teamA,
    match?.teamB,
    match?.format,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(t10|ten10|t-10|10 overs|10-over|ecs|ecl|max 60|max60|abu dhabi t10|zim afro)\b/i.test(str)) {
    return "T10";
  }
  if (/\b(test|test match|test matches|test series|the ashes|ashes|border gavaskar|wtc|world test championship|sheffield shield|county championship|ranji trophy|quaid e azam|quaid-e-azam|quaid azam|duleep|irani|plunket|first class|first-class|4-day|5-day|4 day|5 day)\b/i.test(str)) {
    return "TEST";
  }
  if (/\b(t20|t20i|d20|twenty20|twenty-20|twenty 20|indian premier league|ipl|pakistan super league|psl|big bash|bbl|wbbl|womens big bash|caribbean premier|cpl|wcpl|the hundred|hundred|sa20|ilt20|international league|major league cricket|mlc|womens premier league|wpl|wpsl|vitality blast|blast|super smash|smash)\b/i.test(str)) {
    return "T20";
  }
  if (/\b(odi|one day|one-day|list a|list-a|cwc|world cup|champions trophy|league 2)\b/i.test(str)) {
    return "ODI";
  }
  return "OTHER";
}

export function isTestMatchFormat(match) {
  if (!match) return false;
  const fmt = getMatchFormatClient(match);
  if (fmt === "TEST") return true;
  if (fmt === "T10" || fmt === "T20" || fmt === "ODI") return false;
  return Boolean(match.isTestMatch);
}

export function getDefaultTiedMatchMarket() {
  return {
    name: "TIED MATCH",
    maxBet: 500000,
    status: "SUSPENDED",
    runners: [
      { name: "Yes", backOdds: [{ price: 25.0, volume: "100" }], layOdds: [{ price: 30.0, volume: "100" }] },
      { name: "No", backOdds: [{ price: 1.02, volume: "1.5M" }], layOdds: [{ price: 1.04, volume: "1.5M" }] },
    ],
  };
}
