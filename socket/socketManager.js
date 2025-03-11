// socket/socketManager.js
const socketIo = require("socket.io");
const { socketAuth } = require("../middlewares/auth.middleware");
const Canvas = require("../models/canvas.schema");

const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      // origin: process.env.CLIENT_URL,
      origin: "*", // Allow all origins
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Apply socket authentication middleware
  io.use(socketAuth);

  // Canvas namespace
  const canvasNamespace = io.of("/canvas");

  canvasNamespace.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // Join a canvas room
    socket.on("join-canvas", async ({ canvasId }) => {
      try {
        // Validate canvas and permissions
        const canvas = await Canvas.findOne({ canvasId });

        if (!canvas) {
          socket.emit("error", { message: "Canvas not found" });
          return;
        }

        // Check authorization
        const userId = socket.user._id.toString();
        const hasAccess =
          canvas.owner.toString() === userId ||
          canvas.collaborators.some((collab) => collab.toString() === userId);

        if (!hasAccess) {
          socket.emit("error", {
            message: "You don't have access to this canvas",
          });
          return;
        }

        // Join the canvas room
        socket.join(canvasId);

        // Send initial canvas data to the user
        socket.emit("canvas-data", canvas.data);

        // Inform others about new user
        socket.to(canvasId).emit("user-joined", {
          userId: socket.user._id,
          name: socket.user.name,
        });

        console.log(`${socket.user.name} joined canvas: ${canvasId}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join canvas" });
      }
    });

    // Handle drawing events
    socket.on("draw-element", ({ canvasId, element }) => {
      // Broadcast to all other users in the room
      socket.to(canvasId).emit("draw-element", {
        userId: socket.user._id,
        element,
      });
    });

    // Handle element updates
    socket.on("update-element", ({ canvasId, elementId, updates }) => {
      socket.to(canvasId).emit("update-element", {
        userId: socket.user._id,
        elementId,
        updates,
      });
    });

    // Handle element deletion
    socket.on("delete-element", ({ canvasId, elementId }) => {
      socket.to(canvasId).emit("delete-element", {
        userId: socket.user._id,
        elementId,
      });
    });

    // Save canvas data
    socket.on("save-canvas", async ({ canvasId, data }) => {
      try {
        await Canvas.findOneAndUpdate(
          { canvasId },
          {
            data,
            lastModified: new Date(),
          }
        );
        socket.emit("canvas-saved", { success: true });
      } catch (error) {
        socket.emit("error", { message: "Failed to save canvas" });
      }
    });

    // Clear canvas
    socket.on("clear-canvas", ({ canvasId }) => {
      socket.to(canvasId).emit("clear-canvas", {
        userId: socket.user._id,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = setupSocketServer;
