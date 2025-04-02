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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friendships: Map<number, Friendship>;
  private chatGroups: Map<number, ChatGroup>;
  private groupMembers: Map<number, GroupMember>;
  private messages: Map<number, Message>;
  private messageReactions: Map<number, MessageReaction>;
  private blockedUsers: Map<number, BlockedUser>;
  private userPreferences: Map<number, UserPreference>;
  
  private userIdCounter: number;
  private friendshipIdCounter: number;
  private chatGroupIdCounter: number;
  private groupMemberIdCounter: number;
  private messageIdCounter: number;
  private messageReactionIdCounter: number;
  private blockedUserIdCounter: number;
  private userPreferenceIdCounter: number;

  constructor() {
    this.users = new Map();
    this.friendships = new Map();
    this.chatGroups = new Map();
    this.groupMembers = new Map();
    this.messages = new Map();
    this.messageReactions = new Map();
    this.blockedUsers = new Map();
    this.userPreferences = new Map();
    
    this.userIdCounter = 1;
    this.friendshipIdCounter = 1;
    this.chatGroupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.messageIdCounter = 1;
    this.messageReactionIdCounter = 1;
    this.blockedUserIdCounter = 1;
    this.userPreferenceIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uniqueId === uniqueId,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id,
      lastSeen: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const now = new Date();
    const updatedUser = { 
      ...user, 
      isOnline, 
      lastSeen: now 
    };
    this.users.set(id, updatedUser);
  }

  // Friendship operations
  async createFriendRequest(friendshipData: InsertFriendship): Promise<Friendship> {
    const id = this.friendshipIdCounter++;
    const now = new Date();
    const friendship: Friendship = {
      ...friendshipData,
      id,
      status: 'pending',
      createdAt: now,
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async getFriendRequestsByUserId(userId: number): Promise<Friendship[]> {
    return Array.from(this.friendships.values()).filter(
      (friendship) => friendship.userId === userId || friendship.friendId === userId
    );
  }

  async getFriendRequests(userId: number): Promise<(Friendship & { user: User })[]> {
    const friendRequests = Array.from(this.friendships.values()).filter(
      (friendship) => friendship.friendId === userId && friendship.status === 'pending'
    );
    
    const requestsWithUserInfo = await Promise.all(
      friendRequests.map(async (request) => {
        const user = await this.getUser(request.userId);
        return {
          ...request,
          user: user!
        };
      })
    );
    
    return requestsWithUserInfo;
  }

  async updateFriendshipStatus(id: number, status: 'accepted' | 'declined'): Promise<Friendship> {
    const friendship = this.friendships.get(id);
    if (!friendship) {
      throw new Error(`Friendship with id ${id} not found`);
    }
    
    const updatedFriendship = { ...friendship, status };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }

  async getFriends(userId: number): Promise<User[]> {
    const friendships = Array.from(this.friendships.values()).filter(
      (friendship) => 
        (friendship.userId === userId || friendship.friendId === userId) && 
        friendship.status === 'accepted'
    );
    
    const friendIds = friendships.map(friendship => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );
    
    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const user = await this.getUser(friendId);
        return user!;
      })
    );
    
    return friends;
  }

  async isFriend(userId: number, friendId: number): Promise<boolean> {
    const friendship = Array.from(this.friendships.values()).find(
      (friendship) => 
        ((friendship.userId === userId && friendship.friendId === friendId) || 
        (friendship.userId === friendId && friendship.friendId === userId)) &&
        friendship.status === 'accepted'
    );
    
    return !!friendship;
  }

  // Chat group operations
  async createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup> {
    const id = this.chatGroupIdCounter++;
    const now = new Date();
    const group: ChatGroup = {
      ...groupData,
      id,
      createdAt: now,
    };
    this.chatGroups.set(id, group);
    return group;
  }

  async getChatGroupById(id: number): Promise<ChatGroup | undefined> {
    return this.chatGroups.get(id);
  }

  async getChatGroupsByUserId(userId: number): Promise<ChatGroup[]> {
    const userGroupMemberships = Array.from(this.groupMembers.values()).filter(
      (member) => member.userId === userId
    );
    
    const groups = await Promise.all(
      userGroupMemberships.map(async (membership) => {
        const group = await this.getChatGroupById(membership.groupId);
        return group!;
      })
    );
    
    return groups;
  }

  async addUserToGroup(groupMemberData: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    const groupMember: GroupMember = {
      ...groupMemberData,
      id,
      joinedAt: now,
    };
    this.groupMembers.set(id, groupMember);
    return groupMember;
  }

  async getGroupMembers(groupId: number): Promise<User[]> {
    const memberships = Array.from(this.groupMembers.values()).filter(
      (member) => member.groupId === groupId
    );
    
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await this.getUser(membership.userId);
        return user!;
      })
    );
    
    return members;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = {
      ...messageData,
      id,
      sentAt: now,
      isRead: false,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBetweenUsers(userId: number, friendId: number, limit: number = 50): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === userId && message.receiverId === friendId) || 
        (message.senderId === friendId && message.receiverId === userId)
    );
    
    // Sort by sent time, newest last
    allMessages.sort((a, b) => {
      return a.sentAt.getTime() - b.sentAt.getTime();
    });
    
    // Return the most recent messages based on limit
    return allMessages.slice(-limit);
  }

  async getGroupMessages(groupId: number, limit: number = 50): Promise<Message[]> {
    const groupMessages = Array.from(this.messages.values()).filter(
      (message) => message.groupId === groupId
    );
    
    // Sort by sent time, newest last
    groupMessages.sort((a, b) => {
      return a.sentAt.getTime() - b.sentAt.getTime();
    });
    
    // Return the most recent messages based on limit
    return groupMessages.slice(-limit);
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error(`Message with id ${messageId} not found`);
    }
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(messageId, updatedMessage);
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const unreadMessages = Array.from(this.messages.values()).filter(
      (message) => 
        message.receiverId === userId && 
        !message.isRead
    );
    
    return unreadMessages.length;
  }

  // Message reaction operations
  async addReactionToMessage(reactionData: InsertMessageReaction): Promise<MessageReaction> {
    // Check if the reaction already exists
    const existingReaction = Array.from(this.messageReactions.values()).find(
      (reaction) => 
        reaction.messageId === reactionData.messageId && 
        reaction.userId === reactionData.userId &&
        reaction.reaction === reactionData.reaction
    );
    
    if (existingReaction) {
      return existingReaction;
    }
    
    const id = this.messageReactionIdCounter++;
    const now = new Date();
    const reaction: MessageReaction = {
      ...reactionData,
      id,
      createdAt: now,
    };
    this.messageReactions.set(id, reaction);
    return reaction;
  }

  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return Array.from(this.messageReactions.values()).filter(
      (reaction) => reaction.messageId === messageId
    );
  }

  // Blocked user operations
  async blockUser(blockedData: InsertBlockedUser): Promise<BlockedUser> {
    const id = this.blockedUserIdCounter++;
    const now = new Date();
    const blocked: BlockedUser = {
      ...blockedData,
      id,
      createdAt: now,
    };
    this.blockedUsers.set(id, blocked);
    return blocked;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    const blockedEntry = Array.from(this.blockedUsers.values()).find(
      (blocked) => 
        blocked.blockerId === blockerId && 
        blocked.blockedId === blockedId
    );
    
    if (blockedEntry) {
      this.blockedUsers.delete(blockedEntry.id);
    }
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    const blockedEntries = Array.from(this.blockedUsers.values()).filter(
      (blocked) => blocked.blockerId === userId
    );
    
    const blockedUsers = await Promise.all(
      blockedEntries.map(async (entry) => {
        const user = await this.getUser(entry.blockedId);
        return user!;
      })
    );
    
    return blockedUsers;
  }

  async isBlocked(userId: number, otherUserId: number): Promise<boolean> {
    const blockedEntry = Array.from(this.blockedUsers.values()).find(
      (blocked) => 
        (blocked.blockerId === userId && blocked.blockedId === otherUserId) || 
        (blocked.blockerId === otherUserId && blocked.blockedId === userId)
    );
    
    return !!blockedEntry;
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (prefs) => prefs.userId === userId
    );
  }

  async setUserPreferences(prefsData: InsertUserPreference): Promise<UserPreference> {
    const id = this.userPreferenceIdCounter++;
    const prefs: UserPreference = {
      ...prefsData,
      id,
    };
    this.userPreferences.set(id, prefs);
    return prefs;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference> {
    let prefs = await this.getUserPreferences(userId);
    
    if (!prefs) {
      // Create default preferences first
      prefs = await this.setUserPreferences({
        userId,
        chatTheme: 'default',
        notificationsEnabled: true,
      });
    }
    
    const updatedPrefs = { ...prefs, ...updates };
    this.userPreferences.set(prefs.id, updatedPrefs);
    return updatedPrefs;
  }
}

export const storage = new MemStorage();
