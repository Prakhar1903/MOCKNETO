const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");
const { requireAuth } = require("../Middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

const validateSignup = (req, res, next) => {
  const { UserName, Email, Password } = req.body;
  if (!UserName || !Email || !Password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { Email, Password } = req.body;
  if (!Email || !Password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
};

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UserName
 *               - Email
 *               - Password
 *             properties:
 *               UserName:
 *                 type: string
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: All fields are required
 *       409:
 *         description: Email already registered
 */
router.post("/signup", validateSignup, userController.createUser);

/**
 * @swagger
 * /users/signin:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *             properties:
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post("/signin", validateLogin, userController.loginUser);

/**
 * @swagger
 * /users/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google login successful
 *       401:
 *         description: Invalid Google token
 */
router.post("/google", userController.googleLogin);

// Profile
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               UserName:
 *                 type: string
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *               profileImage:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);

module.exports = router;
