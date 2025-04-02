import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ProfileModal } from "@/components/modals/ProfileModal";
import { FriendRequestsModal } from "@/components/modals/FriendRequestsModal";
import { useAuth } from "@/hooks/use-auth";
import { ChatThemeProvider } from "@/hooks/use-chat-theme";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  
  // Force redirect to login if not authenticated
  if (!isLoading && !user) {
    navigate('/login');
    return null;
  }

  return (
    <ChatThemeProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                  T
                </div>
                <h1 className="text-2xl font-bold ml-2 text-primary font-quicksand">Talkio</h1>
              </div>
            </Link>
            
            <div className="flex items-center">
              <Button
                id="profile-button"
                variant="ghost"
                size="icon"
                className="ml-4 relative"
                onClick={() => setShowProfileModal(true)}
              >
                <div className="relative">
                  <Avatar>
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt={user.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.username || "")}
                      </AvatarFallback>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </Avatar>
                </div>
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-1 pt-16 pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
          <Link href="/">
            <Button variant="ghost" className="flex flex-col items-center p-2 h-auto">
              <span className="material-icons text-primary">chat</span>
              <span className="text-xs text-gray-600">Chats</span>
            </Button>
          </Link>
          
          <Button variant="ghost" className="flex flex-col items-center p-2 h-auto">
            <span className="material-icons text-gray-500">group</span>
            <span className="text-xs text-gray-600">Groups</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-2 h-auto"
            onClick={() => setShowFriendRequestsModal(true)}
          >
            <span className="material-icons text-gray-500">notifications</span>
            <div className="relative">
              <span className="text-xs text-gray-600">Requests</span>
              {/* Add dynamic notification badge here later */}
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-2 h-auto"
            onClick={() => setShowProfileModal(true)}
          >
            <span className="material-icons text-gray-500">settings</span>
            <span className="text-xs text-gray-600">Settings</span>
          </Button>
        </nav>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={logout}
      />
      
      <FriendRequestsModal
        isOpen={showFriendRequestsModal}
        onClose={() => setShowFriendRequestsModal(false)}
      />
    </ChatThemeProvider>
  );
}
