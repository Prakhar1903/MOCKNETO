import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaPipeAnalysis } from "../hooks/useMediaPipeAnalysis";
import { useSpeechPacing } from "../hooks/useSpeechPacing";
import { AnalysisOverlay } from "../components/AnalysisOverlay";
import { SentimentRibbon } from "../components/SentimentRibbon";
import {
  getMbaFocusAreas,
  getMbaJobRoleSuggestions,
  getMbaSpecialization,
  MBA_SPECIALIZATIONS,
} from "../utils/mbaCatalog";

const INTERVIEWER_PROFILES = {
  friendly: { name: "Priya Sharma", role: "Staff Architect @ Google", avatar: "/priya_sharma.png", style: "Friendly", color: "border-emerald-400", dot: "bg-emerald-400" },
  strict: { name: "Marcus Vance", role: "Director of Eng @ Netflix", avatar: "/marcus_vance.png", style: "Strict", color: "border-rose-400", dot: "bg-rose-400" },
  technical: { name: "Sarah Chen", role: "Principal Engineer @ Meta", avatar: "/sarah_chen.png", style: "Technical", color: "border-blue-400", dot: "bg-blue-400" }
};

const VideoInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeConfig = location.state?.config || {};
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [interviewDetails, setInterviewDetails] = useState({
    company: routeConfig.company || "",
    jobRole: routeConfig.jobRole || "Software Engineer",
    level: routeConfig.level || "mid",
    focusArea: routeConfig.focusArea || "technical",
    track: routeConfig.track || "tech",
    mbaSpecialization: routeConfig.mbaSpecialization || "marketing",
  });

  const [permissionError, setPermissionError] = useState("");
  const [isPreviewOn, setIsPreviewOn] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerChecks, setAnswerChecks] = useState([]);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [startedAt] = useState(() => new Date());
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answerCheck, setAnswerCheck] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);
  const lastCheckedRef = useRef({ questionIndex: -1, answer: "" });

  const getQuestionText = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") return String(item.question || item.q || "");
    return "";
  };
  const [interviewStage, setInterviewStage] = useState("greenroom");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [eyeContactReady, setEyeContactReady] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [hintCredits, setHintCredits] = useState(3);
  const eyeContactTimerRef = useRef(null);
  const timerRef = useRef(null);

  // persona must be declared BEFORE useSpeechPacing since it's passed as an argument
  const [persona, setPersona] = useState(
    ["friendly", "strict", "technical"][routeConfig.personaIdx ?? 0] || "friendly"
  );

  const {
    isReady: isAiReady,
    confidenceScore,
    sentiment,
    gazeZone,
    eyeContactPct,
    lowEyeContactFlag,
    isSlouching,
    isFidgeting,
    sessionLog,
    startAnalysis,
    stopAnalysis
  } = useMediaPipeAnalysis(videoRef);

  const {
    wpm,
    wpmStatus,
    fillerCount,
    fillerWarning,
    silenceSeconds,
    interimTranscript,
    startListening,
    stopListening
  } = useSpeechPacing(persona);

  // --- Green Room State ---
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [connection, setConnection] = useState("Checking");
  const [lighting, setLighting] = useState("Checking");
  const [videoFilter, setVideoFilter] = useState("");
  const [micIdleSeconds, setMicIdleSeconds] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  
  // New UI states
  const [sessionNotes, setSessionNotes] = useState("");
  const [aiState, setAiState] = useState("listening"); // 'listening' | 'thinking' | 'speaking' | 'evaluating' | 'asking'
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [answerMode, setAnswerMode] = useState("speech"); // 'speech' | 'text'
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [introPhase, setIntroPhase] = useState(true);
  const [introCountdown, setIntroCountdown] = useState(3);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const micIdleTimerRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);
  const lightingTimerRef = useRef(null);
  const canvasRef = useRef(null);

  const KNOWN_COMPANIES = [
    { name: "Google", emoji: "🔵", color: "#4285F4" },
    { name: "Amazon", emoji: "🟠", color: "#FF9900" },
    { name: "Microsoft", emoji: "🟦", color: "#00A4EF" },
    { name: "Meta", emoji: "🔷", color: "#1877F2" },
    { name: "Apple", emoji: "⚫", color: "#555555" },
    { name: "Netflix", emoji: "🔴", color: "#E50914" },
  ];

  const verdictStyles = (verdict) => {
    const v = String(verdict || "").toLowerCase();
    if (v === "strong") return "bg-green-600/20 text-green-200 border border-green-500/40";
    if (v === "okay") return "bg-yellow-600/20 text-yellow-200 border border-yellow-500/40";
    if (v === "weak") return "bg-red-600/20 text-red-200 border border-red-500/40";
    return "bg-gray-600/20 text-gray-200 border border-gray-500/40";
  };

  const isBuiltInCompany = (company) => {
    const normalized = String(company || "").trim().toLowerCase();
    return (
      normalized.includes("google") ||
      normalized.includes("amazon") ||
      normalized.includes("microsoft") ||
      normalized === "ms"
    );
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

  const attachVideoStream = async (stream, videoEl) => {
    const el = videoEl || videoRef.current;
    if (!el) return;
    if (el.srcObject === stream) return;
    el.srcObject = stream;
    el.muted = true;
    el.playsInline = true;

    // Some browsers need metadata before play()
    await new Promise((resolve) => {
      const done = () => {
        el.removeEventListener("loadedmetadata", done);
        resolve();
      };
      el.addEventListener("loadedmetadata", done);
      // If metadata already loaded
      if (el.readyState >= 1) {
        el.removeEventListener("loadedmetadata", done);
        resolve();
      }
    });

    try {
      await el.play();
    } catch {
      // If autoplay is blocked, user can hit Start Preview/Start Interview again
    }
  };

  const setVideoElementRef = useCallback((el) => {
    videoRef.current = el;
    // When stage changes, React mounts a new <video>. Re-attach active stream.
    if (el && streamRef.current) {
      void attachVideoStream(streamRef.current, el);
    }
  }, []);

  const persistPerQuestionHistory = (payload) => {
    const entry = {
      date: new Date().toISOString(),
      mode: "video",
      company: interviewDetails.company,
      jobRole: interviewDetails.jobRole,
      level: interviewDetails.level,
      focusArea: interviewDetails.focusArea,
      track: interviewDetails.track,
      mbaSpecialization: interviewDetails.mbaSpecialization,
      persona,
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

  const appendFeedbackToHistory = (text) => {
    const entry = {
      date: new Date().toISOString(),
      text,
      mode: "video",
      company: interviewDetails.company,
      jobRole: interviewDetails.jobRole,
      level: interviewDetails.level,
      focusArea: interviewDetails.focusArea,
      track: interviewDetails.track,
      mbaSpecialization: interviewDetails.mbaSpecialization,
      persona,
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

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewOn(false);
  };

  const startPreview = async () => {
    setPermissionError("");
    try {
      // Stop any previous stream first
      stopStream();

      // Try preferred constraints first, then fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      if (!stream.getVideoTracks().length) {
        throw new Error("No camera video track available.");
      }
      streamRef.current = stream;

      await attachVideoStream(stream);
      setIsPreviewOn(true);
    } catch (err) {
      setPermissionError(
        err?.message || "Camera/Microphone permission denied or unavailable.",
      );
      stopStream();
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      stopStream();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      await startPreview();
    }
  };

  useEffect(() => {
    if (interviewStage === "greenroom" && cameraEnabled && !isPreviewOn) {
      startPreview().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStage, cameraEnabled]);

  useEffect(() => {
    if (navigator.connection) {
      const type = navigator.connection.effectiveType;
      if (type === "4g") setConnection("Excellent");
      else if (type === "3g") setConnection("Good");
      else setConnection("Fair");
    } else {
      setConnection("Good");
    }

    if (!streamRef.current || !isPreviewOn) return;

    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkMic = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const bars = Math.min(5, Math.ceil(average / 10));
        setMicLevel(bars);
        // Track silence: if bars === 0 increment idle counter (reset on any sound)
        if (bars === 0) {
          setMicIdleSeconds((s) => s + (1 / 30)); // approx 1/fps
        } else {
          setMicIdleSeconds(0);
        }
        micAnimFrameRef.current = requestAnimationFrame(checkMic);
      };
      checkMic();
    } catch (e) {
      console.warn("Mic check failed", e);
    }

    lightingTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let colorSum = 0;
        for (let x = 0, len = data.length; x < len; x += 16) {
          colorSum += (data[x] + data[x + 1] + data[x + 2]) / 3;
        }
        const brightness = Math.floor(colorSum / (canvas.width * canvas.height / 4));
        if (brightness < 40) setLighting("Too Dark ⚠");
        else if (brightness > 200) setLighting("Too Bright ⚠");
        else setLighting("Looks Good ✓");
      } catch {}
    }, 2000);

    return () => {
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (lightingTimerRef.current) clearInterval(lightingTimerRef.current);
    };
  }, [isPreviewOn, cameraEnabled]);

  useEffect(() => {
    return () => {
      stopStream();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(()=>{});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          focusArea: "technical",
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
      persona,
          ...(useBank ? {} : { count: 5 }),
        }),
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
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (!qs.length) throw new Error("No questions received");

      // Cap at 8 questions for video mode
      const capped = qs.slice(0, 8);

      // Ensure preview is running for video interview
      if (!isPreviewOn) await startPreview();

      setEyeContactReady(false);
      setHasSpoken(false);
      eyeContactTimerRef.current = setTimeout(() => setEyeContactReady(true), 10000);
      setQuestions(capped);
      setInterviewStage("interview");
      startAnalysis();
      startListening();
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setCurrentAnswer("");
      setAnswerCheck(null);
      lastCheckedRef.current = { questionIndex: -1, answer: "" };
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to start video interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (interviewStage !== "interview") return;
    setCurrentAnswer(answers[currentQuestionIndex] || "");
    setAnswerCheck(null);
    setShowIdealAnswer(false);
    lastCheckedRef.current = { questionIndex: -1, answer: "" };
  }, [currentQuestionIndex, interviewStage]);

  useEffect(() => {
    if (interviewStage === "interview") {
      setTimeLeft(300);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 0) { clearInterval(timerRef.current); return 0; } return prev - 1; });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewStage, currentQuestionIndex]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // AI state transition logic
  useEffect(() => {
    if (isCheckingAnswer) {
      setAiState("thinking");
      const t = setTimeout(() => setAiState("evaluating"), 1200);
      return () => clearTimeout(t);
    } else if (!isEvaluated && !introPhase) {
      setAiState("listening");
    }
  }, [isCheckingAnswer, isEvaluated, introPhase]);

  // Mark hasSpoken as soon as any speech is detected
  useEffect(() => {
    if (wpm > 0 && !hasSpoken) setHasSpoken(true);
  }, [wpm, hasSpoken]);

  const checkCurrentAnswer = async () => {
    if (isCheckingAnswer) return;

    const question = getQuestionText(questions[currentQuestionIndex]);
    const answer = String(currentAnswer || "").trim();
    if (!answer) {
      alert("Please provide an answer.");
      return;
    }

    if (
      answerCheck &&
      lastCheckedRef.current.questionIndex === currentQuestionIndex &&
      lastCheckedRef.current.answer === answer
    ) {
      return;
    }

    setIsCheckingAnswer(true);
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
      persona,
          question,
          answer,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to check answer (${response.status})`);
      }

      const data = await response.json();
      setAnswerCheck(data);
      lastCheckedRef.current = { questionIndex: currentQuestionIndex, answer };
    } catch (err) {
      console.error("Answer check failed:", err);
      setAnswerCheck({
        source: "error",
        feedback: "Failed to check answer. Please try again.",
        warning: err?.message,
      });
      setIsCheckingAnswer(false);
      setIsEvaluated(true);
      setAiState("asking"); // Fakes AI giving feedback
    }
  };

  const submitAnswer = async () => {
    const answer = String(currentAnswer || "").trim();
    if (!answer) {
      alert("Please provide an answer.");
      return;
    }
    await checkCurrentAnswer();
  };

  const handleNextQuestion = () => {
    if (introPhase) {
      setIntroPhase(false);
      setAiState("asking");
      setTimeout(() => setAiState("listening"), 3000);
      return;
    }

    const answer = String(currentAnswer || "").trim();
    
    // Save answer check to state
    setAnswerChecks(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = answerCheck;
      return updated;
    });

    const updated = [...answers];
    updated[currentQuestionIndex] = answer;
    setAnswers(updated);
    setCurrentAnswer("");
    setAnswerCheck(null);
    lastCheckedRef.current = { questionIndex: -1, answer: "" };
    setHasSpoken(false);
    setIsEvaluated(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAiState("asking");
      setTimeout(() => setAiState("listening"), 3000);
    } else {
      submitFinalAnswer();
    }
  };

  useEffect(() => {
    if (introPhase) {
      if (introCountdown > 0) {
        const timer = setTimeout(() => setIntroCountdown(p => p - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleNextQuestion();
      }
    }
  }, [introPhase, introCountdown]);

  const generateFeedback = async (finalAnswers = answers, finalAnswerChecks = answerChecks) => {
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
          persona,
          questions: questions.map(getQuestionText),
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to fetch feedback (${response.status})`);
      }

      const data = await response.json();
      const generatedFeedback = data?.feedback || "No feedback generated";
      setFeedback(generatedFeedback);
      setInterviewStage("feedback");
      stopAnalysis();
      stopListening();

      // Save to server
      const answeredChecks = finalAnswerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "video",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: "Video Session",
        score: avgScore,
        overallFeedback: generatedFeedback,
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
    } catch (error) {
      console.error("Error generating feedback:", error);
      const fbText =
        "Failed to generate feedback. Here's a basic analysis:\n\n" +
        questions
          .map((q, i) => `Q${i + 1}: ${getQuestionText(q)}\nA: ${finalAnswers[i] || "No answer"}\n`)
          .join("\n");
      setFeedback(fbText);
      setInterviewStage("feedback");
      stopAnalysis();
      stopListening();

      const answeredChecks = finalAnswerChecks.filter(Boolean);
      const avgScore = answeredChecks.length
        ? Math.round(answeredChecks.reduce((s, c) => s + (c?.score || 0), 0) / answeredChecks.length) * 10
        : 0;

      const endedAtVal = new Date();
      const durationMins = Math.max(1, Math.round((endedAtVal - startedAt) / 60000));

      const sessionPayload = {
        date: new Date().toISOString(),
        mode: "video",
        company: interviewDetails.company || "Mock",
        jobRole: interviewDetails.jobRole || "Interview",
        level: interviewDetails.level || "mid",
        focusArea: interviewDetails.focusArea || "general",
        track: interviewDetails.track || "general",
        mbaSpecialization: interviewDetails.mbaSpecialization || "",
        interviewer: "Video Session",
        score: avgScore,
        overallFeedback: fbText,
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
      stopStream();
    }
  };

  const submitFinalAnswer = async () => {
    const answer = String(currentAnswer || "").trim();
    if (!answer) {
      alert("Please provide an answer.");
      return;
    }

    const alreadyChecked =
      !!answerCheck &&
      lastCheckedRef.current.questionIndex === currentQuestionIndex &&
      lastCheckedRef.current.answer === answer;

    if (!alreadyChecked) {
      await checkCurrentAnswer();
      return;
    }

    // Save last answer check to state
    const updatedChecks = [...answerChecks];
    updatedChecks[currentQuestionIndex] = answerCheck;
    setAnswerChecks(updatedChecks);

    const updated = [...answers];
    updated[currentQuestionIndex] = answer;
    setAnswers(updated);
    await generateFeedback(updated, updatedChecks);
  };

  const startInterviewCountdown = () => {
    if (!interviewDetails.jobRole.trim()) {
      alert("Please enter a Job Role.");
      return;
    }
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n--;
      if (n === 0) {
        setCountdown("GO");
      } else if (n < 0) {
        clearInterval(id);
        setCountdown(null);
        generateQuestions();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    handleDetailChange("company", val);
    if (val.length > 0) {
      const suggestions = KNOWN_COMPANIES.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setCompanySuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCompany = (name) => {
    handleDetailChange("company", name);
    setShowSuggestions(false);
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground transition-colors duration-300 overflow-hidden z-50">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-600/8 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* ── GREEN ROOM STAGE ── */}
        {interviewStage === "greenroom" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {/* Full-height flex container */}
            <div className="min-h-full flex flex-col lg:flex-row p-4 md:p-6 gap-6">
              {/* Camera Preview — left 70% */}
              <div className="w-full lg:w-[70%] flex flex-col">
                <div className="glass rounded-[2rem] p-3 shadow-premium relative overflow-hidden border border-white/5 flex flex-col flex-1">
                  <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold tracking-wider flex items-center gap-2 border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${cameraEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                      {cameraEnabled ? "LIVE" : "OFF"}
                    </span>
                  </div>
                  <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center min-h-[320px]">
                    <video ref={setVideoElementRef} playsInline muted
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraEnabled && isPreviewOn ? "opacity-100" : "opacity-0"}`}
                      style={videoFilter ? { filter: videoFilter } : undefined}
                    />
                    
                    {/* Face Framing Guide */}
                    {cameraEnabled && isPreviewOn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                        <div className="w-[40%] h-[60%] border-2 border-white/40 rounded-full border-dashed" />
                      </div>
                    )}

                    {(!cameraEnabled || !isPreviewOn) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 bg-black/60">
                        <div className="w-20 h-20 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
                            <span className="text-white text-[10px] font-bold">!</span>
                          </div>
                        </div>
                        <p className="font-bold text-white mb-2 tracking-wide">Camera Required</p>
                        <p className="text-sm max-w-[250px] text-center text-white/60 mb-6">Please enable your camera to continue. Video mode requires active face and gesture tracking.</p>
                      </div>
                    )}
                    <button onClick={toggleCamera}
                      className="absolute bottom-4 right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all z-20"
                    >
                      {cameraEnabled
                        ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        : <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      }
                    </button>
                    <AnimatePresence>
                      {countdown !== null && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                          <motion.span key={countdown} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className={`text-[8rem] font-black ${countdown === "GO" ? "text-emerald-400" : "text-white"}`}
                          >{countdown}</motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Status Indicators — pinned below camera */}
                  <div className="mt-3 grid grid-cols-3 gap-3 flex-shrink-0">
                    <div className="relative bg-white/3 rounded-xl p-3 flex flex-col items-center gap-2 border border-white/8">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Mic Level</span>
                      <div className="flex items-end justify-center gap-0.5 w-8 h-6">
                        {[1,2,3,4,5].map(bar => (
                          <div key={bar} className={`w-1.5 rounded-full transition-all duration-75 ${bar <= micLevel && cameraEnabled ? "bg-emerald-400" : "bg-white/10"}`}
                            style={{ height: `${20 + bar * 16}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3 flex flex-col items-center gap-2 border border-white/8">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Connection</span>
                      <span className={`text-sm font-bold ${connection === "Excellent" ? "text-emerald-400" : connection === "Good" ? "text-blue-400" : "text-yellow-400"}`}>{connection}</span>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3 flex flex-col items-center gap-2 border border-white/8">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Lighting</span>
                      <span className={`text-sm font-bold whitespace-nowrap ${
                        lighting === "Checking" ? "text-foreground/40"
                        : lighting.includes("Dark") || lighting.includes("Bright") ? "text-amber-400"
                        : "text-emerald-400"
                      }`}>
                        {cameraEnabled ? lighting : "Off"}
                      </span>
                    </div>
                  </div>
                  {permissionError && <p className="text-red-400 text-sm mt-3 px-1">{permissionError}</p>}
                </div>
              </div>

              {/* Right panel — 30%, stretches full height */}
              <div className="w-full lg:w-[30%] flex flex-col">
                <div className="glass rounded-[2rem] p-6 shadow-premium border border-white/5 flex flex-col justify-between flex-1">
                  <div>
                    {/* Interviewer Card */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`relative w-16 h-16 rounded-full border-2 p-0.5 ${INTERVIEWER_PROFILES[persona].color}`}>
                        <img src={INTERVIEWER_PROFILES[persona].avatar} alt="Interviewer" className="w-full h-full rounded-full object-cover" />
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background animate-pulse ${INTERVIEWER_PROFILES[persona].dot}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight">{INTERVIEWER_PROFILES[persona].name}</h2>
                        <p className="text-xs text-foreground/60">{INTERVIEWER_PROFILES[persona].role}</p>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase font-bold tracking-wider text-white/50">
                          <div className={`w-1.5 h-1.5 rounded-full ${INTERVIEWER_PROFILES[persona].dot}`} />
                          Ready to begin
                        </div>
                      </div>
                    </div>

                    {/* Session summary */}
                    <div className="rounded-2xl bg-white/3 border border-white/8 p-4 space-y-2 mb-6">
                      <p className="text-[9px] uppercase font-black tracking-widest text-white/30 mb-1">Session Summary</p>
                      {[
                        { label: "Role",      value: interviewDetails.jobRole },
                        { label: "Level",     value: interviewDetails.level },
                        { label: "Company",   value: interviewDetails.company || "Mock Interview" },
                        { label: "Focus",     value: interviewDetails.focusArea === 'track' ? interviewDetails.track.toUpperCase() : (interviewDetails.focusArea || "General") },
                        { label: "Duration",  value: "~20 minutes" },
                        { label: "Questions", value: "8 questions" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-xs text-white/40 font-medium">{label}</span>
                          <span className="text-xs text-white/80 font-bold capitalize max-w-[150px] truncate text-right">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Readiness Checklist */}
                    <div className="mb-6 space-y-2">
                      <p className="text-[9px] uppercase font-black tracking-widest text-white/30 mb-2">Readiness Checklist</p>
                      {[
                        { label: "Camera Detected", isReady: cameraEnabled && isPreviewOn },
                        { label: "Microphone Active", isReady: micLevel > 0 },
                        { label: "Internet Stable", isReady: connection !== "Checking" && connection !== "Poor" },
                        { label: "Good Lighting", isReady: cameraEnabled && isPreviewOn && lighting && !lighting.includes("Checking") && !lighting.includes("Dark") },
                      ].map(({ label, isReady }) => (
                        <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5">
                          <span className="text-xs font-medium text-white/70">{label}</span>
                          <span className="flex items-center justify-center w-5 h-5 rounded-full">
                            {isReady 
                              ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              : <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            }
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Persona selector */}
                    <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/50">Interviewer Persona</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "friendly",  title: "Friendly",  desc: "Patient & supportive" },
                        { id: "strict",    title: "Strict",    desc: "Formal & direct" },
                        { id: "technical", title: "Technical", desc: "Deep-dives" },
                      ].map(p => (
                        <button key={p.id} onClick={() => setPersona(p.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${persona === p.id ? "bg-primary/10 border-primary shadow-sm shadow-primary/20" : "bg-secondary/30 border-white/5 hover:border-white/20"}`}
                        >
                          <span className="text-xs font-bold mb-0.5">{p.title}</span>
                          <span className="text-[9px] text-foreground/50">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button onClick={startInterviewCountdown} disabled={isLoading || countdown !== null || !cameraEnabled}
                      className="shine-hover w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-extrabold text-lg shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Preparing Room..." : "Enter Interview Chamber →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── INTERVIEW STAGE ── */}
        {interviewStage === "interview" && questions.length > 0 && (
          <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-12 bg-background z-50 h-full overflow-hidden"
          >
             {/* Left/Main Column (spans 9 cols) */}
             <div className="col-span-12 lg:col-span-9 flex flex-col h-full p-4 lg:p-6 gap-4 overflow-hidden relative">
                
                {/* Intro Modal Overlay */}
                <AnimatePresence>
                  {introPhase && (
                    <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
                    >
                      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
                        <div className="w-20 h-20 mx-auto rounded-full border-2 border-violet-500/50 mb-6 overflow-hidden">
                          <img src={INTERVIEWER_PROFILES[persona].avatar} alt={INTERVIEWER_PROFILES[persona].name} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{INTERVIEWER_PROFILES[persona].name}</h2>
                        <p className="text-white/60 font-medium mb-6">{INTERVIEWER_PROFILES[persona].role}</p>
                        
                        <div className="flex flex-col gap-3 bg-black/30 rounded-xl p-4 text-sm text-white/80 mb-8 border border-white/5 text-left">
                          <div className="flex justify-between"><span>Topic:</span><span className="font-bold text-white">{interviewDetails.focusArea}</span></div>
                          <div className="flex justify-between"><span>Level:</span><span className="font-bold text-white">{interviewDetails.level}</span></div>
                          <div className="flex justify-between"><span>Duration:</span><span className="font-bold text-white">~20 min</span></div>
                        </div>

                        <div className="text-4xl font-black text-emerald-400 font-mono tracking-widest animate-pulse">
                          {introCountdown}
                        </div>
                        <p className="text-xs text-white/40 mt-3 uppercase tracking-widest">Interview Starting</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Top Row: Videos */}
                <div className="flex flex-col md:flex-row gap-4 h-[35%] min-h-[220px] flex-shrink-0">
                   {/* AI Interviewer Container (60%) */}
                   <div className="w-full lg:w-3/5 relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex flex-col p-4">
                      {/* Name & Title */}
                      <div className="flex items-start justify-between z-10 relative mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {aiState !== "listening" && (
                              <div className={`absolute -inset-2 rounded-full border border-violet-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]`} />
                            )}
                            <img src={INTERVIEWER_PROFILES[persona].avatar} className={`relative z-10 w-16 h-16 rounded-full border-2 ${INTERVIEWER_PROFILES[persona].color} object-cover shadow-xl ${aiState !== 'listening' ? 'shadow-violet-500/30' : ''}`} alt="AI Interviewer" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">{INTERVIEWER_PROFILES[persona].name}</h2>
                            <p className="text-sm font-medium text-white/60">{INTERVIEWER_PROFILES[persona].role}</p>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
                          {aiState === "listening" && <><span className="text-emerald-400">🎧</span><span className="text-xs font-bold text-white/90">Listening...</span></>}
                          {aiState === "thinking" && <><span className="text-amber-400">🧠</span><span className="text-xs font-bold text-white/90">Evaluating</span></>}
                          {aiState === "evaluating" && <><span className="text-violet-400 animate-pulse">🧠</span><span className="text-xs font-bold text-white/90">Thinking...</span></>}
                          {aiState === "asking" && <><span className="text-blue-400">🎤</span><span className="text-xs font-bold text-white/90">Speaking...</span></>}
                        </div>
                      </div>

                      {/* Question / Speech Text */}
                      <div className="flex-1 flex flex-col justify-center items-center z-10 relative px-4">
                         {!introPhase && (
                            <p className="text-xl md:text-2xl font-medium text-white/90 text-center leading-relaxed">
                              "{getQuestionText(questions[currentQuestionIndex])}"
                            </p>
                         )}
                      </div>

                      {/* Audio Waveform */}
                      <div className="absolute bottom-6 left-0 right-0 flex items-end justify-center gap-1.5 h-12 z-10">
                         {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
                            <div key={i} 
                                 className={`w-2 rounded-full ${INTERVIEWER_PROFILES[persona].dot} transition-all duration-200 ${aiState === 'asking' || (introPhase && aiState !== 'listening') ? 'animate-pulse opacity-100' : 'opacity-30'}`} 
                                 style={{ 
                                    height: (aiState === 'asking' || (introPhase && aiState !== 'listening')) ? `${30 + (Math.sin(i)*30 + 40)}%` : '15%', 
                                    animationDelay: `${i * 50}ms` 
                                 }} />
                         ))}
                      </div>
                      
                      {/* Ambient Background Glow */}
                      <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[150px] blur-[80px] rounded-full transition-colors duration-1000 ${aiState === 'asking' ? 'bg-blue-500' : aiState === 'thinking' || aiState === 'evaluating' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                   </div>

                   {/* User Camera Container (40%) */}
                   <div className="w-full lg:w-2/5 relative rounded-2xl border border-white/10 bg-black overflow-hidden min-h-[280px]">
                      <video ref={setVideoElementRef} playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-white tracking-widest uppercase">YOU</div>
                      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                         <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-bold text-white flex items-center justify-between gap-4 shadow-lg w-[140px]">
                            <span>Eye Contact</span>
                            <span className={lowEyeContactFlag ? "text-red-400" : "text-emerald-400"}>{Math.round(eyeContactPct)}%</span>
                         </div>
                         <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-bold text-white flex items-center justify-between gap-4 shadow-lg w-[140px]">
                            <span>Posture</span>
                            <span className={isSlouching ? "text-amber-400" : "text-emerald-400"}>{isSlouching ? "Slouching" : "Good"}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Bottom Row: Workspace */}
                <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                  {/* Question Card */}
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-6 py-6 backdrop-blur-md relative overflow-hidden flex-shrink-0">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-purple-600" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs uppercase font-black tracking-[0.2em] text-white/40">
                          QUESTION {currentQuestionIndex + 1}/{questions.length} <span className="mx-2">•</span> {interviewDetails.focusArea === 'track' ? interviewDetails.track : (interviewDetails.focusArea || "General")}
                        </p>
                      </div>
                      
                      <h3 className="text-2xl lg:text-3xl font-semibold text-white/95 leading-snug tracking-tight mb-4">
                        "{getQuestionText(questions[currentQuestionIndex])}"
                      </h3>
                      
                      <div className="flex gap-1 mt-auto">
                        {questions.map((_, idx) => (
                          <div key={idx} className={`flex-1 h-0.5 rounded-full ${idx < currentQuestionIndex ? "bg-primary" : idx === currentQuestionIndex ? "bg-primary/50 animate-pulse" : "bg-white/10"}`} />
                        ))}
                      </div>
                  </div>
                  
                  {/* Answer Interface */}
                  <div className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5 flex-1 min-h-0 overflow-hidden relative">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/50">Your Response</label>
                        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                          <button onClick={() => setAnswerMode("speech")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${answerMode === "speech" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>🎙️ Speak</button>
                          <button onClick={() => setAnswerMode("text")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${answerMode === "text" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>✍️ Type</button>
                        </div>
                      </div>

                      {answerMode === "speech" ? (
                        <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-0 relative overflow-hidden">
                          {isCheckingAnswer ? (
                            <div className="text-white/60 font-medium text-center">Processing your answer...</div>
                          ) : (transcript || interimTranscript || currentAnswer) ? (
                            <div className="w-full h-full text-left font-medium text-lg leading-relaxed whitespace-pre-wrap overflow-y-auto custom-scrollbar text-white/90">
                               {currentAnswer || transcript} <span className="text-white/50">{interimTranscript}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 animate-[pulse_2s_ease-in-out_infinite]">
                                <span className="text-2xl">🎙️</span>
                              </div>
                              <p className="font-bold text-white mb-2">Speak your answer clearly</p>
                              <p className="text-xs text-white/50 max-w-[300px]">The AI is listening. Your audio is transcribed in real-time.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <textarea
                          className="w-full flex-1 p-5 bg-black/20 rounded-2xl border border-white/5 text-foreground/80 resize-none outline-none focus:ring-1 focus:ring-primary/50 text-[15px] leading-relaxed custom-scrollbar min-h-0"
                          value={currentAnswer}
                          disabled={isLoading || isCheckingAnswer || isEvaluated}
                          onChange={(e) => {
                            setCurrentAnswer(e.target.value);
                            setHasSpoken(true);
                          }}
                          placeholder={isCheckingAnswer ? `${INTERVIEWER_PROFILES[persona].name} is evaluating...` : "Type your response here if you cannot speak..."}
                        />
                      )}

                      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-end flex-shrink-0">
                        
                        <div className="flex-1" /> {/* Spacer */}

                        {!isEvaluated ? (
                           <button onClick={submitAnswer} disabled={isLoading || isCheckingAnswer || (!hasSpoken && !String(currentAnswer || "").trim())}
                              className="w-full sm:w-auto shrink-0 shine-hover px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-extrabold text-lg shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                           >
                             {isLoading || isCheckingAnswer ? "Evaluating..." : "Submit Answer →"}
                           </button>
                        ) : (
                           <button onClick={handleNextQuestion} disabled={isLoading}
                              className="w-full sm:w-auto shrink-0 shine-hover px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-lg shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                           >
                             {currentQuestionIndex === questions.length - 1 ? "Submit Final →" : "Next Question →"}
                           </button>
                        )}
                      </div>
                  </div>
                </div>

                {/* Floating Buttons */}
                <div className="absolute bottom-6 right-6 lg:right-8 flex flex-col gap-3 z-40">
                   <button onClick={() => setIsNotesOpen(true)} className="w-12 h-12 rounded-full bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-xl hover:bg-white/10 transition-all shadow-xl shadow-black/50 hover:scale-110 active:scale-95 group" title="Private Notes">
                      📝
                   </button>
                   <button onClick={() => setIsTranscriptOpen(true)} className="w-12 h-12 rounded-full bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-xl hover:bg-white/10 transition-all shadow-xl shadow-black/50 hover:scale-110 active:scale-95 group" title="Session Transcript">
                      📜
                   </button>
                </div>
             </div>

             {/* Right Sidebar (Command Column, spans 3 cols) */}
             <div className="col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/20 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                 {/* Timer Component */}
                 <div className="rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col items-center justify-center relative">
                    <span className="absolute top-4 text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Time Remaining</span>
                    
                    <div className="relative w-32 h-32 mt-6 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" 
                                className={`transition-all duration-1000 ${timeLeft < 20 ? "text-red-400" : timeLeft < 60 ? "text-amber-400" : "text-violet-500"}`}
                                strokeDasharray="283" strokeDashoffset={283 - (timeLeft / 300) * 283} />
                      </svg>
                      <div className={`absolute inset-0 flex items-center justify-center font-mono text-3xl font-black tabular-nums ${timeLeft < 20 ? "text-red-400" : timeLeft < 60 ? "text-amber-400" : "text-white"}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                 </div>

                 {/* Interview Context */}
                 <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col gap-2">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/30 mb-1">Session Context</p>
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                     <span>Company</span>
                     <span className="text-white">{interviewDetails.company || "General"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                     <span>Level</span>
                     <span className="text-white">{interviewDetails.level || "Mid"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                     <span>Focus</span>
                     <span className="text-white">{interviewDetails.focusArea || "General"}</span>
                  </div>
                 </div>

                 {/* AI Status */}
                 <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col items-center gap-2">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/30">AI Processor</p>
                  <div className="flex items-center gap-3 mt-1">
                     {aiState === "listening" && <><span className="text-emerald-400 text-xl animate-pulse">🎧</span><span className="text-sm font-bold text-white">Listening...</span></>}
                     {aiState === "thinking" && <><span className="text-amber-400 text-xl animate-pulse">🧠</span><span className="text-sm font-bold text-white">Evaluating</span></>}
                     {aiState === "evaluating" && <><span className="text-violet-400 text-xl animate-pulse">🧠</span><span className="text-sm font-bold text-white">Thinking...</span></>}
                     {aiState === "asking" && <><span className="text-blue-400 text-xl animate-pulse">🎤</span><span className="text-sm font-bold text-white">Speaking...</span></>}
                  </div>
                 </div>

                 {/* Speaking Analytics */}
                 <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/30 mb-2">Live Analytics</p>
                  
                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-white/60">Speaking Pace</span>
                     <span className={`font-bold ${wpmStatus === "fast" ? "text-amber-400" : wpmStatus === "slow" ? "text-blue-400" : "text-emerald-400"}`}>
                        {wpmStatus === "fast" ? "Fast" : wpmStatus === "slow" ? "Slow" : "Good"}
                     </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-white/60">Filler Words</span>
                     <span className={`font-bold ${fillerWarning ? "text-red-400" : "text-emerald-400"}`}>
                        {fillerCount}
                     </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-white/60">Confidence</span>
                     <span className="font-bold text-emerald-400">
                        {isAiReady ? `${Math.round(confidenceScore * 100)}%` : "..."}
                     </span>
                  </div>
                 </div>

                 {/* Progress Stepper */}
                 <div className="rounded-2xl border border-white/8 bg-white/3 p-4 mt-auto">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/30 mb-3 text-center">Interview Progress</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {questions.map((_, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full border text-[10px] font-black flex items-center justify-center transition-all ${
                        i < currentQuestionIndex ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                        i === currentQuestionIndex ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)]" :
                        "bg-white/5 border-white/10 text-white/30"
                      }`}>
                        {i < currentQuestionIndex ? "✓" : i + 1}
                      </div>
                    ))}
                  </div>
                 </div>
                 
                 {/* Exit Interview Button */}
                 <button onClick={() => setShowExitConfirm(true)}
                    className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                 >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Leave Interview
                 </button>
             </div>

             {/* Slide-out Drawers */}
             <AnimatePresence>
               {isNotesOpen && (
                 <>
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 z-[100]" onClick={() => setIsNotesOpen(false)} />
                   <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-[#0F0F13] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
                   >
                     <div className="flex items-center justify-between p-6 border-b border-white/5">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">📝 Private Scratchpad</h3>
                       <button onClick={() => setIsNotesOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">✕</button>
                     </div>
                     <div className="flex-1 p-6 flex flex-col">
                       <textarea
                         value={sessionNotes}
                         onChange={(e) => setSessionNotes(e.target.value)}
                         placeholder="Jot down key points, frameworks (STAR), or architecture notes here. The AI cannot see this."
                         className="w-full flex-1 p-5 bg-black/40 rounded-xl border border-white/10 text-sm text-emerald-100/80 resize-none focus:outline-none focus:border-emerald-500/30 custom-scrollbar leading-relaxed"
                       />
                     </div>
                   </motion.div>
                 </>
               )}

               {isTranscriptOpen && (
                 <>
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 z-[100]" onClick={() => setIsTranscriptOpen(false)} />
                   <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="absolute top-0 right-0 h-full w-full sm:w-[450px] bg-[#0F0F13] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
                   >
                     <div className="flex items-center justify-between p-6 border-b border-white/5">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">📜 Session Transcript</h3>
                       <button onClick={() => setIsTranscriptOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">✕</button>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                       <div className="space-y-2">
                          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-white/90">
                            <span className="font-bold text-primary text-xs uppercase tracking-wider block mb-2">{INTERVIEWER_PROFILES[persona].name}</span>
                            Hello. Today we'll conduct a {interviewDetails.level} {interviewDetails.jobRole} interview. Topics: {interviewDetails.focusArea}. Let's begin.
                          </div>
                       </div>
                       {questions.slice(0, currentQuestionIndex).map((q, idx) => (
                         <div key={idx} className="space-y-4">
                           <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-white/90">
                             <span className="font-bold text-primary text-xs uppercase tracking-wider block mb-2">{INTERVIEWER_PROFILES[persona].name}</span>
                             {getQuestionText(q)}
                           </div>
                           <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 ml-8">
                             <span className="font-bold text-white/40 text-xs uppercase tracking-wider block mb-2">YOU</span>
                             {answers[idx] || "No response recorded."}
                           </div>
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>

          </motion.div>
        )}

        {/* ── FEEDBACK STAGE ── */}
        {interviewStage === "feedback" && (
          <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start bg-background"
          >
            <div className="glass rounded-[2.5rem] p-8 md:p-12 shadow-premium max-w-4xl mx-auto w-full">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-3">Interview Complete</h1>
                <p className="text-foreground/60 font-medium max-w-xl">Great job finishing the simulation. Here's your performance overview.</p>
              </div>

              <SentimentRibbon sessionLog={sessionLog} />

              <div className="bg-secondary/30 rounded-3xl p-6 md:p-8 my-8 border border-border/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Performance Overview
                </h3>
                <pre className="whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed text-sm">{feedback}</pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate("/")}
                  className="shine-hover px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
                >Back to Dashboard</button>
                {savedSessionId && (
                  <button onClick={() => navigate(`/session/${savedSessionId}`)}
                    className="px-8 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-2 justify-center hover:scale-[1.05]"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span> View Replay
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── EXIT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Leave Interview?</h3>
                <p className="text-white/60 text-sm mb-8">Are you sure you want to exit? Your progress will be lost and this session will not be saved.</p>
                <div className="flex flex-col w-full gap-3">
                  <button onClick={() => { setShowExitConfirm(false); stopPreview(); stopListening(); stopAnalysis(); window.location.href = "/dashboard"; }}
                    className="w-full py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                  >
                    Yes, Leave Interview
                  </button>
                  <button onClick={() => setShowExitConfirm(false)}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Cancel, Keep Going
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoInterview;
