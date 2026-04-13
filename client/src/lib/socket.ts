import { io } from "socket.io-client";

// The socket server is hosted on the same port as the API
const socketUrl = window.location.origin;

export const socket = io(socketUrl, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("Real-time: Connected to server");
});

socket.on("disconnect", () => {
  console.log("Real-time: Disconnected from server");
});
