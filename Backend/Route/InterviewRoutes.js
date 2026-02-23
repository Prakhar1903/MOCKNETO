const express = require("express");
const router = express.Router();
const { requireAuth } = require("../Middleware/auth");
const interviewController = require("../Controllers/InterviewController");

router.use(requireAuth);

router.post("/questions", interviewController.getQuestions);
router.post("/check-answer", interviewController.checkAnswer);
router.post("/feedback", interviewController.getFeedback);
router.get("/history", interviewController.getHistory);
router.post("/history", interviewController.saveHistory);
router.delete("/history", interviewController.clearHistory);

module.exports = router;
