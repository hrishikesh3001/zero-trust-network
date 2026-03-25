const { body, validationResult } = require("express-validator");

// Rules for sanitizing the Login Input
const sanitizeLoginInput = [
  body("username")
    .trim() // Remove whitespaces
    .escape() // Convert < > & to safe HTML entities
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 50 })
    .withMessage("Username too long"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 100 })
    .withMessage("Password too long"),
];

// Middleware that checks if sanitization found any errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid credentials", // Never reveal which field failed
    });
  }
  next();
};

module.exports = { sanitizeLoginInput, checkValidation };
