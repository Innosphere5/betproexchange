"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logout, getSession } from "@/lib/auth";

export default function AutoLogout() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    // Check if user has an active session
    const session = getSession();
    if (!session) return;

    // Set initial last activity if not present
    if (!localStorage.getItem("last_activity")) {
      localStorage.setItem("last_activity", Date.now().toString());
    }

    const updateActivity = () => {
      localStorage.setItem("last_activity", Date.now().toString());
    };

    // Global events to detect user interaction
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
      "click"
    ];

    // Listen to events on window
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check every 10 seconds if inactivity limit (30 minutes) is exceeded
    const intervalId = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem("last_activity") || "0", 10);
      const now = Date.now();
      const diff = now - lastActivity;

      // 30 minutes = 1,800,000 ms
      if (diff >= 1800000) {
        console.log("Logging out due to 30 minutes of inactivity.");
        logout();
      }
    }, 10000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [pathname]);

  return null;
}
