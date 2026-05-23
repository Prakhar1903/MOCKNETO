import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const VideoInterview = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [interviewDetails, setInterviewDetails] = useState({
    company: "",
    jobRole: "Software Engineer",
    level: "mid",
    focusArea: "technical",
    track: "tech",
    mbaSpecialization: "marketing",
  });

  const [permissionError, setPermissionError] = useState("");
  const [isPreviewOn, setIsPreviewOn] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
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
  const [interviewStage, setInterviewStage] = useState("setup");
  const [feedback, setFeedback] = useState("");

  // persona must be declared BEFORE useSpeechPacing since it's passed as an argument
  const [persona, setPersona] = useState("friendly");

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
      await fetch("/api/interview/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
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
    if (interviewStage === "setup" && cameraEnabled && !isPreviewOn) {
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

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Failed to fetch questions (${response.status})`);
      }

      const data = await response.json();
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (!qs.length) throw new Error("No questions received");

      // Ensure preview is running for video interview
      if (!isPreviewOn) await startPreview();

      setQuestions(qs);
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
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const submitAnswer = async () => {
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

    // Save per-question history on submit.
    try {
      const qText = getQuestionText(questions[currentQuestionIndex]);
      persistPerQuestionHistory({
        score: typeof answerCheck?.score === "number" ? answerCheck.score : undefined,
        text:
          `Q${currentQuestionIndex + 1}: ${qText}\n` +
          `A: ${answer}\n` +
          (answerCheck?.verdict ? `Verdict: ${answerCheck.verdict}\n` : "") +
          (typeof answerCheck?.score === "number"
            ? `Score: ${answerCheck.score}/10\n\n`
            : "\n") +
          String(answerCheck?.feedback || "").trim(),
      });
    } catch {
      // ignore
    }

    const updated = [...answers];
    updated[currentQuestionIndex] = answer;
    setAnswers(updated);
    setCurrentAnswer("");
    setAnswerCheck(null);
    lastCheckedRef.current = { questionIndex: -1, answer: "" };

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const generateFeedback = async (finalAnswers = answers) => {
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
      appendFeedbackToHistory(generatedFeedback);
      setInterviewStage("feedback");
      stopAnalysis();
      stopListening();
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedback(
        "Failed to generate feedback. Here's a basic analysis:\n\n" +
          questions
            .map((q, i) => `Q${i + 1}: ${getQuestionText(q)}\nA: ${finalAnswers[i] || "No answer"}\n`)
            .join("\n"),
      );
      setInterviewStage("feedback");
      stopAnalysis();
      stopListening();
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

    // Save last per-question history before generating overall feedback.
    try {
      const qText = getQuestionText(questions[currentQuestionIndex]);
      persistPerQuestionHistory({
        score: typeof answerCheck?.score === "number" ? answerCheck.score : undefined,
        text:
          `Q${currentQuestionIndex + 1}: ${qText}\n` +
          `A: ${answer}\n` +
          (answerCheck?.verdict ? `Verdict: ${answerCheck.verdict}\n` : "") +
          (typeof answerCheck?.score === "number"
            ? `Score: ${answerCheck.score}/10\n\n`
            : "\n") +
          String(answerCheck?.feedback || "").trim(),
      });
    } catch {
      // ignore
    }

    const updated = [...answers];
    updated[currentQuestionIndex] = answer;
    setAnswers(updated);
    await generateFeedback(updated);
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
    <div className="min-h-[calc(100vh-var(--header-height))] bg-transparent text-slate-900 dark:bg-gray-900 dark:text-gray-100 p-4 md:p-6 radial-background">
      <div className="max-w-5xl mx-auto">
        {interviewStage === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-4 md:p-8 rounded-[2.5rem] overflow-hidden"
            >
              {/* Animated Studio Background */}
              <div className="absolute inset-0 pointer-events-none -z-10 bg-background overflow-hidden">
                <motion.div 
                  animate={{ x: [0, 50, 0], y: [0, -50, 0] }} 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" 
                />
                <motion.div 
                  animate={{ x: [0, -50, 0], y: [0, 50, 0] }} 
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" 
                />
              </div>

              {/* Left Side: 60% Camera Container */}
              <div className="w-full lg:w-[60%] flex flex-col gap-4">
                <div className="glass rounded-[2rem] p-3 shadow-2xl shadow-black/20 relative overflow-hidden group border border-white/5">
                  <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold tracking-wider flex items-center gap-2 border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${cameraEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`}></div>
                      {cameraEnabled ? "LIVE" : "OFF"}
                    </span>
                  </div>

                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
                    <video
                      ref={setVideoElementRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-500 ${cameraEnabled && isPreviewOn ? "opacity-100" : "opacity-0"}`}
                    style={videoFilter ? { filter: videoFilter } : undefined}
                    />
                    {(!cameraEnabled || !isPreviewOn) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <p className="font-medium tracking-wide">Camera is turned off</p>
                      </div>
                    )}
                    
                    {/* Privacy Toggle Overlay */}
                    <button 
                      onClick={toggleCamera}
                      className="absolute bottom-4 right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all z-20"
                      title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                      {cameraEnabled ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>

                    {/* Countdown Overlay */}
                    <AnimatePresence>
                      {countdown !== null && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.5 }}
                          className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                          <motion.span 
                            key={countdown}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`text-8xl md:text-[10rem] font-black tracking-tighter ${countdown === "GO" ? "text-emerald-400" : "text-white"}`}
                            style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                          >
                            {countdown}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Technical Health Check Panel */}
                  <div className="mt-4 grid grid-cols-3 gap-3">

                    {/* Mic Level — shows tooltip if silent 5s */}
                    <div className="relative bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Mic Level</span>
                      <div className="flex items-end gap-1 h-6">
                        {[1,2,3,4,5].map(bar => (
                          <div
                            key={bar}
                            className={`w-1.5 rounded-full transition-all duration-75 ${bar <= micLevel && cameraEnabled ? "bg-emerald-400" : "bg-white/10"}`}
                            style={{ height: `${20 + (bar * 16)}%` }}
                          />
                        ))}
                      </div>
                      {micIdleSeconds >= 5 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-44 bg-sky-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-xl text-center z-50 pointer-events-none"
                        >
                          🎤 Say a few words to test your audio!
                        </motion.div>
                      )}
                    </div>

                    {/* Connection */}
                    <div className="bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Connection</span>
                      <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${connection === "Excellent" ? "text-emerald-400" : connection === "Good" ? "text-blue-400" : "text-yellow-400"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-7h2v4h-2v-4zm0-4h2v2h-2V8z"/></svg>
                        <span className="text-sm font-bold">{connection}</span>
                      </div>
                    </div>

                    {/* Lighting — with Fix button */}
                    <div className="bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Lighting</span>
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-sm font-bold whitespace-nowrap ${lighting.includes("Dark") || lighting.includes("Bright") ? "text-amber-400" : "text-emerald-400"}`}>
                          {cameraEnabled ? lighting : "Off"}
                        </span>
                        {cameraEnabled && (lighting.includes("Dark") || lighting.includes("Bright")) && (
                          <button
                            onClick={() => {
                              if (lighting.includes("Dark")) {
                                setVideoFilter("brightness(1.6) contrast(1.1)");
                              } else {
                                setVideoFilter("brightness(0.75) contrast(0.95)");
                              }
                            }}
                            className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full transition-colors"
                          >
                            Fix
                          </button>
                        )}
                        {videoFilter && (
                          <button
                            onClick={() => setVideoFilter("")}
                            className="text-[9px] text-white/30 hover:text-white/60 underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: 40% Config Panel */}
              <div className="w-full lg:w-[40%] flex flex-col relative">
                <div className="glass rounded-[2rem] p-6 shadow-xl relative z-10 flex flex-col h-full border border-white/5">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">Configuration</h2>
                      <p className="text-sm text-foreground/60 font-medium">Set your interview parameters.</p>
                    </div>
                    <button 
                      onClick={() => setTipsOpen(!tipsOpen)}
                      className={`p-2 rounded-lg transition-colors ${tipsOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                      title="Prep Tips"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  </div>

                  <AnimatePresence>
                    {tipsOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                          <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">Last Minute Tips</h4>
                          <ul className="text-sm text-foreground/80 space-y-2">
                            <li className="flex gap-2"><span>•</span> Look at the camera lens to maintain eye contact.</li>
                            <li className="flex gap-2"><span>•</span> Use the STAR method (Situation, Task, Action, Result).</li>
                            <li className="flex gap-2"><span>•</span> Keep answers concise (under 2 minutes).</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                    {/* Smart Company Dropdown */}
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Target Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Google, Amazon"
                        value={interviewDetails.company}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute top-[100%] left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-xl z-[100] overflow-hidden"
                          >
                            {companySuggestions.map(c => (
                              <button
                                key={c.name}
                                onClick={() => selectCompany(c.name)}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-3 transition-colors"
                              >
                                <span>{c.emoji}</span>
                                <span className="font-semibold">{c.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Job Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Job Role</label>
                      <input
                        type="text"
                        placeholder={interviewDetails.track === "mba" ? "e.g. Management Trainee" : "e.g. Frontend Developer"}
                        value={interviewDetails.jobRole}
                        onChange={(e) => handleDetailChange("jobRole", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>

                    {/* Segmented Level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Experience Level</label>
                      <div className="flex bg-background border border-border rounded-xl p-1">
                        {[
                          { id: "entry", label: "Junior" },
                          { id: "mid", label: "Mid" },
                          { id: "senior", label: "Senior" }
                        ].map(lvl => (
                          <button
                            key={lvl.id}
                            onClick={() => handleDetailChange("level", lvl.id)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${interviewDetails.level === lvl.id ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/60 hover:text-foreground"}`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interview Track */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Interview Track</label>
                      <select
                        value={interviewDetails.track}
                        onChange={(e) => handleDetailChange("track", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="tech">Tech / Software</option>
                        <option value="mba">MBA</option>
                      </select>
                    </div>

                    {/* MBA Specialization */}
                    {interviewDetails.track === "mba" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">MBA Specialization</label>
                        <select
                          value={interviewDetails.mbaSpecialization}
                          onChange={(e) => handleDetailChange("mbaSpecialization", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                        >
                          {MBA_SPECIALIZATIONS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Persona Selector */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Interviewer Persona</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "friendly", emoji: "😊", title: "Friendly", desc: "Patient" },
                          { id: "strict", emoji: "🎩", title: "Strict", desc: "Formal" },
                          { id: "technical", emoji: "🔬", title: "Technical", desc: "Deep-dives" }
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => setPersona(p.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${persona === p.id ? "bg-primary/10 border-primary shadow-sm shadow-primary/20" : "bg-background border-border hover:border-foreground/30"}`}
                          >
                            <span className="text-xl mb-1">{p.emoji}</span>
                            <span className="text-xs font-bold">{p.title}</span>
                            <span className="text-[9px] text-foreground/50">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      onClick={startInterviewCountdown}
                      disabled={isLoading || countdown !== null}
                      className="shine-hover w-full py-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isLoading ? "Preparing Room..." : "Enter Interview"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {interviewStage === "interview" && questions.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-gray-700 rounded border border-gray-600 p-3">
                <div className="text-gray-300 text-sm mb-2">Live Video</div>
                <div className="relative w-full rounded bg-black aspect-video overflow-hidden border border-gray-600">
                  <video
                    ref={setVideoElementRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isAiReady && (
                    <AnalysisOverlay
                      confidenceScore={confidenceScore}
                      sentiment={sentiment}
                      gazeZone={gazeZone}
                      eyeContactPct={eyeContactPct}
                      lowEyeContactFlag={lowEyeContactFlag}
                      wpm={wpm}
                      wpmStatus={wpmStatus}
                      isSlouching={isSlouching}
                      isFidgeting={isFidgeting}
                      fillerCount={fillerCount}
                      fillerWarning={fillerWarning}
                      silenceSeconds={silenceSeconds}
                      persona={persona}
                    />
                  )}
                </div>
                {permissionError && (
                  <div className="text-red-300 text-sm mt-2">{permissionError}</div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  <div className="text-gray-400 text-sm">
                    {interviewDetails.jobRole} ({interviewDetails.level})
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded mb-3 min-h-24 border border-gray-600">
                  <p className="text-lg">{getQuestionText(questions[currentQuestionIndex])}</p>
                </div>

                {(() => {
                  const item = questions[currentQuestionIndex];
                  const ideal = typeof item === "object" ? String(item?.answer || "").trim() : "";
                  const refs =
                    typeof item === "object" && Array.isArray(item?.references)
                      ? item.references
                      : [];

                  if (!ideal) return null;

                  return (
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => setShowIdealAnswer((s) => !s)}
                        className="text-sm px-3 py-2 rounded bg-gray-700 border border-gray-600 hover:bg-gray-600 transition"
                      >
                        {showIdealAnswer ? "Hide" : "Show"} Reference Answer (with GFG links)
                      </button>

                      {showIdealAnswer && (
                        <div className="mt-3 bg-gray-700 p-4 rounded border border-gray-600">
                          {refs.length > 0 && (
                            <div className="mb-3 text-sm text-gray-200">
                              <div className="font-semibold mb-1">References (Options)</div>
                              <div className="flex flex-wrap gap-3">
                                {refs.slice(0, 2).map((r, idx) => (
                                  <a
                                    key={`${idx}-${r?.url || "ref"}`}
                                    href={String(r?.url || "#")}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline text-blue-300 hover:text-blue-200"
                                  >
                                    {String(r?.label || `Option ${idx + 1}`)}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-sm text-gray-100 whitespace-pre-wrap">{ideal}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="mb-6">
                  <label className="block mb-2 text-gray-300">Your Answer:</label>
                  <textarea
                    className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    rows={6}
                    value={currentAnswer}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCurrentAnswer(next);
                      if (answerCheck) {
                        const normalized = String(next || "").trim();
                        if (
                          lastCheckedRef.current.questionIndex === currentQuestionIndex &&
                          lastCheckedRef.current.answer !== normalized
                        ) {
                          setAnswerCheck(null);
                        }
                      }
                    }}
                    placeholder="Type your answer here..."
                  />
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={checkCurrentAnswer}
                    disabled={isCheckingAnswer || !String(currentAnswer || "").trim()}
                    className="flex-1 bg-indigo-600 py-2 rounded hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {isCheckingAnswer ? "Checking..." : "Check Answer"}
                  </button>
                  {answerCheck && (
                    <button
                      onClick={() => {
                        setAnswerCheck(null);
                        lastCheckedRef.current = { questionIndex: -1, answer: "" };
                      }}
                      className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-500 transition-colors"
                    >
                      Clear Check
                    </button>
                  )}
                </div>

                {answerCheck && (
                  <div className="bg-gray-700 p-4 rounded mb-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-gray-300 text-sm">
                        Answer Check{answerCheck?.source ? ` (${answerCheck.source})` : ""}
                      </div>
                      {typeof answerCheck?.score === "number" && (
                        <div className="text-gray-200 text-sm">Score: {answerCheck.score}/10</div>
                      )}
                    </div>

                    {answerCheck?.encouragement && (
                      <div className="text-gray-100 text-sm mb-3">
                        {String(answerCheck.encouragement)}
                      </div>
                    )}

                    {Array.isArray(answerCheck?.resources) && answerCheck.resources.length > 0 && (
                      <div className="mb-4">
                        <div className="text-gray-200 text-sm mb-1">Recommended sources</div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {answerCheck.resources.slice(0, 3).map((r, idx) => (
                            <a
                              key={`res-${idx}-${r?.url || ""}`}
                              href={String(r?.url || "#")}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-blue-300 hover:text-blue-200"
                            >
                              {String(r?.label || `Source ${idx + 1}`)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {answerCheck?.verdict && (
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs ${verdictStyles(
                            answerCheck.verdict,
                          )}`}
                        >
                          Verdict: {String(answerCheck.verdict)}
                        </span>
                      </div>
                    )}
                    {answerCheck?.warning && (
                      <div className="text-yellow-200 text-xs mb-2">{String(answerCheck.warning)}</div>
                    )}

                    {(Array.isArray(answerCheck?.good) || Array.isArray(answerCheck?.improve)) && (
                      <div className="space-y-3">
                        {Array.isArray(answerCheck?.good) && answerCheck.good.length > 0 && (
                          <div>
                            <div className="text-gray-200 text-sm mb-1">What’s good</div>
                            <ul className="text-gray-100 text-sm list-disc pl-5 space-y-1">
                              {answerCheck.good.slice(0, 3).map((item, idx) => (
                                <li key={`good-${idx}`}>{String(item)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(answerCheck?.improve) && answerCheck.improve.length > 0 && (
                          <div>
                            <div className="text-gray-200 text-sm mb-1">What to improve</div>
                            <ul className="text-gray-100 text-sm list-disc pl-5 space-y-1">
                              {answerCheck.improve.slice(0, 3).map((item, idx) => (
                                <li key={`imp-${idx}`}>{String(item)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(answerCheck?.keyMissing) && answerCheck.keyMissing.length > 0 && (
                          <div>
                            <div className="text-gray-200 text-sm mb-1">Key missing points</div>
                            <ul className="text-gray-100 text-sm list-disc pl-5 space-y-1">
                              {answerCheck.keyMissing.slice(0, 2).map((item, idx) => (
                                <li key={`miss-${idx}`}>{String(item)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {answerCheck?.improvedAnswer && (
                          <div>
                            <div className="text-gray-200 text-sm mb-1">Suggested improved answer</div>
                            <pre className="whitespace-pre-wrap font-sans text-gray-100 text-sm bg-gray-800/50 p-3 rounded border border-gray-600">
                              {String(answerCheck.improvedAnswer)}
                            </pre>
                          </div>
                        )}

                        {answerCheck?.oneLinerTip && (
                          <div className="text-gray-200 text-sm">
                            <span className="text-gray-300">One-liner tip:</span>{" "}
                            {String(answerCheck.oneLinerTip)}
                          </div>
                        )}
                      </div>
                    )}

                    {!Array.isArray(answerCheck?.good) && !Array.isArray(answerCheck?.improve) && (
                      <pre className="whitespace-pre-wrap font-sans text-gray-100">
                        {answerCheck?.feedback || "No feedback"}
                      </pre>
                    )}
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-500 transition-colors"
                    >
                      Previous
                    </button>
                  )}

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={submitAnswer}
                      disabled={isCheckingAnswer}
                      className={`flex-1 bg-blue-600 py-2 rounded hover:bg-blue-500 transition-colors ${
                        currentQuestionIndex > 0 ? "" : "ml-auto"
                      } disabled:opacity-50`}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={submitFinalAnswer}
                      disabled={isLoading || isCheckingAnswer}
                      className="flex-1 bg-green-600 py-2 rounded hover:bg-green-500 transition-colors disabled:opacity-50"
                    >
                      {isLoading
                        ? "Generating Feedback..."
                        : isCheckingAnswer
                          ? "Checking Answer..."
                          : "Submit Final Answer"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {interviewStage === "feedback" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">Interview Feedback</h1>

            <div className="bg-gray-700 p-4 rounded mb-6 border border-gray-600">
              <pre className="whitespace-pre-wrap font-sans">{feedback}</pre>
            </div>
            <SentimentRibbon sessionLog={sessionLog} />


            <div className="flex gap-4">
              <button
                onClick={() => {
                  setInterviewStage("setup");
                  setQuestions([]);
                  setAnswers([]);
                  setCurrentQuestionIndex(0);
                  setFeedback("");
                }}
                className="flex-1 bg-blue-600 py-3 rounded hover:bg-blue-500 transition-colors font-medium"
              >
                New Interview
              </button>

              <button
                onClick={() => {
                  setInterviewStage("interview");
      startAnalysis();
      startListening();
                  setCurrentQuestionIndex(0);
                }}
                className="flex-1 bg-gray-600 py-3 rounded hover:bg-gray-500 transition-colors font-medium"
              >
                Review Answers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInterview;
