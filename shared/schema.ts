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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const membershipPlans = pgTable("membership_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // price in cents
  features: json("features").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberApplications = pgTable("member_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => membershipPlans.id).notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  paymentId: text("payment_id"),
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
  type: text("type").notNull(), // identity, experience
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(memberApplications),
  reviewedApplications: many(memberApplications),
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
