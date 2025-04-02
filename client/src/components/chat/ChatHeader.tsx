import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSelector } from "@/components/chat/ThemeSelector";
import { getInitials } from "@/lib/utils";

interface ChatHeaderProps {
  chatName: string;
  profilePicture?: string;
  status?: "online" | "offline";
  onSearch?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}

export function ChatHeader({
  chatName,
  profilePicture,
  status = "offline",
  onSearch,
  onMute,
  onBlock,
  onReport,
}: ChatHeaderProps) {
  const [_, navigate] = useLocation();
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center shadow-sm">
      {/* Back button for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        onClick={() => navigate("/")}
      >
        <span className="material-icons">arrow_back</span>
      </Button>

      {/* Avatar and chat name */}
      <Avatar className="h-10 w-10">
        {profilePicture ? (
          <AvatarImage src={profilePicture} alt={chatName} />
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(chatName)}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="ml-3 flex-1">
        <h2 className="font-semibold text-gray-800">{chatName}</h2>
        <p className={`text-xs ${status === "online" ? "text-green-500" : "text-gray-500"}`}>
          {status === "online" ? "Online" : "Offline"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-primary"
          onClick={() => setShowThemeSelector(true)}
        >
          <span className="material-icons">palette</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-primary hidden md:flex"
        >
          <span className="material-icons">call</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-primary"
            >
              <span className="material-icons">more_vert</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={onSearch} className="cursor-pointer">
              <span className="material-icons text-gray-600 mr-2 text-sm">search</span>
              <span>Search in chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMute} className="cursor-pointer">
              <span className="material-icons text-gray-600 mr-2 text-sm">notifications_off</span>
              <span>Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBlock} className="cursor-pointer text-destructive">
              <span className="material-icons text-destructive mr-2 text-sm">block</span>
              <span>Block user</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReport} className="cursor-pointer text-destructive">
              <span className="material-icons text-destructive mr-2 text-sm">flag</span>
              <span>Report</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Theme selector modal */}
      <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
    </div>
  );
}
