import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let screenSharing = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-call", (path) => {
      if (!connections[path]) connections[path] = [];
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify existing users
      connections[path].forEach((id) => {
        if (id !== socket.id) {
          io.to(id).emit("user-joined", socket.id, connections[path]);
        }
      });

      // Send chat history
      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }

      // Screen sharing state
      if (screenSharing[path]) {
        io.to(socket.id).emit("screen-share-started", screenSharing[path]);
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const roomKey = Object.keys(connections).find((key) =>
        connections[key].includes(socket.id)
      );

      if (roomKey) {
        if (!messages[roomKey]) messages[roomKey] = [];

        messages[roomKey].push({ sender, data, "socket-id-sender": socket.id });

        connections[roomKey].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // ✅ Screen Sharing Events
    socket.on("start-screen-share", () => {
      const roomKey = getRoomBySocket(socket.id);
      if (roomKey) {
        screenSharing[roomKey] = socket.id;
        connections[roomKey].forEach((id) => {
          if (id !== socket.id) io.to(id).emit("screen-share-started", socket.id);
        });
      }
    });

    socket.on("stop-screen-share", () => {
      const roomKey = getRoomBySocket(socket.id);
      if (roomKey && screenSharing[roomKey] === socket.id) {
        delete screenSharing[roomKey];
        connections[roomKey].forEach((id) => {
          if (id !== socket.id) io.to(id).emit("screen-share-stopped", socket.id);
        });
      }
    });

    // ✅ Media Toggle Events (camera/mic/video)
    socket.on("media-toggle", ({ type, status }) => {
      const roomKey = getRoomBySocket(socket.id);
      if (roomKey) {
        connections[roomKey].forEach((id) => {
          if (id !== socket.id) {
            io.to(id).emit("media-toggle", {
              socketId: socket.id,
              type, // 'video' or 'audio'
              status, // true (on) or false (off)
            });
          }
        });
      }
    });

    // ✅ Disconnect logic
    socket.on("disconnect", () => {
      const connectedTime = timeOnline[socket.id];
      const diffTime = Math.abs((connectedTime?.getTime?.() || 0) - new Date().getTime());

      delete timeOnline[socket.id];

      for (const [key, value] of Object.entries(connections)) {
        const index = value.indexOf(socket.id);
        if (index !== -1) {
          value.splice(index, 1);

          // Notify others
          value.forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          // Stop screen share if needed
          if (screenSharing[key] === socket.id) {
            delete screenSharing[key];
            value.forEach((id) => {
              io.to(id).emit("screen-share-stopped", socket.id);
            });
          }

          // Clean up if room is empty
          if (value.length === 0) {
            delete connections[key];
            delete messages[key];
            delete screenSharing[key];
          }

          break;
        }
      }

      console.log("Socket disconnected:", socket.id, "Online time (ms):", diffTime);
    });
  });

  const getRoomBySocket = (socketId) => {
    return Object.keys(connections).find((key) =>
      connections[key].includes(socketId)
    );
  };

  return io;
};
