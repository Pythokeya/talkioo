import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { StickerPicker } from "@/components/ui/sticker-picker";
import { VoiceRecorder } from "./VoiceMessage";

interface ChatInputProps {
  onSendMessage: (content: string, type: "text" | "sticker" | "gif" | "voice") => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage, "text");
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    // Focus the input after selecting an emoji
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleStickerSelect = (stickerUrl: string) => {
    onSendMessage(stickerUrl, "sticker");
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Send the voice message
    onSendMessage(audioUrl, "voice");
    
    // Hide the recorder UI
    setShowRecorder(false);
  };

  const toggleVoiceRecorder = () => {
    setShowRecorder(!showRecorder);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {/* Voice recorder UI */}
      {showRecorder && (
        <div className="mb-3">
          <VoiceRecorder 
            onRecordingComplete={handleVoiceRecordingComplete} 
            maxDuration={60}
          />
        </div>
      )}
      
      <div className="flex items-center">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        
        <StickerPicker onStickerSelect={handleStickerSelect} />
        
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-gray-500"
            disabled={disabled}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className={`ml-2 text-gray-500 hover:text-primary ${showRecorder ? 'text-destructive' : ''}`}
            onClick={toggleVoiceRecorder}
            disabled={disabled}
            title={showRecorder ? "Cancel recording" : "Record voice message"}
          >
            <span className="material-icons">{showRecorder ? "close" : "mic"}</span>
          </Button>
        </div>
        
        <Button
          className="ml-2 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center"
          size="icon"
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
        >
          <span className="material-icons">send</span>
        </Button>
      </div>
    </div>
  );
}
