"use client";

import React, { useState, useEffect } from "react";
import AccountLedger from "@/components/AccountLedger";
import { getApiUrl } from "@/lib/apiConfig";

export default function SuperMasterAccountLedger() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session");
      if (session) {
        try {
          return JSON.parse(session).token;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const username = session.username;
      if (!username) return;

      const res = await fetch(`${getApiUrl()}/api/admin/user-statement/${encodeURIComponent(username)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Account Ledger Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-300 p-4 rounded-sm shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">SuperMaster Account Ledger</h1>
          <p className="text-xs text-gray-500">Transaction log and balance audit history</p>
        </div>
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
          SuperMaster
        </span>
      </div>

      <AccountLedger transactions={transactions} isLoading={isLoading} />
    </div>
  );
}
