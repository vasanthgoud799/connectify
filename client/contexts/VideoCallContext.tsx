import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isPinned: boolean;
  isSpotlighted: boolean;
  stream?: MediaStream;
}

export interface CallSession {
  id: string;
  title: string;
  type: 'instant' | 'scheduled';
  startTime: Date;
  participants: CallParticipant[];
  isRecording: boolean;
  hasWhiteboard: boolean;
  isScreenSharing: boolean;
  screenSharingParticipant?: string;
  activePoll?: {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
  };
  qaSession?: {
    questions: Array<{
      id: string;
      question: string;
      author: string;
      isAnswered: boolean;
      upvotes: number;
    }>;
  };
}

export interface VideoCallContextType {
  // Call state
  currentCall: CallSession | null;
  isInCall: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  
  // Local user state
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  
  // View settings
  viewMode: 'grid' | 'speaker' | 'presentation';
  pinnedParticipant: string | null;
  spotlightedParticipant: string | null;
  
  // Media streams
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  
  // Call management
  startCall: (participants: string[], title?: string, scheduled?: boolean) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  endCall: () => void;
  
  // Media controls
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleHandRaise: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  
  // Participant management
  muteParticipant: (participantId: string) => void;
  removeParticipant: (participantId: string) => void;
  pinParticipant: (participantId: string) => void;
  spotlightParticipant: (participantId: string) => void;
  
  // View controls
  setViewMode: (mode: 'grid' | 'speaker' | 'presentation') => void;
  
  // Recording
  startRecording: () => void;
  stopRecording: () => void;
  
  // Collaboration features
  openWhiteboard: () => void;
  closeWhiteboard: () => void;
  createPoll: (question: string, options: string[]) => void;
  votePoll: (optionIndex: number) => void;
  endPoll: () => void;
  askQuestion: (question: string) => void;
  answerQuestion: (questionId: string) => void;
  
  // Waiting room
  waitingRoomParticipants: CallParticipant[];
  admitParticipant: (participantId: string) => void;
  denyParticipant: (participantId: string) => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Call state
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('excellent');
  
  // Local user state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  // View settings
  const [viewMode, setViewMode] = useState<'grid' | 'speaker' | 'presentation'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [spotlightedParticipant, setSpotlightedParticipant] = useState<string | null>(null);
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  // Waiting room
  const [waitingRoomParticipants, setWaitingRoomParticipants] = useState<CallParticipant[]>([]);
  
  // Mock participants for demo
  const mockParticipants: CallParticipant[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      isHost: true,
      isMuted: false,
      isVideoEnabled: true,
      isHandRaised: false,
      isPinned: false,
      isSpotlighted: false,
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      isHost: false,
      isMuted: true,
      isVideoEnabled: true,
      isHandRaised: false,
      isPinned: false,
      isSpotlighted: false,
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
      isHost: false,
      isMuted: false,
      isVideoEnabled: false,
      isHandRaised: true,
      isPinned: false,
      isSpotlighted: false,
    },
  ];

  // Initialize media devices (simulated)
  const initializeMedia = useCallback(async () => {
    try {
      // In a real app, this would be:
      // const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // For demo purposes, we'll simulate this
      
      toast({
        title: "Camera and microphone access granted",
        description: "Ready to start video calls",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Media access denied",
        description: "Please enable camera and microphone permissions",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const startCall = useCallback(async (participants: string[], title?: string, scheduled = false) => {
    setIsConnecting(true);
    
    const mediaAccess = await initializeMedia();
    if (!mediaAccess) {
      setIsConnecting(false);
      return;
    }
    
    // Simulate call creation
    setTimeout(() => {
      const callSession: CallSession = {
        id: `call-${Date.now()}`,
        title: title || 'Instant Call',
        type: scheduled ? 'scheduled' : 'instant',
        startTime: new Date(),
        participants: [
          {
            id: user?.id || 'current-user',
            name: user?.name || 'You',
            avatar: user?.avatar,
            isHost: true,
            isMuted: false,
            isVideoEnabled: true,
            isHandRaised: false,
            isPinned: false,
            isSpotlighted: false,
          },
          ...mockParticipants.slice(0, participants.length),
        ],
        isRecording: false,
        hasWhiteboard: false,
        isScreenSharing: false,
      };
      
      setCurrentCall(callSession);
      setIsInCall(true);
      setIsConnecting(false);
      
      toast({
        title: "Call started",
        description: `${callSession.title} is now active`,
      });
    }, 2000);
  }, [user, initializeMedia, toast]);

  const joinCall = useCallback(async (callId: string) => {
    setIsConnecting(true);
    
    const mediaAccess = await initializeMedia();
    if (!mediaAccess) {
      setIsConnecting(false);
      return;
    }
    
    // Simulate joining call
    setTimeout(() => {
      const callSession: CallSession = {
        id: callId,
        title: 'Team Meeting',
        type: 'scheduled',
        startTime: new Date(),
        participants: [
          {
            id: user?.id || 'current-user',
            name: user?.name || 'You',
            avatar: user?.avatar,
            isHost: false,
            isMuted: false,
            isVideoEnabled: true,
            isHandRaised: false,
            isPinned: false,
            isSpotlighted: false,
          },
          ...mockParticipants,
        ],
        isRecording: false,
        hasWhiteboard: false,
        isScreenSharing: false,
      };
      
      setCurrentCall(callSession);
      setIsInCall(true);
      setIsConnecting(false);
      
      toast({
        title: "Joined call",
        description: callSession.title,
      });
    }, 1500);
  }, [user, initializeMedia, toast]);

  const endCall = useCallback(() => {
    setCurrentCall(null);
    setIsInCall(false);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    setIsHandRaised(false);
    setPinnedParticipant(null);
    setSpotlightedParticipant(null);
    setViewMode('grid');
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    toast({
      title: "Call ended",
      description: "You have left the call",
    });
  }, [localStream, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Your microphone is now on" : "Your microphone is now off",
    });
  }, [isMuted, toast]);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
    toast({
      title: isVideoEnabled ? "Video off" : "Video on",
      description: isVideoEnabled ? "Your camera is now off" : "Your camera is now on",
    });
  }, [isVideoEnabled, toast]);

  const toggleHandRaise = useCallback(() => {
    setIsHandRaised(prev => !prev);
    toast({
      title: isHandRaised ? "Hand lowered" : "Hand raised",
      description: isHandRaised ? "You lowered your hand" : "You raised your hand",
    });
  }, [isHandRaised, toast]);

  const startScreenShare = useCallback(async () => {
    try {
      // In a real app: await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setIsScreenSharing(true);
      setViewMode('presentation');
      
      toast({
        title: "Screen sharing started",
        description: "Your screen is now being shared",
      });
    } catch (error) {
      toast({
        title: "Screen sharing failed",
        description: "Could not start screen sharing",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopScreenShare = useCallback(() => {
    setIsScreenSharing(false);
    setViewMode('grid');
    
    toast({
      title: "Screen sharing stopped",
      description: "Your screen is no longer being shared",
    });
  }, [toast]);

  const muteParticipant = useCallback((participantId: string) => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => 
          p.id === participantId ? { ...p, isMuted: true } : p
        ),
      };
    });
    
    toast({
      title: "Participant muted",
      description: "The participant has been muted",
    });
  }, [currentCall, toast]);

  const removeParticipant = useCallback((participantId: string) => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.filter(p => p.id !== participantId),
      };
    });
    
    toast({
      title: "Participant removed",
      description: "The participant has been removed from the call",
    });
  }, [currentCall, toast]);

  const pinParticipant = useCallback((participantId: string) => {
    setPinnedParticipant(prev => prev === participantId ? null : participantId);
    
    toast({
      title: pinnedParticipant === participantId ? "Participant unpinned" : "Participant pinned",
      description: pinnedParticipant === participantId ? "Video is unpinned" : "Video has been pinned",
    });
  }, [pinnedParticipant, toast]);

  const spotlightParticipant = useCallback((participantId: string) => {
    setSpotlightedParticipant(prev => prev === participantId ? null : participantId);
    
    toast({
      title: spotlightedParticipant === participantId ? "Spotlight removed" : "Participant spotlighted",
      description: spotlightedParticipant === participantId ? "Spotlight has been removed" : "Participant is now in spotlight for everyone",
    });
  }, [spotlightedParticipant, toast]);

  const startRecording = useCallback(() => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, isRecording: true };
    });
    
    toast({
      title: "Recording started",
      description: "This call is now being recorded",
    });
  }, [currentCall, toast]);

  const stopRecording = useCallback(() => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, isRecording: false };
    });
    
    toast({
      title: "Recording stopped",
      description: "Call recording has been saved",
    });
  }, [currentCall, toast]);

  const openWhiteboard = useCallback(() => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, hasWhiteboard: true };
    });
    
    toast({
      title: "Whiteboard opened",
      description: "Interactive whiteboard is now available",
    });
  }, [currentCall, toast]);

  const closeWhiteboard = useCallback(() => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, hasWhiteboard: false };
    });
  }, [currentCall]);

  const createPoll = useCallback((question: string, options: string[]) => {
    if (!currentCall) return;
    
    const poll = {
      id: `poll-${Date.now()}`,
      question,
      options,
      votes: {},
    };
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, activePoll: poll };
    });
    
    toast({
      title: "Poll created",
      description: question,
    });
  }, [currentCall, toast]);

  const votePoll = useCallback((optionIndex: number) => {
    if (!currentCall?.activePoll || !user) return;
    
    setCurrentCall(prev => {
      if (!prev?.activePoll) return prev;
      return {
        ...prev,
        activePoll: {
          ...prev.activePoll,
          votes: {
            ...prev.activePoll.votes,
            [user.id]: prev.activePoll.options[optionIndex],
          },
        },
      };
    });
    
    toast({
      title: "Vote submitted",
      description: "Your vote has been recorded",
    });
  }, [currentCall, user, toast]);

  const endPoll = useCallback(() => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, activePoll: undefined };
    });
    
    toast({
      title: "Poll ended",
      description: "Poll results are now available",
    });
  }, [currentCall, toast]);

  const askQuestion = useCallback((question: string) => {
    if (!currentCall || !user) return;
    
    const newQuestion = {
      id: `q-${Date.now()}`,
      question,
      author: user.name,
      isAnswered: false,
      upvotes: 0,
    };
    
    setCurrentCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        qaSession: {
          questions: [...(prev.qaSession?.questions || []), newQuestion],
        },
      };
    });
    
    toast({
      title: "Question submitted",
      description: "Your question has been added to the Q&A",
    });
  }, [currentCall, user, toast]);

  const answerQuestion = useCallback((questionId: string) => {
    if (!currentCall) return;
    
    setCurrentCall(prev => {
      if (!prev?.qaSession) return prev;
      return {
        ...prev,
        qaSession: {
          questions: prev.qaSession.questions.map(q =>
            q.id === questionId ? { ...q, isAnswered: true } : q
          ),
        },
      };
    });
    
    toast({
      title: "Question answered",
      description: "The question has been marked as answered",
    });
  }, [currentCall, toast]);

  const admitParticipant = useCallback((participantId: string) => {
    const participant = waitingRoomParticipants.find(p => p.id === participantId);
    if (!participant || !currentCall) return;
    
    setWaitingRoomParticipants(prev => prev.filter(p => p.id !== participantId));
    setCurrentCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: [...prev.participants, participant],
      };
    });
    
    toast({
      title: "Participant admitted",
      description: `${participant.name} has joined the call`,
    });
  }, [waitingRoomParticipants, currentCall, toast]);

  const denyParticipant = useCallback((participantId: string) => {
    const participant = waitingRoomParticipants.find(p => p.id === participantId);
    if (!participant) return;
    
    setWaitingRoomParticipants(prev => prev.filter(p => p.id !== participantId));
    
    toast({
      title: "Participant denied",
      description: `${participant.name} was denied access to the call`,
    });
  }, [waitingRoomParticipants, toast]);

  // Simulate connection quality monitoring
  useEffect(() => {
    if (!isInCall) return;
    
    const interval = setInterval(() => {
      const qualities: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionQuality(randomQuality);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isInCall]);

  const value: VideoCallContextType = {
    // Call state
    currentCall,
    isInCall,
    isConnecting,
    connectionQuality,
    
    // Local user state
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    
    // View settings
    viewMode,
    pinnedParticipant,
    spotlightedParticipant,
    
    // Media streams
    localStream,
    remoteStreams,
    
    // Call management
    startCall,
    joinCall,
    endCall,
    
    // Media controls
    toggleMute,
    toggleVideo,
    toggleHandRaise,
    startScreenShare,
    stopScreenShare,
    
    // Participant management
    muteParticipant,
    removeParticipant,
    pinParticipant,
    spotlightParticipant,
    
    // View controls
    setViewMode,
    
    // Recording
    startRecording,
    stopRecording,
    
    // Collaboration features
    openWhiteboard,
    closeWhiteboard,
    createPoll,
    votePoll,
    endPoll,
    askQuestion,
    answerQuestion,
    
    // Waiting room
    waitingRoomParticipants,
    admitParticipant,
    denyParticipant,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};
