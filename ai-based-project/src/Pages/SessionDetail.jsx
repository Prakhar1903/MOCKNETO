import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PeerComparisonCard from "../components/PeerComparisonCard";

/* ─── Helper: Auth fetch ──────────────────────────────────────────────────────── */
const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
};

/* ─── Verdict badge styles ───────────────────────────────────────────────────── */
const verdictStyle = (verdict) => {
  const v = String(verdict || "").toLowerCase();
  if (v === "strong" || v === "pass" || v === "optimal") {
    return { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981", icon: "check_circle" };
  }
  if (v === "okay" || v === "acceptable") {
    return { bg: "rgba(245,158,11,0.15)", border: "#f59e0b", text: "#f59e0b", icon: "pending" };
  }
  if (v === "weak" || v === "fail" || v === "incorrect") {
    return { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#ef4444", icon: "cancel" };
  }
  return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.5)", icon: "help" };
};

const scoreColor = (score) => {
  if (typeof score !== "number") return "#ffffff40";
  if (score >= 80 || score >= 8) return "#10b981";
  if (score >= 50 || score >= 5) return "#f59e0b";
  return "#ef4444";
};

const formatDuration = (mins) => {
  if (!mins) return "N/A";
  if (mins < 1) return "< 1 min";
  return `${mins} min${mins > 1 ? "s" : ""}`;
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchSession = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/interview/history/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch session. Status: ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          setSession(data.session);
        }
      } catch (err) {
        console.error("Error loading session:", err);
        if (active) {
          setError("Failed to load session details. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchSession();
    } else {
      setLoading(false);
      setError("No session ID specified.");
    }

    return () => {
      active = false;
    };
  }, [id]);

  const handleRetry = () => {
    if (!session) return;
    // Pre-fill setup or navigate with states
    navigate("/interviewsetup", {
      state: {
        prefill: {
          mode: session.mode,
          company: session.company,
          jobRole: session.jobRole,
          level: session.level || "Medium",
          focusArea: session.focusArea?.replace("DSA - ", ""),
          track: session.track,
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a] text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50 animate-pulse font-medium">Fetching secure session data...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a] text-white">
        <div className="text-center max-w-sm px-6 py-8 rounded-2xl border border-white/5 bg-white/3 backdrop-blur-md">
          <span className="material-symbols-outlined text-5xl text-red-400/80 mb-3 block">warning</span>
          <h2 className="text-lg font-black mb-2">Session Not Found</h2>
          <p className="text-xs text-white/40 leading-relaxed mb-6">
            {error || "We couldn't retrieve the session replay data."}
          </p>
          <button
            onClick={() => navigate("/reports")}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors"
          >
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  const overallScoreVal = typeof session.score === "number" ? session.score : 0;
  const isDSA = session.dsaMode || session.mode === "dsa";
  const isLegacy = !session.questions || session.questions.length === 0;

  return (
    <div className="min-h-screen flex flex-col text-white pb-24 relative" style={{ background: "linear-gradient(135deg, #07070c 0%, #0e071a 50%, #070e1c 100%)" }}>
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-violet-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 px-6 py-4 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all"
        >
          <span className="material-symbols-outlined text-white/70 text-lg block">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-500/15 border border-violet-500/30 text-violet-300">
              {session.mode || "Session"}
            </span>
            <span className="text-white/30 text-xs">•</span>
            <span className="text-xs text-white/50 font-mono">
              {new Date(session.date || session.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h1 className="text-lg font-black text-white mt-1 flex items-center gap-2 truncate">
            {session.company || "Mock Interview"} Replay
            <span className="text-white/20 font-light text-sm">/ {session.jobRole || "Engineer"}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-600/25"
          >
            Retry Session
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 mt-8 flex flex-col gap-8 flex-1">
        
        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              label: "Overall Score", 
              value: typeof session.score === "number" ? `${session.score}/100` : "N/A", 
              textClass: "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
            },
            { 
              label: "Questions Completed", 
              value: isLegacy ? "N/A" : `${session.questions?.length || 0} of ${session.questions?.length || 0}`, 
              textClass: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
            },
            { 
              label: "Time Taken", 
              value: formatDuration(session.duration), 
              textClass: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
            },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/3 py-4 px-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent pointer-events-none" />
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-1">{s.label}</p>
              <div className={`text-2xl font-black ${s.textClass}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {isLegacy ? (
          <div className="w-full flex items-center justify-center py-12">
            <div className="text-center max-w-md w-full px-8 py-10 rounded-3xl border border-white/5 bg-white/3 backdrop-blur-xl">
              <span className="material-symbols-outlined text-6xl text-amber-500/80 mb-4 block">history</span>
              <h2 className="text-xl font-black mb-2 text-white">Legacy Record</h2>
              <p className="text-sm text-white/40 leading-relaxed mb-8">
                Legacy session — detail unavailable
              </p>
              <button
                onClick={() => navigate("/reports")}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Return to Reports
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column: Summary Card & Analytics */}
            <section className="lg:col-span-4 space-y-6">
              {/* Circular Score Gauge Card */}
              <div className="rounded-2xl border border-white/5 bg-white/3 backdrop-blur-md p-6 text-center flex flex-col items-center">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Overall Evaluation</h3>
                
                {/* Score Ring */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="stroke-white/5"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="transition-all duration-1000 ease-out"
                      stroke={scoreColor(overallScoreVal)}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={2 * Math.PI * 64 * (1 - (overallScoreVal > 10 ? overallScoreVal / 100 : overallScoreVal / 10))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tracking-tight" style={{ color: scoreColor(overallScoreVal) }}>
                      {overallScoreVal}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                      out of {overallScoreVal > 10 ? "100" : "10"}
                    </span>
                  </div>
                </div>

                {/* Quick Metadata Stats */}
                <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-white/5 text-left">
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Interviewer</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">{session.interviewer || "AI Assistant"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-xs font-bold text-white mt-1">{formatDuration(session.duration)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Difficulty</p>
                    <p className="text-xs font-bold mt-1" style={{ color: scoreColor(overallScoreVal) }}>
                      {session.level || "Medium"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Focus Area</p>
                    <p className="text-xs font-bold text-white mt-1 truncate" title={session.focusArea}>
                      {session.focusArea || "General"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Peer Comparison component */}
              {overallScoreVal > 0 && (
                <PeerComparisonCard
                  score={overallScoreVal > 10 ? Math.round(overallScoreVal / 10) : overallScoreVal}
                  focusArea={session.focusArea}
                  track={session.track || (isDSA ? "dsa" : "behavioral")}
                />
              )}

              {/* AI Feedback & Summary Card */}
              {session.overallFeedback && (
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-sm">psychology</span>
                    <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider">AI Executive Verdict</h3>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{session.overallFeedback}</p>
                </div>
              )}

              {/* Study & Progress Recommendations */}
              {session.studyRecommendations && session.studyRecommendations.length > 0 && (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-sm">lightbulb</span>
                    <h3 className="text-xs font-black text-violet-300 uppercase tracking-wider">Focus Improvements</h3>
                  </div>
                  <ul className="space-y-2">
                    {session.studyRecommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-white/70 leading-relaxed flex items-start gap-2">
                        <span className="text-violet-400 font-bold mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Right Column: Q&A Timeline / DSA details */}
            <section className="lg:col-span-8 space-y-6">
              
              {isDSA ? (
                /* DSA Code and Test Execution Details Panel */
                <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-base font-black text-white">{session.dsaProblem || "DSA Challenge"}</h2>
                      <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-wider">
                        Language: <span className="text-white/60">{session.language || "javascript"}</span>
                      </p>
                    </div>
                    {typeof session.testsPassed === "number" && (
                      <div className="px-3 py-1.5 rounded-xl bg-white/3 border border-white/8 text-right">
                        <p className="text-[8px] text-white/30 uppercase font-black tracking-wider">Test Cases</p>
                        <p className="text-xs font-black text-emerald-400">
                          {session.testsPassed} / {session.testsTotal || session.testsPassed} Passed
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Code Display */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Submitted Code Solution</p>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 p-4 font-mono text-xs text-violet-200 leading-relaxed overflow-x-auto max-h-[380px]">
                      <pre className="whitespace-pre">{session.userCode || "// No code submitted"}</pre>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  {session.questions && session.questions[0] && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Optimization Breakdown</h3>
                      
                      {session.questions[0].verdict && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40 font-bold">Verdict:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${verdictStyle(session.questions[0].verdict).text}`}
                            style={{ background: verdictStyle(session.questions[0].verdict).bg, borderColor: verdictStyle(session.questions[0].verdict).border }}>
                            {session.questions[0].verdict}
                          </span>
                        </div>
                      )}

                      {session.questions[0].aiFeedback && (
                        <div className="rounded-xl bg-white/2 border border-white/5 p-4 space-y-1.5">
                          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Critique & Analysis</p>
                          <p className="text-xs text-white/70 leading-relaxed">{session.questions[0].aiFeedback}</p>
                        </div>
                      )}

                      {session.questions[0].improvedAnswer && (
                        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-1.5">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Optimized / Reference Strategy</p>
                          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{session.questions[0].improvedAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Traditional Q&A Conversational Timeline Panel */
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2">Session Transcript & Question Analysis</h3>
                  
                  {/* Rating / Verdict Distribution Counts Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/2 border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Answer Performance Distribution</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        {(session.questions || []).filter(c => String(c?.verdict).toLowerCase().includes("strong") || String(c?.verdict).toLowerCase().includes("pass") || String(c?.verdict).toLowerCase().includes("optimal")).length} Strong
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                        {(session.questions || []).filter(c => {
                          const v = String(c?.verdict).toLowerCase();
                          return v.includes("okay") || v.includes("average") || v.includes("moderate") || v.includes("acceptable");
                        }).length} Average
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider">
                        {(session.questions || []).filter(c => {
                          const v = String(c?.verdict).toLowerCase();
                          return v.includes("weak") || v.includes("fail") || v.includes("needs work") || v.includes("needs improvement");
                        }).length} Weak
                      </span>
                    </div>
                  </div>

                  {session.questions && session.questions.length > 0 ? (
                    session.questions.map((q, idx) => {
                      const vs = verdictStyle(q.verdict);
                      const isSelected = selectedQuestionIdx === idx;

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                            isSelected ? "border-violet-500/40 bg-white/4" : "border-white/5 bg-white/2 hover:border-white/10"
                          }`}
                        >
                          {/* Accordion header click to toggle */}
                          <button
                            onClick={() => setSelectedQuestionIdx(isSelected ? -1 : idx)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-black text-violet-300">Q{idx + 1}</span>
                              </div>
                              <p className="text-xs font-bold text-white/90 truncate leading-relaxed">
                                {q.questionText || "Question text unavailable"}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {q.verdict && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                  style={{ background: vs.bg, borderColor: `${vs.border}40`, color: vs.text }}>
                                  {q.verdict}
                                </span>
                              )}
                              {typeof q.score === "number" && (
                                <span className="text-xs font-bold" style={{ color: scoreColor(q.score) }}>
                                  {q.score}/10
                                </span>
                              )}
                              <span className={`material-symbols-outlined text-white/40 text-sm transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}>
                                expand_more
                              </span>
                            </div>
                          </button>

                          {/* Accordion body info */}
                          <AnimatePresence initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4 text-xs">
                                  {/* Full Question Text */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Question Context</span>
                                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{q.questionText}</p>
                                  </div>

                                  {/* User Answer */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Your Answer Response</span>
                                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/2 leading-relaxed text-white/70 italic whitespace-pre-wrap">
                                      {q.answerText || "No response provided for this question."}
                                    </div>
                                  </div>

                                  {/* AI Feedback */}
                                  {q.aiFeedback && (
                                    <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-violet-400 text-sm">assignment</span>
                                        <span className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">AI Evaluation Critique</span>
                                      </div>
                                      <p className="text-white/75 leading-relaxed">{q.aiFeedback}</p>
                                    </div>
                                  )}

                                  {/* Improved/Reference Answer */}
                                  {q.improvedAnswer && (
                                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-emerald-400 text-sm">lightbulb</span>
                                        <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Model/Recommended Response</span>
                                      </div>
                                      <p className="text-white/75 leading-relaxed whitespace-pre-wrap">{q.improvedAnswer}</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/2">
                      <span className="material-symbols-outlined text-white/20 text-4xl block mb-2">comments_disabled</span>
                      <p className="text-xs text-white/30">No question transcripts were recorded for this session.</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionDetail;
