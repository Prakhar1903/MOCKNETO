require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./Route/UserRoutes");
const interviewRoutes = require("./Route/InterviewRoutes");
const questionRoutes = require("./Route/QuestionRoutes");
const contactRoutes = require("./Route/ContactRoutes");
const errorMiddleware = require("./Middleware/errorMiddleware");
const AppError = require("./Utils/AppError");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const connectDB = require("./Connection/connection");

const app = express();

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mockneto API Documentation",
      version: "1.0.0",
      description: "API documentation for the Mockneto backend service.",
    },
    servers: [
      {
        url: "/api",
        description: "Current environment",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
  },
  apis: ["./Route/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000, // relaxed for local testing
  message: "Too many login attempts, please try again after 15 minutes",
});

app.use("/api", globalLimiter);
app.use("/api/users/signup", authLimiter);
app.use("/api/users/signin", authLimiter);

app.use(cookieParser());

// Allow OAuth popup flows (Google) to communicate via postMessage.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Middleware
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (isLocalDevOrigin(origin)) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form data

// Database connection
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/contact", contactRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Catch-all for undefined API routes (ensures we don't hit SPA fallback for missing API calls)
app.all(/^\/api\/(.*)$/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "ai-based-project", "dist");
  const indexHtmlPath = path.join(distPath, "index.html");

  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    // SPA fallback for non-API routes
    app.get(/^(?!\/api\/)(.*)$/, (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  }
}

// Global catch-all for anything else (non-API, non-SPA)
app.all(/^(.*)$/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling
app.use(errorMiddleware);

// Export for serverless platforms (e.g., Vercel Functions)
module.exports = app;

// Start server only when run directly (keeps local dev behavior)
if (require.main === module) {
  const PORT = process.env.PORT || 5600;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
