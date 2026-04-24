import React, { useEffect, useRef } from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
  const sectionRef = useRef(null);

  const steps = [
    {
      num: "01",
      title: "Connect Infrastructure",
      desc: "Link your existing web services and APIs using our secure integration layer."
    },
    {
      num: "02",
      title: "Configure Agents",
      desc: "Assign roles, set operational bounds, and define success metrics for each AI agent."
    },
    {
      num: "03",
      title: "Monitor Execution",
      desc: "Watch as agents execute tasks autonomously while you maintain full oversight."
    }
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const header = section.querySelector('.section-header');
    const stepCards = section.querySelectorAll('.step-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (header) observer.observe(header);
    stepCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="how-it-works" ref={sectionRef}>
      <div className="section-header reveal-item">
        <h2 className="section-title typography-display">From zero to <span className="text-gradient">autonomous</span></h2>
      </div>

      <div className="steps-container">
        {steps.map((step, i) => (
          <div
            key={i}
            className="step-card glass-container reveal-item reveal-slide-left"
            style={{ transitionDelay: `${i * 0.2}s` }}
          >
            <div className="step-number text-gradient">{step.num}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.desc}</p>
            {i < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
