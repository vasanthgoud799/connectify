import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  professionalHeadline?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      mentions: boolean;
      calls: boolean;
    };
    privacy: {
      showOnlineStatus: boolean;
      showLastSeen: boolean;
      allowDirectMessages: boolean;
    };
    appearance: {
      theme: 'light' | 'dark' | 'system';
      language: string;
    };
  };
  subscription?: {
    tier: 'free' | 'pro' | 'business';
    expiresAt?: Date;
    features: string[];
  };
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPresence {
  status: PresenceStatus;
  customMessage?: string;
  lastSeen: Date;
  isInCall?: boolean;
  currentCallId?: string;
}

interface UserContextType {
  user: UserProfile | null;
  presence: UserPresence | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  
  // Presence actions
  setPresenceStatus: (status: PresenceStatus, customMessage?: string) => Promise<void>;
  updateLastSeen: () => void;
  setInCall: (callId?: string) => void;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from localStorage or token
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check for existing session
        const savedUser = localStorage.getItem('omnitalk_user');
        const savedPresence = localStorage.getItem('omnitalk_presence');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Set default presence
          const presenceData = savedPresence ? JSON.parse(savedPresence) : {
            status: 'online' as PresenceStatus,
            lastSeen: new Date(),
            isInCall: false
          };
          setPresence(presenceData);
          
          // Start presence heartbeat
          startPresenceHeartbeat();
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Presence heartbeat to update last seen
  const startPresenceHeartbeat = () => {
    const interval = setInterval(() => {
      updateLastSeen();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // In a real app, this would be an API call
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('omnitalk_user', JSON.stringify(updatedUser));
      
      console.log('Profile updated:', updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      // In a real app, this would upload to a CDN
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatarUrl = e.target?.result as string;
        await updateProfile({ avatar: avatarUrl });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const setPresenceStatus = async (status: PresenceStatus, customMessage?: string) => {
    try {
      const newPresence: UserPresence = {
        ...presence!,
        status,
        customMessage,
        lastSeen: new Date()
      };
      
      setPresence(newPresence);
      localStorage.setItem('omnitalk_presence', JSON.stringify(newPresence));
      
      console.log('Presence updated:', { status, customMessage });
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  };

  const updateLastSeen = () => {
    if (!presence) return;
    
    const updatedPresence = {
      ...presence,
      lastSeen: new Date()
    };
    
    setPresence(updatedPresence);
    localStorage.setItem('omnitalk_presence', JSON.stringify(updatedPresence));
  };

  const setInCall = (callId?: string) => {
    if (!presence) return;
    
    const updatedPresence = {
      ...presence,
      isInCall: !!callId,
      currentCallId: callId,
      lastSeen: new Date()
    };
    
    setPresence(updatedPresence);
    localStorage.setItem('omnitalk_presence', JSON.stringify(updatedPresence));
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock user profile
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email,
        firstName: email.split('@')[0].split('.')[0] || 'User',
        lastName: email.split('@')[0].split('.')[1] || '',
        displayName: email.split('@')[0].replace('.', ' '),
        bio: '',
        location: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        professionalHeadline: '',
        preferences: {
          notifications: {
            email: true,
            push: true,
            mentions: true,
            calls: true
          },
          privacy: {
            showOnlineStatus: true,
            showLastSeen: true,
            allowDirectMessages: true
          },
          appearance: {
            theme: 'system',
            language: 'en'
          }
        },
        subscription: {
          tier: 'free',
          features: ['basic_calls', 'direct_messages']
        },
        createdAt: new Date(),
        lastActiveAt: new Date()
      };

      const newPresence: UserPresence = {
        status: 'online',
        lastSeen: new Date(),
        isInCall: false
      };

      setUser(newUser);
      setPresence(newPresence);
      
      localStorage.setItem('omnitalk_user', JSON.stringify(newUser));
      localStorage.setItem('omnitalk_presence', JSON.stringify(newPresence));
      
      startPresenceHeartbeat();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // In a real app, this would invalidate the session on the server
      setUser(null);
      setPresence(null);
      localStorage.removeItem('omnitalk_user');
      localStorage.removeItem('omnitalk_presence');
      
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      // In a real app, this would refresh the JWT token
      console.log('Token refreshed');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  const value: UserContextType = {
    user,
    presence,
    isLoading,
    isAuthenticated: !!user,
    updateProfile,
    uploadAvatar,
    setPresenceStatus,
    updateLastSeen,
    setInCall,
    login,
    logout,
    refreshToken
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
