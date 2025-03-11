const User = require("../models/user.schema");
const { createToken } = require("../middlewares/auth.middleware");
const passport = require("passport");

// Register new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.signup(name, email, password);
    console.log(user);
    const token = createToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Google OAuth callback handler
const googleCallback = (req, res) => {
  const token = createToken(req.user._id);
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = { registerUser, loginUser, googleCallback, getCurrentUser };
