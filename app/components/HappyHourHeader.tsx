"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/i18n";

type HappyHourData = {
  windowStart: string;
  cycleMinutes: number;
  durationMinutes: number;
};

function formatClock(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function HappyHourHeader() {
  const { t } = useI18n();
  const [data, setData] = useState<HappyHourData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    const refresh = () => fetch(`../data/happy-hour.json?v=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Happy Hour request failed: ${response.status}`);
        return response.json() as Promise<HappyHourData>;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch(() => { /* Keep the compact unavailable state. */ });
    refresh();
    const refreshTimer = window.setInterval(refresh, 60 * 1000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const state = useMemo(() => {
    const anchor = Date.parse(data?.windowStart ?? "");
    const cycle = Number(data?.cycleMinutes) * 60 * 1000;
    const duration = Number(data?.durationMinutes) * 60 * 1000;
    if (!Number.isFinite(anchor) || !Number.isFinite(cycle) || cycle <= 0 || !Number.isFinite(duration) || duration <= 0) return null;
    if (now < anchor) return { active: false, target: anchor };
    const currentStart = anchor + Math.floor((now - anchor) / cycle) * cycle;
    const isActive = now < currentStart + duration;
    return { active: isActive, target: isActive ? currentStart + duration : currentStart + cycle };
  }, [data, now]);

  const ariaLabel = state?.active
    ? t("header.hh.active", "Happy Hour active, open schedule")
    : state
      ? t("header.hh.next", "Time until next Happy Hour, open schedule")
      : t("header.hh.unavailable", "Open Happy Hour schedule");

  return (
    <a className="happy_hour_header" href="../player_tools.html#happy-schedule" data-state={state?.active ? "active" : state ? "upcoming" : "unavailable"} aria-label={ariaLabel}>
      <span className="happy_hour_header_dot" aria-hidden="true" />
      <span className="happy_hour_header_label">{state?.active ? "HH" : state ? "NEXT HH" : "HH"}</span>
      <strong className="happy_hour_header_time">{state ? formatClock(state.target - now) : "--:--:--"}</strong>
    </a>
  );
}
