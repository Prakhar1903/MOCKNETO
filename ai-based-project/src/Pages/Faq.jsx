import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_DATA = [
  {
    question: "What is Mockneto?",
    answer: "Mockneto is an AI-powered platform for mock interviews to help you prepare effectively.",
  },
  {
    question: "How does the AI interview work?",
    answer: "The AI conducts interviews using NLP and ML models and gives instant feedback on your performance.",
  },
  {
    question: "Is Mockneto free to use?",
    answer: "Yes, Mockneto offers free and premium interview practice options.",
  },
  {
    question: "What types of interviews can I practice?",
    answer: "You can practice technical, HR, behavioral, and domain-specific interviews.",
  },
  {
    question: "Can I customize the mock interview?",
    answer: "Yes, you can choose the difficulty, domain, and number of questions.",
  },
  {
    question: "Will I get feedback after the mock interview?",
    answer: "Yes, AI-generated feedback is provided instantly after every mock session.",
  },
  {
    question: "Can I track my performance over time?",
    answer: "Yes, Mockneto tracks your past interviews and gives you performance analytics.",
  },
];

const Faq = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState([]);

  const handleToggle = (index) => {
    setOpenIndex((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFaqs = FAQ_DATA.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white pb-32">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-b from-violet-600/30 to-transparent pt-16 pb-24 px-6 relative border-b border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-white">How can we help you?</h1>
          
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-400 transition-colors text-2xl">
              search
            </span>
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 rounded-2xl bg-neutral-900 border border-white/10 focus:border-violet-500/50 focus:bg-neutral-800 text-lg text-white placeholder-gray-500 outline-none transition-all shadow-2xl"
            />
          </div>
        </div>
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 mt-12 space-y-10">
        
        {/* Accordion FAQ List */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-4">Common Questions</h2>
          <div className="border border-white/5 bg-neutral-900/40 rounded-2xl overflow-hidden divide-y divide-white/5">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No matching questions found.</div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = openIndex.includes(index);
                return (
                  <div key={index} className="transition-colors hover:bg-neutral-800/40">
                    <button
                      onClick={() => handleToggle(index)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-violet-400' : 'text-gray-200'}`}>
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="text-violet-400 ml-4 shrink-0" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-500 ml-4 shrink-0 group-hover:text-gray-300" size={20} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-gray-400 leading-relaxed text-base pt-2">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 p-8 rounded-[1.5rem] bg-neutral-900 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
            <p className="text-gray-400">Our support team is ready to assist you.</p>
          </div>
          <button className="px-8 py-3.5 rounded-xl bg-violet-600 text-white font-bold tracking-wide hover:scale-105 transition-transform whitespace-nowrap shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
};

export default Faq;
