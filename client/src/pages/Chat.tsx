import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layouts/MainLayout";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useChatTheme } from "@/hooks/use-chat-theme";
import { formatDate } from "@/lib/utils";
import chatWebSocket from "@/lib/websocket";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ChatProps {
  friendId: number;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  type: "text" | "sticker" | "gif" | "voice";
  sentAt: Date;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  reactions?: Array<{
    id: number;
    messageId: number;
    userId: number;
    reaction: string;
  }>;
}

export default function Chat({ friendId }: ChatProps) {
  const { user } = useAuth();
  const { theme } = useChatTheme();
  const [_, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  // Fetch friend's information
  const { data: friend, isLoading: isLoadingFriend } = useQuery({
    queryKey: [`/api/friends/${friendId}`],
    enabled: !!friendId,
    onError: () => {
      // If friend not found, redirect to home
      navigate("/");
    }
  });
  
  // Fetch messages between users
  const { data: fetchedMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/messages/${friendId}`],
    enabled: !!friendId,
  });
  
  // Update messages when fetchedMessages changes
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);
  
  // Connect to WebSocket for real-time chat
  useEffect(() => {
    if (user) {
      chatWebSocket.connect(user.id).catch(console.error);
      
      // Listen for new messages
      const messageHandler = chatWebSocket.onMessage("newMessage", (data) => {
        if (data.message.senderId === friendId) {
          setMessages((prev) => [...prev, data.message]);
          // Mark message as read - in a real app, you would send this to the server
        }
      });
      
      // Listen for new reactions
      const reactionHandler = chatWebSocket.onMessage("newReaction", (data) => {
        if (data.messageId) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), data],
                };
              }
              return msg;
            })
          );
        }
      });

      // Listen for edited messages
      const editHandler = chatWebSocket.onMessage("messageEdited", (data) => {
        if (data.messageId) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  content: data.content,
                  isEdited: true,
                  editedAt: data.editedAt
                };
              }
              return msg;
            })
          );
        }
      });

      // Listen for deleted messages
      const deleteHandler = chatWebSocket.onMessage("messageDeleted", (data) => {
        if (data.messageId) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  content: "This message was deleted",
                  isDeleted: true,
                  deletedAt: data.deletedAt
                };
              }
              return msg;
            })
          );
        }
      });
      
      return () => {
        messageHandler();
        reactionHandler();
        editHandler();
        deleteHandler();
      };
    }
  }, [user, friendId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (content: string, type: "text" | "sticker" | "gif" | "voice") => {
    if (!user) return;
    
    // Send message via WebSocket
    const sent = chatWebSocket.sendChatMessage(friendId, content, type);
    
    if (sent) {
      // Optimistically add message to UI
      const newMessage: Message = {
        id: Date.now(), // Temporary ID
        senderId: user.id,
        receiverId: friendId,
        content,
        type,
        sentAt: new Date(),
        isRead: false,
        reactions: [],
      };
      
      setMessages((prev) => [...prev, newMessage]);
    }
  };
  
  const handleReactToMessage = (messageId: number, reaction: string) => {
    if (!user) return;
    
    // Send reaction via WebSocket
    chatWebSocket.sendMessageReaction(messageId, reaction);
    
    // Optimistically add reaction to UI
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const newReaction = {
            id: Date.now(), // Temporary ID
            messageId,
            userId: user.id,
            reaction,
          };
          
          return {
            ...msg,
            reactions: [...(msg.reactions || []), newReaction],
          };
        }
        return msg;
      })
    );
  };

  const handleEditMessage = (messageId: number, newContent: string) => {
    if (!user) return;
    
    // Send edit via WebSocket
    chatWebSocket.editMessage(messageId, newContent);
    
    // Optimistically update message in UI
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: newContent,
            isEdited: true,
            editedAt: new Date()
          };
        }
        return msg;
      })
    );
  };

  const handleDeleteMessage = (messageId: number) => {
    if (!user) return;
    
    // Send delete via WebSocket
    chatWebSocket.deleteMessage(messageId);
    
    // Optimistically update message in UI
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: "This message was deleted",
            isDeleted: true,
            deletedAt: new Date()
          };
        }
        return msg;
      })
    );
  };
  
  const handleBlockUser = () => {
    // In a real app, make an API call to block the user
    setShowBlockDialog(false);
    navigate("/");
  };
  
  const handleReportUser = () => {
    // In a real app, make an API call to report the user
    setShowReportDialog(false);
    navigate("/");
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = formatDate(new Date(message.sentAt));
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <MainLayout showSidebar={false}>
      <div className={`flex-1 flex flex-col theme-active theme-${theme}`}>
        {/* Chat header with friend info */}
        {isLoadingFriend ? (
          <div className="bg-white border-b border-gray-200 p-3 flex items-center shadow-sm">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
        ) : friend ? (
          <ChatHeader
            chatName={friend.username}
            profilePicture={friend.profilePicture}
            status={friend.isOnline ? "online" : "offline"}
            onBlock={() => setShowBlockDialog(true)}
            onReport={() => setShowReportDialog(true)}
          />
        ) : null}
        
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4 chat-bg">
          {isLoadingMessages ? (
            // Loading skeleton for messages
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className={`flex items-end ${i % 2 === 0 ? "" : "justify-end"}`}>
                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                  <div className={`max-w-xs md:max-w-md py-2 px-4 rounded-lg ${i % 2 === 0 ? "bg-gray-100" : "bg-primary/80"}`}>
                    <Skeleton className={`h-4 w-32 ${i % 2 === 0 ? "bg-gray-300" : "bg-primary"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Render messages grouped by date
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex justify-center mb-4">
                  <span className="px-4 py-1 bg-gray-200 rounded-full text-xs text-gray-700">
                    {date}
                  </span>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-3">
                  {msgs.map((message) => (
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      content={message.content}
                      type={message.type}
                      sentAt={new Date(message.sentAt)}
                      isOwn={message.senderId === user?.id}
                      senderName={message.senderId === user?.id ? user.username : friend?.username || ""}
                      senderAvatar={message.senderId === user?.id ? user.profilePicture : friend?.profilePicture}
                      reactions={message.reactions}
                      isEdited={message.isEdited}
                      isDeleted={message.isDeleted}
                      onReact={handleReactToMessage}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* Empty state when no messages */}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-icons text-primary text-2xl">chat</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 max-w-xs">
                Start the conversation by sending a message, emoji, or sticker!
              </p>
            </div>
          )}
          
          {/* Reference for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Chat input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoadingFriend || !friend}
        />
      </div>
      
      {/* Block user confirmation dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? You won't receive messages from them anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser} className="bg-destructive text-white">
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Report user confirmation dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this user for inappropriate behavior?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportUser} className="bg-destructive text-white">
              Report User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
