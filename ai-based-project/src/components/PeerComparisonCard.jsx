import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PeerComparisonCard
 * Props:
 *   score       — number (the session score, 0-10)
 *   focusArea   — string (e.g. "technical", "behavioral")
 *   track       — string (e.g. "tech", "mba")
 *   compact     — boolean: minimal ring+text mode for dashboard
 */
const PeerComparisonCard = ({ score, focusArea, track, compact = false }) => {
  const [state, setState] = useState("loading"); // loading | data | nodata | error
  const [percentileData, setPercentileData] = useState(null);

  useEffect(() => {
    if (typeof score !== "number" || isNaN(score)) {
      setState("error");
      return;
    }

    let cancelled = false;

    const fetchPercentile = async () => {
      try {
        const params = new URLSearchParams({ score: String(score) });
        if (track) params.set("track", track);
        if (focusArea) params.set("focusArea", focusArea);

        const token = localStorage.getItem("token");
        const res = await fetch(`/api/interview/percentile?${params.toString()}`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch percentile");
        const data = await res.json();
        if (!cancelled) {
          setPercentileData(data);
          setState(data.hasData ? "data" : "nodata");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    fetchPercentile();
    return () => { cancelled = true; };
  }, [score, focusArea, track]);

  // Color scheme based on rank (top X%)
  const getRankColor = (rank) => {
    if (rank <= 25) return { ring: "#10b981", bg: "rgba(16,185,129,0.12)", text: "#10b981", label: "Top Performer" };
    if (rank <= 50) return { ring: "#06b6d4", bg: "rgba(6,182,212,0.12)", text: "#06b6d4", label: "Above Average" };
    if (rank <= 75) return { ring: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#f59e0b", label: "Improving" };
    return { ring: "#8b5cf6", bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", label: "Keep Practicing" };
  };

  // Circular progress ring
  const Ring = ({ percentile, rank, size = 100 }) => {
    const radius = size * 0.38;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, percentile));
    const strokeDash = (progress / 100) * circumference;
    const colors = getRankColor(rank);

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ display: "block" }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={compact ? 6 : 8}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={compact ? 6 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="font-black leading-none"
            style={{ fontSize: compact ? "1.1rem" : "1.5rem", color: colors.ring }}
          >
            {percentile}%
          </motion.span>
          {!compact && (
            <span className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5 font-semibold">beat</span>
          )}
        </div>
      </div>
    );
  };

  // ── No Data State ──────────────────────────────────────────────────────────
  if (state === "nodata") {
    if (compact) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8">
          <span className="material-symbols-outlined text-sm text-white/30">group</span>
          <span className="text-[11px] text-white/30">Peer data: coming soon</span>
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 text-center"
      >
        <span className="material-symbols-outlined text-3xl text-white/20 mb-2 block">group</span>
        <p className="text-sm font-semibold text-white/40">Not enough data yet</p>
        <p className="text-xs text-white/25 mt-1">
          Peer comparison unlocks once 50+ users practice this track. Check back soon.
        </p>
        {percentileData?.totalSessions !== undefined && (
          <p className="text-xs text-violet-400/50 mt-2">
            {percentileData.totalSessions} / 50 sessions so far
          </p>
        )}
      </motion.div>
    );
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (state === "loading") {
    if (compact) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/8" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-white/8" />
            <div className="h-3 w-48 rounded bg-white/5" />
            <div className="h-3 w-36 rounded bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (state === "error") return null;

  // ── Data State ─────────────────────────────────────────────────────────────
  const { percentile, rank, totalSessions } = percentileData;
  const colors = getRankColor(rank);

  const motivationalText = () => {
    if (rank <= 10) return "You're in the elite tier. Exceptional performance!";
    if (rank <= 25) return "Outstanding! You're ahead of most practitioners.";
    if (rank <= 50) return "Great work! You're above the average practitioner.";
    if (rank <= 75) return "You're getting there! Consistent practice will move you up.";
    return "Keep going — every session closes the gap.";
  };

  const trackLabel = track === "mba" ? "MBA" : track === "tech" ? "Tech" : "this track";
  const focusLabel = focusArea ? focusArea.charAt(0).toUpperCase() + focusArea.slice(1) : "";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/8 backdrop-blur-sm"
        style={{ background: colors.bg }}
      >
        <Ring percentile={percentile} rank={rank} size={44} />
        <div>
          <p className="text-xs font-bold" style={{ color: colors.text }}>
            Top {rank}% {focusLabel && `· ${focusLabel}`}
          </p>
          <p className="text-[10px] text-white/40">vs {totalSessions.toLocaleString()} peers this week</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border backdrop-blur-sm overflow-hidden"
      style={{ background: colors.bg, borderColor: `${colors.ring}30` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <span className="material-symbols-outlined text-sm" style={{ color: colors.ring }}>group</span>
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Peer Comparison</span>
        <span className="ml-auto text-[10px] text-white/30">Rolling 7 days · {totalSessions.toLocaleString()} sessions</span>
      </div>

      {/* Content */}
      <div className="flex items-center gap-5 px-5 py-4">
        <Ring percentile={percentile} rank={rank} size={100} />

        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base font-black text-white leading-tight"
          >
            You beat{" "}
            <span style={{ color: colors.ring }}>{percentile}%</span>{" "}
            of {trackLabel} practitioners
          </motion.p>

          {focusLabel && (
            <p className="text-xs text-white/40 mt-0.5">in {focusLabel} focus · this week</p>
          )}

          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: `${colors.ring}20`, color: colors.ring, border: `1px solid ${colors.ring}40` }}
          >
            <span className="material-symbols-outlined text-[12px]">
              {rank <= 25 ? "emoji_events" : rank <= 50 ? "trending_up" : "fitness_center"}
            </span>
            {colors.label} · Top {rank}%
          </div>

          <p className="text-xs text-white/50 mt-2.5 leading-relaxed">{motivationalText()}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PeerComparisonCard;
