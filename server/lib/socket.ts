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
      const isTLS = process.env.REDIS_URL.startsWith("rediss://") || (process.env.REDIS_URL.includes("upstash.io") && !process.env.REDIS_URL.startsWith("redis://"));
      
      const clientOptions: any = {
        url: process.env.REDIS_URL,
      };

      if (isTLS) {
        clientOptions.socket = {
          tls: true,
          rejectUnauthorized: false
        };
      }

      const pubClient = createClient(clientOptions);
      const subClient = pubClient.duplicate();

      // Track if we have already failed to prevent double fallback
      let hasFailed = false;
      const handleConnectionError = (err: Error) => {
        if (!hasFailed) {
          hasFailed = true;
          console.error(`Real-time: Redis error, falling back to in-memory: ${err.message}`);
          // Attempt to close clients to stop reconnection attempts
          pubClient.disconnect().catch(() => {});
          subClient.disconnect().catch(() => {});
        }
      };

      pubClient.on("error", handleConnectionError);
      subClient.on("error", handleConnectionError);

      // Connect with a 5-second timeout
      const connectPromise = Promise.all([pubClient.connect(), subClient.connect()]);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      
      if (!hasFailed) {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Real-time: Redis adapter connected successfully.");
      }
    } catch (err: any) {
      console.error("Real-time: Redis initialization failed, using in-memory adapter.");
      // The error listeners will handle cleanup if they haven't already
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

    // Join staff room
    socket.on("join-staff", () => {
      console.log("Real-time: User joining staff room");
      socket.join("staff");
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

/**
 * Broadcasts a message to all connected staff/admins.
 */
export function broadcastToStaff(data: any) {
  if (!io) return;
  io.to("staff").emit("announcement", data);
}
