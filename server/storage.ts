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
  type InsertHighlight
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

  // Membership Plans
  getMembershipPlans(): Promise<MembershipPlan[]>;
  getMembershipPlan(id: string): Promise<MembershipPlan | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;

  // Member Applications
  getMemberApplication(id: string): Promise<MemberApplication | undefined>;
  getMemberApplicationsByUser(userId: string): Promise<MemberApplication[]>;
  getPendingApplications(): Promise<(MemberApplication & { user: User; plan: MembershipPlan })[]>;
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
      .where(and(eq(users.username, username), eq(memberApplications.status, 'approved')));
    
    return result || undefined;
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
}

export const storage = new DatabaseStorage();
