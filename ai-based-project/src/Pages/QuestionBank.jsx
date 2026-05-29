import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGoal } from '../context/UserGoalContext';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_DATA = [
  { id: 1, title: 'HTML', category: 'Frontend', difficulty: 'Easy', qCount: 45, desc: 'Master the fundamental structure of the web.', icon: 'html', glow: 'from-orange-500/20' },
  { id: 2, title: 'CSS', category: 'Frontend', difficulty: 'Easy', qCount: 38, desc: 'Advanced styling, Flexbox, Grid, and animations.', icon: 'css', glow: 'from-blue-500/20' },
  { id: 3, title: 'JavaScript', category: 'Frontend', difficulty: 'Medium', qCount: 120, desc: 'Core logic, async/await, closures, and DOM.', icon: 'javascript', glow: 'from-yellow-400/20' },
  { id: 4, title: 'React', category: 'Frontend', difficulty: 'Medium', qCount: 85, desc: 'Hooks, state management, and component architecture.', icon: 'data_object', glow: 'from-cyan-400/20' },
  { id: 5, title: 'Node.js', category: 'Backend', difficulty: 'Medium', qCount: 56, desc: 'Server-side runtime, Event Loop, and streams.', icon: 'terminal', glow: 'from-green-500/20' },
  { id: 6, title: 'Express', category: 'Backend', difficulty: 'Medium', qCount: 42, desc: 'Fast, unopinionated, minimalist web framework.', icon: 'api', glow: 'from-gray-400/20' },
  { id: 7, title: 'MongoDB', category: 'Database', difficulty: 'Medium', qCount: 30, desc: 'NoSQL basics, aggregation, and indexing.', icon: 'database', glow: 'from-emerald-500/20' },
  { id: 8, title: 'Docker', category: 'DevOps', difficulty: 'Hard', qCount: 25, desc: 'Containerization, orchestration, and CI/CD.', icon: 'view_in_ar', glow: 'from-blue-600/20' },
  { id: 9, title: 'Leadership', category: 'Behavioral', difficulty: 'Medium', qCount: 20, desc: 'Managing teams, conflict resolution, and vision.', icon: 'groups', glow: 'from-purple-500/20' },
  { id: 10, title: 'Problem Solving', category: 'Behavioral', difficulty: 'Hard', qCount: 15, desc: 'Structured approach to complex technical challenges.', icon: 'psychology', glow: 'from-rose-500/20' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

const QuestionBank = () => {
  const navigate = useNavigate();
  const { goal } = useUserGoal();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(MOCK_DATA.map(i => i.category))];
    return cats;
  }, []);
  
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(item => {
      const matchCat = activeCategory === 'All' ? true : item.category === activeCategory;
      const matchDiff = activeDifficulty === 'All' ? true : item.difficulty === activeDifficulty;
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchDiff && matchSearch;
    });
  }, [searchTerm, activeCategory, activeDifficulty]);

  const recommendedData = useMemo(() => {
    const target = goal?.goalType === 'campus' ? 'Problem Solving' : (goal?.weakestArea || 'JavaScript');
    const recs = MOCK_DATA.filter(item => item.title === target || (item.category === 'Behavioral' && item.title !== target));
    return recs.slice(0, 2);
  }, [goal]);

  return (
    <main className="min-h-screen text-white pt-10 px-4 md:px-8 max-w-7xl mx-auto pb-32">
      
      {/* ── Header ── */}
      <motion.section {...fadeUp(0)} className="mb-10 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-3">
          Knowledge Base
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
          Question <span className="text-white/30">Bank.</span>
        </h1>
        <p className="text-gray-400 text-base max-w-lg leading-relaxed">
          Deep dive into our curated collection of technical and behavioral challenges optimized for AI coaching.
        </p>
      </motion.section>

      {/* ── Search Bar ── */}
      <motion.div {...fadeUp(0.1)} className="relative mb-10 group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-gray-500 group-focus-within:text-violet-400 transition-colors">search</span>
        </div>
        <input 
          type="text"
          placeholder="Search topics or technologies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-900 border border-white/5 focus:border-violet-500/50 rounded-2xl py-5 pl-16 pr-6 text-sm text-white placeholder-gray-500 outline-none transition-all focus:shadow-[0_0_40px_rgba(139,92,246,0.1)]"
        />
      </motion.div>

      {/* ── Filters ── */}
      <motion.div {...fadeUp(0.15)} className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar flex-1">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20' 
                  : 'bg-neutral-900 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-px h-8 bg-white/10 hidden md:block self-center mx-2" />
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {difficulties.map((diff, idx) => (
            <button
              key={`diff-${idx}`}
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
      </motion.div>

      {/* ── Recommended Row ── */}
      {activeCategory === 'All' && activeDifficulty === 'All' && !searchTerm && (
        <motion.div {...fadeUp(0.18)} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-violet-400 text-xl">auto_awesome</span>
            <h2 className="text-lg font-bold text-white tracking-tight">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedData.map((item, idx) => (
              <motion.div
                key={`rec-${item.id}`}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => navigate(`/questions/${item.title.toLowerCase()}`)}
                className="group relative rounded-[2rem] bg-gradient-to-br from-[#151515] to-[#0a0a0a] border border-violet-500/20 hover:border-violet-500/40 p-6 flex items-center gap-6 cursor-pointer overflow-hidden shadow-xl shadow-violet-500/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-center shadow-lg relative z-10 shrink-0">
                  <span className="material-symbols-outlined text-2xl text-violet-400 group-hover:scale-110 transition-transform">{item.icon}</span>
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-white/10">
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Topic Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        <AnimatePresence mode="popLayout">
          {filteredData.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/questions/${item.title.toLowerCase()}`)}
              className="group relative rounded-[2rem] bg-neutral-900 border border-white/5 hover:border-violet-500/30 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)] p-8 flex flex-col cursor-pointer transition-all overflow-hidden"
            >
              {/* Internal glow */}
              <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${item.glow} blur-[60px] rounded-full group-hover:opacity-100 opacity-40 transition-opacity pointer-events-none`} />

              {/* Icon */}
              <div className="w-16 h-16 rounded-3xl bg-neutral-950 border border-white/5 flex items-center justify-center mb-8 shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-3xl text-violet-400 group-hover:text-cyan-400 transition-colors">
                  {item.icon}
                </span>
              </div>

              {/* Content */}
              <div className="relative z-10 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 text-[9px] font-black uppercase tracking-widest border border-violet-500/20">
                        {item.qCount} Q
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-white/10">
                        {item.difficulty}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors border border-white/5">
                    <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                  </button>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mt-4">{item.desc}</p>
              </div>

              {/* CTA */}
              <div className="mt-8 flex justify-end relative z-10">
                <div className="px-5 py-2.5 rounded-xl bg-white/5 group-hover:bg-violet-600 border border-white/10 group-hover:border-violet-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-all shadow-lg group-hover:shadow-violet-500/20">
                  Practice Now
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredData.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">search_off</span>
          <p className="text-gray-500 font-medium">No topics found matching your search.</p>
        </motion.div>
      )}

    </main>
  );
};

export default QuestionBank;