import { useEffect, useState } from "react";
import { motion, useAnimation, Variants } from "framer-motion";
import "./animations.css";

interface AnimatedEmojiProps {
  emoji: string;
  size?: "sm" | "md" | "lg";
  count?: number;
  animation?: "scale" | "bounce" | "float" | "wobble";
  onComplete?: () => void;
  isStatic?: boolean; // If true, will only animate on hover
}

// Define motion variants for different animations
const variants: Record<string, Variants> = {
  scale: {
    initial: { scale: 0 },
    animate: { scale: [0, 1.3, 1], transition: { duration: 0.4 } },
    hover: { scale: 1.2, transition: { duration: 0.2 } },
  },
  bounce: {
    initial: { y: 0 },
    animate: { y: [0, -8, 0, -4, 0], transition: { duration: 0.6 } },
    hover: { y: -5, transition: { duration: 0.2, yoyo: Infinity, repeat: 1 } },
  },
  float: {
    initial: { y: 0, opacity: 1 },
    animate: { y: -15, opacity: [1, 1, 0], transition: { duration: 1.5 } },
    hover: { y: -5, transition: { duration: 0.3 } },
  },
  wobble: {
    initial: { rotate: 0 },
    animate: { rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } },
    hover: { rotate: [0, -7, 7, 0], transition: { duration: 0.6, repeat: 1 } },
  },
};

export function AnimatedEmoji({
  emoji,
  size = "md",
  count = 0,
  animation = "scale",
  onComplete,
  isStatic = false,
}: AnimatedEmojiProps) {
  const controls = useAnimation();
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate font size based on size prop
  const fontSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  useEffect(() => {
    if (!isStatic && !hasAnimated) {
      // Start animation when component mounts
      controls.start("animate").then(() => {
        setHasAnimated(true);
        onComplete?.();
      });
    }
  }, [controls, hasAnimated, isStatic, onComplete]);

  return (
    <motion.div
      className={`inline-flex items-center ${fontSize} cursor-pointer`}
      initial={isStatic ? "initial" : undefined}
      animate={isStatic ? undefined : controls}
      whileHover="hover"
      variants={variants[animation]}
    >
      <span>{emoji}</span>
      {count > 1 && (
        <span className="ml-1 text-xs bg-white/80 px-1 rounded-full">{count}</span>
      )}
    </motion.div>
  );
}

// Component for displaying a grid of reaction emojis
export function ReactionGrid({
  reactions,
  onSelectReaction,
}: {
  reactions: Array<{emoji: string, count?: number}>;
  onSelectReaction: (emoji: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1">
      {reactions.map((reaction) => (
        <div 
          key={reaction.emoji}
          className="bg-white/80 hover:bg-white rounded-full shadow-sm p-1.5"
          onClick={() => onSelectReaction(reaction.emoji)}
        >
          <AnimatedEmoji 
            emoji={reaction.emoji} 
            size="md" 
            count={reaction.count} 
            animation="scale"
            isStatic={true}
          />
        </div>
      ))}
    </div>
  );
}

// Component for emoji explosion animation
export function EmojiExplosion({
  emoji,
  x,
  y,
  onComplete,
}: {
  emoji: string;
  x: number;
  y: number;
  onComplete: () => void;
}) {
  const emojis = Array(8).fill(emoji);
  
  return (
    <div 
      className="fixed pointer-events-none z-50" 
      style={{ left: x, top: y }}
    >
      {emojis.map((emoji, index) => {
        const angle = (index / emojis.length) * Math.PI * 2;
        const distance = 40;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        return (
          <motion.div
            key={index}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{
              x: offsetX,
              y: offsetY,
              opacity: 0,
              scale: 1,
              transition: { duration: 0.8 },
            }}
            className="absolute text-base"
            onAnimationComplete={index === 0 ? onComplete : undefined}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
}