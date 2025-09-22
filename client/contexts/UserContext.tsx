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
        const savedUser = localStorage.getItem('omnitalk_user');
        const savedPresence = localStorage.getItem('omnitalk_presence');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          const presenceData = savedPresence ? JSON.parse(savedPresence) : {
            status: 'online' as PresenceStatus,
            lastSeen: new Date(),
            isInCall: false
          };
          setPresence(presenceData);
          startPresenceHeartbeat();
        } else {
          const token = localStorage.getItem('auth_token');
          const basicUser = localStorage.getItem('auth_user');
          if (token && basicUser) {
            const u = JSON.parse(basicUser);
            setUser(u);
            setPresence({ status: 'online', lastSeen: new Date(), isInCall: false });
            startPresenceHeartbeat();
          }
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

  // Reflect socket connection state in local presence
  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { connectSocket, getSocket } = await import('@/lib/socket');
        try { await connectSocket(); } catch {}
        const s = getSocket();
        const onConnect = () => { setPresenceStatus('online').catch(() => {}); };
        const onDisconnect = () => { setPresenceStatus('offline').catch(() => {}); };
        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        unsub = () => { s.off('connect', onConnect); s.off('disconnect', onDisconnect); };
      } catch {}
    })();
    return () => { if (unsub) unsub(); };
  }, [user]);

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
      // Heartbeat
      try {
        const { api } = await import('@/lib/api');
        await api('/api/users/presence/heartbeat', { method: 'POST' });
      } catch {}
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  };

  const updateLastSeen = () => {
    if (!presence) return;
    const updatedPresence = { ...presence, lastSeen: new Date() };
    setPresence(updatedPresence);
    localStorage.setItem('omnitalk_presence', JSON.stringify(updatedPresence));
    // Send heartbeat to backend to mark online in Redis even if sockets are blocked
    (async () => {
      try {
        const { api } = await import('@/lib/api');
        await api('/api/users/presence/heartbeat', { method: 'POST' });
      } catch {}
    })();
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
    (async () => {
      try {
        const { api } = await import('@/lib/api');
        await api('/api/users/presence/heartbeat', { method: 'POST' });
      } catch {}
    })();
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      async function auth(path: string) {
        const res = await fetch(`/api/auth/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          let msg = `${path} failed`;
          try { const data = await res.json(); msg = data?.error || msg; } catch {}
          throw new Error(msg);
        }
        return res.json();
      }
      let data: any;
      try {
        data = await auth('login');
      } catch {
        data = await auth('signup');
      }
      const { token, user: backendUser } = data;
      const newUser: UserProfile = {
        id: backendUser._id || backendUser.id,
        email: backendUser.email,
        firstName: backendUser.displayName || backendUser.email.split('@')[0],
        lastName: '',
        displayName: backendUser.displayName || backendUser.email,
        avatar: backendUser.profilePictureUrl,
        bio: backendUser.bio || '',
        location: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        professionalHeadline: '',
        preferences: {
          notifications: { email: true, push: true, mentions: true, calls: true },
          privacy: { showOnlineStatus: true, showLastSeen: true, allowDirectMessages: true },
          appearance: { theme: 'system', language: 'en' }
        },
        subscription: { tier: (backendUser.subscriptionTier || 'free'), features: [] },
        createdAt: new Date(),
        lastActiveAt: new Date()
      };
      const newPresence: UserPresence = { status: 'online', lastSeen: new Date(), isInCall: false };
      setUser(newUser);
      setPresence(newPresence);
      localStorage.setItem('omnitalk_user', JSON.stringify(newUser));
      localStorage.setItem('omnitalk_presence', JSON.stringify(newPresence));
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify({ id: newUser.id, email: newUser.email, displayName: newUser.displayName }));
      startPresenceHeartbeat();
      try {
        const { connectSocket } = await import('@/lib/socket');
        await connectSocket();
      } catch {}
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setPresence(null);
      localStorage.removeItem('omnitalk_user');
      localStorage.removeItem('omnitalk_presence');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
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
