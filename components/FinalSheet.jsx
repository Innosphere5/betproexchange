"use client";

import React, { useState } from "react";
import { List, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Users } from "lucide-react";

export default function FinalSheet({ data }) {
  const [hideZero, setHideZero] = useState(false);
  const [showParentFor, setShowParentFor] = useState(null);

  if (!data || !data.masterInfo) {
    return (
      <div className="bg-white p-10 text-center border border-gray-300 text-gray-500 rounded-sm">
        No settlement data available.
      </div>
    );
  }

  const {
    viewer,
    greenEntries = [],
    redEntries = [],
    totalGreen = 0,
    totalRed = 0,
    netAmount = 0,
    masterInfo
  } = data;

  const filteredGreen = greenEntries.filter(e => !hideZero || e.amount !== 0);
  const filteredRed = redEntries.filter(e => !hideZero || e.amount !== 0);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header Info Card ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={16} className="text-[#1abc9c]" />
            <span className="font-bold text-white text-[14px] tracking-wide">
              {viewer} — Final Settlement Sheet
            </span>
          </div>
          <div className="flex items-center gap-1 font-normal text-gray-400 text-[11px]">
            <input 
              type="checkbox" 
              id="hideZeroFS" 
              checked={hideZero} 
              onChange={e => setHideZero(e.target.checked)} 
              className="w-3 h-3 accent-[#1abc9c]" 
            />
            <label htmlFor="hideZeroFS" className="cursor-pointer text-gray-300">Hide Zero</label>
          </div>
        </div>

        {/* Share Distribution Info Bar */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1abc9c] ring-2 ring-[#1abc9c]/30"></div>
            <span className="text-gray-600">
              Me (<span className="font-bold text-gray-800">{masterInfo.masterName}</span>):
            </span>
            <span className="bg-[#1abc9c] text-white font-bold px-2 py-0.5 rounded-full">
              {masterInfo.masterShare}%
            </span>
          </div>
          <ChevronRight size={12} className="text-gray-300" />
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-300/40"></div>
            <span className="text-gray-600">
              Parent (<span className="font-bold text-gray-800">{masterInfo.parentName}</span>):
            </span>
            <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
              {masterInfo.parentShare}%
            </span>
          </div>
          {masterInfo.grandParentName && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-300/40"></div>
                <span className="text-gray-600">
                  Grandparent (<span className="font-bold text-gray-800">{masterInfo.grandParentName}</span>):
                </span>
                <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {masterInfo.superAdminEffectiveShare}%
                </span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
            <span className="text-gray-500">
              Platform Fee: <span className="font-bold text-orange-500">5%</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-Panel Green / Red Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ════════ GREEN PANEL ════════ */}
        {filteredGreen.length > 0 ? (
          <div className="flex flex-col bg-white border-2 border-green-400 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-white" />
                <span className="font-bold text-white text-[13px] uppercase tracking-wider">
                  Green Side — Incoming
                </span>
              </div>
              <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {filteredGreen.length} entr{filteredGreen.length !== 1 ? 'ies' : 'y'}
              </span>
            </div>

            <div className="flex-1 divide-y divide-green-100">
              {filteredGreen.map((entry, i) => (
                <div key={i} className="px-4 py-3.5 hover:bg-green-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div 
                      className={`flex flex-col group ${entry.parentName ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (entry.parentName) {
                          setShowParentFor(showParentFor === entry.accountName ? null : entry.accountName);
                        }
                      }}
                    >
                      <div className="font-bold text-gray-900 text-[13px] group-hover:text-blue-600 transition-colors">
                        {entry.accountName}
                      </div>
                      <div className="text-[10px] text-green-600 font-medium mt-0.5 capitalize flex flex-col gap-0.5">
                        <span>{entry.role === 'user' ? 'Bettor' : entry.role}</span>
                        {entry.parentName && (
                          <span className={`text-[10px] text-blue-500 font-bold italic transition-all duration-300 ${
                            showParentFor === entry.accountName
                              ? 'opacity-100 max-h-10'
                              : 'opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-10'
                          }`}>
                            Parent: {entry.parentName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-green-600 text-[16px]">
                        ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-600 px-4 py-2.5 flex items-center justify-between mt-auto">
              <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Green</span>
              <span className="font-black text-white text-[15px]">
                ₹{totalGreen.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2 border border-gray-300 rounded-sm bg-gray-50">
            <AlertCircle size={24} className="text-gray-300" />
            <span className="text-[12px] italic">No incoming settlements</span>
          </div>
        )}

        {/* ════════ RED PANEL ════════ */}
        {filteredRed.length > 0 ? (
          <div className="flex flex-col bg-white border-2 border-red-400 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-white" />
                <span className="font-bold text-white text-[13px] uppercase tracking-wider">
                  Red Side — Outgoing
                </span>
              </div>
              <span className="text-white/80 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {filteredRed.length} entr{filteredRed.length !== 1 ? 'ies' : 'y'}
              </span>
            </div>

            <div className="flex-1 divide-y divide-red-100">
              {filteredRed.map((entry, i) => (
                <div key={i} className="px-4 py-3 hover:bg-red-50/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <Users size={14} className="text-red-500" />
                      </div>
                      <div 
                        className={`flex flex-col group ${entry.parentName ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (entry.parentName) {
                            setShowParentFor(showParentFor === entry.accountName ? null : entry.accountName);
                          }
                        }}
                      >
                        <div className="font-bold text-gray-900 text-[13px] group-hover:text-blue-600 transition-colors">
                          {entry.accountName}
                        </div>
                        <div className="text-[10px] text-red-500 font-medium mt-0.5 capitalize flex flex-col gap-0.5">
                          <span>{entry.role === 'user' ? 'Bettor' : entry.role}</span>
                          {entry.parentName && (
                            <span className={`text-[10px] text-blue-500 font-bold italic transition-all duration-300 ${
                              showParentFor === entry.accountName
                                ? 'opacity-100 max-h-10'
                                : 'opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-10'
                            }`}>
                              Parent: {entry.parentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-red-600 text-[15px]">
                        ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between mt-auto">
              <span className="font-bold text-white text-[12px] uppercase tracking-wide">Total Red</span>
              <span className="font-black text-white text-[15px]">
                ₹{totalRed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2 border border-gray-300 rounded-sm bg-gray-50">
            <AlertCircle size={24} className="text-gray-300" />
            <span className="text-[12px] italic">No outgoing settlements</span>
          </div>
        )}
      </div>

      {/* ── Summary Bar ── */}
      <div className={`mt-2 p-4 rounded-sm text-white flex justify-between items-center shadow-md ${netAmount >= 0 ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
        <div>
          <span className="text-sm uppercase tracking-wider font-bold block">Net Position</span>
          <span className="text-[11px] opacity-80">(Total Green - Total Red)</span>
        </div>
        <span className="text-2xl font-black">
          {netAmount >= 0 ? `+₹${netAmount.toLocaleString()}` : `-₹${Math.abs(netAmount).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
