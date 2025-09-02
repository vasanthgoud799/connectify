import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

export interface BlockedUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  blockedAt: Date;
  reason?: string;
  blockedBy: string;
}

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterUserId: string;
  reporterUserName: string;
  type: 'harassment' | 'spam' | 'inappropriate_content' | 'hate_speech' | 'violence' | 'impersonation' | 'copyright' | 'other';
  category: 'message' | 'call' | 'profile' | 'file' | 'behavior';
  content?: string;
  context?: {
    messageId?: string;
    callId?: string;
    fileId?: string;
    screenshot?: string;
  };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  assignedModerator?: string;
  resolution?: {
    action: 'no_action' | 'warning' | 'temporary_restriction' | 'permanent_ban' | 'content_removal';
    note: string;
    resolvedAt: Date;
    resolvedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacySettings {
  profile: {
    showEmail: 'everyone' | 'friends' | 'nobody';
    showStatus: 'everyone' | 'friends' | 'nobody';
    showLastSeen: 'everyone' | 'friends' | 'nobody';
    allowFriendRequests: 'everyone' | 'friends_of_friends' | 'nobody';
    showMutualFriends: boolean;
  };
  communication: {
    whoCanMessage: 'everyone' | 'friends' | 'nobody';
    whoCanCall: 'everyone' | 'friends' | 'nobody';
    allowGroupInvites: 'everyone' | 'friends' | 'nobody';
    readReceipts: boolean;
    typingIndicators: boolean;
  };
  calls: {
    allowCallRecording: 'always' | 'ask' | 'never';
    saveCallHistory: boolean;
    sharePresenceInCalls: boolean;
    allowCallTranscription: boolean;
  };
  safety: {
    contentFilter: 'strict' | 'moderate' | 'off';
    autoBlockSpam: boolean;
    requireApprovalForSharedFiles: boolean;
    hideFromSearch: boolean;
    anonymousUsageData: boolean;
  };
}

export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: 'app' | 'sms' | 'email';
    backupCodes: string[];
    lastVerified?: Date;
  };
  sessions: Array<{
    id: string;
    deviceName: string;
    location: string;
    ipAddress: string;
    userAgent: string;
    isCurrent: boolean;
    lastActivity: Date;
    createdAt: Date;
  }>;
  loginNotifications: {
    email: boolean;
    push: boolean;
    newDevice: boolean;
    suspiciousActivity: boolean;
  };
  dataAndPrivacy: {
    downloadMyData: {
      lastRequested?: Date;
      status: 'none' | 'processing' | 'ready' | 'expired';
      downloadUrl?: string;
    };
    deleteAccount: {
      scheduled?: Date;
      gracePeriod: number; // days
    };
  };
}

export interface ContentModerationRule {
  id: string;
  type: 'keyword' | 'pattern' | 'ai_detection' | 'image_analysis';
  name: string;
  description: string;
  enabled: boolean;
  action: 'flag' | 'warn' | 'block' | 'auto_delete';
  severity: 'low' | 'medium' | 'high';
  patterns?: string[];
  keywords?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationAction {
  id: string;
  targetType: 'user' | 'message' | 'file' | 'call';
  targetId: string;
  action: 'warning' | 'content_removal' | 'temporary_restriction' | 'permanent_ban' | 'shadow_ban';
  reason: string;
  duration?: number; // in hours for temporary actions
  moderatorId: string;
  moderatorName: string;
  evidence?: {
    screenshots: string[];
    logs: string[];
    reports: string[];
  };
  appealable: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface SafetyContextType {
  // Blocking
  blockedUsers: BlockedUser[];
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  
  // Reporting
  reports: Report[];
  createReport: (report: Omit<Report, 'id' | 'reporterUserId' | 'reporterUserName' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getMyReports: () => Promise<Report[]>;
  updateReportStatus: (reportId: string, status: Report['status']) => Promise<void>;
  
  // Privacy Settings
  privacySettings: PrivacySettings;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  
  // Security Settings
  securitySettings: SecuritySettings;
  enable2FA: (method: SecuritySettings['twoFactorAuth']['method']) => Promise<string[]>; // returns backup codes
  disable2FA: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  requestDataDownload: () => Promise<void>;
  scheduleAccountDeletion: (days: number) => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
  
  // Content Moderation (Admin)
  moderationRules: ContentModerationRule[];
  createModerationRule: (rule: Omit<ContentModerationRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateModerationRule: (ruleId: string, updates: Partial<ContentModerationRule>) => Promise<void>;
  deleteModerationRule: (ruleId: string) => Promise<void>;
  
  // Moderation Actions (Admin)
  moderationActions: ModerationAction[];
  takeAction: (action: Omit<ModerationAction, 'id' | 'moderatorId' | 'moderatorName' | 'createdAt'>) => Promise<void>;
  appealAction: (actionId: string, appealText: string) => Promise<void>;
  
  // Content Analysis
  analyzeContent: (content: string, type: 'text' | 'image' | 'video') => Promise<{
    flagged: boolean;
    confidence: number;
    categories: string[];
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }>;
  
  // Safety Dashboard
  getSafetyMetrics: () => Promise<{
    totalReports: number;
    pendingReports: number;
    blockedUsers: number;
    moderationActions: number;
    contentFlagged: number;
  }>;
  
  // User Safety Score
  getUserSafetyScore: (userId?: string) => Promise<{
    score: number; // 0-100
    factors: Array<{
      category: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
    recommendations: string[];
  }>;
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (context === undefined) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // State
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [moderationRules, setModerationRules] = useState<ContentModerationRule[]>([]);
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile: {
      showEmail: 'friends',
      showStatus: 'everyone',
      showLastSeen: 'friends',
      allowFriendRequests: 'everyone',
      showMutualFriends: true
    },
    communication: {
      whoCanMessage: 'everyone',
      whoCanCall: 'friends',
      allowGroupInvites: 'friends',
      readReceipts: true,
      typingIndicators: true
    },
    calls: {
      allowCallRecording: 'ask',
      saveCallHistory: true,
      sharePresenceInCalls: true,
      allowCallTranscription: true
    },
    safety: {
      contentFilter: 'moderate',
      autoBlockSpam: true,
      requireApprovalForSharedFiles: false,
      hideFromSearch: false,
      anonymousUsageData: true
    }
  });
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: {
      enabled: false,
      method: 'app',
      backupCodes: []
    },
    sessions: [
      {
        id: 'current',
        deviceName: 'Chrome on MacBook Pro',
        location: 'San Francisco, CA',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
        isCurrent: true,
        lastActivity: new Date(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'mobile',
        deviceName: 'Safari on iPhone',
        location: 'San Francisco, CA',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)...',
        isCurrent: false,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ],
    loginNotifications: {
      email: true,
      push: true,
      newDevice: true,
      suspiciousActivity: true
    },
    dataAndPrivacy: {
      downloadMyData: {
        status: 'none'
      },
      deleteAccount: {
        gracePeriod: 30
      }
    }
  });

  // Initialize mock data
  useEffect(() => {
    if (user) {
      // Mock blocked users
      setBlockedUsers([
        {
          id: 'blocked1',
          userId: 'spam_user_1',
          name: 'Spam User',
          email: 'spam@example.com',
          blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          reason: 'Excessive spam messages',
          blockedBy: user.id
        }
      ]);

      // Mock reports
      setReports([
        {
          id: 'report1',
          reportedUserId: 'harassment_user',
          reportedUserName: 'Problematic User',
          reporterUserId: user.id,
          reporterUserName: user.name,
          type: 'harassment',
          category: 'message',
          description: 'User sent inappropriate messages and threats',
          severity: 'high',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ]);

      // Mock moderation rules
      setModerationRules([
        {
          id: 'rule1',
          type: 'keyword',
          name: 'Profanity Filter',
          description: 'Blocks messages containing profanity',
          enabled: true,
          action: 'warn',
          severity: 'medium',
          keywords: ['inappropriate', 'spam', 'offensive'],
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'rule2',
          type: 'ai_detection',
          name: 'Hate Speech Detection',
          description: 'AI-powered detection of hate speech and discriminatory content',
          enabled: true,
          action: 'block',
          severity: 'high',
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ]);
    }
  }, [user]);

  const blockUser = useCallback(async (userId: string, reason?: string) => {
    try {
      const newBlock: BlockedUser = {
        id: `block-${Date.now()}`,
        userId,
        name: 'Blocked User', // In real app, fetch user details
        email: 'blocked@example.com',
        blockedAt: new Date(),
        reason,
        blockedBy: user?.id || ''
      };
      
      setBlockedUsers(prev => [...prev, newBlock]);
      
      toast({
        title: "User blocked",
        description: "The user has been blocked and can no longer contact you",
      });
    } catch (error) {
      toast({
        title: "Failed to block user",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      setBlockedUsers(prev => prev.filter(blocked => blocked.userId !== userId));
      
      toast({
        title: "User unblocked",
        description: "The user can now contact you again",
      });
    } catch (error) {
      toast({
        title: "Failed to unblock user",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUsers.some(blocked => blocked.userId === userId);
  }, [blockedUsers]);

  const createReport = useCallback(async (reportData: Omit<Report, 'id' | 'reporterUserId' | 'reporterUserName' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newReport: Report = {
        ...reportData,
        id: `report-${Date.now()}`,
        reporterUserId: user?.id || '',
        reporterUserName: user?.name || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setReports(prev => [...prev, newReport]);
      
      toast({
        title: "Report submitted",
        description: "Thank you for reporting this. Our team will review it shortly.",
      });
    } catch (error) {
      toast({
        title: "Failed to submit report",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const getMyReports = useCallback(async () => {
    return reports.filter(report => report.reporterUserId === user?.id);
  }, [reports, user]);

  const updateReportStatus = useCallback(async (reportId: string, status: Report['status']) => {
    setReports(prev => prev.map(report =>
      report.id === reportId
        ? { ...report, status, updatedAt: new Date() }
        : report
    ));
    
    toast({
      title: "Report updated",
      description: `Report status changed to ${status}`,
    });
  }, [toast]);

  const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({
      ...prev,
      ...Object.keys(updates).reduce((acc, key) => {
        acc[key as keyof PrivacySettings] = {
          ...prev[key as keyof PrivacySettings],
          ...updates[key as keyof PrivacySettings]
        };
        return acc;
      }, {} as Partial<PrivacySettings>)
    }));
    
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved",
    });
  }, [toast]);

  const enable2FA = useCallback(async (method: SecuritySettings['twoFactorAuth']['method']): Promise<string[]> => {
    // Simulate 2FA setup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const backupCodes = [
      'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6',
      'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2'
    ];
    
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorAuth: {
        enabled: true,
        method,
        backupCodes,
        lastVerified: new Date()
      }
    }));
    
    toast({
      title: "Two-factor authentication enabled",
      description: `2FA has been enabled using ${method}. Save your backup codes safely.`,
    });
    
    return backupCodes;
  }, [toast]);

  const disable2FA = useCallback(async () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorAuth: {
        enabled: false,
        method: 'app',
        backupCodes: []
      }
    }));
    
    toast({
      title: "Two-factor authentication disabled",
      description: "2FA has been disabled for your account",
      variant: "destructive",
    });
  }, [toast]);

  const revokeSession = useCallback(async (sessionId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.id !== sessionId)
    }));
    
    toast({
      title: "Session revoked",
      description: "The session has been terminated",
    });
  }, [toast]);

  const revokeAllSessions = useCallback(async () => {
    setSecuritySettings(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.isCurrent)
    }));
    
    toast({
      title: "All sessions revoked",
      description: "All other sessions have been terminated",
    });
  }, [toast]);

  const requestDataDownload = useCallback(async () => {
    setSecuritySettings(prev => ({
      ...prev,
      dataAndPrivacy: {
        ...prev.dataAndPrivacy,
        downloadMyData: {
          lastRequested: new Date(),
          status: 'processing'
        }
      }
    }));
    
    // Simulate processing
    setTimeout(() => {
      setSecuritySettings(prev => ({
        ...prev,
        dataAndPrivacy: {
          ...prev.dataAndPrivacy,
          downloadMyData: {
            ...prev.dataAndPrivacy.downloadMyData,
            status: 'ready',
            downloadUrl: 'https://downloads.omnitalk.app/user-data.zip'
          }
        }
      }));
      
      toast({
        title: "Data download ready",
        description: "Your data archive is ready for download",
      });
    }, 5000);
    
    toast({
      title: "Data download requested",
      description: "We're preparing your data archive. You'll be notified when it's ready.",
    });
  }, [toast]);

  const scheduleAccountDeletion = useCallback(async (days: number) => {
    const deletionDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    setSecuritySettings(prev => ({
      ...prev,
      dataAndPrivacy: {
        ...prev.dataAndPrivacy,
        deleteAccount: {
          scheduled: deletionDate,
          gracePeriod: days
        }
      }
    }));
    
    toast({
      title: "Account deletion scheduled",
      description: `Your account will be deleted on ${deletionDate.toLocaleDateString()}. You can cancel this anytime before then.`,
      variant: "destructive",
    });
  }, [toast]);

  const cancelAccountDeletion = useCallback(async () => {
    setSecuritySettings(prev => ({
      ...prev,
      dataAndPrivacy: {
        ...prev.dataAndPrivacy,
        deleteAccount: {
          gracePeriod: prev.dataAndPrivacy.deleteAccount.gracePeriod
        }
      }
    }));
    
    toast({
      title: "Account deletion cancelled",
      description: "Your account deletion has been cancelled",
    });
  }, [toast]);

  const createModerationRule = useCallback(async (ruleData: Omit<ContentModerationRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    const newRule: ContentModerationRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      createdBy: user?.id || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setModerationRules(prev => [...prev, newRule]);
    
    toast({
      title: "Moderation rule created",
      description: `New ${ruleData.type} rule "${ruleData.name}" has been created`,
    });
  }, [user, toast]);

  const updateModerationRule = useCallback(async (ruleId: string, updates: Partial<ContentModerationRule>) => {
    setModerationRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, ...updates, updatedAt: new Date() }
        : rule
    ));
    
    toast({
      title: "Moderation rule updated",
      description: "The rule has been updated successfully",
    });
  }, [toast]);

  const deleteModerationRule = useCallback(async (ruleId: string) => {
    setModerationRules(prev => prev.filter(rule => rule.id !== ruleId));
    
    toast({
      title: "Moderation rule deleted",
      description: "The rule has been deleted",
    });
  }, [toast]);

  const takeAction = useCallback(async (actionData: Omit<ModerationAction, 'id' | 'moderatorId' | 'moderatorName' | 'createdAt'>) => {
    const newAction: ModerationAction = {
      ...actionData,
      id: `action-${Date.now()}`,
      moderatorId: user?.id || 'admin',
      moderatorName: user?.name || 'Admin',
      createdAt: new Date(),
      expiresAt: actionData.duration ? new Date(Date.now() + actionData.duration * 60 * 60 * 1000) : undefined
    };
    
    setModerationActions(prev => [...prev, newAction]);
    
    toast({
      title: "Moderation action taken",
      description: `${actionData.action.replace('_', ' ')} has been applied`,
    });
  }, [user, toast]);

  const appealAction = useCallback(async (actionId: string, appealText: string) => {
    // In a real app, this would create an appeal record
    toast({
      title: "Appeal submitted",
      description: "Your appeal has been submitted for review",
    });
  }, [toast]);

  const analyzeContent = useCallback(async (content: string, type: 'text' | 'image' | 'video') => {
    // Simulate AI content analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock analysis based on content
    const flagged = content.toLowerCase().includes('spam') || content.toLowerCase().includes('inappropriate');
    
    return {
      flagged,
      confidence: flagged ? 0.85 : 0.15,
      categories: flagged ? ['spam', 'inappropriate'] : [],
      severity: flagged ? 'medium' as const : 'low' as const,
      suggestions: flagged ? ['Consider rephrasing', 'Remove inappropriate content'] : []
    };
  }, []);

  const getSafetyMetrics = useCallback(async () => {
    return {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      blockedUsers: blockedUsers.length,
      moderationActions: moderationActions.length,
      contentFlagged: Math.floor(Math.random() * 50) + 10
    };
  }, [reports, blockedUsers, moderationActions]);

  const getUserSafetyScore = useCallback(async (userId?: string) => {
    // Simulate safety score calculation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      score: 85, // Mock score
      factors: [
        {
          category: 'Account Age',
          impact: 'positive' as const,
          description: 'Account has been active for over 6 months'
        },
        {
          category: 'Community Reports',
          impact: 'neutral' as const,
          description: 'No recent reports filed against this user'
        },
        {
          category: 'Content Quality',
          impact: 'positive' as const,
          description: 'Consistently shares appropriate content'
        }
      ],
      recommendations: [
        'Continue following community guidelines',
        'Consider enabling two-factor authentication'
      ]
    };
  }, []);

  const value: SafetyContextType = {
    // Blocking
    blockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    
    // Reporting
    reports,
    createReport,
    getMyReports,
    updateReportStatus,
    
    // Privacy Settings
    privacySettings,
    updatePrivacySettings,
    
    // Security Settings
    securitySettings,
    enable2FA,
    disable2FA,
    revokeSession,
    revokeAllSessions,
    requestDataDownload,
    scheduleAccountDeletion,
    cancelAccountDeletion,
    
    // Content Moderation
    moderationRules,
    createModerationRule,
    updateModerationRule,
    deleteModerationRule,
    
    // Moderation Actions
    moderationActions,
    takeAction,
    appealAction,
    
    // Content Analysis
    analyzeContent,
    
    // Safety Dashboard
    getSafetyMetrics,
    
    // User Safety Score
    getUserSafetyScore
  };

  return (
    <SafetyContext.Provider value={value}>
      {children}
    </SafetyContext.Provider>
  );
};
