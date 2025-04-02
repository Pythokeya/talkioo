import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await apiRequest("PUT", "/api/user", {
        username,
        profilePicture,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Your Profile</DialogTitle>
          <DialogClose className="absolute top-4 right-4 text-gray-500">
            <span className="material-icons">close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-2">
            {user.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.username} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(user.username)}
              </AvatarFallback>
            )}
          </Avatar>
          
          {isEditing ? (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture URL</Label>
                <Input
                  id="profilePicture"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="Enter profile picture URL"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(user.username);
                    setProfilePicture(user.profilePicture || "");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-xl font-bold">{user.username}</h4>
              <p className="text-sm text-gray-500">Unique ID: {user.uniqueId}</p>
              <Button
                variant="link"
                className="mt-2 text-primary text-sm flex items-center"
                onClick={() => setIsEditing(true)}
              >
                <span className="material-icons text-sm mr-1">edit</span>
                Edit Profile
              </Button>
            </>
          )}
        </div>
        
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <span className="material-icons text-gray-600 mr-3">security</span>
            <span>Privacy & Safety</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <span className="material-icons text-gray-600 mr-3">notifications</span>
            <span>Notifications</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <span className="material-icons text-gray-600 mr-3">help</span>
            <span>Help & Support</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-destructive"
            onClick={handleLogout}
          >
            <span className="material-icons text-destructive mr-3">logout</span>
            <span>Log Out</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
