import React from 'react';
import { useParallax } from '../hooks/useAuthAnimations';

export default function AuthVisualPanel() {
  const parallax = useParallax(0.012);

  return (
    <div className="auth-visual-side page-enter-right">
      {/* Enhanced Abstract Blobs */}
      <div className="abstract-shape shape-1" />
      <div className="abstract-shape shape-2" />
      
      {/* Subtle Grid Pattern Overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(124, 58, 237, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div 
        className="floating-cards-container"
        style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
      >
        {/* Analytics Card (Performance) */}
        <div className="glass-mock-card mock-stats-card">
          <div className="mock-header">
            <span style={{ color: '#fff', fontWeight: 600 }}>Performance</span>
            <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>+12.4%</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Real-time agent response time</div>
          <div className="mock-chart">
            <div className="chart-bar" style={{ height: '30%', opacity: 0.3 }} />
            <div className="chart-bar" style={{ height: '50%', opacity: 0.4 }} />
            <div className="chart-bar" style={{ height: '80%', opacity: 0.8 }} />
            <div className="chart-bar" style={{ height: '45%', opacity: 0.5 }} />
            <div className="chart-bar" style={{ height: '95%', opacity: 1, backgroundColor: '#7C3AED' }} />
            <div className="chart-bar" style={{ height: '65%', opacity: 0.6 }} />
            <div className="chart-bar" style={{ height: '75%', opacity: 0.7 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </div>

        {/* Agent Status Card (Live Dashboard Preview) */}
        <div className="glass-mock-card mock-info-card">
          <div className="mock-header">
            <span style={{ color: '#fff', fontWeight: 600 }}>Active Agents</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Fleet Overview</span>
          </div>
          <div className="agent-list">
            <div className="agent-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="status-dot dot-active" />
                <span>Customer Support Bot</span>
              </div>
              <span style={{ opacity: 0.4 }}>v2.4.0</span>
            </div>
            <div className="agent-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="status-dot dot-active" />
                <span>Sales Assistant</span>
              </div>
              <span style={{ opacity: 0.4 }}>v1.8.2</span>
            </div>
            <div className="agent-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="status-dot dot-idle" />
                <span>Data Analyser</span>
              </div>
              <span style={{ opacity: 0.4 }}>Idle</span>
            </div>
          </div>
        </div>

        {/* Security Card (Trust & Protection) */}
        <div className="glass-mock-card mock-stats-card" style={{ '--tx': '50px', animationDelay: '-1.5s', width: '220px' }}>
          <div className="security-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Shield Active
          </div>
          <h4 style={{ fontSize: '0.875rem', marginBottom: '6px' }}>Enterprise Security</h4>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            End-to-end multi-layer encryption enabled for all agents.
          </p>
        </div>
      </div>
    </div>
  );
}
