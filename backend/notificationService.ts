import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

export class NotificationService {
  
  // Create a like notification
  static async createLikeNotification(
    postId: string, 
    postAuthorId: string, 
    likerUserId: string,
    likerName: string
  ) {
    if (postAuthorId === likerUserId) return; // Don't notify yourself
    
    const notification: InsertNotification = {
      userId: postAuthorId,
      type: "like",
      title: "Nova curtida",
      message: `${likerName} curtiu sua publicação`,
      actionUrl: `/posts/${postId}`,
      relatedEntityId: postId,
      relatedEntityType: "post",
      actorId: likerUserId,
    };
    
    return storage.createNotification(notification);
  }

  // Create a comment notification  
  static async createCommentNotification(
    postId: string,
    postAuthorId: string,
    commenterId: string,
    commenterName: string
  ) {
    if (postAuthorId === commenterId) return; // Don't notify yourself
    
    const notification: InsertNotification = {
      userId: postAuthorId,
      type: "comment",
      title: "Novo comentário",
      message: `${commenterName} comentou em sua publicação`,
      actionUrl: `/posts/${postId}`,
      relatedEntityId: postId,
      relatedEntityType: "post",
      actorId: commenterId,
    };
    
    return storage.createNotification(notification);
  }

  // Create a connection request notification
  static async createConnectionRequestNotification(
    receiverId: string,
    requesterId: string,
    requesterName: string
  ) {
    const notification: InsertNotification = {
      userId: receiverId,
      type: "connection_request",
      title: "Solicitação de conexão",
      message: `${requesterName} enviou uma solicitação de conexão`,
      actionUrl: `/connections/requests`,
      relatedEntityId: requesterId,
      relatedEntityType: "user",
      actorId: requesterId,
    };
    
    return storage.createNotification(notification);
  }

  // Create a connection accepted notification
  static async createConnectionAcceptedNotification(
    requesterId: string,
    accepterId: string,
    accepterName: string
  ) {
    const notification: InsertNotification = {
      userId: requesterId,
      type: "connection_accepted",
      title: "Conexão aceita",
      message: `${accepterName} aceitou sua solicitação de conexão`,
      actionUrl: `/profile/${accepterId}`,
      relatedEntityId: accepterId,
      relatedEntityType: "user",
      actorId: accepterId,
    };
    
    return storage.createNotification(notification);
  }

  // Create a message notification
  static async createMessageNotification(
    conversationId: string,
    receiverId: string,
    senderId: string,
    senderName: string,
    conversationName?: string
  ) {
    if (receiverId === senderId) return; // Don't notify yourself
    
    const notification: InsertNotification = {
      userId: receiverId,
      type: "message",
      title: "Nova mensagem",
      message: conversationName 
        ? `${senderName} enviou uma mensagem em ${conversationName}`
        : `${senderName} enviou uma mensagem`,
      actionUrl: `/chat/${conversationId}`,
      relatedEntityId: conversationId,
      relatedEntityType: "conversation",
      actorId: senderId,
    };
    
    return storage.createNotification(notification);
  }

  // Create an application approved notification
  static async createApplicationApprovedNotification(
    applicantId: string,
    planName: string
  ) {
    const notification: InsertNotification = {
      userId: applicantId,
      type: "application_approved",
      title: "Associação aprovada",
      message: `Sua solicitação de associação ao plano ${planName} foi aprovada!`,
      actionUrl: `/profile`,
      relatedEntityType: "application",
    };
    
    return storage.createNotification(notification);
  }

  // Create an application rejected notification
  static async createApplicationRejectedNotification(
    applicantId: string,
    planName: string,
    reason?: string
  ) {
    const notification: InsertNotification = {
      userId: applicantId,
      type: "application_rejected",
      title: "Associação rejeitada",
      message: reason 
        ? `Sua solicitação de associação ao plano ${planName} foi rejeitada: ${reason}`
        : `Sua solicitação de associação ao plano ${planName} foi rejeitada`,
      actionUrl: `/applications`,
      relatedEntityType: "application",
    };
    
    return storage.createNotification(notification);
  }

  // Create a mention notification (for @mentions in posts or comments)
  static async createMentionNotification(
    mentionedUserId: string,
    mentionerId: string,
    mentionerName: string,
    contentType: "post" | "comment",
    contentId: string,
    postId: string
  ) {
    if (mentionedUserId === mentionerId) return; // Don't notify yourself
    
    const notification: InsertNotification = {
      userId: mentionedUserId,
      type: contentType === "post" ? "post_mention" : "comment_mention",
      title: "Você foi mencionado",
      message: contentType === "post" 
        ? `${mentionerName} mencionou você em uma publicação`
        : `${mentionerName} mencionou você em um comentário`,
      actionUrl: `/posts/${postId}`,
      relatedEntityId: contentId,
      relatedEntityType: contentType,
      actorId: mentionerId,
    };
    
    return storage.createNotification(notification);
  }

  // Create a welcome notification for new users
  static async createWelcomeNotification(userId: string) {
    const notification: InsertNotification = {
      userId,
      type: "welcome",
      title: "Bem-vindo à ANETI!",
      message: "Seja bem-vindo à Associação Nacional dos Especialistas em TI. Complete seu perfil para começar a se conectar com outros profissionais.",
      actionUrl: "/profile/edit",
      relatedEntityType: "system",
    };
    
    return storage.createNotification(notification);
  }
}