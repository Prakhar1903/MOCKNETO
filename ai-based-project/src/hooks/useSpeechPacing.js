import { useState, useEffect, useRef, useCallback } from "react";

// Filler word thresholds calibrated per persona
const PERSONA_CONFIG = {
  friendly:  { fillerWarningAt: 8,  wpmFastThreshold: 190, wpmSlowThreshold: 70 },
  strict:    { fillerWarningAt: 3,  wpmFastThreshold: 170, wpmSlowThreshold: 90 },
  technical: { fillerWarningAt: 5,  wpmFastThreshold: 180, wpmSlowThreshold: 80 },
};

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "right"];

export const useSpeechPacing = (persona = "friendly") => {
  const config = PERSONA_CONFIG[persona] || PERSONA_CONFIG.friendly;

  const [metrics, setMetrics] = useState({
    fillerCount: 0,
    fillerWarning: false,
    wpm: 0,
    wpmStatus: "good",   // "good" | "fast" | "slow"
    silenceSeconds: 0,   // continuous silence counter
    transcript: "",
  });

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const wordTimestampsRef = useRef([]);
  const fillerCountRef = useRef(0);
  const fullTranscriptRef = useRef("");
  const lastSpeechTimeRef = useRef(Date.now());
  const configRef = useRef(config);

  // Keep config ref in sync when persona changes
  useEffect(() => {
    configRef.current = PERSONA_CONFIG[persona] || PERSONA_CONFIG.friendly;
  }, [persona]);

  // ─── Web Speech API setup ────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        }
      }

      if (finalChunk.trim()) {
        lastSpeechTimeRef.current = Date.now();
        const words = finalChunk.trim().split(/\s+/);
        wordTimestampsRef.current.push({ timestamp: Date.now(), wordCount: words.length });

        // Filler detection
        const lower = finalChunk.toLowerCase();
        let newFillers = 0;
        FILLER_WORDS.forEach((filler) => {
          const regex = new RegExp(`\\b${filler}\\b`, "g");
          const matches = lower.match(regex);
          if (matches) newFillers += matches.length;
        });
        fillerCountRef.current += newFillers;

        fullTranscriptRef.current += " " + finalChunk;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    return () => recognitionRef.current?.stop();
  }, []);

  // ─── Metrics refresh every 1.5s ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isListeningRef.current) return;

      const now = Date.now();
      const silenceSeconds = Math.floor((now - lastSpeechTimeRef.current) / 1000);

      // Rolling WPM over last 15 seconds
      const cutoff = now - 15000;
      wordTimestampsRef.current = wordTimestampsRef.current.filter(
        (e) => e.timestamp > cutoff
      );
      const recentWords = wordTimestampsRef.current.reduce((a, e) => a + e.wordCount, 0);
      const oldest = wordTimestampsRef.current[0];
      let wpm = 0;
      if (oldest && now - oldest.timestamp > 3000) {
        wpm = Math.round((recentWords / (now - oldest.timestamp)) * 60000);
      }

      const { wpmFastThreshold, wpmSlowThreshold, fillerWarningAt } = configRef.current;
      let wpmStatus = "good";
      if (wpm > wpmFastThreshold) wpmStatus = "fast";
      else if (wpm > 0 && wpm < wpmSlowThreshold) wpmStatus = "slow";

      setMetrics({
        fillerCount: fillerCountRef.current,
        fillerWarning: fillerCountRef.current >= fillerWarningAt,
        wpm,
        wpmStatus,
        silenceSeconds,
        transcript: fullTranscriptRef.current.trim(),
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = true;
    fillerCountRef.current = 0;
    fullTranscriptRef.current = "";
    wordTimestampsRef.current = [];
    lastSpeechTimeRef.current = Date.now();
    try { recognitionRef.current.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  return { ...metrics, startListening, stopListening };
};
