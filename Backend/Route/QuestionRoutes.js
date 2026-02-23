const express = require("express");
const router = express.Router();
const { requireAuth } = require("../Middleware/auth");
const questionController = require("../Controllers/QuestionController");
const questionService = require("../Services/QuestionService");

router.use(requireAuth);

router.get("/topics", questionController.getTopics);
router.get("/:topic", questionController.getQuestionsByTopic);

module.exports = router;
// Allow other routes (e.g., interview simulation) to reuse the same curated bank.
module.exports.QUESTIONS = questionService.QUESTIONS;
