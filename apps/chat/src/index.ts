import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { Client } from "pg";
import { authenticateSocket } from "./auth.js";
import { handleMessage } from "./handlers/message.js";

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const PORT = process.env.CHAT_PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  process.exit(1);
}

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.NEXTAUTH_URL
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Allow local network IPs
            /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Allow 10.x.x.x network
          ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Create PostgreSQL client for LISTEN/NOTIFY
// Handle SSL for DigitalOcean managed database by modifying connection string
const connectionString = process.env.NODE_ENV === 'production' 
  ? DATABASE_URL!.replace('sslmode=require', 'sslmode=no-verify')
  : DATABASE_URL!;

const pgClient = new Client({
  connectionString,
});

async function startChatServer() {
  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log("[Chat] Connected to PostgreSQL");

    // Set up LISTEN for new messages
    await pgClient.query("LISTEN new_message");
    console.log("[Chat] Listening for new_message notifications");

    // Handle PostgreSQL notifications
    pgClient.on("notification", (msg) => {
      try {
        if (msg.channel === "new_message" && msg.payload) {
          const messageData = JSON.parse(msg.payload);
          // Broadcast to specific conversation room
          io.to(`conversation:${messageData.conversationId}`).emit(
            "message",
            messageData
          );
          console.log(
            `[Chat] Broadcasted message to conversation:${messageData.conversationId}`
          );
        }
      } catch (error) {
        console.error("[Chat] Error handling notification:", error);
      }
    });

    // Socket.io connection handling
    io.on("connection", async (socket) => {
      console.log(`[Chat] Client connected: ${socket.id}`);

      try {
        // Authenticate the socket connection
        const user = await authenticateSocket(socket);
        if (!user) {
          socket.disconnect();
          return;
        }

        console.log(`[Chat] User authenticated: ${user.id}`);

        // Handle joining conversation rooms
        socket.on("join-conversation", (conversationId: string) => {
          socket.join(`conversation:${conversationId}`);
          console.log(
            `[Chat] User ${user.id} joined conversation:${conversationId}`
          );
        });

        // Handle leaving conversation rooms
        socket.on("leave-conversation", (conversationId: string) => {
          socket.leave(`conversation:${conversationId}`);
          console.log(
            `[Chat] User ${user.id} left conversation:${conversationId}`
          );
        });

        // Handle new messages
        socket.on("send-message", async (data) => {
          await handleMessage(socket, user, data);
        });

        socket.on("disconnect", () => {
          console.log(`[Chat] Client disconnected: ${socket.id}`);
        });
      } catch (error) {
        console.error("[Chat] Error in socket connection:", error);
        socket.disconnect();
      }
    });

    // Start the server on 0.0.0.0 to allow network access
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[Chat] Server running on 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("[Chat] Failed to start chat server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("[Chat] Shutting down gracefully...");
  await pgClient.end();
  httpServer.close(() => {
    console.log("[Chat] Server closed");
    process.exit(0);
  });
});

// Start the server
startChatServer();
