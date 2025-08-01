import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
      
      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}