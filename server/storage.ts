import { 
  users, 
  membershipPlans, 
  memberApplications, 
  documents,
  posts,
  comments,
  likes,
  connections,
  follows,
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
  groups,
  groupMembers,
  groupPosts,
  groupPostLikes,
  groupPostComments,
  forums,
  forumTopics,
  forumReplies,
  forumReplyLikes,
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
  type Follow,
  type InsertFollow,
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
  type ApplicationAppeal,
  type InsertApplicationAppeal,
  applicationAppeals,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type GroupPost,
  type InsertGroupPost,
  type GroupPostLike,
  type InsertGroupPostLike,
  type GroupPostComment,
  type InsertGroupPostComment,
  type GroupWithDetails,
  type SelectForum,
  type InsertForum,
  type SelectForumTopic,
  type InsertForumTopic,
  type SelectForumReply,
  type InsertForumReply,
  type InsertForumReplyLike,
  type SelectForumReplyLike,
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
  getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined>;
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
  updateMembershipPlan(planId: string, planData: Partial<InsertMembershipPlan>): Promise<MembershipPlan | null>;
  deleteMembershipPlan(planId: string): Promise<boolean>;
  toggleMembershipPlanStatus(planId: string, isActive: boolean): Promise<MembershipPlan | null>;
  getAllMembershipPlansWithCount(): Promise<any[]>;
  getMembershipPlanWithCount(planId: string): Promise<any | null>;

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

  // Application Appeals
  createApplicationAppeal(appeal: InsertApplicationAppeal): Promise<ApplicationAppeal>;
  getApplicationAppeals(applicationId: string): Promise<ApplicationAppeal[]>;
  getApplicationById(id: string): Promise<MemberApplication | undefined>;
  updateApplication(id: string, updates: Partial<MemberApplication>): Promise<MemberApplication | undefined>;

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
  getApprovedUsers(): Promise<User[]>;
  getUsersByPlan(planId: string): Promise<User[]>;
  getGroupMembers(groupId: string): Promise<User[]>;
  
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
  deleteUser(userId: string): Promise<boolean>;

  // Groups methods
  getAllGroups(): Promise<GroupWithDetails[]>;
  getGroupById(id: string): Promise<GroupWithDetails | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<void>;
  getUsersForGroupModeration(): Promise<Pick<User, 'id' | 'fullName' | 'username' | 'planName'>[]>;
  getAllActiveGroups(): Promise<GroupWithDetails[]>;
  joinGroup(groupId: string, userId: string): Promise<GroupMember>;
  getGroupMembership(groupId: string, userId: string): Promise<GroupMember | undefined>;
  getUserGroupMemberships(userId: string): Promise<GroupMember[]>;
  
  // Group moderation methods
  getPendingGroupRequests(groupId: string): Promise<GroupMember[]>;
  approveGroupRequest(requestId: string): Promise<GroupMember | undefined>;
  rejectGroupRequest(requestId: string): Promise<GroupMember | undefined>;
  isGroupModerator(groupId: string, userId: string): Promise<boolean>;
  
  // Group posts methods
  createGroupPost(postData: InsertGroupPost): Promise<GroupPost>;
  getGroupPosts(groupId: string): Promise<(GroupPost & { author: { id: string; fullName: string; username: string; profilePicture?: string } })[]>;
  deleteGroupPost(postId: string, authorId: string): Promise<boolean>;
  leaveGroup(groupId: string, userId: string): Promise<boolean>;
  getGroupMembers(groupId: string): Promise<any[]>;

  // Forums methods
  createForum(forumData: InsertForum): Promise<SelectForum>;
  getGroupForums(groupId: string): Promise<SelectForum[]>;
  getAllForums(): Promise<SelectForum[]>;
  getForum(forumId: string): Promise<SelectForum | undefined>;
  updateForum(forumId: string, updates: Partial<SelectForum>): Promise<SelectForum | undefined>;
  deleteForum(forumId: string): Promise<boolean>;
  getForumTopics(forumId: string): Promise<any[]>;
  getAllForumTopics(): Promise<any[]>;
  getAllGroupPosts(): Promise<any[]>;

  // Forum replies likes methods
  getForumReply(replyId: string): Promise<SelectForumReply | undefined>;
  likeForumReply(replyId: string, userId: string): Promise<SelectForumReplyLike>;
  unlikeForumReply(replyId: string, userId: string): Promise<boolean>;
  isReplyLikedByUser(replyId: string, userId: string): Promise<boolean>;

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.email, email),
        eq(users.username, username)
      )
    );
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
      const users_data = await db
        .select()
        .from(users)
        .where(eq(users.isApproved, true));
      console.log("Sample approved user data:", users_data[0]); // Debug log
      return users_data;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return [];
    }
  }

  async getApprovedUsers(): Promise<User[]> {
    try {
      const users_data = await db
        .select()
        .from(users)
        .where(and(eq(users.isApproved, true), eq(users.isActive, true)));
      return users_data;
    } catch (error) {
      console.error("Error in getApprovedUsers:", error);
      return [];
    }
  }

  async getUsersByPlan(planId: string): Promise<User[]> {
    try {
      const users_data = await db
        .select()
        .from(users)
        .where(and(
          eq(users.currentPlanId, planId),
          eq(users.isApproved, true)
        ));
      return users_data;
    } catch (error) {
      console.error("Error in getUsersByPlan:", error);
      return [];
    }
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    try {
      const users_data = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          city: users.city,
          state: users.state,
          area: users.area,
          position: users.position,
          company: users.company,
          phone: users.phone,
          linkedin: users.linkedin,
          github: users.github,
          website: users.website,
          bio: users.bio,
          gender: users.gender,
          profilePicture: users.profilePicture,
          coverPhoto: users.coverPhoto,
          aboutMe: users.aboutMe,
          professionalTitle: users.professionalTitle,
          isApproved: users.isApproved,
          isActive: users.isActive,
          role: users.role,
          currentPlanId: users.currentPlanId,
          planName: users.planName,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          subscriptionStatus: users.subscriptionStatus,
          connectionsCount: users.connectionsCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          password: users.password
        })
        .from(users)
        .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(users.isApproved, true)
        ));
      return users_data;
    } catch (error) {
      console.error("Error in getGroupMembers:", error);
      return [];
    }
  }

  async getFilteredUsers(filters: {
    search: string;
    planName: string;
    city: string;
    state: string;
    limit: number;
    offset: number;
  }): Promise<User[]> {
    try {
      let whereConditions = [eq(users.isApproved, true)];

      if (filters.search) {
        whereConditions.push(
          or(
            ilike(users.fullName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`),
            ilike(users.username, `%${filters.search}%`)
          ) as any
        );
      }

      if (filters.planName) {
        if (filters.planName === 'sem-nivel') {
          whereConditions.push(sql`${users.planName} IS NULL`);
        } else {
          whereConditions.push(eq(users.planName, filters.planName));
        }
      }

      if (filters.city) {
        whereConditions.push(ilike(users.city, `%${filters.city}%`));
      }

      if (filters.state) {
        whereConditions.push(eq(users.state, filters.state));
      }

      const users_data = await db
        .select()
        .from(users)
        .where(and(...whereConditions))
        .limit(filters.limit)
        .offset(filters.offset)
        .orderBy(users.fullName);

      return users_data;
    } catch (error) {
      console.error("Error in getFilteredUsers:", error);
      return [];
    }
  }

  async getUsersCount(filters: {
    search: string;
    planName: string;
    city: string;
    state: string;
  }): Promise<number> {
    try {
      let whereConditions = [eq(users.isApproved, true)];

      if (filters.search) {
        whereConditions.push(
          or(
            ilike(users.fullName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`),
            ilike(users.username, `%${filters.search}%`)
          ) as any
        );
      }

      if (filters.planName) {
        if (filters.planName === 'sem-nivel') {
          whereConditions.push(sql`${users.planName} IS NULL`);
        } else {
          whereConditions.push(eq(users.planName, filters.planName));
        }
      }

      if (filters.city) {
        whereConditions.push(ilike(users.city, `%${filters.city}%`));
      }

      if (filters.state) {
        whereConditions.push(eq(users.state, filters.state));
      }

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(...whereConditions));

      return result.count;
    } catch (error) {
      console.error("Error in getUsersCount:", error);
      return 0;
    }
  }

  async getAllMembers(): Promise<Pick<User, 'id' | 'fullName' | 'username' | 'planName'>[]> {
    try {
      const members = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          planName: sql<string | null>`NULL`.as('planName')
        })
        .from(users)
        .where(eq(users.isActive, true));
      
      return members;
    } catch (error) {
      console.error("Error in getAllMembers:", error);
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
      .values({
        ...insertPlan,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return plan;
  }

  async updateMembershipPlan(planId: string, planData: Partial<InsertMembershipPlan>): Promise<MembershipPlan | null> {
    const [plan] = await db.update(membershipPlans)
      .set({
        ...planData,
        updatedAt: new Date(),
      })
      .where(eq(membershipPlans.id, planId))
      .returning();
    return plan || null;
  }

  async deleteMembershipPlan(planId: string): Promise<boolean> {
    const result = await db.delete(membershipPlans).where(eq(membershipPlans.id, planId));
    return result.rowCount > 0;
  }

  async toggleMembershipPlanStatus(planId: string, isActive: boolean): Promise<MembershipPlan | null> {
    const [plan] = await db.update(membershipPlans)
      .set({ 
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(membershipPlans.id, planId))
      .returning();
    return plan || null;
  }

  async getAllMembershipPlansWithCount(): Promise<any[]> {
    // Get all plans with member count
    const plans = await db.select().from(membershipPlans);
    
    // Add current member count for each plan
    const plansWithCount = await Promise.all(
      plans.map(async (plan) => {
        const memberCount = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.currentPlanId, plan.id),
              eq(users.isApproved, true),
              eq(users.isActive, true)
            )
          );
        
        return {
          ...plan,
          currentMembers: memberCount[0]?.count || 0,
        };
      })
    );
    
    return plansWithCount;
  }

  async getMembershipPlanWithCount(planId: string): Promise<any | null> {
    const [plan] = await db.select().from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .limit(1);
    
    if (!plan) return null;
    
    // Add current member count
    const memberCount = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.currentPlanId, planId),
          eq(users.isApproved, true),
          eq(users.isActive, true)
        )
      );
    
    return {
      ...plan,
      currentMembers: memberCount[0]?.count || 0,
    };
  }

  // Member Applications
  async getMemberApplication(id: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.id, id));
    return application || undefined;
  }

  async getApplication(id: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.id, id));
    return application || undefined;
  }

  async rejectApplication(id: string, adminNotes: string, reviewedBy: string, requestDocuments?: boolean): Promise<MemberApplication | undefined> {
    try {
      const [updatedApplication] = await db
        .update(memberApplications)
        .set({
          status: requestDocuments ? 'documents_requested' : 'rejected',
          adminNotes,
          reviewedBy,
          reviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(memberApplications.id, id))
        .returning();
      
      return updatedApplication || undefined;
    } catch (error) {
      console.error("Error rejecting application:", error);
      throw error;
    }
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

  // Application Appeals
  async createApplicationAppeal(insertAppeal: InsertApplicationAppeal): Promise<ApplicationAppeal> {
    const [appeal] = await db
      .insert(applicationAppeals)
      .values(insertAppeal)
      .returning();
    return appeal;
  }

  async getApplicationAppeals(applicationId: string): Promise<ApplicationAppeal[]> {
    return await db
      .select()
      .from(applicationAppeals)
      .where(eq(applicationAppeals.applicationId, applicationId))
      .orderBy(desc(applicationAppeals.createdAt));
  }

  async getApplicationById(id: string): Promise<MemberApplication | undefined> {
    const [application] = await db.select().from(memberApplications).where(eq(memberApplications.id, id));
    return application || undefined;
  }

  async updateApplication(id: string, updates: Partial<MemberApplication>): Promise<MemberApplication | undefined> {
    const [application] = await db
      .update(memberApplications)
      .set(updates)
      .where(eq(memberApplications.id, id))
      .returning();
    return application || undefined;
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
    // Check if connection already exists and is not rejected
    const [existingConnection] = await db
      .select()
      .from(connections)
      .where(
        or(
          and(eq(connections.requesterId, requesterId), eq(connections.receiverId, receiverId)),
          and(eq(connections.requesterId, receiverId), eq(connections.receiverId, requesterId))
        )
      );

    if (existingConnection && existingConnection.status !== 'rejected') {
      throw new Error("Connection already exists");
    }

    // If there was a rejected connection, remove it first
    if (existingConnection && existingConnection.status === 'rejected') {
      await db.delete(connections).where(eq(connections.id, existingConnection.id));
    }

    const [connection] = await db
      .insert(connections)
      .values({ requesterId, receiverId })
      .returning();
    return connection;
  }

  async updateConnectionStatus(connectionId: string, status: string, userId: string): Promise<Connection | undefined> {
    // Only the receiver can accept/reject the connection
    if (status === 'rejected') {
      // If rejected, delete the connection completely so user can try again
      const [connection] = await db
        .delete(connections)
        .where(and(eq(connections.id, connectionId), eq(connections.receiverId, userId)))
        .returning();
      
      return connection || undefined;
    } else {
      // If accepted, update the status
      const [connection] = await db
        .update(connections)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(connections.id, connectionId), eq(connections.receiverId, userId)))
        .returning();
      
      return connection || undefined;
    }
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

  async getPendingConnectionRequests(userId: string) {
    const pendingRequests = await db
      .select({
        id: connections.id,
        requesterId: connections.requesterId,
        receiverId: connections.receiverId,
        status: connections.status,
        createdAt: connections.createdAt,
        requesterName: users.fullName,
        requesterUsername: users.username,
        requesterPlanName: users.planName,
        requesterProfilePicture: users.profilePicture,
        requesterArea: users.area,
        requesterPosition: users.position,
      })
      .from(connections)
      .innerJoin(users, eq(connections.requesterId, users.id))
      .where(
        and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        )
      )
      .orderBy(desc(connections.createdAt));

    return pendingRequests.map(req => ({
      id: req.id,
      requesterId: req.requesterId,
      receiverId: req.receiverId,
      status: req.status,
      createdAt: req.createdAt,
      requester: {
        id: req.requesterId,
        fullName: req.requesterName,
        username: req.requesterUsername,
        planName: req.requesterPlanName,
        profilePicture: req.requesterProfilePicture,
        area: req.requesterArea,
        position: req.requesterPosition,
      },
    }));
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
        id: connections.id,
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

    // Get follow status for each member
    const userFollows = await db
      .select({
        followingId: follows.followingId,
      })
      .from(follows)
      .where(and(
        eq(follows.followerId, currentUserId),
        inArray(follows.followingId, memberIds)
      ));

    // Map the data together
    return allMembers.map(member => {
      const connection = userConnections.find(c => 
        (c.requesterId === currentUserId && c.receiverId === member.id) ||
        (c.receiverId === currentUserId && c.requesterId === member.id)
      );

      let connectionStatus: "none" | "pending" | "connected" | "can_accept" = "none";
      let connectionId: string | null = null;
      
      if (connection) {
        connectionId = connection.id;
        if (connection.status === "accepted") {
          connectionStatus = "connected";
        } else if (connection.status === "pending") {
          // Check if current user is the receiver (can accept/reject)
          if (connection.receiverId === currentUserId) {
            connectionStatus = "can_accept"; // User received the request
          } else {
            connectionStatus = "pending"; // User sent the request
          }
        }
      }

      const isFollowing = userFollows.some(f => f.followingId === member.id);

      return {
        ...member,
        isFollowing,
        connectionStatus,
        connectionId,
        followersCount: 0,
        connectionsCount: 0,
      };
    });
  }

  async createFollow(followerId: string, followingId: string) {
    // Check if already following
    const existingFollow = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .limit(1);

    if (existingFollow.length > 0) {
      throw new Error("Already following this user");
    }

    // Create the follow relationship
    const newFollow = await db
      .insert(follows)
      .values({
        followerId,
        followingId,
      })
      .returning();

    return newFollow[0];
  }

  async removeFollow(followerId: string, followingId: string) {
    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

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
        openInNewTab: notifications.openInNewTab,
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

  async deleteUser(userId: string): Promise<boolean> {
    try {
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
      const result = await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
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

  // Groups methods
  async createGroup(groupData: InsertGroup): Promise<Group> {
    const [created] = await db.insert(groups).values(groupData).returning();
    
    // Automatically add the moderator as an approved member
    const memberId = `${created.moderatorId}-${created.id}-member`;
    await db.insert(groupMembers).values({
      id: memberId,
      groupId: created.id,
      userId: created.moderatorId,
      role: 'moderator',
      isActive: true,
      status: 'approved',
      joinedAt: new Date()
    });
    
    return created;
  }

  async getAllGroups(): Promise<GroupWithDetails[]> {
    const groupsData = await db
      .select({
        id: groups.id,
        title: groups.title,
        description: groups.description,
        profilePicture: groups.profilePicture,
        coverPhoto: groups.coverPhoto,
        moderatorId: groups.moderatorId,
        isPublic: groups.isPublic,
        isActive: groups.isActive,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        moderator: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          planName: users.planName,
        },
        creator: {
          id: sql<string>`creator.id`,
          fullName: sql<string>`creator.full_name`,
          username: sql<string>`creator.username`,
        }
      })
      .from(groups)
      .leftJoin(users, eq(groups.moderatorId, users.id))
      .leftJoin(sql`users as creator`, sql`groups.created_by = creator.id`)
      .where(eq(groups.isActive, true))
      .orderBy(desc(groups.createdAt));

    // Get member count for each group
    const groupsWithCounts = await Promise.all(
      groupsData.map(async (group) => {
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, group.id),
            eq(groupMembers.isActive, true),
            eq(groupMembers.status, 'approved')
          ));

        return {
          ...group,
          name: group.title, // Adicionar field name para compatibilidade
          memberCount: memberCount?.count || 0,
          _count: {
            members: memberCount?.count || 0,
          },
        };
      })
    );

    return groupsWithCounts;
  }

  async getGroupById(id: string): Promise<GroupWithDetails | undefined> {
    const [groupData] = await db
      .select({
        id: groups.id,
        title: groups.title,
        description: groups.description,
        profilePicture: groups.profilePicture,
        coverPhoto: groups.coverPhoto,
        moderatorId: groups.moderatorId,
        isPublic: groups.isPublic,
        isActive: groups.isActive,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        moderator: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          planName: users.planName,
        },
        creator: {
          id: sql<string>`creator.id`,
          fullName: sql<string>`creator.full_name`,
          username: sql<string>`creator.username`,
        }
      })
      .from(groups)
      .leftJoin(users, eq(groups.moderatorId, users.id))
      .leftJoin(sql`users as creator`, sql`groups.created_by = creator.id`)
      .where(and(
        eq(groups.id, id),
        eq(groups.isActive, true)
      ));

    if (!groupData) {
      return undefined;
    }

    // Get member count
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, id),
        eq(groupMembers.isActive, true)
      ));

    return {
      ...groupData,
      _count: {
        members: memberCount?.count || 0,
      },
    };
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined> {
    const [updated] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGroup(id: string): Promise<void> {
    await db
      .update(groups)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(groups.id, id));
  }

  async getUsersForGroupModeration(): Promise<Pick<User, 'id' | 'fullName' | 'username' | 'planName'>[]> {
    return await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        planName: users.planName,
      })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        eq(users.isApproved, true),
        or(
          eq(users.planName, 'Pleno'),
          eq(users.planName, 'Sênior'),
          eq(users.planName, 'Honra'),
          eq(users.planName, 'Diretivo')
        )
      ))
      .orderBy(asc(users.fullName));
  }

  // Groups methods for members
  async getAllActiveGroups(): Promise<GroupWithDetails[]> {
    const groupsData = await db
      .select({
        id: groups.id,
        title: groups.title,
        description: groups.description,
        profilePicture: groups.profilePicture,
        coverPhoto: groups.coverPhoto,
        moderatorId: groups.moderatorId,
        isPublic: groups.isPublic,
        isActive: groups.isActive,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        moderator: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          planName: users.planName,
        }
      })
      .from(groups)
      .leftJoin(users, eq(groups.moderatorId, users.id))
      .where(eq(groups.isActive, true))
      .orderBy(asc(groups.title));

    // Add member count for each group
    const groupsWithDetails = await Promise.all(
      groupsData.map(async (group) => {
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, group.id),
            eq(groupMembers.isActive, true),
            eq(groupMembers.status, 'approved')
          ));

        return {
          ...group,
          _count: {
            members: memberCount?.count || 0,
          },
        };
      })
    );

    return groupsWithDetails;
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    // Check if there's an existing record (might be inactive)
    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));

    if (existing.length > 0) {
      // Update existing record to pending
      const [membership] = await db
        .update(groupMembers)
        .set({
          status: 'pending',
          isActive: false,
          joinedAt: new Date()
        })
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ))
        .returning();
      
      return membership;
    } else {
      // Create new record
      const [membership] = await db
        .insert(groupMembers)
        .values({
          groupId,
          userId,
          role: 'member',
          status: 'pending',
          isActive: false,
          joinedAt: new Date()
        })
        .returning();

      return membership;
    }
  }

  async getGroupMembership(groupId: string, userId: string): Promise<GroupMember | undefined> {
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));

    return membership || undefined;
  }

  async getUserGroupMemberships(userId: string): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId))
      .orderBy(desc(groupMembers.joinedAt));
  }

  // Group moderation methods
  async getPendingGroupRequests(groupId: string): Promise<GroupMember[]> {
    return await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        status: groupMembers.status,
        joinedAt: groupMembers.joinedAt,
        isActive: groupMembers.isActive,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          planName: users.planName,
          profilePicture: users.profilePicture,
        }
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, 'pending')
      ))
      .orderBy(desc(groupMembers.joinedAt));
  }

  async approveGroupRequest(requestId: string): Promise<GroupMember | undefined> {
    const [updated] = await db
      .update(groupMembers)
      .set({ 
        status: 'approved',
        isActive: true,
        joinedAt: new Date()
      })
      .where(eq(groupMembers.id, requestId))
      .returning();
    
    return updated || undefined;
  }

  async rejectGroupRequest(requestId: string): Promise<GroupMember | undefined> {
    const [updated] = await db
      .update(groupMembers)
      .set({ 
        status: 'rejected',
        isActive: false
      })
      .where(eq(groupMembers.id, requestId))
      .returning();
    
    return updated || undefined;
  }

  // Group posts methods
  async createGroupPost(postData: InsertGroupPost): Promise<GroupPost> {
    const postId = `group-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [post] = await db
      .insert(groupPosts)
      .values({
        ...postData,
        id: postId
      })
      .returning();
    
    return post;
  }

  async getGroupPosts(groupId: string, userId?: string): Promise<any[]> {
    const posts = await db
      .select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        authorId: groupPosts.authorId,
        content: groupPosts.content,
        mediaType: groupPosts.mediaType,
        mediaUrl: groupPosts.mediaUrl,
        isActive: groupPosts.isActive,
        createdAt: groupPosts.createdAt,
        updatedAt: groupPosts.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(groupPosts)
      .leftJoin(users, eq(groupPosts.authorId, users.id))
      .where(and(
        eq(groupPosts.groupId, groupId),
        eq(groupPosts.isActive, true)
      ))
      .orderBy(desc(groupPosts.createdAt));

    // Add likes and comments count for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        // Count likes
        const likesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(groupPostLikes)
          .where(eq(groupPostLikes.postId, post.id));

        // Count comments
        const commentsCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(groupPostComments)
          .where(and(
            eq(groupPostComments.postId, post.id),
            eq(groupPostComments.isActive, true)
          ));

        // Check if current user liked this post
        let isLiked = false;
        if (userId) {
          const userLike = await db
            .select()
            .from(groupPostLikes)
            .where(and(
              eq(groupPostLikes.postId, post.id),
              eq(groupPostLikes.userId, userId)
            ))
            .limit(1);
          isLiked = userLike.length > 0;
        }

        return {
          ...post,
          likesCount: Number(likesCount[0]?.count || 0),
          commentsCount: Number(commentsCount[0]?.count || 0),
          isLiked
        };
      })
    );

    return postsWithCounts;
  }

  async updateGroupPost(postId: string, updateData: { content: string }): Promise<boolean> {
    const [updated] = await db
      .update(groupPosts)
      .set({ 
        content: updateData.content,
        updatedAt: new Date()
      })
      .where(eq(groupPosts.id, postId))
      .returning();
    
    return !!updated;
  }

  async deleteGroupPost(postId: string, authorId: string): Promise<boolean> {
    const [updated] = await db
      .update(groupPosts)
      .set({ isActive: false })
      .where(and(
        eq(groupPosts.id, postId),
        eq(groupPosts.authorId, authorId)
      ))
      .returning();
    
    return !!updated;
  }

  // Check if user is moderator of a group
  async isGroupModerator(groupId: string, userId: string): Promise<boolean> {
    const [group] = await db
      .select({ moderatorId: groups.moderatorId })
      .from(groups)
      .where(eq(groups.id, groupId));
    
    return group?.moderatorId === userId;
  }

  // Leave group
  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const [updated] = await db
      .update(groupMembers)
      .set({ 
        isActive: false,
        status: 'left'
      })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ))
      .returning();
    
    return !!updated;
  }

  async getFilteredApplications(filters: {
    search: string;
    planName: string;
    city: string;
    state: string;
    limit: number;
    offset: number;
  }): Promise<any[]> {
    try {
      let whereConditions = [eq(memberApplications.status, 'pending')];

      if (filters.search) {
        whereConditions.push(
          or(
            ilike(users.fullName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`)
          ) as any
        );
      }

      if (filters.planName) {
        if (filters.planName === 'sem-nivel') {
          whereConditions.push(sql`${membershipPlans.name} IS NULL`);
        } else {
          whereConditions.push(eq(membershipPlans.name, filters.planName));
        }
      }

      if (filters.city) {
        whereConditions.push(ilike(users.city, `%${filters.city}%`));
      }

      if (filters.state) {
        whereConditions.push(eq(users.state, filters.state));
      }

      const applications = await db
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
        .innerJoin(users, eq(memberApplications.userId, users.id))
        .innerJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
        .where(and(...whereConditions))
        .limit(filters.limit)
        .offset(filters.offset)
        .orderBy(memberApplications.createdAt);

      // Return applications with correct payment status
      return applications;
    } catch (error) {
      console.error("Error in getFilteredApplications:", error);
      return [];
    }
  }

  async getApplicationsCount(filters: {
    search: string;
    planName: string;
    city: string;
    state: string;
  }): Promise<number> {
    try {
      let whereConditions = [eq(memberApplications.status, 'pending')];

      if (filters.search) {
        whereConditions.push(
          or(
            ilike(users.fullName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`)
          ) as any
        );
      }

      if (filters.planName) {
        if (filters.planName === 'sem-nivel') {
          whereConditions.push(sql`${membershipPlans.name} IS NULL`);
        } else {
          whereConditions.push(eq(membershipPlans.name, filters.planName));
        }
      }

      if (filters.city) {
        whereConditions.push(ilike(users.city, `%${filters.city}%`));
      }

      if (filters.state) {
        whereConditions.push(eq(users.state, filters.state));
      }

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(memberApplications)
        .innerJoin(users, eq(memberApplications.userId, users.id))
        .innerJoin(membershipPlans, eq(memberApplications.planId, membershipPlans.id))
        .where(and(...whereConditions));

      return result.count;
    } catch (error) {
      console.error("Error in getApplicationsCount:", error);
      return 0;
    }
  }

  // Member moderation methods
  async banMember(memberId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, memberId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error banning member:", error);
      return false;
    }
  }

  async kickMember(memberId: string): Promise<boolean> {
    try {
      // For kick, we could implement a temporary suspension
      // For now, we'll just mark as inactive similar to ban
      const [updated] = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, memberId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error kicking member:", error);
      return false;
    }
  }

  // Get group members with user details
  async getGroupMembers(groupId: string): Promise<any[]> {
    try {
      const members = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          city: users.city,
          state: users.state,
          area: users.area,
          planName: users.planName,
          profilePicture: users.profilePicture,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.updatedAt, // Using updatedAt as proxy for lastLogin
          memberRole: groupMembers.role,
          joinedAt: groupMembers.joinedAt,
          memberStatus: groupMembers.status
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.isActive, true),
          eq(groupMembers.status, 'approved')
        ))
        .orderBy(groupMembers.joinedAt);

      return members;
    } catch (error) {
      console.error("Error fetching group members:", error);
      return [];
    }
  }

  async removeFromGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(groupMembers)
        .set({ 
          isActive: false,
          status: 'removed',
          updatedAt: new Date()
        })
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ))
        .returning();

      return !!result;
    } catch (error) {
      console.error("Error removing member from group:", error);
      return false;
    }
  }

  async banFromGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(groupMembers)
        .set({ 
          isActive: false,
          status: 'banned',
          updatedAt: new Date()
        })
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ))
        .returning();

      return !!result;
    } catch (error) {
      console.error("Error banning member from group:", error);
      return false;
    }
  }

  async isUserBannedFromGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.status, 'banned')
        ));

      return !!membership;
    } catch (error) {
      console.error("Error checking group ban status:", error);
      return false;
    }
  }

  // Remove member from group (for group moderation)
  async removeFromGroup(groupId: string, memberId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(groupMembers)
        .set({ 
          isActive: false,
          status: 'removed'
        })
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberId)
        ))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error removing member from group:", error);
      return false;
    }
  }

  // Forums methods
  async createForum(forumData: InsertForum): Promise<SelectForum> {
    const [forum] = await db
      .insert(forums)
      .values(forumData)
      .returning();
    
    return forum;
  }

  async getGroupForums(groupId: string): Promise<SelectForum[]> {
    return await db
      .select()
      .from(forums)
      .where(and(
        eq(forums.groupId, groupId),
        eq(forums.isActive, true)
      ))
      .orderBy(asc(forums.position), asc(forums.createdAt));
  }

  async getAllForums(): Promise<SelectForum[]> {
    return await db
      .select()
      .from(forums)
      .where(eq(forums.isActive, true))
      .orderBy(asc(forums.position), asc(forums.createdAt));
  }

  async getForum(forumId: string): Promise<SelectForum | undefined> {
    const [forum] = await db
      .select()
      .from(forums)
      .where(eq(forums.id, forumId));
    
    return forum || undefined;
  }

  async updateForum(forumId: string, updates: Partial<SelectForum>): Promise<SelectForum | undefined> {
    const [forum] = await db
      .update(forums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forums.id, forumId))
      .returning();
    
    return forum || undefined;
  }

  async deleteForum(forumId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(forums)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(forums.id, forumId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error deleting forum:", error);
      return false;
    }
  }

  // Forum topics methods
  async createForumTopic(topicData: InsertForumTopic): Promise<SelectForumTopic> {
    const topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [topic] = await db
      .insert(forumTopics)
      .values({
        ...topicData,
        id: topicId
      })
      .returning();
    
    return topic;
  }

  async getForumTopics(forumId: string): Promise<any[]> {
    const topics = await db
      .select({
        id: forumTopics.id,
        forumId: forumTopics.forumId,
        authorId: forumTopics.authorId,
        title: forumTopics.title,
        content: forumTopics.content,
        isPinned: forumTopics.isPinned,
        isLocked: forumTopics.isLocked,
        viewCount: forumTopics.viewCount,
        lastReplyAt: forumTopics.lastReplyAt,
        createdAt: forumTopics.createdAt,
        updatedAt: forumTopics.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        },
        lastReplyBy: {
          id: sql`last_reply_user.id`,
          fullName: sql`last_reply_user.full_name`,
          username: sql`last_reply_user.username`,
        }
      })
      .from(forumTopics)
      .leftJoin(users, eq(forumTopics.authorId, users.id))
      .leftJoin(sql`users as last_reply_user`, sql`forum_topics.last_reply_by_id = last_reply_user.id`)
      .where(eq(forumTopics.forumId, forumId))
      .orderBy(desc(forumTopics.isPinned), desc(forumTopics.lastReplyAt));

    // Add reply count for each topic
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const replyCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumReplies)
          .where(and(
            eq(forumReplies.topicId, topic.id),
            eq(forumReplies.isVisible, true)
          ));

        return {
          ...topic,
          _count: {
            replies: Number(replyCount[0]?.count || 0)
          }
        };
      })
    );

    return topicsWithCounts;
  }

  async getAllForumTopics(): Promise<any[]> {
    const topics = await db
      .select({
        id: forumTopics.id,
        forumId: forumTopics.forumId,
        authorId: forumTopics.authorId,
        title: forumTopics.title,
        content: forumTopics.content,
        isPinned: forumTopics.isPinned,
        isLocked: forumTopics.isLocked,
        viewCount: forumTopics.viewCount,
        views: forumTopics.viewCount,
        lastReplyAt: forumTopics.lastReplyAt,
        createdAt: forumTopics.createdAt,
        updatedAt: forumTopics.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        },
        authorName: users.fullName
      })
      .from(forumTopics)
      .leftJoin(users, eq(forumTopics.authorId, users.id))
      .orderBy(desc(forumTopics.createdAt));

    // Add reply count for each topic
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const replyCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumReplies)
          .where(and(
            eq(forumReplies.topicId, topic.id),
            eq(forumReplies.isVisible, true)
          ));

        return {
          ...topic,
          replies: Number(replyCount[0]?.count || 0),
          _count: {
            replies: Number(replyCount[0]?.count || 0)
          }
        };
      })
    );

    return topicsWithCounts;
  }

  async getAllGroupPosts(): Promise<any[]> {
    const posts = await db
      .select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        authorId: groupPosts.authorId,
        content: groupPosts.content,
        mediaType: groupPosts.mediaType,
        mediaUrl: groupPosts.mediaUrl,
        isActive: groupPosts.isActive,
        createdAt: groupPosts.createdAt,
        updatedAt: groupPosts.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(groupPosts)
      .leftJoin(users, eq(groupPosts.authorId, users.id))
      .where(eq(groupPosts.isActive, true))
      .orderBy(desc(groupPosts.createdAt));

    return posts;
  }

  async getForumTopic(topicId: string): Promise<any | undefined> {
    const [topic] = await db
      .select({
        id: forumTopics.id,
        forumId: forumTopics.forumId,
        authorId: forumTopics.authorId,
        title: forumTopics.title,
        content: forumTopics.content,
        isPinned: forumTopics.isPinned,
        isLocked: forumTopics.isLocked,
        viewCount: forumTopics.viewCount,
        lastReplyAt: forumTopics.lastReplyAt,
        createdAt: forumTopics.createdAt,
        updatedAt: forumTopics.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(forumTopics)
      .leftJoin(users, eq(forumTopics.authorId, users.id))
      .where(eq(forumTopics.id, topicId));

    if (!topic) return undefined;

    // Get reply count
    const replyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumReplies)
      .where(and(
        eq(forumReplies.topicId, topic.id),
        eq(forumReplies.isVisible, true)
      ));

    return {
      ...topic,
      _count: {
        replies: Number(replyCount[0]?.count || 0)
      }
    };
  }

  async incrementTopicViewCount(topicId: string): Promise<void> {
    await db
      .update(forumTopics)
      .set({ 
        viewCount: sql`${forumTopics.viewCount} + 1`
      })
      .where(eq(forumTopics.id, topicId));
  }

  async updateTopicActivity(topicId: string, lastReplyById: string): Promise<void> {
    await db
      .update(forumTopics)
      .set({ 
        lastReplyAt: new Date(),
        lastReplyById: lastReplyById
      })
      .where(eq(forumTopics.id, topicId));
  }

  async lockTopic(topicId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(forumTopics)
        .set({ isLocked: true })
        .where(eq(forumTopics.id, topicId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error locking topic:", error);
      return false;
    }
  }

  async unlockTopic(topicId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(forumTopics)
        .set({ isLocked: false })
        .where(eq(forumTopics.id, topicId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error unlocking topic:", error);
      return false;
    }
  }

  // Forum replies methods
  async createForumReply(replyData: InsertForumReply): Promise<SelectForumReply> {
    const replyId = `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [reply] = await db
      .insert(forumReplies)
      .values({
        ...replyData,
        id: replyId
      })
      .returning();
    
    // Update topic activity
    await this.updateTopicActivity(replyData.topicId, replyData.authorId);
    
    return reply;
  }

  async getTopicReplies(topicId: string, userId?: string): Promise<any[]> {
    const replies = await db
      .select({
        id: forumReplies.id,
        topicId: forumReplies.topicId,
        authorId: forumReplies.authorId,
        content: forumReplies.content,
        replyToId: forumReplies.replyToId,
        isVisible: forumReplies.isVisible,
        createdAt: forumReplies.createdAt,
        updatedAt: forumReplies.updatedAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profilePicture: users.profilePicture,
        }
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(and(
        eq(forumReplies.topicId, topicId),
        eq(forumReplies.isVisible, true)
      ))
      .orderBy(asc(forumReplies.createdAt));

    // Add like counts and user like status
    const repliesWithLikes = await Promise.all(
      replies.map(async (reply) => {
        // Count likes for this reply
        const likesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumReplyLikes)
          .where(eq(forumReplyLikes.replyId, reply.id));

        // Check if current user liked this reply
        let isLiked = false;
        if (userId) {
          const userLike = await db
            .select()
            .from(forumReplyLikes)
            .where(and(
              eq(forumReplyLikes.replyId, reply.id),
              eq(forumReplyLikes.userId, userId)
            ));
          isLiked = userLike.length > 0;
        }

        return {
          ...reply,
          isLiked,
          _count: {
            likes: Number(likesCount[0]?.count || 0)
          }
        };
      })
    );

    return repliesWithLikes;
  }

  async getTopicParticipantsCount(topicId: string): Promise<number> {
    const participantsQuery = await db
      .selectDistinct({ authorId: forumReplies.authorId })
      .from(forumReplies)
      .where(and(
        eq(forumReplies.topicId, topicId),
        eq(forumReplies.isVisible, true)
      ));

    // Include the topic author
    const topic = await this.getForumTopic(topicId);
    const uniqueParticipants = new Set([
      ...(topic ? [topic.authorId] : []),
      ...participantsQuery.map(p => p.authorId)
    ]);

    return uniqueParticipants.size;
  }

  // Group post likes and comments methods
  async toggleGroupPostLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      // Check if like exists
      const existingLike = await db
        .select()
        .from(groupPostLikes)
        .where(and(eq(groupPostLikes.postId, postId), eq(groupPostLikes.userId, userId)))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike - remove like
        await db
          .delete(groupPostLikes)
          .where(and(eq(groupPostLikes.postId, postId), eq(groupPostLikes.userId, userId)));
      } else {
        // Like - add like
        await db
          .insert(groupPostLikes)
          .values({ postId, userId });
      }

      // Count total likes
      const likesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupPostLikes)
        .where(eq(groupPostLikes.postId, postId));

      return {
        liked: existingLike.length === 0,
        likesCount: Number(likesCount[0]?.count || 0)
      };
    } catch (error) {
      console.error("Error toggling group post like:", error);
      throw error;
    }
  }

  async getGroupPostComments(postId: string): Promise<any[]> {
    try {
      const comments = await db
        .select({
          id: groupPostComments.id,
          content: groupPostComments.content,
          createdAt: groupPostComments.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            username: users.username,
            profilePicture: users.profilePicture
          }
        })
        .from(groupPostComments)
        .innerJoin(users, eq(groupPostComments.authorId, users.id))
        .where(and(
          eq(groupPostComments.postId, postId),
          eq(groupPostComments.isActive, true)
        ))
        .orderBy(asc(groupPostComments.createdAt));

      return comments;
    } catch (error) {
      console.error("Error fetching group post comments:", error);
      throw error;
    }
  }

  async createGroupPostComment(commentData: InsertGroupPostComment): Promise<GroupPostComment> {
    try {
      const [comment] = await db
        .insert(groupPostComments)
        .values(commentData)
        .returning();
      
      return comment;
    } catch (error) {
      console.error("Error creating group post comment:", error);
      throw error;
    }
  }

  async getGroupPostCommentWithAuthor(commentId: string): Promise<any> {
    try {
      const [comment] = await db
        .select({
          id: groupPostComments.id,
          content: groupPostComments.content,
          createdAt: groupPostComments.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            username: users.username,
            profilePicture: users.profilePicture
          }
        })
        .from(groupPostComments)
        .innerJoin(users, eq(groupPostComments.authorId, users.id))
        .where(eq(groupPostComments.id, commentId));

      return comment;
    } catch (error) {
      console.error("Error fetching group post comment with author:", error);
      throw error;
    }
  }

  // Forum reply likes methods
  async getForumReply(replyId: string): Promise<SelectForumReply | undefined> {
    const [reply] = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.id, replyId));
    
    return reply || undefined;
  }

  async likeForumReply(replyId: string, userId: string): Promise<SelectForumReplyLike> {
    // Check if already liked
    const existingLike = await db
      .select()
      .from(forumReplyLikes)
      .where(and(
        eq(forumReplyLikes.replyId, replyId),
        eq(forumReplyLikes.userId, userId)
      ));

    if (existingLike.length > 0) {
      // Remove like (unlike)
      await db
        .delete(forumReplyLikes)
        .where(and(
          eq(forumReplyLikes.replyId, replyId),
          eq(forumReplyLikes.userId, userId)
        ));
      
      return existingLike[0];
    } else {
      // Add like
      const [like] = await db
        .insert(forumReplyLikes)
        .values({
          replyId,
          userId
        })
        .returning();
      
      return like;
    }
  }

  async unlikeForumReply(replyId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(forumReplyLikes)
      .where(and(
        eq(forumReplyLikes.replyId, replyId),
        eq(forumReplyLikes.userId, userId)
      ));
    
    return result.rowCount > 0;
  }

  async isReplyLikedByUser(replyId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(forumReplyLikes)
      .where(and(
        eq(forumReplyLikes.replyId, replyId),
        eq(forumReplyLikes.userId, userId)
      ));
    
    return !!like;
  }
}

export const storage = new DatabaseStorage();
