import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FriendRequestItem } from "@/components/chat/FriendRequestItem";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";

interface FriendRequest {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    uniqueId: string;
    profilePicture?: string;
  };
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchFriendRequests();
    }
  }, [isOpen]);

  const fetchFriendRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/friends/requests");
      const data: FriendRequest[] = await res.json();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friend requests. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to fetch friend requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = (id: number) => {
    setRequests((prev) => prev.filter((request) => request.id !== id));
    // Invalidate friends query to refresh the friends list
    queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
  };

  const handleDeclineRequest = (id: number) => {
    setRequests((prev) => prev.filter((request) => request.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Friend Requests</DialogTitle>
          <DialogClose className="absolute top-4 right-4 text-gray-500">
            <span className="material-icons">close</span>
          </DialogClose>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 mb-4 p-1">
            {isLoading ? (
              // Loading skeletons
              Array(2).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="ml-3 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <FriendRequestItem
                  key={request.id}
                  id={request.id}
                  username={request.user.username}
                  uniqueId={request.user.uniqueId}
                  profilePicture={request.user.profilePicture}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="material-icons text-4xl mb-2">notifications_none</span>
                <p>No friend requests yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
