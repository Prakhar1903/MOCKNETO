import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from '@monaco-editor/react';
import html2canvas from 'html2canvas';
import PeerComparisonCard from "../components/PeerComparisonCard";

/* ─── Celebration Confetti ────────────────────────────────────── */
const CelebrationConfetti = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ["#8b5cf6", "#a78bfa", "#06b6d4", "#22d3ee", "#10b981", "#34d399", "#f59e0b", "#fbbf24"];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;
        
        if (p.y <= canvas.height) {
          active = true;
        }
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
        ctx.stroke();
      });
      
      if (active) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };
    
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
};

/* ─── Personas (mirrors InterviewSetup) ─────────────────────── */
const PERSONAS = [
  { name: "Sarah Chen", avatar: "SC", color: "#8b5cf6", title: "Principal Engineer @ Meta" },
  { name: "Marcus Webb", avatar: "MW", color: "#06b6d4", title: "Engineering Manager @ Google" },
  { name: "Priya Sharma", avatar: "PS", color: "#f59e0b", title: "Staff SDE @ Amazon" },
];

/* ─── SVG Vibe Meter ─────────────────────────────────────────── */
const VibeMeter = ({ score, isAwaiting }) => {
  const pct = !isAwaiting && typeof score === "number" ? Math.max(0, Math.min(10, score)) / 10 : 0.5;
  const color = isAwaiting ? "#ffffff20" : pct >= 0.7 ? "#10b981" : pct >= 0.4 ? "#f59e0b" : "#ef4444";
  const label = isAwaiting ? "Awaiting Data" : pct >= 0.7 ? "Strong" : pct >= 0.4 ? "Average" : "Needs Work";
  const cx = 80, cy = 80, r = 58;
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(180), end = toXY(0);
  const needle = toXY(180 + pct * 180);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className="w-full max-w-[160px]">
        {/* Track */}
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke="#ffffff08" strokeWidth="14" strokeLinecap="round" />
        {/* Fill */}
        <motion.path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${needle.x} ${needle.y}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          animate={{ stroke: color }}
          transition={{ duration: 0.8 }}
        />
        {/* Score */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={isAwaiting ? "rgba(255,255,255,0.2)" : "white"} fontSize="24" fontWeight="900" className="font-sans">
          {isAwaiting ? "—" : typeof score === "number" ? score : "—"}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize="9" fontWeight="bold" className="font-sans tracking-wide uppercase">
          {label}
        </text>
      </svg>
      <p className="text-[11px] text-white/40 uppercase tracking-widest font-black mt-2 flex items-center gap-1">
        <span className="material-symbols-outlined text-xs text-violet-400">monitoring</span>
        Vibe Score
      </p>
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

/* ─── Question-Specific Answer Structure Prompts ─────────────── */
const buildAnswerStructure = (question) => {
  const qText = String(question || "").trim();
  if (!qText) {
    return {
      title: "Structure Prompt",
      template:
        "• Point 1: Define the concept clearly\n" +
        "• Point 2: Walk through a simple example\n" +
        "• Point 3: Discuss key trade-offs and edge cases\n" +
        "• Point 4: Summarize"
    };
  }

  const qLower = qText.toLowerCase();

  // Tell me about yourself
  if (/tell\s+me\s+about\s+yourself/i.test(qLower)) {
    return {
      title: "Tell Me About Yourself",
      template:
        "• Present: Describe your current role, primary focus, and core expertise\n" +
        "• Past: Highlight a key past project, accomplishment, or relevant experience\n" +
        "• Future: Explain why this specific role/company is your next logical step"
    };
  }

  // Why company
  if (/why\s+(google|amazon|microsoft|meta|netflix|apple|uber|airbnb)\b/i.test(qLower) || (/why\b/.test(qLower) && /company|role/i.test(qLower))) {
    return {
      title: "Why This Company",
      template:
        "• Product/Culture: Mention a specific team, product, or cultural pillar that inspires you\n" +
        "• Experience Fit: Connect your prior accomplishments directly to their current challenge\n" +
        "• Growth & Impact: Share what you plan to learn and how you'll make an impact"
    };
  }

  // Strengths / Weaknesses
  if (/strengths?.*weakness|weakness|strengths?/i.test(qLower)) {
    return {
      title: "Strengths & Weaknesses",
      template:
        "• Strength: Highlight a real professional skill backed by a quick result or story\n" +
        "• Weakness: Share a genuine development area you have actively worked to improve\n" +
        "• Growth: Show self-awareness and describe the active steps you are taking to learn"
    };
  }

  // Behavioral (STAR)
  if (/\bconflict\b|\bdisagree\b|\bmistake\b|\bfailed\b|\bchallenge\b|\bleadership\b|\bproud\b/i.test(qLower)) {
    return {
      title: "STAR Method",
      template:
        "• Situation: Set the context and specify the challenge in 1-2 lines\n" +
        "• Task: Describe what your responsibility was and what needed to be done\n" +
        "• Action: Detail the specific steps YOU took (collaboration, engineering, problem-solving)\n" +
        "• Result: Share the measurable outcomes, lessons learned, and final impact"
    };
  }

  // System Design
  if (/system\s+design|architecture|design\s+a\b|design\s+.*service/i.test(qLower)) {
    return {
      title: "System Design",
      template:
        "• Requirements: Clarify functional requirements, QPS, latency, and system constraints\n" +
        "• Core Architecture: Outline high-level components, APIs, database choice, and schema\n" +
        "• Scalability: Address caching, sharding, replication, rate-limiting, and load balancers\n" +
        "• Trade-offs: Contrast alternative solutions and justify your final architecture"
    };
  }

  // Default Technical
  return {
    title: "Technical",
    template:
      "• Point 1: Define the core concept clearly and define any terminology\n" +
      "• Point 2: Explain how it works using a practical scenario or example\n" +
      "• Point 3: Highlight trade-offs (e.g. time/space complexity, performance bottlenecks)\n" +
      "• Point 4: Briefly summarize when to choose this approach over alternatives"
  };
};

/* ─── Custom Markdown Renderer ────────────────────────────────── */
const parseMarkdown = (text) => {
  if (!text) return "";
  const lines = String(text).split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let inList = false;
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-white/80">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-xs leading-relaxed">{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInlineMarkdown = (inlineText) => {
    const parts = inlineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index} className="px-1.5 py-0.5 rounded bg-white/10 text-violet-300 font-mono text-[11px] border border-white/5">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="bg-black/50 border border-white/10 rounded-xl p-4 my-2 overflow-x-auto text-[11px] font-mono text-emerald-400 leading-relaxed text-left">
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const listMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[1]);
      continue;
    } else {
      flushList(i);
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const headingClass = level === 1 ? "text-base font-black text-white mt-4 mb-2" : level === 2 ? "text-sm font-bold text-violet-300 mt-3 mb-1.5" : "text-xs font-semibold text-white/90 mt-2 mb-1";
      elements.push(
        <div key={`h-${i}`} className={headingClass}>
          {renderInlineMarkdown(content)}
        </div>
      );
      continue;
    }

    if (line.trim().length > 0) {
      elements.push(
        <p key={`p-${i}`} className="text-xs text-white/80 leading-relaxed my-1 text-left">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  }

  flushList(lines.length);
  return elements;
};

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
  const [activeCompletionTab, setActiveCompletionTab] = useState("results"); // "results", "study", "feedback"
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
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [expandedScorecardQuestions, setExpandedScorecardQuestions] = useState({});
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [startedAt] = useState(() => new Date());

  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const lastCheckedRef = useRef({ questionIndex: -1, answer: "" });
  const textareaRef = useRef(null);
  const feedbackRef = useRef(null);

  const currentVibeScore = useMemo(() => {
    if (answerCheck && typeof answerCheck.score === "number") {
      return answerCheck.score;
    }
    const completedScores = answerChecks
      .filter(c => c && typeof c.score === "number")
      .map(c => c.score);
    return completedScores.length > 0
      ? Math.round(completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length)
      : null;
  }, [answerCheck, answerChecks]);

  const isAwaitingVibe = currentVibeScore === null;

  /* ── Resizable Split Logic ─────────────────────────────────── */
  const [inputHeight, setInputHeight] = useState(260);
  const isResizingRef = useRef(false);

  const startResize = (e) => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", resizePanel);
    document.addEventListener("mouseup", stopResize);
    document.body.style.userSelect = "none";
  };

  const resizePanel = (e) => {
    if (!isResizingRef.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 160 && newHeight <= window.innerHeight * 0.7) {
      setInputHeight(newHeight);
    }
  };

  const stopResize = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", resizePanel);
    document.removeEventListener("mouseup", stopResize);
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", resizePanel);
      document.removeEventListener("mouseup", stopResize);
    };
  }, []);

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
      const response = await fetch("/api/interview/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      return await response.json();
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
    if (v === "strong") return "border border-green-500/10 border-l-4 border-l-emerald-500 bg-emerald-500/5";
    if (v === "okay") return "border border-yellow-500/10 border-l-4 border-l-amber-500 bg-amber-500/5";
    if (v === "weak") return "border border-red-500/10 border-l-4 border-l-red-500 bg-red-500/5";
    return "border border-white/5 border-l-4 border-l-white/20 bg-white/2";
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
          useResumeQuestions: routeConfig.useResumeQuestions || false,
          ...(useBank ? {} : { count: 5 }),
        }),
        credentials: "include",
      });
      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
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
      setExpandedQuestions({});
      setExpandedScorecardQuestions({});
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
        setChatHistory(prev => [...prev, { type: "ai", text: qText, id: Date.now(), qIndex: currentQuestionIndex }]);
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
      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
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

    // Push user bubble + AI ack
    setChatHistory(prev => [
      ...prev,
      { 
        type: "user", 
        text: answer, 
        id: Date.now(), 
        qIndex: currentQuestionIndex,
        score: typeof check?.score === "number" ? check.score : undefined,
        verdict: check?.verdict
      },
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
      setChatHistory(prev => [
        ...prev, 
        { 
          type: "user", 
          text: answer, 
          id: Date.now(), 
          qIndex: currentQuestionIndex,
          score: typeof check?.score === "number" ? check.score : undefined,
          verdict: check?.verdict
        }
      ]);
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
      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error(`Feedback failed (${response.status})`);
      const data = await response.json();
      let fb = data?.feedback;
      if (!fb || fb.toLowerCase().includes("no feedback generated")) {
        const checks = answerChecks.filter(Boolean);
        const weakCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("weak")).length;
        const strongCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("strong")).length;
        const avgCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("average") || String(c?.verdict).toLowerCase().includes("moderate")).length;
        fb = `Session Performance Summary:\n\nOut of the ${questions.length} questions presented, you answered ${finalAnswers.filter(Boolean).length} of them. Your responses were evaluated as having ${strongCount} Strong, ${avgCount} Average, and ${weakCount} Weak evaluations.\n\nTo improve your overall performance, focus on expanding short answers with specific examples and structural clarity (such as the STAR method). You can view the question-by-question breakdown above for targeted feedback.`;
      }
      setFeedback(fb);
      setInterviewStage("feedback");

      // Save to server
      const finalAnswerChecks = [...answerChecks];
      if (answer) {
        finalAnswerChecks[currentQuestionIndex] = check;
      }
      const answeredChecks = finalAnswerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "chat",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: persona?.name || "",
        score: avgScore,
        overallFeedback: fb,
        questions: questions.map((q, i) => ({
          questionText: getQuestionText(q),
          answerText: finalAnswers[i] || "",
          verdict: finalAnswerChecks[i]?.verdict || "",
          aiFeedback: finalAnswerChecks[i]?.feedback || finalAnswerChecks[i]?.helpful || "",
          score: finalAnswerChecks[i]?.score,
          improvedAnswer: finalAnswerChecks[i]?.improvedAnswer || "",
        })),
        startedAt: startedAt,
        endedAt: endedAtVal,
        duration: durationMins,
      };
      persistHistoryToServer(sessionPayload).then(saveRes => {
        if (saveRes && saveRes.id) {
          setSavedSessionId(saveRes.id);
        }
      });
    } catch (err) {
      console.error(err);
      const checks = answerChecks.filter(Boolean);
      const weakCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("weak")).length;
      const strongCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("strong")).length;
      const avgCount = checks.filter(c => String(c?.verdict).toLowerCase().includes("average") || String(c?.verdict).toLowerCase().includes("moderate")).length;
      const fb = `Session Performance Summary:\n\nOut of the ${questions.length} questions presented, you answered ${finalAnswers.filter(Boolean).length} of them. Your responses were evaluated as having ${strongCount} Strong, ${avgCount} Average, and ${weakCount} Weak evaluations.\n\nTo improve your overall performance, focus on expanding short answers with specific examples and structural clarity (such as the STAR method). You can view the question-by-question breakdown above for targeted feedback.`;
      setFeedback(fb);
      setInterviewStage("feedback");

      // Save to server (fallback)
      const finalAnswerChecks = [...answerChecks];
      if (answer) {
        finalAnswerChecks[currentQuestionIndex] = check;
      }
      const answeredChecks = finalAnswerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "chat",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: persona?.name || "",
        score: avgScore,
        overallFeedback: fb,
        questions: questions.map((q, i) => ({
          questionText: getQuestionText(q),
          answerText: finalAnswers[i] || "",
          verdict: finalAnswerChecks[i]?.verdict || "",
          aiFeedback: finalAnswerChecks[i]?.feedback || finalAnswerChecks[i]?.helpful || "",
          score: finalAnswerChecks[i]?.score,
          improvedAnswer: finalAnswerChecks[i]?.improvedAnswer || "",
        })),
        startedAt: startedAt,
        endedAt: endedAtVal,
        duration: durationMins,
      };
      persistHistoryToServer(sessionPayload).then(saveRes => {
        if (saveRes && saveRes.id) {
          setSavedSessionId(saveRes.id);
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useHint = () => {
    if (hintCredits <= 0) return;
    const alreadyHasHint = chatHistory.some(msg => msg.type === "hint" && msg.qIndex === currentQuestionIndex);
    if (alreadyHasHint) return;

    setHintCredits(h => h - 1);
    const q = getQuestionText(questions[currentQuestionIndex]);
    const hint = q.toLowerCase().includes("system design")
      ? "💡 Start by clarifying requirements and constraints. Then define your data model and high-level architecture before scaling."
      : q.toLowerCase().includes("behav") || q.toLowerCase().includes("tell me about")
      ? "💡 Use STAR: Situation → Task → Action → Result. Keep it under 2 minutes and end with the measurable outcome."
      : "💡 Define core concepts first. Then walk through a concrete example, discuss trade-offs, and summarize.";
    setChatHistory(prev => [...prev, { type: "hint", text: hint, id: Date.now(), qIndex: currentQuestionIndex }]);
  };

  const handleShare = async () => {
    if (!feedbackRef.current) return;
    try {
      const canvas = await html2canvas(feedbackRef.current, { backgroundColor: '#000000' });
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `Mockneto_Scorecard_${interviewDetails.company || "Mock"}.png`;
      a.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  /* ── Derived UI ────────────────────────────────────────────── */
  const timerColor = timeLeft < 20 ? "text-red-400" : timeLeft < 60 ? "text-amber-400" : "text-white";
  const timerGlow = timeLeft < 20 ? "shadow-[0_0_20px_rgba(239,68,68,0.4)]" : timeLeft < 60 ? "shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "";

  /* ──────────────────────────────────────────────────────────── */
  /* ── SETUP STAGE ──────────────────────────────────────────── */
  /* ──────────────────────────────────────────────────────────── */
  if (interviewStage === "setup") {
    return (
      <div className="h-full w-full flex items-center justify-center px-6 relative overflow-y-auto py-8">
        {/* BG */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 blur-[140px] rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white/3 backdrop-blur-xl border border-white/8 rounded-[2.5rem] p-8 md:p-10 text-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
        >
          {/* Persona Avatar */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full animate-pulse" style={{ backgroundColor: `${persona.color}40` }} />
            <motion.div
              animate={{ boxShadow: [`0 0 0 rgba(139,92,246,0.2)`, `0 0 40px rgba(139,92,246,0.5)`, `0 0 0 rgba(139,92,246,0.2)`] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="relative w-full h-full rounded-3xl flex items-center justify-center text-2xl font-black text-white"
              style={{ backgroundColor: `${persona.color}25`, border: `2px solid ${persona.color}50` }}
            >
              {persona.avatar}
            </motion.div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">Interview Starting</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{persona.name}</h1>
          <p className="text-white/50 text-sm mb-2">{persona.title}</p>
          <p className="text-white/30 text-xs mb-8">
            {interviewDetails.company ? `${interviewDetails.company} · ` : ""}{interviewDetails.jobRole} · {interviewDetails.level} level
          </p>

          <motion.button
            onClick={generateQuestions}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{ boxShadow: isLoading ? "none" : ["0 0 20px rgba(139,92,246,0.3)", "0 0 40px rgba(139,92,246,0.6)", "0 0 20px rgba(139,92,246,0.3)"] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-lg tracking-wide disabled:opacity-50 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                Generating Questions…
              </span>
            ) : "Begin Interview"}
          </motion.button>

          <button onClick={() => navigate("/dashboard")} className="mt-6 text-xs font-bold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-1.5 mx-auto">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Dashboard
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

    const getStudyRecommendations = () => {
      const recommendations = [];
      questions.forEach((q, idx) => {
        const check = answerChecks[idx];
        const isWeak = check?.score < 7 || check?.verdict === "Weak" || check?.verdict === "Needs Work";
        if (isWeak) {
          const qText = getQuestionText(q).toLowerCase();
          let topic = "";
          let resources = [];
          
          if (qText.includes("stack") || qText.includes("queue") || qText.includes("array") || qText.includes("list")) {
            topic = "Linear Data Structures & Space/Time Complexity";
            resources = [
              { title: "LeetCode: Queue & Stack", url: "https://leetcode.com/explore/learn/card/queue-stack/" },
              { title: "Big-O Complexity Cheat Sheet", url: "https://www.bigocheatsheet.com/" }
            ];
          } else if (qText.includes("recursion") || qText.includes("divide") || qText.includes("conquer") || qText.includes("merge")) {
            topic = "Recursion, Divide & Conquer, and Dynamic Programming";
            resources = [
              { title: "GFG: Divide and Conquer Algorithms", url: "https://www.geeksforgeeks.org/divide-and-conquer-algorithm-introduction/" },
              { title: "Khan Academy: Recursion Guide", url: "https://www.khanacademy.org/computing/computer-science/algorithms/recursive-algorithms/a/recursion" }
            ];
          } else if (qText.includes("bfs") || qText.includes("dfs") || qText.includes("tree") || qText.includes("graph")) {
            topic = "Graph & Tree Traversals (BFS, DFS, and Tree Depth)";
            resources = [
              { title: "LeetCode Explore: Binary Tree", url: "https://leetcode.com/explore/learn/card/data-structure-binary-tree/" },
              { title: "Visualizing Graph Traversals - VisuAlgo", url: "https://visualgo.net/en/dfsbfs" }
            ];
          } else if (qText.includes("sanitization") || qText.includes("express") || qText.includes("security") || qText.includes("node")) {
            topic = "Web Security, Input Sanitization & Backend Architecture";
            resources = [
              { title: "OWASP Top Ten Security Risks", url: "https://owasp.org/www-project-top-ten/" },
              { title: "Express.js Production Security Guide", url: "https://expressjs.com/en/advanced/best-practice-security.html" }
            ];
          } else if (qText.includes("async") || qText.includes("promise") || qText.includes("await") || qText.includes("event loop")) {
            topic = "Asynchronous JavaScript & Node.js Runtime Internals";
            resources = [
              { title: "MDN Web Docs: Asynchronous JS", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous" },
              { title: "JS Visualizer: Event Loop Explainer", url: "https://www.jsv9000.app/" }
            ];
          } else {
            topic = `Core Topic: ${getQuestionText(q).split(/[.?]/)[0]}`;
            resources = [
              { title: "MDN Web Development Reference", url: "https://developer.mozilla.org/" },
              { title: "roadmap.sh: Developer Roadmaps", url: "https://roadmap.sh" }
            ];
          }
          
          if (!recommendations.some(r => r.topic === topic)) {
            recommendations.push({ topic, question: getQuestionText(q), resources });
          }
        }
      });
      return recommendations;
    };

    return (
      <div className="h-full w-full flex flex-col justify-between text-white px-6 max-w-5xl mx-auto relative py-6 overflow-hidden">
        {avgScore !== null && avgScore >= 7 && <CelebrationConfetti />}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        </div>

        {/* Capture Container */}
        <div ref={feedbackRef} className="flex-1 min-h-0 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 mb-4 overflow-hidden">
          {/* Top Header Section (Fixed) */}
          <div className="flex-shrink-0 mb-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 relative">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
                <div className="relative w-full h-full rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">Interview Complete</h1>
              <p className="text-white/50 text-xs">Here's your performance breakdown from {persona.name}</p>
            </motion.div>

            {/* 3 Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Overall Score", value: avgScore !== null ? `${avgScore}/10` : "N/A", textClass: "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]" },
                { label: "Questions Completed", value: `${questions.length} of ${questions.length}`, textClass: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]" },
                { label: "Time Taken", value: `${Math.floor((300 - timeLeft) / 60)}m ${(300 - timeLeft) % 60}s`, textClass: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-white/3 py-4 px-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent pointer-events-none" />
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-1">{s.label}</p>
                  <div className={`text-2xl font-black ${s.textClass}`}>
                    {s.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Middle Tabbed Content Area */}
          <div className="flex-1 min-h-0 flex flex-col mb-2">
            {/* Tab Headers */}
            <div className="flex-shrink-0 flex justify-center border-b border-white/10 mb-4 gap-6">
              {[
                { id: "results", label: "Results" },
                { id: "study", label: "Study Plan" },
                { id: "feedback", label: "AI Feedback" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveCompletionTab(t.id)}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                    activeCompletionTab === t.id
                      ? "border-violet-500 text-violet-400 font-extrabold"
                      : "border-transparent text-white/40 hover:text-white/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Panel Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {activeCompletionTab === "results" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Heatmap Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/2 border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Answer Heatmap</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        {answerChecks.filter(c => String(c?.verdict).toLowerCase().includes("strong")).length} Strong
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                        {answerChecks.filter(c => {
                          const v = String(c?.verdict).toLowerCase();
                          return v.includes("average") || v.includes("moderate");
                        }).length} Average
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider">
                        {answerChecks.filter(c => {
                          const v = String(c?.verdict).toLowerCase();
                          return v.includes("weak") || v.includes("needs work") || v.includes("needs improvement");
                        }).length} Weak
                      </span>
                    </div>
                  </div>

                  {/* Flat Question List */}
                  <div className="space-y-4">
                    {questions.map((q, i) => {
                      const check = answerChecks[i];
                      const verdict = check?.verdict || "";
                      const isExpanded = !!expandedScorecardQuestions[i];
                      const toggleExpand = () => {
                        setExpandedScorecardQuestions(prev => ({
                          ...prev,
                          [i]: !prev[i],
                        }));
                      };
                      return (
                        <div key={i} className={`rounded-2xl p-4 border border-white/5 transition-all duration-300 ${heatmapClass(verdict)}`}>
                          <div 
                            className="flex items-center justify-between gap-4 cursor-pointer select-none"
                            onClick={toggleExpand}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-xs font-black text-white/30">Q{i + 1}</span>
                              <p className="text-sm font-bold text-white/90 truncate flex-1">{getQuestionText(q)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {verdict && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${verdictStyles(verdict)}`}>
                                  {verdict}
                                </span>
                              )}
                              <span className="material-symbols-outlined text-white/50 text-lg transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                expand_more
                              </span>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden space-y-4 text-left border-t border-white/5 pt-4"
                              >
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">Your Answer</p>
                                  <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 leading-relaxed text-left">
                                    {answers[i] ? parseMarkdown(answers[i]) : <em className="text-white/30 text-sm">No answer recorded</em>}
                                  </div>
                                </div>
                                {check && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Strengths */}
                                    {Array.isArray(check.good) && check.good.length > 0 && (
                                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1.5">✓ Key Strengths</p>
                                        <ul className="space-y-1.5">
                                          {check.good.map((g, idx) => (
                                            <li key={idx} className="text-xs text-white/70 pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-emerald-400/80">{g}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {/* Refinements */}
                                    {Array.isArray(check.improve) && check.improve.length > 0 && (
                                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5">⚡ Areas to Refine</p>
                                        <ul className="space-y-1.5">
                                          {check.improve.map((imp, idx) => (
                                            <li key={idx} className="text-xs text-white/70 pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-amber-400/80">{imp}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {check?.feedback && (
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">AI Coaching Feedback</p>
                                    <div className="text-xs text-white/70 leading-relaxed bg-violet-500/5 border border-violet-500/10 rounded-xl p-3.5 text-left">
                                      {parseMarkdown(check.feedback)}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeCompletionTab === "study" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {getStudyRecommendations().length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                        <p className="text-xs text-amber-300 font-medium">
                          Based on answers flagged as "Weak" or "Needs Work", Mockneto suggests reviewing these concepts:
                        </p>
                      </div>
                      {getStudyRecommendations().map((rec, rIdx) => (
                        <div key={rIdx} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-amber-400/80 mb-1">{rec.topic}</p>
                            <p className="text-xs text-white/80 font-medium">Identified from: <span className="italic text-white/50 font-normal">"{rec.question}"</span></p>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {rec.resources.map((res, resIdx) => (
                              <a key={resIdx} href={res.url} target="_blank" rel="noopener noreferrer"
                                className="px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5">
                                <span>{res.title}</span>
                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/5 bg-white/2 p-10 text-center text-white/40">
                      <span className="material-symbols-outlined text-4xl mb-3 text-emerald-400/70">task_alt</span>
                      <p className="text-sm font-bold">Excellent job! All answers were rated as strong. No study suggestions needed.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeCompletionTab === "feedback" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {feedback ? (() => {
                    const cleanFeedback = feedback.replace(/^Session Performance Summary:\s*/i, "");
                    return (
                      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-violet-600/5 blur-[50px] rounded-full pointer-events-none" />
                        <h2 className="font-bold text-violet-300 mb-4 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[16px] text-violet-400">workspace_premium</span>
                          AI Evaluation Summary
                        </h2>
                        <div className="whitespace-pre-wrap font-medium text-white/80 leading-relaxed text-sm">
                          {parseMarkdown(cleanFeedback)}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="rounded-2xl border border-white/5 bg-white/2 p-10 text-center text-white/40">
                      <p className="text-sm font-bold">No evaluation feedback summary available.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTAs (Fixed) */}
        <div className="flex-shrink-0 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">share</span> Share Scorecard
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (savedSessionId) {
                navigate(`/session/${savedSessionId}`);
              } else {
                navigate('/interview-replay', { state: { questions, answers, answerChecks, interviewDetails, feedback } });
              }
            }}
            className="px-8 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span> Replay Session
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setInterviewStage("setup"); setQuestions([]); setAnswers([]); setAnswerChecks([]); setCurrentQuestionIndex(0); setFeedback(""); setChatHistory([]); setExpandedQuestions({}); setExpandedScorecardQuestions({}); }}
            className="px-8 py-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-300 font-bold hover:bg-violet-500/20 hover:border-violet-500/40 transition-all flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> New Session
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/5 font-bold text-white/60 hover:text-white/90 hover:bg-white/10 transition-all flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span> Back to Dashboard
          </motion.button>
        </div>

        {/* Peer Comparison Widget */}
        {avgScore !== null && (
          <div className="mt-4">
            <PeerComparisonCard
              score={avgScore}
              focusArea={interviewDetails.focusArea}
              track={interviewDetails.track}
            />
          </div>
        )}
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────── */
  /* ── INTERVIEW STAGE – 3-COLUMN WORKSTATION ────────────────── */
  /* ──────────────────────────────────────────────────────────── */
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).filter(Boolean).length : 0;
  const isMinWordMet = wordCount >= 50;


  return (
    <div className="h-full w-full flex flex-col text-white overflow-hidden relative">
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
              Use Hint
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
              {/* Answered Questions Collapsed */}
              {Array.from({ length: currentQuestionIndex }).map((_, qIdx) => {
                const qMessages = chatHistory.filter(msg => msg.qIndex === qIdx);
                if (qMessages.length === 0) return null;
                const isExpanded = !!expandedQuestions[qIdx];
                return (
                  <motion.div 
                    key={`collapsed-q-${qIdx}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-white/5 bg-white/2 rounded-2xl p-3.5 space-y-3 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      {(() => {
                        const check = answerChecks[qIdx];
                        const score = check?.score;
                        const verdict = String(check?.verdict || "").toLowerCase();

                        let dotColorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                        let badgeText = "Needs Work";
                        let badgeColorClass = "border-red-500/30 bg-red-500/10 text-red-400";

                        if (verdict.includes("strong") || (typeof score === "number" && score >= 7)) {
                          dotColorClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                          badgeText = "Strong";
                          badgeColorClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
                        } else if (verdict.includes("average") || verdict.includes("moderate") || (typeof score === "number" && score >= 5)) {
                          dotColorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
                          badgeText = "Average";
                          badgeColorClass = "border-amber-500/30 bg-amber-500/10 text-amber-400";
                        } else if (check) {
                          dotColorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                          badgeText = check.verdict || "Weak";
                          badgeColorClass = "border-red-500/30 bg-red-500/10 text-red-400";
                        } else {
                          dotColorClass = "bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]";
                          badgeText = "Answered";
                          badgeColorClass = "border-white/10 bg-white/5 text-white/50";
                        }

                        return (
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${dotColorClass}`} />
                            <span className="text-[11px] text-white/55 font-bold uppercase tracking-wider">Question {qIdx + 1} Answered</span>
                            {check && (
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${badgeColorClass}`}>
                                {typeof score === "number" ? `${badgeText} · ${score}/10` : badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <button 
                        onClick={() => setExpandedQuestions(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 bg-white/3 hover:bg-white/6 text-white/60 hover:text-white transition-colors"
                      >
                        {isExpanded ? "Hide Context" : "View Context"}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="space-y-3 pl-3 border-l border-white/10 pt-1">
                        {qMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.type === "ai" && (
                              <div className="flex items-start gap-3 max-w-[85%]">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                                  style={{ backgroundColor: `${persona.color}25`, border: `1px solid ${persona.color}40`, color: persona.color }}>
                                  {persona.avatar}
                                </div>
                                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-violet-500/10 border border-violet-500/20 text-xs text-white/80 leading-relaxed">
                                  {msg.text}
                                </div>
                              </div>
                            )}
                            {msg.type === "user" && (
                              <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                                <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/30 text-xs text-violet-100 leading-relaxed shadow-[0_0_12px_rgba(139,92,246,0.05)]">
                                  {msg.text}
                                </div>
                                {typeof msg.score === "number" && (
                                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/45">
                                    <span>Answer Evaluated</span>
                                    <span className={`px-2 py-0.5 rounded-full border ${verdictStyles(msg.verdict)}`}>
                                      {msg.verdict} · {msg.score}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.type === "hint" && (
                              <div className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-500/8 border-y border-r border-amber-500/20 border-l-4 border-l-amber-500/90 text-xs text-amber-200 leading-relaxed shadow-[0_0_12px_rgba(245,158,11,0.05)]">
                                {msg.text}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Active Question Messages */}
              {chatHistory.filter(msg => msg.qIndex === undefined || msg.qIndex === currentQuestionIndex).map(msg => (
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
                    <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
                      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/30 text-sm text-violet-100 leading-relaxed shadow-[0_0_15px_rgba(139,92,246,0.05)]">
                        {msg.text}
                      </div>
                      {typeof msg.score === "number" && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/45">
                          <span>Answer Evaluated</span>
                          <span className={`px-2 py-0.5 rounded-full border ${verdictStyles(msg.verdict)}`}>
                            {msg.verdict} · {msg.score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.type === "hint" && (
                    activeTab === "code" ? (
                      <div className="w-full px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-300/60 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <span>💡</span> Hint active for this question
                        </span>
                        <button 
                          onClick={() => setActiveTab("text")}
                          className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-extrabold uppercase tracking-widest text-[9px] transition-colors"
                        >
                          Switch to Explain to view
                        </button>
                      </div>
                    ) : (
                      <div className="w-full px-4 py-3 rounded-2xl bg-amber-500/8 border-y border-r border-amber-500/20 border-l-4 border-l-amber-500/90 text-sm text-amber-200 leading-relaxed shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                        {msg.text}
                      </div>
                    )
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

          {/* Resize Handler Bar */}
          <div
            onMouseDown={startResize}
            className="h-1 bg-white/5 hover:bg-violet-500/80 active:bg-violet-500 cursor-ns-resize transition-colors flex items-center justify-center relative group z-30 flex-shrink-0"
          >
            <div className="absolute w-8 h-1 rounded bg-white/20 group-hover:bg-white/50" />
          </div>

          {/* Input Tabs */}
          <div
            className="border-t border-white/5 bg-black/30 backdrop-blur-xl p-4 flex-shrink-0 flex flex-col min-h-[160px]"
            style={{ height: `${inputHeight}px` }}
          >
            {/* Tab bar */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              {["text", "code", "bullets"].map(tab => {
                const icon = tab === "text" ? "description" : tab === "code" ? "code" : "format_list_bulleted";
                const label = tab === "text" ? "Explain" : tab === "code" ? "Code" : "Bullets";
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                      activeTab === tab ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "border-white/10 text-white/40 hover:text-white/70"
                    }`}>
                    <span className="material-symbols-outlined text-[13px]">{icon}</span>
                    {label}
                  </button>
                );
              })}
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
            <div className="relative group flex-1 min-h-0">
              {activeTab === "text" && (
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  disabled={isLoading || isCheckingAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here… Speak your thinking, structure your response."
                  className="w-full h-full bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/5 focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] resize-none transition-all leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (currentQuestionIndex < questions.length - 1) {
                        submitAnswer();
                      } else {
                        setShowFinishConfirm(true);
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setCurrentAnswer("");
                    }
                  }}
                />
              )}
              {activeTab === "code" && (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/8">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={currentAnswer}
                    onChange={(val) => setCurrentAnswer(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 15,
                      lineHeight: 24,
                      wordWrap: "on",
                      padding: { top: 12, bottom: 12 },
                      scrollBeyondLastLine: false,
                      readOnly: isLoading || isCheckingAnswer,
                    }}
                  />
                </div>
              )}
              {activeTab === "bullets" && (
                <textarea
                  value={currentAnswer}
                  disabled={isLoading || isCheckingAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder={buildAnswerStructure(getQuestionText(questions[currentQuestionIndex])).template}
                  className="w-full h-full bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/5 resize-none transition-all leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (currentQuestionIndex < questions.length - 1) {
                        submitAnswer();
                      } else {
                        setShowFinishConfirm(true);
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setCurrentAnswer("");
                    }
                  }}
                />
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-3 flex-shrink-0">
              <p className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${isMinWordMet ? "text-emerald-400" : "text-white/45"}`}>
                Ctrl+Enter to submit · ESC to clear · {wordCount} / min. 50 words
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={checkCurrentAnswer} 
                  disabled={isCheckingAnswer || !currentAnswer.trim()}
                  title="Analyze your draft answer to get instant AI coaching feedback before final submission"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Analyze
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button onClick={submitAnswer} disabled={isCheckingAnswer || !currentAnswer.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-40 flex items-center gap-1.5">
                    Submit & Next
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                ) : (
                  <button onClick={() => setShowFinishConfirm(true)} disabled={isLoading || isCheckingAnswer}
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
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col items-center justify-center min-h-[160px] text-center flex-shrink-0">
            <VibeMeter score={currentVibeScore} isAwaiting={isAwaitingVibe} />
          </div>

          {/* Camera Feed Placeholder */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col items-center justify-center min-h-[160px] text-center relative overflow-hidden group flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
            <svg className="w-8 h-8 text-white/20 mb-2.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h4a2 2 0 0 1 2 2v3m1 1 3.5-3.5v13L16 16z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest relative z-10">Camera Feed Off</p>
            <p className="text-[9px] text-white/20 mt-1 relative z-10">Chat Mode Active</p>
          </div>

          {/* Live AI Coach - Empty/Placeholder State */}
          {!answerCheck && !isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 text-center flex flex-col items-center justify-center min-h-[160px] shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden group flex-shrink-0">
              <div className="absolute -inset-px bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="material-symbols-outlined text-violet-400 text-3xl mb-2 relative z-10 animate-pulse">psychology</span>
              <p className="text-[10px] text-violet-300 font-extrabold uppercase tracking-widest mb-1 relative z-10">Live AI Coach</p>
              <p className="text-[10px] text-white/40 leading-relaxed relative z-10">Submit an answer to see real-time insights and strengths</p>
            </div>
          )}

          {/* Live AI Coach - Loading State */}
          {isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 text-center flex flex-col items-center justify-center min-h-[160px] shadow-[0_0_20px_rgba(139,92,246,0.15)] relative overflow-hidden group flex-shrink-0">
              <div className="absolute -inset-px bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-2xl opacity-50" />
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="block w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full mb-2.5 relative z-10" />
              <p className="text-[10px] text-violet-300 font-extrabold uppercase tracking-widest mb-1 relative z-10 animate-pulse">Analyzing Answer</p>
              <p className="text-[10px] text-white/40 leading-relaxed relative z-10">AI Coach is reviewing your response...</p>
            </div>
          )}

          {/* Live AI Coach - Active/Populated State Header */}
          {answerCheck && !isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/15 p-4 flex items-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden group flex-shrink-0">
              <div className="absolute -inset-px bg-gradient-to-tr from-violet-500/5 to-indigo-500/5 rounded-2xl opacity-50" />
              <span className="material-symbols-outlined text-violet-400 text-2xl animate-pulse relative z-10">psychology</span>
              <div className="relative z-10">
                <p className="text-[10px] text-violet-300 font-extrabold uppercase tracking-widest">Live AI Coach</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Analysis Active</p>
              </div>
            </div>
          )}

          {/* Verdict badge */}
          {answerCheck?.verdict && !isCheckingAnswer && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 shadow-[0_0_15px_rgba(139,92,246,0.05)] ${verdictStyles(answerCheck.verdict)}`}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1">Verdict</p>
              <p className="font-bold text-sm">{answerCheck.verdict}</p>
            </motion.div>
          )}

          {/* Live Keywords */}
          {keywords.length > 0 && !isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/5 p-4 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400/85 mb-2.5">Keywords Detected</p>
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
          {answerCheck?.feedback && !isCheckingAnswer && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-violet-500/20 bg-violet-950/5 p-4 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400/85 mb-2">AI Insight</p>
              <p className="text-xs text-white/60 leading-relaxed">{answerCheck.feedback.split("\n")[0]}</p>
            </motion.div>
          )}

          {/* Strengths & Improvements */}
          {Array.isArray(answerCheck?.good) && answerCheck.good.length > 0 && !isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/5 p-4 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 mb-2">✓ Strengths</p>
              <ul className="space-y-1.5">
                {answerCheck.good.slice(0, 3).map((g, i) => (
                  <li key={i} className="text-[11px] text-white/60 leading-relaxed pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500/50">{g}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(answerCheck?.improve) && answerCheck.improve.length > 0 && !isCheckingAnswer && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/5 p-4 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/70 mb-2">⚡ Refine</p>
              <ul className="space-y-1.5">
                {answerCheck.improve.slice(0, 3).map((g, i) => (
                  <li key={i} className="text-[11px] text-white/60 leading-relaxed pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-500/50">{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* End Interview Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-3xl text-center shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-lg">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">End Interview?</h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              Are you sure you want to finish the interview? This will submit your final answers and generate your AI feedback report. You cannot undo this action.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowFinishConfirm(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all flex-1"
              >
                Keep Going
              </button>
              <button 
                onClick={async () => {
                  setShowFinishConfirm(false);
                  await finishInterview();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90 transition-all flex-1 shadow-lg shadow-emerald-600/10"
              >
                End Interview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChatInterview;
