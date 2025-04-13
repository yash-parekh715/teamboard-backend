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

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // domain:
      // process.env.NODE_ENV === "development" ? "localhost" : ".vercel.app", // Adjust as needed
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // domain:
      //   process.env.NODE_ENV === "development" ? "localhost" : ".vercel.app", // Adjust as needed
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Google OAuth callback handler
const googleCallback = (req, res) => {
  const token = createToken(req.user._id);
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/auth/google/callback`);
};

const logoutUser = (req, res) => {
  res.cookie("authToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true });
};
// Get current user profile
const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  googleCallback,
  getCurrentUser,
  logoutUser,
};
