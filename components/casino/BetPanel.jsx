"use client";

export default function BetPanel({
  amount,
  history = [],
  activeBets = [],
}) {
  const numericAmount = parseFloat(amount) || 0;
  const estNetProfit = Math.round(numericAmount * 0.98 * 0.98 * 100) / 100;
  const estTotalPayout = Math.round((numericAmount + estNetProfit) * 100) / 100;

  return (
    <div className="flex flex-col h-full bg-[#070b13] select-none">
      {/* Header */}
      <div className="bg-[#0d1522] px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-200">
          Bet Summary & History
        </span>
        <span className="text-[10px] font-mono font-bold text-amber-400">1.98x</span>
      </div>

      {/* Payout Calculator Preview */}
      <div className="p-3.5 space-y-3.5">
        <div className="p-3 bg-[#0e1826] rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Current Stake</span>
            <span className="font-mono font-black text-white">
              ₹{numericAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Net Profit</span>
            <span className="font-mono font-black text-emerald-400">
              +₹{estNetProfit.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Return</span>
            <span className="font-mono font-black text-amber-400">
              ₹{estTotalPayout.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Active Round Bets */}
        <div className="bg-[#0c1420] border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>My Bets This Round</span>
            <span className="text-emerald-400 font-mono">{activeBets.length}</span>
          </div>

          {activeBets.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {activeBets.map((b, idx) => (
                <div
                  key={b._id || idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-xs"
                >
                  <span className={`font-black ${b.choice === "A" ? "text-blue-400" : "text-rose-400"}`}>
                    Player {b.choice} @ {Number(b.odds || 1.98).toFixed(2)}
                  </span>
                  <span className="font-mono font-bold text-white">
                    ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 text-center py-3">
              Type an amount and tap Player A or B
            </p>
          )}
        </div>
      </div>

      {/* Desktop Recent Results Bead Road */}
      <div className="mt-auto bg-[#060a10] border-t border-white/10">
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Recent Results
          </span>
          <span className="text-[9px] font-bold text-amber-400 font-mono">
            Last {history.length}
          </span>
        </div>
        <div className="p-3.5 flex flex-wrap gap-1.5">
          {history.length > 0 ? (
            history.slice(0, 20).map((res, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
                  res === "A"
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                    : "bg-rose-600/20 text-rose-400 border-rose-500/40"
                }`}
              >
                {res}
              </div>
            ))
          ) : (
            <div className="w-full text-center text-[11px] text-slate-600 py-3">
              Tap Ready to Start to deal cards
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
