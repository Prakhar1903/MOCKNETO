import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PeerComparisonCard from "../components/PeerComparisonCard";

/* ─── Verdict badge styles ───────────────────────────────────────────────────── */
const verdictStyle = (verdict) => {
  const v = String(verdict || "").toLowerCase();
  if (v === "strong") return { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981", icon: "check_circle" };
  if (v === "okay") return { bg: "rgba(245,158,11,0.15)", border: "#f59e0b", text: "#f59e0b", icon: "pending" };
  if (v === "weak") return { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#ef4444", icon: "cancel" };
  return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.5)", icon: "help" };
};

/* ─── Score color ────────────────────────────────────────────────────────────── */
const scoreColor = (score) => {
  if (typeof score !== "number") return "#ffffff40";
  if (score >= 8) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
};

/* ─── Commentary skeleton ────────────────────────────────────────────────────── */
const CommentarySkeleton = () => (
  <div className="mt-3 rounded-xl border border-white/5 bg-white/3 p-3 space-y-2 animate-pulse">
    <div className="h-2.5 w-3/4 rounded bg-white/8" />
    <div className="h-2.5 w-1/2 rounded bg-white/5" />
    <div className="h-2.5 w-2/3 rounded bg-white/5" />
  </div>
);

/* ─── Commentary Card ────────────────────────────────────────────────────────── */
const CommentaryCard = ({ commentary }) => {
  if (!commentary) return <CommentarySkeleton />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-1.5"
    >
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5 shrink-0">thumb_up</span>
        <p className="text-xs text-white/75 leading-relaxed">{commentary.good}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5 shrink-0">warning</span>
        <p className="text-xs text-white/75 leading-relaxed">{commentary.missed}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-cyan-400 text-sm mt-0.5 shrink-0">lightbulb</span>
        <p className="text-xs text-cyan-300/80 leading-relaxed font-medium">{commentary.tip}</p>
      </div>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const InterviewReplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state || {};

  const {
    questions = [],
    answers = [],
    answerChecks = [],
    interviewDetails = {},
    feedback = "",
  } = sessionData;

  const getQuestionText = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") return String(item.question || item.q || "");
    return "";
  };

  // Build Q&A pairs for the API call
  const pairs = questions.map((q, i) => ({
    question: getQuestionText(q),
    answer: answers[i] || "",
    verdict: answerChecks[i]?.verdict || "",
    score: answerChecks[i]?.score,
  }));

  const [commentary, setCommentary] = useState(Array(pairs.length).fill(null));
  const [commentaryLoaded, setCommentaryLoaded] = useState(false);
  const [loadingCommentary, setLoadingCommentary] = useState(true);

  // Calculate overall session score
  const answeredChecks = answerChecks.filter(Boolean);
  const avgScore = answeredChecks.length
    ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length)
    : 0;

  // Fetch commentary batch on mount
  useEffect(() => {
    if (pairs.length === 0) { setLoadingCommentary(false); return; }

    let cancelled = false;
    const fetchCommentary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/interview/replay-commentary", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ pairs }),
        });
        if (!res.ok) throw new Error("Commentary fetch failed");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.commentary)) {
          // Stagger commentary appearance
          data.commentary.forEach((c, i) => {
            setTimeout(() => {
              if (!cancelled) setCommentary(prev => { const next = [...prev]; next[i] = c; return next; });
            }, i * 300);
          });
          setTimeout(() => { if (!cancelled) setCommentaryLoaded(true); }, data.commentary.length * 300 + 300);
        }
      } catch {
        // Fallback: show empty commentary gracefully
      } finally {
        if (!cancelled) setLoadingCommentary(false);
      }
    };

    fetchCommentary();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sessionDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const strongCount = answeredChecks.filter(c => c?.verdict?.toLowerCase() === "strong").length;
  const okayCount = answeredChecks.filter(c => c?.verdict?.toLowerCase() === "okay").length;
  const weakCount = answeredChecks.filter(c => c?.verdict?.toLowerCase() === "weak").length;

  if (pairs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-white/20 block mb-3">play_circle</span>
          <p className="text-white/40 text-sm">No session data found to replay.</p>
          <button
            onClick={() => navigate("/interviewsetup")}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
          >
            Start a New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f1a 100%)" }}>
      {/* Fixed BG glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-white/5 backdrop-blur-sm bg-black/20 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-white/50 text-xl">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-lg">play_circle</span>
            <h1 className="text-base font-black text-white">Session Replay</h1>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            {interviewDetails.company || "Mock"} · {interviewDetails.jobRole || "Interview"} · {sessionDate}
          </p>
        </div>

        {/* Score summary chips */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {[
            { count: strongCount, color: "#10b981", label: "Strong" },
            { count: okayCount, color: "#f59e0b", label: "Okay" },
            { count: weakCount, color: "#ef4444", label: "Weak" },
          ].map(({ count, color, label }) => (
            <div key={label} className="px-2.5 py-1 rounded-full text-xs font-bold border"
              style={{ background: `${color}15`, borderColor: `${color}30`, color }}>
              {count} {label}
            </div>
          ))}
          <div className="ml-2 px-3 py-1 rounded-full text-sm font-black border border-violet-500/30 bg-violet-500/15 text-violet-300">
            {avgScore}/10
          </div>
        </div>

        <button
          onClick={() => navigate("/interviewsetup")}
          className="ml-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 transition-colors text-white text-xs font-bold shadow-lg shadow-violet-500/20"
        >
          Practice Again
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-16">

          {/* Peer Comparison */}
          {avgScore > 0 && (
            <PeerComparisonCard
              score={avgScore}
              focusArea={interviewDetails.focusArea}
              track={interviewDetails.track}
            />
          )}

          {/* Timeline */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/40 via-white/10 to-transparent" />

            <div className="space-y-6 pl-12">
              {pairs.map((pair, index) => {
                const vs = verdictStyle(pair.verdict);
                const hasAnswer = !!pair.answer?.trim();
                const com = commentary[index];

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute left-3.5 w-3 h-3 rounded-full border-2 border-black"
                      style={{ background: vs.border, marginTop: "0.9rem" }}
                    />

                    {/* Q&A Card */}
                    <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden">
                      {/* Question */}
                      <div className="px-4 pt-4 pb-3 border-b border-white/5">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-black text-violet-300">Q{index + 1}</span>
                          </div>
                          <p className="text-sm text-white/85 leading-relaxed font-medium">{pair.question || "(Question unavailable)"}</p>
                        </div>
                      </div>

                      {/* Answer + verdict */}
                      <div className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                            style={{ background: vs.bg, borderColor: `${vs.border}40` }}>
                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: "13px", color: vs.text }}>person</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {hasAnswer ? (
                              <p className="text-sm text-white/65 leading-relaxed">{pair.answer}</p>
                            ) : (
                              <p className="text-sm text-white/25 italic">No answer provided</p>
                            )}

                            {/* Verdict + Score row */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {pair.verdict && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border"
                                  style={{ background: vs.bg, borderColor: `${vs.border}40`, color: vs.text }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>{vs.icon}</span>
                                  {pair.verdict}
                                </div>
                              )}
                              {typeof pair.score === "number" && (
                                <span className="text-xs font-bold" style={{ color: scoreColor(pair.score) }}>
                                  {pair.score}/10
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Commentary */}
                        {loadingCommentary && !commentaryLoaded ? (
                          <CommentarySkeleton />
                        ) : (
                          <AnimatePresence>
                            {com && <CommentaryCard key={index} commentary={com} />}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Overall Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-cyan-400 text-sm">summarize</span>
                <h3 className="text-sm font-bold text-cyan-300">Overall Session Feedback</h3>
              </div>
              <p className="text-xs text-white/65 leading-relaxed whitespace-pre-wrap">{feedback}</p>
            </motion.div>
          )}

          {/* Bottom CTAs */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate("/interviewsetup")}
              className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 transition-all text-white text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Practice Again
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all text-white/70 text-sm font-medium"
            >
              View All Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReplay;
