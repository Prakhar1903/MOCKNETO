const express = require("express");
const router = express.Router();
const { requireAuth } = require("../Middleware/auth");
const interviewController = require("../Controllers/InterviewController");

/**
 * @swagger
 * tags:
 *   name: Interviews
 *   description: Interview flow and history management
 */

router.use(requireAuth);

/**
 * @swagger
 * /interview/questions:
 *   post:
 *     summary: Generate interview questions
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               track:
 *                 type: string
 *               focusArea:
 *                 type: string
 *               level:
 *                 type: string
 *               count:
 *                 type: number
 *     responses:
 *       200:
 *         description: Questions generated
 *       401:
 *         description: Unauthorized
 */
router.post("/questions", interviewController.getQuestions);

/**
 * @swagger
 * /interview/check-answer:
 *   post:
 *     summary: Verify an interview answer
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               track:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer checked and feedback provided
 *       401:
 *         description: Unauthorized
 */
router.post("/check-answer", interviewController.checkAnswer);

/**
 * @swagger
 * /interview/feedback:
 *   post:
 *     summary: Get overall feedback for session
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Feedback retrieved
 */
router.post("/feedback", interviewController.getFeedback);

/**
 * @swagger
 * /interview/history:
 *   get:
 *     summary: Get user interview history
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: History retrieved
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Save interview session to history
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               jobRole:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session saved
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Clear interview history
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: History cleared
 *       401:
 *         description: Unauthorized
 */
router.get("/history", interviewController.getHistory);
router.get("/history/:id", interviewController.getSessionById);
router.post("/history", interviewController.saveHistory);
router.delete("/history", interviewController.clearHistory);

router.get("/leaderboard", interviewController.getLeaderboard);

/**
 * @swagger
 * /interview/percentile:
 *   get:
 *     summary: Get anonymous peer comparison percentile (rolling 7-day window)
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: score
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: track
 *         schema:
 *           type: string
 *       - in: query
 *         name: focusArea
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Percentile data or "not enough data" response
 */
router.get("/percentile", interviewController.getPercentile);

/**
 * @swagger
 * /interview/replay-commentary:
 *   post:
 *     summary: Get AI coaching commentary for a completed session (batch)
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pairs
 *             properties:
 *               pairs:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Commentary array
 */
router.post("/replay-commentary", interviewController.replayCommentary);

module.exports = router;
