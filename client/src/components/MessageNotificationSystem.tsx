import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { playNotificationSound } from "@/utils/audioUtils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actor?: {
    id: string;
    fullName: string;
    username: string;
  };
}

export function MessageNotificationSystem() {
  const { user } = useAuth();
  const prevUnreadCountRef = useRef<number>(0);

  // Fetch unread count to monitor for new notifications
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  const unreadCount = unreadData?.count || 0;

  // Detect increase in unread count and play notification sound
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
      playNotificationSound();
      
      // Show browser notification if permissions are granted
      if (Notification.permission === "granted") {
        new Notification("ANETI - Nova Notificação", {
          body: "Você tem novas notificações",
          icon: "/favicon.ico",
          tag: "aneti-notification"
        });
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null; // This component doesn't render anything visible
}