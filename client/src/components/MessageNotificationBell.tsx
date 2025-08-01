import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playMessageReceivedSound } from "@/utils/audioUtils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actor?: {
    id: string;
    fullName: string;
    username: string;
  };
}

export function MessageNotificationBell() {
  const [showTooltip, setShowTooltip] = useState(false);
  const prevMessageNotificationsRef = useRef<Notification[]>([]);

  // Fetch all notifications and filter for messages
  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000, // Check every 15 seconds
  });

  // Filter message notifications
  const messageNotifications = allNotifications.filter(n => n.type === "message" && !n.isRead);
  const messageCount = messageNotifications.length;

  // Detect new message notifications and play sound
  useEffect(() => {
    if (messageNotifications.length > prevMessageNotificationsRef.current.length && 
        prevMessageNotificationsRef.current.length > 0) {
      playMessageReceivedSound();
      
      // Show browser notification for new messages
      if (Notification.permission === "granted") {
        const latestMessage = messageNotifications[0];
        new Notification("ANETI - Nova Mensagem", {
          body: latestMessage.message,
          icon: "/favicon.ico",
          tag: "aneti-message"
        });
      }
      
      // Show tooltip temporarily
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
    prevMessageNotificationsRef.current = messageNotifications;
  }, [messageNotifications]);

  const handleClick = () => {
    // Navigate to chat page
    window.location.href = "/chat";
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600"
      >
        <Mail className="h-5 w-5" />
        {messageCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {messageCount > 99 ? "99+" : messageCount}
          </Badge>
        )}
      </Button>
      
      {showTooltip && messageCount > 0 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          Nova mensagem recebida
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
        </div>
      )}
    </div>
  );
}