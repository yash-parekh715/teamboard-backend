//middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");

// Generate JWT token
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const requireAuth = async (req, res, next) => {
  try {
    // First try to get token from cookies
    let token = req.cookies?.authToken;

    // If no cookie, fall back to Authorization header (for backward compatibility)
    if (!token) {
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ error: "Authentication required" });
      }
      token = authorization.split(" ")[1];
    }

    // Verify token and attach user to request
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id).select("_id name email");
    next();
  } catch (error) {
    console.log("Auth middleware error:", error);
    res.status(401).json({ error: "Request is not authorized" });
  }
};
// Socket.io auth middleware
const socketAuth = async (socket, next) => {
  try {
    // Extract token from cookie instead of auth.token
    const cookies = socket.request.headers.cookie;
    if (!cookies) {
      return next(new Error("Authentication required"));
    }

    // Parse cookies to get the auth token
    const tokenCookie = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("authToken="));

    if (!tokenCookie) {
      return next(new Error("Authentication token not found"));
    }

    const token = tokenCookie.split("=")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("_id name email");

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Invalid authentication"));
  }
};

module.exports = { createToken, requireAuth, socketAuth };
