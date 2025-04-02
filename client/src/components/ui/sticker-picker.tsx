import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Family-friendly stickers
const STICKER_CATEGORIES = [
  {
    name: "animals",
    stickers: [
      "https://media.giphy.com/media/H4DjXQXamtTiIuCcRU/giphy.gif",
      "https://media.giphy.com/media/RQSuZfuylVNAY/giphy.gif",
      "https://media.giphy.com/media/GfXFVHUzjlbOg/giphy.gif",
      "https://media.giphy.com/media/uw0KpagtwEJtC/giphy.gif",
      "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
      "https://media.giphy.com/media/B6odR0DhiENiMdojZ6/giphy.gif",
      "https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif",
      "https://media.giphy.com/media/fTI9mBoWLef8k/giphy.gif"
    ]
  },
  {
    name: "fun",
    stickers: [
      "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
      "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
      "https://media.giphy.com/media/l0HlGXmii2d1qyYfK/giphy.gif",
      "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
      "https://media.giphy.com/media/TdfyKrN7HGTIY/giphy.gif",
      "https://media.giphy.com/media/QBC5foQmcOkdq/giphy.gif",
      "https://media.giphy.com/media/wW95fEq09hOI8/giphy.gif",
      "https://media.giphy.com/media/DKnMqdm9i980E/giphy.gif"
    ]
  },
  {
    name: "celebration",
    stickers: [
      "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
      "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
      "https://media.giphy.com/media/26gsccje7r5WUrXsA/giphy.gif",
      "https://media.giphy.com/media/26gsv1iextbvdStoA/giphy.gif",
      "https://media.giphy.com/media/26FPq3g92hR8Q61bq/giphy.gif",
      "https://media.giphy.com/media/6wpHEQNjkd74Q/giphy.gif",
      "https://media.giphy.com/media/26gsasMADObIPKg8U/giphy.gif",
      "https://media.giphy.com/media/13G7hmmFr9yuxG/giphy.gif"
    ]
  }
];

interface StickerPickerProps {
  onStickerSelect: (sticker: string) => void;
  className?: string;
  triggerClassName?: string;
}

export function StickerPicker({ onStickerSelect, className, triggerClassName }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectSticker = (sticker: string) => {
    onStickerSelect(sticker);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-gray-500 hover:text-primary", triggerClassName)}
        >
          <span className="material-icons">attach_file</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-72 p-2", className)}
        align="start"
        side="top"
      >
        <Tabs defaultValue="animals">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="animals">Animals</TabsTrigger>
            <TabsTrigger value="fun">Fun</TabsTrigger>
            <TabsTrigger value="celebration">Celebration</TabsTrigger>
          </TabsList>
          
          {STICKER_CATEGORIES.map((category) => (
            <TabsContent key={category.name} value={category.name}>
              <ScrollArea className="h-52">
                <div className="grid grid-cols-2 gap-2 p-1">
                  {category.stickers.map((sticker, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="p-1 h-auto aspect-square hover:bg-accent rounded-lg"
                      onClick={() => handleSelectSticker(sticker)}
                    >
                      <img 
                        src={sticker} 
                        alt={`${category.name} sticker ${index+1}`} 
                        className="w-full h-auto object-contain max-h-20 rounded"
                      />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
