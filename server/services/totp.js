const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

// Generate a new TOTP secret for a user
const generateTOTPSecret = (username) => {
  const secret = speakeasy.generateSecret({
    name: "ZeroTrust:{username}",
    issuer: "ZeroTrustNetwork",
  });
  return secret;
};

// Generate QR Code as a data URL (shpwn to user to scan)
const genersteQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
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
  genersteQRCode,
  verifyTOTP,
};
