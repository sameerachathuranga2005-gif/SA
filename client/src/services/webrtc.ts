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
  public async handleIncomingOffer(callerSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.getOrCreatePeerConnection(callerSocketId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('answer', {
          targetSocketId: callerSocketId,
          sdp: answer,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error handling offer from:', callerSocketId, err);
    }
  }

  // Handle incoming SDP Answer
  public async handleIncomingAnswer(senderSocketId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(senderSocketId);
    if (!pc) return;

    try {
      if (pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    } catch (err) {
      console.error('[WebRTC] Error setting remote description from answer:', senderSocketId, err);
    }
  }

  // Handle incoming ICE Candidate
  public async handleIncomingIceCandidate(senderSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(senderSocketId);
    if (!pc || !candidate) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] Error adding ICE candidate from:', senderSocketId, err);
    }
  }

  // Replace video track across all active peer connections (e.g., when sharing screen or switching camera)
  public async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [socketId, pc] of this.peers.entries()) {
      try {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender && newTrack) {
          await videoSender.replaceTrack(newTrack);
        } else if (!videoSender && newTrack && this.localStream) {
          pc.addTrack(newTrack, this.localStream);
        }
      } catch (err) {
        console.error('[WebRTC] Error replacing video track for peer:', socketId, err);
      }
    }
  }

  // Replace audio track across all active peer connections (e.g., when toggling Pro noise cancellation)
  public async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [socketId, pc] of this.peers.entries()) {
      try {
        const senders = pc.getSenders();
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');

        if (audioSender && newTrack) {
          await audioSender.replaceTrack(newTrack);
        } else if (!audioSender && newTrack && this.localStream) {
          pc.addTrack(newTrack, this.localStream);
        }
      } catch (err) {
        console.error('[WebRTC] Error replacing audio track for peer:', socketId, err);
      }
    }
  }

  // Close specific peer connection
  public closePeerConnection(socketId: string) {
    const pc = this.peers.get(socketId);
    if (pc) {
      pc.close();
      this.peers.delete(socketId);
      if (this.onPeerDisconnectedCb) {
        this.onPeerDisconnectedCb(socketId);
      }
    }
  }

  // Close all peer connections and release local tracks
  public closeAll() {
    for (const [, pc] of this.peers.entries()) {
      pc.close();
    }
    this.peers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  private getOrCreatePeerConnection(socketId: string): RTCPeerConnection {
    let pc = this.peers.get(socketId);
    if (pc) return pc;

    pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(socketId, pc);

    // Add local tracks to outgoing peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc!.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate generation -> send to peer via Socket.io
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('ice-candidate', {
            targetSocketId: socketId,
            candidate: event.candidate,
          });
        }
      }
    };

    // Remote Track received -> emit remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream from peer:', socketId);
      if (event.streams && event.streams[0]) {
        if (this.onRemoteStreamCb) {
          this.onRemoteStreamCb(socketId, event.streams[0]);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${socketId} connection state:`, pc!.connectionState);
      if (
        pc!.connectionState === 'disconnected' ||
        pc!.connectionState === 'failed' ||
        pc!.connectionState === 'closed'
      ) {
        this.closePeerConnection(socketId);
      }
    };

    return pc;
  }
}

export const webrtcManager = new WebRTCManager();

// Meeting Recording Manager using MediaRecorder API
export class MeetingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;
  private isRecording = false;

  public start(stream: MediaStream, meetingId: string): boolean {
    try {
      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.download(meetingId);
      };

      this.mediaRecorder.start(1000);
      this.recordingStartTime = Date.now();
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('[MeetingRecorder] Failed to start recording:', err);
      return false;
    }
  }

  public stop(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  public getDurationSeconds(): number {
    if (!this.isRecording) return 0;
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  private download(meetingId: string): void {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `OmniSync-Zoom-Meeting-${meetingId}-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}
