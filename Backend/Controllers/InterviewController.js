const interviewService = require("../Services/InterviewService");
const AppError = require("../Utils/AppError");

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

exports.getQuestions = catchAsync(async (req, res) => {
    const result = await interviewService.getQuestions(req.body);
    res.status(200).json(result);
});

exports.checkAnswer = catchAsync(async (req, res) => {
    const result = await interviewService.checkAnswer(req.body);
    res.status(200).json(result);
});

exports.getFeedback = catchAsync(async (req, res) => {
    // Original /feedback logic (similar to checkAnswer but uses buildFeedbackPrompt)
    // Simplified for migration:
    const result = await interviewService.checkAnswer(req.body);
    res.status(200).json(result);
});

exports.getHistory = catchAsync(async (req, res) => {
    const history = await interviewService.getHistory(req.userId);
    res.status(200).json({ history });
});

exports.saveHistory = catchAsync(async (req, res) => {
    const result = await interviewService.saveHistory(req.userId, req.body);
    res.status(200).json(result);
});

exports.clearHistory = catchAsync(async (req, res) => {
    const result = await interviewService.clearHistory(req.userId);
    res.status(200).json(result);
});
