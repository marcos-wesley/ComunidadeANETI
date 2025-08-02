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
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"), // active, canceled, past_due, etc.
  connectionsCount: integer("connections_count").default(0),
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
  isRecurring: boolean("is_recurring").default(false),
  billingPeriod: text("billing_period").default("monthly"), // monthly, yearly, one_time
  features: json("features").$type<string[]>().default([]),
  requirements: json("requirements").$type<string[]>().default([]),
  benefits: json("benefits").$type<string[]>().default([]),
  badgeImageUrl: text("badge_image_url"),
  badgeColor: text("badge_color").default("#3B82F6"),
  rules: text("rules"), // validation rules description
  isActive: boolean("is_active").default(true),
  isAvailableForRegistration: boolean("is_available_for_registration").default(true),
  priority: integer("priority").default(5), // 1-10 for ordering
  maxMembers: integer("max_members"), // null = unlimited
  stripePriceId: varchar("stripe_price_id"), // Stripe price ID for subscriptions
  stripeProductId: varchar("stripe_product_id"), // Stripe product ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const memberApplications = pgTable("member_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => membershipPlans.id).notNull(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, gratuito
  paymentId: text("payment_id"),
  mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
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
  replyToId: varchar("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups system
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  profilePicture: text("profile_picture"),
  coverPhoto: text("cover_photo"),
  moderatorId: varchar("moderator_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true), // true = público, false = privado (só membros)
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // member, moderator, admin
  status: text("status").default("pending"), // pending, approved, rejected
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Group posts - only moderators can post
export const groupPosts = pgTable("group_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mediaType: text("media_type"), // text, image, video
  mediaUrl: text("media_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupPostLikes = pgTable("group_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => groupPosts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupPostComments = pgTable("group_post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => groupPosts.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mentionedUsers: json("mentioned_users").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forums system within groups
export const forums = pgTable("forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  color: text("color").default("#3B82F6"), // Default blue color
  position: integer("position").default(0), // For ordering forums
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true), // If false, only group members can see
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumTopics = pgTable("forum_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forumId: varchar("forum_id").references(() => forums.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  lastReplyAt: timestamp("last_reply_at").defaultNow(),
  lastReplyById: varchar("last_reply_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").references(() => forumTopics.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  replyToId: varchar("reply_to_id"), // For nested replies
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplyLikes = pgTable("forum_reply_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  replyId: varchar("reply_id").references(() => forumReplies.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // who receives the notification
  type: text("type").notNull(), // like, comment, message, connection_request, connection_accepted, post_mention, comment_mention, application_approved, application_rejected
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  relatedEntityId: varchar("related_entity_id"), // ID of the related post, comment, user, etc.
  relatedEntityType: text("related_entity_type"), // post, comment, user, application, etc.
  actorId: varchar("actor_id").references(() => users.id), // who performed the action that triggered the notification
  isRead: boolean("is_read").default(false),
  isDeleted: boolean("is_deleted").default(false),
  metadata: json("metadata").$type<Record<string, any>>(), // additional data for the notification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin notification broadcasts table
export const adminNotificationBroadcasts = pgTable("admin_notification_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(), // who sent the notification
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // optional link
  targetType: text("target_type").notNull(), // 'all_members', 'group_members', 'plan_members', 'specific_users'
  targetValue: text("target_value"), // group ID, plan ID, or comma-separated user IDs
  sentToCount: integer("sent_to_count").default(0), // how many users received this
  priority: text("priority").default("normal"), // low, normal, high
  scheduledFor: timestamp("scheduled_for"), // for future scheduling
  status: text("status").default("sent"), // draft, scheduled, sent, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application appeals/responses table
export const applicationAppeals = pgTable("application_appeals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => memberApplications.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'appeal' or 'response'
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, reviewed, accepted, rejected
  adminResponse: text("admin_response"),
  reviewedBy: varchar("reviewed_by").references(() => adminUsers.id),
  reviewedAt: timestamp("reviewed_at"),
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
  receivedNotifications: many(notifications, { relationName: "user" }),
  triggeredNotifications: many(notifications, { relationName: "actor" }),
  sentBroadcasts: many(adminNotificationBroadcasts),
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
  appeals: many(applicationAppeals),
}));

export const applicationAppealsRelations = relations(applicationAppeals, ({ one }) => ({
  application: one(memberApplications, {
    fields: [applicationAppeals.applicationId],
    references: [memberApplications.id],
  }),
  user: one(users, {
    fields: [applicationAppeals.userId],
    references: [users.id],
  }),
  reviewer: one(adminUsers, {
    fields: [applicationAppeals.reviewedBy],
    references: [adminUsers.id],
  }),
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

export const adminNotificationBroadcastsRelations = relations(adminNotificationBroadcasts, ({ one }) => ({
  admin: one(users, {
    fields: [adminNotificationBroadcasts.adminId],
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "user",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "actor",
  }),
}));

// Groups relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  moderator: one(users, {
    fields: [groups.moderatorId],
    references: [users.id],
    relationName: "moderator",
  }),
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const groupPostsRelations = relations(groupPosts, ({ one }) => ({
  group: one(groups, {
    fields: [groupPosts.groupId],
    references: [groups.id],
  }),
  author: one(users, {
    fields: [groupPosts.authorId],
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

// Groups types
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupPost = typeof groupPosts.$inferSelect;
export type GroupPostLike = typeof groupPostLikes.$inferSelect;
export type GroupPostComment = typeof groupPostComments.$inferSelect;
export type InsertGroupPost = z.infer<typeof insertGroupPostSchema>;
export type InsertGroupPostLike = z.infer<typeof insertGroupPostLikeSchema>;
export type InsertGroupPostComment = z.infer<typeof insertGroupPostCommentSchema>;

// Forums Schema and Types
export const insertForumSchema = createInsertSchema(forums).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertForum = z.infer<typeof insertForumSchema>;
export type SelectForum = typeof forums.$inferSelect;

// Forum Topics Schema and Types
export const insertForumTopicSchema = createInsertSchema(forumTopics).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertForumTopic = z.infer<typeof insertForumTopicSchema>;
export type SelectForumTopic = typeof forumTopics.$inferSelect;

// Forum Replies Schema and Types
export const insertForumReplySchema = createInsertSchema(forumReplies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type SelectForumReply = typeof forumReplies.$inferSelect;

export const insertForumReplyLikeSchema = createInsertSchema(forumReplyLikes).omit({ id: true, createdAt: true });

// Admin notification broadcast schema
export const insertAdminNotificationBroadcastSchema = createInsertSchema(adminNotificationBroadcasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentToCount: true,
  status: true,
});

// Admin notification broadcast types
export type AdminNotificationBroadcast = typeof adminNotificationBroadcasts.$inferSelect;
export type InsertAdminNotificationBroadcast = z.infer<typeof insertAdminNotificationBroadcastSchema>;

export type InsertForumReplyLike = z.infer<typeof insertForumReplyLikeSchema>;
export type SelectForumReplyLike = typeof forumReplyLikes.$inferSelect;

export type GroupWithDetails = Group & {
  moderator: Pick<User, 'id' | 'fullName' | 'username' | 'planName'>;
  creator: Pick<User, 'id' | 'fullName' | 'username'>;
  _count: {
    members: number;
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

// Groups insert schemas
export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertGroupPostSchema = createInsertSchema(groupPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertGroupPostLikeSchema = createInsertSchema(groupPostLikes).omit({
  id: true,
  createdAt: true,
});

export const insertGroupPostCommentSchema = createInsertSchema(groupPostComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
  isDeleted: true,
});

export const insertApplicationAppealSchema = createInsertSchema(applicationAppeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  adminResponse: true,
});

// Main types
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

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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

// Extended notification types
export type NotificationWithDetails = Notification & {
  actor?: Pick<User, 'id' | 'fullName' | 'username' | 'profilePicture'>;
};

// Admin users table - separate from regular members
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  isActive: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Application appeal types
export type ApplicationAppeal = typeof applicationAppeals.$inferSelect;
export type InsertApplicationAppeal = z.infer<typeof insertApplicationAppealSchema>;
