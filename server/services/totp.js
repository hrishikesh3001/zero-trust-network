const speakeasy = require("speakeasy");

// Generate a new TOTP secret for a user
const generateTOTPSecret = (username) => {
  const secret = speakeasy.generateSecret({
    name: "ZeroTrust:{username}",
    issuer: "ZeroTrustNetwork",
  });
  return secret;
};

// Verify the 6-degit code the user typed
const verifyTOTP = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, //Allow 30 seconds of clock drift
  });
};

module.exports = {
  generateTOTPSecret,
  verifyTOTP,
};
