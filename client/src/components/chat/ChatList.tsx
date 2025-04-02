import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getInitials, truncateText } from "@/lib/utils";
import { AddFriendModal } from "@/components/modals/AddFriendModal";

export interface ChatContact {
  id: number;
  username: string;
  uniqueId: string;
  profilePicture?: string;
  isOnline: boolean;
  lastMessage?: {
    content: string;
    timestamp: Date;
    unreadCount?: number;
  };
}

export interface ChatGroup {
  id: number;
  name: string;
  icon?: string;
  memberCount: number;
}

interface ChatListProps {
  contacts: ChatContact[];
  groups: ChatGroup[];
  activeContactId?: number;
  pendingRequestsCount: number;
  onShowFriendRequests: () => void;
}

export function ChatList({
  contacts,
  groups,
  activeContactId,
  pendingRequestsCount,
  onShowFriendRequests
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  
  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => 
    contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter groups by search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-600">Messages</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary" 
            aria-label="New message"
            onClick={() => setShowAddFriendModal(true)}
          >
            <span className="material-icons">add_circle</span>
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <span className="material-icons text-sm">search</span>
          </span>
          <Input
            type="text"
            placeholder="Search friends"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Friend requests */}
        {pendingRequestsCount > 0 && (
          <div className="py-2 px-3 bg-blue-50 rounded-lg mb-4 flex justify-between items-center">
            <div>
              <span className="material-icons text-primary text-sm align-text-bottom">notifications</span>
              <span className="text-sm text-primary ml-1">{pendingRequestsCount} friend request{pendingRequestsCount !== 1 ? 's' : ''}</span>
            </div>
            <Button 
              variant="link" 
              className="text-xs text-primary font-medium p-0"
              onClick={onShowFriendRequests}
            >
              View
            </Button>
          </div>
        )}
        
        {/* Contacts list */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <h3 className="font-semibold text-sm text-gray-500 mb-2">CHATS</h3>
          <ul className="space-y-1 mb-6">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <li key={contact.id}>
                  <Link href={`/chat/${contact.id}`}>
                    <a className={cn(
                      "p-2 rounded-lg flex items-center cursor-pointer group transition-colors",
                      activeContactId === contact.id 
                        ? "bg-primary/10" 
                        : "hover:bg-gray-100"
                    )}>
                      <div className="relative">
                        <Avatar>
                          {contact.profilePicture ? (
                            <AvatarImage src={contact.profilePicture} alt={contact.username} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(contact.username)}
                            </AvatarFallback>
                          )}
                          <span className={cn(
                            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                            contact.isOnline ? "bg-green-500" : "bg-gray-300"
                          )}></span>
                        </Avatar>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-800 group-hover:text-gray-900">{contact.username}</span>
                          {contact.lastMessage && (
                            <span className="text-xs text-gray-500 group-hover:text-gray-700">
                              {new Date(contact.lastMessage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-sm text-gray-600 group-hover:text-gray-700 truncate">
                            {truncateText(contact.lastMessage.content, 30)}
                          </p>
                        )}
                      </div>
                      {contact.lastMessage?.unreadCount && contact.lastMessage.unreadCount > 0 && (
                        <div className="bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-xs text-white">{contact.lastMessage.unreadCount}</span>
                        </div>
                      )}
                    </a>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-gray-500">
                {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
              </li>
            )}
          </ul>
          
          {/* Groups list */}
          <h3 className="font-semibold text-sm text-gray-500 mb-2">GROUPS</h3>
          <ul className="space-y-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <li key={group.id} className="p-2 rounded-lg hover:bg-gray-100 flex items-center cursor-pointer">
                  <div className="relative">
                    {group.icon ? (
                      <Avatar>
                        <AvatarImage src={group.icon} alt={group.name} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {getInitials(group.name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                        {getInitials(group.name)}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <span className="font-semibold text-gray-800">{group.name}</span>
                    <p className="text-xs text-gray-500">{group.memberCount} members</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-gray-500">
                {searchQuery ? 'No groups match your search' : 'No groups yet'}
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={showAddFriendModal} 
        onClose={() => setShowAddFriendModal(false)} 
      />
    </nav>
  );
}
