const express = require("express");
const router = express.Router();
const { requireAuth } = require("../Middleware/auth");
const dsaController = require("../Controllers/DSAController");

/**
 * @swagger
 * tags:
 *   name: DSA
 *   description: DSA Coding Round — problem generation, test cases, and AI code review
 */

router.use(requireAuth);

/**
 * @swagger
 * /dsa/problem:
 *   post:
 *     summary: Generate a DSA problem
 *     tags: [DSA]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Hard]
 *               topic:
 *                 type: string
 *               jobRole:
 *                 type: string
 *     responses:
 *       200:
 *         description: DSA problem generated
 *       401:
 *         description: Unauthorized
 */
router.post("/problem", dsaController.generateProblem);

/**
 * @swagger
 * /dsa/test-cases:
 *   post:
 *     summary: Generate test cases for a DSA problem
 *     tags: [DSA]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               inputFormat:
 *                 type: string
 *               outputFormat:
 *                 type: string
 *               constraints:
 *                 type: array
 *                 items:
 *                   type: string
 *               count:
 *                 type: number
 *     responses:
 *       200:
 *         description: Test cases generated
 *       401:
 *         description: Unauthorized
 */
router.post("/test-cases", dsaController.generateTestCases);

/**
 * @swagger
 * /dsa/review:
 *   post:
 *     summary: AI code review for a DSA submission
 *     tags: [DSA]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - code
 *             properties:
 *               title:
 *                 type: string
 *               language:
 *                 type: string
 *               code:
 *                 type: string
 *               testResults:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Code review result
 *       401:
 *         description: Unauthorized
 */
router.post("/review", dsaController.reviewCode);

module.exports = router;
