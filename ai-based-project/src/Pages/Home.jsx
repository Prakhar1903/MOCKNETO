import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import InterviewImage from '../assets/an-isometric-3d-illustration-depicting-a_2I8c-hUtRFKGqF6ie-btZQ_B--sLBIqSV63F4x75Kj69A-removebg-preview.png';
import Brain from '../assets/1F9E0_color.png';
import Chat from '../assets/E248_color.png';
import Analytic from '../assets/1F4CA_color.png';
import Clock from '../assets/23F0_color.png';
import Superman from '../assets/a70b8cc1a74125a7cd7b2920d77a1ed5.jpg';
import Baburao from '../assets/25ceb275d244a2f4855d0af0bd1d344e.jpg';
import Binod from '../assets/maxresdefault.jpg';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

const Home = () => {
  useEffect(() => {
    const words = ["Communication", "Success", "Knowledge", "Technical Prep", "Discovery"];
    let part = 0;
    let partIndex = 0;
    let interval;
    let direction = "forward";
    const element = document.querySelector(".changing-text");

    function typeWriterEffect() {
      if (!element) return;
      if (direction === "forward") {
        partIndex++;
        element.textContent = words[part].substring(0, partIndex);
        if (partIndex === words[part].length) {
          direction = "backward";
          clearInterval(interval);
          setTimeout(() => {
            interval = setInterval(typeWriterEffect, 60);
          }, 1500);
        }
      } else {
        partIndex--;
        element.textContent = words[part].substring(0, partIndex);
        if (partIndex === 0) {
          direction = "forward";
          part = (part + 1) % words.length;
        }
      }
    }
    interval = setInterval(typeWriterEffect, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen Interview Prep
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Master your <br />
              <span className="text-primary italic">future</span> with AI.
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 mb-10 max-w-lg leading-relaxed font-medium">
              Mockneto combines advanced AI with realistic simulations to help you nail every interview and land your dream job faster.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/interviewsetup" className="relative group overflow-hidden px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Link>
              <Link to="/aboutus" className="px-8 py-4 glass border-foreground/10 rounded-2xl font-bold text-lg hover:bg-foreground/5 transition-all">
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="relative lg:block"
          >
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-150 -z-10"></div>
            <img src={InterviewImage} alt="AI Representation" className="w-full max-w-2xl mx-auto drop-shadow-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            {[
              { val: '10k+', label: 'Interviews' },
              { val: '95%', label: 'Success Rate' },
              { val: '4.9★', label: 'User Rating' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <h2 className="text-4xl md:text-6xl font-extrabold text-primary">{stat.val}</h2>
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Why choose Mockneto?</h2>
            <p className="text-foreground/60 max-w-2xl mx-auto font-medium">
              We provide the tools and confidence you need to succeed in the competitive job market.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Brain, title: 'AI-Powered', desc: 'Smart algorithms that adapt to your specific role and experience level.' },
              { icon: Chat, title: 'Natural Chat', desc: 'Engage in fluid conversations that mimic real-life interview patterns.' },
              { icon: Analytic, title: 'Real Feedback', desc: 'Get granular analysis on your tone, content, and confidence.' },
              { icon: Clock, title: '24/7 Access', desc: 'Practice whenever you want. Your AI interviewer is always ready.' },
            ].map((feat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass p-8 rounded-[2rem] space-y-4 hover:border-primary/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center p-3 group-hover:scale-110 transition-transform shadow-premium">
                  <img src={feat.icon} alt={feat.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold relative z-10">{feat.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed font-bold relative z-10">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-secondary/30 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Trusted by experts.</h2>
            <p className="text-foreground/60 max-w-2xl mx-auto font-medium">
              See how Mockneto has helped thousands of professionals land their dream roles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: Superman, name: 'Sarah Chen', pos: 'SDE at Google', text: "The AI feedback was game-changing for my technical rounds." },
              { img: Baburao, name: 'Marcus J.', pos: 'PM at Microsoft', text: "Best platform for behavioral practice I've ever used." },
              { img: Binod, name: 'Emily R.', pos: 'Data Scientist at Meta', text: "Realistic simulations that really boosted my confidence." },
            ].map((t, i) => (
              <div key={i} className="glass p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4 shadow-lg">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-primary text-sm tracking-widest">★★★★★</div>
                <p className="text-foreground/80 font-medium italic">"{t.text}"</p>
                <div>
                  <h4 className="font-bold">{t.name}</h4>
                  <span className="text-xs text-foreground/40 font-bold uppercase">{t.pos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
