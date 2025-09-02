import React, { useState, useCallback, useRef } from 'react';
import { useFileShare, FileUpload } from '@/contexts/FileShareContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive, 
  FileText,
  Download,
  Share,
  Trash2,
  Eye,
  Copy,
  MoreVertical,
  X,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  HardDrive,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Link
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileManagerProps {
  conversationId?: string;
  compact?: boolean;
  showUploadZone?: boolean;
  maxFiles?: number;
  onFileSelect?: (file: FileUpload) => void;
  allowedTypes?: string[];
  className?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  conversationId,
  compact = false,
  showUploadZone = true,
  maxFiles,
  onFileSelect,
  allowedTypes,
  className
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    retryUpload,
    deleteFile,
    getFilePreview,
    createShare,
    searchFiles,
    getStorageUsage,
    trackFileView,
    trackFileDownload
  } = useFileShare();

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load storage usage
  React.useEffect(() => {
    getStorageUsage().then(setStorageUsage);
  }, [getStorageUsage, uploads]);

  const getFileIcon = (file: FileUpload) => {
    switch (file.category) {
      case 'image': return <FileImage className="h-5 w-5 text-blue-500" />;
      case 'video': return <FileVideo className="h-5 w-5 text-green-500" />;
      case 'audio': return <FileAudio className="h-5 w-5 text-purple-500" />;
      case 'document': return <FileText className="h-5 w-5 text-red-500" />;
      case 'archive': return <FileArchive className="h-5 w-5 text-orange-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'uploading': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'virus_detected': return <Shield className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileUpload = async (files: FileList) => {
    if (maxFiles && files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload ${maxFiles} file(s) at a time`,
        variant: "destructive",
      });
      return;
    }

    if (allowedTypes) {
      for (let i = 0; i < files.length; i++) {
        if (!allowedTypes.includes(files[i].type)) {
          toast({
            title: "Invalid file type",
            description: `${files[i].name} is not an allowed file type`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    await uploadFiles(files, conversationId);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleShareFile = async (file: FileUpload) => {
    try {
      const share = await createShare(file.id, {
        canDownload: true,
        canView: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      setShareUrl(share.shareUrl);
      setShowShareDialog(file.id);
    } catch (error) {
      toast({
        title: "Failed to create share link",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied",
      description: "The share link has been copied to your clipboard",
    });
  };

  const handleDownload = (file: FileUpload) => {
    trackFileDownload(file.id);
    // In a real app, this would trigger the actual download
    toast({
      title: "Download started",
      description: `Downloading ${file.name}`,
    });
  };

  const handleView = (file: FileUpload) => {
    trackFileView(file.id);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const filteredFiles = uploads.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        {showUploadZone && (
          <div
            className={cn(
              "border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-blue-400"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop files here or click to upload
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              accept={allowedTypes?.join(',')}
            />
          </div>
        )}

        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 border rounded-lg">
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                </p>
                {file.status !== 'completed' && (
                  <Progress value={file.progress} className="mt-1" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(file.status)}
                {file.status === 'completed' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleView(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareFile(file)}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteFile(file.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {file.status === 'uploading' && (
                  <Button size="sm" variant="ghost" onClick={() => cancelUpload(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {file.status === 'failed' && (
                  <Button size="sm" variant="ghost" onClick={() => retryUpload(file.id)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Storage Usage */}
      {storageUsage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: {formatFileSize(storageUsage.used)}</span>
                <span>Total: {formatFileSize(storageUsage.total)}</span>
              </div>
              <Progress value={(storageUsage.used / storageUsage.total) * 100} />
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {Object.entries(storageUsage.breakdown).map(([category, size]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}:</span>
                    <span>{formatFileSize(size as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Zone */}
      {showUploadZone && (
        <Card>
          <CardContent className="p-6">
            <div
              className={cn(
                "border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors",
                isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-blue-400"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
              <p className="text-muted-foreground mb-4">
                Drop files here or click to browse. Maximum file size: 250MB
              </p>
              <Button disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                accept={allowedTypes?.join(',')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedCategory === 'all' ? 'All Files' : selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    All Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('image')}>
                    <Image className="h-4 w-4 mr-2" />
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('video')}>
                    <Video className="h-4 w-4 mr-2" />
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('audio')}>
                    <Music className="h-4 w-4 mr-2" />
                    Audio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('document')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('archive')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archives
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Display */}
      <Card>
        <CardHeader>
          <CardTitle>Files ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms' : 'Upload some files to get started'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center relative">
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                      <div className="absolute top-2 right-2">
                        {getStatusIcon(file.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {file.status !== 'completed' && (
                        <Progress value={file.progress} className="h-2" />
                      )}
                      
                      {file.status === 'virus_detected' && (
                        <Badge variant="destructive" className="text-xs">
                          Security Threat
                        </Badge>
                      )}
                      
                      {file.status === 'completed' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleView(file)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleShareFile(file)}>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteFile(file.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{file.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                    </div>
                    
                    {file.status !== 'completed' && (
                      <Progress value={file.progress} className="mt-2" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    
                    {file.status === 'completed' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleView(file)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleShareFile(file)}>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteFile(file.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    
                    {file.status === 'uploading' && (
                      <Button size="sm" variant="ghost" onClick={() => cancelUpload(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {file.status === 'failed' && (
                      <Button size="sm" variant="ghost" onClick={() => retryUpload(file.id)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={!!showShareDialog} onOpenChange={() => setShowShareDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Share URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={shareUrl} readOnly />
                <Button onClick={copyShareUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Allow downloads</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require password</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label>Set expiration</Label>
                <Switch />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileManager;
