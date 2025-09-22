import { useEffect, useRef, useCallback } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { getSocket, connectSocket } from "@/lib/socket";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

export function useWebRTC(_myUserId: string | undefined) {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    pendingOffer,
    setPeerConnection,
    initiateCall,
    incomingCall,
    acceptIncomingCall,
    declineIncomingCall,
    callAccepted,
    hangUp,
  } = useCallStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const ensurePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(rtcConfig);
    pc.onicecandidate = (e) => {
      if (e.candidate && remoteUser) {
        const s = getSocket();
        try {
          console.debug("[webrtc] sending ICE candidate to", remoteUser.id);
        } catch {}
        s.emit("WEBRTC:ice_candidate", {
          targetUserId: remoteUser.id,
          candidate: e.candidate,
        });
      }
    };
    pc.ontrack = (e) => {
      try {
        console.debug(
          "[webrtc] ontrack received",
          e.streams?.length,
          "streams",
        );
      } catch {}
      const [stream] = e.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(e.track);
        setRemoteStream(remoteStreamRef.current);
      }
    };
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    } else {
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
        if (callType === "video")
          pc.addTransceiver("video", { direction: "recvonly" });
      } catch {}
    }
    pcRef.current = pc;
    setPeerConnection(pc);
    return pc;
  }, [localStream, remoteUser, callType, setRemoteStream, setPeerConnection]);

  const startLocalMedia = useCallback(
    async (wantVideo: boolean) => {
      try {
        if (localStream) localStream.getTracks().forEach((t) => t.stop());
      } catch {}
      let stream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: wantVideo ? { facingMode: "user" } : false,
        } as any;
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e: any) {
        if (
          wantVideo &&
          (e?.name === "NotReadableError" || e?.name === "OverconstrainedError")
        ) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true },
              video: false,
            });
          } catch {
            stream = null; // proceed without local media
          }
        } else if (
          e?.name === "NotAllowedError" ||
          e?.name === "SecurityError"
        ) {
          // Permission blocked by browser/iframe policy - continue without local media
          stream = null;
        } else {
          stream = null;
        }
      }
      setLocalStream(stream);
      const pc = ensurePC();
      if (stream) {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream!));
      }
      return stream;
    },
    [ensurePC, setLocalStream, localStream],
  );

  const startCall = useCallback(
    async (
      targetUser: { id: string; name?: string; avatar?: string },
      type: "video" | "audio",
    ) => {
      await connectSocket();
      initiateCall(targetUser, type);
      await startLocalMedia(type === "video");
      const pc = ensurePC();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const s = getSocket();
      try {
        console.debug("[webrtc] emit WEBRTC:initiate_call to", targetUser.id);
      } catch {}
      s.emit("WEBRTC:initiate_call", {
        targetUserId: targetUser.id,
        callType: type,
        offerSdp: offer,
      });
    },
    [initiateCall, startLocalMedia, ensurePC],
  );

  const answerCall = useCallback(async () => {
    if (!remoteUser || !pendingOffer) return;
    await connectSocket();
    await startLocalMedia(callType === "video");
    const pc = ensurePC();
    await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const s = getSocket();
    try {
      console.debug("[webrtc] emit WEBRTC:accept_call to", remoteUser.id);
    } catch {}
    s.emit("WEBRTC:accept_call", {
      callerUserId: remoteUser.id,
      answerSdp: answer,
    });
    acceptIncomingCall();
  }, [
    remoteUser,
    pendingOffer,
    callType,
    startLocalMedia,
    ensurePC,
    acceptIncomingCall,
  ]);

  const hangUpAll = useCallback(() => {
    const s = getSocket();
    if (remoteUser) {
      try {
        s.emit("WEBRTC:decline_or_end_call", { targetUserId: remoteUser.id });
      } catch {}
    }
    const pc = pcRef.current;
    if (pc) {
      try {
        pc.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    hangUp();
  }, [remoteUser, localStream, setLocalStream, setRemoteStream, hangUp]);

  useEffect(() => {
    const s = getSocket();
    const onIncoming = (payload: {
      fromUserId: string;
      callType: "video" | "audio";
      offerSdp: any;
    }) => {
      try {
        console.debug("[webrtc] incoming_call from", payload.fromUserId);
      } catch {}
      incomingCall(
        { id: payload.fromUserId },
        payload.callType,
        payload.offerSdp,
      );
    };
    const onAccepted = async (payload: {
      fromUserId: string;
      answerSdp: any;
    }) => {
      try {
        console.debug("[webrtc] call_accepted from", payload.fromUserId);
      } catch {}
      const pc = ensurePC();
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.answerSdp),
        );
      } catch {}
      callAccepted(payload.answerSdp);
    };
    const onIce = async (payload: { fromUserId: string; candidate: any }) => {
      try {
        console.debug("[webrtc] new_ice_candidate from", payload.fromUserId);
      } catch {}
      const pc = ensurePC();
      try {
        await pc.addIceCandidate(payload.candidate);
      } catch {}
    };
    const onTerminated = () => {
      try {
        console.debug("[webrtc] call_terminated");
      } catch {}
      hangUpAll();
    };

    s.on("WEBRTC:incoming_call", onIncoming);
    s.on("WEBRTC:call_accepted", onAccepted);
    s.on("WEBRTC:new_ice_candidate", onIce);
    s.on("WEBRTC:call_terminated", onTerminated);
    // Legacy events interop
    const onLegacyOffer = (payload: { fromUserId: string; sdp: any }) =>
      onIncoming({
        fromUserId: payload.fromUserId,
        callType: "video",
        offerSdp: payload.sdp,
      });
    const onLegacyAnswer = (payload: { fromUserId: string; sdp: any }) =>
      onAccepted({ fromUserId: payload.fromUserId, answerSdp: payload.sdp });
    const onLegacyIce = (payload: { fromUserId: string; candidate: any }) =>
      onIce(payload);
    const onLegacyEnd = () => onTerminated();
    s.on("call:offer", onLegacyOffer);
    s.on("SERVER:call:incoming", onLegacyOffer);
    s.on("call:answer", onLegacyAnswer);
    s.on("SERVER:call:accepted", onLegacyAnswer);
    s.on("call:ice-candidate", onLegacyIce);
    s.on("SERVER:call:ice-candidate:new", onLegacyIce);
    s.on("call:end", onLegacyEnd);
    s.on("SERVER:call:terminated", onLegacyEnd);

    // Try to establish connection, but don't block listener registration
    connectSocket().catch(() => {});

    return () => {
      s.off("WEBRTC:incoming_call", onIncoming);
      s.off("WEBRTC:call_accepted", onAccepted);
      s.off("WEBRTC:new_ice_candidate", onIce);
      s.off("WEBRTC:call_terminated", onTerminated);
      s.off("call:offer", onLegacyOffer);
      s.off("SERVER:call:incoming", onLegacyOffer);
      s.off("call:answer", onLegacyAnswer);
      s.off("SERVER:call:accepted", onLegacyAnswer);
      s.off("call:ice-candidate", onLegacyIce);
      s.off("SERVER:call:ice-candidate:new", onLegacyIce);
      s.off("call:end", onLegacyEnd);
      s.off("SERVER:call:terminated", onLegacyEnd);
    };
  }, [ensurePC, incomingCall, callAccepted, hangUpAll]);

  const startScreenShare = useCallback(async () => {
    try {
      const display: MediaStream = await (
        navigator.mediaDevices as any
      ).getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = display;
      const pc = ensurePC();
      const videoTrack = display.getVideoTracks()[0];
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender && videoTrack) {
        try {
          await sender.replaceTrack(videoTrack);
        } catch {}
      } else if (videoTrack) {
        try {
          pc.addTrack(videoTrack, display);
        } catch {}
      }
      const newLocal = new MediaStream([
        ...(localStream?.getAudioTracks() ?? []),
        ...(videoTrack ? [videoTrack] : []),
      ] as any);
      setLocalStream(newLocal);
      if (videoTrack) {
        (videoTrack as any).onended = async () => {
          try {
            await stopScreenShare();
          } catch {}
        };
      }
    } catch {}
  }, [ensurePC, localStream, setLocalStream]);

  const stopScreenShare = useCallback(async () => {
    const screen = screenStreamRef.current;
    screen?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    try {
      const wantVideo = callType === "video";
      const cam = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: wantVideo ? { facingMode: "user" } : false,
      } as any);
      setLocalStream(cam);
      const pc = ensurePC();
      const v = cam.getVideoTracks()[0];
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender && v) {
        try {
          await sender.replaceTrack(v);
        } catch {}
      } else if (v) {
        try {
          pc.addTrack(v, cam);
        } catch {}
      }
      cam.getAudioTracks().forEach((at) => {
        const aSender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "audio");
        if (!aSender) {
          try {
            pc.addTrack(at, cam);
          } catch {}
        }
      });
    } catch {
      try {
        const pc = ensurePC();
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) await sender.replaceTrack(null);
        if (localStream) {
          const audioOnly = new MediaStream(localStream.getAudioTracks());
          setLocalStream(audioOnly);
        } else {
          setLocalStream(null);
        }
      } catch {}
    }
  }, [ensurePC, callType, localStream, setLocalStream]);

  return {
    startCall,
    answerCall,
    hangUp: hangUpAll,
    startScreenShare,
    stopScreenShare,
  };
}
