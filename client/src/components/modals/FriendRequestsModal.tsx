import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    uniqueId: string;
    profilePicture?: string;
  };
}

export function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<number | null>(null);

  // Fetch friend requests
  const { data: friendRequests, isLoading } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests"],
    enabled: isOpen,
  });

  // Accept friend request mutation
  const acceptRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PATCH", `/api/friends/requests/${requestId}`, {
        status: "accepted",
      });
      return res.json();
    },
    onMutate: (requestId) => {
      setPendingAction(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not accept friend request",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPendingAction(null);
    },
  });

  // Decline friend request mutation
  const declineRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PATCH", `/api/friends/requests/${requestId}`, {
        status: "declined",
      });
      return res.json();
    },
    onMutate: (requestId) => {
      setPendingAction(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend request declined",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not decline friend request",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPendingAction(null);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Friend Requests</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3">
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
            </div>
          ) : friendRequests && friendRequests.length > 0 ? (
            <ScrollArea className="max-h-80">
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center">
                      <Avatar>
                        {request.user.profilePicture ? (
                          <AvatarImage src={request.user.profilePicture} alt={request.user.username} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(request.user.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-semibold">{request.user.username}</p>
                        <p className="text-xs text-gray-500">@{request.user.uniqueId}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => declineRequest.mutate(request.id)}
                        disabled={pendingAction === request.id}
                      >
                        {pendingAction === request.id && declineRequest.isPending ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          "Decline"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptRequest.mutate(request.id)}
                        disabled={pendingAction === request.id}
                      >
                        {pendingAction === request.id && acceptRequest.isPending ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          "Accept"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-icons text-gray-400 text-2xl">person_add_disabled</span>
              </div>
              <p>No pending friend requests</p>
              <p className="text-sm mt-1">
                When someone sends you a request, it will appear here.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}