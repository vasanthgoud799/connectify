import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useUser } from "./UserContext";
import { useToast } from "@/hooks/use-toast";

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
  type: "instant" | "scheduled";
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

export interface ChatMessage {
  id: string;
  fromUserId: string;
  text: string;
  at: number;
}
export interface ReactionEvent {
  id: string;
  fromUserId: string;
  emoji: string;
  at: number;
}

export interface VideoCallContextType {
  // Call state
  currentCall: CallSession | null;
  isInCall: boolean;
  isConnecting: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";

  // Local user state
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;

  // View settings
  viewMode: "grid" | "speaker" | "presentation";
  pinnedParticipant: string | null;
  spotlightedParticipant: string | null;

  // Media streams
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  chatLog: ChatMessage[];
  reactions: ReactionEvent[];

  // Call management
  startCall: (
    participants: string[],
    title?: string,
    scheduled?: boolean,
  ) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  endCall: () => void;

  // Media controls
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleHandRaise: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;

  // Participant management
  muteParticipant: (participantId: string) => void;
  removeParticipant: (participantId: string) => void;
  pinParticipant: (participantId: string) => void;
  spotlightParticipant: (participantId: string) => void;

  // View controls
  setViewMode: (mode: "grid" | "speaker" | "presentation") => void;

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

  // Incoming call controls
  acceptIncoming: () => void | Promise<void>;
  declineIncoming: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(
  undefined,
);

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const { toast } = useToast();

  // Call state
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("excellent");

  // Local user state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // View settings
  const [viewMode, setViewMode] = useState<"grid" | "speaker" | "presentation">(
    "grid",
  );
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(
    null,
  );
  const [spotlightedParticipant, setSpotlightedParticipant] = useState<
    string | null
  >(null);

  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);

  // Waiting room
  const [waitingRoomParticipants, setWaitingRoomParticipants] = useState<
    CallParticipant[]
  >([]);

  // Incoming call offer state (for accept/decline like WhatsApp)
  const [pendingOffer, setPendingOffer] = useState<{
    fromUserId: string;
    sdp: any;
  } | null>(null);

  // WebRTC state
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const remoteStreamMap = useRef(new Map<string, MediaStream>());
  const socketRef = useRef<ReturnType<
    typeof import("@/lib/socket").getSocket
  > | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };

  const ensureSocket = useCallback(async () => {
    const { connectSocket, getSocket } = await import("@/lib/socket");
    await connectSocket();
    const s = getSocket();
    socketRef.current = s;
    return s;
  }, []);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsMuted(false);
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

  function createPeerConnection(remoteUserId: string) {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(remoteUserId, pc);

    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("call:ice-candidate", {
          toUserId: remoteUserId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (!stream) return;
      remoteStreamMap.current.set(remoteUserId, stream);
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: stream }));
      setCurrentCall((prev) => {
        if (!prev) return prev;
        const exists = prev.participants.some((p) => p.id === remoteUserId);
        const added = exists
          ? prev.participants
          : [
              ...prev.participants,
              {
                id: remoteUserId,
                name: remoteUserId,
                isHost: false,
                isMuted: false,
                isVideoEnabled: true,
                isHandRaised: false,
                isPinned: false,
                isSpotlighted: false,
                stream,
              },
            ];
        return { ...prev, participants: added };
      });
    };

    return pc;
  }

  const startCall = useCallback(
    async (participants: string[], title?: string) => {
      setIsConnecting(true);
      const mediaAccess = await initializeMedia();
      if (!mediaAccess) {
        setIsConnecting(false);
        return;
      }
      const socket = await ensureSocket();

      const callSession: CallSession = {
        id: `call-${Date.now()}`,
        title: title || "Instant Call",
        type: "instant",
        startTime: new Date(),
        participants: [
          {
            id: user?.id || "me",
            name: user?.displayName || user?.email || "You",
            avatar: user?.avatar,
            isHost: true,
            isMuted: false,
            isVideoEnabled: true,
            isHandRaised: false,
            isPinned: false,
            isSpotlighted: false,
            stream: localStream || undefined,
          },
        ],
        isRecording: false,
        hasWhiteboard: false,
        isScreenSharing: false,
      };
      setCurrentCall(callSession);
      setIsInCall(true);
      setIsConnecting(false);

      for (const remoteId of participants) {
        const pc = createPeerConnection(remoteId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", { toUserId: remoteId, sdp: offer });
      }

      // Register listeners once
      if (!(socket as any)._webrtcBound) {
        (socket as any)._webrtcBound = true;
      }
    },
    [user, initializeMedia, ensureSocket, localStream],
  );

  const joinCall = useCallback(
    async (_callId: string) => {
      setIsConnecting(true);
      const mediaAccess = await initializeMedia();
      if (!mediaAccess) {
        setIsConnecting(false);
        return;
      }
      await ensureSocket();
      setCurrentCall(
        (prev) =>
          prev ??
          ({
            id: `call-${Date.now()}`,
            title: "Call",
            type: "instant",
            startTime: new Date(),
            participants: [
              {
                id: user?.id || "me",
                name: user?.displayName || user?.email || "You",
                avatar: user?.avatar,
                isHost: false,
                isMuted: false,
                isVideoEnabled: true,
                isHandRaised: false,
                isPinned: false,
                isSpotlighted: false,
                stream: localStream || undefined,
              },
            ],
            isRecording: false,
            hasWhiteboard: false,
            isScreenSharing: false,
          } as CallSession),
      );
      setIsInCall(true);
      setIsConnecting(false);
    },
    [user, initializeMedia, ensureSocket, localStream],
  );

  useEffect(() => {
    let bound = false;
    (async () => {
      const socket = await ensureSocket();
      if ((socket as any)._webrtcBoundInit) return;
      (socket as any)._webrtcBoundInit = true;
      bound = true;

      const handleOffer = async ({ fromUserId, sdp }: any) => {
        setCurrentCall(
          (prev) =>
            prev ??
            ({
              id: `call-${Date.now()}`,
              title: "Incoming Call",
              type: "instant",
              startTime: new Date(),
              participants: [
                {
                  id: user?.id || "me",
                  name: user?.displayName || user?.email || "You",
                  avatar: user?.avatar,
                  isHost: false,
                  isMuted: false,
                  isVideoEnabled: !!localStream,
                  isHandRaised: false,
                  isPinned: false,
                  isSpotlighted: false,
                  stream: localStream || undefined,
                },
              ],
              isRecording: false,
              hasWhiteboard: false,
              isScreenSharing: false,
            } as CallSession),
        );
        setIsInCall(true);
        setPendingOffer({ fromUserId, sdp });
        if (!localStream) {
          try {
            await initializeMedia();
          } catch {}
        }
      };

      socket.on("call:offer", handleOffer);

      const handleAnswer = async ({ fromUserId, sdp }: any) => {
        const pc = peerConnections.current.get(fromUserId);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch {}
      };

      socket.on("call:answer", handleAnswer);

      const handleIce = async ({ fromUserId, candidate }: any) => {
        const pc = peerConnections.current.get(fromUserId);
        if (!pc) return;
        try {
          await pc.addIceCandidate(candidate);
        } catch {}
      };

      socket.on("call:ice-candidate", handleIce);

      const onChat = (payload: {
        fromUserId: string;
        message: string;
        at: number;
      }) => {
        setChatLog((prev) => [
          ...prev,
          {
            id: `m-${payload.at}-${Math.random()}`,
            fromUserId: payload.fromUserId,
            text: payload.message,
            at: payload.at,
          },
        ]);
      };
      socket.on("CALL:chat:new", onChat);

      const onReaction = (payload: {
        fromUserId: string;
        emoji: string;
        at: number;
      }) => {
        const evt: ReactionEvent = {
          id: `r-${payload.at}-${Math.random()}`,
          fromUserId: payload.fromUserId,
          emoji: payload.emoji,
          at: payload.at,
        };
        setReactions((prev) => [...prev, evt]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== evt.id));
        }, 2500);
      };
      socket.on("CALL:reaction", onReaction);

      socket.on("call:end", ({ fromUserId }) => {
        const pc = peerConnections.current.get(fromUserId);
        pc?.close();
        peerConnections.current.delete(fromUserId);
        remoteStreamMap.current.delete(fromUserId);
        setRemoteStreams((prev) => {
          const { [fromUserId]: _, ...rest } = prev;
          return rest;
        });
      });
    })();
    return () => {
      if (!bound) return;
      const s = socketRef.current as any;
      if (!s) return;
      s.off("call:offer");
      s.off("call:answer");
      s.off("call:ice-candidate");
      s.off("call:end");
      s.off("CALL:chat:new");
      s.off("CALL:reaction");
    };
  }, [ensureSocket, initializeMedia, user, localStream]);

  const acceptIncoming = useCallback(async () => {
    if (!pendingOffer || !socketRef.current) return;
    const { fromUserId, sdp } = pendingOffer;
    const ok = await initializeMedia();
    if (!ok) return;
    const pc = createPeerConnection(fromUserId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      (socketRef.current as any).emit("call:answer", {
        toUserId: fromUserId,
        sdp: answer,
      });
      setPendingOffer(null);
    } catch {}
  }, [pendingOffer, initializeMedia]);

  const declineIncoming = useCallback(() => {
    if (!pendingOffer || !socketRef.current) return;
    try {
      (socketRef.current as any).emit("call:end", {
        toUserId: pendingOffer.fromUserId,
      });
    } catch {}
    setPendingOffer(null);
    setIsInCall(false);
    setCurrentCall(null);
  }, [pendingOffer]);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentCall) return;
      const ts = Date.now();
      setChatLog((prev) => [
        ...prev,
        { id: `m-${ts}-me`, fromUserId: user?.id || "me", text, at: ts },
      ]);
      const s = socketRef.current as any;
      if (s) {
        for (const p of currentCall.participants) {
          if (p.id !== (user?.id || "me")) {
            try {
              s.emit("CALL:chat:send", {
                toUserId: p.id,
                message: text,
                at: ts,
              });
            } catch {}
          }
        }
      }
    },
    [currentCall, user],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!currentCall) return;
      const ts = Date.now();
      setReactions((prev) => [
        ...prev,
        { id: `r-${ts}-me`, fromUserId: user?.id || "me", emoji, at: ts },
      ]);
      const s = socketRef.current as any;
      if (s) {
        for (const p of currentCall.participants) {
          if (p.id !== (user?.id || "me")) {
            try {
              s.emit("CALL:reaction", { toUserId: p.id, emoji });
            } catch {}
          }
        }
      }
    },
    [currentCall, user],
  );

  const endCall = useCallback(() => {
    // notify peers
    const s = socketRef.current as any;
    if (currentCall && s) {
      for (const p of currentCall.participants) {
        if (p.id !== (user?.id || "me")) {
          try {
            s.emit("call:end", { toUserId: p.id });
          } catch {}
        }
      }
    }
    peerConnections.current.forEach((pc, id) => {
      try {
        pc.close();
      } catch {}
    });
    peerConnections.current.clear();
    remoteStreamMap.current.clear();
    setRemoteStreams({});

    setCurrentCall(null);
    setIsInCall(false);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    setIsHandRaised(false);
    setPinnedParticipant(null);
    setSpotlightedParticipant(null);
    setViewMode("grid");

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    toast({
      title: "Call ended",
      description: "You have left the call",
    });
  }, [localStream, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStream)
        localStream.getAudioTracks().forEach((t) => (t.enabled = !next));
      toast({
        title: next ? "Muted" : "Unmuted",
        description: next
          ? "Your microphone is now off"
          : "Your microphone is now on",
      });
      return next;
    });
  }, [localStream, toast]);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => {
      const next = !prev;
      if (localStream)
        localStream.getVideoTracks().forEach((t) => (t.enabled = next));
      toast({
        title: next ? "Video on" : "Video off",
        description: next ? "Your camera is now on" : "Your camera is now off",
      });
      return next;
    });
  }, [localStream, toast]);

  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => !prev);
    toast({
      title: isHandRaised ? "Hand lowered" : "Hand raised",
      description: isHandRaised
        ? "You lowered your hand"
        : "You raised your hand",
    });
  }, [isHandRaised, toast]);

  const startScreenShare = useCallback(async () => {
    try {
      const display = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: false,
      });
      const videoTrack = display.getVideoTracks()[0];
      if (!videoTrack) throw new Error("No display video track");
      // Replace outgoing video on all PCs
      peerConnections.current.forEach(async (pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(videoTrack);
          } catch {}
        } else {
          try {
            pc.addTrack(videoTrack, display);
          } catch {}
        }
      });
      // Update local view
      const next = new MediaStream([
        ...(localStream?.getAudioTracks() ?? []),
        videoTrack,
      ] as any);
      setLocalStream(next);
      setIsScreenSharing(true);
      setViewMode("presentation");
      (videoTrack as any).onended = () => {
        stopScreenShare();
      };
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
  }, [toast, localStream]);

  const stopScreenShare = useCallback(async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const v = cam.getVideoTracks()[0];
      // Replace outgoing video on all PCs
      peerConnections.current.forEach(async (pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(v);
          } catch {}
        } else {
          try {
            pc.addTrack(v, cam);
          } catch {}
        }
      });
      setLocalStream(cam);
    } catch {
      // If camera not available, just remove video track
      peerConnections.current.forEach(async (pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(null);
          } catch {}
        }
      });
      if (localStream) {
        const audioOnly = new MediaStream(localStream.getAudioTracks());
        setLocalStream(audioOnly);
      } else {
        setLocalStream(null);
      }
    }
    setIsScreenSharing(false);
    setViewMode("grid");
    toast({
      title: "Screen sharing stopped",
      description: "Your screen is no longer being shared",
    });
  }, [toast, localStream]);

  const muteParticipant = useCallback(
    (participantId: string) => {
      if (!currentCall) return;

      setCurrentCall((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participantId ? { ...p, isMuted: true } : p,
          ),
        };
      });

      toast({
        title: "Participant muted",
        description: "The participant has been muted",
      });
    },
    [currentCall, toast],
  );

  const removeParticipant = useCallback(
    (participantId: string) => {
      if (!currentCall) return;

      setCurrentCall((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.filter((p) => p.id !== participantId),
        };
      });

      toast({
        title: "Participant removed",
        description: "The participant has been removed from the call",
      });
    },
    [currentCall, toast],
  );

  const pinParticipant = useCallback(
    (participantId: string) => {
      setPinnedParticipant((prev) =>
        prev === participantId ? null : participantId,
      );

      toast({
        title:
          pinnedParticipant === participantId
            ? "Participant unpinned"
            : "Participant pinned",
        description:
          pinnedParticipant === participantId
            ? "Video is unpinned"
            : "Video has been pinned",
      });
    },
    [pinnedParticipant, toast],
  );

  const spotlightParticipant = useCallback(
    (participantId: string) => {
      setSpotlightedParticipant((prev) =>
        prev === participantId ? null : participantId,
      );

      toast({
        title:
          spotlightedParticipant === participantId
            ? "Spotlight removed"
            : "Participant spotlighted",
        description:
          spotlightedParticipant === participantId
            ? "Spotlight has been removed"
            : "Participant is now in spotlight for everyone",
      });
    },
    [spotlightedParticipant, toast],
  );

  const startRecording = useCallback(() => {
    if (!currentCall) return;

    setCurrentCall((prev) => {
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

    setCurrentCall((prev) => {
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

    setCurrentCall((prev) => {
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

    setCurrentCall((prev) => {
      if (!prev) return prev;
      return { ...prev, hasWhiteboard: false };
    });
  }, [currentCall]);

  const createPoll = useCallback(
    (question: string, options: string[]) => {
      if (!currentCall) return;

      const poll = {
        id: `poll-${Date.now()}`,
        question,
        options,
        votes: {},
      };

      setCurrentCall((prev) => {
        if (!prev) return prev;
        return { ...prev, activePoll: poll };
      });

      toast({
        title: "Poll created",
        description: question,
      });
    },
    [currentCall, toast],
  );

  const votePoll = useCallback(
    (optionIndex: number) => {
      if (!currentCall?.activePoll || !user) return;

      setCurrentCall((prev) => {
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
    },
    [currentCall, user, toast],
  );

  const endPoll = useCallback(() => {
    if (!currentCall) return;

    setCurrentCall((prev) => {
      if (!prev) return prev;
      return { ...prev, activePoll: undefined };
    });

    toast({
      title: "Poll ended",
      description: "Poll results are now available",
    });
  }, [currentCall, toast]);

  const askQuestion = useCallback(
    (question: string) => {
      if (!currentCall || !user) return;

      const newQuestion = {
        id: `q-${Date.now()}`,
        question,
        author: user.name,
        isAnswered: false,
        upvotes: 0,
      };

      setCurrentCall((prev) => {
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
    },
    [currentCall, user, toast],
  );

  const answerQuestion = useCallback(
    (questionId: string) => {
      if (!currentCall) return;

      setCurrentCall((prev) => {
        if (!prev?.qaSession) return prev;
        return {
          ...prev,
          qaSession: {
            questions: prev.qaSession.questions.map((q) =>
              q.id === questionId ? { ...q, isAnswered: true } : q,
            ),
          },
        };
      });

      toast({
        title: "Question answered",
        description: "The question has been marked as answered",
      });
    },
    [currentCall, toast],
  );

  const admitParticipant = useCallback(
    (participantId: string) => {
      const participant = waitingRoomParticipants.find(
        (p) => p.id === participantId,
      );
      if (!participant || !currentCall) return;

      setWaitingRoomParticipants((prev) =>
        prev.filter((p) => p.id !== participantId),
      );
      setCurrentCall((prev) => {
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
    },
    [waitingRoomParticipants, currentCall, toast],
  );

  const denyParticipant = useCallback(
    (participantId: string) => {
      const participant = waitingRoomParticipants.find(
        (p) => p.id === participantId,
      );
      if (!participant) return;

      setWaitingRoomParticipants((prev) =>
        prev.filter((p) => p.id !== participantId),
      );

      toast({
        title: "Participant denied",
        description: `${participant.name} was denied access to the call`,
      });
    },
    [waitingRoomParticipants, toast],
  );

  // Simulate connection quality monitoring
  useEffect(() => {
    if (!isInCall) return;

    const interval = setInterval(() => {
      const qualities: Array<"excellent" | "good" | "poor"> = [
        "excellent",
        "good",
        "poor",
      ];
      const randomQuality =
        qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionQuality(randomQuality);
    }, 10000);

    return () => clearInterval(interval);
  }, [isInCall]);

  // Keep local participant's stream in sync with currentCall
  useEffect(() => {
    if (!localStream) return;
    // Update local participant stream in UI
    setCurrentCall((prev) => {
      if (!prev) return prev;
      const meId = user?.id || "me";
      let found = false;
      const participants = prev.participants.map((p) => {
        if (p.id === meId) {
          found = true;
          return {
            ...p,
            stream: localStream,
            isVideoEnabled: localStream.getVideoTracks().some((t) => t.enabled),
            isMuted: localStream.getAudioTracks().every((t) => !t.enabled),
          };
        }
        return p;
      });
      if (!found) {
        participants.unshift({
          id: meId,
          name: user?.displayName || user?.email || "You",
          avatar: user?.avatar,
          isHost: true,
          isMuted: false,
          isVideoEnabled: true,
          isHandRaised: false,
          isPinned: false,
          isSpotlighted: false,
          stream: localStream,
        });
      }
      return { ...prev, participants };
    });
    // Inject tracks into existing peer connections
    peerConnections.current.forEach((pc) => {
      localStream.getTracks().forEach((track) => {
        const already = pc
          .getSenders()
          .some((s) => s.track && s.track.kind === track.kind);
        if (!already) {
          try {
            pc.addTrack(track, localStream);
          } catch {}
        }
      });
    });
  }, [localStream, user]);

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
    chatLog,
    reactions,

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
    sendChatMessage,
    sendReaction,

    // Participant management
    muteParticipant,
    removeParticipant,
    pinParticipant,
    spotlightParticipant,

    // Incoming call controls
    acceptIncoming,
    declineIncoming,

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

    // Incoming state
    // Expose pendingOffer indirectly via UI, if needed we could export but keep internal for now
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};
