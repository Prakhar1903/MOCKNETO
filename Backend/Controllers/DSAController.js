const dsaService = require("../Services/DSAService");
const AppError = require("../Utils/AppError");

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/**
 * POST /api/dsa/problem
 * Body: { difficulty, topic, jobRole }
 */
exports.generateProblem = catchAsync(async (req, res) => {
  const { difficulty = "Medium", topic = "Arrays", jobRole = "Software Engineer" } = req.body;
  const result = await dsaService.generateProblem({ difficulty, topic, jobRole });
  res.status(200).json(result);
});

/**
 * POST /api/dsa/test-cases
 * Body: { title, description, inputFormat, outputFormat, constraints, count }
 */
exports.generateTestCases = catchAsync(async (req, res) => {
  const { title, description, inputFormat, outputFormat, constraints, count = 5 } = req.body;
  if (!title) throw new AppError("Problem title is required to generate test cases", 400);
  const result = await dsaService.generateTestCases({ title, description, inputFormat, outputFormat, constraints, count });
  res.status(200).json(result);
});

/**
 * POST /api/dsa/review
 * Body: { title, language, code, testResults }
 */
exports.reviewCode = catchAsync(async (req, res) => {
  const { title, language = "javascript", code, testResults = [] } = req.body;
  if (!title) throw new AppError("Problem title is required for code review", 400);
  const result = await dsaService.reviewCode({ title, language, code, testResults });
  res.status(200).json(result);
});
