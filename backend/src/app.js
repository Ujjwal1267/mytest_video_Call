import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";

dotenv.config();

// Verify environment variables
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not defined in the environment variables.");
  process.exit(1); // Exit if MONGO_URI is not found
}

// Create the app and server instances
const app = express();
const server = createServer(app);

// Establish the socket connection
const io = connectToSocket(server);

// Middleware setup
app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// User routes
app.use("/api/v1/users", userRoutes);

// Start the server
const start = async () => {
  try {
    // Using environment variable for MongoDB connection
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

    // Start listening on the port
    server.listen(app.get("port"), () => {
      console.log(`LISTENING ON PORT ${app.get("port")}`);
    });

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if there's an error connecting to DB
  }
};

// Graceful Shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB disconnected");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
};

// Catch termination signals for graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Initialize server
start();
