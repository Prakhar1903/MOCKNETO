const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const { analyzeAnswerQuality } = require("./answerQuality");

const generateFallbackQuestions = ({
  jobRole,
  level,
  focusArea,
  track,
  count = 5,
}) => {
  const role = jobRole || "Software Engineer";
  const lvl = level || "mid";
  const area = focusArea || "technical";

  const templates = {
    mba: [
      "Tell me about yourself.",
      "Why do you want to pursue an MBA?",
      "What are your career goals?",
      "What are your strengths and weaknesses?",
      "Describe a challenge you’ve overcome.",
      "How do you handle conflict in a team?",
      "Describe feedback you received and how you responded.",
      "How do you handle pressure and deadlines?",
      "What is your most significant accomplishment?",
      "Do you have any questions for us?",
    ],
    technical: [
      `For placement prep: Describe one project you built and your exact contribution (tech stack + impact).`,
      `Explain time complexity and space complexity with an example.`,
      `What is the difference between stack and queue? Give a real use-case for each.`,
      `Explain OOP pillars (encapsulation, inheritance, polymorphism, abstraction) with examples.`,
      `Explain normalization in DBMS and why it matters.`,
      `What happens when you type a URL in the browser?`,
      `Explain one challenging bug you fixed recently in a ${role} context.`,
      `How would you optimize a slow API endpoint? Describe your approach step-by-step.`,
      `What are common performance bottlenecks in web applications and how do you detect them?`,
      `Describe how you would design a scalable authentication system.`,
      `What trade-offs do you consider when choosing a database for a new feature?`,
      `How do you ensure code quality and reliability in production?`,
    ],
    behavioral: [
      `Tell me about a time you handled a difficult stakeholder or teammate.`,
      `Describe a situation where you made a mistake. What did you learn?`,
      `How do you prioritize tasks when everything feels urgent?`,
      `Tell me about a time you took ownership of a problem end-to-end.`,
      `How do you handle feedback or code review comments you disagree with?`,
    ],
    "system-design": [
      `Design a URL shortener service. What components would you include?`,
      `Design a real-time chat system. How would you handle scale and reliability?`,
      `Design a file upload service with virus scanning and resumable uploads.`,
      `Design an interview practice platform like this one. What are the key services?`,
      `How would you ensure observability (logs/metrics/traces) in a microservices setup?`,
    ],
  };

  const isMbaTrack = String(track || "").toLowerCase() === "mba";
  const pool = isMbaTrack
    ? templates.mba
    : templates[area] || templates.technical;
  const wanted = clamp(Number(count) || 5, 1, 10);
  const questions = Array.from(
    { length: wanted },
    (_, i) => pool[i % pool.length],
  );

  // Slightly adjust wording by level
  if (lvl === "entry") {
    return questions.map((q) =>
      q.replace(/scalable|trade-offs|observability/gi, "basic"),
    );
  }
  if (lvl === "senior") {
    return questions.map((q) => `${q} Include trade-offs and edge cases.`);
  }
  return questions;
};

const evaluateFallback = ({ qa }) => {
  const pairs = Array.isArray(qa) ? qa : [];
  const answered = pairs.filter((p) => (p?.answer || "").trim().length > 0);

  // If every provided answer is low-effort, score must be 0.
  const effortSignals = pairs.map((p) => analyzeAnswerQuality(p?.answer || ""));
  const lowEffortAnswered = effortSignals.filter((s, idx) => {
    const has = (pairs[idx]?.answer || "").trim().length > 0;
    return has && s.lowEffort;
  });
  if (answered.length > 0 && lowEffortAnswered.length === answered.length) {
    const feedback = [
      "Score: 0/10",
      "",
      "Strengths:",
      "- You attempted to respond.",
      "",
      "Improvements:",
      "- Answers are too short / keyword-only. Add a clear explanation and one example.",
      "- Use a structure (STAR for behavioral, or Definition → Example → Impact).",
      "",
      "Communication Tips:",
      "- Start with a 1-line summary, then give 2–3 supporting points.",
      "- Avoid single-word or 2-word answers.",
      "",
      "Sample Improved Answer:",
      "- First, I would define the concept in one line. Then I would give a simple example and explain why it matters.",
      "",
      "Next Steps:",
      "- Practice expanding each answer to 6–10 lines with one real example.",
    ].join("\n");
    return { score: 0, feedback };
  }
  const avgLen = answered.length
    ? Math.round(
        answered.reduce((sum, p) => sum + (p.answer || "").trim().length, 0) /
          answered.length,
      )
    : 0;

  // Start from 0 so trivial answers don't accidentally score points.
  let score = 0;
  if (answered.length >= Math.max(1, Math.floor(pairs.length * 0.8)))
    score += 3;
  if (avgLen > 80) score += 2;
  if (avgLen > 160) score += 2;
  if (avgLen > 320) score += 1;
  score = clamp(score, 0, 10);

  const feedback = [
    `Score: ${score}/10`,
    "",
    "Strengths:",
    "- You attempted the majority of questions.",
    "- Answers show reasonable effort and clarity.",
    "",
    "Improvements:",
    "- Add concrete examples (projects, metrics, outcomes).",
    "- Structure answers using STAR (Situation, Task, Action, Result).",
    "",
    "Communication Tips:",
    "- Speak slower, add short pauses, and keep answers structured.",
    "- Avoid filler words; start with a 1-line summary, then details.",
    "",
    "Sample Improved Answer:",
    "- I handled a similar situation by clarifying the goal, proposing a plan, and sharing progress updates.",
    "- Result: reduced rework and delivered on time (mention exact impact/metric).",
    "",
    "Next Steps:",
    "- Practice 2 questions daily and review weak areas.",
    "- Do one timed mock interview per week and iterate.",
  ].join("\n");

  return { score, feedback };
};

const evaluateSingleAnswerFallback = ({ question, answer }) => {
  const q = String(question || "").trim();
  const a = String(answer || "").trim();
  
  const quality = analyzeAnswerQuality(a);
  const qWords = q.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, "")).filter(w => w.length > 3);
  
  // Extract unique key terms from the question (excluding common words)
  const stopWords = new Set(["what", "explain", "difference", "between", "how", "does", "why", "is", "it", "important", "write", "code", "to", "perform", "with", "an", "example", "when", "would", "you", "use", "should", "some", "key", "features", "concept"]);
  const keyTerms = [...new Set(qWords.filter(w => !stopWords.has(w)))].slice(0, 4);

  // Check matching terms in the answer
  const aLower = a.toLowerCase();
  const matchedTerms = keyTerms.filter(term => aLower.includes(term));
  const keywordMatchRatio = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 1;

  if (quality.lowEffort) {
    const verdict = "Weak";
    const score = a.length > 0 ? 3 : 0;
    const good = ["Attempted the response."];
    const improve = [
      "Expand your answer with more explanation.",
      "Add a concrete code snippet or real-world example."
    ];
    let feedback = `Score: ${score}/10\n\nYour answer is too short or lacks sufficient detail. To score higher on "${q.slice(0, 60)}...", try to write at least 2-3 sentences explaining the core concept, its benefits, and a simple use case.`;
    if (a.length === 0) {
      feedback = `Score: 0/10\n\nNo response was provided for the question. In a real interview, always try to make an attempt rather than leaving it blank.`;
    }
    return { score, verdict, good, improve, feedback };
  }

  // Calculate score based on length and keyword match
  let score = 4; // base score for effort
  
  // Length points
  if (a.length > 100) score += 2;
  if (a.length > 250) score += 2;
  if (a.length > 500) score += 1;
  
  // Keyword relevance points
  if (keywordMatchRatio > 0.5) score += 1;
  if (keywordMatchRatio === 1) score += 1;
  
  // Cap score
  score = Math.min(10, score);
  
  const verdict = score >= 8 ? "Strong" : score >= 5 ? "Okay" : "Weak";
  
  // Generate dynamic strengths and improvements
  const good = [];
  const improve = [];
  
  if (a.length > 200) {
    good.push("Good depth and detail in your response.");
  } else {
    good.push("Provides a direct, concise response.");
    improve.push("Expand the explanation further with technical depth.");
  }

  if (matchedTerms.length > 0) {
    good.push(`Successfully referenced key concepts like: ${matchedTerms.join(", ")}.`);
  } else {
    improve.push("Ensure you directly address the core terms asked in the question.");
  }

  if (aLower.includes("example") || aLower.includes("for instance") || aLower.includes("such as") || aLower.includes("eg")) {
    good.push("Includes a clarifying example to support the points.");
  } else {
    improve.push("Add a practical example or use case to demonstrate application.");
  }

  if (improve.length === 0) {
    improve.push("Keep practicing with similar advanced questions.");
  }

  // Construct a personalized feedback text
  let feedback = `Score: ${score}/10\n\n`;
  feedback += `Your response to "${q}" shows a ${verdict.toLowerCase()} understanding of the topic. `;
  
  if (verdict === "Strong") {
    feedback += `You provided a well-structured explanation that touches on the relevant terminology. To make it absolute top-tier, consider mentioning specific performance trade-offs or production-level edge cases.`;
  } else if (verdict === "Okay") {
    feedback += `The answer is on the right track, but could benefit from more structure. Try to frame it as: 1) Core Definition, 2) How it operates, and 3) A concrete example.`;
  } else {
    feedback += `Your answer is a bit brief or misses key aspects of the question. Make sure to clearly define the concept first, and avoid high-level summaries without technical details.`;
  }

  return { score, verdict, good, improve, feedback };
};

const evaluateSessionFeedbackFallback = ({ qa }) => {
  const answered = qa.filter(p => String(p?.answer || "").trim().length > 0);
  const total = qa.length;
  
  // Calculate average score using evaluateSingleAnswerFallback for each Q&A
  const singleResults = qa.map(p => evaluateSingleAnswerFallback({ question: p.question, answer: p.answer }));
  const avgScore = singleResults.length > 0 
    ? Math.round(singleResults.reduce((sum, r) => sum + r.score, 0) / singleResults.length)
    : 0;

  // Group by verdict
  const strongCount = singleResults.filter(r => r.verdict === "Strong").length;
  const okayCount = singleResults.filter(r => r.verdict === "Okay").length;
  const weakCount = singleResults.filter(r => r.verdict === "Weak").length;

  const strengths = [];
  const improvements = [];
  const tips = [];
  const steps = [];

  // Dynamically generate strengths/improvements based on stats
  if (strongCount > 0) {
    strengths.push(`Demonstrated solid competency in ${strongCount} of the questions with clear, well-explained responses.`);
  }
  if (okayCount > 0) {
    strengths.push(`Attempted and provided structured thoughts for ${okayCount} mid-level questions.`);
  }
  if (answered.length > 0 && answered.length < total) {
    improvements.push(`Complete all questions in the session (you answered ${answered.length} out of ${total}).`);
  }
  if (weakCount > 0) {
    improvements.push(`Review the core concepts for questions flagged as Weak (e.g. focus on key terms and clear, detailed definitions).`);
    tips.push("Avoid very brief answers; target at least 2-3 sentences per explanation.");
  } else {
    strengths.push("No answers were flagged as Weak, showing consistent foundational knowledge.");
    tips.push("To take it to the next level, focus on adding industry metrics or quantitative results to your answers.");
  }

  // Fallbacks if lists are empty
  if (strengths.length === 0) strengths.push("Attempted to address the interview questions.");
  if (improvements.length === 0) improvements.push("Keep practicing with more challenging, diverse question banks.");
  if (tips.length === 0) tips.push("Structure answers using STAR (Situation, Task, Action, Result) for behavioral questions.");
  
  steps.push("Practice 2 mock sessions on this topic daily.");
  steps.push("Review the recommended study resources for any weak concepts.");

  // Build the session report
  let feedback = `Score: ${avgScore}/10\n\n`;
  feedback += `### Session Performance Summary\n`;
  feedback += `Out of ${total} questions, you answered ${answered.length}.\n`;
  feedback += `- **Strong**: ${strongCount}\n- **Okay**: ${okayCount}\n- **Weak**: ${weakCount}\n\n`;
  
  feedback += `### Strengths\n`;
  feedback += strengths.map(s => `- ${s}`).join("\n") + "\n\n";
  
  feedback += `### Areas to Improve\n`;
  feedback += improvements.map(i => `- ${i}`).join("\n") + "\n\n";
  
  feedback += `### Communication Tips\n`;
  feedback += tips.map(t => `- ${t}`).join("\n") + "\n\n";
  
  feedback += `### Recommended Next Steps\n`;
  feedback += steps.map(s => `- ${s}`).join("\n");

  return { score: avgScore, feedback };
};

module.exports = {
  generateFallbackQuestions,
  evaluateFallback,
  evaluateSingleAnswerFallback,
  evaluateSessionFeedbackFallback,
};

