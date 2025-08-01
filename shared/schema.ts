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
  position: text("position"),
  company: text("company"),
  phone: text("phone"),
  linkedin: text("linkedin"),
  github: text("github"),
  website: text("website"),
  bio: text("bio"),
  gender: text("gender"),
  profilePicture: text("profile_picture"),
  coverPhoto: text("cover_photo"),
  aboutMe: text("about_me"),
  professionalTitle: text("professional_title"),
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

// Profile-related tables
export const experiences = pgTable("experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM format
  endDate: text("end_date"), // null means current
  description: text("description"),
  isCurrentPosition: boolean("is_current_position").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const educations = pgTable("educations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institution: text("institution").notNull(),
  course: text("course").notNull(),
  degree: text("degree"), // Tecnólogo, Bacharelado, Pós, etc.
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  issueDate: text("issue_date").notNull(),
  expirationDate: text("expiration_date"),
  credentialId: text("credential_id"),
  credentialUrl: text("credential_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  technologies: json("technologies").$type<string[]>(),
  projectUrl: text("project_url"),
  repositoryUrl: text("repository_url"),
  teamMembers: text("team_members"),
  client: text("client"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  category: text("category"), // technical, soft, etc.
  proficiencyLevel: text("proficiency_level"), // beginner, intermediate, advanced, expert
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileUserId: varchar("profile_user_id").references(() => users.id).notNull(), // who receives the recommendation
  recommenderUserId: varchar("recommender_user_id").references(() => users.id).notNull(), // who gives the recommendation
  message: text("message").notNull(),
  relationship: text("relationship"), // colleague, manager, client, etc.
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const languages = pgTable("languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  language: text("language").notNull(),
  proficiency: text("proficiency").notNull(), // Básico, Intermediário, Avançado, Fluente, Nativo
  createdAt: timestamp("created_at").defaultNow(),
});

export const highlights = pgTable("highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  imageUrl: text("image_url"),
  type: text("type").notNull(), // article, project, video, course
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat system tables
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("direct"), // direct, group
  name: text("name"), // only for group conversations
  description: text("description"), // only for group conversations
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // member, admin
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, system
  attachmentUrl: text("attachment_url"),
  replyToId: varchar("reply_to_id").references(() => messages.id),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
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
  conversationParticipants: many(conversationParticipants),
  sentMessages: many(messages),
  createdConversations: many(conversations),
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

// Chat relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
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

// Profile schemas
export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(educations).omit({
  id: true,
  createdAt: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  status: true,
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  createdAt: true,
});

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
});

// Chat insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
  isActive: true,
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
  lastReadAt: true,
  isActive: true,
  role: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true,
  editedAt: true,
  isDeleted: true,
  deletedAt: true,
  messageType: true,
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

// Profile types
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Education = typeof educations.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;

// Chat types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Extended chat types
export type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & { user: Pick<User, 'id' | 'fullName' | 'username' | 'profilePicture'> })[];
  lastMessage?: Message & { sender: Pick<User, 'id' | 'fullName' | 'username'> };
  unreadCount?: number;
};

export type MessageWithDetails = Message & {
  sender: Pick<User, 'id' | 'fullName' | 'username' | 'profilePicture'>;
  replyTo?: Message & { sender: Pick<User, 'id' | 'fullName' | 'username'> };
};
