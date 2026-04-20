import React from 'react';
import { Link } from 'react-router-dom';
import './AuthShared.css';

const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="logo-text text-gradient">WeTano Engage</Link>
          <p className="auth-tagline">Welcome back. Command your fleet.</p>
        </div>
        <div className="auth-orbpulse"></div>
      </div>
      
      <div className="auth-right">
        <div className="auth-form-wrapper glass-container">
          <h2 className="auth-title typography-display">Sign In</h2>
          <p className="auth-subtitle">Continue to your dashboard</p>
          
          <div className="auth-oauth">
            <button className="oauth-btn">
              <span>Google</span>
            </button>
            <button className="oauth-btn">
              <span>GitHub</span>
            </button>
          </div>
          
          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@company.com" />
            </div>
            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>
              <input type="password" placeholder="••••••••" />
            </div>
            <button type="button" className="btn-primary auth-submit">Sign In</button>
          </form>
          
          <p className="auth-switch">
            Don't have an account? <Link to="/signup" className="text-gradient hover-trigger">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
