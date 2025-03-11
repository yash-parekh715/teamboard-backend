const express = require("express");
const {
  createCanvas,
  getUserCanvases,
  getCanvas,
  addCollaborator,
  deleteCanvas,
} = require("../controllers/canvas.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// Apply auth middleware to all canvas routes
router.use(requireAuth);

// Canvas routes
router.post("/", createCanvas);
router.get("/", getUserCanvases);
router.get("/:id", getCanvas);
router.post("/:id/collaborators", addCollaborator);
router.delete("/:id", deleteCanvas);

module.exports = router;
