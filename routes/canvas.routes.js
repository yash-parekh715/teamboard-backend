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
// router.use(requireAuth);

// Canvas routes
router.post("/", requireAuth, createCanvas);
router.get("/", requireAuth, getUserCanvases);
router.get("/:id", requireAuth, getCanvas);
router.post("/:id/collaborators", requireAuth, addCollaborator);
router.delete("/:id", requireAuth, deleteCanvas);

module.exports = router;
