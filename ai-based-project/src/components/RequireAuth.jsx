import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const hasToken = () => {
  try {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    return !!user && !!token;
  } catch {
    return false;
  }
};

const isOnboardingComplete = () => {
  try {
    // Check localStorage goal state first (set by UserGoalContext after onboarding)
    const goal = localStorage.getItem("mockneto_goal");
    if (goal) {
      const parsed = JSON.parse(goal);
      if (parsed?.onboardingComplete === true) return true;
    }
    // Fallback: check the user object stored at login (set by backend)
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed?.settings?.goal?.onboardingComplete === true) return true;
    }
    return false;
  } catch {
    return false;
  }
};

const RequireAuth = ({ children }) => {
  const location = useLocation();

  // 1. Must be authenticated
  if (!hasToken()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // 2. Must have completed onboarding — redirect new users
  //    Don't redirect if they're already on /onboarding (avoid loop)
  if (!isOnboardingComplete() && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default RequireAuth;
