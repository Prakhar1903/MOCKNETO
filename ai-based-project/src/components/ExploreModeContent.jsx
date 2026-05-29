
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import {
  EXPLORE_CARDS,
  COMPANY_LIST,
  ROLE_LIST,
  TOPIC_LIST,
  TRENDING_TOPICS,
  NEW_ADDITIONS,
} from '../data/mockData.js';

// ─── Colour helpers ─────────────────────────────────────────────────
const categoryColor = {
  DSA: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  'System Design': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  Behavioral: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Strategy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  HR: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
};

const difficultyColor = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

// ─── BrowseCard ─────────────────────────────────────────────────────
const BrowseCard = ({ card }) => {
  const navigate = useNavigate();
  const { bookmarks, toggleBookmark } = useUserGoal();
  const isBookmarked = bookmarks.has(card.id);

  const formatPath = { Chat: '/chat-interview', Voice: '/voice-interview', Video: '/video-interview' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl bg-neutral-900/60 border border-white/[0.06] hover:border-violet-500/20 hover:shadow-[0_8px_24px_rgba(139,92,246,0.08)] transition-all duration-300 p-5 flex flex-col gap-4 backdrop-blur-md"
    >
      {/* badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${categoryColor[card.category] || 'bg-white/5 text-gray-400 border-white/10'}`}>
          {card.category}
        </span>
        {card.isNew && (
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest">New</span>
        )}
        {card.isTrending && (
          <span className="px-2 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/20 text-orange-300 text-[10px] font-black uppercase tracking-widest">🔥 Trending</span>
        )}
      </div>

      {/* topic */}
      <h3 className="text-sm font-bold text-white leading-snug">{card.topic}</h3>

      {/* chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${difficultyColor[card.difficulty] || 'bg-white/5 text-gray-400 border-white/10'}`}>
          {card.difficulty}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold">
          <span className="material-symbols-outlined text-[12px]">timer</span>{card.duration} min
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold">
          <span className="material-symbols-outlined text-[12px]">
            {card.format === 'Chat' ? 'chat_bubble' : card.format === 'Voice' ? 'keyboard_voice' : 'videocam'}
          </span>
          {card.format}
        </span>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.05]">
        <button
          onClick={() => navigate('/interviewsetup', { state: { topic: card.topic, difficulty: card.difficulty, format: card.format } })}
          className="flex-1 py-2.5 rounded-xl bg-violet-600/90 text-white text-[11px] font-black uppercase tracking-widest hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-500/10"
        >
          Start Session
        </button>
        <button
          onClick={() => toggleBookmark(card.id)}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${isBookmarked ? 'bg-violet-600/20 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400'}`}
        >
          <span className="material-symbols-outlined text-base">{isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
        </button>
      </div>
    </motion.div>
  );
};

// ─── FilterPill ──────────────────────────────────────────────────────
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
      active ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-white'
    }`}
  >
    {label}
  </button>
);

// ─── Sidebar ─────────────────────────────────────────────────────────
const SidebarSection = ({ title, items, onSelect, icon }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full mb-2 group">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
          <span className="material-symbols-outlined text-sm">{icon}</span>{title}
        </span>
        <span className={`material-symbols-outlined text-xs text-gray-600 transition-transform ${open ? '' : '-rotate-90'}`}>expand_more</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-0.5">
              {items.map(item => (
                <button key={item} onClick={() => onSelect(item)}
                  className="text-left text-xs text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'DSA', 'System Design', 'Behavioral', 'Strategy', 'HR'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const FORMATS = ['All', 'Chat', 'Voice', 'Video'];
const DURATIONS = ['All', '15', '30', '45'];

const ExploreModeContent = () => {
  const navigate = useNavigate();
  const { exploreFilters, setExploreFilters, resetExploreFilters, bookmarks } = useUserGoal();
  const { search, category, difficulty, format, duration } = exploreFilters;

  const filtered = useMemo(() => {
    return EXPLORE_CARDS.filter(c => {
      if (search && !c.topic.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'All' && c.category !== category) return false;
      if (difficulty !== 'All' && c.difficulty !== difficulty) return false;
      if (format !== 'All' && c.format !== format) return false;
      if (duration !== 'All' && c.duration !== duration) return false;
      return true;
    });
  }, [search, category, difficulty, format, duration]);

  const handleSurpriseMe = () => {
    if (!filtered.length) return;
    const card = filtered[Math.floor(Math.random() * filtered.length)];
    navigate(`/interviewsetup?topic=${encodeURIComponent(card.topic)}&difficulty=${card.difficulty}&format=${card.format}`);
  };

  const handleSidebarSelect = (term) => {
    setExploreFilters({ search: term, category: 'All' });
  };

  const bookmarkedCards = EXPLORE_CARDS.filter(c => bookmarks.has(c.id));

  return (
    <div className="pt-6 px-4 md:px-6 pb-24 max-w-[1400px] mx-auto">

      {/* ── Top bar ── */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">search</span>
            <input
              value={search}
              onChange={e => setExploreFilters({ search: e.target.value })}
              placeholder="Search topics…"
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-violet-500/50 outline-none transition-all"
            />
          </div>
          <button onClick={handleSurpriseMe}
            className="flex-shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-black hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2">
            <span>🎲</span> Surprise Me
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => <FilterPill key={c} label={c} active={category === c} onClick={() => setExploreFilters({ category: c })} />)}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DIFFICULTIES.map(d => d !== 'All' && <FilterPill key={d} label={d} active={difficulty === d} onClick={() => setExploreFilters({ difficulty: difficulty === d ? 'All' : d })} />)}
          <div className="w-px h-6 bg-white/10 self-center flex-shrink-0" />
          {FORMATS.map(f => f !== 'All' && <FilterPill key={f} label={f} active={format === f} onClick={() => setExploreFilters({ format: format === f ? 'All' : f })} />)}
          <div className="w-px h-6 bg-white/10 self-center flex-shrink-0" />
          {DURATIONS.map(d => d !== 'All' && <FilterPill key={d} label={`${d}m`} active={duration === d} onClick={() => setExploreFilters({ duration: duration === d ? 'All' : d })} />)}
          {(category !== 'All' || difficulty !== 'All' || format !== 'All' || duration !== 'All' || search) && (
            <button onClick={resetExploreFilters} className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex gap-5">

        {/* Left sidebar */}
        <div className="hidden xl:block w-52 flex-shrink-0">
          <div className="sticky top-24 rounded-2xl bg-neutral-900/50 border border-white/[0.06] p-4 backdrop-blur-md">
            <SidebarSection title="By Company" icon="business" items={COMPANY_LIST.slice(0, 8)} onSelect={handleSidebarSelect} />
            <SidebarSection title="By Role" icon="work" items={ROLE_LIST.slice(0, 6)} onSelect={handleSidebarSelect} />
            <SidebarSection title="By Topic" icon="tag" items={TOPIC_LIST.slice(0, 8)} onSelect={handleSidebarSelect} />
            {bookmarkedCards.length > 0 && (
              <SidebarSection
                title="Saved"
                icon="bookmark"
                items={bookmarkedCards.map(c => c.topic)}
                onSelect={handleSidebarSelect}
              />
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-700 mb-4 block">search_off</span>
              <p className="text-gray-400 font-bold mb-2">No sessions match your filters</p>
              <button onClick={resetExploreFilters} className="text-violet-400 text-sm font-bold hover:text-white transition-colors">Reset filters →</button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map(card => <BrowseCard key={card.id} card={card} />)}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right panel */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-4">

            {/* Trending */}
            <div className="rounded-2xl bg-neutral-900/50 border border-white/[0.06] p-4 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">🔥 Trending This Week</p>
              <div className="space-y-3">
                {TRENDING_TOPICS.map((t, i) => (
                  <button key={t.topic} onClick={() => handleSidebarSelect(t.topic)}
                    className="w-full text-left flex items-start justify-between gap-2 group">
                    <div>
                      <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors leading-snug">{t.topic}</p>
                      <p className="text-[10px] text-gray-600">{t.sessions.toLocaleString()} sessions</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-black flex-shrink-0">{t.trend}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* New additions */}
            <div className="rounded-2xl bg-neutral-900/50 border border-white/[0.06] p-4 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">✨ New Additions</p>
              <div className="space-y-3">
                {NEW_ADDITIONS.map(n => (
                  <button key={n.topic} onClick={() => handleSidebarSelect(n.topic)}
                    className="w-full text-left group">
                    <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors leading-snug">{n.topic}</p>
                    <p className="text-[10px] text-gray-600">{n.category} · {n.addedDate}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreModeContent;
