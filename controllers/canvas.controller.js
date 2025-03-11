const Canvas = require("../models/canvas.schema");
const { v4: uuidv4 } = require("uuid");

// Create a new canvas
const createCanvas = async (req, res) => {
  const { name } = req.body;
  const owner = req.user._id;

  try {
    const canvasId = uuidv4();
    const canvas = await Canvas.create({
      canvasId,
      name,
      owner,
      data: { elements: [] },
    });

    res.status(201).json(canvas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all canvases for a user
const getUserCanvases = async (req, res) => {
  const userId = req.user._id;

  try {
    const canvases = await Canvas.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    }).sort({ lastModified: -1 });

    res.status(200).json(canvases);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a specific canvas
const getCanvas = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const canvas = await Canvas.findOne({ canvasId: id });

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    // Check if user has access
    const hasAccess =
      canvas.owner.toString() === userId.toString() ||
      canvas.collaborators.some(
        (collab) => collab.toString() === userId.toString()
      );

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(canvas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a collaborator to canvas
const addCollaborator = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.user._id;

  try {
    // Find the canvas
    const canvas = await Canvas.findOne({ canvasId: id });

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    // Check if user is the owner
    if (canvas.owner.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can add collaborators" });
    }

    // Find the collaborator user by email
    const collaborator = await User.findOne({ email });
    if (!collaborator) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already a collaborator
    if (canvas.collaborators.includes(collaborator._id)) {
      return res.status(400).json({ error: "User is already a collaborator" });
    }

    // Add collaborator
    canvas.collaborators.push(collaborator._id);
    await canvas.save();

    res.status(200).json(canvas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a canvas
const deleteCanvas = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const canvas = await Canvas.findOne({ canvasId: id });

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    // Check if user is the owner
    if (canvas.owner.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete the canvas" });
    }

    await Canvas.deleteOne({ canvasId: id });
    res.status(200).json({ message: "Canvas deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createCanvas,
  getUserCanvases,
  getCanvas,
  addCollaborator,
  deleteCanvas,
};
 