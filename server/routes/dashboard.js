const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { getStats } = require("../services/stats");

router.get("/", verifyToken, (req, res) => {
  const stats = getStats();

  res.json({
    success: true,
    stats: {
      ...stats,
      services: {
        server: { status: "ONLINE", latency: "< 1ms" },
        nginx: { status: "ONLINE", latency: "< 5ms" },
        docker: { status: "ONLINE", latency: "N/A" },
      },
    },
  });
});

module.exports = router;
