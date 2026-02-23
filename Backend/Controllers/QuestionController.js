const questionService = require("../Services/QuestionService");
const AppError = require("../Utils/AppError");

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

exports.getTopics = catchAsync(async (req, res) => {
    const data = questionService.getAllTopics();
    res.status(200).json(data);
});

exports.getQuestionsByTopic = catchAsync(async (req, res) => {
    const { topic } = req.params;
    const questions = questionService.getQuestionsByTopic(topic);

    if (!questions) {
        throw new AppError("Unknown topic", 404);
    }

    res.status(200).json({
        topic: topic.toLowerCase(),
        questions,
    });
});
