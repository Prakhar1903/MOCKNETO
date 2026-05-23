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
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import "./App.css";
import Dashboard from './Pages/Dashboard.jsx';
import InterviewSetup from './Pages/InterviewSetup.jsx';
import ChatInterview from './Pages/ChatInterview.jsx';
import VideoInterview from './Pages/VideoInterview.jsx';
import VoiceInterview from './Pages/VoiceInterview.jsx';
import Questions from './Pages/Questions.jsx';
import { Privacy, Terms, Cookies, GDPR } from './Pages/LegalPage.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import MainLayout from './components/MainLayout.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

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
    // ── All authenticated app pages share DashboardLayout (one nav) ─────────
    {
      element: <RequireAuth><DashboardLayout /></RequireAuth>,
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
      ]
    },
  ])
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App;