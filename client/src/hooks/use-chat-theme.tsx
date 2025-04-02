import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

type ChatTheme = 'default' | 'space' | 'nature' | 'pastel';

interface ChatThemeContextType {
  theme: ChatTheme;
  setTheme: (theme: ChatTheme) => Promise<void>;
  isLoading: boolean;
}

const ChatThemeContext = createContext<ChatThemeContextType | undefined>(undefined);

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ChatTheme>('default');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTheme();
    }
  }, [isAuthenticated, user]);

  const loadUserTheme = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/preferences');
      const preferences = await res.json();
      
      if (preferences.chatTheme && isValidTheme(preferences.chatTheme)) {
        setThemeState(preferences.chatTheme as ChatTheme);
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      // Use default theme if there's an error
    } finally {
      setIsLoading(false);
    }
  };

  const isValidTheme = (theme: string): boolean => {
    return ['default', 'space', 'nature', 'pastel'].includes(theme);
  };

  const setTheme = async (newTheme: ChatTheme) => {
    if (!isValidTheme(newTheme)) {
      toast({
        title: 'Invalid theme',
        description: 'The selected theme is not valid',
        variant: 'destructive',
      });
      return;
    }

    setThemeState(newTheme);
    
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        await apiRequest('PUT', '/api/preferences', { chatTheme: newTheme });
        toast({
          title: 'Theme updated',
          description: `Chat theme changed to ${newTheme}`,
        });
      } catch (error) {
        toast({
          title: 'Error saving theme',
          description: 'Your theme preference could not be saved',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ChatThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export function useChatTheme() {
  const context = useContext(ChatThemeContext);
  if (context === undefined) {
    throw new Error('useChatTheme must be used within a ChatThemeProvider');
  }
  return context;
}
