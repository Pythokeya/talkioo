import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChatTheme } from "@/hooks/use-chat-theme";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeOption = {
  id: 'default' | 'space' | 'nature' | 'pastel';
  name: string;
  color: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default', name: 'Default', color: 'bg-primary' },
  { id: 'space', name: 'Space', color: 'bg-[#1a1a2e]' },
  { id: 'nature', name: 'Nature', color: 'bg-[#4CAF50]' },
  { id: 'pastel', name: 'Pastel', color: 'bg-[#FFB6C1]' },
];

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { theme, setTheme, isLoading } = useChatTheme();

  const handleApplyTheme = async () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Change Chat Theme</DialogTitle>
          <DialogClose className="absolute top-4 right-4 text-gray-500">
            <span className="material-icons">close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={cn(
                "theme-option bg-gray-100 p-3 rounded-lg flex flex-col items-center",
                theme === option.id && "ring-2 ring-primary"
              )}
              onClick={() => setTheme(option.id)}
              disabled={isLoading}
            >
              <div className={cn("w-12 h-12 rounded-lg mb-2", option.color)}></div>
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
        </div>
        
        <DialogFooter>
          <Button 
            className="bg-primary text-white px-4 py-2"
            onClick={handleApplyTheme}
            disabled={isLoading}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
