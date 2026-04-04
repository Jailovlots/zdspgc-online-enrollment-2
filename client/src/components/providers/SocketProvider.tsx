import React, { createContext, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Connect to the same origin
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to real-time server');
      // Join individual room for targeted notifications
      socket.emit('join-user', user.id);

      // If student, join their course room
      if (user.role === 'student') {
        apiRequest('GET', '/api/student/profile')
          .then(res => res.json())
          .then(data => {
            if (data?.course?.code) {
              console.log('Joining course room:', data.course.code);
              socket.emit('join-course', data.course.code);
            }
          })
          .catch(err => console.error('Error fetching profile for socket rooms:', err));
      }
    });

    socket.on('announcement', (data: string) => {
      // Show instant notification using the system toast
      toast({
        title: "Real-time Notification",
        description: data,
      });
      
      // Also fallback to alert if user specifically requested it via their snippet
      // console.log("Real-time message received:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, toast]);

  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
