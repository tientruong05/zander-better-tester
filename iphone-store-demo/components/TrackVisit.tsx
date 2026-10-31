"use client";

import { useEffect } from "react";

export default function TrackVisit() {
  useEffect(() => {
    const key = "visited_this_session";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/track-visit", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
