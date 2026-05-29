import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

const Questions = () => {
  const { topic } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState("All");
  const [openMap, setOpenMap] = useState({});

  const title = useMemo(() => {
    const t = String(topic || "");
    const pretty = t
      .split("-")
      .filter(Boolean)
      .map((p) => p.length <= 4 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return pretty ? `${pretty} Questions` : "Questions";
  }, [topic]);

  const normalized = useMemo(() => {
    const list = Array.isArray(questions) ? questions : [];
    return list
      .map((item) => {
        if (typeof item === "string") {
          return { question: item, answer: "" };
        }
        if (!item || typeof item !== "object") return null;
        const question = String(item.question || item.q || "").trim();
        if (!question) return null;
        return {
          question,
          answer: String(item.answer || item.a || "").trim(),
          difficulty: item.difficulty,
          tags: Array.isArray(item.tags) ? item.tags : [],
        };
      })
      .filter(Boolean);
  }, [questions]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let result = normalized;
    if (activeDifficulty !== 'All') {
       result = result.filter(item => {
         const diff = item.difficulty ? String(item.difficulty).toLowerCase() : 'medium'; // fallback mock difficulty
         return diff === activeDifficulty.toLowerCase();
       });
    }
    if (!q) return result;
    return result.filter((item) => {
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = (item.answer || "").toLowerCase().includes(q);
      const inTags = (item.tags || []).some((t) => String(t).toLowerCase().includes(q));
      return inQuestion || inAnswer || inTags;
    });
  }, [normalized, searchTerm, activeDifficulty]);

  const reviewedCount = Object.values(openMap).filter(Boolean).length;

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/questions/${encodeURIComponent(topic || "")}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login", { replace: true });
            return;
          }
          const errText = await response.text().catch(() => "");
          throw new Error(errText || `Failed to load questions (${response.status})`);
        }
        const data = await response.json();
        setQuestions(Array.isArray(data?.questions) ? data.questions : []);
      } catch (e) {
        setError(e?.message || "Failed to load questions");
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [topic, navigate]);

  return (
    <div className="min-h-screen text-white">
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div>
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Question Bank
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{title}</h1>
          </div>
          
          <div className="relative w-full max-w-md group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-400 transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="Search specific questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-neutral-900 border border-white/10 focus:border-violet-500/50 focus:bg-neutral-800 text-white placeholder-gray-500 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Filters and Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setActiveDifficulty(diff)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  activeDifficulty === diff 
                    ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-white/5' 
                    : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-4 py-2 rounded-xl border border-violet-500/20 whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px]">checklist</span>
            {reviewedCount} of {filtered.length} questions reviewed
          </div>
        </div>

          {isLoading && (
            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 text-center text-gray-400">Loading questions...</div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 text-center text-gray-400">
              No questions found for this topic.
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="space-y-6">
              {filtered.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  key={idx}
                  className="bg-neutral-900/60 border border-white/5 hover:border-violet-500/30 transition-all rounded-[1.5rem] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 font-bold flex items-center justify-center text-sm">{idx + 1}</span>
                        {(item.difficulty || (item.tags && item.tags.length > 0)) && (
                          <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                            {item.difficulty && <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{item.difficulty}</span>}
                            {item.tags && item.tags.length > 0 && item.tags.flatMap(t => String(t).split(',')).map(t => t.trim()).map((tag, i) => (
                               <span key={`${tag}-${i}`} className="bg-white/5 px-2 py-1 rounded border border-white/5">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-lg text-white font-medium mb-4 leading-relaxed">{item.question}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenMap((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-violet-600 hover:text-white transition-all text-sm font-semibold whitespace-nowrap"
                    >
                      {openMap[idx] ? "Hide Answer" : "Show Answer"}
                    </button>
                  </div>

                  {openMap[idx] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 rounded-r-xl rounded-l-sm border border-white/5 bg-[#161121] p-5 border-l-4 border-l-violet-500 shadow-inner">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 mb-3">Answer</div>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {item.answer || "Answer will be added soon."}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dsa-round', { state: { config: { topic: title.replace(' Questions', ''), difficulty: 'Medium' } } })}
          className="px-6 py-4 rounded-2xl bg-cyan-600 text-white font-black tracking-widest text-[11px] shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.5)] border border-cyan-500 transition-all flex items-center gap-3 uppercase group w-full"
        >
          DSA Coding Round
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">code</span>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/interviewsetup')}
          className="px-6 py-4 rounded-2xl bg-violet-600 text-white font-black tracking-widest text-[11px] shadow-[0_20px_50px_rgba(139,92,246,0.3)] hover:shadow-[0_20px_60px_rgba(139,92,246,0.5)] border border-violet-500 transition-all flex items-center gap-3 uppercase group w-full"
        >
          Mock Interview
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Questions;
