import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";


/* ─── Personas (mirrors InterviewSetup) ─────────────────────── */
const PERSONAS = [
  { name: "Sarah Chen", avatar: "SC", color: "#8b5cf6", title: "Principal Engineer @ Meta" },
  { name: "Marcus Webb", avatar: "MW", color: "#06b6d4", title: "Engineering Manager @ Google" },
  { name: "Priya Sharma", avatar: "PS", color: "#f59e0b", title: "Staff SDE @ Amazon" },
];

/* ─── SVG Vibe Meter ─────────────────────────────────────────── */
const VibeMeter = ({ score }) => {
  const pct = typeof score === "number" ? Math.max(0, Math.min(10, score)) / 10 : 0.5;
  const angle = -180 + pct * 180;
  const color = pct >= 0.7 ? "#22c55e" : pct >= 0.4 ? "#f59e0b" : "#ef4444";
  const label = pct >= 0.7 ? "Strong" : pct >= 0.4 ? "Average" : "Needs Work";
  const cx = 80, cy = 80, r = 60;
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(180), end = toXY(0);
  const needle = toXY(180 - pct * 180);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className="w-full max-w-[160px]">
        {/* Track */}
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke="#ffffff10" strokeWidth="10" strokeLinecap="round" />
        {/* Fill */}
        <motion.path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${needle.x} ${needle.y}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          animate={{ stroke: color }}
          transition={{ duration: 0.8 }}
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* Score */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {typeof score === "number" ? score : "—"}
        </text>
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="8" fontWeight="bold">
          {label}
        </text>
      </svg>
      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">Vibe Score</p>
    </div>
  );
};

/* ─── Typing dots indicator ───────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 w-fit">
    {[0, 1, 2].map((i) => (
      <motion.span key={i} className="w-2 h-2 rounded-full bg-violet-400"
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
    ))}
    <span className="ml-1 text-xs text-violet-400 font-medium">AI is thinking…</span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
const ChatInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* ── Config from War Room (or defaults) ──────────────────── */
  const routeConfig = location.state?.config || {};
  const [interviewDetails] = useState({
    company: routeConfig.company || "",
    jobRole: routeConfig.jobRole || "Software Engineer",
    level: routeConfig.level || "mid",
    focusArea: routeConfig.focusArea || "technical",
    track: routeConfig.track || "tech",
    mbaSpecialization: routeConfig.mbaSpecialization || "marketing",
  });
  const persona = PERSONAS[routeConfig.personaIdx ?? 0];

  /* ── Core State ─────────────────────────────────────────────── */
  const [interviewStage, setInterviewStage] = useState("setup");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerChecks, setAnswerChecks] = useState([]); // per-question verdict history
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answerCheck, setAnswerCheck] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [feedback, setFeedback] = useState("");
  const [hintCredits, setHintCredits] = useState(3);
  const [activeTab, setActiveTab] = useState("text"); // text | code | bullets
  const [keywords, setKeywords] = useState([]);

  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const lastCheckedRef = useRef({ questionIndex: -1, answer: "" });
  const textareaRef = useRef(null);

  /* ── Helpers ─────────────────────────────────────────────── */
  const getQuestionText = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") return String(item.question || item.q || "");
    return "";
  };

  const isBuiltInCompany = (company) => {
    const n = String(company || "").trim().toLowerCase();
    return n.includes("google") || n.includes("amazon") || n.includes("microsoft") || n === "ms";
  };

  const persistHistoryToServer = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch("/api/interview/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        credentials: "include",
      });
    } catch { /* ignore */ }
  };

  const appendFeedbackToHistory = (text) => {
    const entry = { date: new Date().toISOString(), text, mode: "chat", ...interviewDetails };
    try {
      const stored = localStorage.getItem("interviewFeedback");
      const existing = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(existing) ? existing : [];
      history.unshift(entry);
      localStorage.setItem("interviewFeedback", JSON.stringify(history.slice(0, 20)));
    } catch { localStorage.setItem("interviewFeedback", text); }
    void persistHistoryToServer(entry);
  };

  const persistPerQuestionHistory = (payload) => {
    const entry = { date: new Date().toISOString(), mode: "chat", ...interviewDetails, ...payload };
    try {
      const stored = localStorage.getItem("interviewQuestionHistory");
      const existing = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(existing) ? existing : [];
      history.unshift(entry);
      localStorage.setItem("interviewQuestionHistory", JSON.stringify(history.slice(0, 50)));
    } catch { /* ignore */ }
    void persistHistoryToServer(entry);
  };

  const verdictStyles = (verdict) => {
    const v = String(verdict || "").toLowerCase();
    if (v === "strong") return "bg-green-600/20 text-green-300 border-green-500/40";
    if (v === "okay") return "bg-yellow-600/20 text-yellow-300 border-yellow-500/40";
    if (v === "weak") return "bg-red-600/20 text-red-300 border-red-500/40";
    return "bg-gray-600/20 text-gray-300 border-gray-500/40";
  };

  const heatmapClass = (verdict) => {
    const v = String(verdict || "").toLowerCase();
    if (v === "strong") return "border-l-4 border-green-500 bg-green-500/5";
    if (v === "okay") return "border-l-4 border-yellow-500 bg-yellow-500/5";
    if (v === "weak") return "border-l-4 border-red-500 bg-red-500/5";
    return "border-l-4 border-white/10";
  };

  /* ── Extract keywords from answer ─────────────────────────── */
  useEffect(() => {
    const words = currentAnswer
      .split(/\s+/)
      .filter(w => w.length > 4)
      .map(w => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
      .filter(w => w.length > 4)
      .slice(-8);
    const unique = [...new Set(words)].slice(0, 6);
    setKeywords(unique);
  }, [currentAnswer]);

  /* ── Question fetch ──────────────────────────────────────── */
  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const useBank = isBuiltInCompany(interviewDetails.company);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          company: interviewDetails.company,
          jobRole: interviewDetails.jobRole,
          level: interviewDetails.level,
          focusArea: interviewDetails.focusArea,
          track: interviewDetails.track,
          mbaSpecialization: interviewDetails.mbaSpecialization,
          ...(useBank ? {} : { count: 5 }),
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch questions (${response.status})`);
      const data = await response.json();
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (!qs.length) throw new Error("No questions received");
      setQuestions(qs);
      setInterviewStage("interview");
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setCurrentAnswer("");
      setAnswerCheck(null);
      setAnswerChecks([]);
      setChatHistory([]);
      lastCheckedRef.current = { questionIndex: -1, answer: "" };
    } catch (error) {
      alert("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Push question into chat when index changes ──────────── */
  useEffect(() => {
    if (interviewStage !== "interview" || !questions.length) return;
    setCurrentAnswer(answers[currentQuestionIndex] || "");
    setAnswerCheck(null);
    setActiveTab("text");
    lastCheckedRef.current = { questionIndex: -1, answer: "" };
    const qText = getQuestionText(questions[currentQuestionIndex]);
    if (qText) {
      setIsTyping(true);
      setTimeout(() => {
        setChatHistory(prev => [...prev, { type: "ai", text: qText, id: Date.now() }]);
        setIsTyping(false);
      }, 1500);
    }
  }, [currentQuestionIndex, interviewStage, questions]);

  /* ── Timer ──────────────────────────────────────────────── */
  useEffect(() => {
    if (interviewStage === "interview") {
      setTimeLeft(300);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewStage, currentQuestionIndex]);

  /* ── Auto-scroll ──────────────────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  /* ── Auto-expand textarea ─────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current && activeTab === "text") {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [currentAnswer, activeTab]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Check Answer ─────────────────────────────────────────── */
  const checkCurrentAnswer = async () => {
    if (isCheckingAnswer) return null;
    const question = getQuestionText(questions[currentQuestionIndex]);
    const answer = currentAnswer.trim();
    if (!answer) { alert("Please write your answer first."); return null; }
    if (answerCheck && lastCheckedRef.current.questionIndex === currentQuestionIndex && lastCheckedRef.current.answer === answer) return answerCheck;
    setIsCheckingAnswer(true);
    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 25000);
      const response = await fetch("/api/interview/check-answer", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...interviewDetails, question, answer }),
        credentials: "include",
      });
      clearTimeout(tid);
      if (!response.ok) throw new Error(`Check failed (${response.status})`);
      const data = await response.json();
      setAnswerCheck(data);
      lastCheckedRef.current = { questionIndex: currentQuestionIndex, answer };
      return data;
    } catch (err) {
      const msg = err.name === "AbortError" ? "Request timed out." : "Failed to check answer.";
      const fallback = { source: "error", feedback: msg, verdict: "Unknown" };
      setAnswerCheck(fallback);
      return null;
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  /* ── Submit & advance ──────────────────────────────────────── */
  const submitAnswer = async () => {
    const answer = currentAnswer.trim();
    if (!answer) { alert("Please write your answer first."); return; }
    const alreadyChecked = !!answerCheck &&
      lastCheckedRef.current.questionIndex === currentQuestionIndex &&
      lastCheckedRef.current.answer === answer;
    let check = answerCheck;
    if (!alreadyChecked) { check = await checkCurrentAnswer(); if (!check) return; }

    // Save per-question
    persistPerQuestionHistory({
      score: typeof check?.score === "number" ? check.score : undefined,
      text: `Q${currentQuestionIndex + 1}: ${getQuestionText(questions[currentQuestionIndex])}\nA: ${answer}\nVerdict: ${check?.verdict || ""}\nFeedback: ${check?.feedback || ""}`,
    });

    // Push user bubble + AI ack
    setChatHistory(prev => [
      ...prev,
      { type: "user", text: answer, id: Date.now() },
    ]);

    const updated = [...answers];
    updated[currentQuestionIndex] = answer;
    setAnswers(updated);
    setAnswerChecks(prev => { const a = [...prev]; a[currentQuestionIndex] = check; return a; });
    setCurrentAnswer("");
    setAnswerCheck(null);
    lastCheckedRef.current = { questionIndex: -1, answer: "" };

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 400);
    }
  };

  /* ── Finish interview ──────────────────────────────────────── */
  const finishInterview = async () => {
    const answer = currentAnswer.trim();
    let finalAnswers = [...answers];
    let check = answerCheck;

    if (answer) {
      if (!check || lastCheckedRef.current.questionIndex !== currentQuestionIndex || lastCheckedRef.current.answer !== answer) {
        check = await checkCurrentAnswer();
        if (!check) return;
      }
      persistPerQuestionHistory({
        score: typeof check?.score === "number" ? check.score : undefined,
        text: `Q${currentQuestionIndex + 1}: ${getQuestionText(questions[currentQuestionIndex])}\nA: ${answer}`,
      });
      setChatHistory(prev => [...prev, { type: "user", text: answer, id: Date.now() }]);
      finalAnswers[currentQuestionIndex] = answer;
      setAnswers(finalAnswers);
      setAnswerChecks(prev => { const a = [...prev]; a[currentQuestionIndex] = check; return a; });
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...interviewDetails,
          questions: questions.map(getQuestionText),
          answers: finalAnswers,
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Feedback failed (${response.status})`);
      const data = await response.json();
      const fb = data?.feedback || "No feedback generated.";
      setFeedback(fb);
      appendFeedbackToHistory(fb);
      setInterviewStage("feedback");
    } catch {
      setFeedback("Could not generate detailed feedback. Review your answers above.");
      setInterviewStage("feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const useHint = () => {
    if (hintCredits <= 0) return;
    setHintCredits(h => h - 1);
    const q = getQuestionText(questions[currentQuestionIndex]);
    const hint = q.toLowerCase().includes("system design")
      ? "💡 Start by clarifying requirements and constraints. Then define your data model and high-level architecture before scaling."
      : q.toLowerCase().includes("behav") || q.toLowerCase().includes("tell me about")
      ? "💡 Use STAR: Situation → Task → Action → Result. Keep it under 2 minutes and end with the measurable outcome."
      : "💡 Define core concepts first. Then walk through a concrete example, discuss trade-offs, and summarize.";
    setChatHistory(prev => [...prev, { type: "hint", text: hint, id: Date.now() }]);
  };

  /* ── Derived UI ────────────────────────────────────────────── */
  const timerColor = timeLeft < 20 ? "text-red-400" : timeLeft < 60 ? "text-amber-400" : "text-white";
  const timerGlow = timeLeft < 20 ? "shadow-[0_0_20px_rgba(239,68,68,0.4)]" : timeLeft < 60 ? "shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "";

  /* ──────────────────────────────────────────────────────────── */
  /* ── SETUP STAGE ──────────────────────────────────────────── */
  /* ──────────────────────────────────────────────────────────── */
  if (interviewStage === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative">
        {/* BG */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center"
        >
          {/* Persona Avatar */}
          <motion.div
            animate={{ boxShadow: [`0 0 0 rgba(139,92,246,0.2)`, `0 0 40px rgba(139,92,246,0.5)`, `0 0 0 rgba(139,92,246,0.2)`] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6"
            style={{ backgroundColor: `${persona.color}25`, border: `2px solid ${persona.color}50` }}
          >
            {persona.avatar}
          </motion.div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">Interview Starting</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{persona.name}</h1>
          <p className="text-white/50 text-sm mb-2">{persona.title}</p>
          <p className="text-white/30 text-xs mb-8">
            {interviewDetails.company ? `${interviewDetails.company} · ` : ""}{interviewDetails.jobRole} · {interviewDetails.level} level
          </p>

          <motion.button
            onClick={generateQuestions}
            disabled={isLoading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{ boxShadow: isLoading ? "none" : ["0 0 20px rgba(139,92,246,0.3)", "0 0 40px rgba(139,92,246,0.6)", "0 0 20px rgba(139,92,246,0.3)"] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-lg tracking-wide disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                Generating Questions…
              </span>
            ) : "🚀 Begin Interview"}
          </motion.button>

          <button onClick={() => navigate("/interviewsetup")} className="mt-4 text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Back to War Room
          </button>
        </motion.div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────── */
  /* ── FEEDBACK / POST-INTERVIEW ─────────────────────────────── */
  /* ──────────────────────────────────────────────────────────── */
  if (interviewStage === "feedback") {
    const scores = answerChecks.filter(c => typeof c?.score === "number").map(c => c.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return (
      <div className="min-h-screen text-white px-4 py-10 max-w-5xl mx-auto relative">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Interview Complete</h1>
          <p className="text-white/50 text-sm">Here's your performance breakdown from {persona.name}</p>
        </motion.div>

        {/* Summary Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Overall Score", value: avgScore !== null ? `${avgScore}/10` : "N/A", color: "violet" },
            { label: "Questions", value: `${questions.length} of ${questions.length}`, color: "cyan" },
            { label: "Time Used", value: `${Math.floor((300 - timeLeft) / 60)}m ${(300 - timeLeft) % 60}s`, color: "amber" },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl border border-white/8 bg-white/3 p-5 text-center`}>
              <p className="text-2xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Heatmap Transcript */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[2rem] border border-white/8 bg-white/2 p-6 mb-8">
          <h2 className="font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center text-xs text-violet-300">📊</span>
            Answer Heatmap
          </h2>
          <div className="space-y-5">
            {questions.map((q, i) => {
              const check = answerChecks[i];
              const verdict = check?.verdict || "";
              return (
                <div key={i} className={`rounded-2xl p-5 ${heatmapClass(verdict)}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-bold text-white/80 flex-1">Q{i + 1}. {getQuestionText(q)}</p>
                    {verdict && (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border flex-shrink-0 ${verdictStyles(verdict)}`}>
                        {verdict}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {answers[i] ? `"${answers[i].substring(0, 180)}${answers[i].length > 180 ? "…" : ""}"` : <em className="text-white/25">No answer recorded</em>}
                  </p>
                  {check?.feedback && (
                    <p className="text-xs text-violet-300/70 mt-3 italic border-t border-white/5 pt-3">{check.feedback.split("\n")[0]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Summary */}
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-[2rem] border border-violet-500/20 bg-violet-500/5 p-6 mb-8">
            <h2 className="font-bold text-violet-300 mb-4 flex items-center gap-2">✨ AI Evaluation by {persona.name}</h2>
            <pre className="whitespace-pre-wrap font-sans text-white/70 leading-relaxed text-sm">{feedback}</pre>
          </motion.div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setInterviewStage("setup"); setQuestions([]); setAnswers([]); setAnswerChecks([]); setCurrentQuestionIndex(0); setFeedback(""); setChatHistory([]); }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold shadow-lg shadow-violet-500/20"
          >
            🔄 New Session
          </motion.button>
          <button onClick={() => navigate("/interviewsetup")} className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all">
            War Room Setup
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────── */
  /* ── INTERVIEW STAGE – 3-COLUMN WORKSTATION ────────────────── */
  /* ──────────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col text-white overflow-hidden relative">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-600/8 blur-[100px] rounded-full" />
      </div>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: `${persona.color}25`, border: `1px solid ${persona.color}40` }}>
            {persona.avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{persona.name}</p>
            <p className="text-[10px] text-white/30">{interviewDetails.company || "Mock"} · {interviewDetails.jobRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`font-mono text-lg font-black tabular-nums ${timerColor} ${timerGlow} transition-all`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-white/30 font-medium">Q{currentQuestionIndex + 1}/{questions.length}</div>
        </div>
      </div>

      {/* ── 3-COLUMN BODY ─────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex overflow-hidden min-h-0">

        {/* ═══════ LEFT PANEL – The Brief ═══════ */}
        <div className="w-[220px] flex-shrink-0 flex flex-col gap-4 p-4 border-r border-white/5 overflow-y-auto">

          {/* Question card */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-400 mb-2">Question {currentQuestionIndex + 1}</p>
            <p className="text-sm text-white/80 leading-relaxed">
              {getQuestionText(questions[currentQuestionIndex])}
            </p>
          </div>

          {/* Timer visual */}
          <div className={`rounded-2xl border bg-white/3 p-4 text-center transition-all ${timeLeft < 20 ? "border-red-500/40 bg-red-500/5" : timeLeft < 60 ? "border-amber-500/40 bg-amber-500/5" : "border-white/8"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Time Left</p>
            <p className={`text-3xl font-black tabular-nums ${timerColor}`}>{formatTime(timeLeft)}</p>
            {timeLeft < 60 && <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="text-[9px] font-bold text-amber-400 mt-1">⚡ Wrapping up soon</motion.p>}
          </div>

          {/* Hint credits */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Hint Credits</p>
            <div className="flex gap-1.5 mb-3">
              {[0, 1, 2].map(i => (
                <span key={i} className={`w-5 h-5 rounded-full border ${i < hintCredits ? "bg-violet-500 border-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "border-white/10 bg-transparent"}`} />
              ))}
            </div>
            <button
              onClick={useHint}
              disabled={hintCredits <= 0}
              className="w-full py-2 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              💡 Use Hint
            </button>
          </div>

          {/* Progress dots */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Progress</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => {
                const check = answerChecks[i];
                const isDone = !!answers[i];
                const isCurrent = i === currentQuestionIndex;
                return (
                  <div key={i} title={`Q${i + 1}`}
                    className={`w-7 h-7 rounded-full border text-[9px] font-black flex items-center justify-center transition-all ${
                      isCurrent ? "bg-violet-500 border-violet-400 text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                      : isDone && check?.verdict === "strong" ? "bg-green-500/20 border-green-500/50 text-green-300"
                      : isDone && check?.verdict === "weak" ? "bg-red-500/20 border-red-500/50 text-red-300"
                      : isDone ? "bg-white/10 border-white/20 text-white/60"
                      : "border-white/10 text-white/20"
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════ CENTER PANEL – Chat + Input ═══════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Chat messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatHistory.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/20">
                  <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="text-4xl mb-3">🎙️</motion.div>
                  <p className="text-sm">Waiting for question…</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {chatHistory.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.type === "ai" && (
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${persona.color}25`, border: `1px solid ${persona.color}40`, color: persona.color }}>
                        {persona.avatar}
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-violet-500/10 border border-violet-500/20 text-sm text-white/90 leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}
                  {msg.type === "user" && (
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white/8 border border-white/10 text-sm text-white/90 leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                  {msg.type === "hint" && (
                    <div className="w-full px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200 leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: `${persona.color}25`, border: `1px solid ${persona.color}40`, color: persona.color }}>
                  {persona.avatar}
                </div>
                <TypingIndicator />
              </motion.div>
            )}
          </div>

          {/* Input Tabs */}
          <div className="border-t border-white/5 bg-black/30 backdrop-blur-xl p-4 flex-shrink-0">
            {/* Tab bar */}
            <div className="flex items-center gap-2 mb-3">
              {["text", "code", "bullets"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                    activeTab === tab ? "bg-violet-600 border-violet-500 text-white" : "border-white/10 text-white/30 hover:text-white/60"
                  }`}>
                  {tab === "text" ? "✏️ Explain" : tab === "code" ? "💻 Code" : "📋 Bullets"}
                </button>
              ))}
              <div className="flex-1" />
              {isCheckingAnswer && (
                <span className="text-xs text-violet-400 flex items-center gap-1.5">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="block w-3 h-3 border border-violet-400 border-t-transparent rounded-full" />
                  Analyzing…
                </span>
              )}
            </div>

            {/* Input area */}
            <div className="relative group">
              {activeTab === "text" && (
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here… Speak your thinking, structure your response."
                  className="w-full min-h-[80px] max-h-[220px] bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/5 focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] resize-none transition-all leading-relaxed"
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitAnswer(); } }}
                />
              )}
              {activeTab === "code" && (
                <textarea
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder={`// Write your code here\nfunction solution(input) {\n  // Your approach\n}`}
                  className="w-full min-h-[140px] bg-[#0d0d14] border border-white/8 rounded-2xl px-5 py-4 text-sm text-emerald-300 placeholder-white/15 outline-none focus:border-violet-500/60 resize-none transition-all font-mono leading-relaxed"
                />
              )}
              {activeTab === "bullets" && (
                <textarea
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder={"• Point 1: Define the concept\n• Point 2: Walk through an example\n• Point 3: Discuss trade-offs\n• Point 4: Summarize"}
                  className="w-full min-h-[120px] bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/5 resize-none transition-all leading-relaxed"
                />
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-white/20 font-medium">Ctrl+Enter to submit · {currentAnswer.length} chars</p>
              <div className="flex gap-2">
                <button onClick={checkCurrentAnswer} disabled={isCheckingAnswer || !currentAnswer.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/8 hover:text-white/80 transition-all disabled:opacity-30">
                  Analyze
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button onClick={submitAnswer} disabled={isCheckingAnswer || !currentAnswer.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-40 flex items-center gap-1.5">
                    Submit & Next
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                ) : (
                  <button onClick={finishInterview} disabled={isLoading || isCheckingAnswer}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1.5">
                    {isLoading ? "Generating…" : "Finish Interview ✓"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ RIGHT PANEL – The Mentor ═══════ */}
        <div className="w-[220px] flex-shrink-0 flex flex-col gap-4 p-4 border-l border-white/5 overflow-y-auto">

          {/* Vibe Meter */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <VibeMeter score={answerCheck?.score} />
          </div>

          {/* Verdict badge */}
          {answerCheck?.verdict && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 ${verdictStyles(answerCheck.verdict)}`}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1">Verdict</p>
              <p className="font-bold text-sm">{answerCheck.verdict}</p>
            </motion.div>
          )}

          {/* Live Keywords */}
          {keywords.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2.5">Keywords Detected</p>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {keywords.map(k => (
                    <motion.span key={k} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 border border-violet-500/20 text-violet-300">
                      {k}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {answerCheck?.feedback && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">AI Insight</p>
              <p className="text-xs text-white/60 leading-relaxed">{answerCheck.feedback.split("\n")[0]}</p>
            </motion.div>
          )}

          {/* Strengths & Improvements */}
          {Array.isArray(answerCheck?.good) && answerCheck.good.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 mb-2">✓ Strengths</p>
              <ul className="space-y-1.5">
                {answerCheck.good.slice(0, 3).map((g, i) => (
                  <li key={i} className="text-[11px] text-white/60 leading-relaxed pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500/50">{g}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(answerCheck?.improve) && answerCheck.improve.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/70 mb-2">⚡ Refine</p>
              <ul className="space-y-1.5">
                {answerCheck.improve.slice(0, 3).map((g, i) => (
                  <li key={i} className="text-[11px] text-white/60 leading-relaxed pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-500/50">{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Encourage while empty */}
          {!answerCheck && !isCheckingAnswer && (
            <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
              <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                <p className="text-2xl mb-2">🧠</p>
                <p className="text-[11px] text-white/25 leading-relaxed">Start typing for live AI feedback</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterview;
