import { socketService } from './socket';

// Google Public STUN Configuration for NAT Traversal
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class MediaService {
  // Capture local webcam & microphone
  static async getLocalStream(options: { video: boolean; audio: boolean }): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser');
      }

      return await navigator.mediaDevices.getUserMedia({
        video: options.video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
          : false,
        audio: options.audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });
    } catch (err: any) {
      console.warn('[MediaService] Hardware webcam/mic unavailable or blocked:', err.message);
      // Fallback synthetic canvas stream so user can still test in headless/sandbox/no-camera environments
      return MediaService.createFallbackStream(options.video, options.audio);
    }
  }

  // Capture screen stream for screen sharing
  static async getDisplayStream(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing not supported on this browser');
      }
      return await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true,
      });
    } catch (err: any) {
      console.warn('[MediaService] Screen share canceled or failed:', err.message);
      return null;
    }
  }

  // Fallback synthetic stream generator when no physical webcam is connected
  static createFallbackStream(withVideo: boolean, withAudio: boolean): MediaStream {
    const stream = new MediaStream();

    if (withVideo) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = '#71717a';
        ctx.font = '22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Webcam Simulated Stream', 320, 180);
      }
      const canvasStream = canvas.captureStream(15);
      const videoTrack = canvasStream.getVideoTracks()[0];
      if (videoTrack) stream.addTrack(videoTrack);
    }

    if (withAudio) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        const audioTrack = dst.stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          stream.addTrack(audioTrack);
        }
      } catch (e) {
        // Ignore audio fallback error
      }
    }

    return stream;
  }
}

// WebRTC Peer Connection Mesh Manager
export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map(); // socketId -> RTCPeerConnection
  private localStream: MediaStream | null = null;
  private onRemoteStreamCb: ((socketId: string, stream: MediaStream) => void) | null = null;
  private onPeerDisconnectedCb: ((socketId: string) => void) | null = null;

  public setCallbacks(
    onRemoteStream: (socketId: string, stream: MediaStream) => void,
    onPeerDisconnected: (socketId: string) => void
  ) {
    this.onRemoteStreamCb = onRemoteStream;
    this.onPeerDisconnectedCb = onPeerDisconnected;
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
  }

  // Create an outgoing peer connection and send SDP Offer to target peer
  public async createOfferToPeer(targetSocketId: string, callerInfo: any): Promise<RTCPeerConnection> {
    const pc = this.getOrCreatePeerConnection(targetSocketId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('offer', {
          targetSocketId,
          sdp: offer,
          callerInfo,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error creating offer to:', targetSocketId, err);
    }

    return pc;
  }

  // Handle incoming SDP Offer and send back SDP Answer
  public async handleIncomingOffer(callerSocketId: string, sdp: RTCSe