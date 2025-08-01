import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  area: text("area").notNull(),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  role: text("role").default("member"), // member, admin
  currentPlanId: varchar("current_plan_id").references(() => membershipPlans.id),
  planName: text("plan_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const membershipPlans = pgTable("membership_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // price in cents
  minExperienceYears: integer("min_experience_years").default(0),
  maxExperienceYears: integer("max_experience_years"),
  requiresPayment: boolean("requires_payment").default(false),
  features: json("features").$type<string[]>(),
  rules: text("rules"), // validation rules description
  isActive: boolean("is_active").default(true),
  isAvailableForRegistration: boolean("is_available_for_registration").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberApplications = pgTable("member_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => membershipPlans.id).notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, gratuito
  paymentId: text("payment_id"),
  mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
  experienceYears: integer("experience_years"),
  isStudent: boolean("is_student").default(false),
  studentProof: text("student_proof"), // path to student documentation
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => memberApplications.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // identity, experience, student
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Social Feed Tables
export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // pending, accepted, rejected, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mediaType: text("media_type"), // text, image, video
  mediaUrl: text("media_url"), // object storage path for media files
  visibility: text("visibility").default("connections"), // global, connections
  mentionedUsers: json("mentioned_users").$type<string[]>().default([]), // array of user IDs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mentionedUsers: json("mentioned_users").$type<string[]>().default([]), // array of user IDs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(memberApplications),
  reviewedApplications: many(memberApplications),
  posts: many(posts),
  likes: many(likes),
  comments: many(comments),
  sentConnectionRequests: many(connections, { relationName: "requester" }),
  receivedConnectionRequests: many(connections, { relationName: "receiver" }),
}));

export const memberApplicationsRelations = relations(memberApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [memberApplications.userId],
    references: [users.id],
  }),
  plan: one(membershipPlans, {
    fields: [memberApplications.planId],
    references: [membershipPlans.id],
  }),
  reviewer: one(users, {
    fields: [memberApplications.reviewedBy],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  applications: many(memberApplications),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(memberApplications, {
    fields: [documents.applicationId],
    references: [memberApplications.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  requester: one(users, {
    fields: [connections.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  receiver: one(users, {
    fields: [connections.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isActive: true,
  role: true,
});

export const insertMemberApplicationSchema = createInsertSchema(memberApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  paymentStatus: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type MemberApplication = typeof memberApplications.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Social Feed Types
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

// Extended types with relations
export type PostWithDetails = Post & {
  author: Pick<User, 'id' | 'fullName' | 'username'>;
  likes: (Like & { user: Pick<User, 'id' | 'fullName' | 'username'> })[];
  comments: (Comment & { author: Pick<User, 'id' | 'fullName' | 'username'> })[];
  _count: {
    likes: number;
    comments: number;
  };
};

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MemberApplication = typeof memberApplications.$inferSelect;
export type InsertMemberApplication = z.infer<typeof insertMemberApplicationSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
