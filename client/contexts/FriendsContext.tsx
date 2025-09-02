import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

export interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
  lastSeen: Date;
  mutualFriends: number;
  location?: string;
  bio?: string;
  company?: string;
  title?: string;
  isBlocked: boolean;
  isFavorite: boolean;
  addedAt: Date;
  customNote?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    mutualFriends: number;
  };
  message?: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export interface ContactSuggestion {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  mutualFriends: number;
  reason: 'email_contact' | 'mutual_friends' | 'company' | 'linkedin' | 'suggested';
  company?: string;
  title?: string;
}

export interface FriendsContextType {
  // Friends data
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  suggestions: ContactSuggestion[];
  blockedUsers: Friend[];
  
  // Loading states
  isLoading: boolean;
  isSending: boolean;
  
  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  // Friend management
  sendFriendRequest: (userId: string, message?: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  addToFavorites: (friendId: string) => Promise<void>;
  removeFromFavorites: (friendId: string) => Promise<void>;
  updateCustomNote: (friendId: string, note: string) => Promise<void>;
  
  // Discovery and search
  searchUsers: (query: string) => Promise<ContactSuggestion[]>;
  importContacts: (contacts: any[]) => Promise<void>;
  refreshSuggestions: () => Promise<void>;
  
  // Bulk actions
  acceptAllRequests: () => Promise<void>;
  deleteAllRequests: () => Promise<void>;
  
  // Analytics
  getStats: () => {
    totalFriends: number;
    onlineFriends: number;
    pendingRequests: number;
    sentRequests: number;
  };
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data initialization
  useEffect(() => {
    if (user) {
      setFriends([
        {
          id: '1',
          userId: 'user1',
          name: 'Alice Johnson',
          email: 'alice@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
          status: 'online',
          lastSeen: new Date(),
          mutualFriends: 12,
          location: 'San Francisco, CA',
          bio: 'Product Manager at TechCorp. Love building amazing experiences!',
          company: 'TechCorp',
          title: 'Senior Product Manager',
          isBlocked: false,
          isFavorite: true,
          addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          customNote: 'Great collaborator on the Q3 project'
        },
        {
          id: '2',
          userId: 'user2',
          name: 'Bob Smith',
          email: 'bob@startup.io',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
          status: 'away',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000),
          mutualFriends: 8,
          location: 'New York, NY',
          bio: 'Full-stack developer passionate about React and Node.js',
          company: 'StartupCorp',
          title: 'Lead Developer',
          isBlocked: false,
          isFavorite: false,
          addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          userId: 'user3',
          name: 'Carol Davis',
          email: 'carol@design.studio',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
          status: 'busy',
          lastSeen: new Date(),
          mutualFriends: 5,
          location: 'Austin, TX',
          bio: 'UX Designer crafting beautiful and intuitive experiences',
          company: 'Design Studio',
          title: 'Senior UX Designer',
          isBlocked: false,
          isFavorite: true,
          addedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          userId: 'user4',
          name: 'David Wilson',
          email: 'david@enterprise.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
          status: 'offline',
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          mutualFriends: 15,
          location: 'Seattle, WA',
          bio: 'Engineering Manager building scalable systems',
          company: 'Enterprise Inc',
          title: 'Engineering Manager',
          isBlocked: false,
          isFavorite: false,
          addedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          customNote: 'Former colleague from Microsoft'
        }
      ]);

      setFriendRequests([
        {
          id: 'req1',
          fromUserId: 'user5',
          toUserId: user.id,
          fromUser: {
            id: 'user5',
            name: 'Emily Chen',
            email: 'emily@techsolutions.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
            bio: 'Software architect with 10+ years experience',
            mutualFriends: 3
          },
          message: 'Hi! We worked together on the API project last year. Would love to connect!',
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          id: 'req2',
          fromUserId: 'user6',
          toUserId: user.id,
          fromUser: {
            id: 'user6',
            name: 'Michael Brown',
            email: 'michael@consulting.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
            bio: 'Business consultant helping startups scale',
            mutualFriends: 7
          },
          message: 'Saw your presentation at the conference. Great insights on team communication!',
          sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      ]);

      setSentRequests([
        {
          id: 'sent1',
          fromUserId: user.id,
          toUserId: 'user7',
          fromUser: {
            id: 'user7',
            name: 'Sarah Taylor',
            email: 'sarah@marketing.pro',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            bio: 'Marketing director with expertise in growth strategies',
            mutualFriends: 2
          },
          message: 'Would love to connect and discuss collaboration opportunities!',
          sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'pending'
        }
      ]);

      setSuggestions([
        {
          id: 'sug1',
          name: 'Jennifer Lopez',
          email: 'jennifer@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
          mutualFriends: 4,
          reason: 'mutual_friends',
          company: 'TechCorp',
          title: 'Product Designer'
        },
        {
          id: 'sug2',
          name: 'Robert Johnson',
          email: 'robert@startup.co',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
          mutualFriends: 6,
          reason: 'company',
          company: 'StartupCorp',
          title: 'Backend Engineer'
        },
        {
          id: 'sug3',
          name: 'Lisa Anderson',
          email: 'lisa@consulting.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
          mutualFriends: 2,
          reason: 'linkedin',
          company: 'Consulting Pro',
          title: 'Strategy Consultant'
        }
      ]);
    }
  }, [user]);

  const sendFriendRequest = useCallback(async (userId: string, message?: string) => {
    setIsSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRequest: FriendRequest = {
        id: `sent-${Date.now()}`,
        fromUserId: user?.id || '',
        toUserId: userId,
        fromUser: {
          id: userId,
          name: 'New User',
          email: 'newuser@example.com',
          mutualFriends: 0
        },
        message,
        sentAt: new Date(),
        status: 'pending'
      };
      
      setSentRequests(prev => [...prev, newRequest]);
      
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [user, toast]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);
      if (!request) return;

      // Add to friends list
      const newFriend: Friend = {
        id: request.fromUser.id,
        userId: request.fromUserId,
        name: request.fromUser.name,
        email: request.fromUser.email,
        avatar: request.fromUser.avatar,
        status: 'online',
        lastSeen: new Date(),
        mutualFriends: request.fromUser.mutualFriends,
        bio: request.fromUser.bio,
        isBlocked: false,
        isFavorite: false,
        addedAt: new Date()
      };

      setFriends(prev => [...prev, newFriend]);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${request.fromUser.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to accept request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [friendRequests, toast]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast({
        title: "Friend request declined",
        description: "The request has been removed",
      });
    } catch (error) {
      toast({
        title: "Failed to decline request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const cancelFriendRequest = useCallback(async (requestId: string) => {
    try {
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast({
        title: "Friend request cancelled",
        description: "The request has been cancelled",
      });
    } catch (error) {
      toast({
        title: "Failed to cancel request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      const friend = friends.find(f => f.id === friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      
      toast({
        title: "Friend removed",
        description: friend ? `${friend.name} has been removed from your friends` : "Friend removed",
      });
    } catch (error) {
      toast({
        title: "Failed to remove friend",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [friends, toast]);

  const blockUser = useCallback(async (userId: string) => {
    try {
      const friend = friends.find(f => f.userId === userId);
      if (friend) {
        const blockedUser = { ...friend, isBlocked: true };
        setBlockedUsers(prev => [...prev, blockedUser]);
        setFriends(prev => prev.filter(f => f.userId !== userId));
      }
      
      toast({
        title: "User blocked",
        description: "The user has been blocked and removed from your friends",
      });
    } catch (error) {
      toast({
        title: "Failed to block user",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [friends, toast]);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      setBlockedUsers(prev => prev.filter(u => u.userId !== userId));
      
      toast({
        title: "User unblocked",
        description: "The user has been unblocked",
      });
    } catch (error) {
      toast({
        title: "Failed to unblock user",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addToFavorites = useCallback(async (friendId: string) => {
    try {
      setFriends(prev => prev.map(f => 
        f.id === friendId ? { ...f, isFavorite: true } : f
      ));
      
      toast({
        title: "Added to favorites",
        description: "Friend added to your favorites",
      });
    } catch (error) {
      toast({
        title: "Failed to add to favorites",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const removeFromFavorites = useCallback(async (friendId: string) => {
    try {
      setFriends(prev => prev.map(f => 
        f.id === friendId ? { ...f, isFavorite: false } : f
      ));
      
      toast({
        title: "Removed from favorites",
        description: "Friend removed from your favorites",
      });
    } catch (error) {
      toast({
        title: "Failed to remove from favorites",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateCustomNote = useCallback(async (friendId: string, note: string) => {
    try {
      setFriends(prev => prev.map(f => 
        f.id === friendId ? { ...f, customNote: note } : f
      ));
      
      toast({
        title: "Note updated",
        description: "Custom note has been saved",
      });
    } catch (error) {
      toast({
        title: "Failed to update note",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const searchUsers = useCallback(async (query: string): Promise<ContactSuggestion[]> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResults: ContactSuggestion[] = [
        {
          id: 'search1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
          mutualFriends: 2,
          reason: 'suggested',
          company: 'Example Corp',
          title: 'Software Engineer'
        }
      ];
      
      return mockResults.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.email.toLowerCase().includes(query.toLowerCase())
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importContacts = useCallback(async (contacts: any[]) => {
    try {
      // Simulate contact import
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Contacts imported",
        description: `${contacts.length} contacts imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to import contacts",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Suggestions updated",
        description: "Friend suggestions have been refreshed",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const acceptAllRequests = useCallback(async () => {
    try {
      for (const request of friendRequests) {
        await acceptFriendRequest(request.id);
      }
    } catch (error) {
      toast({
        title: "Failed to accept all requests",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [friendRequests, acceptFriendRequest, toast]);

  const deleteAllRequests = useCallback(async () => {
    try {
      setFriendRequests([]);
      
      toast({
        title: "All requests deleted",
        description: "All friend requests have been removed",
      });
    } catch (error) {
      toast({
        title: "Failed to delete requests",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getStats = useCallback(() => {
    return {
      totalFriends: friends.length,
      onlineFriends: friends.filter(f => f.status === 'online').length,
      pendingRequests: friendRequests.length,
      sentRequests: sentRequests.length
    };
  }, [friends, friendRequests, sentRequests]);

  const value: FriendsContextType = {
    // Data
    friends,
    friendRequests,
    sentRequests,
    suggestions,
    blockedUsers,
    
    // Loading states
    isLoading,
    isSending,
    
    // Search and filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    
    // Friend management
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    addToFavorites,
    removeFromFavorites,
    updateCustomNote,
    
    // Discovery and search
    searchUsers,
    importContacts,
    refreshSuggestions,
    
    // Bulk actions
    acceptAllRequests,
    deleteAllRequests,
    
    // Analytics
    getStats
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};
