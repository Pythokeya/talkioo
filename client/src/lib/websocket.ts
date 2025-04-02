import { apiRequest } from "./queryClient";

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketMessage {
  type: string;
  data: any;
}

class ChatWebSocket {
  private socket: WebSocket | null = null;
  private userId: number | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<boolean> | null = null;

  constructor() {
    this.messageHandlers = new Map();
  }

  public connect(userId: number): Promise<boolean> {
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.userId = userId;

    this.connectionPromise = new Promise((resolve, reject) => {
      // Close existing socket if any
      if (this.socket) {
        this.socket.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Send authentication message
        if (this.userId) {
          this.sendMessage("auth", { userId: this.userId });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);

          // Resolve the connection promise on auth success
          if (message.type === "authSuccess") {
            resolve(true);
          } else if (message.type === "authError") {
            reject(new Error(message.data.message || "Authentication failed"));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnecting = false;
        reject(error);
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        this.handleReconnect();
      };

      // Set a timeout for initial connection
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error("Connection timeout"));
        }
      }, 5000);
    });

    return this.connectionPromise;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.userId = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public sendMessage(type: string, data: any): boolean {
    if (this.isConnected()) {
      const message: WebSocketMessage = { type, data };
      this.socket!.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }

    this.messageHandlers.get(type)!.push(handler);

    // Return a function to remove this handler
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  public clearMessageHandlers(type?: string) {
    if (type) {
      this.messageHandlers.delete(type);
    } else {
      this.messageHandlers.clear();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }
  }

  private handleReconnect() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;

      this.reconnectTimer = window.setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId).catch(() => {
            // Failed to reconnect, will try again
          });
        }
      }, delay);
    } else {
      // Handle the failure case - notify the user or attempt to reestablish session
      console.error("Failed to reconnect after multiple attempts");
      // Try to refresh user session
      apiRequest("GET", "/api/user")
        .then((res) => {
          if (res.ok && this.userId) {
            // Session is still valid, try connecting again
            this.reconnectAttempts = 0;
            this.connect(this.userId);
          }
        })
        .catch(() => {
          // Session might be invalid, user may need to log in again
          console.error("Failed to reconnect, session may be invalid");
        });
    }
  }

  // Chat message helper methods
  public sendChatMessage(receiverId: number, content: string, type = "text") {
    return this.sendMessage("chatMessage", {
      receiverId,
      content,
      type,
    });
  }

  public sendMessageReaction(messageId: number, reaction: string) {
    return this.sendMessage("messageReaction", {
      messageId,
      reaction,
    });
  }
}

// Create a singleton instance
const chatWebSocket = new ChatWebSocket();
// default export for direct import
export default chatWebSocket;
// named export for destructuring import
export { chatWebSocket };
