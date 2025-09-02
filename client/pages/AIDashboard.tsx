import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAI } from '@/contexts/AIContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { 
  Brain,
  Mic,
  Volume2,
  VolumeX,
  Camera,
  MessageSquare,
  FileText,
  Download,
  Settings,
  Play,
  Pause,
  Square,
  Edit,
  Save,
  Copy,
  Share,
  Zap,
  Bot,
  Languages,
  Shield,
  Eye,
  Palette,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AIDashboard = () => {
  const { user, isAuthenticated } = useUser();
  const { toast } = useToast();
  const {
    currentTranscription,
    isTranscribing,
    transcriptionLanguage,
    currentSummary,
    isGeneratingSummary,
    noiseReduction,
    virtualBackgrounds,
    activeBackground,
    autoFraming,
    aiSettings,
    supportedLanguages,
    startTranscription,
    stopTranscription,
    pauseTranscription,
    resumeTranscription,
    editTranscription,
    exportTranscription,
    generateSummary,
    updateActionItem,
    addActionItem,
    exportSummary,
    toggleNoiseCancellation,
    setNoiseReductionLevel,
    setVirtualBackground,
    removeVirtualBackground,
    uploadCustomBackground,
    generateAIBackground,
    toggleAutoFraming,
    setAutoFramingSensitivity,
    updateAISettings,
    getUsageStatistics
  } = useAI();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newActionItem, setNewActionItem] = useState('');
  const [aiPrompt, setAIPrompt] = useState('');
  const [usageStats, setUsageStats] = useState<any>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Authentication check
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please sign in</h1>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Load usage statistics
  useEffect(() => {
    getUsageStatistics().then(setUsageStats);
  }, [getUsageStatistics]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEditSegment = (segmentId: string, currentText: string) => {
    setEditingSegment(segmentId);
    setEditText(currentText);
  };

  const handleSaveEdit = async () => {
    if (editingSegment) {
      await editTranscription(editingSegment, editText);
      setEditingSegment(null);
      setEditText('');
    }
  };

  const handleAddActionItem = async () => {
    if (newActionItem.trim() && currentSummary) {
      await addActionItem(currentSummary.callId, {
        text: newActionItem,
        priority: 'medium',
        completed: false
      });
      setNewActionItem('');
    }
  };

  const handleGenerateAIBackground = async () => {
    if (aiPrompt.trim()) {
      try {
        await generateAIBackground(aiPrompt);
        setAIPrompt('');
      } catch (error) {
        // Error is handled in the context
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">AI Features</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
              
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    AI Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>AI Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Real-time Transcription</Label>
                          <Switch 
                            checked={aiSettings.realTimeTranscription}
                            onCheckedChange={(checked) => updateAISettings({ realTimeTranscription: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Auto Summary</Label>
                          <Switch 
                            checked={aiSettings.autoSummary}
                            onCheckedChange={(checked) => updateAISettings({ autoSummary: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Noise Cancellation</Label>
                          <Switch 
                            checked={aiSettings.noiseCancellation}
                            onCheckedChange={(checked) => updateAISettings({ noiseCancellation: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Language Detection</Label>
                          <Switch 
                            checked={aiSettings.languageDetection}
                            onCheckedChange={(checked) => updateAISettings({ languageDetection: checked })}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Speaker Identification</Label>
                          <Switch 
                            checked={aiSettings.speakerIdentification}
                            onCheckedChange={(checked) => updateAISettings({ speakerIdentification: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Sentiment Analysis</Label>
                          <Switch 
                            checked={aiSettings.sentimentAnalysis}
                            onCheckedChange={(checked) => updateAISettings({ sentimentAnalysis: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Profanity Filter</Label>
                          <Switch 
                            checked={aiSettings.profanityFilter}
                            onCheckedChange={(checked) => updateAISettings({ profanityFilter: checked })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Transcription Quality</Label>
                          <Select 
                            value={aiSettings.transcriptionQuality}
                            onValueChange={(value: any) => updateAISettings({ transcriptionQuality: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="enhanced">Enhanced</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        {usageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transcription Minutes</p>
                    <p className="text-2xl font-bold">{usageStats.transcriptionMinutes.toLocaleString()}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Summaries Generated</p>
                    <p className="text-2xl font-bold text-green-600">{usageStats.summariesGenerated}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Action Items</p>
                    <p className="text-2xl font-bold text-orange-600">{usageStats.actionItemsCreated}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Backgrounds Used</p>
                    <p className="text-2xl font-bold text-purple-600">{usageStats.backgroundsUsed}</p>
                  </div>
                  <Palette className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="summaries">Summaries</TabsTrigger>
            <TabsTrigger value="audio">Audio AI</TabsTrigger>
            <TabsTrigger value="visual">Visual AI</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => startTranscription('demo-call')}
                    disabled={isTranscribing}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Mic className="h-6 w-6" />
                    {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
                  </Button>
                  
                  <Button 
                    onClick={() => generateSummary('demo-call')}
                    disabled={isGeneratingSummary}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                  >
                    <Bot className="h-6 w-6" />
                    {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                  </Button>
                  
                  <Button 
                    onClick={toggleNoiseCancellation}
                    variant={noiseReduction.isActive ? "default" : "outline"}
                    className="h-20 flex flex-col gap-2"
                  >
                    {noiseReduction.isActive ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                    {noiseReduction.isActive ? 'Noise Reduction On' : 'Enable Noise Reduction'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time AI Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transcription</span>
                    <Badge variant={isTranscribing ? "default" : "secondary"}>
                      {isTranscribing ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Noise Cancellation</span>
                    <div className="flex items-center gap-2">
                      <Progress value={noiseReduction.level} className="w-20" />
                      <span className="text-xs text-muted-foreground">{noiseReduction.level}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice Clarity</span>
                    <div className="flex items-center gap-2">
                      <Progress value={noiseReduction.voiceClarity} className="w-20" />
                      <span className="text-xs text-muted-foreground">{Math.round(noiseReduction.voiceClarity)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-framing</span>
                    <Badge variant={autoFraming.isActive ? "default" : "secondary"}>
                      {autoFraming.isActive ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Language Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supportedLanguages.slice(0, 6).map((language) => (
                      <div key={language.code} className="flex items-center justify-between">
                        <span className="text-sm">{language.name}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={language.accuracy} className="w-16" />
                          <span className="text-xs text-muted-foreground">{language.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transcription" className="space-y-6">
            {/* Transcription Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Transcription</span>
                  <div className="flex items-center gap-2">
                    {isTranscribing ? (
                      <>
                        <Button size="sm" onClick={pauseTranscription}>
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={stopTranscription} variant="destructive">
                          <Square className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => startTranscription('demo-call')}>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Language:</Label>
                      <Select value={transcriptionLanguage}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentTranscription && (
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          Accuracy: {Math.round(currentTranscription.accuracy * 100)}%
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => exportTranscription(currentTranscription.callId, 'txt')}>
                              Export as TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportTranscription(currentTranscription.callId, 'srt')}>
                              Export as SRT
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportTranscription(currentTranscription.callId, 'json')}>
                              Export as JSON
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Content */}
            {currentTranscription && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {currentTranscription.segments.map((segment) => (
                        <div key={segment.id} className="border rounded-lg p-4 hover:bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{segment.speakerName}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={getConfidenceColor(segment.confidence)}
                              >
                                {Math.round(segment.confidence * 100)}%
                              </Badge>
                              {segment.isEdited && (
                                <Badge variant="secondary">Edited</Badge>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditSegment(segment.id, segment.text)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {editingSegment === segment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-20"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSegment(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{segment.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summaries" className="space-y-6">
            {/* Summary Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Meeting Summary</span>
                  <Button 
                    onClick={() => generateSummary('demo-call')}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              {currentSummary && (
                <CardContent className="space-y-6">
                  {/* Overview */}
                  <div>
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentSummary.overview}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div>
                    <h3 className="font-semibold mb-2">Key Points</h3>
                    <ul className="space-y-1">
                      {currentSummary.keyPoints.map((point, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Action Items</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new action item..."
                          value={newActionItem}
                          onChange={(e) => setNewActionItem(e.target.value)}
                          className="w-64"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                        />
                        <Button size="sm" onClick={handleAddActionItem}>
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {currentSummary.actionItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={item.completed}
                              onCheckedChange={(checked) => updateActionItem(item.id, { completed: checked })}
                            />
                            <div>
                              <p className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>
                                {item.text}
                              </p>
                              {item.assignee && (
                                <p className="text-xs text-muted-foreground">
                                  Assigned to: {item.assignee}
                                  {item.dueDate && ` • Due: ${item.dueDate.toLocaleDateString()}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={
                            item.priority === 'high' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {item.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="flex justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export Summary
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportSummary(currentSummary.id, 'pdf')}>
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportSummary(currentSummary.id, 'docx')}>
                          Export as DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportSummary(currentSummary.id, 'md')}>
                          Export as Markdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            {/* Noise Cancellation */}
            <Card>
              <CardHeader>
                <CardTitle>AI Noise Cancellation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Noise Cancellation</Label>
                    <p className="text-sm text-muted-foreground">
                      AI-powered background noise removal
                    </p>
                  </div>
                  <Switch
                    checked={noiseReduction.isActive}
                    onCheckedChange={toggleNoiseCancellation}
                  />
                </div>

                {noiseReduction.isActive && (
                  <>
                    <div className="space-y-3">
                      <Label>Noise Reduction Level: {noiseReduction.level}%</Label>
                      <Slider
                        value={[noiseReduction.level]}
                        onValueChange={(value) => setNoiseReductionLevel(value[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Background Noise Level</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={noiseReduction.backgroundNoiseLevel} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {Math.round(noiseReduction.backgroundNoiseLevel)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Voice Clarity</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={noiseReduction.voiceClarity} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {Math.round(noiseReduction.voiceClarity)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visual" className="space-y-6">
            {/* Virtual Backgrounds */}
            <Card>
              <CardHeader>
                <CardTitle>Virtual Backgrounds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {virtualBackgrounds.map((background) => (
                    <div
                      key={background.id}
                      className={cn(
                        "relative aspect-video rounded-lg border-2 cursor-pointer transition-all",
                        activeBackground?.id === background.id 
                          ? "border-blue-500 ring-2 ring-blue-200" 
                          : "border-border hover:border-blue-300"
                      )}
                      onClick={() => setVirtualBackground(background.id)}
                    >
                      <img
                        src={background.preview}
                        alt={background.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          // Fallback for missing images
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmFja2dyb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white bg-black/50 rounded px-2 py-1 truncate">
                          {background.name}
                        </p>
                      </div>
                      {activeBackground?.id === background.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-blue-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI Background Generator */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-base">Generate AI Background</Label>
                    <p className="text-sm text-muted-foreground">
                      Describe the background you want and AI will generate it
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., A cozy library with warm lighting..."
                      value={aiPrompt}
                      onChange={(e) => setAIPrompt(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleGenerateAIBackground} disabled={!aiPrompt.trim()}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={removeVirtualBackground}>
                    Remove Background
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="upload-background"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadCustomBackground(file);
                    }}
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="upload-background" className="cursor-pointer">
                      Upload Custom
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Auto-framing */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-framing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Auto-framing</Label>
                    <p className="text-sm text-muted-foreground">
                      AI automatically keeps you centered in the frame
                    </p>
                  </div>
                  <Switch
                    checked={autoFraming.isActive}
                    onCheckedChange={toggleAutoFraming}
                  />
                </div>

                {autoFraming.isActive && (
                  <div className="space-y-3">
                    <Label>Sensitivity: {autoFraming.sensitivity}%</Label>
                    <Slider
                      value={[autoFraming.sensitivity]}
                      onValueChange={(value) => setAutoFramingSensitivity(value[0])}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics for AI feature usage, accuracy metrics, and performance insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIDashboard;
