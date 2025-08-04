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
  Plus,
  Edit,
  Trash2,
  Check,
  CheckCheck
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<any[]>({
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
  }, [userSearchQuery, users]);

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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar conversa');
      }
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
        description: error.message || "Falha ao criar conversa",
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await apiRequest("PUT", `/api/messages/${messageId}`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditingText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível editar a mensagem",
        variant: "destructive",
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a mensagem",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      setSelectedConversation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Sucesso",
        description: "Conversa deletada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a conversa",
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

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditingText(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editingText.trim()) return;
    
    editMessageMutation.mutate({
      messageId: editingMessageId,
      content: editingText.trim(),
    });
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Tem certeza que deseja deletar esta mensagem?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;
    
    if (confirm("Tem certeza que deseja deletar esta conversa inteira?")) {
      deleteConversationMutation.mutate(selectedConversation);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  const getConversationName = (conversation: any) => {
    if (!conversation) return "Conversa";
    
    if (conversation.type === "group") {
      return conversation.name || "Grupo";
    }
    
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return "Conversa";
    }
    
    const otherParticipant = conversation.participants.find(
      (p: any) => p?.user?.id !== user?.id
    );
    
    if (!otherParticipant || !otherParticipant.user) {
      return "Conversa";
    }
    
    return otherParticipant.user.fullName || otherParticipant.user.username || "Conversa";
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
                          
                          {/* Unread message indicator */}
                          {(() => {
                            const currentParticipant = conversation.participants.find((p: any) => p.userId === user?.id);
                            const hasUnreadMessages = conversation.lastMessage && 
                              currentParticipant &&
                              new Date(conversation.lastMessage.createdAt) > new Date(currentParticipant.lastReadAt);
                            
                            return hasUnreadMessages ? (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            ) : null;
                          })()}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              // Messages view
              <div className="flex flex-col h-full">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  
                  {/* Delete conversation button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteConversation}
                    title="Deletar conversa"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {/* Sort messages chronologically (oldest first) */}
                    {messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((message: any, index: number) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender.id === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm relative group ${
                            message.sender.id === user?.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {/* Edit/Delete buttons for own messages */}
                          {message.sender.id === user?.id && (
                            <div className="absolute -top-8 right-0 bg-white shadow-lg rounded-md border opacity-0 group-hover:opacity-100 transition-opacity flex">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={() => handleEditMessage(message.id, message.content)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {/* Message content - editable if in edit mode */}
                          {editingMessageId === message.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="bg-white text-black text-sm h-8"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <Button size="sm" className="h-6 text-xs" onClick={handleSaveEdit}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleCancelEdit}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>{message.content}</div>
                              {message.editedAt && (
                                <span className="text-xs opacity-70 italic">(editado)</span>
                              )}
                            </>
                          )}

                          {/* Message timestamp and read receipts */}
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            message.sender.id === user?.id ? "text-blue-200" : "text-gray-500"
                          }`}>
                            <span>
                              {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            
                            {/* Read receipts for sent messages */}
                            {message.sender.id === user?.id && (
                              <div className="ml-1">
                                {(() => {
                                  const conversation = conversations.find((c: any) => c.id === selectedConversation);
                                  if (!conversation) return <Check className="h-3 w-3" />;
                                  
                                  const otherParticipants = conversation.participants.filter((p: any) => p.userId !== user?.id);
                                  const allRead = otherParticipants.every((p: any) => 
                                    new Date(p.lastReadAt) >= new Date(message.createdAt)
                                  );
                                  
                                  return allRead ? (
                                    <CheckCheck className="h-3 w-3 text-blue-300" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {user?.planName === "Público" ? (
                  <div className="p-2 border-t text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Recursos de mensagem disponíveis apenas para membros com planos pagos.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Plano Público
                    </Badge>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}