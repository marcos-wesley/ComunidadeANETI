import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionUsersChange: (mentionedUsers: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({ 
  value, 
  onChange, 
  onMentionUsersChange, 
  placeholder,
  className 
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search users for mentions
  const { data: userSuggestions = [] } = useQuery<Pick<User, 'id' | 'fullName' | 'username'>[]>({
    queryKey: ["/api/users/search", mentionQuery],
    enabled: mentionQuery.length > 0,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
      return await res;
    },
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }

    // Extract mentioned users from the text
    const mentionMatches = newValue.match(/@(\w+)/g) || [];
    const mentionedUsernames = mentionMatches.map(match => match.substring(1));
    onMentionUsersChange(mentionedUsernames);
  };

  // Handle mention selection
  const handleMentionSelect = (user: Pick<User, 'id' | 'fullName' | 'username'>) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the start of the current mention
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    
    if (mentionStart !== -1) {
      const newText = 
        textBeforeCursor.substring(0, mentionStart) +
        `@${user.username} ` +
        textAfterCursor;
      
      onChange(newText);
      setShowSuggestions(false);
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStart + user.username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && userSuggestions.length > 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        e.preventDefault();
      }
      // Could add arrow key navigation here if needed
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {/* Mention Suggestions */}
      {showSuggestions && userSuggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
          <div className="p-2 space-y-1">
            {userSuggestions.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => handleMentionSelect(user)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}