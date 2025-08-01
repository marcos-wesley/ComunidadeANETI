import { 
  users, 
  membershipPlans, 
  memberApplications, 
  documents,
  posts,
  comments,
  likes,
  connections,
  experiences,
  educations,
  certifications,
  projects,
  skills,
  recommendations,
  languages,
  highlights,
  conversations,
  conversationParticipants,
  messages,
  notifications,
  type User, 
  type InsertUser, 
  type MembershipPlan, 
  type InsertMembershipPlan, 
  type MemberApplication, 
  type InsertMemberApplication, 
  type Document, 
  type InsertDocument,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Connection,
  type InsertConnection,
  type PostWithDetails,
  type Experience,
  type InsertExperience,
  type Education,
  type InsertEducation,
  type Certification,
  type InsertCertification,
  type Project,
  type InsertProject,
  type Skill,
  type InsertSkill,
  type Recommendation,
  type InsertRecommendation,
  type Language,
  type InsertLanguage,
  type Highlight,
  type InsertHighlight,
  type Conversation,
  type InsertConversation,
  type ConversationParticipant,
  type InsertConversationParticipant,
  type Message,
  type InsertMessage,
  type ConversationWithDetails,
  type MessageWithDetails,
  type Notification,
  type InsertNotification,
  type NotificationWithDetails,
  adminUsers,
  type AdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, ilike, sql, inArray, ne, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;

  // Membership Plans
  getMembershipPlans(): Promise<MembershipPlan[]>;
  getMembershipPlan(id: string): Promise<MembershipPlan | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;

  // Member Applications
  getMemberApplication(id: string): Promise<MemberApplication | undefined>;
  getMemberApplicationWithDetails(id: string): Promise<any>;
  getMemberApplicationsByUser(userId: string): Promise<MemberApplication[]>;
  getPendingApplications(): Promise<(MemberApplication & { user: User; plan: MembershipPlan })[]>;
  getApplicationByEmail(email: string): Promise<MemberApplication | undefined>;
  getApplicationByUsername(username: string): Promise<MemberApplication | undefined>;
  createMemberApplication(application: InsertMemberApplication): Promise<MemberApplication>;
  updateMemberApplication(id: string, updates: Partial<MemberApplication>): Promise<MemberApplication | undefined>;

  // Documents
  getDocumentsByApplication(applicationId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Social Feed
  getFeedPosts(userId: string): Promise<PostWithDetails[]>;
  createPost(post: InsertPost): Promise<Post>;
  getPostWithDetails(postId: string): Promise<PostWithDetails | undefined>;
  toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }>;
  getPostById(postId: string): Promise<Post | undefined>;
  deletePost(postId: string): Promise<void>;
  reportPost(postId: string, userId: string, reason: string): Promise<void>;
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentWithAuthor(commentId: string): Promise<Comment & { author: Pick<User, 'id' | 'fullName' | 'username'> } | undefined>;
  getCommentsByPost(postId: string): Promise<(Comment & { author: Pick<User, 'id' | 'fullName' | 'username' | 'planName'> })[]>;
  
  // Connections
  getUserConnections(userId: string): Promise<(Connection & { requester: User; receiver: User })[]>;
  createConnectionRequest(requesterId: string, receiverId: string): Promise<Connection>;
  updateConnectionStatus(connectionId: string, status: string, userId: string): Promise<Connection | undefined>;
  
  // Users search
  searchUsers(query: string): Promise<Pick<User, 'id' | 'fullName' | 'username'>[]>;
  getAllMembers(): Promise<Pick<User, 'id' | 'fullName' | 'username' | 'planName'>[]>;
  getAllUsers(): Promise<User[]>;
  
  // Profile methods
  getUserProfile(userId: string): Promise<any>;
  getUserById(userId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, profileData: any): Promise<User | undefined>;
  getUserExperiences(userId: string): Promise<Experience[]>;
  getUserEducations(userId: string): Promise<Education[]>;
  getUserCertifications(userId: string): Promise<Certification[]>;
  getUserProjects(userId: string): Promise<Project[]>;
  getUserSkills(userId: string): Promise<Skill[]>;
  getUserRecommendations(userId: string): Promise<any[]>;
  getUserLanguages(userId: string): Promise<Language[]>;
  getUserHighlights(userId: string): Promise<Highlight[]>;

  // Chat methods
  getConversations(userId: string): Promise<ConversationWithDetails[]>;
  getConversation(conversationId: string, userId: string): Promise<ConversationWithDetails | undefined>;
  createDirectConversation(userId1: string, userId2: string): Promise<Conversation>;
  createGroupConversation(creatorId: string, name: string, description?: string): Promise<Conversation>;
  addParticipantToConversation(conversationId: string, userId: string, role?: string): Promise<ConversationParticipant>;
  getConversationMessages(conversationId: string, userId: string, limit?: number, offset?: number): Promise<MessageWithDetails[]>;
  sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  searchConversations(userId: string, query: string): Promise<ConversationWithDetails[]>;
  editMessage(messageId: string, userId: string, content: string): Promise<Message>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  deleteConversation(conversationId: string, userId: string): Promise<void>;

  // Notifications
  getUserNotifications(userId: string, limit?: number): Promise<NotificationWithDetails[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Application methods
  getUserApplication(userId: string): Promise<any>;

  // Admin methods
  getAllApplications(): Promise<any[]>;
  approveApplication(applicationId: string, adminId: string): Promise<void>;
  rejectApplication(applicationId: string, adminId: string, reason: string): Promise<void>;
  banUser(userId: string, adminId: string): Promise<void>;
  unbanUser(userId: string, adminId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [result] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        area: users.area,
        position: users.position,
        city: users.city,
        state: users.state,
        gender: users.gender,
        isActive: users.isActive,
        isApproved: users.isApproved,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        planName: membershipPlans.name,
      })
      .from(users)
      .leftJoin(memberApplications, eq(users.id, memberApplications.userId))
      .leftJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
      .where(and(eq(users.id, id), eq(memberApplications.status, 'approved')));
    
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    console.log("DatabaseStorage.getUserById called with id:", id);
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log("User found:", user ? user.username : "not found");
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserById:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return [];
    }
  }

  async updateUserProfile(id: string, profileData: any): Promise<User | undefined> {
    console.log("DatabaseStorage.updateUserProfile called with id:", id);
    console.log("Profile data:", profileData);
    
    try {
      // For image updates, use direct SQL to avoid Drizzle typing issues
      if (profileData.profilePicture !== undefined) {
        await db.execute(sql`
          UPDATE users 
          SET profile_picture = ${profileData.profilePicture}, updated_at = NOW() 
          WHERE id = ${id}
        `);
      }
      
      if (profileData.coverPhoto !== undefined) {
        await db.execute(sql`
          UPDATE users 
          SET cover_photo = ${profileData.coverPhoto}, updated_at = NOW() 
          WHERE id = ${id}
        `);
      }
      
      // Get the updated user
      const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
      console.log("Updated user result:", updatedUser);
      return updatedUser || undefined;
      
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Membership Plans
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    return await db.select().from(membershipPlans).where(eq(membershipPlans.isActive, true));
  }

  async getMembershipPlan(id: string): Promise<MembershipPlan | undefined> {
    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id));
    return plan || undefined;
  }

  async createMembershipPlan(insertPlan: InsertMembershipPlan): Promise<MembershipPlan> {
    const [plan] = await db
      .insert(membershipPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  // Member Applications
  async getMemberApplication(id: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.id, id));
    return application || undefined;
  }

  async getMemberApplicationWithDetails(id: string): Promise<any> {
    const [application] = await db
      .select({
        id: memberApplications.id,
        userId: memberApplications.userId,
        planId: memberApplications.planId,
        email: memberApplications.email,
        username: memberApplications.username,
        password: memberApplications.password,
        experienceYears: memberApplications.experienceYears,
        isStudent: memberApplications.isStudent,
        status: memberApplications.status,
        paymentStatus: memberApplications.paymentStatus,
        paymentId: memberApplications.paymentId,
        stripeSubscriptionId: memberApplications.stripeSubscriptionId,
        stripePaymentIntentId: memberApplications.stripePaymentIntentId,
        adminNotes: memberApplications.adminNotes,
        reviewedBy: memberApplications.reviewedBy,
        reviewedAt: memberApplications.reviewedAt,
        createdAt: memberApplications.createdAt,
        updatedAt: memberApplications.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          city: users.city,
          state: users.state,
          area: users.area,
          phone: users.phone,
        },
        plan: {
          id: membershipPlans.id,
          name: membershipPlans.name,
          price: membershipPlans.price,
          description: membershipPlans.description,
        }
      })
      .from(memberApplications)
      .innerJoin(users, eq(memberApplications.userId, users.id))
      .innerJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
      .where(eq(memberApplications.id, id));
    
    return application || undefined;
  }

  async getMemberApplicationsByUser(userId: string): Promise<MemberApplication[]> {
    return await db
      .select()
      .from(memberApplications)
      .where(eq(memberApplications.userId, userId))
      .orderBy(desc(memberApplications.createdAt));
  }

  async getPendingApplications(): Promise<(MemberApplication & { user: User; plan: MembershipPlan })[]> {
    return await db
      .select({
        id: memberApplications.id,
        userId: memberApplications.userId,
        planId: memberApplications.planId,
        status: memberApplications.status,
        paymentStatus: memberApplications.paymentStatus,
        paymentId: memberApplications.paymentId,
        mercadoPagoPreferenceId: memberApplications.mercadoPagoPreferenceId,
        experienceYears: memberApplications.experienceYears,
        isStudent: memberApplications.isStudent,
        studentProof: memberApplications.studentProof,
        adminNotes: memberApplications.adminNotes,
        reviewedBy: memberApplications.reviewedBy,
        reviewedAt: memberApplications.reviewedAt,
        createdAt: memberApplications.createdAt,
        updatedAt: memberApplications.updatedAt,
        user: users,
        plan: membershipPlans,
      })
      .from(memberApplications)
      .innerJoin(users, eq(memberApplications.userId, users.id))
      .innerJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
      .where(eq(memberApplications.status, "pending"))
      .orderBy(desc(memberApplications.createdAt));
  }

  async createMemberApplication(insertApplication: InsertMemberApplication): Promise<MemberApplication> {
    const [application] = await db
      .insert(memberApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateMemberApplication(id: string, updates: Partial<MemberApplication>): Promise<MemberApplication | undefined> {
    const [application] = await db
      .update(memberApplications)
      .set(updates)
      .where(eq(memberApplications.id, id))
      .returning();
    return application || undefined;
  }

  async updateApplicationPaymentStatus(subscriptionId: string, status: string): Promise<void> {
    await db
      .update(memberApplications)
      .set({ paymentStatus: status })
      .where(eq(memberApplications.stripeSubscriptionId, subscriptionId));
  }

  async getApplicationByEmail(email: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.email, email));
    return application;
  }

  async getApplicationByUsername(username: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.username, username));
    return application;
  }

  // Documents
  async getDocumentsByApplication(applicationId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.applicationId, applicationId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  // Social Feed Methods
  async getFeedPosts(userId: string): Promise<PostWithDetails[]> {
    // Get user's connections
    const userConnections = await db
      .select({ connectedUserId: sql<string>`CASE 
        WHEN ${connections.requesterId} = ${userId} THEN ${connections.receiverId}
        ELSE ${connections.requesterId}
      END` })
      .from(connections)
      .where(
        and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, 'accepted')
        )
      );

    const connectedUserIds = userConnections.map(c => c.connectedUserId);
    
    // Get posts from connections, global posts, and user's own posts
    const feedPosts = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        mediaType: posts.mediaType,
        mediaUrl: posts.mediaUrl,
        visibility: posts.visibility,
        mentionedUsers: posts.mentionedUsers,
        isActive: posts.isActive,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorName: users.fullName,
        authorUsername: users.username,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.isActive, true),
          or(
            eq(posts.visibility, 'global'),
            and(
              eq(posts.visibility, 'connections'),
              or(
                eq(posts.authorId, userId),
                inArray(posts.authorId, connectedUserIds.length > 0 ? connectedUserIds : [''])
              )
            )
          )
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(50);

    // Get likes and comments for each post
    const postsWithDetails: PostWithDetails[] = [];
    for (const post of feedPosts) {
      const postLikes = await db
        .select({
          id: likes.id,
          userId: likes.userId,
          postId: likes.postId,
          createdAt: likes.createdAt,
          userName: users.fullName,
          username: users.username,
        })
        .from(likes)
        .leftJoin(users, eq(likes.userId, users.id))
        .where(eq(likes.postId, post.id));

      const postComments = await db
        .select({
          id: comments.id,
          postId: comments.postId,
          authorId: comments.authorId,
          content: comments.content,
          mentionedUsers: comments.mentionedUsers,
          isActive: comments.isActive,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          authorName: users.fullName,
          authorUsername: users.username,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(and(eq(comments.postId, post.id), eq(comments.isActive, true)))
        .orderBy(desc(comments.createdAt));

      postsWithDetails.push({
        ...post,
        author: {
          id: post.authorId,
          fullName: post.authorName || '',
          username: post.authorUsername || '',
        },
        likes: postLikes.map(like => ({
          id: like.id,
          userId: like.userId,
          postId: like.postId,
          createdAt: like.createdAt,
          user: {
            id: like.userId,
            fullName: like.userName || '',
            username: like.username || '',
          },
        })),
        comments: postComments.map(comment => ({
          id: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          content: comment.content,
          mentionedUsers: comment.mentionedUsers || [],
          isActive: comment.isActive,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: {
            id: comment.authorId,
            fullName: comment.authorName || '',
            username: comment.authorUsername || '',
          },
        })),
        _count: {
          likes: postLikes.length,
          comments: postComments.length,
        },
      });
    }

    return postsWithDetails;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async getPostWithDetails(postId: string): Promise<PostWithDetails | undefined> {
    const [post] = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        mediaType: posts.mediaType,
        mediaUrl: posts.mediaUrl,
        visibility: posts.visibility,
        mentionedUsers: posts.mentionedUsers,
        isActive: posts.isActive,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorName: users.fullName,
        authorUsername: users.username,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, postId));

    if (!post) return undefined;

    const postLikes = await db
      .select({
        id: likes.id,
        userId: likes.userId,
        postId: likes.postId,
        createdAt: likes.createdAt,
        userName: users.fullName,
        username: users.username,
      })
      .from(likes)
      .leftJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.postId, postId));

    const postComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        mentionedUsers: comments.mentionedUsers,
        isActive: comments.isActive,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        authorUsername: users.username,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(and(eq(comments.postId, postId), eq(comments.isActive, true)))
      .orderBy(desc(comments.createdAt));

    return {
      ...post,
      author: {
        id: post.authorId,
        fullName: post.authorName || '',
        username: post.authorUsername || '',
      },
      likes: postLikes.map(like => ({
        id: like.id,
        userId: like.userId,
        postId: like.postId,
        createdAt: like.createdAt,
        user: {
          id: like.userId,
          fullName: like.userName || '',
          username: like.username || '',
        },
      })),
      comments: postComments.map(comment => ({
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        content: comment.content,
        mentionedUsers: comment.mentionedUsers || [],
        isActive: comment.isActive,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          id: comment.authorId,
          fullName: comment.authorName || '',
          username: comment.authorUsername || '',
        },
      })),
      _count: {
        likes: postLikes.length,
        comments: postComments.length,
      },
    };
  }

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    // Check if user already liked the post
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    if (existingLike) {
      // Unlike the post
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    } else {
      // Like the post
      await db
        .insert(likes)
        .values({ userId, postId });
    }

    // Get updated likes count
    const likesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    return {
      liked: !existingLike,
      likesCount: likesCount[0]?.count || 0,
    };
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId));
    return post;
  }

  async deletePost(postId: string): Promise<void> {
    // Delete related likes first
    await db.delete(likes).where(eq(likes.postId, postId));
    
    // Delete related comments
    await db.delete(comments).where(eq(comments.postId, postId));
    
    // Delete the post
    await db.delete(posts).where(eq(posts.id, postId));
  }

  async reportPost(postId: string, userId: string, reason: string): Promise<void> {
    // In a real app, you'd store reports in a database table
    // For now, just log it
    console.log(`Post ${postId} reported by user ${userId} for reason: ${reason}`);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getCommentWithAuthor(commentId: string): Promise<Comment & { author: Pick<User, 'id' | 'fullName' | 'username'> } | undefined> {
    const [result] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        mentionedUsers: comments.mentionedUsers,
        isActive: comments.isActive,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        authorUsername: users.username,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, commentId));

    if (!result) return undefined;

    return {
      id: result.id,
      postId: result.postId,
      authorId: result.authorId,
      content: result.content,
      mentionedUsers: result.mentionedUsers || [],
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      author: {
        id: result.authorId,
        fullName: result.authorName || '',
        username: result.authorUsername || '',
      },
    };
  }

  async getCommentsByPost(postId: string): Promise<(Comment & { author: Pick<User, 'id' | 'fullName' | 'username' | 'planName'> })[]> {
    const commentsWithAuthor = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        mentionedUsers: comments.mentionedUsers,
        isActive: comments.isActive,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        authorUsername: users.username,
        authorPlanName: membershipPlans.name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .leftJoin(membershipPlans, eq(users.currentPlanId, membershipPlans.id))
      .where(and(eq(comments.postId, postId), eq(comments.isActive, true)))
      .orderBy(comments.createdAt);

    return commentsWithAuthor.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      mentionedUsers: comment.mentionedUsers || [],
      isActive: comment.isActive,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.authorId,
        fullName: comment.authorName || '',
        username: comment.authorUsername || '',
        planName: comment.authorPlanName || null,
      },
    }));
  }

  // Connection Methods
  async getUserConnections(userId: string): Promise<(Connection & { requester: User; receiver: User })[]> {
    const userConnections = await db
      .select({
        id: connections.id,
        requesterId: connections.requesterId,
        receiverId: connections.receiverId,
        status: connections.status,
        createdAt: connections.createdAt,
        updatedAt: connections.updatedAt,
        requesterName: sql<string>`requester.full_name`,
        requesterUsername: sql<string>`requester.username`,
        requesterEmail: sql<string>`requester.email`,
        receiverName: sql<string>`receiver.full_name`,
        receiverUsername: sql<string>`receiver.username`,
        receiverEmail: sql<string>`receiver.email`,
      })
      .from(connections)
      .leftJoin(sql`${users} AS requester`, eq(connections.requesterId, sql`requester.id`))
      .leftJoin(sql`${users} AS receiver`, eq(connections.receiverId, sql`receiver.id`))
      .where(
        and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, 'accepted')
        )
      );

    return userConnections.map(conn => ({
      id: conn.id,
      requesterId: conn.requesterId,
      receiverId: conn.receiverId,
      status: conn.status,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      requester: {
        id: conn.requesterId,
        username: conn.requesterUsername || '',
        email: conn.requesterEmail || '',
        fullName: conn.requesterName || '',
        city: '',
        state: '',
        area: '',
        isApproved: false,
        isActive: true,
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentPlanId: null,
        planName: null,
      },
      receiver: {
        id: conn.receiverId,
        username: conn.receiverUsername || '',
        email: conn.receiverEmail || '',
        fullName: conn.receiverName || '',
        city: '',
        state: '',
        area: '',
        isApproved: false,
        isActive: true,
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentPlanId: null,
        planName: null,
      },
    }));
  }

  async createConnectionRequest(requesterId: string, receiverId: string): Promise<Connection> {
    // Check if connection already exists
    const [existingConnection] = await db
      .select()
      .from(connections)
      .where(
        or(
          and(eq(connections.requesterId, requesterId), eq(connections.receiverId, receiverId)),
          and(eq(connections.requesterId, receiverId), eq(connections.receiverId, requesterId))
        )
      );

    if (existingConnection) {
      throw new Error("Connection already exists");
    }

    const [connection] = await db
      .insert(connections)
      .values({ requesterId, receiverId })
      .returning();
    return connection;
  }

  async updateConnectionStatus(connectionId: string, status: string, userId: string): Promise<Connection | undefined> {
    // Only the receiver can accept/reject the connection
    const [connection] = await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(connections.id, connectionId), eq(connections.receiverId, userId)))
      .returning();
    
    return connection || undefined;
  }

  async searchUsers(query: string): Promise<Pick<User, 'id' | 'fullName' | 'username'>[]> {
    const searchResults = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          eq(users.isApproved, true),
          or(
            ilike(users.fullName, `%${query}%`),
            ilike(users.username, `%${query}%`)
          )
        )
      )
      .limit(10);

    return searchResults;
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<Message> {
    // First check if the message belongs to the user
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

    if (!message) {
      throw new Error("Message not found or you don't have permission to edit it");
    }

    // Update the message
    const [updatedMessage] = await db
      .update(messages)
      .set({ 
        content, 
        isEdited: true, 
        editedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId))
      .returning();

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // First check if the message belongs to the user
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)));

    if (!message) {
      throw new Error("Message not found or you don't have permission to delete it");
    }

    // Mark message as deleted instead of actually deleting it
    await db
      .update(messages)
      .set({ 
        isDeleted: true, 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId));
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    // Check if user is a participant in the conversation
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );

    if (!participant) {
      throw new Error("Conversation not found or you don't have permission to delete it");
    }

    // For group conversations, only remove the user from participants
    // For direct conversations, check if user is the creator
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type === "group") {
      // Remove user from participants
      await db
        .update(conversationParticipants)
        .set({ isActive: false })
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, userId)
          )
        );
    } else {
      // For direct conversations, mark all messages as deleted and deactivate conversation
      await db
        .update(messages)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(messages.conversationId, conversationId));

      await db
        .update(conversations)
        .set({ isActive: false })
        .where(eq(conversations.id, conversationId));
    }
  }

  async getMembersWithStatus(currentUserId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'newest' | 'alphabetical';
    filters?: {
      state?: string;
      plan?: string;
      gender?: string;
      area?: string;
      search?: string;
    };
  } = {}) {
    const { page = 1, limit = 20, sortBy = 'recent', filters = {} } = options;
    // Get all members except current user
    const allMembers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        area: users.area,
        position: users.position,
        gender: users.gender,
        city: users.city,
        state: users.state,
        planName: membershipPlans.name,
      })
      .from(users)
      .leftJoin(memberApplications, eq(users.id, memberApplications.userId))
      .leftJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
      .where(and(
        eq(users.isActive, true),
        ne(users.id, currentUserId),
        eq(memberApplications.status, "approved"),
        // Apply filters
        filters.state ? eq(users.state, filters.state) : undefined,
        filters.plan ? eq(membershipPlans.name, filters.plan) : undefined,
        filters.gender ? eq(users.gender, filters.gender) : undefined,
        filters.area ? like(users.area, `%${filters.area}%`) : undefined,
        filters.search ? or(
          ilike(users.fullName, `%${filters.search}%`),
          ilike(users.area, `%${filters.search}%`),
          ilike(users.position, `%${filters.search}%`),
          ilike(users.username, `%${filters.search}%`)
        ) : undefined
      ))
      .orderBy(
        sortBy === 'alphabetical' ? asc(users.fullName) :
        sortBy === 'newest' ? desc(users.createdAt) :
        desc(users.updatedAt) // 'recent' - most recently active
      )
      .limit(limit)
      .offset((page - 1) * limit);

    // Get connection status for each member
    const memberIds = allMembers.map(m => m.id);
    
    if (memberIds.length === 0) {
      return [];
    }

    const userConnections = await db
      .select({
        receiverId: connections.receiverId,
        requesterId: connections.requesterId,
        status: connections.status,
      })
      .from(connections)
      .where(
        or(
          and(eq(connections.requesterId, currentUserId), inArray(connections.receiverId, memberIds)),
          and(eq(connections.receiverId, currentUserId), inArray(connections.requesterId, memberIds))
        )
      );

    // Map the data together with simulated follows for now
    return allMembers.map(member => {
      const connection = userConnections.find(c => 
        (c.requesterId === currentUserId && c.receiverId === member.id) ||
        (c.receiverId === currentUserId && c.requesterId === member.id)
      );

      let connectionStatus: "none" | "pending" | "connected" = "none";
      if (connection) {
        connectionStatus = connection.status === "accepted" ? "connected" : "pending";
      }

      return {
        ...member,
        isFollowing: false, // Will implement follow system later
        connectionStatus,
        followersCount: 0,
        connectionsCount: 0,
      };
    });
  }

  async createFollow(followerId: string, followingId: string) {
    // For now, just return a success response
    // Will implement actual follow system when tables are created
    return { followerId, followingId, success: true };
  }

  async removeFollow(followerId: string, followingId: string) {
    // For now, just return success
    // Will implement actual follow system when tables are created
    return { success: true };
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    // For now, return just the user data without portfolio items
    // Portfolio items will be populated when tables are created
    return {
      ...user,
      experiences: [],
      educations: [],
      certifications: [],
      projects: [],
      skills: [],
      recommendations: [],
      languages: [],
      highlights: [],
    };
  }

  async getUserExperiences(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserEducations(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserCertifications(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserProjects(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserSkills(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserRecommendations(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserLanguages(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  async getUserHighlights(userId: string): Promise<any[]> {
    // Portfolio tables will be implemented later
    return [];
  }

  // Chat implementation
  async getConversations(userId: string): Promise<ConversationWithDetails[]> {
    const results = await db
      .select({
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
        description: conversations.description,
        createdBy: conversations.createdBy,
        lastMessageAt: conversations.lastMessageAt,
        isActive: conversations.isActive,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(and(
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true),
        eq(conversations.isActive, true)
      ))
      .orderBy(desc(conversations.lastMessageAt));

    // Get participants and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      results.map(async (conv) => {
        const participants = await db
          .select({
            id: conversationParticipants.id,
            conversationId: conversationParticipants.conversationId,
            userId: conversationParticipants.userId,
            role: conversationParticipants.role,
            joinedAt: conversationParticipants.joinedAt,
            lastReadAt: conversationParticipants.lastReadAt,
            isActive: conversationParticipants.isActive,
            user: {
              id: users.id,
              fullName: users.fullName,
              username: users.username,
              profilePicture: users.profilePicture,
            }
          })
          .from(conversationParticipants)
          .innerJoin(users, eq(conversationParticipants.userId, users.id))
          .where(and(
            eq(conversationParticipants.conversationId, conv.id),
            eq(conversationParticipants.isActive, true)
          ));

        const [lastMessage] = await db
          .select({
            id: messages.id,
            conversationId: messages.conversationId,
            senderId: messages.senderId,
            content: messages.content,
            messageType: messages.messageType,
            attachmentUrl: messages.attachmentUrl,
            replyToId: messages.replyToId,
            isEdited: messages.isEdited,
            editedAt: messages.editedAt,
            isDeleted: messages.isDeleted,
            deletedAt: messages.deletedAt,
            createdAt: messages.createdAt,
            updatedAt: messages.updatedAt,
            sender: {
              id: users.id,
              fullName: users.fullName,
              username: users.username,
            }
          })
          .from(messages)
          .innerJoin(users, eq(messages.senderId, users.id))
          .where(and(
            eq(messages.conversationId, conv.id),
            eq(messages.isDeleted, false)
          ))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...conv,
          participants,
          lastMessage,
        };
      })
    );

    return conversationsWithDetails;
  }

  async getConversation(conversationId: string, userId: string): Promise<ConversationWithDetails | undefined> {
    // Check if user is participant
    const participation = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true)
      ));

    if (participation.length === 0) {
      return undefined;
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.isActive, true)
      ));

    if (!conversation) {
      return undefined;
    }

    const participants = await db
      .select({
        id: conversationParticipants.id,
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        role: conversationParticipants.role,
        joinedAt: conversationParticipants.joinedAt,
        lastReadAt: conversationParticipants.lastReadAt,
        isActive: conversationParticipants.isActive,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.isActive, true)
      ));

    return {
      ...conversation,
      participants,
    };
  }

  async createDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Check if direct conversation already exists between these two users
    const existingConversations = await db
      .select({
        conversationId: conversationParticipants.conversationId,
        count: sql<number>`count(*)`
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(and(
        eq(conversations.type, "direct"),
        eq(conversations.isActive, true),
        or(
          eq(conversationParticipants.userId, userId1),
          eq(conversationParticipants.userId, userId2)
        )
      ))
      .groupBy(conversationParticipants.conversationId)
      .having(sql`count(*) = 2`);

    // Check if any of these conversations has both users
    for (const conv of existingConversations) {
      const participants = await db
        .select({ userId: conversationParticipants.userId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conv.conversationId));
      
      const userIds = participants.map(p => p.userId);
      if (userIds.includes(userId1) && userIds.includes(userId2)) {
        const [existingConv] = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conv.conversationId));
        return existingConv;
      }
    }

    // Create new conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        type: "direct",
        createdBy: userId1,
      })
      .returning();

    // Add both participants
    await db.insert(conversationParticipants).values([
      { conversationId: conversation.id, userId: userId1 },
      { conversationId: conversation.id, userId: userId2 },
    ]);

    return conversation;
  }

  async createGroupConversation(creatorId: string, name: string, description?: string): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        type: "group",
        name,
        description,
        createdBy: creatorId,
      })
      .returning();

    // Add creator as admin
    await db.insert(conversationParticipants).values({
      conversationId: conversation.id,
      userId: creatorId,
      role: "admin",
    });

    return conversation;
  }

  async addParticipantToConversation(conversationId: string, userId: string, role: string = "member"): Promise<ConversationParticipant> {
    const [participant] = await db
      .insert(conversationParticipants)
      .values({
        conversationId,
        userId,
        role,
      })
      .returning();

    return participant;
  }

  async getConversationMessages(
    conversationId: string, 
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<MessageWithDetails[]> {
    // Check if user is participant
    const participation = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true)
      ));

    if (participation.length === 0) {
      return [];
    }

    const results = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        attachmentUrl: messages.attachmentUrl,
        replyToId: messages.replyToId,
        isEdited: messages.isEdited,
        editedAt: messages.editedAt,
        isDeleted: messages.isDeleted,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  async sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        replyToId,
      })
      .returning();

    // Update conversation's last message time
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
  }

  async searchConversations(userId: string, query: string): Promise<ConversationWithDetails[]> {
    const results = await db
      .select({
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
        description: conversations.description,
        createdBy: conversations.createdBy,
        lastMessageAt: conversations.lastMessageAt,
        isActive: conversations.isActive,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(and(
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true),
        eq(conversations.isActive, true),
        or(
          ilike(conversations.name, `%${query}%`),
          ilike(conversations.description, `%${query}%`)
        )
      ))
      .orderBy(desc(conversations.lastMessageAt));

    // Get participants for each conversation
    const conversationsWithDetails = await Promise.all(
      results.map(async (conv) => {
        const participants = await db
          .select({
            id: conversationParticipants.id,
            conversationId: conversationParticipants.conversationId,
            userId: conversationParticipants.userId,
            role: conversationParticipants.role,
            joinedAt: conversationParticipants.joinedAt,
            lastReadAt: conversationParticipants.lastReadAt,
            isActive: conversationParticipants.isActive,
            user: {
              id: users.id,
              fullName: users.fullName,
              username: users.username,
              profilePicture: users.profilePicture,
            }
          })
          .from(conversationParticipants)
          .innerJoin(users, eq(conversationParticipants.userId, users.id))
          .where(and(
            eq(conversationParticipants.conversationId, conv.id),
            eq(conversationParticipants.isActive, true)
          ));

        return {
          ...conv,
          participants,
        };
      })
    );

    return conversationsWithDetails;
  }

  // Notifications
  async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationWithDetails[]> {
    const results = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        actionUrl: notifications.actionUrl,
        relatedEntityId: notifications.relatedEntityId,
        relatedEntityType: notifications.relatedEntityType,
        actorId: notifications.actorId,
        isRead: notifications.isRead,
        isDeleted: notifications.isDeleted,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        actor: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isDeleted, false)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return results;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    return result;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isDeleted, false)
      ));

    return Number(result?.count) || 0;
  }

  // Admin methods
  async getUserApplication(userId: string): Promise<any> {
    // First get the application
    const [application] = await db
      .select()
      .from(memberApplications)
      .where(eq(memberApplications.userId, userId))
      .orderBy(desc(memberApplications.createdAt));

    if (!application) {
      return null;
    }

    // Get the plan details separately
    const [plan] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, application.planId));

    // Get documents associated with this application
    const docs = await db
      .select({
        id: documents.id,
        fileName: documents.name,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .where(eq(documents.applicationId, application.id));

    return {
      ...application,
      plan: plan || null,
      documents: docs,
    };
  }

  async getAllApplications(): Promise<any[]> {
    return await db
      .select({
        id: memberApplications.id,
        userId: memberApplications.userId,
        planId: memberApplications.planId,
        status: memberApplications.status,
        paymentStatus: memberApplications.paymentStatus,
        experienceYears: memberApplications.experienceYears,
        isStudent: memberApplications.isStudent,
        adminNotes: memberApplications.adminNotes,
        reviewedBy: memberApplications.reviewedBy,
        reviewedAt: memberApplications.reviewedAt,
        createdAt: memberApplications.createdAt,
        updatedAt: memberApplications.updatedAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          username: users.username,
          city: users.city,
          state: users.state,
          area: users.area,
          phone: users.phone,
        },
        plan: {
          id: membershipPlans.id,
          name: membershipPlans.name,
          price: membershipPlans.price,
        }
      })
      .from(memberApplications)
      .leftJoin(users, eq(memberApplications.userId, users.id))
      .leftJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
      .orderBy(desc(memberApplications.createdAt));
  }

  async approveApplication(applicationId: string, adminId: string): Promise<void> {
    // Update application status
    await db
      .update(memberApplications)
      .set({
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memberApplications.id, applicationId));

    // Get application details
    const [application] = await db
      .select({
        userId: memberApplications.userId,
        planId: memberApplications.planId,
      })
      .from(memberApplications)
      .where(eq(memberApplications.id, applicationId));

    if (application) {
      // Update user status and plan
      await db
        .update(users)
        .set({
          isApproved: true,
          currentPlanId: application.planId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, application.userId));

      // Get plan name and update user
      const [plan] = await db
        .select({ name: membershipPlans.name })
        .from(membershipPlans)
        .where(eq(membershipPlans.id, application.planId));

      if (plan) {
        await db
          .update(users)
          .set({ planName: plan.name })
          .where(eq(users.id, application.userId));
      }
    }
  }

  async rejectApplication(applicationId: string, adminId: string, reason: string): Promise<void> {
    await db
      .update(memberApplications)
      .set({
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: reason,
        updatedAt: new Date(),
      })
      .where(eq(memberApplications.id, applicationId));
  }

  async banUser(userId: string, adminId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async unbanUser(userId: string, adminId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user's related data first due to foreign key constraints
    await db.delete(memberApplications).where(eq(memberApplications.userId, userId));
    await db.delete(posts).where(eq(posts.authorId, userId));
    await db.delete(likes).where(eq(likes.userId, userId));
    await db.delete(comments).where(eq(comments.authorId, userId));
    await db.delete(connections).where(or(eq(connections.requesterId, userId), eq(connections.receiverId, userId)));
    await db.delete(experiences).where(eq(experiences.userId, userId));
    await db.delete(educations).where(eq(educations.userId, userId));
    await db.delete(certifications).where(eq(certifications.userId, userId));
    await db.delete(projects).where(eq(projects.userId, userId));
    await db.delete(skills).where(eq(skills.userId, userId));
    await db.delete(recommendations).where(eq(recommendations.userId, userId));
    await db.delete(languages).where(eq(languages.userId, userId));
    await db.delete(highlights).where(eq(highlights.userId, userId));
    await db.delete(notifications).where(or(eq(notifications.recipientId, userId), eq(notifications.actorId, userId)));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Admin User methods
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return adminUser || undefined;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return adminUser || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return adminUser || undefined;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(user).returning();
    return created;
  }

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const [updated] = await db.update(adminUsers).set({ ...updates, updatedAt: new Date() }).where(eq(adminUsers.id, id)).returning();
    return updated || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).where(eq(adminUsers.isActive, true)).orderBy(asc(adminUsers.fullName));
  }
}

export const storage = new DatabaseStorage();
