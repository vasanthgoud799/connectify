import { create } from 'zustand';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

export interface RemoteUser {
  id: string;
  name?: string;
  avatar?: string;
}

interface CallStoreState {
  callState: CallState;
  callType: 'video' | 'audio' | null;
  remoteUser: RemoteUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  pendingOffer?: any | null;
  pc?: RTCPeerConnection | null;

  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;

  initiateCall: (user: RemoteUser, type: 'video' | 'audio') => void;
  incomingCall: (from: RemoteUser, type: 'video' | 'audio', offerSdp: any) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  callAccepted: (answerSdp: any) => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  callState: 'idle',
  callType: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  pendingOffer: null,
  pc: null,

  setLocalStream: (s) => set({ localStream: s }),
  setRemoteStream: (s) => set({ remoteStream: s }),
  setPeerConnection: (pc) => set({ pc }),

  initiateCall: (user, type) => set({ callState: 'outgoing', callType: type, remoteUser: user }),
  incomingCall: (from, type, offerSdp) => set({ callState: 'incoming', callType: type, remoteUser: from, pendingOffer: offerSdp }),
  acceptIncomingCall: () => set({ callState: 'active' }),
  declineIncomingCall: () => set({ callState: 'idle', remoteUser: null, localStream: null, remoteStream: null, pendingOffer: null, pc: null }),
  callAccepted: () => set({ callState: 'active' }),
  hangUp: () => set({ callState: 'idle', remoteUser: null, localStream: null, remoteStream: null, pendingOffer: null, pc: null, isMuted: false, isCameraOff: false }),
  toggleMute: () => set({ isMuted: !get().isMuted, localStream: (() => { const s = get().localStream; if (s) s.getAudioTracks().forEach(t => (t.enabled = get().isMuted)); return s; })() }),
  toggleCamera: () => set({ isCameraOff: !get().isCameraOff, localStream: (() => { const s = get().localStream; if (s) s.getVideoTracks().forEach(t => (t.enabled = get().isCameraOff)); return s; })() }),
}));
