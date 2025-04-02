import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Common emojis for family-friendly chat
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", 
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", 
      "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", 
      "😎", "🥸", "🤩", "🥳"
    ]
  },
  {
    name: "Animals",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", 
      "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", 
      "🐔", "🐧", "🐦", "🐤", "🐣", "🦆", "🦅", "🦉", "🦇", "🐺", 
      "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞"
    ]
  },
  {
    name: "Food",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", 
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", 
      "🥒", "🌶", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", 
      "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇"
    ]
  },
  {
    name: "Activities",
    emojis: [
      "⚽️", "🏀", "🏈", "⚾️", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", 
      "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳️", 
      "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", 
      "⛸", "🥌", "🎿"
    ]
  },
  {
    name: "Objects",
    emojis: [
      "📱", "💻", "🖥", "🖱", "🖨", "⌨️", "🖋", "✏️", "🔍", "🔑", 
      "🧸", "🎁", "🎈", "🎉", "🎊", "🎀", "🎨", "🧩", "♟", "🎯", 
      "🎮", "🎲", "🧸", "🪄", "🔮", "🧿", "🧩", "🧶", "🧵", "🧸", 
      "🪆", "🖼", "🧨"
    ]
  }
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  triggerClassName?: string;
}

export function EmojiPicker({ onEmojiSelect, className, triggerClassName }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSelectEmoji = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  const scrollToCategory = (index: number) => {
    setActiveCategory(index);
    categoryRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-gray-500 hover:text-primary", triggerClassName)}
        >
          <span className="material-icons">sentiment_satisfied_alt</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-64 p-0", className)}
        align="start"
        side="top"
      >
        <div className="flex flex-col h-56">
          <div className="flex border-b p-2 overflow-x-auto">
            {EMOJI_CATEGORIES.map((category, index) => (
              <Button
                key={category.name}
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  activeCategory === index ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
                onClick={() => scrollToCategory(index)}
              >
                {category.emojis[0]}
              </Button>
            ))}
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {EMOJI_CATEGORIES.map((category, categoryIndex) => (
                <div 
                  key={category.name}
                  ref={el => categoryRefs.current[categoryIndex] = el}
                >
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 mt-3">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {category.emojis.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        onClick={() => handleSelectEmoji(emoji)}
                      >
                        <span className="text-lg">{emoji}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
