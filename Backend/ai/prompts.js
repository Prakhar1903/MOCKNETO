const buildQuestionPrompt = ({
  company,
  jobRole,
  level,
  focusArea,
  count,
  track,
  mbaSpecialization,
}) => {
  const safeCount = Number.isFinite(count) ? count : 5;
  const isPlacement = String(level || "").toLowerCase() === "entry";
  const t = String(track || "").toLowerCase();
  const spec = String(mbaSpecialization || "").trim();
  const persona =
    t === "mba"
      ? "You are a senior MBA interview coach."
      : "You are a senior technical interviewer.";
  return `${persona}

Task: Generate exactly ${safeCount} interview questions.

Context:
- Role: ${jobRole}
- Level: ${level}
- Focus area: ${focusArea}
- Candidate track (optional): ${t || "N/A"}
- MBA specialization (optional): ${spec || "N/A"}
- Company (optional): ${company || "N/A"}

Goal:
- Make questions suitable for placement / campus interview preparation (especially for entry level), focusing on real interview patterns.

Guidance:
- Include a balanced mix based on focus area.
- If focus area is "technical", prioritize: DSA basics, OOP, DBMS, OS, networking, debugging, projects.
- If candidate track is "mba", avoid DSA/programming questions and ask MBA interview questions aligned to the specialization (marketing/finance/hr/operations/analytics) + common MBA topics (goals, leadership, teamwork, ethics, motivation).
- If focus area is "behavioral", prioritize: teamwork, conflict, ownership, communication, STAR answers.
- If focus area is "system-design", prioritize: scalable design, trade-offs, APIs, database choices.
- Keep each question clear and actionable.

Rules:
- Output ONLY the questions.
- One question per line.
- No numbering, no bullet characters, no extra text.
- Keep questions concise, realistic, and interview-appropriate.
`;
};

const buildFeedbackPrompt = ({
  company,
  jobRole,
  level,
  focusArea,
  qa,
  track,
  mbaSpecialization,
}) => {
  const qaText = (qa || [])
    .map((item, idx) => {
      const q = item?.question || "";
      const a = item?.answer || "";
      return `Q${idx + 1}: ${q}\nA${idx + 1}: ${a || "(no answer)"}`;
    })
    .join("\n\n");

  return `You are an interview coach.

Provide feedback and a score for the candidate.

Context:
- Role: ${jobRole}
- Level: ${level}
- Focus area: ${focusArea}
- Candidate track (optional): ${String(track || "").trim() || "N/A"}
- MBA specialization (optional): ${String(mbaSpecialization || "").trim() || "N/A"}
- Company (optional): ${company || "N/A"}

Candidate responses:
${qaText}

Output format (IMPORTANT):
- First line: "Score: X/10" where X is an integer 0-10
- Then a short sectioned feedback with headings:
  "Strengths:" (2-4 bullets)
  "Improvements:" (2-4 bullets)
  "Communication Tips:" (2-4 bullets)
  "Next Steps:" (2-4 bullets)

Additional requirements:
- Keep feedback placement-oriented (what recruiters expect).
- If answers are too short / keyword-only / nonsensical, score must be 0.
- Suggest 1 improved sample answer snippet (3-6 lines) under heading "Sample Improved Answer:" for the weakest answer.

Keep it concise and actionable.
`;
};

const buildAnswerCheckPrompt = ({
  company,
  jobRole,
  level,
  focusArea,
  track,
  mbaSpecialization,
  question,
  answer,
}) => {
  const q = String(question || "").trim();
  const a = String(answer || "").trim();

  return `You are an interview coach.

Task: Evaluate the candidate's answer to ONE interview question and give immediate coaching.

Context:
- Role: ${jobRole}
- Level: ${level}
- Focus area: ${focusArea}
- Candidate track (optional): ${String(track || "").trim() || "N/A"}
- MBA specialization (optional): ${String(mbaSpecialization || "").trim() || "N/A"}
- Company (optional): ${company || "N/A"}

Question:
${q}

Candidate Answer:
${a || "(no answer)"}

Rules:
- Be specific to the question.
- If the answer is too short / keyword-only / gibberish, the score must be 0 and verdict must be "Weak".
- If correct but vague, ask for the 1-2 most important missing details (metrics, example, trade-offs).
- If wrong/confused, correct it briefly and show the right direction.
- Keep it short and actionable.

OUTPUT FORMAT (CRITICAL):
- Output ONLY valid JSON.
- No markdown, no code fences, no extra text.
- Use double quotes for all strings.
- Arrays must contain plain strings.

Return this JSON shape:
{
  "verdict": "Strong" | "Okay" | "Weak",
  "score": 0-10,
  "good": ["..."],
  "improve": ["..."],
  "keyMissing": ["..."],
  "improvedAnswer": "3-6 lines, concise",
  "oneLinerTip": "..."
}

Constraints:
- verdict must be one of Strong/Okay/Weak.
- score must be an integer 0-10.
- good: 1-3 items; improve: 1-3 items; keyMissing: 0-2 items.
- improvedAnswer must directly answer the question.
`;
};


// ─── DSA Feature Prompts ─────────────────────────────────────────────────────

const buildDSAProblemPrompt = ({ difficulty = "Medium", topic = "Arrays", jobRole = "Software Engineer" }) => {
  return `You are a senior software engineering interviewer at a top-tier tech company.

Generate a single DSA (Data Structures & Algorithms) coding problem.

Context:
- Difficulty: ${difficulty}
- Topic: ${topic}
- Candidate Role: ${jobRole}

Output ONLY valid JSON — no markdown, no code fences, no extra text.

JSON shape:
{
  "title": "Problem Title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "topic": "...",
  "description": "Full problem description (2-4 paragraphs, clear and unambiguous)",
  "inputFormat": "Description of input",
  "outputFormat": "Description of output",
  "constraints": ["1 <= n <= 10^5", "...up to 4 constraints"],
  "examples": [
    { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9" },
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "tags": ["hash-map", "two-pointers"]
}

Rules:
- The problem must be original and solvable.
- Examples must be correct and self-consistent.
- Constraints must reflect the difficulty.
- Do NOT include solution code.
`;
};

const buildTestCasePrompt = ({ title, description, inputFormat, outputFormat, constraints, count = 5 }) => {
  return `You are a test case engineer.

Generate exactly ${count} test cases for the following DSA problem.

Problem Title: ${title}
Description: ${description}
Input Format: ${inputFormat}
Output Format: ${outputFormat}
Constraints: ${(constraints || []).join("; ")}

Output ONLY valid JSON — no markdown, no code fences, no extra text.

JSON shape: an array of exactly ${count} objects:
[
  { "input": "exact input string as described", "expected": "exact expected output string", "label": "Edge case: empty array" },
  ...
]

Rules:
- Include at least 1 edge case (empty, single element, max constraints, negative numbers, etc.).
- Inputs and outputs must be perfectly consistent with each other.
- Each test case must have a short descriptive label.
- Do NOT include solutions or explanations beyond the label.
`;
};

const buildCodeReviewPrompt = ({ title, language, code, testResults }) => {
  const passedCount = (testResults || []).filter(t => t.passed).length;
  const totalCount = (testResults || []).length;
  const failedTests = (testResults || []).filter(t => !t.passed).map(t =>
    `Input: ${t.input} | Expected: ${t.expected} | Got: ${t.actual}`
  ).join("\n");

  return `You are a senior software engineer conducting a technical code review.

Problem: ${title}
Language: ${language}
Test Results: ${passedCount}/${totalCount} passed
${failedTests ? `\nFailed Tests:\n${failedTests}` : ""}

Candidate Code:
\`\`\`${language}
${code}
\`\`\`

Output ONLY valid JSON — no markdown, no code fences, no extra text.

JSON shape:
{
  "verdict": "Pass" | "Partial" | "Fail",
  "score": 0-10,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "isOptimal": true | false,
  "bugs": ["Describe a specific bug or incorrect logic"],
  "improvements": ["Concrete improvement suggestion"],
  "optimizedApproach": "2-4 sentence description of the optimal approach (do NOT write full code)",
  "summary": "1-2 line summary for the candidate"
}

Rules:
- Be specific to this exact code, not generic.
- If code is empty or trivially wrong, score must be 0.
- bugs and improvements arrays: 0-3 items each.
- If the solution is already optimal, say so in optimizedApproach.
`;
};

// ─── Resume Questions Prompt ──────────────────────────────────────────────────

const buildResumeQuestionsPrompt = ({ resumeText, jobRole, level, count = 5 }) => {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 5;
  const resumeSnippet = String(resumeText || "").slice(0, 3000); // cap at 3000 chars to stay within token limits

  return `You are a senior technical interviewer conducting a personalized interview.

You have been given the candidate's resume. Generate exactly ${safeCount} interview questions that are DIRECTLY based on their actual experience, projects, and skills mentioned in the resume.

Candidate Role: ${jobRole}
Candidate Level: ${level}

Resume Content:
---
${resumeSnippet}
---

Rules:
- Each question MUST reference a specific project, company, technology, or skill explicitly mentioned in the resume.
- Start questions with phrases like: "You mentioned...", "I see you worked on...", "Tell me about your experience with...", "Your resume mentions..."
- Questions should probe depth of understanding, not just surface knowledge.
- Mix question types: technical deep-dive, behavioral (challenges faced), architecture decisions, lessons learned.
- If the resume mentions a technology or project, ask the candidate to elaborate on challenges or trade-offs.
- Output ONLY the questions, one per line.
- No numbering, no bullet characters, no extra text.
`;
};

// ─── Replay Commentary Prompt ─────────────────────────────────────────────────

const buildReplayCommentaryPrompt = ({ pairs }) => {
  const pairsText = (pairs || []).map((p, i) =>
    `Q${i+1}: ${p.question}\nAnswer: ${p.answer || "(no answer)"}\nVerdict: ${p.verdict || "Unknown"} | Score: ${p.score ?? "N/A"}/10`
  ).join("\n\n");

  return `You are a senior interview coach reviewing a completed mock interview session.

For EACH Q&A pair below, provide brief, specific coaching commentary.

${pairsText}

Output ONLY valid JSON — no markdown, no code fences, no extra text.

Return an array with exactly ${(pairs || []).length} objects, one per Q&A pair:
[
  {
    "good": "What was done well in this answer (1 specific sentence)",
    "missed": "The most important thing that was missing or wrong (1 specific sentence)",
    "tip": "One actionable tip to make this answer significantly stronger (1 sentence)"
  },
  ...
]

Rules:
- Be SPECIFIC to each individual question and answer. Do not give generic advice.
- If the answer was empty or trivially short, good should acknowledge the attempt, missed should note it was incomplete.
- Keep each field to 1 sentence maximum.
- Match the array length exactly to the number of Q&A pairs provided.
`;
};

module.exports = {
  buildQuestionPrompt,
  buildFeedbackPrompt,
  buildAnswerCheckPrompt,
  buildDSAProblemPrompt,
  buildTestCasePrompt,
  buildCodeReviewPrompt,
  buildResumeQuestionsPrompt,
  buildReplayCommentaryPrompt,
};
