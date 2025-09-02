import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  preview?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'virus_detected';
  url?: string;
  thumbnail?: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number;
    pages?: number;
    creator?: string;
    createdAt?: Date;
  };
  virusScanResult?: {
    isClean: boolean;
    threat?: string;
    scanEngine: string;
    scanDate: Date;
  };
  uploadedAt: Date;
  expiresAt?: Date;
}

export interface FileShare {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  shareUrl: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: {
    canDownload: boolean;
    canView: boolean;
    canComment: boolean;
    expiresAt?: Date;
    requiresPassword?: boolean;
    password?: string;
  };
  analytics: {
    views: number;
    downloads: number;
    lastAccessed?: Date;
  };
  createdAt: Date;
}

export interface FileShareContextType {
  // Upload management
  uploads: FileUpload[];
  isUploading: boolean;
  uploadFiles: (files: FileList, conversationId?: string) => Promise<FileUpload[]>;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => Promise<void>;
  
  // File management
  deleteFile: (fileId: string) => Promise<void>;
  getFile: (fileId: string) => Promise<FileUpload | null>;
  getFilePreview: (fileId: string) => Promise<string | null>;
  generateThumbnail: (file: File) => Promise<string | null>;
  
  // Sharing
  createShare: (fileId: string, options: Partial<FileShare['permissions']>) => Promise<FileShare>;
  updateSharePermissions: (shareId: string, permissions: Partial<FileShare['permissions']>) => Promise<void>;
  revokeShare: (shareId: string) => Promise<void>;
  getShares: (fileId: string) => Promise<FileShare[]>;
  
  // Security
  scanForVirus: (file: File) => Promise<FileUpload['virusScanResult']>;
  quarantineFile: (fileId: string) => Promise<void>;
  
  // Analytics
  trackFileView: (fileId: string) => void;
  trackFileDownload: (fileId: string) => void;
  getFileAnalytics: (fileId: string) => Promise<FileShare['analytics']>;
  
  // Search and organization
  searchFiles: (query: string, filters?: {
    type?: string;
    dateRange?: { start: Date; end: Date };
    size?: { min: number; max: number };
  }) => Promise<FileUpload[]>;
  
  // Storage management
  getStorageUsage: () => Promise<{
    used: number;
    total: number;
    breakdown: Record<string, number>;
  }>;
  cleanupExpiredFiles: () => Promise<void>;
}

const FileShareContext = createContext<FileShareContextType | undefined>(undefined);

export const useFileShare = () => {
  const context = useContext(FileShareContext);
  if (context === undefined) {
    throw new Error('useFileShare must be used within a FileShareProvider');
  }
  return context;
};

export const FileShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Utility functions
  const getFileCategory = (type: string): FileUpload['category'] => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return 'document';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFileSizeValid = (size: number): boolean => {
    const maxSize = 250 * 1024 * 1024; // 250MB
    return size <= maxSize;
  };

  const generateThumbnail = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxSize = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const scanForVirus = useCallback(async (file: File): Promise<FileUpload['virusScanResult']> => {
    // Simulate virus scanning
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Random chance of detecting a "virus" for demo
    const isClean = Math.random() > 0.05; // 5% chance of "virus"
    
    return {
      isClean,
      threat: isClean ? undefined : 'Suspicious file detected',
      scanEngine: 'OmniTalk Security Scanner v2.1',
      scanDate: new Date()
    };
  }, []);

  const uploadFiles = useCallback(async (files: FileList, conversationId?: string): Promise<FileUpload[]> => {
    setIsUploading(true);
    const newUploads: FileUpload[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size
        if (!isFileSizeValid(file.size)) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 250MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const uploadId = `upload-${Date.now()}-${i}`;
        const category = getFileCategory(file.type);
        
        const upload: FileUpload = {
          id: uploadId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          category,
          progress: 0,
          status: 'uploading',
          uploadedAt: new Date()
        };

        // Generate preview for images
        if (category === 'image') {
          upload.preview = await generateThumbnail(file);
        }

        newUploads.push(upload);
        setUploads(prev => [...prev, upload]);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map(u => {
            if (u.id === uploadId && u.progress < 90) {
              return { ...u, progress: u.progress + Math.random() * 20 };
            }
            return u;
          }));
        }, 200);

        // Simulate virus scanning
        setTimeout(async () => {
          clearInterval(progressInterval);
          
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, status: 'processing', progress: 95 } : u
          ));

          const virusScanResult = await scanForVirus(file);
          
          if (!virusScanResult.isClean) {
            setUploads(prev => prev.map(u => 
              u.id === uploadId ? { 
                ...u, 
                status: 'virus_detected', 
                progress: 100,
                virusScanResult 
              } : u
            ));
            
            toast({
              title: "Security threat detected",
              description: `${file.name} failed security scan and has been quarantined`,
              variant: "destructive",
            });
            return;
          }

          // Complete upload
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { 
              ...u, 
              status: 'completed', 
              progress: 100,
              url: `https://files.omnitalk.app/${uploadId}`,
              virusScanResult,
              metadata: {
                dimensions: category === 'image' ? { width: 1920, height: 1080 } : undefined,
                duration: category === 'video' || category === 'audio' ? 120 : undefined,
                pages: category === 'document' ? 5 : undefined,
                creator: file.name.includes('doc') ? 'Microsoft Word' : undefined,
                createdAt: new Date(file.lastModified)
              }
            } : u
          ));

          toast({
            title: "File uploaded successfully",
            description: `${file.name} (${formatFileSize(file.size)}) has been uploaded`,
          });
        }, 2000 + Math.random() * 3000);
      }
    } finally {
      setIsUploading(false);
    }

    return newUploads;
  }, [generateThumbnail, scanForVirus, toast]);

  const cancelUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
    toast({
      title: "Upload cancelled",
      description: "File upload has been cancelled",
    });
  }, [toast]);

  const retryUpload = useCallback(async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;

    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, status: 'uploading', progress: 0 } : u
    ));

    // Simulate retry logic (reuse upload logic)
    const fileList = new DataTransfer();
    fileList.items.add(upload.file);
    await uploadFiles(fileList.files);
  }, [uploads, uploadFiles]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setUploads(prev => prev.filter(u => u.id !== fileId));
      
      toast({
        title: "File deleted",
        description: "File has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Failed to delete file",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getFile = useCallback(async (fileId: string): Promise<FileUpload | null> => {
    return uploads.find(u => u.id === fileId) || null;
  }, [uploads]);

  const getFilePreview = useCallback(async (fileId: string): Promise<string | null> => {
    const file = uploads.find(u => u.id === fileId);
    return file?.preview || file?.url || null;
  }, [uploads]);

  const createShare = useCallback(async (fileId: string, options: Partial<FileShare['permissions']> = {}): Promise<FileShare> => {
    const file = uploads.find(u => u.id === fileId);
    if (!file) throw new Error('File not found');

    const share: FileShare = {
      id: `share-${Date.now()}`,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      shareUrl: `https://share.omnitalk.app/${fileId}`,
      sharedBy: 'current-user',
      sharedWith: [],
      permissions: {
        canDownload: true,
        canView: true,
        canComment: false,
        ...options
      },
      analytics: {
        views: 0,
        downloads: 0
      },
      createdAt: new Date()
    };

    toast({
      title: "Share link created",
      description: "File share link has been generated",
    });

    return share;
  }, [uploads, toast]);

  const updateSharePermissions = useCallback(async (shareId: string, permissions: Partial<FileShare['permissions']>) => {
    toast({
      title: "Share permissions updated",
      description: "File sharing permissions have been updated",
    });
  }, [toast]);

  const revokeShare = useCallback(async (shareId: string) => {
    toast({
      title: "Share revoked",
      description: "File share link has been revoked",
    });
  }, [toast]);

  const getShares = useCallback(async (fileId: string): Promise<FileShare[]> => {
    return []; // Return empty array for demo
  }, []);

  const quarantineFile = useCallback(async (fileId: string) => {
    setUploads(prev => prev.map(u => 
      u.id === fileId ? { ...u, status: 'virus_detected' } : u
    ));
    
    toast({
      title: "File quarantined",
      description: "File has been moved to quarantine",
      variant: "destructive",
    });
  }, [toast]);

  const trackFileView = useCallback((fileId: string) => {
    // Track file view analytics
    console.log(`File viewed: ${fileId}`);
  }, []);

  const trackFileDownload = useCallback((fileId: string) => {
    // Track file download analytics
    console.log(`File downloaded: ${fileId}`);
  }, []);

  const getFileAnalytics = useCallback(async (fileId: string): Promise<FileShare['analytics']> => {
    return {
      views: Math.floor(Math.random() * 100),
      downloads: Math.floor(Math.random() * 50),
      lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
  }, []);

  const searchFiles = useCallback(async (query: string, filters?: any): Promise<FileUpload[]> => {
    return uploads.filter(upload => 
      upload.name.toLowerCase().includes(query.toLowerCase()) ||
      upload.type.toLowerCase().includes(query.toLowerCase())
    );
  }, [uploads]);

  const getStorageUsage = useCallback(async () => {
    const totalSize = uploads.reduce((sum, upload) => sum + upload.size, 0);
    const breakdown = uploads.reduce((acc, upload) => {
      acc[upload.category] = (acc[upload.category] || 0) + upload.size;
      return acc;
    }, {} as Record<string, number>);

    return {
      used: totalSize,
      total: 5 * 1024 * 1024 * 1024, // 5GB total storage
      breakdown
    };
  }, [uploads]);

  const cleanupExpiredFiles = useCallback(async () => {
    const now = new Date();
    const expiredUploads = uploads.filter(u => u.expiresAt && u.expiresAt < now);
    
    setUploads(prev => prev.filter(u => !u.expiresAt || u.expiresAt >= now));
    
    if (expiredUploads.length > 0) {
      toast({
        title: "Expired files cleaned up",
        description: `${expiredUploads.length} expired files have been removed`,
      });
    }
  }, [uploads, toast]);

  const value: FileShareContextType = {
    // Upload management
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    retryUpload,
    
    // File management
    deleteFile,
    getFile,
    getFilePreview,
    generateThumbnail,
    
    // Sharing
    createShare,
    updateSharePermissions,
    revokeShare,
    getShares,
    
    // Security
    scanForVirus,
    quarantineFile,
    
    // Analytics
    trackFileView,
    trackFileDownload,
    getFileAnalytics,
    
    // Search and organization
    searchFiles,
    
    // Storage management
    getStorageUsage,
    cleanupExpiredFiles
  };

  return (
    <FileShareContext.Provider value={value}>
      {children}
    </FileShareContext.Provider>
  );
};
