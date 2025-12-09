const express = require("express");
const passport = require("../../config/passport");
const {
  googleAuthSuccess,
  googleAuthFailure,
  verifyGoogleRecaptcha,
} = require("../../controllers/auth/google-auth-controller");

const router = express.Router();

// Initiate Google OAuth
router.get(
  "/google",
  (req, res, next) => {
    // Get the 'from' parameter (login or register)
    const from = req.query.from || "register";
    
    // Pass it through OAuth flow using state parameter
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: from, // This will be returned in callback
      prompt: "select_account", // Force account selection screen
    })(req, res, next);
  }
);

// Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    // Extract state (which contains 'from' parameter)
    const from = req.query.state || "register";
    req.fromPage = from; // Attach to request for use in controller
    
    passport.authenticate("google", {
      failureRedirect: "/api/auth/google/failure",
      session: false, // We're using JWT, not sessions
    })(req, res, next);
  },
  googleAuthSuccess
);

// Google OAuth failure route
router.get("/google/failure", googleAuthFailure);

// Verify reCAPTCHA and complete Google OAuth
router.post("/google/verify-recaptcha", verifyGoogleRecaptcha);

module.exports = router;

