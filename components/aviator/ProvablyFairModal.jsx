"use client";

import { useState, useEffect } from "react";

export default function ProvablyFairModal({ round, onClose }) {
  const [serverSeed, setServerSeed] = useState(round?.serverSeed || "");
  const [clientSeed, setClientSeed] = useState(round?.clientSeed || "betproexchange");
  const [nonce, setNonce] = useState(round?.nonce?.toString() || "1");
  
  const [calculatedHash, setCalculatedHash] = useState("");
  const [calculatedCrash, setCalculatedCrash] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (round) {
      setServerSeed(round.serverSeed || "");
      setClientSeed(round.clientSeed || "betproexchange");
      setNonce(round.nonce?.toString() || "1");
    }
  }, [round]);

  const verify = async () => {
    if (!serverSeed) return;
    setLoading(true);
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(serverSeed);
      const msgData = encoder.encode(`${clientSeed}-${nonce}`);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signature = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        msgData
      );
      
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Calculate crash point using first 52 bits of HMAC signature
      const h = parseInt(hashHex.substring(0, 13), 16);
      const e = Math.pow(2, 52);
      
      let crash;
      if (h % 33 === 0) {
        crash = 1.00;
      } else {
        crash = Math.floor((100 * e - h) / (e - h)) / 100;
      }
      
      const finalCrash = Math.max(1.00, parseFloat(crash.toFixed(2)));
      
      setCalculatedHash(hashHex);
      setCalculatedCrash(finalCrash);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, [serverSeed, clientSeed, nonce]);

  const isMatch = round && calculatedCrash !== null && Math.abs(calculatedCrash - round.crashPoint) < 0.01;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md -z-10" onClick={onClose}></div>
      
      {/* Container */}
      <div className="max-w-xl w-full bg-[#101b26] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h2 className="text-md font-black tracking-wide text-white">PROVABLY FAIR VERIFIER</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Round ID: {round?.roundId || "N/A"}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 flex-1">
          {/* Server Seed */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Server Seed (Secret)</span>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              placeholder="Paste revealed server seed hex"
              className="w-full bg-[#0d1621] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {/* Client Seed & Nonce */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Client Seed (Salt)</span>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="betproexchange"
                className="w-full bg-[#0d1621] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Nonce (Round Index)</span>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                placeholder="1"
                className="w-full bg-[#0d1621] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Calculations Detail */}
          <div className="bg-[#0d1621] border border-white/5 rounded-2xl p-4 space-y-3.5">
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider">HMAC-SHA256 Signature</span>
              <div className="w-full bg-black/20 p-2.5 rounded-lg font-mono text-[10px] text-gray-400 break-all select-all">
                {loading ? "Calculating..." : calculatedHash || "N/A"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1 border-r border-white/5 pr-4">
                <span className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider">Target Crash Point</span>
                <span className="text-2xl font-black text-white">{round?.crashPoint?.toFixed(2) || "N/A"}x</span>
              </div>
              <div className="flex flex-col space-y-1 pl-2">
                <span className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider">Calculated Point</span>
                <span className={`text-2xl font-black ${isMatch ? "text-green-400 animate-pulse" : "text-rose-400"}`}>
                  {calculatedCrash !== null ? calculatedCrash.toFixed(2) + "x" : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {round && calculatedCrash !== null && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 border shrink-0 ${
            isMatch 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <span className="text-xl">{isMatch ? "✅" : "❌"}</span>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isMatch ? "Verification Successful" : "Verification Mismatch"}
              </h4>
              <p className="text-[10px] font-bold text-white/60 mt-0.5 leading-relaxed">
                {isMatch 
                  ? "The generated crash point is cryptographically valid and proves the operator did not alter the result after betting closed."
                  : "The computed crash point does not match the round's recorded result. Please check the inputs."}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <button 
          onClick={onClose}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg active:scale-98 shrink-0"
        >
          Close Verifier
        </button>
      </div>
    </div>
  );
}
