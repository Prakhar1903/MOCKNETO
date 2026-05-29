import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API from '../api.jsx';

// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_KEYS = {
  MODE: 'mockneto_dashboard_mode',
  GOAL: 'mockneto_goal',
  FILTERS: 'mockneto_explore_filters',
  BOOKMARKS: 'mockneto_bookmarks',
  EXPLORE_DATES: 'mockneto_explore_dates',
  NUDGE_DISMISSED: 'mockneto_nudge_dismissed',
};

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_GOAL = {
  goalType: null,          // 'job' | 'promotion' | 'switch' | 'exploring'
  targetRole: '',
  experienceLevel: '',     // 'Entry' | 'Mid' | 'Senior' | 'Lead'
  companies: [],           // string[]
  interviewDate: '',
  currentRole: '',
  yearsOfExperience: 0,
  strongestArea: '',
  weakestArea: '',
  schedule: '',            // 'Light' | 'Regular' | 'Intensive'
  sessionLength: '',       // '15' | '30' | '45'
  notifications: true,
  onboardingComplete: false,
};

const DEFAULT_FILTERS = {
  search: '',
  category: 'All',       // 'All' | 'DSA' | 'System Design' | 'Behavioral' | 'Strategy' | 'HR'
  difficulty: 'All',     // 'All' | 'Easy' | 'Medium' | 'Hard'
  format: 'All',         // 'All' | 'Chat' | 'Voice' | 'Video'
  duration: 'All',       // 'All' | '15' | '30' | '45'
  sidebarFilter: null,   // { type: 'company'|'role'|'topic', value: string } | null
};

// ─── Context ──────────────────────────────────────────────────────────────────

const UserGoalContext = createContext(null);

export const UserGoalProvider = ({ children }) => {
  // Dashboard mode
  const [dashboardMode, setDashboardModeState] = useState(
    () => safeRead(LS_KEYS.MODE, 'guided')
  );

  // Goal data
  const [goal, setGoalState] = useState(
    () => ({ ...DEFAULT_GOAL, ...safeRead(LS_KEYS.GOAL, {}) })
  );

  // Explore filters
  const [exploreFilters, setExploreFiltersState] = useState(
    () => ({ ...DEFAULT_FILTERS, ...safeRead(LS_KEYS.FILTERS, {}) })
  );

  // Bookmarks (set of card IDs)
  const [bookmarks, setBookmarksState] = useState(
    () => new Set(safeRead(LS_KEYS.BOOKMARKS, []))
  );

  // Nudge state: tracks ISO date strings of days in explore mode
  const [exploreDates, setExploreDatesState] = useState(
    () => safeRead(LS_KEYS.EXPLORE_DATES, [])
  );
  const nudgeDismissed = safeRead(LS_KEYS.NUDGE_DISMISSED, false);

  // ── Hydrate goal from backend on mount ──────────────────────────────────────
  useEffect(() => {
    API.get('/me')
      .then(res => {
        const serverGoal = res.data?.user?.settings?.goal;
        if (serverGoal) {
          const merged = { ...DEFAULT_GOAL, ...safeRead(LS_KEYS.GOAL, {}), ...serverGoal };
          setGoalState(merged);
          safeWrite(LS_KEYS.GOAL, merged);
        }
      })
      .catch(() => {
        // Silently fall back to localStorage — no crash
      });
  }, []);

  // ── Track explore mode usage for nudge ──────────────────────────────────────
  useEffect(() => {
    if (dashboardMode === 'explore') {
      const today = new Date().toISOString().split('T')[0];
      setExploreDatesState(prev => {
        if (prev.includes(today)) return prev;
        const updated = [...prev, today];
        safeWrite(LS_KEYS.EXPLORE_DATES, updated);
        return updated;
      });
    }
  }, [dashboardMode]);

  // ── Computed: should show nudge ──────────────────────────────────────────────
  const shouldShowNudge =
    dashboardMode === 'explore' &&
    !nudgeDismissed &&
    exploreDates.length >= 3;

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setDashboardMode = useCallback((mode) => {
    setDashboardModeState(mode);
    safeWrite(LS_KEYS.MODE, mode);
  }, []);

  const setGoal = useCallback(async (patch) => {
    setGoalState(prev => {
      const updated = { ...prev, ...patch };
      safeWrite(LS_KEYS.GOAL, updated);
      return updated;
    });
    // Sync to backend — fire and forget, don't block UI
    try {
      await API.put('/me', {
        settings: { goal: { ...safeRead(LS_KEYS.GOAL, {}), ...patch } }
      });
    } catch {
      // localStorage is source of truth; API failure is non-blocking
    }
  }, []);

  const setExploreFilters = useCallback((patch) => {
    setExploreFiltersState(prev => {
      const updated = { ...prev, ...patch };
      safeWrite(LS_KEYS.FILTERS, updated);
      return updated;
    });
  }, []);

  const resetExploreFilters = useCallback(() => {
    setExploreFiltersState(DEFAULT_FILTERS);
    safeWrite(LS_KEYS.FILTERS, DEFAULT_FILTERS);
  }, []);

  const toggleBookmark = useCallback((cardId) => {
    setBookmarksState(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      safeWrite(LS_KEYS.BOOKMARKS, [...next]);
      return next;
    });
  }, []);

  const dismissNudge = useCallback(() => {
    safeWrite(LS_KEYS.NUDGE_DISMISSED, true);
    // Force re-render by re-checking — the nudgeDismissed is read inline,
    // so we trigger a mode "ping" to cause re-render
    setDashboardModeState(m => m);
  }, []);

  const clearOnboarding = useCallback(() => {
    // Used by "Re-run Full Onboarding" in Settings
    const cleaned = { ...safeRead(LS_KEYS.GOAL, {}), onboardingComplete: false };
    safeWrite(LS_KEYS.GOAL, cleaned);
    setGoalState(cleaned);
  }, []);

  const value = {
    // Mode
    dashboardMode,
    setDashboardMode,
    // Goal
    goal,
    setGoal,
    // Explore filters
    exploreFilters,
    setExploreFilters,
    resetExploreFilters,
    // Bookmarks
    bookmarks,
    toggleBookmark,
    // Nudge
    shouldShowNudge,
    dismissNudge,
    // Utilities
    clearOnboarding,
  };

  return (
    <UserGoalContext.Provider value={value}>
      {children}
    </UserGoalContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUserGoal = () => {
  const ctx = useContext(UserGoalContext);
  if (!ctx) {
    throw new Error('useUserGoal must be used inside <UserGoalProvider>');
  }
  return ctx;
};

export default UserGoalContext;
