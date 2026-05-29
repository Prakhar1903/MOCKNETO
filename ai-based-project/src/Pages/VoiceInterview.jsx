import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
// useEffect, useRef, useState } from "react";
import {
  getMbaFocusAreas,
  getMbaJobRoleSuggestions,
  getMbaSpecialization,
  MBA_SPECIALIZATIONS,
} from "../utils/mbaCatalog";
import { useMicMonitor } from "../hooks/useMicMonitor";

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
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke="#ffffff08" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${needle.x} ${needle.y}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          animate={{ stroke: color }}
          transition={{ duration: 0.8 }}
        />
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

const VOICE_PERSONAS = [
  { name: "Sarah Chen", avatar: "SC", color: "#8b5cf6", title: "Principal Engineer @ Meta" },
  { name: "Marcus Webb", avatar: "MW", color: "#06b6d4", title: "Engineering Manager @ Google" },
  { name: "Priya Sharma", avatar: "PS", color: "#f59e0b", title: "Staff SDE @ Amazon" },
];

const VoiceInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeConfig = location.state?.config || {};
  const streamRef = useRef(null);
  const monitorAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const persona = VOICE_PERSONAS[routeConfig.personaIdx ?? 0];

  const [interviewDetails, setInterviewDetails] = useState({
    company: routeConfig.company || "",
    jobRole: routeConfig.jobRole || "Software Engineer",
    level: routeConfig.level || "mid",
    focusArea: routeConfig.focusArea || "behavioral",
    track: routeConfig.track || "tech",
    mbaSpecialization: routeConfig.mbaSpecialization || "marketing",
  });

  const [permissionError, setPermissionError] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerChecks, setAnswerChecks] = useState([]);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [startedAt] = useState(() => new Date());
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [assistantHelp, setAssistantHelp] = useState(null); // { approach, sampleAnswer, spokenText }
  const [answerCheck, setAnswerCheck] = useState(null); // { index, answer, feedback, source }
  const [isChecking, setIsChecking] = useState(false);
  const [answerStructure, setAnswerStructure] = useState(null); // { title, template }
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStage, setInterviewStage] = useState("initializing");
  const [feedback, setFeedback] = useState("");
  const lastCheckedAnswerRef = useRef("");
  const [hintCredits, setHintCredits] = useState(3);
  const [submitWarning, setSubmitWarning] = useState(null); // null | 'empty' | 'short'

  const verdictStyles = (verdict) => {
    const v = String(verdict || "").toLowerCase();
    if (v === "strong") return "bg-green-600/20 text-green-200 border border-green-500/40";
    if (v === "okay") return "bg-yellow-600/20 text-yellow-200 border border-yellow-500/40";
    if (v === "weak") return "bg-red-600/20 text-red-200 border border-red-500/40";
    return "bg-gray-600/20 text-gray-200 border border-gray-500/40";
  };

  const persistHistoryToServer = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/interview/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return await res.json();
    } catch {
      // ignore
    }
  };

  const appendFeedbackToHistory = (text) => {
    const entry = {
      date: new Date().toISOString(),
      text,
      mode: "voice",
      company: interviewDetails.company,
      jobRole: interviewDetails.jobRole,
      level: interviewDetails.level,
      focusArea: interviewDetails.focusArea,
      track: interviewDetails.track,
      mbaSpecialization: interviewDetails.mbaSpecialization,
    };

    try {
      const stored = localStorage.getItem("interviewFeedback");
      const existing = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(existing) ? existing : [];
      history.unshift(entry);
      localStorage.setItem("interviewFeedback", JSON.stringify(history.slice(0, 20)));
    } catch {
      localStorage.setItem("interviewFeedback", text);
    }

    void persistHistoryToServer(entry);
  };

  const persistPerQuestionHistory = (payload) => {
    const entry = {
      date: new Date().toISOString(),
      mode: "voice",
      company: interviewDetails.company,
      jobRole: interviewDetails.jobRole,
      level: interviewDetails.level,
      focusArea: interviewDetails.focusArea,
      track: interviewDetails.track,
      mbaSpecialization: interviewDetails.mbaSpecialization,
      ...payload,
    };

    try {
      const stored = localStorage.getItem("interviewQuestionHistory");
      const existing = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(existing) ? existing : [];
      history.unshift(entry);
      localStorage.setItem(
        "interviewQuestionHistory",
        JSON.stringify(history.slice(0, 50)),
      );
    } catch {
      // ignore
    }

    void persistHistoryToServer(entry);
  };

  const recognitionRef = useRef(null);
  const sttSessionRef = useRef({ final: "", interim: "" });
  const shouldListenRef = useRef(false);
  const lastHelpQuestionIndexRef = useRef(-1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);

  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const { isMicActive, lastError: micMonitorError } = useMicMonitor(localStream);

  useEffect(() => {
    if (interviewStage === "interview") {
      if (isMicActive) {
        setTimeLeft(prev => prev); // Ensure state is ready
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 0) { clearInterval(timerRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        clearInterval(timerRef.current);
      }
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewStage, currentQuestionIndex, isMicActive]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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

  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('appSettings');
        const parsed = raw ? JSON.parse(raw) : null;
        const next = parsed && typeof parsed.autoPlayVoice === 'boolean' ? parsed.autoPlayVoice : true;
        setAutoPlayVoice(next);
      } catch {
        setAutoPlayVoice(true);
      }
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('settings-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('settings-updated', sync);
    };
  }, []);

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const getQuestionText = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") return String(item.question || item.q || "");
    return "";
  };

  useEffect(() => {
    if (interviewStage === "initializing") {
      const init = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (stream) {
            setLocalStream(stream);
            setIsMicOn(true);
            await generateQuestions();
          }
        } catch (err) {
          setPermissionError("Microphone access denied or disconnected.");
        }
      };
      init();
    }
  }, [interviewStage]);

  const getIdealAnswer = (item) => {
    if (!item || typeof item !== "object") return "";
    return String(item.answer || item.a || "").trim();
  };

  const getReferences = (item) => {
    if (!item || typeof item !== "object") return [];
    return Array.isArray(item.references) ? item.references : [];
  };

  const normalizeCompany = (value) => normalizeText(value).toLowerCase();

  const isBuiltInCompany = (company) => {
    const c = normalizeCompany(company);
    return c.includes("google") || c.includes("amazon") || c.includes("microsoft") || c === "ms";
  };

  const buildAnswerStructure = (question) => {
    const q = normalizeText(question);
    const qLower = q.toLowerCase();

    if (!q) {
      return {
        title: "Quick Structure",
        template:
          "1) 1-line summary\n" +
          "2) 2–3 supporting points\n" +
          "3) Example / evidence\n" +
          "4) Close with impact / learning",
      };
    }

    // Tell me about yourself
    if (/tell\s+me\s+about\s+yourself/i.test(q)) {
      return {
        title: "Tell Me About Yourself (Present–Past–Future)",
        template:
          "Present: I’m a ___ with ___ years of experience in ___.\n" +
          "Past: Recently I worked on ___, using ___, and achieved ___.\n" +
          "Future: I’m excited about this role because ___.\n" +
          "Close: My strengths are ___ and ___.",
      };
    }

    // Why company
    if (
      /^why\s+(google|amazon|microsoft)\b/i.test(q) ||
      (/\bwhy\b/.test(qLower) &&
        (qLower.includes("google") || qLower.includes("amazon") || qLower.includes("microsoft")))
    ) {
      return {
        title: "Why This Company (3 reasons)",
        template:
          "1) Mission/Product: I’m motivated by ___ (specific product/team).\n" +
          "2) Role fit: My experience in ___ matches ___ (requirement).\n" +
          "3) Growth/Impact: I want to grow in ___ and deliver ___.\n" +
          "Close: In the first 90 days, I can contribute by ___.",
      };
    }

    // Strengths / weaknesses
    if (/strengths?.*weakness|weakness|strengths?/i.test(q)) {
      return {
        title: "Strengths & Weakness (Balanced)",
        template:
          "Strength: ___\n" +
          "Proof: Example: ___\n" +
          "Impact: Result/metric: ___\n\n" +
          "Weakness: ___ (honest, non-fatal)\n" +
          "Fix: What I’m doing: ___\n" +
          "Progress: Evidence: ___",
      };
    }

    // Salary
    if (/salary\s+expectations|compensation/i.test(qLower)) {
      return {
        title: "Salary (Range + Flexibility)",
        template:
          "Range: Based on research, I’m targeting ___–___.\n" +
          "Factors: role scope, location, and total comp.\n" +
          "Flexibility: I’m flexible for the right role and growth.\n" +
          "Question: What’s the budgeted range for this position?",
      };
    }

    // End-of-interview questions
    if (/do\s+you\s+have\s+any\s+questions\?|end\s+of\s+your/i.test(qLower)) {
      return {
        title: "Questions To Ask (Pick 2–3)",
        template:
          "1) What does success look like in the first 90 days?\n" +
          "2) What are the biggest challenges for the team right now?\n" +
          "3) How do you measure impact for this role?\n" +
          "4) What is the interview timeline from here?",
      };
    }

    // Product improvement
    if (/improve\s+an\s+existing\s+google\s+product|improve\s+an\s+existing\s+product|improve\s+google\s+product/i.test(qLower)) {
      return {
        title: "Product Improvement (User–Problem–Solution)",
        template:
          "User: target user segment: ___\n" +
          "Problem: current pain point: ___\n" +
          "Goal metric: what improves (NPS/retention/latency): ___\n" +
          "Solution: 1–2 changes: ___\n" +
          "Trade-offs/Risks: ___\n" +
          "Rollout: A/B test + success criteria: ___",
      };
    }

    // System design
    if (/design\s+a\s+url\s+shortening|url\s+shorten|bit\.ly|design\s+a\s+.*service|system\s+design/i.test(qLower)) {
      return {
        title: "System Design (Clarify → Design → Scale)",
        template:
          "1) Clarify requirements: features + constraints (QPS, latency, storage).\n" +
          "2) API: endpoints + request/response.\n" +
          "3) Data model: tables/keys/indexes.\n" +
          "4) Architecture: services + DB + cache + queue.\n" +
          "5) Scaling: sharding, caching, rate limiting, CDN.\n" +
          "6) Reliability/security: retries, idempotency, abuse prevention.\n" +
          "7) Trade-offs + monitoring.",
      };
    }

    // URL in browser
    if (/what\s+happens\s+when\s+you\s+enter\s+a\s+url|web\s+browser/i.test(qLower)) {
      return {
        title: "Explain A Process (Steps + Why)",
        template:
          "1) DNS lookup → IP\n" +
          "2) TCP/TLS handshake\n" +
          "3) HTTP request/response\n" +
          "4) Parse HTML/CSS/JS\n" +
          "5) Render + load resources\n" +
          "6) Caching/CDN considerations\n" +
          "Close: key bottlenecks + how to debug.",
      };
    }

    // Behavioral (STAR)
    if (
      /\btell me about a time\b|\bdescribe a time\b|\bdisagreed\b|\bconflict\b|\bteam\s+project\b|\bchallenge\b|\bfeedback\b|\bcriticism\b|\bremote\s+team\b|\bstakeholder\b|\bteammate\b/i.test(
        qLower
      )
    ) {
      return {
        title: "Behavioral (STAR + Metrics)",
        template:
          "S (Situation): context in 1–2 lines: ___\n" +
          "T (Task): what I owned / goal: ___\n" +
          "A (Action): 2–4 actions (communication + execution):\n" +
          "- ___\n- ___\n- ___\n" +
          "R (Result): measurable outcome + learning: ___",
      };
    }

    // Default technical
    return {
      title: "Technical (Explain + Example)",
      template:
        "1) Define in 1 line\n" +
        "2) Explain with a simple example\n" +
        "3) Key trade-offs / edge cases\n" +
        "4) Complexity / performance (if relevant)\n" +
        "5) Quick summary",
    };
  };

  const appendUnique = (base, addition) => {
    const b = normalizeText(base);
    const a = normalizeText(addition);
    if (!a) return b;
    if (!b) return a;
    // Avoid repeating same chunk (common with interim/continuous STT)
    if (b.toLowerCase().endsWith(a.toLowerCase())) return b;
    return `${b} ${a}`.trim();
  };

  const buildAssistantHelp = (question) => {
    const q = normalizeText(question);
    const isBehavioral = /\btell me about a time\b|\bhandled\b|\bconflict\b|\bstakeholder\b|\bteammate\b|\bdisagree\b/i.test(q);

    // Company-specific sample (user-provided) for Microsoft Q1
    if (
      normalizeCompany(interviewDetails.company).includes("microsoft") &&
      /tell\s+me\s+about\s+yourself/i.test(q)
    ) {
      const approach =
        "Approach (60–90 seconds):\n" +
        "1) Present: current role/strengths\n" +
        "2) Past: 1–2 key achievements\n" +
        "3) Future: why this role/company\n" +
        "4) Close: what value you bring";

      const sampleAnswer =
        "I am somebody who loves to work hard, because hard work develops good habits. Hard work enables you to continually learn, and it gives you a sense of achievement that makes you feel positive and satisfied in your work. I would say I am a high-achiever and everything I have done in my life and career to date has been to a high standard. For example, in my last job my manager always noted during my performance reviews that I was someone who could be relied upon to complete difficult tasks and projects under pressure. Microsoft is an organization that anyone would feel proud to work for, and if I do get the chance to become a member of your team, you have my word that I will always work hard, I will contribute positively to the goals of my team, and I will always focus on the long-term vision of the organization to ensure it maintains its position as a market innovator and leader.";

      const spokenText =
        "Keep it structured: present, past, future. Mention one strong achievement and end with why Microsoft and what value you'll bring.";

      return { approach, sampleAnswer, spokenText };
    }

    if (!q) {
      return {
        approach: "Use STAR: Situation, Task, Action, Result.",
        sampleAnswer:
          "I’d answer using STAR. First I’ll give quick context, then what I owned, the actions I took, and the measurable outcome.",
        spokenText:
          "Use the STAR method: Situation, Task, Action, Result. Then share one concrete example with the outcome and what you learned.",
      };
    }

    if (isBehavioral) {
      const approach =
        "Approach (STAR in 60–90 seconds):\n" +
        "1) Situation: 1–2 lines of context\n" +
        "2) Task: what you were responsible for\n" +
        "3) Action: how you communicated, aligned, and executed\n" +
        "4) Result: impact + what you learned";

      let sampleAnswer =
        "Situation: In a previous project, a key stakeholder was unhappy with the pace and kept changing priorities mid-sprint.\n" +
        "Task: I needed to keep delivery on track while rebuilding trust and clarity.\n" +
        "Action: I scheduled a short alignment call to clarify the goal, asked for the top 1–2 must-haves, and wrote down acceptance criteria. I proposed a weekly checkpoint and shared a simple timeline with trade-offs (what we can do now vs later). I also kept the team informed so changes were controlled.\n" +
        "Result: The stakeholder felt heard, scope changes reduced, and we delivered the core feature on time. I learned to convert opinions into written requirements and to manage expectations with clear trade-offs.";

      if (/difficult\s+stakeholder|stakeholder|teammate/i.test(q)) {
        sampleAnswer =
          "Situation: On one project, a stakeholder strongly disagreed with our proposed approach and the conversations were getting tense.\n" +
          "Task: I had to move us from conflict to a decision without slowing delivery.\n" +
          "Action: I set up a focused discussion, listened first to understand their concerns, then summarized them to confirm. I brought data (requirements, constraints, risks) and presented 2 options with pros/cons. We agreed on clear acceptance criteria and a checkpoint to review progress.\n" +
          "Result: We aligned on a plan quickly, reduced rework, and shipped the feature. The relationship improved because communication became structured and transparent.";
      }

      const spokenText =
        "Use the STAR method. Keep it short: situation, what you owned, the actions you took like alignment and trade-offs, and end with the measurable result and learning.";

      return { approach, sampleAnswer, spokenText };
    }

    // Technical / generic fallback
    return {
      approach:
        "Approach:\n" +
        "1) Clarify requirements + constraints\n" +
        "2) Propose a solution + trade-offs\n" +
        "3) Explain complexity + edge cases\n" +
        "4) Validate with examples/tests",
      sampleAnswer:
        "First I would clarify the input/output and constraints. Then I’d propose a straightforward solution, discuss time/space complexity, handle edge cases, and validate with a couple of examples.",
      spokenText:
        "Start by clarifying requirements and constraints. Then propose a solution, discuss trade-offs and complexity, and validate with edge cases.",
    };
  };

  const stopSpeechRecognition = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    shouldListenRef.current = false;
    try {
      rec.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
    // Commit only the final transcript when stopping
    const finalText = normalizeText(sttSessionRef.current.final);
    if (finalText) setCurrentAnswer(finalText);
    sttSessionRef.current.interim = "";
  };

  const speakText = (text) => {
    try {
      const t = normalizeText(text);
      if (!t) return;
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;

      // Avoid STT capturing the TTS voice
      if (isListening) stopSpeechRecognition();

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(t);
      utter.lang = "en-IN";
      utter.rate = 1;
      utter.pitch = 1;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const speakQuestion = (text) => {
    try {
      if (!text) return;
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;

      // Avoid STT capturing the TTS voice
      if (isListening) stopSpeechRecognition();

      // Cancel any previous speech to avoid overlap
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-IN";
      utter.rate = 1;
      utter.pitch = 1;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const stopSpeaking = () => {
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  };

  const provideInstantHelp = (reason) => {
    const q = getQuestionText(questions[currentQuestionIndex]);
    if (!q) return;
    if (lastHelpQuestionIndexRef.current === currentQuestionIndex) return;
    lastHelpQuestionIndexRef.current = currentQuestionIndex;

    const help = buildAssistantHelp(q);
    setAssistantHelp(help);
    setAnswerStructure(buildAnswerStructure(q));

    // If the user has no real answer (empty / "I don't know"), fill the sample answer.
    const cur = normalizeText(currentAnswer);
    const looksLikeIDK = /\b(idk|i\s*(do\s*not|don't)\s*know|i\s*dont\s*know|dont\s*know|no\s*idea|not\s*sure|can't\s*answer|cannot\s*answer)\b/i.test(
      cur
    );
    if (!cur || looksLikeIDK || reason === "empty") {
      setCurrentAnswer(help.sampleAnswer);
      sttSessionRef.current.final = help.sampleAnswer;
      sttSessionRef.current.interim = "";
    }

    speakText(`${help.spokenText} Here's a sample answer. ${help.sampleAnswer}`);
  };

  const checkCurrentAnswer = async () => {
    const q = getQuestionText(questions[currentQuestionIndex]);
    const a = normalizeText(currentAnswer);
    if (!q || !a) return null;

    setIsChecking(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          company: interviewDetails.company,
          jobRole: interviewDetails.jobRole,
          level: interviewDetails.level,
          focusArea: interviewDetails.focusArea,
          track: interviewDetails.track,
          mbaSpecialization: interviewDetails.mbaSpecialization,
          question: q,
          answer: a,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to check answer (${response.status})`);
      }

      const data = await response.json();
      const item = {
        index: currentQuestionIndex,
        answer: a,
        verdict: data?.verdict,
        score: typeof data?.score === "number" ? data.score : undefined,
        encouragement: data?.encouragement,
        resources: Array.isArray(data?.resources) ? data.resources : [],
        feedback: String(data?.feedback || "").trim(),
        source: data?.source || "unknown",
      };
      setAnswerCheck(item);
      lastCheckedAnswerRef.current = a;
      return item;
    } catch (e) {
      setAnswerCheck({
        index: currentQuestionIndex,
        answer: a,
        feedback: e?.message || "Unable to check answer right now.",
        source: "error",
      });
      lastCheckedAnswerRef.current = a;
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const ensureMicStream = async () => {
    if (streamRef.current) return streamRef.current;
    await startMic();
    return streamRef.current;
  };

  const startMonitoring = async () => {
    setPermissionError("");
    try {
      const stream = await ensureMicStream();
      if (!stream) throw new Error("Microphone stream not available");

      const audioEl = monitorAudioRef.current;
      if (!audioEl) return;
      audioEl.srcObject = stream;
      audioEl.muted = false;
      audioEl.volume = 1;
      setIsMonitoring(true);
      try {
        await audioEl.play();
      } catch {
        // Autoplay can be blocked; user can press again
      }
    } catch (e) {
      setPermissionError(e?.message || "Unable to enable mic monitoring.");
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    const audioEl = monitorAudioRef.current;
    if (audioEl) {
      try {
        audioEl.pause();
      } catch {
        // ignore
      }
      audioEl.srcObject = null;
    }
    setIsMonitoring(false);
  };

  const startRecording = async () => {
    setPermissionError("");
    try {
      const stream = await ensureMicStream();
      if (!stream) throw new Error("Microphone stream not available");
      if (typeof MediaRecorder === "undefined") {
        throw new Error("Recording is not supported in this browser.");
      }

      if (recordedUrl) {
        try {
          URL.revokeObjectURL(recordedUrl);
        } catch {
          // ignore
        }
        setRecordedUrl("");
      }

      recordedChunksRef.current = [];

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) recordedChunksRef.current.push(evt.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        recordedChunksRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      setPermissionError(e?.message || "Unable to start recording.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopMonitoring();
    setIsMicOn(false);
  };

  const startMic = async () => {
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setIsMicOn(true);
    } catch (err) {
      setPermissionError(err?.message || "Microphone permission denied or unavailable.");
      stopMic();
    }
  };

  const toggleMic = () => {
    if (isMicOn) stopMic();
    else void startMic();
  };

  useEffect(() => {
    // Setup speech recognition if available (optional)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i]?.[0]?.transcript || "";
          if (event.results[i].isFinal) final += `${piece} `;
          else interim += `${piece} `;
        }

        if (final) {
          sttSessionRef.current.final = appendUnique(sttSessionRef.current.final, final);
        }
        sttSessionRef.current.interim = normalizeText(interim);

        const combined = sttSessionRef.current.interim
          ? `${sttSessionRef.current.final} ${sttSessionRef.current.interim}`.trim()
          : normalizeText(sttSessionRef.current.final);

        setCurrentAnswer(combined);

        // If user says they don't know, immediately provide help (text + voice)
        if (
          /\b(idk|i\s*(do\s*not|don't)\s*know|i\s*dont\s*know|dont\s*know|no\s*idea|not\s*sure|can't\s*answer|cannot\s*answer)\b/i.test(
            combined
          )
        ) {
          stopSpeechRecognition();
          provideInstantHelp("idk");
        }
      };

      rec.onerror = () => {
        shouldListenRef.current = false;
        setIsListening(false);
      };

      rec.onend = () => {
        // Browsers may stop recognition automatically after a pause even with continuous=true.
        // If the user intended to keep listening, restart it.
        const finalText = normalizeText(sttSessionRef.current.final);
        if (finalText) setCurrentAnswer(finalText);
        sttSessionRef.current.interim = "";

        if (shouldListenRef.current) {
          try {
            setTimeout(() => {
              try {
                rec.start();
                setIsListening(true);
              } catch {
                setIsListening(false);
              }
            }, 200);
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopRecording();
      stopMic();
      shouldListenRef.current = false;
      try {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      if (recordedUrl) {
        try {
          URL.revokeObjectURL(recordedUrl);
        } catch {
          // ignore
        }
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Speak the question when it changes ("interviewer" voice)
  useEffect(() => {
    if (interviewStage !== "interview") return;
    const q = questions[currentQuestionIndex];
    const qText = getQuestionText(q);
    if (!qText) return;
    setAnswerStructure(buildAnswerStructure(qText));
    setShowIdealAnswer(false);
    if (autoPlayVoice) speakQuestion(qText);
  }, [interviewStage, questions, currentQuestionIndex, autoPlayVoice]);

  const handleDetailChange = (field, value) => {
    setInterviewDetails((prev) => {
      if (field === "track") {
        const nextTrack = String(value || "");
        if (nextTrack === prev.track) return prev;

        if (nextTrack === "mba") {
          const spec = getMbaSpecialization(prev.mbaSpecialization);
          const mbaFocusAreas = getMbaFocusAreas(spec.key);
          const mbaRoles = getMbaJobRoleSuggestions(spec.key);

          const shouldAutoJobRole =
            !String(prev.jobRole || "").trim() ||
            String(prev.jobRole).toLowerCase().includes("software");

          return {
            ...prev,
            track: nextTrack,
            mbaSpecialization: spec.key,
            jobRole: shouldAutoJobRole ? mbaRoles[0] || "Management Trainee" : prev.jobRole,
            focusArea: mbaFocusAreas[0] || "Consumer behavior",
          };
        }

        const knownMbaRoles = MBA_SPECIALIZATIONS.flatMap((s) =>
          getMbaJobRoleSuggestions(s.key),
        );
        const isLikelyMbaRole = knownMbaRoles.includes(prev.jobRole);

        return {
          ...prev,
          track: nextTrack,
          jobRole: isLikelyMbaRole ? "Software Engineer" : prev.jobRole,
          focusArea: "behavioral",
        };
      }

      if (field === "mbaSpecialization") {
        const spec = getMbaSpecialization(String(value || ""));
        const mbaFocusAreas = getMbaFocusAreas(spec.key);
        const currentFocus = String(prev.focusArea || "");
        const nextFocus = mbaFocusAreas.includes(currentFocus)
          ? currentFocus
          : mbaFocusAreas[0] || "Consumer behavior";

        return {
          ...prev,
          mbaSpecialization: spec.key,
          focusArea: prev.track === "mba" ? nextFocus : prev.focusArea,
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      stopSpeechRecognition();
    } else {
      try {
        // Start a fresh STT session using currentAnswer as base, to avoid duplication.
        const base = normalizeText(currentAnswer);
        sttSessionRef.current.final = base;
        sttSessionRef.current.interim = "";
        shouldListenRef.current = true;
        rec.start();
        setIsListening(true);
      } catch {
        setIsListening(true);
      }
    }
  };

  // Also detect "I don't know" when user types (not only via STT)
  useEffect(() => {
    if (interviewStage !== "interview") return;
    const text = normalizeText(currentAnswer);
    if (!text) return;
    if (lastHelpQuestionIndexRef.current === currentQuestionIndex) return;
    if (
      /\b(idk|i\s*(do\s*not|don't)\s*know|i\s*dont\s*know|dont\s*know|no\s*idea|not\s*sure|can't\s*answer|cannot\s*answer)\b/i.test(
        text
      )
    ) {
      provideInstantHelp("typed");
    }
  }, [currentAnswer, currentQuestionIndex, interviewStage]);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const useBank = isBuiltInCompany(interviewDetails.company);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to fetch questions (${response.status})`);
      }

      const data = await response.json();
      const qs = Array.isArray(data?.questions) ? data.questions.slice(0, 8) : [];
      if (!qs.length) throw new Error("No questions received");

      if (!isMicOn) await startMic();

      setQuestions(qs);
      setInterviewStage("interview");
      setAssistantHelp(null);
      setAnswerCheck(null);
      setAnswerStructure(qs[0] ? buildAnswerStructure(getQuestionText(qs[0])) : null);
      setShowIdealAnswer(false);
      lastHelpQuestionIndexRef.current = -1;
      lastCheckedAnswerRef.current = "";

      // Speak first question immediately after starting (user gesture context)
      if (autoPlayVoice) speakQuestion(getQuestionText(qs[0]));
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to start voice interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const advanceToNext = () => {
    setAnswerChecks(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = answerCheck;
      return updated;
    });
    const updated = [...answers];
    updated[currentQuestionIndex] = currentAnswer;
    setAnswers(updated);
    setCurrentAnswer("");
    setAssistantHelp(null);
    setAnswerCheck(null);
    setSubmitWarning(null);
    lastCheckedAnswerRef.current = "";
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setAssistantHelp(null);
      setAnswerCheck(null);
      setShowIdealAnswer(false);
      if (autoPlayVoice) speakQuestion(getQuestionText(questions[nextIndex]));
    }
  };

  const skipQuestion = () => {
    if (hintCredits <= 0) return;
    setHintCredits(c => c - 1);
    setCurrentAnswer("");
    setAssistantHelp(null);
    setAnswerCheck(null);
    setSubmitWarning(null);
    lastCheckedAnswerRef.current = "";
    setAnswerChecks(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = { skipped: true, index: currentQuestionIndex };
      return updated;
    });
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setShowIdealAnswer(false);
      if (autoPlayVoice) speakQuestion(getQuestionText(questions[nextIndex]));
    }
  };

  const submitAnswer = () => {
    const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length;

    // Block empty submission — don't auto-hint, just show warning
    if (wordCount === 0) {
      setSubmitWarning("empty");
      return;
    }

    // Warn if too short, but allow confirm to proceed
    if (wordCount < 10 && submitWarning !== "short-confirmed") {
      setSubmitWarning("short");
      return;
    }

    setSubmitWarning(null);

    // First click: check the answer. Second click: proceed.
    const normalized = normalizeText(currentAnswer);
    const alreadyChecked =
      answerCheck &&
      answerCheck.index === currentQuestionIndex &&
      normalizeText(answerCheck.answer) === normalized &&
      lastCheckedAnswerRef.current === normalized;

    if (!alreadyChecked) {
      void checkCurrentAnswer();
      return;
    }

    advanceToNext();
  };

  const generateFeedback = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          company: interviewDetails.company,
          jobRole: interviewDetails.jobRole,
          level: interviewDetails.level,
          focusArea: interviewDetails.focusArea,
          track: interviewDetails.track,
          mbaSpecialization: interviewDetails.mbaSpecialization,
          questions: questions.map(getQuestionText),
          answers,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to fetch feedback (${response.status})`);
      }

      const data = await response.json();
      const generatedFeedback = data?.feedback || "No feedback generated";
      setFeedback(generatedFeedback);
      setInterviewStage("feedback");

      // Save to server
      const answeredChecks = answerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "voice",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: "Voice Session",
        score: avgScore,
        overallFeedback: generatedFeedback,
        questions: questions.map((q, i) => ({
          questionText: getQuestionText(q),
          answerText: answers[i] || "",
          verdict: answerChecks[i]?.verdict || "",
          aiFeedback: answerChecks[i]?.feedback || answerChecks[i]?.helpful || "",
          score: answerChecks[i]?.score,
          improvedAnswer: answerChecks[i]?.improvedAnswer || "",
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
    } catch (error) {
      console.error("Error generating feedback:", error);
      const fbText =
        "Failed to generate feedback. Here's a basic analysis:\n\n" +
        questions
          .map((q, i) => `Q${i + 1}: ${getQuestionText(q)}\nA: ${answers[i] || "No answer"}\n`)
          .join("\n");
      setFeedback(fbText);
      setInterviewStage("feedback");

      const answeredChecks = answerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "voice",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: "Voice Session",
        score: avgScore,
        overallFeedback: fbText,
        questions: questions.map((q, i) => ({
          questionText: getQuestionText(q),
          answerText: answers[i] || "",
          verdict: answerChecks[i]?.verdict || "",
          aiFeedback: answerChecks[i]?.feedback || answerChecks[i]?.helpful || "",
          score: answerChecks[i]?.score,
          improvedAnswer: answerChecks[i]?.improvedAnswer || "",
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
      stopMic();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
      {/* Background gradients similar to ChatInterview */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-600/8 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {interviewStage === "initializing" && (
          <motion.div
            key="initializing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Initializing Session...</h2>
              <p className="text-foreground/60 mt-2">Checking microphone access...</p>
            </div>
          </motion.div>
        )}

        {(interviewStage === "error" || permissionError) && interviewStage !== "interview" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50 p-8"
          >
            <div className="glass rounded-[2.5rem] p-10 max-w-lg text-center shadow-premium bg-background/90 backdrop-blur-xl border border-white/10">
              <span className="text-5xl mb-4 block">⚠️</span>
              <h2 className="text-2xl font-bold mb-2 text-red-400">Microphone Not Detected</h2>
              <p className="text-foreground/70 mb-8">{permissionError || "Your microphone isn't accessible. The interview hasn't started yet."}</p>
              <div className="flex flex-col gap-3">
                 <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 font-bold transition-all text-sm text-foreground">
                    Fix Microphone
                 </button>
                 <button onClick={() => navigate('/chat-interview', { state: location.state })} className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-sm">
                    Switch to Chat Mode
                 </button>
              </div>
            </div>
          </motion.div>
        )}

        {interviewStage === "interview" && questions.length > 0 && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Mid-Session Drop Banner */}
            {(!isMicActive) && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-4">
                  <span className="text-amber-400 font-bold text-sm">⚠️ Microphone disconnected — Timer paused</span>
                  <div className="flex gap-2 ml-4">
                     <button onClick={() => navigate('/chat-interview', { state: location.state })} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors">Switch to Typing</button>
                     <button onClick={submitFinalAnswer} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors">End Session</button>
                  </div>
               </div>
            )}

            {/* TOP BAR */}
            <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: `${persona.color}25`, border: `1px solid ${persona.color}50` }}
                >
                  {persona.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{persona.name}</p>
                  <p className="text-[10px] text-white/30">{persona.title} · {interviewDetails.company || "Mock"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[10px] text-white/30 font-bold">
                  <span>💡</span>
                  <span>{hintCredits} credits</span>
                </div>
                <div className={`font-mono text-lg font-black tabular-nums transition-all ${timeLeft < 20 ? "text-red-400" : timeLeft < 60 ? "text-amber-400" : "text-white"}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-white/30 font-medium">Q{currentQuestionIndex + 1}/{questions.length}</div>
              </div>
            </div>

            {/* 3-COLUMN BODY */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              
              {/* LEFT PANEL */}
              <div className="w-full lg:w-[220px] flex-shrink-0 flex flex-col gap-4 p-4 border-r border-white/5 overflow-y-auto">
                {/* Question card */}
                <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-2">Question {currentQuestionIndex + 1}</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {getQuestionText(questions[currentQuestionIndex])}
                  </p>
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
                            isCurrent ? "bg-primary border-primary/50 text-primary-foreground shadow-[0_0_8px_rgba(139,92,246,0.5)]"
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

                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 mt-auto hidden lg:flex lg:flex-col gap-2">
                  <button
                    onClick={() => { if (hintCredits > 0) { setHintCredits(c => c - 1); provideInstantHelp("manual"); } }}
                    disabled={isChecking || hintCredits <= 0}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Get Hint ({hintCredits})
                  </button>
                  <button
                    onClick={skipQuestion}
                    disabled={hintCredits <= 0}
                    className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-white/3 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    Skip (costs 1 credit)
                  </button>
                </div>
              </div>

              {/* CENTER PANEL */}
              <div className="flex-1 flex flex-col items-center justify-center relative p-6">
                <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                   <button 
                     onClick={() => speakQuestion(getQuestionText(questions[currentQuestionIndex]))}
                     className="p-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                     title="Read question aloud"
                   >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l4.707 4.707A1 1 0 0016 20V4a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" /></svg>
                   </button>
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold leading-tight text-center max-w-2xl mb-6 relative z-10 pt-2">
                  "{getQuestionText(questions[currentQuestionIndex])}"
                </h2>

                {/* AI Orb Visualizer */}
                <div className="flex flex-col items-center justify-center relative w-full mb-6">
                   <motion.div
                     animate={{ 
                       scale: isListening ? [1, 1.15, 1] : 1,
                       opacity: isListening ? [0.6, 1, 0.6] : 0.8
                     }}
                     transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                     className="absolute"
                   >
                     <div className={`w-48 h-48 rounded-full blur-3xl ${isListening ? 'bg-primary/40' : 'bg-primary/20'}`}></div>
                   </motion.div>
                   
                   {/* Ready ring */}
                   {!isListening && isMicOn && (
                     <div className="absolute w-44 h-44 rounded-full border-2 border-emerald-500/40 animate-pulse" />
                   )}

                   <button
                      onClick={toggleListening}
                      disabled={!isMicOn}
                      className={`relative z-10 w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                        isListening 
                          ? 'border-primary bg-primary/20 shadow-[0_0_50px_rgba(124,92,252,0.4)]' 
                          : 'border-emerald-500/30 bg-white/5 hover:border-emerald-400/60 hover:bg-white/10'
                      } ${!isMicOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                   >
                     <svg className={`w-14 h-14 transition-all ${isListening ? 'text-primary animate-pulse' : 'text-emerald-400/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       {isListening 
                         ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v18l15-9L5 3z" />
                         : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                       }
                     </svg>
                   </button>

                   <p className={`mt-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                     isListening ? 'text-primary animate-pulse' : 'text-emerald-400/60'
                   }`}>
                     {isListening ? '● Recording...' : 'Tap to speak'}
                   </p>
                </div>

                {/* Submit warning inline */}
                <AnimatePresence>
                  {submitWarning === 'empty' && (
                    <motion.p
                      key="warn-empty"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-amber-400 font-bold mb-3 text-center"
                    >
                      You haven't spoken yet. Please record your answer before continuing.
                    </motion.p>
                  )}
                  {submitWarning === 'short' && (
                    <motion.div
                      key="warn-short"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-2 mb-3"
                    >
                      <p className="text-sm text-amber-400 font-bold text-center">Your answer seems too short. Continue anyway?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSubmitWarning(null)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                        >Keep speaking</button>
                        <button
                          onClick={() => { setSubmitWarning('short-confirmed'); setTimeout(submitAnswer, 0); }}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all"
                        >Continue anyway</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full max-w-xl flex gap-4 items-center justify-center">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={submitAnswer}
                      disabled={isChecking}
                      className="shine-hover flex-1 max-w-[240px] py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {answerCheck && answerCheck.index === currentQuestionIndex ? "Next Question" : "Check & Next"}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  ) : (
                    <button
                      onClick={submitFinalAnswer}
                      disabled={isLoading || isChecking}
                      className="shine-hover flex-1 max-w-[240px] py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Finishing..." : "Finish Interview"}
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL - Transcript & Analysis */}
              <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4 p-4 border-l border-white/5">
                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col items-center justify-center min-h-[160px]">
                  <VibeMeter score={currentVibeScore} isAwaiting={isAwaitingVibe} />
                </div>
                
                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex-1 flex flex-col min-h-0">
                  <h3 className="text-xs font-bold text-foreground/80 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Live Transcript
                  </h3>
                  <textarea
                    className="flex-1 w-full p-4 bg-black/20 rounded-xl border border-white/5 text-foreground/80 resize-none outline-none focus:ring-1 focus:ring-primary/50 text-[13px] leading-relaxed custom-scrollbar min-h-[150px]"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Speak clearly, your transcript will appear here..."
                  />
                  <div className="flex items-center justify-between mt-3 px-1 text-[9px] font-black text-foreground/40 uppercase tracking-widest">
                    <span>~{currentAnswer.split(/\s+/).filter(Boolean).length} words</span>
                    <span>{formatTime(300 - timeLeft)} spoken</span>
                  </div>
                </div>
                
                {/* Assistant Help Overlay */}
                <AnimatePresence>
                  {assistantHelp && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-lg"
                    >
                      <h4 className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">💡 Hint</h4>
                      <div className="text-xs text-amber-200/90 leading-relaxed">
                        {assistantHelp.approach}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}

        {/* FEEDBACK STAGE */}
        {interviewStage === "feedback" && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center bg-background"
          >
            <div className="glass rounded-[2.5rem] p-8 md:p-12 shadow-premium max-w-5xl mx-auto w-full">
              <div className="flex flex-col items-center justify-center text-center mb-12">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-4">Interview Completed</h1>
                <p className="text-foreground/60 font-medium max-w-2xl">
                  Great job! You've successfully completed the simulation. Here's a quick summary from the AI evaluator.
                </p>
              </div>

              <div className="bg-secondary/30 rounded-3xl p-6 md:p-8 mb-10 border border-border/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Performance Overview
                </h3>
                <pre className="whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed text-sm md:text-base">
                  {feedback}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="shine-hover px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
                >
                  Back to Dashboard
                </button>
                {savedSessionId && (
                  <button
                    onClick={() => navigate(`/session/${savedSessionId}`)}
                    className="px-8 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-2 justify-center hover:scale-[1.05] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span> View Detailed Replay
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInterview;
