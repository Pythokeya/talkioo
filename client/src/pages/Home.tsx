import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { ChatList, type ChatContact, type ChatGroup } from "@/components/chat/ChatList";
import { FriendRequestsModal } from "@/components/modals/FriendRequestsModal";
import { AddFriendModal } from "@/components/modals/AddFriendModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import chatWebSocket from "@/lib/websocket";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Fetch friends list
  const { data: friends = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });
  
  // Fetch pending friend requests
  const { data: friendRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/friends/requests"],
    enabled: !!user,
  });
  
  // Update pending request count when data changes
  useEffect(() => {
    if (friendRequests) {
      setPendingRequestsCount(friendRequests.length);
    }
  }, [friendRequests]);
  
  // Connect to WebSocket when component mounts and user is authenticated
  useEffect(() => {
    if (user) {
      chatWebSocket.connect(user.id).catch(console.error);
      
      // Listen for new friend requests
      const unsubscribeFriendRequest = chatWebSocket.onMessage("friendRequest", (data) => {
        // Refresh friend requests count
        queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
        
        // Show notification
        toast({
          title: "New Friend Request",
          description: `${data.senderName} would like to connect with you`,
        });
      });
      
      // Listen for other relevant events
      const unsubscribeOnlineStatus = chatWebSocket.onMessage("userOnlineStatus", () => {
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      });
      
      return () => {
        unsubscribeFriendRequest();
        unsubscribeOnlineStatus();
      };
    }
  }, [user, queryClient, toast]);
  
  // Format friends data for ChatList component
  const formattedContacts: ChatContact[] = friends?.map((friend: any) => ({
    id: friend.id,
    username: friend.username,
    uniqueId: friend.uniqueId,
    profilePicture: friend.profilePicture,
    isOnline: friend.isOnline,
    // In a real app, you would also fetch last messages for each contact
  })) || [];
  
  // Empty groups array as requested (no default groups)
  const groups: ChatGroup[] = [];

  // Function to handle Add Friend button click
  const handleAddFriendClick = () => {
    setShowAddFriendModal(true);
  };

  return (
    <MainLayout>
      {isLoading ? (
        // Loading skeleton for chat list
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-5 w-16 mb-2" />
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-2 mb-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ChatList
          contacts={formattedContacts}
          groups={groups}
          pendingRequestsCount={pendingRequestsCount}
          onShowFriendRequests={() => setShowFriendRequests(true)}
        />
      )}
      
      {/* Welcome screen for desktop */}
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 mx-auto w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary text-4xl">chat</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Talkio!</h1>
          <p className="text-gray-600 mb-6">
            Select a chat from the sidebar or start a new conversation by adding friends.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              onClick={handleAddFriendClick}
            >
              <span className="material-icons mr-2">person_add</span>
              <span className="whitespace-nowrap">Add Friends</span>
            </button>
            <button className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors">
              <span className="material-icons mr-2">group_add</span>
              <span className="whitespace-nowrap">Create Group</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Welcome screen for mobile */}
      <div className="flex-1 flex md:hidden flex-col items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="mb-4 mx-auto w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary text-2xl">chat</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Welcome to Talkio!</h1>
          <p className="text-sm text-gray-600 mb-4">
            Tap on a chat at the bottom or start a new conversation.
          </p>
          <button 
            className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            onClick={handleAddFriendClick}
          >
            <span className="material-icons mr-2">person_add</span>
            <span className="whitespace-nowrap">Add Friends</span>
          </button>
        </div>
      </div>
      
      {/* Modals */}
      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
      
      <AddFriendModal 
        isOpen={showAddFriendModal} 
        onClose={() => setShowAddFriendModal(false)} 
      />
    </MainLayout>
  );
}
