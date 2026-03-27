const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { loginRateLimiter } = require("../middleware/rateLimiter");
const {
  sanitizeLoginInput,
  checkValidation,
} = require("../middleware/sanitize");
const { verifyTOTP } = require("../services/totp");
const { recordLoginAttempt, recordLogout } = require("../services/stats");
const { addToBlacklist } = require("../services/tokenBlacklist");

// Hardcoded user for now
// Password is bcrypt hash of "ZeroTrust@2024"
const USERS = {
  admin: {
    username: "admin",
    passwordHash:
      "$2b$12$VYiJ/Tqt8FOyAV.5uJh84unTk6C235jqHki7auBwWJGdISPkZG8oy",
    totpSecret: process.env.TOTP_SECRET,
  },
};

// POST /api/auth/login
router.post(
  "/login",
  loginRateLimiter,
  sanitizeLoginInput,
  checkValidation,
  async (req, res) => {
    const { username, password, totpToken, recaptchaToken } = req.body;

    try {
      // Step 1 — Check if user exists
      const user = USERS[username];
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials", // Never say "user not found"
        });
      }

      // Step 2 — Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        recordLoginAttempt(false, username, req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials", // Never say "wrong password"
        });
      }

      // Step 3 — Verify reCAPTCHA (skip in development)
      if (process.env.NODE_ENV === "production" && recaptchaToken) {
        const recaptchaResponse = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify`,
          null,
          {
            params: {
              secret: process.env.RECAPTCHA_SECRET_KEY,
              response: recaptchaToken,
            },
          },
        );
        if (
          !recaptchaResponse.data.success ||
          recaptchaResponse.data.score < 0.5
        ) {
          return res.status(401).json({
            success: false,
            message: "reCAPTCHA verification failed",
          });
        }
      }

      // Step 4 — Verify TOTP code
      if (!totpToken) {
        // Password correct but no TOTP yet — tell frontend to show TOTP field
        return res.status(200).json({
          success: false,
          requireTOTP: true,
          message: "Please enter your authenticator code",
        });
      }

      const totpValid = verifyTOTP(totpToken, user.totpSecret);
      if (!totpValid) {
        recordLoginAttempt(false, username, req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid authenticator code",
        });
      }

      // Step 5 — All checks passed — issue JWT
      const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      // Log successful access
      console.log(
        `[${new Date().toISOString()}] SUCCESS login: ${username} from ${req.ip}`,
      );
      recordLoginAttempt(true, username, req.ip);

      res.json({
        success: true,
        token,
        message: "Access granted",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    addToBlacklist(token);
    console.log(`[${new Date().toISOString()}] LOGOUT: token blacklisted`);
  }

  const decoded = token ? require("jsonwebtoken").decode(token) : null;
  recordLoginAttempt(decoded?.username || "unknown");

  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
