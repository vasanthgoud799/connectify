import { useEffect } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  User,
  Monitor,
  Square,
} from "lucide-react";
import VideoFeed from "@/components/VideoFeed";
import { useWebRTC } from "@/hooks/useWebRTC";

export default function CallUI({ myUserId }: { myUserId?: string }) {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  if (pathname.startsWith("/call")) return null;
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    acceptIncomingCall,
    declineIncomingCall,
    hangUp,
    initiateCall,
  } = useCallStore();
  const {
    startCall,
    answerCall,
    hangUp: end,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC(myUserId);

  useEffect(() => {
    // When call state switches to outgoing, if we have remoteUser/callType, start call
    if (callState === "outgoing" && remoteUser && callType) {
      startCall(remoteUser, callType);
    }
  }, [callState, remoteUser, callType, startCall]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="font-semibold">
            {remoteUser?.name || remoteUser?.id || "Call"}
          </span>
        </div>
        <Button variant="destructive" onClick={end} className="rounded-full">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center">
        {callState === "outgoing" && (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
            {callType === "video" && (
              <div className="w-full max-w-2xl aspect-video border border-white/20 rounded-lg overflow-hidden bg-black/60">
                <VideoFeed
                  stream={localStream ?? undefined}
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-2xl font-semibold">Ringing...</div>
            <Button
              variant="destructive"
              onClick={end}
              className="rounded-full"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Hang Up
            </Button>
          </div>
        )}
        {callState === "incoming" && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-semibold">Incoming Call</div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={answerCall}
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-5 w-5 mr-2" />
                Accept
              </Button>
              <Button
                variant="destructive"
                onClick={end}
                className="rounded-full"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        )}
        {callState === "active" && (
          <div className="relative w-full h-full flex items-center justify-center">
            {callType === "video" ? (
              <div className="relative w-full h-full">
                {/* Remote video */}
                <VideoFeed
                  stream={remoteStream ?? undefined}
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Local PiP */}
                <div className="absolute bottom-4 right-4 w-48 h-32 border-2 border-white/40 rounded-lg overflow-hidden bg-black/60">
                  <VideoFeed
                    stream={localStream ?? undefined}
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="text-3xl font-semibold">Audio Call</div>
                <div className="text-sm opacity-70">Connected</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          onClick={toggleMute}
          className="rounded-full"
        >
          {isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        {callType === "video" && (
          <>
            <Button
              variant={isCameraOff ? "destructive" : "secondary"}
              onClick={toggleCamera}
              className="rounded-full"
            >
              {isCameraOff ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <VideoIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={startScreenShare}
              className="rounded-full"
            >
              <Monitor className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              onClick={stopScreenShare}
              className="rounded-full"
            >
              <Square className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
