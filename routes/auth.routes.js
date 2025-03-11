const express = require("express");
const {
  registerUser,
  loginUser,
  googleCallback,
  getCurrentUser,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const passport = require("passport");

const router = express.Router();

// Register route
router.post("/signup", registerUser);

// Login route
router.post("/login", loginUser);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback
);

// Get current user
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
