import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GAZE_ZONE_LABELS = {
  camera: { label: "On Camera ✓", color: "text-emerald-400" },
  bottom: { label: "Looking Down ⚠", color: "text-amber-400" },
  left:   { label: "Glancing Left", color: "text-sky-400" },
  right:  { label: "Glancing Right", color: "text-sky-400" },
};

const SENTIMENT_ICONS = {
  happy:   { icon: "😊", label: "Engaged", color: "text-emerald-400" },
  neutral: { icon: "😐", label: "Neutral",  color: "text-white/60" },
  stressed:{ icon: "😟", label: "Stressed", color: "text-red-400" },
};

export const AnalysisOverlay = ({
  confidenceScore = 0,
  sentiment = "neutral",
  gazeZone = "camera",
  eyeContactPct = 100,
  lowEyeContactFlag = false,
  wpm = 0,
  wpmStatus = "good",
  isSlouching = false,
  isFidgeting = false,
  fillerCount = 0,
  fillerWarning = false,
  silenceSeconds = 0,
  persona = "friendly",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [gazeAwaySeconds, setGazeAwaySeconds] = useState(0);
  const gazeTimerRef = useRef(null);

  // Track continuous gaze-away duration for the persistent warning
  useEffect(() => {
    if (gazeZone !== "camera") {
      gazeTimerRef.current = setInterval(() => {
        setGazeAwaySeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(gazeTimerRef.current);
      setGazeAwaySeconds(0);
    }
    return () => clearInterval(gazeTimerRef.current);
  }, [gazeZone]);

  const confidencePercent = Math.round(confidenceScore * 100);
  const confidenceBarColor =
    confidencePercent > 65 ? "bg-emerald-500" :
    confidencePercent > 40 ? "bg-amber-400" :
    "bg-red-500";

  const gazeInfo = GAZE_ZONE_LABELS[gazeZone] || GAZE_ZONE_LABELS.camera;
  const sentimentInfo = SENTIMENT_ICONS[sentiment] || SENTIMENT_ICONS.neutral;
  const wpmColor = wpmStatus === "good" ? "text-emerald-400" : wpmStatus === "fast" ? "text-amber-400" : "text-sky-400";

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden rounded-[2rem]">

      {/* ── Toggle Button ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="pointer-events-auto absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-lg border border-white/10 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
      >
        <div className={`w-2 h-2 rounded-full ${isVisible ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
        AI Co-Pilot
      </button>

      {/* ── Main HUD Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="absolute bottom-5 right-5 w-60 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {persona === "strict" ? "⚡ Strict Mode" : persona === "technical" ? "🔬 Technical Mode" : "😊 Friendly Mode"}
              </span>
              <span className={`text-[10px] font-black ${sentimentInfo.color}`}>
                {sentimentInfo.icon} {sentimentInfo.label}
              </span>
            </div>

            {/* Engagement / Confidence */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-white/70">
                <span>Engagement</span>
                <span className={confidenceBarColor.replace("bg-", "text-")}>{confidencePercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${confidenceBarColor}`}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ type: "spring", stiffness: 80 }}
                />
              </div>
            </div>

            {/* Eye Contact */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white/70">Eye Contact</span>
                <span className={gazeInfo.color}>{gazeInfo.label}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${eyeContactPct > 70 ? "bg-emerald-500" : eyeContactPct > 40 ? "bg-amber-400" : "bg-red-500"}`}
                  animate={{ width: `${eyeContactPct}%` }}
                  transition={{ type: "spring", stiffness: 80 }}
                />
              </div>
              <div className="text-[9px] text-white/30 text-right">{eyeContactPct}% of session on camera</div>
            </div>

            {/* Posture Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-xl p-2 border text-center text-[10px] font-bold transition-colors ${isSlouching ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-white/5 border-white/10 text-white/50"}`}>
                {isSlouching ? "Slouching ↘" : "Posture ✓"}
              </div>
              <div className={`rounded-xl p-2 border text-center text-[10px] font-bold transition-colors ${isFidgeting ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-white/5 border-white/10 text-white/50"}`}>
                {isFidgeting ? "Fidgeting" : "Calm ✓"}
              </div>
            </div>

            {/* Filler Words */}
            <div className={`rounded-xl p-2 border text-center text-[10px] transition-colors ${fillerWarning ? "bg-red-500/20 border-red-500/40" : "bg-white/5 border-white/10"}`}>
              <span className={fillerWarning ? "text-red-300 font-black" : "text-white/50 font-bold"}>
                {fillerCount} filler word{fillerCount !== 1 ? "s" : ""}
                {fillerWarning ? " — reduce ums/ahs" : ""}
              </span>
            </div>

            {/* Pacing */}
            <div className="space-y-1 pt-1 border-t border-white/10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white/70">Pacing</span>
                <span className={wpmColor}>
                  {wpm > 0 ? `${wpm} WPM` : "Listening..."}
                  {wpmStatus === "fast" ? " — Slow down" : wpmStatus === "slow" && wpm > 0 ? " — Speed up" : ""}
                </span>
              </div>
              <div className="h-1 flex rounded-full overflow-hidden gap-0.5">
                <div className={`flex-1 rounded-l-full ${wpmStatus === "slow" ? "bg-sky-500" : "bg-white/10"}`} />
                <div className={`flex-1 ${wpmStatus === "good" ? "bg-emerald-500" : "bg-white/10"}`} />
                <div className={`flex-1 rounded-r-full ${wpmStatus === "fast" ? "bg-amber-500" : "bg-white/10"}`} />
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent Gaze Warning (even when HUD is collapsed) ─── */}
      <AnimatePresence>
        {gazeAwaySeconds >= 3 && (
          <motion.div
            key="gaze-warning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {gazeZone === "bottom" ? "Look at the camera — not your notes" : "Maintain eye contact"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Long Silence Warning ────────────────────────────────────── */}
      <AnimatePresence>
        {silenceSeconds >= 8 && (
          <motion.div
            key="silence-warning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-5 left-5 bg-sky-500/90 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl pointer-events-none"
          >
            🤫 {silenceSeconds}s pause — take your time!
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
