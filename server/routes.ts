import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  registerSchema,
  loginSchema,
  friendRequestSchema,
  insertMessageSchema,
  insertMessageReactionSchema,
  insertUserPreferenceSchema
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

// Type for websocket clients with user info
interface WebSocketClient extends WebSocket {
  userId?: number;
  uniqueId?: string;
  isAlive: boolean;
}

// Type for messages sent via websocket
interface WSMessage {
  type: string;
  data: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up sessions
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "talkio-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours in milliseconds
      }),
    })
  );

  // Initialize Passport.js
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "uniqueId" },
      async (uniqueId, password, done) => {
        try {
          const user = await storage.getUserByUniqueId(uniqueId);
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }
          
          // Compare password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid credentials" });
          }
          
          // Update user's online status
          await storage.setUserOnlineStatus(user.id, true);
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if uniqueId already exists
      const existingUser = await storage.getUserByUniqueId(validatedData.uniqueId);
      if (existingUser) {
        return res.status(400).json({ message: "Unique ID already in use" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Set default parental approval based on age
      const hasParentalApproval = validatedData.ageGroup !== "under13";
      
      // Create new user
      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        hasParentalApproval,
        isOnline: true,
      });

      // Create default user preferences
      await storage.setUserPreferences({
        userId: newUser.id,
        chatTheme: "default",
        notificationsEnabled: true,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      // Auto login after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login", error: err.message });
        }
        return res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Error during login", error: err.message });
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Error during login", error: loginErr.message });
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          return res.status(200).json({ user: userWithoutPassword });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error during login", error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    // Update user's online status
    await storage.setUserOnlineStatus(userId, false);
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout", error: err.message });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.get("/api/user", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error: (error as Error).message });
    }
  });

  app.put("/api/user", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      // Only allow certain fields to be updated
      const { username, profilePicture } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        profilePicture,
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error: (error as Error).message });
    }
  });

  // Friend request routes
  app.post("/api/friends/request", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const validatedData = friendRequestSchema.parse(req.body);
      
      // Find friend by uniqueId
      const friend = await storage.getUserByUniqueId(validatedData.uniqueId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow sending request to self
      if (friend.id === userId) {
        return res.status(400).json({ message: "Cannot add yourself as a friend" });
      }
      
      // Check if already friends or have pending request
      const existingFriendship = (await storage.getFriendRequestsByUserId(userId)).find(
        (f) => (f.userId === userId && f.friendId === friend.id) || 
               (f.userId === friend.id && f.friendId === userId)
      );
      
      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          return res.status(400).json({ message: "Already friends with this user" });
        } else if (existingFriendship.status === 'pending') {
          return res.status(400).json({ message: "Friend request already pending" });
        }
      }
      
      // Create friend request
      const friendRequest = await storage.createFriendRequest({
        userId,
        friendId: friend.id,
        status: 'pending',
      });
      
      res.status(201).json({ message: "Friend request sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error sending friend request", error: (error as Error).message });
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const friendRequests = await storage.getFriendRequests(userId);
      res.status(200).json(friendRequests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching friend requests", error: (error as Error).message });
    }
  });

  app.post("/api/friends/requests/:id/accept", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const friendshipId = parseInt(req.params.id);
    
    try {
      const friendship = await storage.updateFriendshipStatus(friendshipId, 'accepted');
      res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
      res.status(500).json({ message: "Error accepting friend request", error: (error as Error).message });
    }
  });

  app.post("/api/friends/requests/:id/decline", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const friendshipId = parseInt(req.params.id);
    
    try {
      const friendship = await storage.updateFriendshipStatus(friendshipId, 'declined');
      res.status(200).json({ message: "Friend request declined" });
    } catch (error) {
      res.status(500).json({ message: "Error declining friend request", error: (error as Error).message });
    }
  });

  app.get("/api/friends", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const friends = await storage.getFriends(userId);
      res.status(200).json(friends);
    } catch (error) {
      res.status(500).json({ message: "Error fetching friends", error: (error as Error).message });
    }
  });

  // Chat routes
  app.get("/api/messages/:friendId", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const friendId = parseInt(req.params.friendId);
    
    try {
      // Check if users are friends
      const areFriends = await storage.isFriend(userId, friendId);
      if (!areFriends) {
        return res.status(403).json({ message: "Not authorized to view these messages" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(userId, friendId);
      
      // For each message, get its reactions
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          const reactions = await storage.getMessageReactions(message.id);
          return {
            ...message,
            reactions,
          };
        })
      );
      
      res.status(200).json(messagesWithReactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages", error: (error as Error).message });
    }
  });

  // Preference routes
  app.get("/api/preferences", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        preferences = await storage.setUserPreferences({
          userId,
          chatTheme: "default",
          notificationsEnabled: true,
        });
      }
      
      res.status(200).json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Error fetching preferences", error: (error as Error).message });
    }
  });

  app.put("/api/preferences", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const validatedData = insertUserPreferenceSchema.partial().parse(req.body);
      
      // Only allow updating specific fields
      const { chatTheme, notificationsEnabled } = validatedData;
      
      const updatedPreferences = await storage.updateUserPreferences(userId, {
        chatTheme,
        notificationsEnabled,
      });
      
      res.status(200).json(updatedPreferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating preferences", error: (error as Error).message });
    }
  });

  // Block/report routes
  app.post("/api/users/block", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const { blockedId } = req.body;
      
      if (!blockedId) {
        return res.status(400).json({ message: "blockedId is required" });
      }
      
      // Don't allow blocking self
      if (blockedId === userId) {
        return res.status(400).json({ message: "Cannot block yourself" });
      }
      
      // Check if user exists
      const userToBlock = await storage.getUser(blockedId);
      if (!userToBlock) {
        return res.status(404).json({ message: "User to block not found" });
      }
      
      await storage.blockUser({
        blockerId: userId,
        blockedId,
      });
      
      res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error blocking user", error: (error as Error).message });
    }
  });

  app.post("/api/users/unblock", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const { blockedId } = req.body;
      
      if (!blockedId) {
        return res.status(400).json({ message: "blockedId is required" });
      }
      
      await storage.unblockUser(userId, blockedId);
      
      res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unblocking user", error: (error as Error).message });
    }
  });

  app.get("/api/users/blocked", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const blockedUsers = await storage.getBlockedUsers(userId);
      res.status(200).json(blockedUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blocked users", error: (error as Error).message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store online users with their WebSocket connections
  const connectedClients = new Map<number, WebSocketClient>();

  // Ping clients regularly to keep connections alive and detect disconnects
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.isAlive === false) {
        client.terminate();
        return;
      }
      
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws: WebSocketClient, req) => {
    ws.isAlive = true;
    
    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle authentication and messages
    ws.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        if (message.type === 'auth') {
          // Authenticate the WebSocket connection
          const userId = message.data.userId;
          const user = await storage.getUser(userId);
          
          if (user) {
            ws.userId = userId;
            ws.uniqueId = user.uniqueId;
            connectedClients.set(userId, ws);
            
            // Send online status to friends
            const friends = await storage.getFriends(userId);
            friends.forEach(friend => {
              const friendWs = connectedClients.get(friend.id);
              if (friendWs && friendWs.readyState === WebSocket.OPEN) {
                friendWs.send(JSON.stringify({
                  type: 'userStatus',
                  data: {
                    userId,
                    uniqueId: user.uniqueId,
                    status: 'online'
                  }
                }));
              }
            });
            
            // Send confirmation back to client
            ws.send(JSON.stringify({
              type: 'authSuccess',
              data: { userId, uniqueId: user.uniqueId }
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'authError',
              data: { message: 'Authentication failed' }
            }));
          }
        } else if (message.type === 'chatMessage' && ws.userId) {
          // Store and forward chat message
          try {
            const { receiverId, content, type = 'text' } = message.data;
            
            // Validate message
            const parsedMessage = insertMessageSchema.parse({
              senderId: ws.userId,
              receiverId,
              content,
              type
            });
            
            // Check if users are friends
            const areFriends = await storage.isFriend(ws.userId, receiverId);
            if (!areFriends) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Not authorized to send message to this user' }
              }));
              return;
            }
            
            // Check if either user has blocked the other
            const isBlocked = await storage.isBlocked(ws.userId, receiverId);
            if (isBlocked) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Message could not be sent due to blocking' }
              }));
              return;
            }
            
            // Store message
            const savedMessage = await storage.createMessage(parsedMessage);
            
            // Send to recipient if online
            const recipientWs = connectedClients.get(receiverId);
            
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              // Get sender data
              const sender = await storage.getUser(ws.userId);
              
              recipientWs.send(JSON.stringify({
                type: 'newMessage',
                data: {
                  message: savedMessage,
                  sender: {
                    id: sender?.id,
                    username: sender?.username,
                    uniqueId: sender?.uniqueId,
                    profilePicture: sender?.profilePicture
                  }
                }
              }));
            }
            
            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: 'messageSent',
              data: savedMessage
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Failed to send message', error: (error as Error).message }
            }));
          }
        } else if (message.type === 'messageReaction' && ws.userId) {
          // Handle message reactions
          try {
            const { messageId, reaction } = message.data;
            
            // Validate reaction
            const parsedReaction = insertMessageReactionSchema.parse({
              messageId,
              userId: ws.userId,
              reaction
            });
            
            // Store reaction
            const savedReaction = await storage.addReactionToMessage(parsedReaction);
            
            // Get the message to determine recipient
            const message = await storage.getUser(messageId);
            const recipientId = message ? 
              (message.senderId === ws.userId ? message.receiverId : message.senderId) : 
              null;
            
            if (recipientId) {
              // Send to recipient if online
              const recipientWs = connectedClients.get(recipientId);
              
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                recipientWs.send(JSON.stringify({
                  type: 'newReaction',
                  data: savedReaction
                }));
              }
            }
            
            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: 'reactionSent',
              data: savedReaction
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Failed to add reaction', error: (error as Error).message }
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      if (ws.userId) {
        // Remove from active connections
        connectedClients.delete(ws.userId);
        
        // Update user status to offline
        await storage.setUserOnlineStatus(ws.userId, false);
        
        // Notify friends about offline status
        const friends = await storage.getFriends(ws.userId);
        friends.forEach(friend => {
          const friendWs = connectedClients.get(friend.id);
          if (friendWs && friendWs.readyState === WebSocket.OPEN) {
            friendWs.send(JSON.stringify({
              type: 'userStatus',
              data: {
                userId: ws.userId,
                uniqueId: ws.uniqueId,
                status: 'offline'
              }
            }));
          }
        });
      }
    });
  });

  return httpServer;
}
