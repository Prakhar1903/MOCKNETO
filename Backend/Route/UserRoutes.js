const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");
const { requireAuth } = require("../Middleware/auth");

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

router.post("/signup", validateSignup, userController.createUser);
router.post("/signin", validateLogin, userController.loginUser);
router.post("/google", userController.googleLogin);

// Profile
router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);

module.exports = router;
