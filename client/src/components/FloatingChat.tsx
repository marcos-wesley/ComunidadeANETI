import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  X, 
  Minus, 
  Send, 
  Users, 
  Search,
  Plus
} from "lucide-react";

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function FloatingChat({ isOpen, onToggle }: FloatingChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 2000,
  });

  // Fetch users for new chat
  const { data: users = [] } = useQuery({
    queryKey: ["/api/members"],
    select: (data: any[]) => data.filter(u => u.id !== user?.id),
  });

  // Filter users based on search query
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter((u: any) => 
      u.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [userSearchQuery]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${data.conversationId}/messages`, {
        content: data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", "/api/conversations/direct", { userId });
      return response.json();
    },
    onSuccess: (newConversation) => {
      setShowNewChat(false);
      setUserSearchQuery("");
      setSelectedConversation(newConversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar conversa",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  const handleStartChat = (userId: string) => {
    createConversationMutation.mutate(userId);
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  const getConversationName = (conversation: any) => {
    if (conversation.type === "group") {
      return conversation.name || "Grupo";
    }
    
    const otherParticipant = conversation.participants?.find(
      (p: any) => p.user.id !== user?.id
    );
    return otherParticipant?.user.fullName || "Conversa";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 bg-white dark:bg-gray-900 shadow-2xl border transition-all duration-300 ${
        isMinimized ? 'h-12' : 'h-96'
      }`}>
        <CardHeader className="p-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {selectedConversation ? getConversationName(
                conversations.find((c: any) => c.id === selectedConversation)
              ) : "Mensagens"}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-blue-500"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-blue-500"
                onClick={onToggle}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 h-80 flex flex-col">
            {!selectedConversation ? (
              // Conversation list view
              <div className="flex flex-col h-full">
                <div className="p-3 border-b flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowNewChat(!showNewChat)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">Conversas</span>
                </div>

                {showNewChat && (
                  <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
                    <div className="relative">
                      <Input
                        placeholder="Buscar usuário..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="text-sm h-8"
                      />
                      {filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-auto">
                          {filteredUsers.map((u: any) => (
                            <div
                              key={u.id}
                              onClick={() => handleStartChat(u.id)}
                              className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{u.fullName}</div>
                              <div className="text-xs text-gray-500">@{u.username}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {conversations.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma conversa ainda</p>
                      </div>
                    ) : (
                      conversations.map((conversation: any) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer mb-1"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(getConversationName(conversation))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {getConversationName(conversation)}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {conversation.lastMessage?.content || "Iniciar conversa"}
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              // Messages view
              <div className="flex flex-col h-full">
                <div className="p-3 border-b flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedConversation(null)}
                  >
                    ←
                  </Button>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(getConversationName(
                        conversations.find((c: any) => c.id === selectedConversation)
                      ))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {getConversationName(
                      conversations.find((c: any) => c.id === selectedConversation)
                    )}
                  </span>
                </div>

                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender.id === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                            message.sender.id === user?.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div>{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.sender.id === user?.id
                                ? "text-blue-200"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-2 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}