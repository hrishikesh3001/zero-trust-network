const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("../services/tokenBlacklist");

// scope: 'full' = admin, 'vault-only' = guest
const verifyToken = (req, res, next, requiredScope = "full") => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
      code: "NO_TOKEN",
    });
  }

  if (isBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: "Token has been invalidated. Please login again.",
      code: "TOKEN_BLACKLISTED",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If this route requires full scope, reject guest tokens
    if (requiredScope === "full" && decoded.scope === "vault-only") {
      return res.status(403).json({
        success: false,
        message: "Guest tokens cannot access this resource.",
        code: "INSUFFICIENT_SCOPE",
      });
    }

    req.user = decoded;
    next();
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

// Full access middleware — blocks guest tokens
const verifyFullToken = (req, res, next) => verifyToken(req, res, next, "full");

// Guest-ok middleware — accepts both full and guest tokens
const verifyAnyToken = (req, res, next) => verifyToken(req, res, next, "any");

module.exports = verifyFullToken;
module.exports.verifyAnyToken = verifyAnyToken;
