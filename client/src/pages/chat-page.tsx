import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  Users, 
  User,
  MoreVertical,
  Reply,
  Phone,
  Video,
  Settings
} from "lucide-react";

type ConversationWithDetails = {
  id: string;
  type: "direct" | "group";
  name?: string;
  description?: string;
  createdBy: string;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    conversationId: string;
    userId: string;
    role: string;
    joinedAt: string;
    lastReadAt: string;
    isActive: boolean;
    user: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  }>;
  lastMessage?: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: string;
    createdAt: string;
    sender: {
      id: string;
      fullName: string;
      username: string;
    };
  };
  unreadCount?: number;
};

type MessageWithDetails = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      fullName: string;
      username: string;
    };
  };
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getConversationTitle(conversation: ConversationWithDetails, currentUserId: string) {
  if (conversation.type === "group") {
    return conversation.name || "Grupo sem nome";
  }
  
  // For direct conversations, show the other participant's name
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  return otherParticipant?.user.fullName || "Usuário";
}

function getConversationAvatar(conversation: ConversationWithDetails, currentUserId: string) {
  if (conversation.type === "group") {
    return null; // Will show Users icon
  }
  
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  return otherParticipant?.user.profilePicture;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationWithDetails[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithDetails[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refresh every 2 seconds when conversation is open
  });

  // Fetch users for creating conversations
  const { data: users = [] } = useQuery({
    queryKey: ["/api/members"],
    select: (data: any[]) => data.filter(u => u.id !== user?.id), // Exclude current user
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.type === "direct" 
        ? "/api/conversations/direct" 
        : "/api/conversations/group";
      
      const payload = data.type === "direct"
        ? { userId: data.userId }
        : { name: data.name, description: data.description };

      const response = await apiRequest("POST", endpoint, payload);
      return response.json();
    },
    onSuccess: (newConversation) => {
      setShowNewChatDialog(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedUserId("");
      setSelectedConversation(newConversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Sucesso",
        description: "Conversa criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("POST", `/api/conversations/${conversationId}/read`);
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!selectedConversation || !messageText.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  const handleCreateConversation = () => {
    if (newChatType === "direct" && !selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para iniciar a conversa",
        variant: "destructive",
      });
      return;
    }

    if (newChatType === "group" && !newGroupName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o grupo",
        variant: "destructive",
      });
      return;
    }

    createConversationMutation.mutate({
      type: newChatType,
      userId: selectedUserId,
      name: newGroupName,
      description: newGroupDescription,
    });
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const title = getConversationTitle(conversation, user?.id || "");
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mensagens
            </h1>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={newChatType} onValueChange={(value: "direct" | "group") => setNewChatType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de conversa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Conversa direta</SelectItem>
                      <SelectItem value="group">Grupo</SelectItem>
                    </SelectContent>
                  </Select>

                  {newChatType === "direct" && (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {newChatType === "group" && (
                    <>
                      <Input
                        placeholder="Nome do grupo"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <Textarea
                        placeholder="Descrição do grupo (opcional)"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                      />
                    </>
                  )}

                  <Button 
                    onClick={handleCreateConversation}
                    disabled={createConversationMutation.isPending}
                    className="w-full"
                  >
                    {createConversationMutation.isPending ? "Criando..." : "Criar Conversa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversationsLoading ? (
              <div className="text-center text-gray-500 py-8">Carregando conversas...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const title = getConversationTitle(conversation, user.id);
                const avatar = getConversationAvatar(conversation, user.id);
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                      selectedConversation === conversation.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {conversation.type === "group" ? (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                        ) : avatar ? (
                          <AvatarImage src={`http://localhost:5000${avatar}`} alt={title} />
                        ) : (
                          <AvatarFallback>{getInitials(title)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                              locale: ptBR,
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.lastMessage.sender.fullName}: {conversation.lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conversation.type === "group" ? "Grupo" : "Direto"}
                          </Badge>
                          {conversation.participants.length > 2 && (
                            <span className="text-xs text-gray-500">
                              {conversation.participants.length} membros
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {selectedConversationData.type === "group" ? (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    ) : (
                      (() => {
                        const avatar = getConversationAvatar(selectedConversationData, user.id);
                        const title = getConversationTitle(selectedConversationData, user.id);
                        return avatar ? (
                          <AvatarImage src={`http://localhost:5000${avatar}`} alt={title} />
                        ) : (
                          <AvatarFallback>{getInitials(title)}</AvatarFallback>
                        );
                      })()
                    )}
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {getConversationTitle(selectedConversationData, user.id)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversationData.participants.length} {
                        selectedConversationData.participants.length === 1 ? "membro" : "membros"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500 py-8">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
                  </div>
                ) : (
                  messages.reverse().map((message) => {
                    const isOwnMessage = message.senderId === user.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-3 max-w-xs lg:max-w-md ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8">
                              {message.sender.profilePicture ? (
                                <AvatarImage src={`http://localhost:5000${message.sender.profilePicture}`} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {getInitials(message.sender.fullName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}
                          <div className={`rounded-lg px-3 py-2 ${
                            isOwnMessage 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}>
                            {!isOwnMessage && (
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                {message.sender.fullName}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? "text-blue-100" : "text-gray-500"
                            }`}>
                              {formatDistanceToNow(new Date(message.createdAt), {
                                locale: ptBR,
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa da lista para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}