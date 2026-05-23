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
router.post("/history", interviewController.saveHistory);
router.delete("/history", interviewController.clearHistory);

module.exports = router;
