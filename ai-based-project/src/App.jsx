import React, { useEffect, useRef } from 'react';
import Home from "./Pages/Home.jsx";
import InterviewTips from "./components/InterviewTips.jsx";
import Header from "./components/header.jsx";
import Login from './components/Login.jsx';
import ContactUs from './components/ContactUs.jsx';
import Eror404 from './components/Eror404.jsx';
import AboutUs from './components/AboutUs.jsx';
import Reports from './Pages/Reports.jsx';
import Profile from './Pages/Profile.jsx';
import Settings from './Pages/Settings.jsx';
import QuestionBank from './Pages/QuestionBank.jsx';
import Faq from './Pages/Faq.jsx';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';

import "./App.css";
import Dashboard from './Pages/Dashboard.jsx';
import InterviewSetup from './Pages/InterviewSetup.jsx';
import ChatInterview from './Pages/ChatInterview.jsx';
import VideoInterview from './Pages/VideoInterview.jsx';
import VoiceInterview from './Pages/VoiceInterview.jsx';
import Questions from './Pages/Questions.jsx';
import Leaderboard from './Pages/Leaderboard.jsx';
import ForgotPassword from './Pages/ForgotPassword.jsx';
import ResetPassword from './Pages/ResetPassword.jsx';
import VerifyEmail from './Pages/VerifyEmail.jsx';
import Pricing from './Pages/Pricing.jsx';
import { Privacy, Terms, Cookies, GDPR } from './Pages/LegalPage.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { UserGoalProvider } from './context/UserGoalContext.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import MainLayout from './components/MainLayout.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Onboarding from './Pages/Onboarding.jsx';
import ChangeGoal from './Pages/ChangeGoal.jsx';
import DSACodingRound from './Pages/DSACodingRound.jsx';
import InterviewReplay from './Pages/InterviewReplay.jsx';
import SessionDetail from './Pages/SessionDetail.jsx';

function Root() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <Outlet />;
}

function App() {
  // Warm up Render backend as soon as someone opens the frontend.
  // This reduces first-click failures (e.g., Google login) during cold starts.
  const didWarmupRef = useRef(false);

  useEffect(() => {
    // React.StrictMode in dev can run effects twice; avoid double-pinging.
    if (didWarmupRef.current) return;
    didWarmupRef.current = true;

    const controller = new AbortController();
    const timeoutMs = 25000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Use relative '/api' so it works with:
    // - Vite proxy in dev (vite.config.js)
    // - Vercel rewrites in prod (vercel.json)
    fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {
      // Ignore warmup errors; real API calls will handle user-facing errors.
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const router = createBrowserRouter([
    {
      element: <Root />,
      children: [
        // ── Public pages (with standard Header/Footer) ──────────────────────────
    {
      element: <MainLayout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/interviewtips", element: <InterviewTips /> },
        { path: "/contactus", element: <ContactUs /> },
        { path: "/aboutus", element: <AboutUs /> },
        { path: "/Faq", element: <Faq /> },
        { path: "/faq", element: <Faq /> },
        { path: "/privacy", element: <Privacy /> },
        { path: "/terms", element: <Terms /> },
        { path: "/cookies", element: <Cookies /> },
        { path: "/gdpr", element: <GDPR /> },
        { path: "*", element: <Eror404 /> },
      ]
    },
    // ── Login page ──────────────────────────────────────────────────────────
    {
      path: "/login",
      element: <><Header /><Login /></>
    },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password",  element: <ResetPassword /> },
    { path: "/verify-email",    element: <VerifyEmail /> },
    // ── Onboarding — authenticated but outside DashboardLayout ──────────────
    {
      path: "/onboarding",
      element: <RequireAuth><UserGoalProvider><Onboarding /></UserGoalProvider></RequireAuth>
    },
    // ── All authenticated app pages share DashboardLayout (one nav) ─────────
    {
      element: <RequireAuth><UserGoalProvider><DashboardLayout /></UserGoalProvider></RequireAuth>,
      children: [
        { path: "/dashboard",        element: <Dashboard /> },
        { path: "/reports",          element: <Reports /> },
        { path: "/question",         element: <QuestionBank /> },
        { path: "/settings",         element: <Settings /> },
        { path: "/profile",          element: <Profile /> },
        { path: "/interviewsetup",   element: <InterviewSetup /> },
        { path: "/questions/:topic", element: <Questions /> },
        { path: "/chat-interview",   element: <ChatInterview /> },
        { path: "/video-interview",  element: <VideoInterview /> },
        { path: "/voice-interview",  element: <VoiceInterview /> },
        { path: "/leaderboard",      element: <Leaderboard /> },
        { path: "/pricing",          element: <Pricing /> },
        { path: "/change-goal",      element: <ChangeGoal /> },
        { path: "/dsa-round",        element: <DSACodingRound /> },
        { path: "/interview-replay", element: <InterviewReplay /> },
        { path: "/session/:id",      element: <SessionDetail /> },
      ]
    }
      ]
    }
  ])
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App;