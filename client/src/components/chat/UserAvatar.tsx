import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  profilePicture?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

export function UserAvatar({
  username,
  profilePicture,
  isOnline = false,
  size = "md",
  showStatus = true,
  className,
}: UserAvatarProps) {
  // Define sizes for avatar
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // Define sizes for status indicator
  const statusSizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        {profilePicture ? (
          <AvatarImage src={profilePicture} alt={username} />
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(username)}
          </AvatarFallback>
        )}
      </Avatar>
      
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            statusSizeClasses[size],
            isOnline ? "bg-green-500" : "bg-gray-300"
          )}
        ></span>
      )}
    </div>
  );
}
