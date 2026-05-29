export const MOCK_USER = {
  name: "Prakhar",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNEktmLY3MtYkt8XNuHw0soSQu_oaeIbS3N2cERoTw0nPalames2Twu0xYUyFjnnjh4a8_Ubw4ic60hmohdMj6N-Ur0Wu2-tchfiO4RP4hmec0n8TPoi2csMQrteSnp1OF4yepNRH_1c0PsXcsAi1yMngvEH-7a614no3Zu5T15KtPQpblCp-x3lY9GYMcO5LKl-J3Ya9ybuBfkV95RlegmFZnVWWJGbNyrniuunYJp8cgaAsSRepBB4q0b9-fNli1C1Db13Rh6Q"
};

export const MOCK_STATS = [
  { value: "24", label: "Interviews" },
  { value: "12h", label: "Practice Time" },
  { value: "A-", label: "Global Grade", highlightUrl: "text-secondary" },
  { value: "92%", label: "Clarity Score", highlightUrl: "text-tertiary" },
];

export const MOCK_QUICK_ACTIONS = [
  {
    icon: "chat",
    title: "AI Chat Interview",
    description: "Perfect for asynchronous text-based technical rounds and behavioral drills.",
    cta: "Initialize",
    path: "/chat-interview",
    gradientClass: "from-outline-variant/20",
    bgClass: "bg-secondary-container/30 text-secondary bg-surface-container-low/60 hover:bg-surface-container-highest/80",
    iconBgClass: "bg-secondary-container/30 text-secondary"
  },
  {
    icon: "video_chat",
    title: "Video Simulation",
    description: "Full body language and facial expression analysis with realistic AI avatars.",
    cta: "Go Live",
    path: "/video-interview",
    gradientClass: "from-primary/30",
    bgClass: "bg-surface-container-low/60 hover:bg-primary-container/10",
    iconBgClass: "bg-primary-container/30 text-primary"
  },
  {
    icon: "mic",
    title: "Voice Coaching",
    description: "Focus on tone, pace, and filler-word detection during verbal responses.",
    cta: "Start Recording",
    path: "/voice-interview",
    gradientClass: "from-tertiary/20",
    bgClass: "bg-surface-container-low/60 hover:bg-tertiary-container/10",
    iconBgClass: "bg-tertiary-container/30 text-tertiary"
  }
];

export const MOCK_RECENT_SESSIONS = [
  {
    icon: "code",
    title: "React Frontend Architecture",
    time: "2 days ago • 45 minutes",
    score: "88/100",
    grade: "Excellent",
    iconBg: "bg-secondary/10 text-secondary",
    gradeColor: "text-green-400"
  },
  {
    icon: "psychology",
    title: "Leadership Behavioral Round",
    time: "4 days ago • 30 minutes",
    score: "76/100",
    grade: "Needs Polish",
    iconBg: "bg-primary/10 text-primary",
    gradeColor: "text-yellow-400"
  }
];

export const MOCK_RECOMMENDATION = {
  message: "You've improved in React, but your Binary Tree logic needs work. Try a 15-minute DSA-focused interview.",
  time: "15 min",
  difficulty: "Hard",
  type: "DSA Drill",
  tagColor: "bg-red-500/10 text-red-400 border-red-500/20"
};

export const MOCK_SKILLS = [
  { label: "Technical", value: 85, color: "bg-violet-500", trend: "↑ improving", isWeakest: false },
  { label: "Communication", value: 72, color: "bg-cyan-500", trend: "needs clarity", isWeakest: true },
  { label: "Behavioral", value: 94, color: "bg-emerald-500", trend: "strongest", isWeakest: false }
];

export const MOCK_TIMELINE = [
  {
    date: "Apr 21",
    title: "System Design: Scalability",
    score: 92,
    type: "Chat",
    feedback: ["Strong understanding of load balancing", "Good database sharding logic", "Clarify CAP theorem trade-offs better"]
  },
  {
    date: "Apr 19",
    title: "React Performance Optimization",
    score: 84,
    type: "Video",
    feedback: ["Excellent use of useMemo/useCallback", "Identify re-render triggers faster", "Fiber architecture knowledge is solid"]
  },
  {
    date: "Apr 17",
    title: "Binary Tree Traversal",
    score: 64,
    type: "Code",
    feedback: ["Recursive approach was buggy", "Complexity analysis was incorrect", "Iterative solution needs practice"]
  },
  {
    date: "Apr 14",
    title: "Behavioral: Conflict Resolution",
    score: 78,
    type: "Voice",
    feedback: ["STAR method used effectively", "Tone was slightly defensive", "Good emphasis on team collaboration"]
  }
];

// ─── Explore Mode Data ──────────────────────────────────────────────────────

export const COMPANY_LIST = [
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix',
  'Stripe', 'Uber', 'Airbnb', 'Spotify', 'Salesforce', 'Adobe',
  'Twitter', 'LinkedIn', 'Atlassian', 'Dropbox', 'Shopify', 'Square',
];

export const ROLE_LIST = [
  'Software Engineer', 'Senior SWE', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'ML Engineer', 'Data Scientist', 'DevOps Engineer',
  'Site Reliability Engineer', 'Product Manager', 'Engineering Manager',
];

export const TOPIC_LIST = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search',
  'Linked Lists', 'Trees', 'Tries', 'Graphs', 'Dynamic Programming',
  'Greedy Algorithms', 'Backtracking', 'Heap / Priority Queue',
  'System Design Fundamentals', 'Distributed Systems', 'Database Design',
  'API Design', 'Microservices', 'Caching Strategies', 'Load Balancing',
  'Leadership & Ownership', 'Conflict Resolution', 'Communication',
  'STAR Method', 'Product Sense', 'Estimation / Fermi Problems',
];

export const ONBOARDING_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
  'ML Engineer', 'Data Scientist', 'DevOps Engineer',
  'Site Reliability Engineer', 'Product Manager', 'Engineering Manager',
  'Tech Lead', 'Principal Engineer',
];

export const ONBOARDING_COMPANIES = [
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix',
  'Stripe', 'Uber', 'Airbnb', 'Spotify', 'Salesforce', 'Adobe',
  'Twitter / X', 'LinkedIn', 'Atlassian', 'Dropbox', 'Shopify',
  'Goldman Sachs', 'Morgan Stanley', 'Bloomberg', 'Palantir', 'Snap',
];

export const EXPLORE_CARDS = [
  { id: 'dsa-arrays', topic: 'Arrays & Hashing', category: 'DSA', difficulty: 'Easy', duration: '15', format: 'Chat', isNew: false, isTrending: true },
  { id: 'dsa-two-ptr', topic: 'Two Pointers', category: 'DSA', difficulty: 'Easy', duration: '15', format: 'Chat', isNew: false, isTrending: false },
  { id: 'dsa-binary-search', topic: 'Binary Search', category: 'DSA', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: false, isTrending: true },
  { id: 'dsa-linked-list', topic: 'Linked Lists', category: 'DSA', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: false, isTrending: false },
  { id: 'dsa-trees', topic: 'Binary Trees', category: 'DSA', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: false, isTrending: true },
  { id: 'dsa-graphs', topic: 'Graph Traversal (BFS/DFS)', category: 'DSA', difficulty: 'Hard', duration: '45', format: 'Chat', isNew: false, isTrending: false },
  { id: 'dsa-dp', topic: 'Dynamic Programming', category: 'DSA', difficulty: 'Hard', duration: '45', format: 'Chat', isNew: false, isTrending: true },
  { id: 'dsa-heap', topic: 'Heap / Priority Queue', category: 'DSA', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: true, isTrending: false },
  { id: 'sd-fundamentals', topic: 'System Design Fundamentals', category: 'System Design', difficulty: 'Medium', duration: '45', format: 'Chat', isNew: false, isTrending: true },
  { id: 'sd-url-shortener', topic: 'URL Shortener Design', category: 'System Design', difficulty: 'Medium', duration: '45', format: 'Chat', isNew: false, isTrending: false },
  { id: 'sd-twitter', topic: 'Twitter / Feed Design', category: 'System Design', difficulty: 'Hard', duration: '45', format: 'Voice', isNew: false, isTrending: true },
  { id: 'sd-db-design', topic: 'Database Design Patterns', category: 'System Design', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: true, isTrending: false },
  { id: 'sd-cache', topic: 'Caching Strategies', category: 'System Design', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: true, isTrending: false },
  { id: 'sd-microservices', topic: 'Microservices Architecture', category: 'System Design', difficulty: 'Hard', duration: '45', format: 'Video', isNew: false, isTrending: false },
  { id: 'beh-star', topic: 'STAR Method Walkthrough', category: 'Behavioral', difficulty: 'Easy', duration: '15', format: 'Voice', isNew: false, isTrending: false },
  { id: 'beh-leadership', topic: 'Leadership & Ownership Stories', category: 'Behavioral', difficulty: 'Medium', duration: '30', format: 'Voice', isNew: false, isTrending: true },
  { id: 'beh-conflict', topic: 'Conflict Resolution', category: 'Behavioral', difficulty: 'Medium', duration: '30', format: 'Voice', isNew: false, isTrending: false },
  { id: 'beh-failure', topic: 'Failure & Learning Stories', category: 'Behavioral', difficulty: 'Easy', duration: '15', format: 'Voice', isNew: false, isTrending: false },
  { id: 'beh-ambiguity', topic: 'Handling Ambiguity', category: 'Behavioral', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: true, isTrending: false },
  { id: 'str-negotiation', topic: 'Offer Negotiation Tactics', category: 'Strategy', difficulty: 'Easy', duration: '15', format: 'Chat', isNew: false, isTrending: false },
  { id: 'str-estimation', topic: 'Estimation / Fermi Problems', category: 'Strategy', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: false, isTrending: false },
  { id: 'str-product-sense', topic: 'Product Sense for Engineers', category: 'Strategy', difficulty: 'Medium', duration: '30', format: 'Chat', isNew: true, isTrending: true },
  { id: 'hr-intro', topic: 'Tell Me About Yourself', category: 'HR', difficulty: 'Easy', duration: '15', format: 'Video', isNew: false, isTrending: false },
  { id: 'hr-strengths', topic: 'Strengths & Weaknesses', category: 'HR', difficulty: 'Easy', duration: '15', format: 'Video', isNew: false, isTrending: false },
];

export const TRENDING_TOPICS = [
  { topic: 'Dynamic Programming', sessions: 1243, trend: '+18%' },
  { topic: 'System Design Fundamentals', sessions: 987, trend: '+12%' },
  { topic: 'Binary Trees', sessions: 854, trend: '+9%' },
  { topic: 'Leadership Stories', sessions: 721, trend: '+22%' },
  { topic: 'Twitter / Feed Design', sessions: 634, trend: '+15%' },
];

export const NEW_ADDITIONS = [
  { topic: 'Heap / Priority Queue', category: 'DSA', addedDate: 'May 24' },
  { topic: 'Database Design Patterns', category: 'System Design', addedDate: 'May 23' },
  { topic: 'Handling Ambiguity', category: 'Behavioral', addedDate: 'May 22' },
  { topic: 'Product Sense for Engineers', category: 'Strategy', addedDate: 'May 20' },
];
