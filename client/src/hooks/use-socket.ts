import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }
  return globalSocket;
}

/**
 * Joins the authenticated user's personal socket room so the server
 * can send targeted real-time messages (e.g. profile-updated).
 */
export function useJoinUserRoom(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

    const joinRoom = () => socket.emit("join-user", userId);

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [userId]);
}

/**
 * Hook to subscribe to a named socket.io event.
 * Automatically connects on mount and cleans up the listener on unmount.
 */
export function useSocketEvent(event: string, handler: (data: any) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();

    const listener = (data: any) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
