const express = require("express");
const router = express.Router();
const { requireAuth } = require("../Middleware/auth");
const questionController = require("../Controllers/QuestionController");
const questionService = require("../Services/QuestionService");

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question bank exploration
 */

router.use(requireAuth);

/**
 * @swagger
 * /questions/topics:
 *   get:
 *     summary: Get all available question topics
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Topics retrieved
 */
router.get("/topics", questionController.getTopics);

/**
 * @swagger
 * /questions/{topic}:
 *   get:
 *     summary: Get questions for a specific topic
 *     tags: [Questions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Questions retrieved
 */
router.get("/:topic", questionController.getQuestionsByTopic);

module.exports = router;
// Allow other routes (e.g., interview simulation) to reuse the same curated bank.
module.exports.QUESTIONS = questionService.QUESTIONS;
