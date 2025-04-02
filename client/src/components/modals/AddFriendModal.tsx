import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema for friend request
const friendRequestSchema = z.object({
  uniqueId: z.string().min(1, "Friend's unique ID is required"),
});

export function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [uniqueId, setUniqueId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendRequest = async () => {
    // Reset error state
    setError("");
    
    // Validate input
    try {
      friendRequestSchema.parse({ uniqueId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/friends/request", { uniqueId });
      
      toast({
        title: "Friend request sent",
        description: `Your friend request has been sent to ${uniqueId}.`,
      });
      
      // Clear the form and close the modal
      setUniqueId("");
      onClose();
    } catch (error: any) {
      // Handle specific API errors
      if (error.message?.includes("404")) {
        setError("User not found with that unique ID.");
      } else if (error.message?.includes("400") && error.message?.includes("already friends")) {
        setError("You are already friends with this user.");
      } else if (error.message?.includes("400") && error.message?.includes("friend request already pending")) {
        setError("A friend request is already pending for this user.");
      } else if (error.message?.includes("400") && error.message?.includes("yourself")) {
        setError("You cannot add yourself as a friend.");
      } else {
        setError("Failed to send friend request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Add a Friend</DialogTitle>
          <DialogClose className="absolute top-4 right-4 text-gray-500">
            <span className="material-icons">close</span>
          </DialogClose>
        </DialogHeader>
        
        <p className="text-sm text-gray-600 mb-4">
          Enter your friend's unique ID to send them a friend request.
        </p>
        
        <div className="mb-4">
          <Label htmlFor="friend-id" className="block text-sm font-medium text-gray-700 mb-1">
            Friend's Unique ID
          </Label>
          <Input
            id="friend-id"
            placeholder="e.g., friend_abc123"
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            error={!!error}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button
            className="bg-primary text-white"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
