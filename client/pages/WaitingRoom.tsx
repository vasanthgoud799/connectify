import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Calendar,
  Monitor,
  Volume2,
  VolumeX,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WaitingRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const {
    currentCall,
    isInCall,
    isMuted,
    isVideoEnabled,
    waitingRoomParticipants,
    toggleMute,
    toggleVideo,
    joinCall,
    admitParticipant,
    denyParticipant,
  } = useVideoCall();

  // Local state for waiting room
  const [isHost, setIsHost] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [meetingInfo, setMeetingInfo] = useState({
    title: 'Team Meeting',
    startTime: new Date(),
    hostName: 'Alice Johnson',
    expectedParticipants: 5,
  });
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoPreview, setVideoPreview] = useState(true);

  // Check if user is host or participant
  useEffect(() => {
    const callId = searchParams.get('callId');
    const hostId = searchParams.get('hostId');
    
    if (user && hostId === user.id) {
      setIsHost(true);
      setIsWaiting(false);
    } else {
      setIsHost(false);
      setIsWaiting(true);
    }

    // Simulate joining waiting room
    if (callId && !isInCall) {
      // In a real app, this would add the user to the waiting room
      toast({
        title: "Joined waiting room",
        description: "Waiting for the host to admit you to the meeting",
      });
    }
  }, [searchParams, user, isInCall, toast]);

  // Simulate audio level monitoring
  useEffect(() => {
    if (!isMuted) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isMuted]);

  // Auto-admit after 3 seconds for demo purposes
  useEffect(() => {
    if (isWaiting && !isHost) {
      const timer = setTimeout(() => {
        setIsWaiting(false);
        toast({
          title: "Admitted to meeting",
          description: "The host has admitted you to the call",
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isWaiting, isHost, toast]);

  const handleJoinCall = async () => {
    const callId = searchParams.get('callId') || 'waiting-room-call';
    await joinCall(callId);
    navigate('/call');
  };

  const handleStartMeeting = async () => {
    // Admit all waiting participants and start the meeting
    waitingRoomParticipants.forEach(participant => {
      admitParticipant(participant.id);
    });
    
    const callId = searchParams.get('callId') || 'host-call';
    await joinCall(callId);
    navigate('/call');
  };

  const handleLeaveWaitingRoom = () => {
    navigate('/dashboard');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Mock waiting room participants
  const mockWaitingParticipants = [
    {
      id: '1',
      name: 'Bob Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      email: 'bob@company.com',
      joinedAt: new Date(Date.now() - 30000),
    },
    {
      id: '2',
      name: 'Carol Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
      email: 'carol@company.com',
      joinedAt: new Date(Date.now() - 15000),
    },
    {
      id: '3',
      name: 'David Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      email: 'david@company.com',
      joinedAt: new Date(),
    },
  ];

  if (isHost) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{meetingInfo.title}</h1>
              <p className="text-slate-300">
                Scheduled for {formatTime(meetingInfo.startTime)} • 
                {mockWaitingParticipants.length} participants waiting
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-slate-300">
                <Clock className="h-3 w-3 mr-1" />
                Host
              </Badge>
              <Button variant="outline" onClick={handleLeaveWaitingRoom}>
                Cancel Meeting
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Host Preview */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative">
                      {isVideoEnabled && videoPreview ? (
                        <div className="text-center text-white">
                          <Video className="h-12 w-12 mx-auto mb-2" />
                          <p>Video Preview</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="text-lg">
                              {user?.firstName[0]}{user?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-white">{user?.displayName}</p>
                        </div>
                      )}
                      
                      {/* Audio Level Indicator */}
                      {!isMuted && audioLevel > 10 && (
                        <div className="absolute bottom-3 left-3">
                          <div className="flex items-center gap-1">
                            <Volume2 className="h-4 w-4 text-green-400" />
                            <div className="w-8 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-400 transition-all duration-100"
                                style={{ width: `${Math.min(audioLevel, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
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
                      <Button variant="secondary" size="lg" className="rounded-full">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="video-preview" className="text-sm">Enable video preview</Label>
                        <Switch
                          id="video-preview"
                          checked={videoPreview}
                          onCheckedChange={setVideoPreview}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Actions */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleStartMeeting}
                      className="flex-1"
                      size="lg"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Start Meeting
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleLeaveWaitingRoom}
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Waiting Participants */}
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Waiting Room ({mockWaitingParticipants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {mockWaitingParticipants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{participant.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-white">{participant.name}</p>
                              <p className="text-xs text-slate-400">{participant.email}</p>
                              <p className="text-xs text-slate-400">
                                Waiting {Math.floor((Date.now() - participant.joinedAt.getTime()) / 1000)}s
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => admitParticipant(participant.id)}
                              className="h-8 w-8 p-0"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => denyParticipant(participant.id)}
                              className="h-8 w-8 p-0"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {mockWaitingParticipants.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400">No participants waiting</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Meeting Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Meeting Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-slate-400">Meeting ID</Label>
                    <p className="text-white font-mono text-sm">123-456-789</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-400">Passcode</Label>
                    <p className="text-white font-mono text-sm">abc123</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-400">Expected Participants</Label>
                    <p className="text-white">{meetingInfo.expectedParticipants}</p>
                  </div>
                  <Separator className="bg-slate-600" />
                  <Button variant="outline" className="w-full" size="sm">
                    Copy Invite Link
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Participant waiting view
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-brand-600" />
          </div>
          <CardTitle className="text-white">{meetingInfo.title}</CardTitle>
          <p className="text-slate-300">
            Hosted by {meetingInfo.hostName} • {formatTime(meetingInfo.startTime)}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isWaiting ? (
            <>
              {/* Waiting Status */}
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Please wait</h3>
                  <p className="text-slate-300 text-sm">
                    The meeting host will admit you shortly
                  </p>
                </div>
              </div>

              {/* User Preview */}
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative">
                  {isVideoEnabled ? (
                    <div className="text-center text-white">
                      <Video className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Your Video</p>
                    </div>
                  ) : (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {user?.firstName[0]}{user?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="sm"
                    onClick={toggleMute}
                    className="rounded-full"
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    size="sm"
                    onClick={toggleVideo}
                    className="rounded-full"
                  >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleLeaveWaitingRoom}
                className="w-full"
              >
                Leave Waiting Room
              </Button>
            </>
          ) : (
            <>
              {/* Ready to Join */}
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">You're in!</h3>
                  <p className="text-slate-300 text-sm">
                    The host has admitted you to the meeting
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleJoinCall} className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  Join Call
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLeaveWaitingRoom}
                >
                  Leave
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingRoom;
