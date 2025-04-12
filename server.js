//server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth.routes");
const canvasRoutes = require("./routes/canvas.routes");
const setupSocketServer = require("./socket/socketManager");
const cookieParser = require("cookie-parser");

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    // origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/canvas", canvasRoutes);

// Setup Socket.IO
const io = setupSocketServer(server);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} and connected to the db`);
    })
  )
  .catch((error) => console.log("MongoDB connection error:", error));
