const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("../services/tokenBlacklist");

const verifyToken = (req, res, next) => {
  // Extract token from Authorization header
  // Header format: "Bearer eyJhbGc..."
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Case 1 — No token at all
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
      code: "NO_TOKEN",
    });
  }

  // Case 2 — Token was logged out (blacklisted)
  if (isBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: "Token has been invalidated. Please login again.",
      code: "TOKEN_BLACKLISTED",
    });
  }

  // Case 3 — Verify the token is valid and not expired
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next(); // Token is valid — continue to protected route
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      code: "TOKEN_INVALID",
    });
  }
};

module.exports = verifyToken;
