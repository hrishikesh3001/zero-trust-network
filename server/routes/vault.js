const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { verifyAnyToken } = require("../middleware/verifyToken");

// GET /api/vault — full access only (admin)
router.get("/", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Zero Trust Vault",
    user: req.user.username,
    scope: req.user.scope || "full",
    data: {
      clearanceLevel: "ALPHA-7",
      accessTime: new Date().toISOString(),
      systemStatus: "ALL SYSTEMS SECURE",
      networkIntegrity: "100%",
    },
  });
});

// GET /api/vault/guest — guest tokens allowed here
router.get("/guest", verifyAnyToken, (req, res) => {
  // Mark token as scanned so PC knows to redirect to dashboard
  if (req.user.scope === "vault-only" && req.user.jti) {
    const { markTokenScanned } = require("../services/stats");
    markTokenScanned(req.user.jti);
  }

  res.json({
    success: true,
    message: "Access granted",
    user: "guest",
    scope: "vault-only",
  });
});

module.exports = router;
