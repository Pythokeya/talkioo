import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials, formatTime } from "@/lib/utils";
import { AnimatedEmoji, ReactionGrid, EmojiExplosion } from "./AnimatedEmoji";
import { VoicePlayer } from "./VoiceMessage";

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
  isEdited?: boolean;
  isDeleted?: boolean;
  onReact: (messageId: number, reaction: string) => void;
  onEdit?: (messageId: number, newContent: string) => void;
  onDelete?: (messageId: number) => void;
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
  isEdited = false,
  isDeleted = false,
  onReact,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState({ x: 0, y: 0 });
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleReact = (reaction: string) => {
    onReact(id, reaction);
    setShowReactions(false);
    
    // Get message position for the explosion effect
    if (messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      setExplosionPosition({ 
        x: isOwn ? rect.left : rect.right, 
        y: rect.top 
      });
      setSelectedEmoji(reaction);
      setShowExplosion(true);
    }
  };

  const handleEditSubmit = () => {
    if (onEdit && editedContent.trim() !== "" && editedContent !== content) {
      onEdit(id, editedContent);
    }
    setIsEditing(false);
  };

  // Check if message is eligible for editing (30 min window)
  const canEdit = () => {
    if (!isOwn || !onEdit || isDeleted || type !== "text") return false;
    const now = new Date();
    const messageTime = new Date(sentAt);
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    return timeDiffMinutes <= 30;
  };

  // Check if message is eligible for deletion (10 min window)
  const canDelete = () => {
    if (!isOwn || !onDelete || isDeleted) return false;
    const now = new Date();
    const messageTime = new Date(sentAt);
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    return timeDiffMinutes <= 10;
  };

  const renderContent = () => {
    if (isDeleted) {
      return <p className="italic text-muted-foreground">This message was deleted</p>;
    }

    if (isEditing && type === "text") {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="flex w-full">
          <Input
            ref={editInputRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-w-[200px]"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost"
            className="ml-2"
          >
            <span className="material-icons text-sm">done</span>
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="ghost"
            className="ml-1"
            onClick={() => { setIsEditing(false); setEditedContent(content); }}
          >
            <span className="material-icons text-sm">close</span>
          </Button>
        </form>
      );
    }

    switch (type) {
      case "text":
        return (
          <div>
            <p>{content}</p>
            {isEdited && (
              <span className="text-xs text-muted-foreground italic ml-1">
                (edited)
              </span>
            )}
          </div>
        );
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
          <VoicePlayer 
            audioUrl={content} 
            isOwn={isOwn}
          />
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
        "flex items-end mb-4 animate-appear relative",
        isOwn ? "justify-end" : ""
      )}
    >
      {/* Emoji explosion effect */}
      {showExplosion && (
        <EmojiExplosion 
          emoji={selectedEmoji}
          x={explosionPosition.x}
          y={explosionPosition.y}
          onComplete={() => setShowExplosion(false)}
        />
      )}
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
            ref={messageRef}
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
                <AnimatedEmoji 
                  emoji={reaction} 
                  size="sm" 
                  count={count} 
                  animation="wobble" 
                  isStatic={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message actions */}
      <div className="flex">
        {/* Edit/Delete menu (only for own messages) */}
        {isOwn && !isEditing && (canEdit() || canDelete()) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                )}
              >
                <span className="material-icons text-sm">more_vert</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {canEdit() && (
                <DropdownMenuItem 
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer flex items-center"
                >
                  <span className="material-icons text-sm mr-2">edit</span>
                  <span className="flex-1">Edit</span>
                </DropdownMenuItem>
              )}
              {canDelete() && (
                <DropdownMenuItem 
                  onClick={() => onDelete && onDelete(id)}
                  className="text-red-500 cursor-pointer focus:text-red-500 flex items-center"
                >
                  <span className="material-icons text-sm mr-2">delete</span>
                  <span className="flex-1">Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
            <ReactionGrid 
              reactions={[
                ...commonReactions.map(emoji => ({ emoji })),
                { emoji: "🎉" }, 
                { emoji: "🔥" }, 
                { emoji: "🙏" },
                { emoji: "💯" }
              ]} 
              onSelectReaction={handleReact}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
