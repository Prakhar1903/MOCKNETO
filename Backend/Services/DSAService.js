const { callGeminiText } = require("../ai/gemini");
const {
  buildDSAProblemPrompt,
  buildTestCasePrompt,
  buildCodeReviewPrompt,
} = require("../ai/prompts");

// Helper: safe JSON parse from Gemini output
const safeParseJSON = (text) => {
  let cleaned = String(text || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return JSON.parse(cleaned);
};

// ─── Generate DSA Problem ─────────────────────────────────────────────────────
exports.generateProblem = async ({ difficulty, topic, jobRole }) => {
  const prompt = buildDSAProblemPrompt({ difficulty, topic, jobRole });
  try {
    const ai = await callGeminiText({ prompt, temperature: 0.7, maxOutputTokens: 1200 });
    if (ai.ok && ai.text) {
      const parsed = safeParseJSON(ai.text);
      return { ok: true, problem: parsed };
    }
  } catch (err) {
    console.error("DSA generateProblem error:", err.message);
  }
  // Fallback problem
  return {
    ok: true,
    problem: {
      title: "Two Sum",
      difficulty: difficulty || "Medium",
      topic: topic || "Arrays",
      description:
        "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
      inputFormat: "An integer array nums and an integer target.",
      outputFormat: "An array of two integers [i, j] such that nums[i] + nums[j] == target.",
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6" },
      ],
      hints: [
        "Try using a hash map to store elements you've already seen.",
        "For each element, check if (target - element) exists in the map.",
        "You only need one pass through the array.",
      ],
      tags: ["hash-map", "arrays"],
    },
  };
};

// ─── Generate Test Cases ──────────────────────────────────────────────────────
exports.generateTestCases = async ({ title, description, inputFormat, outputFormat, constraints, count = 5 }) => {
  const prompt = buildTestCasePrompt({ title, description, inputFormat, outputFormat, constraints, count });
  try {
    const ai = await callGeminiText({ prompt, temperature: 0.3, maxOutputTokens: 800 });
    if (ai.ok && ai.text) {
      const parsed = safeParseJSON(ai.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { ok: true, testCases: parsed };
      }
    }
  } catch (err) {
    console.error("DSA generateTestCases error:", err.message);
  }
  // Fallback generic test cases
  return {
    ok: true,
    testCases: [
      { input: "[2,7,11,15], target=9", expected: "[0,1]", label: "Basic case" },
      { input: "[3,2,4], target=6", expected: "[1,2]", label: "Mid-array match" },
      { input: "[3,3], target=6", expected: "[0,1]", label: "Duplicate values" },
      { input: "[-1,-2,-3,-4,-5], target=-8", expected: "[2,4]", label: "Negative numbers" },
      { input: "[0,4,3,0], target=0", expected: "[0,3]", label: "Zero elements" },
    ],
  };
};

// ─── Code Review ──────────────────────────────────────────────────────────────
exports.reviewCode = async ({ title, language, code, testResults }) => {
  if (!code || !code.trim()) {
    return {
      ok: true,
      review: {
        verdict: "Fail",
        score: 0,
        timeComplexity: "N/A",
        spaceComplexity: "N/A",
        isOptimal: false,
        bugs: ["No code was submitted for review."],
        improvements: ["Write your solution before requesting a review."],
        optimizedApproach: "Please implement a solution first.",
        summary: "No code submitted.",
      },
    };
  }

  const prompt = buildCodeReviewPrompt({ title, language, code, testResults });
  try {
    const ai = await callGeminiText({ prompt, temperature: 0.3, maxOutputTokens: 900 });
    if (ai.ok && ai.text) {
      const parsed = safeParseJSON(ai.text);
      return { ok: true, review: parsed };
    }
  } catch (err) {
    console.error("DSA reviewCode error:", err.message);
  }
  // Fallback review
  const passed = (testResults || []).filter((t) => t.passed).length;
  const total = (testResults || []).length;
  const score = total > 0 ? Math.round((passed / total) * 7) : 4;
  return {
    ok: true,
    review: {
      verdict: passed === total ? "Pass" : passed > 0 ? "Partial" : "Fail",
      score,
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      isOptimal: false,
      bugs: ["Could not perform automated analysis. Please review your code manually."],
      improvements: ["Ensure your code handles edge cases (empty arrays, single elements, negatives)."],
      optimizedApproach: "Review the constraints and think about whether a hash map, two-pointer, or sliding window approach applies.",
      summary: `${passed}/${total} tests passed. Manual review recommended.`,
    },
  };
};
