const rateLimit = require("express-rate-limit");

const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Only count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // This runs when limit is exceeded
    res.status(429).json({
      success: false,
      message: "Too many failed attempts. Access denied for 10 minutes.",
      lockout: true,
    });
  },
});

module.exports = { loginRateLimiter };
