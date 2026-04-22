import React, { useEffect, useRef } from 'react';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const sectionRef = useRef(null);

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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const header = section.querySelector('.section-header');
    const cards = section.querySelectorAll('.feature-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (header) observer.observe(header);
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="features-section" ref={sectionRef}>
      <div className="section-header reveal-item">
        <h2 className="section-title typography-display">Everything you need to <span className="text-gradient">scale</span></h2>
        <p className="section-subtitle">A complete suite of tools built specifically for managing autonomous web agents in production environments.</p>
      </div>
      
      <div className="features-grid">
        {features.map((feature, i) => (
          <div
            key={i}
            className="feature-card glass-container reveal-item"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
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
