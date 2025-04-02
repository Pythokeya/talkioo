import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for user age groups
export const ageGroupEnum = pgEnum('age_group', ['under13', '13-17', '18plus']);

// Enum for message types
export const messageTypeEnum = pgEnum('message_type', ['text', 'sticker', 'gif', 'voice']);

// Enum for friend request status
export const friendRequestStatusEnum = pgEnum('friend_request_status', ['pending', 'accepted', 'declined']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  uniqueId: text("unique_id").notNull().unique(),
  password: text("password").notNull(),
  ageGroup: ageGroupEnum("age_group").notNull(),
  profilePicture: text("profile_picture"),
  isOnline: boolean("is_online").default(false),
  hasParentalApproval: boolean("has_parental_approval").default(false),
  lastSeen: timestamp("last_seen", { mode: 'date' }),
});

// Friend relationships table
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: friendRequestStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

// Chat groups table
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  groupIcon: text("group_icon"),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at", { mode: 'date' }).defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  groupId: integer("group_id").references(() => chatGroups.id),
  content: text("content").notNull(),
  type: messageTypeEnum("type").notNull().default('text'),
  sentAt: timestamp("sent_at", { mode: 'date' }).defaultNow(),
  isRead: boolean("is_read").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at", { mode: 'date' }),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at", { mode: 'date' }),
});

// Message reactions table
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

// Blocked users table
export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  chatTheme: text("chat_theme").default('default'),
  notificationsEnabled: boolean("notifications_enabled").default(true),
});

// Create Zod schemas for insertions

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true });
export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, joinedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  sentAt: true, 
  isRead: true, 
  isEdited: true, 
  editedAt: true, 
  isDeleted: true, 
  deletedAt: true 
});
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({ id: true, createdAt: true });
export const insertBlockedUserSchema = createInsertSchema(blockedUsers).omit({ id: true, createdAt: true });
export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({ id: true });

// Define types based on schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type ChatGroup = typeof chatGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;

// Schemas for register and login
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  uniqueId: z.string().min(3, "Unique ID must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  ageGroup: z.enum(["under13", "13-17", "18plus"], {
    invalid_type_error: "Please select a valid age group",
  }),
});

export const loginSchema = z.object({
  uniqueId: z.string().min(1, "Unique ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const friendRequestSchema = z.object({
  uniqueId: z.string().min(1, "Friend's Unique ID is required"),
});

export const editMessageSchema = z.object({
  messageId: z.number(),
  content: z.string().min(1, "Message content is required"),
});

export const deleteMessageSchema = z.object({
  messageId: z.number(),
});
