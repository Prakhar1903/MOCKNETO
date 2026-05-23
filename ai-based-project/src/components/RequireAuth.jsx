import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const hasToken = () => {
  try {
    const user = localStorage.getItem("user");
    return !!String(user || "").trim();
  } catch {
    return false;
  }
};

const RequireAuth = ({ children }) => {
  const location = useLocation();

  if (!hasToken()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
};

export default RequireAuth;
