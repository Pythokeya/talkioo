import {
  users,
  friendships,
  chatGroups,
  groupMembers,
  messages,
  messageReactions,
  blockedUsers,
  userPreferences,
  type User,
  type Friendship,
  type ChatGroup,
  type GroupMember,
  type Message,
  type MessageReaction,
  type BlockedUser,
  type UserPreference,
  type InsertUser,
  type InsertFriendship,
  type InsertChatGroup,
  type InsertGroupMember,
  type InsertMessage,
  type InsertMessageReaction,
  type InsertBlockedUser,
  type InsertUserPreference,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, isNull, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUniqueId(uniqueId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  
  // Friendship operations
  createFriendRequest(friendship: InsertFriendship): Promise<Friendship>;
  getFriendRequestsByUserId(userId: number): Promise<Friendship[]>;
  getFriendRequests(userId: number): Promise<(Friendship & { user: User })[]>;
  updateFriendshipStatus(id: number, status: 'accepted' | 'declined'): Promise<Friendship>;
  getFriends(userId: number): Promise<User[]>;
  isFriend(userId: number, friendId: number): Promise<boolean>;
  
  // Chat group operations
  createChatGroup(group: InsertChatGroup): Promise<ChatGroup>;
  getChatGroupById(id: number): Promise<ChatGroup | undefined>;
  getChatGroupsByUserId(userId: number): Promise<ChatGroup[]>;
  addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId: number, friendId: number, limit?: number): Promise<Message[]>;
  getGroupMessages(groupId: number, limit?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;
  getMessage(messageId: number): Promise<Message | undefined>;
  editMessage(messageId: number, content: string, userId: number): Promise<Message | null>;
  deleteMessage(messageId: number, userId: number): Promise<boolean>;
  
  // Message reaction operations
  addReactionToMessage(reaction: InsertMessageReaction): Promise<MessageReaction>;
  getMessageReactions(messageId: number): Promise<MessageReaction[]>;
  
  // Blocked user operations
  blockUser(blocked: InsertBlockedUser): Promise<BlockedUser>;
  unblockUser(blockerId: number, blockedId: number): Promise<void>;
  getBlockedUsers(userId: number): Promise<User[]>;
  isBlocked(userId: number, otherUserId: number): Promise<boolean>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  setUserPreferences(prefs: InsertUserPreference): Promise<UserPreference>;
  updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uniqueId, uniqueId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const now = new Date();
    await db
      .update(users)
      .set({ isOnline, lastSeen: now })
      .where(eq(users.id, id));
  }

  // Friendship operations
  async createFriendRequest(friendshipData: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        ...friendshipData,
        status: 'pending'
      })
      .returning();
    
    return friendship;
  }

  async getFriendRequestsByUserId(userId: number): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(or(
        eq(friendships.userId, userId),
        eq(friendships.friendId, userId)
      ));
  }

  async getFriendRequests(userId: number): Promise<(Friendship & { user: User })[]> {
    const pendingRequests = await db
      .select()
      .from(friendships)
      .where(and(
        eq(friendships.friendId, userId),
        eq(friendships.status, 'pending')
      ));
    
    const requestsWithUserInfo = await Promise.all(
      pendingRequests.map(async (request) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));
        
        return {
          ...request,
          user
        };
      })
    );
    
    return requestsWithUserInfo;
  }

  async updateFriendshipStatus(id: number, status: 'accepted' | 'declined'): Promise<Friendship> {
    const [updatedFriendship] = await db
      .update(friendships)
      .set({ status })
      .where(eq(friendships.id, id))
      .returning();
    
    if (!updatedFriendship) {
      throw new Error(`Friendship with id ${id} not found`);
    }
    
    return updatedFriendship;
  }

  async getFriends(userId: number): Promise<User[]> {
    const userFriendships = await db
      .select()
      .from(friendships)
      .where(and(
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        ),
        eq(friendships.status, 'accepted')
      ));
    
    const friendUserIds = userFriendships.map(friendship => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );
    
    if (friendUserIds.length === 0) {
      return [];
    }
    
    // Get all the friend users
    const friendUsers = await Promise.all(
      friendUserIds.map(async (friendId) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, friendId));
        return user;
      })
    );
    
    return friendUsers.filter(Boolean) as User[];
  }

  async isFriend(userId: number, friendId: number): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(and(
        or(
          and(
            eq(friendships.userId, userId),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId)
          )
        ),
        eq(friendships.status, 'accepted')
      ));
    
    return !!friendship;
  }

  // Chat group operations
  async createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup> {
    const [group] = await db
      .insert(chatGroups)
      .values(groupData)
      .returning();
    
    return group;
  }

  async getChatGroupById(id: number): Promise<ChatGroup | undefined> {
    const [group] = await db
      .select()
      .from(chatGroups)
      .where(eq(chatGroups.id, id));
    
    return group;
  }

  async getChatGroupsByUserId(userId: number): Promise<ChatGroup[]> {
    const userMemberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    if (userMemberships.length === 0) {
      return [];
    }
    
    const groupIds = userMemberships.map(member => member.groupId);
    
    const groups = await Promise.all(
      groupIds.map(async (groupId) => {
        const [group] = await db
          .select()
          .from(chatGroups)
          .where(eq(chatGroups.id, groupId));
        return group;
      })
    );
    
    return groups.filter(Boolean) as ChatGroup[];
  }

  async addUserToGroup(groupMemberData: InsertGroupMember): Promise<GroupMember> {
    const [groupMember] = await db
      .insert(groupMembers)
      .values(groupMemberData)
      .returning();
    
    return groupMember;
  }

  async getGroupMembers(groupId: number): Promise<User[]> {
    const memberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    if (memberships.length === 0) {
      return [];
    }
    
    const memberUserIds = memberships.map(membership => membership.userId);
    
    const members = await Promise.all(
      memberUserIds.map(async (userId) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        return user;
      })
    );
    
    return members.filter(Boolean) as User[];
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        isRead: false
      })
      .returning();
    
    return message;
  }

  async getMessagesBetweenUsers(userId: number, friendId: number, limit: number = 50): Promise<Message[]> {
    const userMessages = await db
      .select()
      .from(messages)
      .where(and(
        isNull(messages.groupId),
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, friendId)
          ),
          and(
            eq(messages.senderId, friendId),
            eq(messages.receiverId, userId)
          )
        )
      ))
      .orderBy(asc(messages.sentAt))
      .limit(limit);
    
    return userMessages;
  }

  async getGroupMessages(groupId: number, limit: number = 50): Promise<Message[]> {
    const groupMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .orderBy(asc(messages.sentAt))
      .limit(limit);
    
    return groupMessages;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const unreadMessages = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
    
    return unreadMessages.length;
  }
  
  async getMessage(messageId: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    return message;
  }
  
  async editMessage(messageId: number, content: string, userId: number): Promise<Message | null> {
    // Get the message first to check if it exists and belongs to the user
    const message = await this.getMessage(messageId);
    
    if (!message) {
      return null; // Message not found
    }
    
    if (message.senderId !== userId) {
      return null; // Not authorized to edit this message
    }
    
    // Check if the message was sent within the last 30 minutes
    const now = new Date();
    // Handle potential null sentAt value
    const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
    const timeDifferenceMinutes = (now.getTime() - sentAt.getTime()) / (1000 * 60);
    
    if (timeDifferenceMinutes > 30) {
      return null; // Cannot edit messages older than 30 minutes
    }
    
    // Update the message
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content,
        isEdited: true,
        editedAt: now
      })
      .where(eq(messages.id, messageId))
      .returning();
    
    return updatedMessage;
  }
  
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    // Get the message first to check if it exists and belongs to the user
    const message = await this.getMessage(messageId);
    
    if (!message) {
      return false; // Message not found
    }
    
    if (message.senderId !== userId) {
      return false; // Not authorized to delete this message
    }
    
    // Check if the message was sent within the last 10 minutes (for "delete for everyone")
    const now = new Date();
    // Handle potential null sentAt value
    const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
    const timeDifferenceMinutes = (now.getTime() - sentAt.getTime()) / (1000 * 60);
    
    if (timeDifferenceMinutes > 10) {
      return false; // Cannot delete messages older than 10 minutes
    }
    
    // Mark the message as deleted rather than actually deleting it
    await db
      .update(messages)
      .set({
        isDeleted: true,
        content: "This message was deleted",
        deletedAt: now
      })
      .where(eq(messages.id, messageId));
    
    return true;
  }

  // Message reaction operations
  async addReactionToMessage(reactionData: InsertMessageReaction): Promise<MessageReaction> {
    // Check if the reaction already exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, reactionData.messageId),
        eq(messageReactions.userId, reactionData.userId),
        eq(messageReactions.reaction, reactionData.reaction)
      ));
    
    if (existingReaction) {
      return existingReaction;
    }
    
    const [reaction] = await db
      .insert(messageReactions)
      .values(reactionData)
      .returning();
    
    return reaction;
  }

  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
    
    return reactions;
  }

  // Blocked user operations
  async blockUser(blockedData: InsertBlockedUser): Promise<BlockedUser> {
    const [blocked] = await db
      .insert(blockedUsers)
      .values(blockedData)
      .returning();
    
    return blocked;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, blockedId)
      ));
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    const blockedEntries = await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.blockerId, userId));
    
    if (blockedEntries.length === 0) {
      return [];
    }
    
    const blockedUserIds = blockedEntries.map(entry => entry.blockedId);
    
    const blockedUsers = await Promise.all(
      blockedUserIds.map(async (blockedId) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, blockedId));
        return user;
      })
    );
    
    return blockedUsers.filter(Boolean) as User[];
  }

  async isBlocked(userId: number, otherUserId: number): Promise<boolean> {
    const [blockedEntry] = await db
      .select()
      .from(blockedUsers)
      .where(or(
        and(
          eq(blockedUsers.blockerId, userId),
          eq(blockedUsers.blockedId, otherUserId)
        ),
        and(
          eq(blockedUsers.blockerId, otherUserId),
          eq(blockedUsers.blockedId, userId)
        )
      ));
    
    return !!blockedEntry;
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    return prefs;
  }

  async setUserPreferences(prefsData: InsertUserPreference): Promise<UserPreference> {
    const [prefs] = await db
      .insert(userPreferences)
      .values(prefsData)
      .returning();
    
    return prefs;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference> {
    // Check if preferences exist
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    if (!existingPrefs) {
      // Create default preferences first
      return this.setUserPreferences({
        userId,
        chatTheme: 'default',
        notificationsEnabled: true,
        ...updates
      });
    }
    
    // Update existing preferences
    const [updatedPrefs] = await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    
    return updatedPrefs;
  }
}

export const storage = new DatabaseStorage();