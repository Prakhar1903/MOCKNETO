import React from 'react';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const features = [
    {
      title: "Agent Control",
      desc: "Deploy and manage your custom AI agents with granular permissions and detailed behavioral boundaries.",
      icon: "🤖"
    },
    {
      title: "Real-Time Monitoring",
      desc: "Watch your agents interact in real-time. Intervene, override, or pause actions instantly from the dashboard.",
      icon: "⚡"
    },
    {
      title: "Deep Analytics",
      desc: "Understand agent performance, conversation quality, and resolution rates with presentation-ready metrics.",
      icon: "📊"
    }
  ];

  return (
    <section className="features-section">
      <div className="section-header">
        <h2 className="section-title typography-display">Everything you need to <span className="text-gradient">scale</span></h2>
        <p className="section-subtitle">A complete suite of tools built specifically for managing autonomous web agents in production environments.</p>
      </div>
      
      <div className="features-grid">
        {features.map((feature, i) => (
          <div key={i} className="feature-card glass-container">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">{feature.icon}</span>
            </div>
            <h3 className="feature-card-title">{feature.title}</h3>
            <p className="feature-card-desc">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
