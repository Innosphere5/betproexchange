"use client";

import React, { useState, useEffect } from "react";
import DashboardContent from "@/components/DashboardContent";
import { getApiUrl } from "@/lib/apiConfig";

export default function SuperMasterDashboard() {
  const [stats, setStats] = useState([]);
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

  const fetchStats = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-300 p-4 rounded-sm shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">SuperMaster Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Live match exposure & downline risk management</p>
        </div>
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
          SuperMaster Access
        </span>
      </div>

      <DashboardContent stats={stats} isLoading={isLoading} onRefresh={fetchStats} />
    </div>
  );
}
