const express = require("express");
const ContactMessage = require("../Models/contactMessage");

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form management
 */

const router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact form message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 */
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: "Name, email, and message are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return res.status(400).json({ message: "Please enter a valid email" });
  }

  try {
    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject || "").trim(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thanks! Your message has been sent.",
      id: saved._id,
    });
  } catch (err) {
    console.error("Contact save error:", err);
    return res
      .status(500)
      .json({ message: "Unable to send message right now." });
  }
});

module.exports = router;
