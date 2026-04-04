import { Server as SocketServer } from "socket.io";
import { type Server as HttpServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

let io: SocketServer | null = null;

export async function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Setup Redis Adapter if REDIS_URL is available
  if (process.env.REDIS_URL) {
    try {
      console.log("Real-time: Initializing Redis adapter...");
      
      // Upstash and some other providers often require TLS
      // We check for rediss:// or if the host looks like Upstash
      const isTLS = process.env.REDIS_URL.startsWith("rediss://") || process.env.REDIS_URL.includes("upstash.io");
      
      const clientOptions = {
        url: process.env.REDIS_URL,
        socket: isTLS ? { 
          tls: true,
          // Upstash certificates are usually globally trusted, but rejectUnauthorized: false 
          // can help in dev environments if there are intermediate cert issues
          rejectUnauthorized: false 
        } : undefined
      };

      const pubClient = createClient(clientOptions);
      const subClient = pubClient.duplicate();

      // IMPORTANT: Always add error listeners to prevent unhandled 'error' event crashes
      pubClient.on("error", (err) => console.error("Real-time: Redis Pub Client Error:", err.message));
      subClient.on("error", (err) => console.error("Real-time: Redis Sub Client Error:", err.message));

      await Promise.all([pubClient.connect(), subClient.connect()]);
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Real-time: Redis adapter connected successfully.");
    } catch (err) {
      console.error("Real-time: Failed to connect Redis adapter, falling back to in-memory.", err);
    }
  } else {
    console.log("Real-time: REDIS_URL not found, using in-memory adapter.");
  }

  io.on("connection", (socket) => {
    console.log("Real-time: User connected:", socket.id);

    // Join the general students room by default (as per user request)
    socket.join("students");

    // Can join user-specific room if ID is provided later
    socket.on("join-user", (userId: string | number) => {
      console.log(`Real-time: User ${userId} joining specific room`);
      socket.join(`user:${userId}`);
    });

    // Join course-specific room (e.g. course_BSIT)
    socket.on("join-course", (courseCode: string) => {
      if (!courseCode) return;
      const room = `course_${courseCode}`;
      console.log(`Real-time: User joining course room: ${room}`);
      socket.join(room);
    });

    socket.on("disconnect", () => {
      console.log("Real-time: User disconnected");
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}

/**
 * Sends a real-time message to a specific user.
 */
export function sendRealTimeMessage(userId: number | string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit("announcement", data);
}

/**
 * Broadcasts a message to all connected students.
 */
export function broadcastToStudents(data: any) {
  if (!io) return;
  io.to("students").emit("announcement", data);
}

/**
 * Broadcasts a message to a specific course.
 */
export function broadcastToCourse(courseCode: string, data: any) {
  if (!io) return;
  const room = `course_${courseCode}`;
  io.to(room).emit("announcement", data);
}
