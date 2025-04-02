import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FriendRequestItemProps {
  id: number;
  username: string;
  uniqueId: string;
  profilePicture?: string;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}

export function FriendRequestItem({
  id,
  username,
  uniqueId,
  profilePicture,
  onAccept,
  onDecline,
}: FriendRequestItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await apiRequest("POST", `/api/friends/requests/${id}/accept`);
      onAccept(id);
      toast({
        title: "Friend request accepted",
        description: `${username} has been added to your friends list.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to accept friend request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await apiRequest("POST", `/api/friends/requests/${id}/decline`);
      onDecline(id);
      toast({
        title: "Friend request declined",
        description: `${username}'s friend request has been declined.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to decline friend request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center">
        <Avatar>
          {profilePicture ? (
            <AvatarImage src={profilePicture} alt={username} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(username)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ml-3">
          <p className="font-semibold">{username}</p>
          <p className="text-xs text-gray-500">ID: {uniqueId}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          className="bg-primary text-white px-3 py-1 h-8"
          onClick={handleAccept}
          disabled={isProcessing}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          className="bg-gray-200 text-gray-700 px-3 py-1 h-8 hover:bg-gray-300"
          onClick={handleDecline}
          disabled={isProcessing}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
