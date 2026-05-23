const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "myverysecretkey123";

const requireAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const header = req.headers.authorization || "";
      const [scheme, headerToken] = header.split(" ");
      if (scheme === "Bearer") {
        token = headerToken;
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { requireAuth };
