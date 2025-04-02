import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import chatWebSocket from '@/lib/websocket';

interface User {
  id: number;
  username: string;
  uniqueId: string;
  ageGroup: string;
  profilePicture?: string;
  isOnline: boolean;
  hasParentalApproval: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (uniqueId: string, password: string) => Promise<void>;
  register: (username: string, uniqueId: string, password: string, ageGroup: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/user');
      const userData = await res.json();
      setUser(userData);
      
      // Connect WebSocket
      if (userData.id) {
        connectWebSocket(userData.id);
      }
    } catch (error) {
      // Not authenticated, that's okay
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (userId: number) => {
    chatWebSocket.connect(userId).catch(err => {
      console.error('WebSocket connection error:', err);
      toast({
        title: 'Connection issue',
        description: 'Unable to establish real-time connection. Some features may be limited.',
        variant: 'destructive'
      });
    });
  };

  const login = async (uniqueId: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/login', { uniqueId, password });
      const data = await res.json();
      setUser(data.user);
      
      // Connect WebSocket
      if (data.user.id) {
        connectWebSocket(data.user.id);
      }
      
      navigate('/');
      toast({
        title: 'Welcome back!',
        description: `You're now logged in as ${data.user.username}`,
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, uniqueId: string, password: string, ageGroup: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/register', { 
        username, 
        uniqueId, 
        password, 
        ageGroup 
      });
      const data = await res.json();
      setUser(data.user);
      
      // Connect WebSocket
      if (data.user.id) {
        connectWebSocket(data.user.id);
      }
      
      navigate('/');
      toast({
        title: 'Registration successful!',
        description: `Welcome to Talkio, ${username}!`,
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      // Disconnect WebSocket
      chatWebSocket.disconnect();
      
      setUser(null);
      navigate('/login');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'An error occurred during logout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
