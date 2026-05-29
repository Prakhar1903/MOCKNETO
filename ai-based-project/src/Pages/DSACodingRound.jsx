import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript", starter: "// Write your solution here\nfunction solution(input) {\n  \n}\n" },
  { id: "python", label: "Python", monacoId: "python", starter: "# Write your solution here\ndef solution(input):\n    pass\n", comingSoon: true },
  { id: "java", label: "Java", monacoId: "java", starter: "// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}\n", comingSoon: true },
  { id: "cpp", label: "C++", monacoId: "cpp", starter: "// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}\n", comingSoon: true },
];

const TOPICS = ["Arrays", "Strings", "Linked List", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Binary Search", "Hashing", "Recursion", "Stack/Queue", "Greedy"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const diffColors = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const safeRun = (code, input) => {
  try {
    const fn = new Function("input", `${code}\nreturn typeof solution === 'function' ? String(solution(input) ?? '') : 'solution() not found';`);
    const result = fn(input);
    return { ok: true, output: String(result) };
  } catch (err) {
    return { ok: false, output: err.message };
  }
};

const verdictBadge = (v) => {
  if (v === "Pass") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (v === "Partial") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
};

export default function DSACodingRound() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config || {};

  const [stage, setStage] = useState("setup"); // setup | loading | interview | results
  const [difficulty, setDifficulty] = useState(config.difficulty || "Medium");
  const [topic, setTopic] = useState(config.topic || "Arrays");
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [hintIndex, setHintIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [activeTab, setActiveTab] = useState("tests"); // tests | review
  const timerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (stage === "interview") {
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = timeLeft < 300 ? "#ef4444" : timeLeft < 600 ? "#f59e0b" : "#ffffff80";

  const loadProblem = async () => {
    setStage("loading");
    try {
      const res = await authFetch("/api/dsa/problem", {
        method: "POST",
        body: JSON.stringify({ difficulty, topic, jobRole: config.jobRole || "Software Engineer" }),
      });
      const data = await res.json();
      setProblem(data.problem);
      const tcRes = await authFetch("/api/dsa/test-cases", {
        method: "POST",
        body: JSON.stringify({ ...data.problem, count: 5 }),
      });
      const tcData = await tcRes.json();
      setTestCases(tcData.testCases || []);
      setTestResults(Array(tcData.testCases?.length || 0).fill(null));
      setStartedAt(new Date());
      setStage("interview");
    } catch {
      setStage("setup");
      alert("Failed to load problem. Please try again.");
    }
  };

  const runTests = useCallback(() => {
    if (!code.trim()) return;
    setRunningTests(true);
    setActiveTab("tests");
    const results = testCases.map(tc => {
      const r = safeRun(code, tc.input);
      const passed = r.ok && r.output.trim() === String(tc.expected).trim();
      return { ...tc, actual: r.output, passed, error: r.ok ? null : r.output };
    });
    setTimeout(() => { setTestResults(results); setRunningTests(false); }, 600);
  }, [code, testCases]);

  const getReview = async () => {
    setReviewLoading(true);
    setActiveTab("review");
    try {
      const res = await authFetch("/api/dsa/review", {
        method: "POST",
        body: JSON.stringify({ title: problem?.title, language: language.id, code, testResults }),
      });
      const data = await res.json();
      const reviewObj = data.review;
      setReview(reviewObj);

      if (reviewObj) {
        const passedCount = testResults.filter(r => r?.passed).length;
        const sessionPayload = {
          date: new Date().toISOString(),
          mode: "dsa",
          company: config.company || "Mock",
          jobRole: config.jobRole || "Software Engineer",
          level: difficulty,
          focusArea: "DSA - " + topic,
          track: "dsa",
          score: (reviewObj.score || 0) * 10,
          dsaMode: true,
          dsaProblem: problem?.title || "DSA Challenge",
          userCode: code,
          language: language.id,
          testsPassed: passedCount,
          testsTotal: testCases.length,
          codeScore: (reviewObj.score || 0) * 10,
          interviewer: "DSA Evaluator",
          duration: Math.max(1, Math.round(((new Date()) - (startedAt || new Date())) / 60000)),
          overallFeedback: reviewObj.summary || "",
          studyRecommendations: [
            ...(reviewObj.improvements || []),
            ...(reviewObj.bugs || []),
            `Optimize complexity: currently Time: ${reviewObj.timeComplexity || '?'}, Space: ${reviewObj.spaceComplexity || '?'}`
          ].filter(Boolean),
          questions: [{
            questionText: `${problem?.title || "DSA Challenge"}\n\n${problem?.description || ""}`,
            answerText: code,
            verdict: reviewObj.verdict || "Fail",
            aiFeedback: reviewObj.summary || "",
            score: (reviewObj.score || 0) * 10,
            improvedAnswer: reviewObj.optimizedApproach || "",
          }],
          startedAt: startedAt || new Date(),
          endedAt: new Date(),
        };

        const saveRes = await authFetch("/api/interview/history", {
          method: "POST",
          body: JSON.stringify(sessionPayload),
        });
        const saveJson = await saveRes.json();
        if (saveJson && saveJson.id) {
          setSavedSessionId(saveJson.id);
        }
      }
    } catch (err) {
      console.error("Error saving/getting review:", err);
      setReview({ verdict: "Error", score: 0, summary: "Failed to load review. Please try again.", bugs: [], improvements: [], timeComplexity: "?", spaceComplexity: "?" });
    } finally {
      setReviewLoading(false);
    }
  };

  const passedCount = testResults.filter(r => r?.passed).length;

  /* ── SETUP SCREEN ─────────────────────────────────────────────────────────── */
  if (stage === "setup") return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 blur-[140px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white/3 backdrop-blur-xl border border-white/8 rounded-3xl p-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-400">code</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white">DSA Coding Round</h1>
            <p className="text-xs text-white/40">Solve • Test • Get AI Review</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className="py-2.5 rounded-xl text-sm font-bold border transition-all"
                  style={difficulty === d
                    ? { background: `${diffColors[d]}20`, borderColor: `${diffColors[d]}60`, color: diffColors[d] }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Topic</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button key={t} onClick={() => setTopic(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={topic === t
                    ? { background: "rgba(139,92,246,0.25)", borderColor: "rgba(139,92,246,0.5)", color: "#a78bfa" }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Language</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map(l => (
                <button key={l.id} onClick={() => { if (!l.comingSoon) { setLanguage(l); setCode(l.starter); } }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${l.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={language.id === l.id
                    ? { background: "rgba(139,92,246,0.25)", borderColor: "rgba(139,92,246,0.5)", color: "#a78bfa" }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  {l.label}
                  {l.comingSoon && <span className="block text-[8px] mt-0.5 text-white/30 font-normal">Coming Soon</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={loadProblem}
          className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all text-white font-bold tracking-wide shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
          Start Coding Round
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </motion.div>
    </div>
  );

  /* ── LOADING SCREEN ───────────────────────────────────────────────────────── */
  if (stage === "loading") return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 mx-auto mb-4" />
        <p className="text-white/60 text-sm font-medium">Generating problem & test cases…</p>
      </div>
    </div>
  );

  /* ── INTERVIEW SCREEN ─────────────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg,#0a0a0f,#0f0a1a,#0a0f1a)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-black/20 backdrop-blur-sm shrink-0">
        <button onClick={() => navigate("/interviewsetup")} className="p-1.5 rounded-lg hover:bg-white/5">
          <span className="material-symbols-outlined text-white/40 text-lg">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-black text-white truncate">{problem?.title || "DSA Problem"}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ background: `${diffColors[problem?.difficulty || difficulty]}15`, borderColor: `${diffColors[problem?.difficulty || difficulty]}40`, color: diffColors[problem?.difficulty || difficulty] }}>
            {problem?.difficulty || difficulty}
          </span>
          {problem?.topic && <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/40 border border-white/8">{problem.topic}</span>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {testResults.some(r => r) && (
            <span className="text-xs font-bold" style={{ color: passedCount === testCases.length ? "#10b981" : "#f59e0b" }}>
              {passedCount}/{testCases.length} passed
            </span>
          )}
          <span className="text-sm font-mono font-bold" style={{ color: timerColor }}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* 3-Panel layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Panel A — Problem */}
        <div className="w-[35%] border-r border-white/5 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Description */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Problem</h2>
              <p className="text-xs text-white/80 leading-relaxed">{problem?.description}</p>
            </div>
            {/* I/O */}
            {(problem?.inputFormat || problem?.outputFormat) && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-2">
                {problem.inputFormat && <div><p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Input</p><p className="text-xs text-white/65">{problem.inputFormat}</p></div>}
                {problem.outputFormat && <div><p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Output</p><p className="text-xs text-white/65">{problem.outputFormat}</p></div>}
              </div>
            )}
            {/* Constraints */}
            {problem?.constraints?.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Constraints</p>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => <li key={i} className="text-xs text-white/60 font-mono">{c}</li>)}
                </ul>
              </div>
            )}
            {/* Examples */}
            {problem?.examples?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Examples</p>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl bg-black/30 border border-white/5 p-3">
                    <p className="text-[10px] text-white/40 mb-1">Example {i + 1}</p>
                    <p className="text-xs font-mono text-emerald-300">In: {ex.input}</p>
                    <p className="text-xs font-mono text-cyan-300">Out: {ex.output}</p>
                    {ex.explanation && <p className="text-[10px] text-white/40 mt-1">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
            {/* Hints */}
            {problem?.hints?.length > 0 && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                <button onClick={() => setHintIndex(h => Math.min(h + 1, problem.hints.length - 1))}
                  className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors w-full">
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  {hintIndex < 0 ? "Get Hint (3 available)" : `Hint ${hintIndex + 1}/${problem.hints.length}`}
                </button>
                {hintIndex >= 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-200/70 mt-2">
                    {problem.hints[hintIndex]}
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel B — Editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          {/* Language bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-black/10 shrink-0">
            {LANGUAGES.map(lang => (
              <button key={lang.id}
                onClick={() => { if (lang.comingSoon) return; setLanguage(lang); setCode(lang.starter); }}
                className="relative px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={language.id === lang.id
                  ? { background: "rgba(139,92,246,0.25)", color: "#a78bfa" }
                  : { color: "rgba(255,255,255,0.35)" }}>
                {lang.label}
                {lang.comingSoon && <span className="ml-1 text-[8px] text-white/20">soon</span>}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <button onClick={runTests} disabled={runningTests}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all disabled:opacity-50">
                {runningTests ? "Running…" : "▶ Run Tests"}
              </button>
              <button onClick={getReview} disabled={reviewLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-all disabled:opacity-50">
                {reviewLoading ? "Reviewing…" : "✦ AI Review"}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language.monacoId}
              value={code}
              onChange={(v) => setCode(v || "")}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                lineNumbersMinChars: 3, padding: { top: 12 }, wordWrap: "on",
              }}
            />
          </div>
        </div>

        {/* Panel C — Results */}
        <div className="w-[28%] flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/5 bg-black/10 shrink-0">
            {[{ id: "tests", label: "Test Cases", icon: "checklist" }, { id: "review", label: "AI Review", icon: "psychology" }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2"
                style={activeTab === tab.id
                  ? { borderColor: "#8b5cf6", color: "#a78bfa" }
                  : { borderColor: "transparent", color: "rgba(255,255,255,0.3)" }}>
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <AnimatePresence mode="wait">
              {activeTab === "tests" && (
                <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {testCases.length === 0 && <p className="text-xs text-white/30 text-center mt-8">Run tests to see results</p>}
                  {testCases.map((tc, i) => {
                    const r = testResults[i];
                    const status = r === null ? "pending" : r.passed ? "pass" : "fail";
                    return (
                      <div key={i} className="rounded-xl border p-3 text-xs"
                        style={status === "pass"
                          ? { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)" }
                          : status === "fail"
                          ? { background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }
                          : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-white/40 uppercase">Test {i + 1}</span>
                          {status !== "pending" && (
                            <span className={`font-bold ${status === "pass" ? "text-emerald-400" : "text-red-400"}`}>
                              {status === "pass" ? "✓ Pass" : "✗ Fail"}
                            </span>
                          )}
                        </div>
                        {tc.label && <p className="text-[10px] text-white/30 mb-1">{tc.label}</p>}
                        <p className="font-mono text-white/60">In: <span className="text-cyan-300/80">{tc.input}</span></p>
                        <p className="font-mono text-white/60">Exp: <span className="text-emerald-300/80">{tc.expected}</span></p>
                        {r && !r.passed && <p className="font-mono text-white/60">Got: <span className="text-red-300/80">{r.actual}</span></p>}
                      </div>
                    );
                  })}
                  {testResults.some(r => r) && (
                    <div className="pt-2">
                      <div className="rounded-xl bg-white/3 border border-white/8 p-3 text-center">
                        <span className="text-lg font-black" style={{ color: passedCount === testCases.length ? "#10b981" : "#f59e0b" }}>
                          {passedCount}/{testCases.length}
                        </span>
                        <p className="text-[10px] text-white/40 mt-0.5">tests passed</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "review" && (
                <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {reviewLoading && (
                    <div className="space-y-2 animate-pulse mt-2">
                      {[60, 80, 45, 70].map((w, i) => <div key={i} className="h-3 rounded bg-white/8" style={{ width: `${w}%` }} />)}
                    </div>
                  )}
                  {!reviewLoading && !review && (
                    <div className="text-center mt-8">
                      <span className="material-symbols-outlined text-3xl text-white/20 block mb-2">psychology</span>
                      <p className="text-xs text-white/30">Click "AI Review" to get code analysis</p>
                    </div>
                  )}
                  {review && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {/* Verdict row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${verdictBadge(review.verdict)}`}>{review.verdict}</span>
                        <span className="text-sm font-black text-white">{review.score}/10</span>
                        {review.isOptimal && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Optimal ✓</span>}
                      </div>
                      {/* Complexity */}
                      <div className="grid grid-cols-2 gap-2">
                        {[{ label: "Time", val: review.timeComplexity, color: "#8b5cf6" }, { label: "Space", val: review.spaceComplexity, color: "#06b6d4" }].map(({ label, val, color }) => (
                          <div key={label} className="rounded-xl bg-white/3 border border-white/8 p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
                            <p className="text-sm font-black text-white font-mono">{val || "?"}</p>
                          </div>
                        ))}
                      </div>
                      {/* Summary */}
                      {review.summary && <div className="rounded-xl bg-white/3 border border-white/8 p-3"><p className="text-xs text-white/70 leading-relaxed">{review.summary}</p></div>}
                      {/* Bugs */}
                      {review.bugs?.length > 0 && (
                        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Issues</p>
                          {review.bugs.map((b, i) => <p key={i} className="text-xs text-red-300/70 leading-relaxed">• {b}</p>)}
                        </div>
                      )}
                      {/* Improvements */}
                      {review.improvements?.length > 0 && (
                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Improvements</p>
                          {review.improvements.map((imp, i) => <p key={i} className="text-xs text-amber-300/70 leading-relaxed">• {imp}</p>)}
                        </div>
                      )}
                      {/* Optimized approach */}
                      {review.optimizedApproach && (
                        <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-3">
                          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1.5">Optimal Approach</p>
                          <p className="text-xs text-white/65 leading-relaxed">{review.optimizedApproach}</p>
                        </div>
                      )}
                      {savedSessionId && (
                        <button
                          onClick={() => navigate(`/session/${savedSessionId}`)}
                          className="w-full mt-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-600/25 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_circle</span> View Detailed Replay
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
