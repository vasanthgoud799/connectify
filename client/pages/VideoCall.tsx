import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Monitor, 
  Hand, Users, Settings, MoreVertical, Pin, Star, Volume2, 
  VolumeX, Maximize, Grid3X3, User, Presentation,
  Circle, Square, Palette, MessageSquare, BarChart3, 
  HelpCircle, Upload, Download, Copy, Clock, Wifi,
  WifiOff, Signal, SignalHigh, SignalMedium, SignalLow,
  ChevronDown, ChevronUp, X, Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VideoCallPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const {
    currentCall,
    isInCall,
    isConnecting,
    connectionQuality,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    viewMode,
    pinnedParticipant,
    spotlightedParticipant,
    waitingRoomParticipants,
    toggleMute,
    toggleVideo,
    toggleHandRaise,
    startScreenShare,
    stopScreenShare,
    endCall,
    setViewMode,
    muteParticipant,
    removeParticipant,
    pinParticipant,
    spotlightParticipant,
    startRecording,
    stopRecording,
    openWhiteboard,
    closeWhiteboard,
    createPoll,
    votePoll,
    endPoll,
    askQuestion,
    answerQuestion,
    admitParticipant,
    denyParticipant,
    joinCall,
  } = useVideoCall();

  // Component state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [qaQuestion, setQaQuestion] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoGridRef = useRef<HTMLDivElement>(null);

  // Auto-join call if callId is provided
  useEffect(() => {
    const callId = searchParams.get('callId');
    if (callId && !isInCall && !isConnecting) {
      joinCall(callId);
    }
  }, [searchParams, joinCall, isInCall, isConnecting]);

  // Handle call end
  const handleEndCall = () => {
    endCall();
    navigate('/dashboard');
  };

  // Connection quality indicator
  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <Signal className="h-4 w-4 text-green-500" />;
      case 'good': return <SignalHigh className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <SignalMedium className="h-4 w-4 text-orange-500" />;
      case 'disconnected': return <SignalLow className="h-4 w-4 text-red-500" />;
    }
  };

  // Participant video component
  const ParticipantVideo = ({ participant, isLocal = false, className = '' }: { 
    participant: any, 
    isLocal?: boolean, 
    className?: string 
  }) => (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video placeholder */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        {participant.isVideoEnabled ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            📹 Video Feed
          </div>
        ) : (
          <Avatar className="h-16 w-16">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback>{participant.name[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>
      
      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {isLocal ? 'You' : participant.name}
            </span>
            {participant.isHost && (
              <Badge variant="secondary" className="text-xs">Host</Badge>
            )}
            {participant.isHandRaised && (
              <Hand className="h-4 w-4 text-yellow-400" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {participant.isMuted ? (
              <MicOff className="h-4 w-4 text-red-400" />
            ) : (
              <Mic className="h-4 w-4 text-green-400" />
            )}
            {!participant.isVideoEnabled && (
              <VideoOff className="h-4 w-4 text-red-400" />
            )}
            {(pinnedParticipant === participant.id || participant.isPinned) && (
              <Pin className="h-4 w-4 text-blue-400" />
            )}
            {(spotlightedParticipant === participant.id || participant.isSpotlighted) && (
              <Star className="h-4 w-4 text-yellow-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Participant actions menu (for host) */}
      {!isLocal && currentCall?.participants[0]?.isHost && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
            >
              <MoreVertical className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => pinParticipant(participant.id)}>
              <Pin className="h-4 w-4 mr-2" />
              {pinnedParticipant === participant.id ? 'Unpin' : 'Pin'} Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => spotlightParticipant(participant.id)}>
              <Star className="h-4 w-4 mr-2" />
              {spotlightedParticipant === participant.id ? 'Remove Spotlight' : 'Spotlight'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => muteParticipant(participant.id)}>
              <MicOff className="h-4 w-4 mr-2" />
              Mute Participant
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => removeParticipant(participant.id)}
              className="text-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Remove from Call
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Connecting to call...</h3>
            <p className="text-sm text-muted-foreground">
              Setting up your audio and video
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInCall || !currentCall) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">Call not found</h3>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{currentCall.title}</h1>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm text-slate-300 capitalize">
                {connectionQuality}
              </span>
            </div>
            {currentCall.isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-400">Recording</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-slate-300">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(currentCall.startTime).toLocaleTimeString()}
            </Badge>
            <Badge variant="outline" className="text-slate-300">
              <Users className="h-3 w-3 mr-1" />
              {currentCall.participants.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="pt-20 pb-24 h-screen flex">
        {/* Video grid */}
        <div className="flex-1 p-4" ref={videoGridRef}>
          {viewMode === 'grid' && (
            <div className={`grid gap-4 h-full ${
              currentCall.participants.length === 1 ? 'grid-cols-1' :
              currentCall.participants.length === 2 ? 'grid-cols-2' :
              currentCall.participants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
              currentCall.participants.length <= 6 ? 'grid-cols-3 grid-rows-2' :
              'grid-cols-3 grid-rows-3'
            }`}>
              {currentCall.participants.map((participant, index) => (
                <ParticipantVideo
                  key={participant.id}
                  participant={participant}
                  isLocal={participant.id === user?.id}
                  className={pinnedParticipant === participant.id ? 'ring-2 ring-blue-500' : ''}
                />
              ))}
            </div>
          )}
          
          {viewMode === 'speaker' && (
            <div className="h-full flex flex-col gap-4">
              {/* Main speaker */}
              <div className="flex-1">
                <ParticipantVideo
                  participant={spotlightedParticipant ? 
                    currentCall.participants.find(p => p.id === spotlightedParticipant) || currentCall.participants[0] :
                    currentCall.participants[0]
                  }
                  isLocal={false}
                  className="h-full"
                />
              </div>
              {/* Thumbnail strip */}
              <div className="h-24 flex gap-2 overflow-x-auto">
                {currentCall.participants.map((participant) => (
                  <ParticipantVideo
                    key={participant.id}
                    participant={participant}
                    isLocal={participant.id === user?.id}
                    className="w-32 flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
          
          {viewMode === 'presentation' && isScreenSharing && (
            <div className="h-full flex gap-4">
              {/* Screen share area */}
              <div className="flex-1 bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg">Screen Share Active</p>
                  <p className="text-sm text-slate-400">Presenter's screen is being shared</p>
                </div>
              </div>
              {/* Participants sidebar */}
              <div className="w-64 space-y-2">
                {currentCall.participants.map((participant) => (
                  <ParticipantVideo
                    key={participant.id}
                    participant={participant}
                    isLocal={participant.id === user?.id}
                    className="h-32"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side panels */}
        {(showParticipants || showChat || showWhiteboard || showPolls || showQA) && (
          <div className="w-80 bg-slate-800 border-l border-slate-700">
            <Tabs defaultValue="participants" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5 bg-slate-700">
                <TabsTrigger value="participants" className="text-xs">
                  <Users className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs">
                  <MessageSquare className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="whiteboard" className="text-xs">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="polls" className="text-xs">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="qa" className="text-xs">
                  <HelpCircle className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="participants" className="flex-1 p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Participants ({currentCall.participants.length})</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {currentCall.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{participant.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              {participant.isHost && (
                                <Badge variant="secondary" className="text-xs">Host</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {participant.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                            {!participant.isVideoEnabled && <VideoOff className="h-4 w-4 text-red-400" />}
                            {participant.isHandRaised && <Hand className="h-4 w-4 text-yellow-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {waitingRoomParticipants.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Waiting Room ({waitingRoomParticipants.length})</h4>
                      {waitingRoomParticipants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{participant.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{participant.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => admitParticipant(participant.id)}>
                              Admit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => denyParticipant(participant.id)}>
                              Deny
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="chat" className="flex-1 p-4 flex flex-col">
                <div className="flex-1 mb-4">
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-slate-700">
                        <p className="text-sm"><strong>Alice:</strong> Welcome everyone!</p>
                        <span className="text-xs text-slate-400">2:34 PM</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-700">
                        <p className="text-sm"><strong>Bob:</strong> Thanks for organizing this call</p>
                        <span className="text-xs text-slate-400">2:35 PM</span>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setChatMessage('');
                        toast({ title: "Message sent", description: "Your message was sent to all participants" });
                      }
                    }}
                  />
                  <Button size="sm">Send</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="whiteboard" className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Whiteboard</h3>
                    <Button 
                      size="sm" 
                      onClick={currentCall.hasWhiteboard ? closeWhiteboard : openWhiteboard}
                    >
                      {currentCall.hasWhiteboard ? 'Close' : 'Open'}
                    </Button>
                  </div>
                  {currentCall.hasWhiteboard ? (
                    <div className="h-48 bg-white rounded-lg flex items-center justify-center">
                      <p className="text-slate-600">Interactive Whiteboard Active</p>
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-400">Whiteboard not active</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="polls" className="flex-1 p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Polls</h3>
                  {currentCall.activePoll ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <h4 className="font-medium mb-2">{currentCall.activePoll.question}</h4>
                        <div className="space-y-2">
                          {currentCall.activePoll.options.map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => votePoll(index)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button onClick={endPoll} variant="destructive" size="sm">
                        End Poll
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Poll Question</Label>
                        <Input
                          placeholder="Enter your question..."
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {pollOptions.map((option, index) => (
                          <Input
                            key={index}
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions];
                              newOptions[index] = e.target.value;
                              setPollOptions(newOptions);
                            }}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          if (pollQuestion && pollOptions.filter(o => o.trim()).length >= 2) {
                            createPoll(pollQuestion, pollOptions.filter(o => o.trim()));
                            setPollQuestion('');
                            setPollOptions(['', '']);
                          }
                        }}
                      >
                        Create Poll
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="qa" className="flex-1 p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Q&A</h3>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ask a question..."
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (qaQuestion.trim()) {
                          askQuestion(qaQuestion);
                          setQaQuestion('');
                        }
                      }}
                    >
                      Submit Question
                    </Button>
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {currentCall.qaSession?.questions.map((q) => (
                        <div key={q.id} className="p-2 bg-slate-700 rounded-lg">
                          <p className="text-sm">{q.question}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-slate-400">by {q.author}</span>
                            {q.isAnswered && (
                              <Badge variant="secondary" className="text-xs">Answered</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-slate-700">
        <div className="flex items-center justify-between p-4">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className="rounded-full"
            >
              <Monitor className="h-5 w-5" />
            </Button>
            <Button
              variant={isHandRaised ? "default" : "secondary"}
              size="lg"
              onClick={toggleHandRaise}
              className="rounded-full"
            >
              <Hand className="h-5 w-5" />
            </Button>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="lg" className="rounded-full">
                  {viewMode === 'grid' && <Grid3X3 className="h-5 w-5" />}
                  {viewMode === 'speaker' && <User className="h-5 w-5" />}
                  {viewMode === 'presentation' && <Presentation className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setViewMode('grid')}>
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('speaker')}>
                  <User className="h-4 w-4 mr-2" />
                  Speaker View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('presentation')}>
                  <Presentation className="h-4 w-4 mr-2" />
                  Presentation View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowParticipants(!showParticipants)}
              className="rounded-full"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowChat(!showChat)}
              className="rounded-full"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant={currentCall.isRecording ? "destructive" : "secondary"}
              size="lg"
              onClick={currentCall.isRecording ? stopRecording : startRecording}
              className="rounded-full"
            >
              {currentCall.isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="lg" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowWhiteboard(!showWhiteboard)}>
                  <Palette className="h-4 w-4 mr-2" />
                  Whiteboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPolls(!showPolls)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Polls
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowQA(!showQA)}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Q&A
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Share Invite
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download Recording
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
