import { users, membershipPlans, memberApplications, documents, type User, type InsertUser, type MembershipPlan, type InsertMembershipPlan, type MemberApplication, type InsertMemberApplication, type Document, type InsertDocument } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
