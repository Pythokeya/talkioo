import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, getInitials, formatTime } from "@/lib/utils";

interface Reaction {
  id: number;
  messageId: number;
  userId: number;
  reaction: string;
}

interface ChatMessageProps {
  id: number;
  content: string;
  type: "text" | "sticker" | "gif" | "voice";
  sentAt: Date;
  isOwn: boolean;
  senderName: string;
  senderAvatar?: string;
  reactions?: Reaction[];
  onReact: (messageId: number, reaction: string) => void;
}

const commonReactions = ["👍", "❤️", "😂", "😮", "👏"];

export function ChatMessage({
  id,
  content,
  type,
  sentAt,
  isOwn,
  senderName,
  senderAvatar,
  reactions = [],
  onReact,
}: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleReact = (reaction: string) => {
    onReact(id, reaction);
    setShowReactions(false);
  };

  const renderContent = () => {
    switch (type) {
      case "text":
        return <p>{content}</p>;
      case "sticker":
      case "gif":
        return (
          <img
            src={content}
            alt="Sticker"
            className="h-24 w-24 object-contain my-2"
          />
        );
      case "voice":
        return (
          <div className="flex items-center">
            <span className="material-icons mr-2">play_arrow</span>
            <div className="h-4 bg-current/20 w-24 rounded-full"></div>
            <span className="ml-2 text-xs">0:08</span>
          </div>
        );
      default:
        return <p>{content}</p>;
    }
  };

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((reaction) => {
    reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
  });

  return (
    <div
      className={cn(
        "flex items-end mb-4 animate-appear",
        isOwn ? "justify-end" : ""
      )}
    >
      {!isOwn && (
        <Avatar className="w-8 h-8 mr-2">
          {senderAvatar ? (
            <AvatarImage src={senderAvatar} alt={senderName} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(senderName)}
            </AvatarFallback>
          )}
        </Avatar>
      )}

      <div className="flex flex-col">
        {isOwn && <span className="text-xs text-gray-500 mb-1 text-right">{formatTime(sentAt)}</span>}
        
        <div className="flex items-end">
          {isOwn && <span className="text-xs text-gray-500 mr-2">{formatTime(sentAt)}</span>}
          
          <div
            className={cn(
              "max-w-xs md:max-w-md py-2 px-4 text-sm shadow-sm",
              isOwn ? "chat-bubble-sent" : "chat-bubble-received",
              (type === "sticker" || type === "gif") ? "bg-transparent shadow-none" : ""
            )}
          >
            {renderContent()}
          </div>
          
          {!isOwn && <span className="text-xs text-gray-500 ml-2">{formatTime(sentAt)}</span>}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={cn("flex mt-1 space-x-1", isOwn ? "justify-end" : "")}>
            {Object.entries(reactionCounts).map(([reaction, count]) => (
              <div key={reaction} className="bg-white rounded-full shadow-sm p-1 flex items-center">
                <span className="text-sm">{reaction}</span>
                {count > 1 && <span className="text-xs ml-1">{count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reaction button */}
      <Popover open={showReactions} onOpenChange={setShowReactions}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100",
              isOwn ? "mr-2" : "ml-2"
            )}
          >
            <span className="material-icons text-sm">add_reaction</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-auto">
          <div className="flex space-x-1">
            {commonReactions.map((reaction) => (
              <Button
                key={reaction}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => handleReact(reaction)}
              >
                <span className="text-lg">{reaction}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
