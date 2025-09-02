import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

export interface TranscriptionSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  isEdited: boolean;
  language: string;
}

export interface CallTranscription {
  id: string;
  callId: string;
  segments: TranscriptionSegment[];
  summary?: CallSummary;
  language: string;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallSummary {
  id: string;
  callId: string;
  overview: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  participants: string[];
  duration: number;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
}

export interface AISettings {
  realTimeTranscription: boolean;
  autoSummary: boolean;
  noiseCancellation: boolean;
  languageDetection: boolean;
  profanityFilter: boolean;
  speakerIdentification: boolean;
  sentimentAnalysis: boolean;
  preferredLanguage: string;
  transcriptionQuality: 'standard' | 'enhanced' | 'premium';
}

export interface NoiseReduction {
  isActive: boolean;
  level: number; // 0-100
  type: 'basic' | 'advanced' | 'ai_enhanced';
  backgroundNoiseLevel: number;
  voiceClarity: number;
}

export interface VirtualBackground {
  id: string;
  name: string;
  type: 'image' | 'video' | 'blur' | 'ai_generated';
  url?: string;
  preview: string;
  isActive: boolean;
  category: 'professional' | 'casual' | 'fun' | 'custom';
}

export interface AIContextType {
  // Transcription
  currentTranscription: CallTranscription | null;
  isTranscribing: boolean;
  transcriptionLanguage: string;
  startTranscription: (callId: string, language?: string) => Promise<void>;
  stopTranscription: () => void;
  pauseTranscription: () => void;
  resumeTranscription: () => void;
  editTranscription: (segmentId: string, newText: string) => Promise<void>;
  exportTranscription: (callId: string, format: 'txt' | 'json' | 'srt' | 'vtt') => Promise<string>;
  
  // Summaries
  currentSummary: CallSummary | null;
  isGeneratingSummary: boolean;
  generateSummary: (callId: string) => Promise<CallSummary>;
  updateActionItem: (itemId: string, updates: Partial<ActionItem>) => Promise<void>;
  addActionItem: (callId: string, item: Omit<ActionItem, 'id' | 'createdAt'>) => Promise<void>;
  exportSummary: (summaryId: string, format: 'pdf' | 'docx' | 'md') => Promise<string>;
  
  // Noise Cancellation & Audio
  noiseReduction: NoiseReduction;
  toggleNoiseCancellation: () => void;
  setNoiseReductionLevel: (level: number) => void;
  setNoiseReductionType: (type: NoiseReduction['type']) => void;
  analyzeAudioQuality: () => Promise<{
    noiseLevel: number;
    speechClarity: number;
    recommendations: string[];
  }>;
  
  // Virtual Backgrounds & Visual AI
  virtualBackgrounds: VirtualBackground[];
  activeBackground: VirtualBackground | null;
  setVirtualBackground: (backgroundId: string) => void;
  removeVirtualBackground: () => void;
  uploadCustomBackground: (file: File) => Promise<VirtualBackground>;
  generateAIBackground: (prompt: string) => Promise<VirtualBackground>;
  
  // Auto-framing & Visual Enhancement
  autoFraming: {
    isActive: boolean;
    sensitivity: number;
    followMovement: boolean;
  };
  toggleAutoFraming: () => void;
  setAutoFramingSensitivity: (sensitivity: number) => void;
  
  // Settings
  aiSettings: AISettings;
  updateAISettings: (updates: Partial<AISettings>) => Promise<void>;
  
  // Analytics
  getTranscriptionAccuracy: () => number;
  getUsageStatistics: () => Promise<{
    transcriptionMinutes: number;
    summariesGenerated: number;
    actionItemsCreated: number;
    backgroundsUsed: number;
  }>;
  
  // Language Support
  supportedLanguages: Array<{ code: string; name: string; accuracy: number }>;
  detectLanguage: (audioSample?: Blob) => Promise<string>;
  translateTranscription: (targetLanguage: string) => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // State
  const [currentTranscription, setCurrentTranscription] = useState<CallTranscription | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en-US');
  const [currentSummary, setCurrentSummary] = useState<CallSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [noiseReduction, setNoiseReduction] = useState<NoiseReduction>({
    isActive: true,
    level: 75,
    type: 'ai_enhanced',
    backgroundNoiseLevel: 0,
    voiceClarity: 95
  });
  
  const [virtualBackgrounds] = useState<VirtualBackground[]>([
    {
      id: 'blur',
      name: 'Blur Background',
      type: 'blur',
      preview: '/backgrounds/blur-preview.jpg',
      isActive: false,
      category: 'professional'
    },
    {
      id: 'office1',
      name: 'Modern Office',
      type: 'image',
      url: '/backgrounds/office1.jpg',
      preview: '/backgrounds/office1-preview.jpg',
      isActive: false,
      category: 'professional'
    },
    {
      id: 'home1',
      name: 'Cozy Home Office',
      type: 'image',
      url: '/backgrounds/home1.jpg',
      preview: '/backgrounds/home1-preview.jpg',
      isActive: false,
      category: 'casual'
    },
    {
      id: 'nature1',
      name: 'Mountain View',
      type: 'image',
      url: '/backgrounds/nature1.jpg',
      preview: '/backgrounds/nature1-preview.jpg',
      isActive: false,
      category: 'fun'
    }
  ]);
  
  const [activeBackground, setActiveBackground] = useState<VirtualBackground | null>(null);
  
  const [autoFraming, setAutoFraming] = useState({
    isActive: false,
    sensitivity: 50,
    followMovement: true
  });
  
  const [aiSettings, setAISettings] = useState<AISettings>({
    realTimeTranscription: true,
    autoSummary: true,
    noiseCancellation: true,
    languageDetection: true,
    profanityFilter: false,
    speakerIdentification: true,
    sentimentAnalysis: true,
    preferredLanguage: 'en-US',
    transcriptionQuality: 'enhanced'
  });

  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)', accuracy: 95 },
    { code: 'en-GB', name: 'English (UK)', accuracy: 94 },
    { code: 'es-ES', name: 'Spanish', accuracy: 92 },
    { code: 'fr-FR', name: 'French', accuracy: 91 },
    { code: 'de-DE', name: 'German', accuracy: 90 },
    { code: 'it-IT', name: 'Italian', accuracy: 89 },
    { code: 'pt-BR', name: 'Portuguese', accuracy: 88 },
    { code: 'ja-JP', name: 'Japanese', accuracy: 87 },
    { code: 'ko-KR', name: 'Korean', accuracy: 86 },
    { code: 'zh-CN', name: 'Chinese (Simplified)', accuracy: 85 }
  ];

  // Mock transcription data
  const mockTranscriptionSegments: TranscriptionSegment[] = [
    {
      id: 'seg1',
      speakerId: 'speaker1',
      speakerName: 'Alice Johnson',
      text: 'Good morning everyone, thank you for joining our weekly team meeting.',
      confidence: 0.95,
      startTime: 0,
      endTime: 4.2,
      isEdited: false,
      language: 'en-US'
    },
    {
      id: 'seg2',
      speakerId: 'speaker2',
      speakerName: 'Bob Smith',
      text: 'Thanks Alice. I wanted to discuss the progress on the new feature we\'ve been working on.',
      confidence: 0.92,
      startTime: 4.5,
      endTime: 9.1,
      isEdited: false,
      language: 'en-US'
    },
    {
      id: 'seg3',
      speakerId: 'speaker1',
      speakerName: 'Alice Johnson',
      text: 'Great! Could you walk us through the current status?',
      confidence: 0.97,
      startTime: 9.5,
      endTime: 12.8,
      isEdited: false,
      language: 'en-US'
    }
  ];

  // Real-time noise monitoring simulation
  useEffect(() => {
    if (noiseReduction.isActive) {
      const interval = setInterval(() => {
        setNoiseReduction(prev => ({
          ...prev,
          backgroundNoiseLevel: Math.random() * 30, // 0-30% noise level
          voiceClarity: 85 + Math.random() * 15 // 85-100% clarity
        }));
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [noiseReduction.isActive]);

  const startTranscription = useCallback(async (callId: string, language = 'en-US') => {
    setIsTranscribing(true);
    setTranscriptionLanguage(language);
    
    try {
      // Simulate starting transcription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transcription: CallTranscription = {
        id: `transcription-${callId}`,
        callId,
        segments: [],
        language,
        accuracy: 0.94,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentTranscription(transcription);
      
      // Simulate real-time transcription updates
      let segmentIndex = 0;
      const interval = setInterval(() => {
        if (segmentIndex < mockTranscriptionSegments.length) {
          setCurrentTranscription(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              segments: [...prev.segments, mockTranscriptionSegments[segmentIndex]],
              updatedAt: new Date()
            };
          });
          segmentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 5000);
      
      toast({
        title: "Transcription started",
        description: `Real-time transcription active in ${language}`,
      });
    } catch (error) {
      setIsTranscribing(false);
      toast({
        title: "Failed to start transcription",
        description: "Please check your microphone permissions",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopTranscription = useCallback(() => {
    setIsTranscribing(false);
    
    toast({
      title: "Transcription stopped",
      description: "Transcription has been saved",
    });
  }, [toast]);

  const pauseTranscription = useCallback(() => {
    // Pause transcription logic
    toast({
      title: "Transcription paused",
      description: "Transcription is temporarily paused",
    });
  }, [toast]);

  const resumeTranscription = useCallback(() => {
    // Resume transcription logic
    toast({
      title: "Transcription resumed",
      description: "Transcription is now active",
    });
  }, [toast]);

  const editTranscription = useCallback(async (segmentId: string, newText: string) => {
    if (!currentTranscription) return;
    
    setCurrentTranscription(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        segments: prev.segments.map(segment =>
          segment.id === segmentId
            ? { ...segment, text: newText, isEdited: true }
            : segment
        ),
        updatedAt: new Date()
      };
    });
    
    toast({
      title: "Transcription updated",
      description: "Your edit has been saved",
    });
  }, [currentTranscription, toast]);

  const exportTranscription = useCallback(async (callId: string, format: 'txt' | 'json' | 'srt' | 'vtt'): Promise<string> => {
    // Simulate export generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const filename = `transcription-${callId}.${format}`;
    
    toast({
      title: "Export ready",
      description: `${filename} is ready for download`,
    });
    
    return `https://exports.omnitalk.app/${filename}`;
  }, [toast]);

  const generateSummary = useCallback(async (callId: string): Promise<CallSummary> => {
    setIsGeneratingSummary(true);
    
    try {
      // Simulate AI summary generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const summary: CallSummary = {
        id: `summary-${callId}`,
        callId,
        overview: "Team meeting discussing the progress on the new messaging feature. The team reviewed current status, identified blockers, and set next steps for the upcoming sprint.",
        keyPoints: [
          "New messaging feature is 70% complete",
          "File upload functionality needs optimization",
          "User testing scheduled for next week",
          "Performance improvements required for mobile"
        ],
        actionItems: [
          {
            id: 'action1',
            text: 'Optimize file upload performance',
            assignee: 'Bob Smith',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'high',
            completed: false,
            createdAt: new Date()
          },
          {
            id: 'action2',
            text: 'Prepare user testing scenarios',
            assignee: 'Carol Davis',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: 'medium',
            completed: false,
            createdAt: new Date()
          }
        ],
        decisions: [
          "Proceed with current architecture for messaging",
          "Postpone advanced emoji reactions to next sprint",
          "Implement basic notification system first"
        ],
        participants: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'],
        duration: 1800, // 30 minutes
        topics: ['Feature Development', 'Performance', 'Testing', 'Planning'],
        sentiment: 'positive',
        createdAt: new Date()
      };
      
      setCurrentSummary(summary);
      
      toast({
        title: "Summary generated",
        description: "AI has generated a comprehensive meeting summary",
      });
      
      return summary;
    } catch (error) {
      toast({
        title: "Failed to generate summary",
        description: "Please try again later",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [toast]);

  const updateActionItem = useCallback(async (itemId: string, updates: Partial<ActionItem>) => {
    if (!currentSummary) return;
    
    setCurrentSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: prev.actionItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      };
    });
    
    toast({
      title: "Action item updated",
      description: "Changes have been saved",
    });
  }, [currentSummary, toast]);

  const addActionItem = useCallback(async (callId: string, item: Omit<ActionItem, 'id' | 'createdAt'>) => {
    if (!currentSummary) return;
    
    const newItem: ActionItem = {
      ...item,
      id: `action-${Date.now()}`,
      createdAt: new Date()
    };
    
    setCurrentSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: [...prev.actionItems, newItem]
      };
    });
    
    toast({
      title: "Action item added",
      description: "New action item has been created",
    });
  }, [currentSummary, toast]);

  const exportSummary = useCallback(async (summaryId: string, format: 'pdf' | 'docx' | 'md'): Promise<string> => {
    // Simulate export generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const filename = `summary-${summaryId}.${format}`;
    
    toast({
      title: "Summary export ready",
      description: `${filename} is ready for download`,
    });
    
    return `https://exports.omnitalk.app/${filename}`;
  }, [toast]);

  const toggleNoiseCancellation = useCallback(() => {
    setNoiseReduction(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    
    toast({
      title: noiseReduction.isActive ? "Noise cancellation disabled" : "Noise cancellation enabled",
      description: noiseReduction.isActive ? "Background noise filtering is now off" : "AI-powered noise reduction is now active",
    });
  }, [noiseReduction.isActive, toast]);

  const setNoiseReductionLevel = useCallback((level: number) => {
    setNoiseReduction(prev => ({ ...prev, level }));
  }, []);

  const setNoiseReductionType = useCallback((type: NoiseReduction['type']) => {
    setNoiseReduction(prev => ({ ...prev, type }));
    
    toast({
      title: "Noise reduction updated",
      description: `Switched to ${type.replace('_', ' ')} mode`,
    });
  }, [toast]);

  const analyzeAudioQuality = useCallback(async () => {
    // Simulate audio analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      noiseLevel: Math.random() * 40,
      speechClarity: 80 + Math.random() * 20,
      recommendations: [
        "Consider using a headset for better audio quality",
        "Move closer to your microphone",
        "Reduce background noise in your environment"
      ]
    };
  }, []);

  const setVirtualBackground = useCallback((backgroundId: string) => {
    const background = virtualBackgrounds.find(bg => bg.id === backgroundId);
    if (background) {
      setActiveBackground(background);
      
      toast({
        title: "Virtual background applied",
        description: `${background.name} is now active`,
      });
    }
  }, [virtualBackgrounds, toast]);

  const removeVirtualBackground = useCallback(() => {
    setActiveBackground(null);
    
    toast({
      title: "Virtual background removed",
      description: "Your real background is now visible",
    });
  }, [toast]);

  const uploadCustomBackground = useCallback(async (file: File): Promise<VirtualBackground> => {
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const background: VirtualBackground = {
      id: `custom-${Date.now()}`,
      name: file.name,
      type: 'image',
      url: URL.createObjectURL(file),
      preview: URL.createObjectURL(file),
      isActive: false,
      category: 'custom'
    };
    
    toast({
      title: "Custom background uploaded",
      description: "Your background is ready to use",
    });
    
    return background;
  }, [toast]);

  const generateAIBackground = useCallback(async (prompt: string): Promise<VirtualBackground> => {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const background: VirtualBackground = {
      id: `ai-${Date.now()}`,
      name: `AI: ${prompt}`,
      type: 'ai_generated',
      url: `https://ai.omnitalk.app/generate?prompt=${encodeURIComponent(prompt)}`,
      preview: `https://ai.omnitalk.app/generate?prompt=${encodeURIComponent(prompt)}&size=small`,
      isActive: false,
      category: 'fun'
    };
    
    toast({
      title: "AI background generated",
      description: `Created background: "${prompt}"`,
    });
    
    return background;
  }, [toast]);

  const toggleAutoFraming = useCallback(() => {
    setAutoFraming(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    
    toast({
      title: autoFraming.isActive ? "Auto-framing disabled" : "Auto-framing enabled",
      description: autoFraming.isActive ? "Camera will no longer follow your movement" : "Camera will automatically keep you in frame",
    });
  }, [autoFraming.isActive, toast]);

  const setAutoFramingSensitivity = useCallback((sensitivity: number) => {
    setAutoFraming(prev => ({ ...prev, sensitivity }));
  }, []);

  const updateAISettings = useCallback(async (updates: Partial<AISettings>) => {
    setAISettings(prev => ({ ...prev, ...updates }));
    
    toast({
      title: "AI settings updated",
      description: "Your preferences have been saved",
    });
  }, [toast]);

  const getTranscriptionAccuracy = useCallback(() => {
    return currentTranscription?.accuracy || 0;
  }, [currentTranscription]);

  const getUsageStatistics = useCallback(async () => {
    return {
      transcriptionMinutes: 1247,
      summariesGenerated: 83,
      actionItemsCreated: 156,
      backgroundsUsed: 23
    };
  }, []);

  const detectLanguage = useCallback(async (audioSample?: Blob): Promise<string> => {
    // Simulate language detection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return 'en-US'; // Mock detection result
  }, []);

  const translateTranscription = useCallback(async (targetLanguage: string) => {
    if (!currentTranscription) return;
    
    // Simulate translation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Transcription translated",
      description: `Translated to ${targetLanguage}`,
    });
  }, [currentTranscription, toast]);

  const value: AIContextType = {
    // Transcription
    currentTranscription,
    isTranscribing,
    transcriptionLanguage,
    startTranscription,
    stopTranscription,
    pauseTranscription,
    resumeTranscription,
    editTranscription,
    exportTranscription,
    
    // Summaries
    currentSummary,
    isGeneratingSummary,
    generateSummary,
    updateActionItem,
    addActionItem,
    exportSummary,
    
    // Noise Cancellation & Audio
    noiseReduction,
    toggleNoiseCancellation,
    setNoiseReductionLevel,
    setNoiseReductionType,
    analyzeAudioQuality,
    
    // Virtual Backgrounds & Visual AI
    virtualBackgrounds,
    activeBackground,
    setVirtualBackground,
    removeVirtualBackground,
    uploadCustomBackground,
    generateAIBackground,
    
    // Auto-framing & Visual Enhancement
    autoFraming,
    toggleAutoFraming,
    setAutoFramingSensitivity,
    
    // Settings
    aiSettings,
    updateAISettings,
    
    // Analytics
    getTranscriptionAccuracy,
    getUsageStatistics,
    
    // Language Support
    supportedLanguages,
    detectLanguage,
    translateTranscription
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
