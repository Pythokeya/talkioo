import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Voice Message Recorder Component
export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 60,
}: {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permission, setPermission] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Request microphone permission
  const getMicrophonePermission = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setPermission(true);
      return streamData;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record voice messages");
      return null;
    }
  };
  
  // Start recording function
  const startRecording = async () => {
    const stream = await getMicrophonePermission();
    if (!stream) return;
    
    setIsRecording(true);
    setRecordingTime(0);
    audioChunksRef.current = [];
    
    // Start timer
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    // Create and start media recorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob);
      
      // Stop tracks when done
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
  };
  
  // Stop recording function
  const stopRecording = () => {
    if (!isRecording) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col gap-2 p-2 rounded-md bg-muted/30">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant={isRecording ? "destructive" : "default"}
          className={cn(
            "h-10 w-10 rounded-full",
            isRecording && "animate-pulse"
          )}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <span className="material-icons">
            {isRecording ? "stop" : "mic"}
          </span>
        </Button>
        
        <div className="flex-1 text-sm">
          {isRecording ? (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-red-500 font-medium">Recording...</span>
                <span>{formatTime(recordingTime)}</span>
              </div>
              <div className="h-1 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <span>Click to record a voice message</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Voice Message Player Component
export function VoicePlayer({
  audioUrl,
  isOwn = false,
}: {
  audioUrl: string;
  isOwn?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Handle audio metadata loading (get duration)
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };
  
  // Handle time updates during playback
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setSliderValue(
        (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100
      );
    }
  };
  
  // Handle play/pause
  const togglePlayback = () => {
    if (!audioRef.current || isLoading) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        // Handle autoplay restrictions
        setIsPlaying(false);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle seeking when slider is moved
  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newValue = value[0];
    setSliderValue(newValue);
    
    const newTime = (newValue / 100) * (audioRef.current.duration || 1);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Handle audio ending
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setSliderValue(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  // Handle audio loading error
  const handleError = () => {
    setIsLoading(false);
    console.error("Error loading audio file");
  };
  
  // Format time for display (M:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={cn(
      "flex flex-col p-2 rounded-lg min-w-[150px] max-w-[280px]",
      isOwn 
        ? "bg-primary text-primary-foreground" 
        : "bg-muted text-foreground"
    )}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center gap-2 mb-1.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn(
            "h-8 w-8 rounded-full",
            isOwn 
              ? "text-primary-foreground hover:bg-primary-foreground/10" 
              : "text-foreground hover:bg-foreground/10"
          )}
          onClick={togglePlayback}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="material-icons text-xl animate-spin">refresh</span>
          ) : (
            <span className="material-icons text-xl">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          )}
        </Button>
        
        <div className="flex-1 flex flex-col gap-1">
          {isPlaying ? (
            <div className="voice-wave mb-1">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <Slider
              value={[sliderValue]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleSliderChange}
              className={cn(
                "h-1.5",
                isOwn 
                  ? "[&_[data-theme-accent]]:bg-primary-foreground/30 [&_[data-theme-accent-foreground]]:bg-primary-foreground" 
                  : "[&_[data-theme-accent]]:bg-foreground/30 [&_[data-theme-accent-foreground]]:bg-foreground/70"
              )}
              disabled={isLoading}
            />
          )}
          
          <div className="flex justify-between text-xs">
            <span>{isLoading ? "Loading..." : formatTime(currentTime)}</span>
            <span>{isLoading ? "--:--" : formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}