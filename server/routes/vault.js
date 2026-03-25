const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

// GET /api/vault — protected route
router.get("/", verifyToken, (req, res) => {
  // If we reach here, the JWT was valid
  // req.user contains the decoded token payload
  res.json({
    success: true,
    message: "Welcome to the Zero Trust Vault",
    user: req.user.username,
    data: {
      clearanceLevel: "ALPHA-7",
      accessTime: new Date().toISOString(),
      projects: [
        {
          id: 1,
          name: "Zero Trust Network",
          status: "ACTIVE",
          description: "Identity-aware security simulation",
        },
        {
          id: 2,
          name: "Samurai Auth System",
          status: "CLASSIFIED",
          description: "Multi-factor authentication with animated guardian",
        },
      ],
      systemStatus: "ALL SYSTEMS SECURE",
      networkIntegrity: "100%",
    },
  });
});

module.exports = router;
