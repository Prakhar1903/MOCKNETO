import React from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
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

  return (
    <section className="how-it-works">
      <div className="section-header">
        <h2 className="section-title">From zero to <span className="text-gradient">autonomous</span></h2>
      </div>

      <div className="steps-container">
        {steps.map((step, i) => (
          <div key={i} className="step-card">
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
