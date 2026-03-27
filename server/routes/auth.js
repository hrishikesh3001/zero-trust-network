const QRCode = require("qrcode");
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
    passwordHash: "$2b$12$GCkJbaxgsAfpHjxPmM0b1e2XSpOQPG7/b02j8CIhtBCndMD9MPpS6",
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

// GET /api/auth/guest-token
// Generates a 15-min vault-only JWT and returns it as a QR code image
router.get("/guest-token", async (req, res) => {
  try {
    const { v4: uuidv4 } = require("uuid");
    const tokenId = uuidv4();

    const token = jwt.sign(
      {
        username: "guest",
        scope: "vault-only",
        type: "temporary",
        jti: tokenId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // The URL the phone will open after scanning
    // In production replace localhost:5173 with your real domain
    const guestURL = `${process.env.CLIENT_URL || "http://localhost:5173"}/guest-vault?token=${token}`;

    // Generate QR code as base64 image
    const qrDataURL = await QRCode.toDataURL(guestURL, {
      width: 200,
      margin: 2,
      color: {
        dark: "#e0e7ff", // light dots to match dark theme
        light: "#0a0e27", // dark background
      },
    });

    res.json({
      success: true,
      qrCode: qrDataURL, // base64 PNG to show in browser
      token, // raw token (for debugging)
      tokenId,
      expiresIn: 900, // 15 minutes in seconds
      guestURL, // the actual URL encoded in QR
    });
  } catch (error) {
    console.error("Guest token error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate guest token" });
  }
});

// GET /api/auth/check-scan/:tokenId
// PC polls this every 3 seconds to check if phone scanned the QR
router.get("/check-scan/:tokenId", (req, res) => {
  const { isTokenScanned } = require("../services/stats");
  const scanned = isTokenScanned(req.params.tokenId);
  res.json({ scanned });
});

module.exports = router;
