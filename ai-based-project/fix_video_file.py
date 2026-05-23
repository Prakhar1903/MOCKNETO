import re

with open("src/Pages/VideoInterview.jsx", "r") as f:
    content = f.read()

# 1. Clean up duplicated credentials
content = content.replace(
    'credentials: "include",\n        credentials: "include",',
    'credentials: "include",'
)

# 2. State Additions
state_code = """  const [feedback, setFeedback] = useState("");

  // --- Green Room State ---
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [connection, setConnection] = useState("Checking");
  const [lighting, setLighting] = useState("Checking");
  const [persona, setPersona] = useState("friendly");
  const [countdown, setCountdown] = useState(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState([]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);
  const lightingTimerRef = useRef(null);
  const canvasRef = useRef(null);

  const KNOWN_COMPANIES = [
    { name: "Google", emoji: "🔵", color: "#4285F4" },
    { name: "Amazon", emoji: "🟠", color: "#FF9900" },
    { name: "Microsoft", emoji: "🟦", color: "#00A4EF" },
    { name: "Meta", emoji: "🔷", color: "#1877F2" },
    { name: "Apple", emoji: "⚫", color: "#555555" },
    { name: "Netflix", emoji: "🔴", color: "#E50914" },
  ];
"""
content = content.replace('  const [feedback, setFeedback] = useState("");', state_code)


# 3. Add handleCompanyChange before the return
company_logic = """
  const handleCompanyChange = (e) => {
    const val = e.target.value;
    handleDetailChange("company", val);
    if (val.length > 0) {
      const suggestions = KNOWN_COMPANIES.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setCompanySuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCompany = (name) => {
    handleDetailChange("company", name);
    setShowSuggestions(false);
  };

  return (
"""
# Find the exact return statement
content = content.replace("  return (\n    <div className=\"min-h-screen", company_logic + "    <div className=\"min-h-screen")

# 4. Replace setup JSX
start_marker = '{interviewStage === "setup" && ('
end_marker = '{interviewStage === "interview" && questions.length > 0 && ('

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

setup_jsx = """{interviewStage === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4 md:p-8 rounded-[2.5rem] overflow-hidden"
            >
              {/* Animated Studio Background */}
              <div className="absolute inset-0 pointer-events-none -z-10 bg-background overflow-hidden">
                <motion.div 
                  animate={{ x: [0, 50, 0], y: [0, -50, 0] }} 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" 
                />
                <motion.div 
                  animate={{ x: [0, -50, 0], y: [0, 50, 0] }} 
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" 
                />
              </div>

              {/* Left Side: 60% Camera Container */}
              <div className="w-full lg:w-[60%] flex flex-col gap-4">
                <div className="glass rounded-[2rem] p-3 shadow-2xl shadow-black/20 relative overflow-hidden group border border-white/5">
                  <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold tracking-wider flex items-center gap-2 border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${cameraEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`}></div>
                      {cameraEnabled ? "LIVE" : "OFF"}
                    </span>
                  </div>

                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
                    <video
                      ref={setVideoElementRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-500 ${cameraEnabled && isPreviewOn ? "opacity-100" : "opacity-0"}`}
                    />
                    {(!cameraEnabled || !isPreviewOn) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <p className="font-medium tracking-wide">Camera is turned off</p>
                      </div>
                    )}
                    
                    {/* Privacy Toggle Overlay */}
                    <button 
                      onClick={toggleCamera}
                      className="absolute bottom-4 right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all z-20"
                      title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                      {cameraEnabled ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>

                    {/* Countdown Overlay */}
                    <AnimatePresence>
                      {countdown !== null && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.5 }}
                          className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                          <motion.span 
                            key={countdown}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`text-8xl md:text-[10rem] font-black tracking-tighter ${countdown === "GO" ? "text-emerald-400" : "text-white"}`}
                            style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                          >
                            {countdown}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Technical Health Check Panel */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Mic Level</span>
                      <div className="flex items-end gap-1 h-6">
                        {[1,2,3,4,5].map(bar => (
                          <div 
                            key={bar} 
                            className={`w-1.5 rounded-full transition-all duration-75 ${bar <= micLevel && cameraEnabled ? "bg-emerald-400" : "bg-white/10"}`}
                            style={{ height: `${20 + (bar * 16)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Connection</span>
                      <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${connection === "Excellent" ? "text-emerald-400" : connection === "Good" ? "text-blue-400" : "text-yellow-400"}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-7h2v4h-2v-4zm0-4h2v2h-2V8z"/></svg>
                        <span className="text-sm font-bold">{connection}</span>
                      </div>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/50">Lighting</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold whitespace-nowrap">{cameraEnabled ? lighting : "Off"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: 40% Config Panel */}
              <div className="w-full lg:w-[40%] flex flex-col relative">
                <div className="glass rounded-[2rem] p-6 shadow-xl relative z-10 flex flex-col h-full border border-white/5">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">Configuration</h2>
                      <p className="text-sm text-foreground/60 font-medium">Set your interview parameters.</p>
                    </div>
                    <button 
                      onClick={() => setTipsOpen(!tipsOpen)}
                      className={`p-2 rounded-lg transition-colors ${tipsOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                      title="Prep Tips"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  </div>

                  <AnimatePresence>
                    {tipsOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                          <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">Last Minute Tips</h4>
                          <ul className="text-sm text-foreground/80 space-y-2">
                            <li className="flex gap-2"><span>•</span> Look at the camera lens to maintain eye contact.</li>
                            <li className="flex gap-2"><span>•</span> Use the STAR method (Situation, Task, Action, Result).</li>
                            <li className="flex gap-2"><span>•</span> Keep answers concise (under 2 minutes).</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                    {/* Smart Company Dropdown */}
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Target Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Google, Amazon"
                        value={interviewDetails.company}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                          >
                            {companySuggestions.map(c => (
                              <button
                                key={c.name}
                                onClick={() => selectCompany(c.name)}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-3 transition-colors"
                              >
                                <span>{c.emoji}</span>
                                <span className="font-semibold">{c.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Job Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Job Role</label>
                      <input
                        type="text"
                        placeholder={interviewDetails.track === "mba" ? "e.g. Management Trainee" : "e.g. Frontend Developer"}
                        value={interviewDetails.jobRole}
                        onChange={(e) => handleDetailChange("jobRole", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>

                    {/* Segmented Level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Experience Level</label>
                      <div className="flex bg-background border border-border rounded-xl p-1">
                        {[
                          { id: "entry", label: "Junior" },
                          { id: "mid", label: "Mid" },
                          { id: "senior", label: "Senior" }
                        ].map(lvl => (
                          <button
                            key={lvl.id}
                            onClick={() => handleDetailChange("level", lvl.id)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${interviewDetails.level === lvl.id ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/60 hover:text-foreground"}`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interview Track */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Interview Track</label>
                      <select
                        value={interviewDetails.track}
                        onChange={(e) => handleDetailChange("track", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="tech">Tech / Software</option>
                        <option value="mba">MBA</option>
                      </select>
                    </div>

                    {/* MBA Specialization */}
                    {interviewDetails.track === "mba" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">MBA Specialization</label>
                        <select
                          value={interviewDetails.mbaSpecialization}
                          onChange={(e) => handleDetailChange("mbaSpecialization", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                        >
                          {MBA_SPECIALIZATIONS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Persona Selector */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Interviewer Persona</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "friendly", emoji: "😊", title: "Friendly", desc: "Patient" },
                          { id: "strict", emoji: "🎩", title: "Strict", desc: "Formal" },
                          { id: "technical", emoji: "🔬", title: "Technical", desc: "Deep-dives" }
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => setPersona(p.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${persona === p.id ? "bg-primary/10 border-primary shadow-sm shadow-primary/20" : "bg-background border-border hover:border-foreground/30"}`}
                          >
                            <span className="text-xl mb-1">{p.emoji}</span>
                            <span className="text-xs font-bold">{p.title}</span>
                            <span className="text-[9px] text-foreground/50">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      onClick={startInterviewCountdown}
                      disabled={isLoading || countdown !== null}
                      className="shine-hover w-full py-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isLoading ? "Preparing Room..." : "Enter Interview"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}\n          """

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + setup_jsx + content[end_idx:]

with open("src/Pages/VideoInterview.jsx", "w") as f:
    f.write(content)

