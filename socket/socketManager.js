const socketIo = require("socket.io");
const { socketAuth } = require("../middlewares/auth.middleware");
const Canvas = require("../models/canvas.schema");

const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store active users for each canvas
  const canvasActiveUsers = new Map();

  // Apply socket authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Keep track of which canvas this socket has joined
    let currentCanvasId = null;

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

        // Store the current canvas ID
        currentCanvasId = canvasId;

        // Join the canvas room
        socket.join(canvasId);

        // Send initial canvas data to the user
        socket.emit("canvas-data", canvas.data);

        // Add user to active users list
        if (!canvasActiveUsers.has(canvasId)) {
          canvasActiveUsers.set(canvasId, new Map());
        }

        const activeUsers = canvasActiveUsers.get(canvasId);
        activeUsers.set(userId, {
          userId: userId,
          name: socket.user.name,
        });

        // Send active users list to the newly joined user
        const usersArray = Array.from(activeUsers.values());
        socket.emit("active-users", usersArray);

        // Inform all users in the room about the updated list
        io.to(canvasId).emit("user-joined", {
          userId: userId,
          name: socket.user.name,
        });

        console.log(`${socket.user.name} joined canvas: ${canvasId}`);
      } catch (error) {
        console.error("Error joining canvas:", error);
        socket.emit("error", { message: "Failed to join canvas" });
      }
    });

    // Handle request for active users
    socket.on("get-active-users", ({ canvasId }) => {
      if (canvasActiveUsers.has(canvasId)) {
        const usersArray = Array.from(canvasActiveUsers.get(canvasId).values());
        socket.emit("active-users", usersArray);
      } else {
        socket.emit("active-users", []);
      }
    });

    // Handle drawing events
    socket.on("draw-element", ({ canvasId, element }) => {
      // Broadcast to all other users in the room
      socket.to(canvasId).emit("draw-element", element);
    });

    // Handle element updates
    socket.on("update-element", ({ canvasId, elementId, updates }) => {
      socket.to(canvasId).emit("update-element", {
        elementId,
        updates,
      });
    });

    // Handle element deletion
    socket.on("delete-element", ({ canvasId, elementId }) => {
      socket.to(canvasId).emit("delete-element", {
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
    socket.on("clear-canvas", async ({ canvasId }) => {
      socket.to(canvasId).emit("clear-canvas");
      try {
        await Canvas.findOneAndUpdate(
          { canvasId },
          { data: { elements: [] }, lastModified: new Date() }
        );
        socket.emit("canvas-saved", { success: true });
      } catch (error) {
        socket.emit("error", { message: "Failed to clear canvas" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);

      // Remove user from active users if they were in a canvas
      if (currentCanvasId && canvasActiveUsers.has(currentCanvasId)) {
        const userId = socket.user._id.toString();
        const activeUsers = canvasActiveUsers.get(currentCanvasId);

        if (activeUsers.has(userId)) {
          activeUsers.delete(userId);

          // Notify other users about the disconnection
          socket.to(currentCanvasId).emit("user-left", userId);

          console.log(
            `Removed ${socket.user.name} from canvas: ${currentCanvasId}`
          );
        }
      }
    });
  });

  return io;
};

module.exports = setupSocketServer;
