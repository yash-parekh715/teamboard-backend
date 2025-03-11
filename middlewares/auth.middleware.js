const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");

// Generate JWT token
const createToken =  (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Auth middleware for routes
const requireAuth = async (req, res, next) => {
  // Verify authentication
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id).select("_id name email");
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Request is not authorized" });
  }
};

// Socket.io auth middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("_id name email");

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Invalid authentication"));
  }
};

module.exports = { createToken, requireAuth, socketAuth };
