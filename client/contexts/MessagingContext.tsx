import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  timestamp: Date;
  editedAt?: Date;
  reactions?: {
    emoji: string;
    userId: string;
    userName: string;
  }[];
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  mentions?: string[];
  isDeleted?: boolean;
  deliveredTo?: string[];
  readBy?: {
    userId: string;
    readAt: Date;
  }[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  description?: string;
  avatar?: string;
  participants: {
    userId: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: Date;
    lastSeen?: Date;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    muted: boolean;
    pinned: boolean;
    archived: boolean;
    notifications: boolean;
  };
  metadata?: {
    isTyping: {
      userId: string;
      userName: string;
    }[];
  };
}

export interface FileUpload {
  file: File;
  progress: number;
  id: string;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

interface MessagingContextType {
  // State
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  searchResults: Message[];
  fileUploads: FileUpload[];
  
  // Conversation actions
  createConversation: (participants: string[], type: 'direct' | 'group', name?: string) => Promise<Conversation>;
  getConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string) => void;
  updateConversationSettings: (conversationId: string, settings: Partial<Conversation['settings']>) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  
  // Message actions
  sendMessage: (conversationId: string, content: string, type?: Message['type'], replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => Promise<void>;
  
  // File handling
  uploadFile: (file: File, conversationId: string) => Promise<void>;
  downloadFile: (attachmentId: string) => Promise<void>;
  
  // Search and utilities
  searchMessages: (query: string, conversationId?: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  getConversationMessages: (conversationId: string, limit?: number, before?: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  
  const { user } = useUser();

  // Load conversations from backend and bind socket events
  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        await getConversations();
      } catch (e) {
        console.warn('Failed to load conversations', e);
      }
      const { connectSocket, getSocket } = await import("@/lib/socket");
      try { await connectSocket(); } catch (e) { console.warn('Socket connect error', e); }
      const s = getSocket();
      const onServerNew = (payload: { channelId: string; sender: string; senderDisplayName?: string; content: string; createdAt: string }) => {
        const cid = payload.channelId;
        const msg: Message = {
          id: `srv_${Date.now()}`,
          conversationId: cid,
          senderId: payload.sender,
          senderName: payload.senderDisplayName || '',
          content: payload.content,
          type: 'text',
          timestamp: new Date(payload.createdAt),
          readBy: []
        };
        setMessages(prev => ({ ...prev, [cid]: [...(prev[cid] || []), msg] }));
        setConversations(prev => prev.map(c => c.id === cid ? { ...c, lastMessage: msg, updatedAt: new Date() } : c));
      };
      s.on('SERVER:message:new', onServerNew);
      unsub = () => { s.off('SERVER:message:new', onServerNew); };
    })();
    return () => { if (unsub) unsub(); };
  }, [user]);

  const initializeMockData = () => {
    // Deprecated: demo removed
    // Mock conversations
    const mockConversations: Conversation[] = [
      {
        id: 'conv_1',
        type: 'direct',
        participants: [
          {
            userId: user!.id,
            name: user!.displayName,
            avatar: user!.avatar,
            role: 'member',
            joinedAt: new Date(),
          },
          {
            userId: 'user_2',
            name: 'Sarah Wilson',
            avatar: undefined,
            role: 'member',
            joinedAt: new Date(),
          }
        ],
        lastMessage: {
          id: 'msg_1',
          conversationId: 'conv_1',
          senderId: 'user_2',
          senderName: 'Sarah Wilson',
          content: 'Hey! Are you free for a video call later?',
          type: 'text',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          readBy: []
        },
        unreadCount: 1,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        settings: {
          muted: false,
          pinned: false,
          archived: false,
          notifications: true
        }
      },
      {
        id: 'conv_2',
        type: 'group',
        name: 'Design Team',
        description: 'Weekly design sync and collaboration',
        participants: [
          {
            userId: user!.id,
            name: user!.displayName,
            avatar: user!.avatar,
            role: 'admin',
            joinedAt: new Date(),
          },
          {
            userId: 'user_3',
            name: 'John Doe',
            role: 'member',
            joinedAt: new Date(),
          },
          {
            userId: 'user_4',
            name: 'Emily Davis',
            role: 'moderator',
            joinedAt: new Date(),
          }
        ],
        lastMessage: {
          id: 'msg_2',
          conversationId: 'conv_2',
          senderId: 'user_3',
          senderName: 'John Doe',
          content: 'I\'ve uploaded the latest wireframes to the shared folder',
          type: 'text',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          readBy: []
        },
        unreadCount: 3,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        settings: {
          muted: false,
          pinned: true,
          archived: false,
          notifications: true
        }
      }
    ];

    // Mock messages
    const mockMessages: Record<string, Message[]> = {
      conv_1: [
        {
          id: 'msg_1',
          conversationId: 'conv_1',
          senderId: 'user_2',
          senderName: 'Sarah Wilson',
          content: 'Hey! Are you free for a video call later?',
          type: 'text',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          readBy: []
        },
        {
          id: 'msg_0',
          conversationId: 'conv_1',
          senderId: user!.id,
          senderName: user!.displayName,
          content: 'Hi Sarah! How are you doing?',
          type: 'text',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          readBy: [{
            userId: 'user_2',
            readAt: new Date(Date.now() - 45 * 60 * 1000)
          }]
        }
      ],
      conv_2: [
        {
          id: 'msg_2',
          conversationId: 'conv_2',
          senderId: 'user_3',
          senderName: 'John Doe',
          content: 'I\'ve uploaded the latest wireframes to the shared folder',
          type: 'text',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          readBy: []
        },
        {
          id: 'msg_3',
          conversationId: 'conv_2',
          senderId: 'user_4',
          senderName: 'Emily Davis',
          content: 'Great work on the user flow! The onboarding screens look much cleaner now.',
          type: 'text',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          readBy: [{
            userId: user!.id,
            readAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
          }]
        }
      ]
    };

    setConversations(mockConversations);
    setMessages(mockMessages);
  };

  const createConversation = async (participants: string[], type: 'direct' | 'group', name?: string): Promise<Conversation> => {
    setIsLoading(true);
    try {
      const body: any = type === 'direct' ? { type: 'dm', peerId: participants[0] } : { type: 'group', name, members: participants.map(p => ({ user: p })) };
      const { api } = await import('@/lib/api');
      const channel = await api('/api/channels', { method: 'POST', body: JSON.stringify(body) });

      // If the channel already exists, return existing conversation without duplicating
      const existing = conversations.find(c => c.id === channel._id);
      if (existing) {
        return existing;
      }

      const newConversation: Conversation = {
        id: channel._id,
        type,
        name: channel.name,
        participants: (channel.members || []).map((m: any) => ({
          userId: m.user,
          name: m.displayName || m.user,
          role: m.role || 'member',
          joinedAt: new Date()
        })),
        unreadCount: 0,
        createdAt: new Date(channel.createdAt || Date.now()),
        updatedAt: new Date(channel.updatedAt || Date.now()),
        settings: {
          muted: false,
          pinned: false,
          archived: false,
          notifications: true
        }
      };

      setConversations(prev => {
        const seen = new Set(prev.map(p => p.id));
        if (seen.has(newConversation.id)) return prev;
        return [newConversation, ...prev];
      });
      setMessages(prev => ({ ...prev, [newConversation.id]: prev[newConversation.id] || [] }));

      return newConversation;
    } finally {
      setIsLoading(false);
    }
  };

  const getConversations = async () => {
    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const data = await api('/api/channels');
      const convs: Conversation[] = data.map((ch: any) => ({
        id: ch._id,
        type: ch.type === 'dm' ? 'direct' : 'group',
        name: ch.name,
        participants: (ch.members || []).map((m: any) => ({ userId: m.user, name: m.displayName || m.user, role: m.role || 'member', joinedAt: new Date() })),
        lastMessage: ch.lastMessage ? { id: '', conversationId: ch._id, senderId: '', senderName: '', content: ch.lastMessage.content, type: 'text', timestamp: new Date(ch.lastMessage.createdAt), readBy: [] } : undefined,
        unreadCount: 0,
        createdAt: new Date(ch.createdAt),
        updatedAt: new Date(ch.updatedAt),
        settings: { muted: false, pinned: false, archived: false, notifications: true }
      }));
      // Dedupe by id to avoid duplicates from prior state
      const map = new Map<string, Conversation>();
      for (const c of convs) map.set(c.id, c);
      setConversations(Array.from(map.values()));
      const initialMessages: Record<string, Message[]> = {};
      for (const ch of data) {
        initialMessages[ch._id] = (ch.messages || []).map((m: any) => ({
          id: m._id,
          conversationId: ch._id,
          senderId: m.sender,
          senderName: '',
          content: m.content,
          type: 'text',
          timestamp: new Date(m.createdAt),
          readBy: []
        }));
      }
      setMessages(initialMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversationState(conversation);
      // Mark messages as read
      markAsRead(conversationId, '');
      // Load latest messages
      getConversationMessages(conversationId, 50);
    }
  };

  const sendMessage = async (conversationId: string, content: string, type: Message['type'] = 'text', replyTo?: string) => {
    if (!user || !content.trim()) return;

    try {
      const { getSocket } = await import('@/lib/socket');
      const s = getSocket();
      if (s && (s.connected || !s.io.opts.autoConnect)) {
        s.emit('CLIENT:message:send', { channelId: conversationId, content: content.trim() });
      } else {
        const { api } = await import('@/lib/api');
        await api(`/api/channels/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content: content.trim() }) });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg => 
            msg.id === messageId 
              ? { ...msg, content: newContent, editedAt: new Date() }
              : msg
          );
        });
        return updated;
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg => 
            msg.id === messageId 
              ? { ...msg, isDeleted: true, content: 'This message was deleted' }
              : msg
          );
        });
        return updated;
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg => {
            if (msg.id === messageId) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === user.id);
              
              if (existingReaction) {
                return msg; // Already reacted with this emoji
              }
              
              return {
                ...msg,
                reactions: [...reactions, {
                  emoji,
                  userId: user.id,
                  userName: user.displayName
                }]
              };
            }
            return msg;
          });
        });
        return updated;
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg => {
            if (msg.id === messageId) {
              const reactions = (msg.reactions || []).filter(
                r => !(r.emoji === emoji && r.userId === user.id)
              );
              return { ...msg, reactions };
            }
            return msg;
          });
        });
        return updated;
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const markAsRead = async (conversationId: string, messageId: string) => {
    if (!user) return;
    
    // Update unread count
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const updateConversationSettings = async (conversationId: string, settings: Partial<Conversation['settings']>) => {
    try {
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, settings: { ...conv.settings, ...settings } }
          : conv
      ));
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to update conversation settings:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setMessages(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
      
      if (activeConversation?.id === conversationId) {
        setActiveConversationState(null);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const uploadFile = async (file: File, conversationId: string) => {
    const uploadId = `upload_${Date.now()}`;
    
    const newUpload: FileUpload = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading'
    };
    
    setFileUploads(prev => [...prev, newUpload]);
    
    try {
      // Simulate file upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFileUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress }
            : upload
        ));
      }
      
      // Mock file URL
      const fileUrl = URL.createObjectURL(file);
      
      setFileUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'completed', url: fileUrl }
          : upload
      ));
      
      // Send file message
      await sendMessage(conversationId, `Shared ${file.name}`, 'file');
      
      // Remove from uploads after delay
      setTimeout(() => {
        setFileUploads(prev => prev.filter(upload => upload.id !== uploadId));
      }, 3000);
      
    } catch (error) {
      setFileUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'error' }
          : upload
      ));
      console.error('File upload failed:', error);
    }
  };

  const downloadFile = async (attachmentId: string) => {
    try {
      // In a real app, this would download from the server
      console.log('Downloading file:', attachmentId);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const searchMessages = async (query: string, conversationId?: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsLoading(true);
    try {
      const allMessages = conversationId ? (messages[conversationId] || []) : Object.values(messages).flat();
      const results = allMessages.filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()) && !msg.isDeleted);
      setSearchResults(results);
    } finally { setIsLoading(false); }
  };

  const setTyping = (conversationId: string, isTyping: boolean) => {
    if (!user) return;
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const typing = conv.metadata?.isTyping || [];
        if (isTyping) {
          // Add user to typing list if not already there
          if (!typing.some(t => t.userId === user.id)) {
            return {
              ...conv,
              metadata: {
                ...conv.metadata,
                isTyping: [...typing, { userId: user.id, userName: user.displayName }]
              }
            };
          }
        } else {
          // Remove user from typing list
          return {
            ...conv,
            metadata: {
              ...conv.metadata,
              isTyping: typing.filter(t => t.userId !== user.id)
            }
          };
        }
      }
      return conv;
    }));
  };

  const getConversationMessages = async (conversationId: string, limit: number = 50, before?: string) => {
    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const data = await api(`/api/channels/${conversationId}/messages?limit=${limit}${before ? `&before=${before}` : ''}`);
      setMessages(prev => ({
        ...prev,
        [conversationId]: (data || []).map((m: any) => ({ id: m._id, conversationId, senderId: m.sender, senderName: m.senderDisplayName || '', content: m.content, type: 'text', timestamp: new Date(m.createdAt), readBy: [] }))
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const value: MessagingContextType = {
    conversations,
    activeConversation,
    messages,
    isLoading,
    searchResults,
    fileUploads,
    createConversation,
    getConversations,
    setActiveConversation,
    updateConversationSettings,
    deleteConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    uploadFile,
    downloadFile,
    searchMessages,
    setTyping,
    getConversationMessages
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
